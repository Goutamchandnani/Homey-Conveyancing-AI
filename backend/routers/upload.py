"""
Upload router — POST /upload endpoint for document ingestion and analysis.
"""

import logging
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile

from config import settings
from models.schemas import UploadResponse
from services.extractor import extract_text, SUPPORTED_EXTENSIONS
from services.embedder import embed_document
from services.analyser import analyse_document

logger = logging.getLogger(__name__)

router = APIRouter(tags=["upload"])


@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)) -> UploadResponse:
    """
    Upload a PDF or DOCX conveyancing document for analysis.

    Flow: validate → extract text → embed chunks → analyse (3x Gemini) → return results.
    """
    # ── Validate file type ───────────────────────────────────────────
    filename = file.filename or "unknown"
    extension = _get_extension(filename)

    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{extension}'. Please upload a PDF or DOCX file.",
        )

    # ── Validate file size ───────────────────────────────────────────
    file_content = await file.read()
    file_size_mb = len(file_content) / (1024 * 1024)

    if len(file_content) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({file_size_mb:.1f}MB). Maximum size is {settings.MAX_FILE_SIZE_MB}MB.",
        )

    logger.info(
        "Upload received: '%s' (%.1fMB, %s)",
        filename, file_size_mb, extension,
    )

    # ── Generate session ID ──────────────────────────────────────────
    session_id = str(uuid.uuid4())
    logger.info("Session created: %s", session_id)

    # ── Step 1: Extract text ─────────────────────────────────────────
    try:
        extraction = await extract_text(file_content, filename)
    except ValueError as exc:
        logger.error("Extraction failed for '%s': %s", filename, exc)
        raise HTTPException(status_code=422, detail=f"Document analysis failed: {str(exc)}")
    except Exception as exc:
        logger.error("Unexpected extraction error for '%s': %s", filename, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to extract text from document.")

    logger.info(
        "Extraction complete: %d chars, %d pages",
        len(extraction.text), extraction.page_count,
    )

    # ── Step 2: Embed chunks into ChromaDB ───────────────────────────
    try:
        chunk_count = await embed_document(session_id, extraction.text)
        logger.info("Embedded %d chunks into ChromaDB", chunk_count)
    except Exception as exc:
        logger.error("Embedding failed for session '%s': %s", session_id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to embed document chunks.")

    # ── Step 3: Analyse with Gemini (3 parallel calls) ───────────────
    try:
        logger.info("Starting Gemini analysis...")
        analysis = await analyse_document(extraction.text)
        logger.info("Gemini analysis complete")
    except Exception as exc:
        logger.error("Analysis failed for session '%s': %s", session_id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to analyse document with AI.")

    # ── Build response ───────────────────────────────────────────────
    return UploadResponse(
        session_id=session_id,
        filename=filename,
        page_count=extraction.page_count,
        summary=analysis["summary"],
        extracted_data=analysis["extracted_data"],
        risk_flags=analysis["risk_flags"],
    )


def _get_extension(filename: str) -> str:
    """Extract lowercase file extension."""
    dot_index = filename.rfind(".")
    if dot_index == -1:
        return ""
    return filename[dot_index:].lower()
