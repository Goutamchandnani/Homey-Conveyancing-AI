# Architecture — Homey AI Conveyancing Assistant

## Project Overview

A focused, production-grade AI tool that lets estate agents, conveyancers, and home buyers upload a UK conveyancing document (title register, contract, search result) and instantly get:
- A plain-English summary
- Key data extraction (dates, parties, price, conditions)
- Risk flags and red flags
- A chat interface to ask follow-up questions

Built to demo directly to the Homey Technology founder as a proof-of-capability prototype.

---

## Tech Stack

### Frontend
- **React 19 + Vite** — fast dev experience, matches Goutam's current stack
- **TypeScript** — type safety, production credibility
- **Tailwind CSS** — utility-first styling
- **shadcn/ui** — component library (already used at Design Factory)
- **Framer Motion** — polished animations and transitions
- **React Query (TanStack Query)** — async state, loading/error handling
- **Zustand** — lightweight global state (document store, chat history)

### Backend
- **FastAPI (Python)** — async, lightweight, matches Goutam's existing projects
- **Gemini 2.5 Flash** — primary LLM (already used in JurisAI, MEP Tender, PaperCast)
- **LangChain** — document chunking, RAG pipeline (already used in JurisAI)
- **ChromaDB** — vector store for semantic search over document chunks
- **PyMuPDF (fitz)** — PDF text extraction
- **python-docx** — DOCX support
- **Uvicorn** — ASGI server

### Deployment
- **Frontend** → Netlify (free, instant, matches Goutam's existing deploys)
- **Backend** → Render (free tier, matches MEP Tender deploy pattern)
- **ChromaDB** → in-memory per session (no persistence needed for demo)

---

## Folder Structure

```
homey-conveyancing-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── UploadZone.tsx       # drag-and-drop PDF upload
│   │   │   ├── SummaryPanel.tsx     # plain-English summary card
│   │   │   ├── ExtractedData.tsx    # key fields: parties, dates, price
│   │   │   ├── RiskFlags.tsx        # red/amber/green flag list
│   │   │   ├── ChatInterface.tsx    # ask questions about the doc
│   │   │   └── LoadingStates.tsx    # skeleton loaders, progress
│   │   ├── stores/
│   │   │   ├── documentStore.ts     # Zustand: uploaded doc state
│   │   │   └── chatStore.ts         # Zustand: chat history
│   │   ├── hooks/
│   │   │   ├── useDocumentUpload.ts
│   │   │   └── useChat.ts
│   │   ├── lib/
│   │   │   └── api.ts               # API client (axios/fetch wrappers)
│   │   ├── types/
│   │   │   └── index.ts             # shared TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
├── backend/
│   ├── main.py                      # FastAPI app entry point
│   ├── routers/
│   │   ├── upload.py                # POST /upload — ingest + analyse doc
│   │   └── chat.py                  # POST /chat — RAG Q&A
│   ├── services/
│   │   ├── extractor.py             # PDF/DOCX text extraction
│   │   ├── analyser.py              # Gemini: summary, flags, key data
│   │   ├── embedder.py              # LangChain chunking + ChromaDB
│   │   └── rag.py                   # RAG retrieval + answer generation
│   ├── models/
│   │   └── schemas.py               # Pydantic request/response models
│   ├── prompts/
│   │   ├── summary_prompt.py        # system prompt for summary
│   │   ├── extraction_prompt.py     # system prompt for data extraction
│   │   ├── flags_prompt.py          # system prompt for risk flags
│   │   └── chat_prompt.py           # system prompt for RAG chat
│   ├── requirements.txt
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## Data Flow

```
User uploads PDF/DOCX
        │
        ▼
FastAPI /upload endpoint
        │
        ├── extractor.py      → raw text from document
        │
        ├── embedder.py       → chunk text → embed → store in ChromaDB
        │
        └── analyser.py       → 3 parallel Gemini calls:
                                  1. Plain-English summary
                                  2. Key data extraction (JSON)
                                  3. Risk flags (JSON array)
        │
        ▼
Frontend renders:
  - SummaryPanel
  - ExtractedData cards
  - RiskFlags list
  - ChatInterface unlocked

User types question
        │
        ▼
FastAPI /chat endpoint
        │
        ├── rag.py            → embed query → ChromaDB similarity search
        │                        → retrieve top-k chunks
        └── Gemini            → answer with citations (chunk + page ref)
        │
        ▼
ChatInterface streams response
```

---

## API Endpoints

### POST `/upload`
- **Input:** `multipart/form-data` with `file` (PDF or DOCX)
- **Output:**
```json
{
  "session_id": "uuid",
  "summary": "string",
  "extracted_data": {
    "parties": { "buyer": "string", "seller": "string" },
    "property_address": "string",
    "purchase_price": "string",
    "completion_date": "string",
    "tenure": "Freehold | Leasehold",
    "title_number": "string",
    "solicitors": { "buyer": "string", "seller": "string" }
  },
  "risk_flags": [
    {
      "severity": "red | amber | green",
      "title": "string",
      "description": "string",
      "page_reference": "number"
    }
  ]
}
```

### POST `/chat`
- **Input:**
```json
{
  "session_id": "uuid",
  "message": "string",
  "history": [{ "role": "user | assistant", "content": "string" }]
}
```
- **Output:** streamed text response with source citations

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Gemini 2.5 Flash | Already battle-tested in Goutam's projects; fast, cheap, accurate on legal text |
| In-memory ChromaDB | No DB setup needed for demo; session scoped |
| 3 parallel Gemini calls on upload | Faster UX than sequential; summary + extraction + flags all at once |
| Streaming chat responses | Feels alive, professional; matches modern AI UX expectations |
| Session-based architecture | Stateless backend; each upload gets a UUID; scales naturally |
| Netlify + Render | Zero cost, matches existing portfolio deploy pattern |

---

## Environment Variables

```env
# backend/.env
GEMINI_API_KEY=your_key_here
ALLOWED_ORIGINS=http://localhost:5173,https://your-netlify-url.netlify.app
MAX_FILE_SIZE_MB=10
```
