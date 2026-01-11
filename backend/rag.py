import os
import threading
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from urllib.parse import urlparse, parse_qs
from collections import deque

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_classic.memory import ConversationBufferMemory

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled, NoTranscriptFound, VideoUnavailable
)

# ---------------- CONFIG ----------------
VECTOR_PATH = "./data/faiss"
os.makedirs("./data", exist_ok=True)

EMBEDDINGS = HuggingFaceEmbeddings()
LLM = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.8
)

MAX_MEMORY_TURNS = 6   # bounded memory

# ---------------- FASTAPI ----------------
app = FastAPI()

VECTOR_STORE = None
MEMORY_POOL = {}   # key -> deque


# ---------------- MODELS ----------------
class IngestURL(BaseModel):
    url: str

class Ask(BaseModel):
    video_id: str
    question: str
    session_id: str | None = None


# ---------------- HELPERS ----------------
def extract_video_id(url: str) -> str:
    parsed = urlparse(url)
    if "youtube.com" in parsed.netloc:
        return parse_qs(parsed.query).get("v", [None])[0]
    if "youtu.be" in parsed.netloc:
        return parsed.path.lstrip("/")
    return None


api = YouTubeTranscriptApi()

def fetch_transcript(video_id: str):
    try:
        return api.fetch(video_id=video_id, languages=["en"])
    except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable):
        raise HTTPException(status_code=404, detail="Transcript unavailable")


def index_video(video_id: str):
    global VECTOR_STORE

    transcript = fetch_transcript(video_id)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    docs = splitter.create_documents(
        [chunk.text for chunk in transcript],
        metadatas=[{
            "video_id": video_id,
            "start": chunk.start,
            "duration": chunk.duration
        } for chunk in transcript]
    )

    if VECTOR_STORE:
        VECTOR_STORE.add_documents(docs)
    else:
        VECTOR_STORE = FAISS.from_documents(docs, EMBEDDINGS)

    VECTOR_STORE.save_local(VECTOR_PATH)


def ensure_indexed(video_id: str):
    if VECTOR_STORE:
        for doc in VECTOR_STORE.docstore._dict.values():
            if doc.metadata.get("video_id") == video_id:
                return
    threading.Thread(target=index_video, args=(video_id,), daemon=True).start()


def get_memory(session_id, video_id):
    key = f"{session_id}_{video_id}"
    if key not in MEMORY_POOL:
        MEMORY_POOL[key] = deque(maxlen=MAX_MEMORY_TURNS)
    return MEMORY_POOL[key]


# ---------------- PROMPT ----------------
PROMPT = PromptTemplate(
    template="""
You are a retrieval-grounded assistant for a YouTube video.

Rules:
- Use ONLY the provided transcript context.
- Do NOT invent facts.
- If not present, say:
  "I don't know based on this video."

Chat History:
{chat_history}

Transcript Context:
{context}

User Question:
{question}
""",
    input_variables=["context", "question", "chat_history"]
)

# ---------------- STARTUP ----------------
@app.on_event("startup")
def startup():
    global VECTOR_STORE
    if os.path.exists(VECTOR_PATH):
        VECTOR_STORE = FAISS.load_local(
            VECTOR_PATH,
            EMBEDDINGS,
            allow_dangerous_deserialization=True
        )

# ---------------- ENDPOINTS ----------------
@app.post("/ingest-url")
def ingest(payload: IngestURL):
    video_id = extract_video_id(payload.url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    ensure_indexed(video_id)
    return {"video_id": video_id, "status": "indexing"}


@app.post("/ask")
def ask(payload: Ask):
    if not VECTOR_STORE:
        raise HTTPException(status_code=400, detail="Vector store not ready")

    session_id = payload.session_id or "default"
    memory = get_memory(session_id, payload.video_id)

    retriever = VECTOR_STORE.as_retriever(
        search_kwargs={
            "k": 4,
            "filter": {"video_id": payload.video_id}
        }
    )

    def format_docs(docs):
        refs = []
        for d in docs:
            refs.append({
                "start": d.metadata["start"],
                "end": d.metadata["start"] + d.metadata["duration"],
                "text": d.page_content
            })
        return "\n\n".join(d["text"] for d in refs), refs

    docs = retriever.invoke(payload.question)
    context, references = format_docs(docs)

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
        "references": references
    }


@app.get("/health")
def health():
    return {
        "videos_indexed": len(
            {d.metadata.get("video_id") for d in VECTOR_STORE.docstore._dict.values()}
        ) if VECTOR_STORE else 0,
        "vector_count": len(VECTOR_STORE.index_to_docstore_id) if VECTOR_STORE else 0,
        "active_sessions": len(MEMORY_POOL)
    }


# import os
# from dotenv import load_dotenv
# load_dotenv()

# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# from urllib.parse import urlparse, parse_qs

# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_groq import ChatGroq
# from langchain_community.vectorstores import FAISS
# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_core.prompts import PromptTemplate
# from langchain_core.runnables import RunnableParallel, RunnablePassthrough
# from langchain_core.output_parsers import StrOutputParser
# from langchain_classic.memory import ConversationBufferMemory

# from youtube_transcript_api import YouTubeTranscriptApi
# from youtube_transcript_api._errors import (
#     TranscriptsDisabled, NoTranscriptFound, VideoUnavailable
# )

# # ---------------- CONFIG ----------------
# VECTOR_PATH = "./data/faiss"
# EMBEDDINGS = HuggingFaceEmbeddings()
# LLM = ChatGroq(
#     model="openai/gpt-oss-120b",
#     api_key=os.getenv("GROQ_API_KEY"),
#     temperature=0.8
# )

# # ---------------- FASTAPI ----------------
# app = FastAPI()
# os.makedirs("./data", exist_ok=True)

# VECTOR_STORE = None
# MEMORY_POOL = {}   # key = session_id + video_id


# # ---------------- MODELS ----------------
# class IngestURL(BaseModel):
#     url: str

# class Ask(BaseModel):
#     video_id: str
#     question: str
#     session_id: str


# # ---------------- HELPERS ----------------
# def extract_video_id(url: str) -> str:
#     parsed = urlparse(url)

#     if "youtube.com" in parsed.netloc:
#         return parse_qs(parsed.query).get("v", [None])[0]

#     if "youtu.be" in parsed.netloc:
#         return parsed.path.lstrip("/")

#     return None

# api = YouTubeTranscriptApi()
# def fetch_transcript(video_id: str) -> str:
#     try:
#         transcript = api.fetch(video_id=video_id, languages=["en"])
#         return " ".join(chunk.text for chunk in transcript)
#     except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable):
#         raise HTTPException(status_code=404, detail="Transcript unavailable")


# def load_or_create_vectorstore(video_id: str):
#     global VECTOR_STORE

#     if VECTOR_STORE:
#         for doc in VECTOR_STORE.docstore._dict.values():
#             if doc.metadata.get("video_id") == video_id:
#                 return

#     transcript = fetch_transcript(video_id)

#     splitter = RecursiveCharacterTextSplitter(
#         chunk_size=1000,
#         chunk_overlap=200
#     )

#     docs = splitter.create_documents(
#         [transcript],
#         metadatas=[{"video_id": video_id}]
#     )

#     if VECTOR_STORE:
#         VECTOR_STORE.add_documents(docs)
#     else:
#         VECTOR_STORE = FAISS.from_documents(docs, EMBEDDINGS)

#     VECTOR_STORE.save_local(VECTOR_PATH)


# def get_memory(session_id, video_id):
#     key = f"{session_id}_{video_id}"
#     if key not in MEMORY_POOL:
#         MEMORY_POOL[key] = ConversationBufferMemory(
#             memory_key="chat_history",
#             return_messages=True
#         )
#     return MEMORY_POOL[key]


# # ---------------- PROMPT ----------------
# PROMPT = PromptTemplate(
#     template="""
# You are a retrieval-grounded assistant for a YouTube video.

# Rules:
# - Use ONLY the provided transcript context.
# - Use chat history only to maintain continuity, not as a knowledge source.
# - Do NOT invent facts, examples, or explanations.
# - If the answer is not present in the transcript, reply exactly:
#   "I don't know based on this video."

# - Be concise, structured, and technical when appropriate.
# - If multiple points exist, use bullet points.
# - If the question asks for a summary, compress faithfully without adding interpretation.

# Chat History:
# {chat_history}

# Transcript Context:
# {context}

# User Question:
# {question}
# """,
#     input_variables=["context", "question", "chat_history"]
# )

# # ---------------- ENDPOINTS ----------------
# @app.on_event("startup")
# def startup():
#     global VECTOR_STORE
#     if os.path.exists(VECTOR_PATH):
#         VECTOR_STORE = FAISS.load_local(
#             VECTOR_PATH,
#             EMBEDDINGS,
#             allow_dangerous_deserialization=True
#         )


# @app.post("/ingest-url")
# def ingest(payload: IngestURL):
#     video_id = extract_video_id(payload.url)
#     if not video_id:
#         raise HTTPException(status_code=400, detail="Invalid YouTube URL")

#     load_or_create_vectorstore(video_id)
#     return {"video_id": video_id}


# @app.post("/ask")
# def ask(payload: Ask):
#     if not VECTOR_STORE:
#         raise HTTPException(status_code=400, detail="Vector store not ready")

#     retriever = VECTOR_STORE.as_retriever(
#         search_kwargs={"k": 4}
#     )

#     memory = get_memory(payload.session_id, payload.video_id)

#     chain = (
#         RunnableParallel({
#             "context": retriever | (lambda d: "\n\n".join(x.page_content for x in d)),
#             "question": RunnablePassthrough(),
#             "chat_history": lambda _: memory.load_memory_variables({})["chat_history"]
#         })
#         | PROMPT
#         | LLM
#         | StrOutputParser()
#     )

#     answer = chain.invoke(payload.question)

#     memory.save_context(
#         {"input": payload.question},
#         {"output": answer}
#     )

#     return {"answer": answer}
