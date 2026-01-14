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

load_dotenv()

DATA_DIR = "./data"
VECTOR_DIR = os.path.join(DATA_DIR, "faiss")
os.makedirs(VECTOR_DIR, exist_ok=True)

EMBEDDINGS = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
LLM = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=1,
    max_tokens=2048
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
INDEX_STATUS = {}           # video_id -> {"status": str, "chunk_count": int}
LOCKS = {}                  # video_id -> Lock
MEMORY_POOL = {}            # session_video -> deque

# Model Schemas
class IngestURL(BaseModel):
    url: str

class Ask(BaseModel):
    video_id: str
    question: str
    session_id: str | None = None

# Helpers
def extract_video_id(url: str) -> str | None:
    parsed = urlparse(url)
    if "youtube.com" in parsed.netloc:
        return parse_qs(parsed.query).get("v", [None])[0]
    if "youtu.be" in parsed.netloc:
        return parsed.path.lstrip("/")
    return None


def fetch_transcript(video_id: str):
    try:
        return YouTubeTranscriptApi().fetch(video_id, languages=["en", "hi"])
    except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable):
        raise HTTPException(404, "Transcript unavailable")


def get_store_path(video_id: str):
    return os.path.join(VECTOR_DIR, video_id)


def get_memory(session_id: str, video_id: str):
    key = f"{session_id}_{video_id}"
    if key not in MEMORY_POOL:
        MEMORY_POOL[key] = deque(maxlen=MAX_MEMORY_TURNS)
    return MEMORY_POOL[key]

def is_basic_question(question: str) -> bool:
    basic_keywords = ["hi", "hello", "hey", "how are you", "what's up", "good morning", "good evening", "thanks", "thank you", "bye", "goodbye", "see you", "who are you", "what can you do"]
    question_lower = question.lower().strip()
    return any(keyword in question_lower for keyword in basic_keywords) or len(question.split()) < 3

# ---------------- INDEXING ----------------
def index_video(video_id: str):
    LOCKS.setdefault(video_id, threading.Lock())

    with LOCKS[video_id]:
        if INDEX_STATUS.get(video_id, {}).get("status") == "indexed":
            return

        INDEX_STATUS[video_id] = {"status": "indexing", "chunk_count": 0}

        try:
            transcript = fetch_transcript(video_id)

            # Group captions into chunks of about 10 captions each
            group_size = 10
            grouped_texts = []
            grouped_metadatas = []
            for i in range(0, len(transcript), group_size):
                group = transcript[i:i+group_size]
                text = " ".join(c.text for c in group)
                metadata = {
                    "video_id": video_id,
                    "start": group[0].start,
                    "duration": sum(c.duration for c in group)
                }
                grouped_texts.append(text)
                grouped_metadatas.append(metadata)

            splitter = RecursiveCharacterTextSplitter(
                chunk_size=2000,
                chunk_overlap=300
            )

            docs = []
            for text, meta in zip(grouped_texts, grouped_metadatas):
                doc = splitter.create_documents([text], metadatas=[meta])
                docs.extend(doc)

            INDEX_STATUS[video_id] = {"status": "indexing", "chunk_count": len(docs)}

            store = FAISS.from_documents(docs, EMBEDDINGS)
            store.save_local(get_store_path(video_id))

            VECTOR_STORES[video_id] = store
            INDEX_STATUS[video_id] = {"status": "indexed", "chunk_count": len(docs)}

        except Exception:
            INDEX_STATUS[video_id] = {"status": "failed", "chunk_count": 0}


# PROMPT TEMPLATE

PROMPT = PromptTemplate(
    template="""
SYSTEM ROLE:
You are a **YouTube video–grounded assistant**.
Your primary job is to answer questions using the provided transcript context.
You may also respond politely to basic conversational messages (e.g., greetings).

CORE KNOWLEDGE RULES:
- Use the provided transcript context as the main source of truth.
- Do NOT invent facts, names, or explanations.
- Do NOT fabricate timestamps or details not present.
- If the transcript does not contain the answer, say:
"I don't know based on this video."

REASONABLE FLEXIBILITY:
- If the user says "hi", "hello", or similar greetings, respond briefly and politely.
- If the user asks about your role or capability, explain it simply (no technical jargon).
- Do NOT answer factual or technical questions without transcript support.
- Light conversational responses are allowed, but factual answers must stay grounded.

ANSWERING BEHAVIOR:
- Be clear, helpful, and readable.
- When answering from the transcript:
  - Explain only what is explicitly stated.
  - Summarize only what appears in the content.
  - If a "why" or "how" is not explained in the transcript, say you don't know.
- If multiple viewpoints exist in the transcript, present them neutrally.
- Preserve technical accuracy when applicable.

CHAT HISTORY USAGE:
- Chat history is for conversational continuity only.
- Do NOT use chat history as a factual source.
- If chat history conflicts with transcript, transcript always takes priority.

TIMESTAMPS:
- Use timestamps only if they are present in the transcript context.
- Never invent timestamps.
- If no timestamps are given, do not mention time.

TONE & STYLE:
- Natural, calm, and professional.
- No emojis.
- No hype.
- No unnecessary apologies.
- No speculation.
- Short paragraphs or bullet points when useful.

FAILURE MODE:
If the transcript context does NOT contain the information required to answer a factual question, respond exactly with:
"I don't know based on this video."

--------------------
CHAT HISTORY:
{chat_history}

--------------------
TRANSCRIPT CONTEXT:
{context}

--------------------
USER QUESTION:
{question}

--------------------
FINAL ANSWER:
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
            INDEX_STATUS[vid] = {"status": "indexed", "chunk_count": 0}
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
        # Start indexing if not indexed
        if payload.video_id not in INDEX_STATUS or INDEX_STATUS[payload.video_id].get("status") != "indexing":
            threading.Thread(
                target=index_video,
                args=(payload.video_id,),
                daemon=True
            ).start()
        return {
            "answer": "Indexing video, please wait a moment and ask again.",
            "references": []
        }

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

    # For basic questions, do not include timestamps
    if is_basic_question(payload.question):
        refs = []

    return {
        "answer": answer,
        "references": refs
    }


@app.get("/status/{video_id}")
def status(video_id: str):
    return INDEX_STATUS.get(video_id, {"status": "not_indexed", "chunk_count": 0})


@app.get("/health")
def health():
    return {
        "videos": len(VECTOR_STORES),
        "sessions": len(MEMORY_POOL)
    }


@app.delete("/delete-session/{video_id}")
def delete_session(video_id: str):
    if video_id in VECTOR_STORES:
        del VECTOR_STORES[video_id]
    if video_id in INDEX_STATUS:
        del INDEX_STATUS[video_id]
    if video_id in LOCKS:
        del LOCKS[video_id]
    if video_id in MEMORY_POOL:
        del MEMORY_POOL[video_id]
    
    # Delete the FAISS index file
    store_path = get_store_path(video_id)
    if os.path.exists(store_path):
        import shutil
        shutil.rmtree(store_path)
    
    return {"message": f"Session {video_id} deleted"}
