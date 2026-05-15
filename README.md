# ⚡ Homey AI: Intelligent Conveyancing Assistant

Homey AI is a production-grade prototype designed to revolutionize UK conveyancing by automating the analysis of complex property documents. Using **Gemini 2.5 Flash**, **RAG (Retrieval-Augmented Generation)**, and **ChromaDB**, it extracts key data, flags legal risks, and provides an interactive chat interface for real-time document querying.

![Homey AI Banner](https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200)

## 🚀 Core Features

- **Multi-Format Extraction:** Seamlessly handles PDF, DOCX, and TXT documents using PyMuPDF and Python-Docx.
- **AI-Powered Analysis:** Performs three-stage parallel analysis:
    - 📝 **Plain-English Summary:** Translates legalese into clear, actionable insights.
    - 🔍 **Structured Extraction:** Automatically identifies Title Numbers, Tenure, Purchase Price, and Parties.
    - 🚩 **Risk Assessment:** Flags high-risk clauses (covenants, restrictions, easements) with severity grading.
- **RAG-Driven Chat:** Ask complex questions about your documents (e.g., *"Are there any restrictive covenants?"*) with responses grounded in the document text.
- **Modern UX:** Built with React 19, Tailwind CSS v4, and Shadcn/UI for a premium, dark-mode-first aesthetic.

## 🛠 Tech Stack

### Frontend
- **Framework:** React 19 + Vite + TypeScript
- **Styling:** Tailwind CSS v4 + Framer Motion (Animations)
- **State Management:** Zustand
- **UI Components:** Shadcn/UI
- **Data Fetching:** TanStack Query + Axios

### Backend
- **Framework:** FastAPI (Python 3.14)
- **AI Engine:** Google Gemini 2.5 Flash
- **Vector Database:** ChromaDB (In-memory)
- **Embeddings:** `gemini-embedding-001`
- **Orchestration:** LangChain (Text Splitters)

## 📦 Project Structure

```text
├── frontend/             # Vite + React application
│   ├── src/components/   # Modular UI components
│   ├── src/stores/       # Zustand state management
│   └── src/hooks/        # Custom React hooks (Upload/Chat)
├── backend/              # FastAPI application
│   ├── services/         # Core AI logic (Extractor, Embedder, RAG)
│   ├── routers/          # API endpoints
│   └── models/           # Pydantic schemas
└── mock-documents/       # Sample files for testing
```

## ⚙️ Local Setup

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
Create a `.env` file in the `backend` folder:
```env
GEMINI_API_KEY=your_key_here
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```
Start the server:
```bash
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Deployment

- **Frontend:** Deploy to **Vercel** (Set `VITE_API_URL` environment variable).
- **Backend:** Deploy to **Render** or **Railway** (Set `GEMINI_API_KEY` and `ALLOWED_ORIGINS`).

---

### Developed for Homey Technology
**Prototype by Goutam Chandnani**
