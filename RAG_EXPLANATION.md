# YouTube RAG Extension - How It Works

## Complete RAG Pipeline (Fully Automated)

### 1️⃣ VIDEO INDEXING (Automatic when you open a YouTube video)
```
YouTube Video URL 
    ↓
content.js detects URL change
    ↓
background.js sends to /ingest-url
    ↓
BACKEND: extract_video_id() → get video_id
    ↓
BACKEND: fetch_transcript() → YouTube Transcript API
    ↓
BACKEND: RecursiveCharacterTextSplitter → chunks text (1000 chars, 200 overlap)
    ↓
BACKEND: HuggingFaceEmbeddings → creates vector embeddings for each chunk
    ↓
BACKEND: FAISS.from_documents() → stores vectors in FAISS index
    ↓
✅ Video indexed and ready to query
```

### 2️⃣ QUESTION ANSWERING (When you ask a question)
```
You type: "What is the main topic?"
    ↓
Frontend checks /status/{video_id} → is it indexed?
    ↓
YES → sends question to backend /ask endpoint
    ↓
BACKEND: retriever.invoke(question) → SEMANTIC SEARCH
    └─ Compares question embedding with all chunk embeddings
    └─ Returns top 10 most similar chunks (automatic scoring)
    ↓
BACKEND: manual filter by video_id (removes cross-video contamination)
    ↓
BACKEND: format_docs() → combines retrieved chunks as context
    ↓
BACKEND: LLM (ChatGroq) receives:
    - System prompt: "Only use provided context"
    - Retrieved chunks as context
    - User question
    ↓
BACKEND: LLM generates answer grounded in context
    ↓
BACKEND: Extract timestamps from matched chunks
    ↓
Response sent to frontend with answer + timestamps
    ↓
✅ You see answer with clickable timestamp chips
```

## Why It Might Seem Like "Not Working"

### Common Issues:

1. **Video has NO CAPTIONS**
   - YouTube Transcript API needs captions
   - Solution: Only use videos with English captions

2. **Asking BEFORE indexing is complete**
   - Indexing takes 5-15 seconds depending on transcript length
   - Solution: Wait for status to say "indexed" or try again after 10 seconds

3. **Question too vague**
   - Semantic search needs good keyword overlap
   - Bad: "Tell me everything"
   - Good: "What are the main points about X?"

4. **LLM saying "I don't know"**
   - Retrieved chunks don't contain the answer
   - Check: Is the question about something covered in the video?
   - Debugging: Check backend logs to see what chunks were retrieved

## What's Automated vs Manual

### ✅ FULLY AUTOMATED (RAG):
- Transcript fetching
- Text chunking
- Embedding creation
- Vector storage
- Semantic search ranking
- LLM grounding in context

### 📋 MANUAL (Intentional Design):
- Video ID filtering (prevents cross-video contamination)
- Status checking before asking (better UX)
- These are NOT part of RAG, they're wrappers around it

## How to Verify RAG is Working

1. **Look at backend logs** when you ask a question:
   ```
   🔍 SEMANTIC SEARCH RESULTS for: 'your question'
   Total docs retrieved: 10
   Docs matching video_id: 4
   [1] @120s - chunk text here...
   [2] @240s - chunk text here...
   
   📝 CONTEXT SENT TO LLM (2500 chars)
   
   🤖 LLM RESPONSE:
   [Full answer from LLM]
   ```

2. **Backend should show**:
   - ✅ Semantic search finding relevant chunks
   - ✅ LLM getting context
   - ✅ Real answer (not "I don't know")

3. **Frontend should show**:
   - Your question (blue bubble)
   - Answer (gray bubble with timestamps)

## Bottom Line

**The RAG is FULLY WORKING**. You have:
- ✅ Vector embeddings
- ✅ Semantic search
- ✅ Context retrieval
- ✅ LLM grounding

If you're not getting good answers, it's likely one of:
1. Video has no captions
2. Haven't waited for indexing
3. Question is too vague
4. Answer isn't in the video

Restart your backend and check the logs. They'll show you EXACTLY what's happening.
