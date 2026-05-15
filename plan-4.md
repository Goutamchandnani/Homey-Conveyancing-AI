# Plan — Homey AI Conveyancing Assistant
# Target: Live URL in 2-3 days

---

## Phase 1 — Backend Core (Day 1 Morning)

### Step 1.1 — Project Setup
- [ ] Create `homey-conveyancing-ai/` repo
- [ ] Init backend: `mkdir backend && cd backend`
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Install dependencies (see requirements.txt below)
- [ ] Create `.env` from `.env.example`
- [ ] Verify Gemini API key works with a hello-world call

### Step 1.2 — PDF/DOCX Extractor (`services/extractor.py`)
- [ ] Extract full text from PDF using PyMuPDF
- [ ] Extract full text from DOCX using python-docx
- [ ] Return: `{ text: str, page_count: int, filename: str }`
- [ ] Handle corrupt/empty file errors gracefully

### Step 1.3 — Prompts (`prompts/`)
Write and test all 4 prompts before wiring them up:
- [ ] `summary_prompt.py` — returns 3-4 sentence plain English summary for a UK home buyer
- [ ] `extraction_prompt.py` — returns strict JSON with all key fields (parties, price, dates, tenure, title number)
- [ ] `flags_prompt.py` — returns JSON array of risk flags, each with severity (red/amber/green), title, description, page reference
- [ ] `chat_prompt.py` — RAG chat system prompt that instructs the model to answer only from provided context and cite chunk sources

**Test each prompt manually in a notebook before integrating.**

### Step 1.4 — Analyser Service (`services/analyser.py`)
- [ ] Run summary, extraction, and flags prompts in parallel using `asyncio.gather()`
- [ ] Parse and validate JSON responses from extraction + flags
- [ ] Return unified `AnalysisResult` Pydantic model
- [ ] Add retry logic (1 retry) for malformed JSON from Gemini

### Step 1.5 — Embedder Service (`services/embedder.py`)
- [ ] Split document text into chunks (800 tokens, 100 overlap) using LangChain `RecursiveCharacterTextSplitter`
- [ ] Embed chunks using Gemini embedding model
- [ ] Store in ChromaDB in-memory collection keyed by `session_id`
- [ ] Return chunk count for logging

### Step 1.6 — Upload Router (`routers/upload.py`)
- [ ] `POST /upload` accepts multipart file
- [ ] Validate file type (PDF/DOCX only) and size (max 10MB)
- [ ] Generate `session_id` (UUID4)
- [ ] Call extractor → embedder → analyser in sequence
- [ ] Return full `UploadResponse` schema
- [ ] Test with a real UK Land Registry title register PDF

---

## Phase 2 — RAG Chat (Day 1 Afternoon)

### Step 2.1 — RAG Service (`services/rag.py`)
- [ ] Embed incoming user query using Gemini embeddings
- [ ] Query ChromaDB for top-5 most similar chunks by `session_id`
- [ ] Build context string from retrieved chunks with page references
- [ ] Call Gemini with chat prompt + context + conversation history
- [ ] Stream response back

### Step 2.2 — Chat Router (`routers/chat.py`)
- [ ] `POST /chat` accepts `session_id`, `message`, `history`
- [ ] Validate `session_id` exists in ChromaDB (return 404 if not)
- [ ] Call RAG service
- [ ] Return `StreamingResponse` using `text/event-stream`

### Step 2.3 — FastAPI App (`main.py`)
- [ ] Register upload + chat routers
- [ ] Configure CORS for frontend origin
- [ ] Add `/health` endpoint
- [ ] Add global error handler
- [ ] Run locally: `uvicorn main:app --reload`

### Step 2.4 — Backend Integration Test
- [ ] Upload a real conveyancing PDF via curl/Postman
- [ ] Verify summary, extracted_data, risk_flags all return correctly
- [ ] Ask 3 questions via `/chat` and verify RAG answers are grounded in the doc
- [ ] Fix any prompt issues

---

## Phase 3 — Frontend (Day 2)

### Step 3.1 — Project Setup
- [ ] `npm create vite@latest frontend -- --template react-ts`
- [ ] Install: `tailwindcss`, `shadcn/ui`, `framer-motion`, `@tanstack/react-query`, `zustand`, `axios`
- [ ] Init shadcn: `npx shadcn-ui@latest init`
- [ ] Set up Tailwind config with Homey-inspired colour palette (clean, professional, property-sector feel)
- [ ] Set up React Query provider in `main.tsx`

### Step 3.2 — Zustand Stores
- [ ] `documentStore.ts`: `{ sessionId, filename, status: 'idle'|'uploading'|'analysing'|'ready'|'error', analysisResult }`
- [ ] `chatStore.ts`: `{ messages: Message[], isStreaming }`

### Step 3.3 — API Client (`lib/api.ts`)
- [ ] `uploadDocument(file: File)` → calls `POST /upload`, returns `AnalysisResult`
- [ ] `sendMessage(sessionId, message, history)` → calls `POST /chat`, handles SSE stream

### Step 3.4 — UploadZone Component
- [ ] Drag-and-drop zone (use `react-dropzone` or native HTML5)
- [ ] Accept PDF and DOCX only
- [ ] Show file name + size on selection
- [ ] Animated upload progress state
- [ ] On success → update Zustand store → transition to results view

### Step 3.5 — SummaryPanel Component
- [ ] Card with Homey logo/branding area at top
- [ ] Summary text with smooth fade-in animation
- [ ] Document metadata: filename, page count, analysis timestamp

### Step 3.6 — ExtractedData Component
- [ ] Grid of data cards: Buyer, Seller, Address, Price, Completion Date, Tenure, Title Number, Solicitors
- [ ] Each card has icon + label + value
- [ ] "Not found" graceful fallback for missing fields
- [ ] Staggered entry animation via Framer Motion

### Step 3.7 — RiskFlags Component
- [ ] List of flags sorted: red → amber → green
- [ ] Each flag: coloured severity badge + title + description + page reference chip
- [ ] Expandable description (collapsed by default)
- [ ] Empty state if no flags found ("No issues detected")

### Step 3.8 — ChatInterface Component
- [ ] Message thread (user + assistant bubbles)
- [ ] Streaming text animation for assistant responses
- [ ] Input bar with send button (Enter to send)
- [ ] Suggested starter questions: "What is the completion date?", "Are there any restrictive covenants?", "Who are the solicitors?"
- [ ] Disabled state until document is analysed
- [ ] Auto-scroll to latest message

### Step 3.9 — App Layout (`App.tsx`)
- [ ] Two views: Upload View → Results View
- [ ] Results view: left panel (Summary + ExtractedData + RiskFlags) + right panel (Chat)
- [ ] Responsive: stacked on mobile, side-by-side on desktop
- [ ] Homey branding: use their actual logo/colours from homey.co.uk
- [ ] Page title: "Homey AI — Conveyancing Assistant"

---

## Phase 4 — Polish & Deploy (Day 3)

### Step 4.1 — UI Polish
- [ ] Loading skeleton states for all panels during analysis
- [ ] Error states with clear messaging ("Couldn't extract text — is this a scanned PDF?")
- [ ] Smooth page transitions (Framer Motion layout animations)
- [ ] Mobile responsiveness pass
- [ ] Favicon + meta tags

### Step 4.2 — Demo Data
- [ ] Source or create a realistic-looking (non-sensitive) sample conveyancing document
- [ ] Add a "Try with sample document" button so Sayinthen can test instantly without having a PDF
- [ ] This is critical — reduce friction to zero for the demo

### Step 4.3 — Deploy Backend → Render
- [ ] Create `render.yaml` or configure via dashboard
- [ ] Set environment variables in Render dashboard
- [ ] Verify `/health` endpoint returns 200
- [ ] Test upload + chat against live backend URL

### Step 4.4 — Deploy Frontend → Netlify
- [ ] Set `VITE_API_URL` env variable to Render backend URL
- [ ] `netlify deploy --prod`
- [ ] Full end-to-end test on live URL
- [ ] Test on mobile

### Step 4.5 — Final Checks
- [ ] Upload a real document, verify all 3 panels populate correctly
- [ ] Ask 5 different questions via chat
- [ ] Check cold start time on Render (free tier spins down — add a note or ping endpoint on load)
- [ ] Screenshot/screen record for LinkedIn message

---

## Message to Send with the Live URL

> "Sayinthen — I built something for you.
>
> Took Homey's conveyancing workflow and turned it into a working AI document assistant. Upload any title register or contract and it extracts the key data, flags risks, and lets you ask questions about it in plain English.
>
> Live here: [URL]
>
> Built in [X] days. Happy to walk you through it."

---

## Requirements (`backend/requirements.txt`)

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
python-multipart==0.0.9
pydantic==2.7.0
google-generativeai==0.7.2
langchain==0.2.0
langchain-google-genai==1.0.3
chromadb==0.5.0
pymupdf==1.24.0
python-docx==1.1.2
python-dotenv==1.0.1
httpx==0.27.0
```
