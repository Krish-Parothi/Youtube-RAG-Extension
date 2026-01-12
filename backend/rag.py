import os
import threading
from dotenv import load_dotenv
from collections import deque
from urllib.parse import urlparse, parse_qs

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled, NoTranscriptFound, VideoUnavailable
)

# ---------------- INIT ----------------
load_dotenv()

DATA_DIR = "./data"
VECTOR_DIR = os.path.join(DATA_DIR, "faiss")
os.makedirs(VECTOR_DIR, exist_ok=True)

EMBEDDINGS = HuggingFaceEmbeddings()
LLM = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.6
)

MAX_MEMORY_TURNS = 6

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_headers=["*"],
    allow_methods=["*"]
)

# ---------------- STATE ----------------
VECTOR_STORES = {}          # video_id -> FAISS
INDEX_STATUS = {}           # video_id -> indexing | indexed | failed
LOCKS = {}                  # video_id -> Lock
MEMORY_POOL = {}            # session_video -> deque

# ---------------- MODELS ----------------
class IngestURL(BaseModel):
    url: str

class Ask(BaseModel):
    video_id: str
    question: str
    session_id: str | None = None

# ---------------- HELPERS ----------------
def extract_video_id(url: str) -> str | None:
    parsed = urlparse(url)
    if "youtube.com" in parsed.netloc:
        return parse_qs(parsed.query).get("v", [None])[0]
    if "youtu.be" in parsed.netloc:
        return parsed.path.lstrip("/")
    return None


def fetch_transcript(video_id: str):
    try:
        return YouTubeTranscriptApi().fetch(video_id, languages=["en"])
    except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable):
        raise HTTPException(404, "Transcript unavailable")


def get_store_path(video_id: str):
    return os.path.join(VECTOR_DIR, video_id)


def get_memory(session_id: str, video_id: str):
    key = f"{session_id}_{video_id}"
    if key not in MEMORY_POOL:
        MEMORY_POOL[key] = deque(maxlen=MAX_MEMORY_TURNS)
    return MEMORY_POOL[key]

# ---------------- INDEXING ----------------
def index_video(video_id: str):
    LOCKS.setdefault(video_id, threading.Lock())

    with LOCKS[video_id]:
        if INDEX_STATUS.get(video_id) == "indexed":
            return

        INDEX_STATUS[video_id] = "indexing"

        try:
            transcript = fetch_transcript(video_id)

            splitter = RecursiveCharacterTextSplitter(
                chunk_size=800,
                chunk_overlap=150
            )

            docs = splitter.create_documents(
                [c.text for c in transcript],
                metadatas=[{
                    "video_id": video_id,
                    "start": c.start,
                    "duration": c.duration
                } for c in transcript]
            )

            store = FAISS.from_documents(docs, EMBEDDINGS)
            store.save_local(get_store_path(video_id))

            VECTOR_STORES[video_id] = store
            INDEX_STATUS[video_id] = "indexed"

        except Exception:
            INDEX_STATUS[video_id] = "failed"

# ---------------- PROMPT ----------------
PROMPT = PromptTemplate(
    template="""
You are a retrieval-grounded assistant for a YouTube video.

Rules:
- Use ONLY the provided transcript context.
- Do NOT infer or hallucinate.
- If answer is absent, say:
"I don't know based on this video."

Chat History:
{chat_history}

Transcript Context:
{context}

Question:
{question}
""",
    input_variables=["context", "question", "chat_history"]
)

# ---------------- STARTUP ----------------
@app.on_event("startup")
def load_existing_indexes():
    for vid in os.listdir(VECTOR_DIR):
        path = get_store_path(vid)
        try:
            VECTOR_STORES[vid] = FAISS.load_local(
                path,
                EMBEDDINGS,
                allow_dangerous_deserialization=True
            )
            INDEX_STATUS[vid] = "indexed"
        except:
            pass

# ---------------- ROUTES ----------------
@app.post("/ingest-url")
def ingest(payload: IngestURL):
    video_id = extract_video_id(payload.url)
    if not video_id:
        raise HTTPException(400, "Invalid YouTube URL")

    if video_id not in VECTOR_STORES:
        threading.Thread(
            target=index_video,
            args=(video_id,),
            daemon=True
        ).start()

    return {"video_id": video_id, "status": "indexing"}


@app.post("/ask")
def ask(payload: Ask):
    if payload.video_id not in VECTOR_STORES:
        raise HTTPException(400, "Video not indexed yet")

    store = VECTOR_STORES[payload.video_id]
    memory = get_memory(payload.session_id or "default", payload.video_id)

    retriever = store.as_retriever(search_kwargs={"k": 6})
    docs = retriever.invoke(payload.question)

    context = "\n\n".join(d.page_content for d in docs)
    refs = [{
        "start": int(d.metadata["start"]),
        "duration": d.metadata["duration"]
    } for d in docs]

    chain = (
        RunnableParallel({
            "context": lambda _: context,
            "question": RunnablePassthrough(),
            "chat_history": lambda _: "\n".join(memory)
        })
        | PROMPT
        | LLM
        | StrOutputParser()
    )

    answer = chain.invoke(payload.question)
    memory.append(f"Q: {payload.question}\nA: {answer}")

    return {
        "answer": answer,
        "references": refs
    }


@app.get("/status/{video_id}")
def status(video_id: str):
    return {
        "video_id": video_id,
        "status": INDEX_STATUS.get(video_id, "not_indexed")
    }


@app.get("/health")
def health():
    return {
        "videos": len(VECTOR_STORES),
        "sessions": len(MEMORY_POOL)
    }
