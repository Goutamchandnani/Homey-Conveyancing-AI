# AI Rules — Homey AI Conveyancing Assistant
# For use with Antigravity IDE (or any AI coding assistant e.g. Cursor)

---

## Project Identity

You are helping build a production-grade AI prototype called **Homey AI Conveyancing Assistant**.
This is being built by Goutam Chandnani as a proof-of-capability demo for Homey Technology Ltd,
a UK proptech startup that digitises the conveyancing process.

The goal: impress a startup founder enough to get hired. Every line of code must reflect
a senior engineer's standards — clean, typed, well-structured, production-ready.

---

## Stack Rules (never deviate from these)

### Frontend
- React 19 + Vite + TypeScript — always use `.tsx` for components, `.ts` for logic
- Tailwind CSS for all styling — no inline styles, no CSS modules, no styled-components
- shadcn/ui for all base UI components (Button, Card, Badge, Input, ScrollArea, Skeleton, Separator)
- Framer Motion for all animations — no CSS keyframe animations
- Zustand for global state — no Redux, no Context API for shared state
- TanStack React Query for all async data fetching — no raw useEffect for API calls
- axios for HTTP requests in `lib/api.ts` — no raw fetch in components

### Backend
- FastAPI + Python 3.11+ — always use async/await, never synchronous route handlers
- Pydantic v2 for all request/response models — define in `models/schemas.py`
- Gemini 2.5 Flash (`gemini-2.5-flash`) as the LLM — no OpenAI, no Anthropic
- LangChain for document chunking only — `RecursiveCharacterTextSplitter`
- ChromaDB in-memory for vector storage — no persistent DB needed
- PyMuPDF (`fitz`) for PDF extraction — no pdfplumber, no PyPDF2
- python-docx for DOCX extraction

---

## Code Style Rules

### TypeScript / React
- All components must be typed — no `any`, no implicit `any`
- Props interfaces named `[ComponentName]Props` defined above the component
- Use named exports for components, default export only for route-level pages
- All Zustand store actions must be typed
- API response types must match backend Pydantic schemas exactly
- Use `React.FC<Props>` sparingly — prefer function declarations with typed props
- All async hooks must handle loading, error, and success states explicitly
- No `console.log` in committed code — use a `logger` utility if needed

### Python
- All route handlers must be `async def`
- All service functions must be `async def` unless they wrap sync libraries
- Type hint everything — function arguments and return types
- Pydantic models for all inputs and outputs — no raw dicts crossing API boundaries
- Use `os.getenv()` with dotenv — never hardcode API keys
- Structured error responses: `{"error": "message", "detail": "..."}` with appropriate HTTP status
- Log meaningful events: file upload received, extraction complete, Gemini call started/completed

### General
- No magic numbers — extract to named constants at top of file
- No deeply nested ternaries — extract to variables or early returns
- Keep functions small and single-purpose — if a function is >40 lines, split it
- Each file has one clear responsibility

---

## Folder & File Rules

- Never create files outside the structure defined in `architecture.md`
- Component files: PascalCase (`UploadZone.tsx`)
- Utility/hook/service files: camelCase (`useDocumentUpload.ts`, `extractor.py`)
- One component per file — no multi-component files
- Prompts live only in `backend/prompts/` — never inline prompts in service files
- All environment variables accessed only through a central config object, not scattered `os.getenv()` calls

---

## Prompt Engineering Rules

When writing or editing Gemini prompts in `backend/prompts/`:

- Every prompt must have a clear `SYSTEM` and `USER` section
- Extraction prompts must instruct the model to return ONLY valid JSON — no preamble, no markdown fences
- Always include a fallback instruction: "If a field cannot be found, use null"
- Risk flag prompts must define severity criteria explicitly:
  - `red`: legal issue, missing title, restrictive covenant, boundary dispute, chancel repair liability
  - `amber`: unusual clause, shared access, missing search result, leasehold with <80 years remaining
  - `green`: standard clause, no issues found
- Chat prompt must include: "Answer only from the provided document context. If the answer is not in the context, say so clearly. Always cite the relevant section."
- Always instruct the model to keep language plain and accessible to a UK home buyer — no legal jargon without explanation

---

## UX / UI Rules

- **First load** must feel instant — skeleton loaders for all panels, never a blank white screen
- **Upload state** must show progress: idle → uploading → extracting → analysing → ready
- **Error states** must be human-readable: "We couldn't read this PDF — it may be scanned. Try a text-based PDF."
- **Chat** must show typing indicator (animated dots) while streaming
- **Risk flags** sorted always: red first, amber second, green last
- **"Try sample document"** button must be visible on the upload screen — zero friction for demos
- Mobile responsive — the founder may open the link on his phone
- Homey brand colours: use `#1a1a2e` (dark navy) and `#e8f4f8` (light blue-grey) as base palette — professional property sector feel

---

## What NOT to Do

- Do NOT add authentication — this is a demo, not a production app
- Do NOT add a database — ChromaDB in-memory only, sessions are ephemeral
- Do NOT add file storage — process in memory, don't write files to disk
- Do NOT add user accounts, dashboards, or admin panels — out of scope
- Do NOT use streaming on the upload endpoint — only on the chat endpoint
- Do NOT hallucinate dependencies — only use packages listed in `requirements.txt` and `package.json`
- Do NOT use `any` in TypeScript — ever
- Do NOT put API keys in frontend code — backend only
- Do NOT over-engineer — this is a 2-3 day prototype, not a SaaS product

---

## When You're Unsure

1. Check `architecture.md` for the intended structure
2. Check `plan.md` for the intended behaviour of the component/endpoint
3. Default to the simplest implementation that works correctly
4. Ask rather than assume for anything related to prompts or UX copy

---

## Definition of Done (per feature)

A feature is done when:
- [ ] It works correctly on a real UK conveyancing PDF
- [ ] Loading and error states are handled
- [ ] TypeScript has no type errors (`tsc --noEmit` passes)
- [ ] No hardcoded values or magic strings
- [ ] It looks good on both desktop and mobile
