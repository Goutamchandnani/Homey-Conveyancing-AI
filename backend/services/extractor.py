"""
Extractor service — handles text extraction from PDF, DOCX, and TXT files.
Uses PyMuPDF for PDFs and python-docx for Word documents.
"""

import logging
from io import BytesIO
from dataclasses import dataclass

import fitz  # PyMuPDF
from docx import Document

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt"}


@dataclass
class ExtractionResult:
    """Container for extracted text and metadata."""
    text: str
    page_count: int
    filename: str


async def extract_text(file_content: bytes, filename: str) -> ExtractionResult:
    """
    Dispatcher for extracting text based on file extension.
    """
    extension = _get_extension(filename)

    if extension == ".pdf":
        return await _extract_pdf(file_content, filename)
    elif extension == ".docx":
        return await _extract_docx(file_content, filename)
    elif extension == ".txt":
        return await _extract_txt(file_content, filename)
    else:
        raise ValueError(
            f"Unsupported file type: {extension}. "
            "Please upload a PDF or DOCX file."
        )


def _get_extension(filename: str) -> str:
    """Extract lowercase file extension."""
    dot_index = filename.rfind(".")
    if dot_index == -1:
        return ""
    return filename[dot_index:].lower()


async def _extract_pdf(file_content: bytes, filename: str) -> ExtractionResult:
    """Extract text from PDF using PyMuPDF."""
    if not file_content:
        raise ValueError("The uploaded PDF file is empty.")

    try:
        # Check if it's actually a text file renamed to .pdf
        if file_content.startswith(b"%PDF-") is False and len(file_content) < 5000:
            try:
                text = file_content.decode("utf-8")
                logger.warning("File '%s' looks like text but has .pdf extension.", filename)
                return await _extract_txt(file_content, filename)
            except UnicodeDecodeError:
                pass

        doc = fitz.open(stream=file_content, filetype="pdf")
        full_text = ""
        page_count = len(doc)

        for i, page in enumerate(doc):
            text = page.get_text()
            if text.strip():
                full_text += f"\n[Page {i+1}]\n{text}"
        
        doc.close()

        if not full_text.strip():
            raise ValueError(
                "No text could be extracted from this PDF. "
                "It might be a scanned image or an empty document."
            )

        logger.info("Extracted %d characters from PDF '%s'", len(full_text), filename)

        return ExtractionResult(
            text=full_text,
            page_count=page_count,
            filename=filename,
        )
    except Exception as exc:
        if isinstance(exc, ValueError):
            raise exc
        logger.error("PyMuPDF failed to open '%s': %s", filename, exc)
        raise ValueError("This PDF file appears to be corrupted or invalid.") from exc


async def _extract_docx(file_content: bytes, filename: str) -> ExtractionResult:
    """Extract text from DOCX using python-docx."""
    try:
        doc = Document(BytesIO(file_content))
        full_text = "\n".join([p.text for p in doc.paragraphs])
        
        # Estimate pages (approx 500 words per page)
        estimated_pages = max(1, len(full_text.split()) // 500)

        logger.info("Extracted %d characters from DOCX '%s'", len(full_text), filename)

        return ExtractionResult(
            text=full_text,
            page_count=estimated_pages,
            filename=filename,
        )
    except Exception as exc:
        logger.error("Failed to open DOCX '%s': %s", filename, exc)
        raise ValueError("This DOCX file appears to be corrupted or invalid.") from exc


async def _extract_txt(file_content: bytes, filename: str) -> ExtractionResult:
    """Extract text from plain text file."""
    try:
        full_text = file_content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            full_text = file_content.decode("latin-1")
        except Exception as exc:
            logger.error("Failed to decode text file '%s': %s", filename, exc)
            raise ValueError("We couldn't read this text file.") from exc

    if not full_text.strip():
        raise ValueError("The text file is empty.")

    # Estimate pages (approx 500 words per page)
    estimated_pages = max(1, len(full_text.split()) // 500)

    logger.info("Extracted %d characters from text file '%s'", len(full_text), filename)

    return ExtractionResult(
        text=full_text,
        page_count=estimated_pages,
        filename=filename,
    )
