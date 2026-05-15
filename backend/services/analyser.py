"""
Document analyser service — runs summary, extraction, and risk flag
prompts against Gemini 2.5 Flash in parallel.
"""

import asyncio
import json
import logging
from typing import Any

from google import genai

from config import settings
from models.schemas import ExtractedData, RiskFlag
from prompts.summary_prompt import SUMMARY_SYSTEM_PROMPT, SUMMARY_USER_PROMPT
from prompts.extraction_prompt import EXTRACTION_SYSTEM_PROMPT, EXTRACTION_USER_PROMPT
from prompts.flags_prompt import FLAGS_SYSTEM_PROMPT, FLAGS_USER_PROMPT

logger = logging.getLogger(__name__)

# Maximum retry attempts for malformed JSON from Gemini
MAX_RETRIES = 1


def _get_client() -> genai.Client:
    """Get a configured Gemini client instance with a 30s timeout."""
    return genai.Client(
        api_key=settings.GEMINI_API_KEY,
        http_options={"timeout": 30000}
    )


async def analyse_document(document_text: str) -> dict[str, Any]:
    """
    Run all three analysis tasks in parallel.
    """
    logger.info("Starting parallel Gemini analysis (summary + extraction + flags)")

    summary_task = asyncio.create_task(_generate_summary(document_text))
    extraction_task = asyncio.create_task(_generate_extraction(document_text))
    flags_task = asyncio.create_task(_generate_flags(document_text))

    summary, extracted_data, risk_flags = await asyncio.gather(
        summary_task, extraction_task, flags_task,
        return_exceptions=True,
    )

    # Handle individual failures gracefully
    if isinstance(summary, Exception):
        logger.error("Summary generation failed: %s", summary)
        summary = "Unable to generate summary for this document."

    if isinstance(extracted_data, Exception):
        logger.error("Data extraction failed: %s", extracted_data)
        extracted_data = ExtractedData()

    if isinstance(risk_flags, Exception):
        logger.error("Risk flag analysis failed: %s", risk_flags)
        risk_flags = []

    logger.info("Gemini analysis complete")

    return {
        "summary": summary,
        "extracted_data": extracted_data,
        "risk_flags": risk_flags,
    }


async def _generate_summary(document_text: str) -> str:
    """Generate a plain-English summary via Gemini."""
    client = _get_client()
    user_content = SUMMARY_USER_PROMPT.format(document_text=document_text)

    response = await asyncio.to_thread(
        client.models.generate_content,
        model=settings.LLM_MODEL,
        contents=SUMMARY_SYSTEM_PROMPT + "\n\n" + user_content,
    )

    summary = response.text.strip()
    logger.info("Summary generated (%d characters)", len(summary))
    return summary


async def _generate_extraction(
    document_text: str, attempt: int = 0
) -> ExtractedData:
    """Extract key data fields as structured JSON via Gemini."""
    client = _get_client()
    user_content = EXTRACTION_USER_PROMPT.format(document_text=document_text)

    response = await asyncio.to_thread(
        client.models.generate_content,
        model=settings.LLM_MODEL,
        contents=EXTRACTION_SYSTEM_PROMPT + "\n\n" + user_content,
    )

    raw_text = response.text.strip()
    parsed = _parse_json(raw_text)

    if parsed is None:
        if attempt < MAX_RETRIES:
            logger.warning("Extraction JSON malformed, retrying (attempt %d)", attempt + 1)
            return await _generate_extraction(document_text, attempt + 1)
        logger.error("Extraction JSON failed after retries: %s", raw_text[:200])
        return ExtractedData()

    try:
        return ExtractedData.model_validate(parsed)
    except Exception as exc:
        logger.error("Extraction validation failed: %s", exc)
        return ExtractedData()


async def _generate_flags(
    document_text: str, attempt: int = 0
) -> list[RiskFlag]:
    """Identify risk flags as a JSON array via Gemini."""
    client = _get_client()
    user_content = FLAGS_USER_PROMPT.format(document_text=document_text)

    response = await asyncio.to_thread(
        client.models.generate_content,
        model=settings.LLM_MODEL,
        contents=FLAGS_SYSTEM_PROMPT + "\n\n" + user_content,
    )

    raw_text = response.text.strip()
    parsed = _parse_json(raw_text)

    if not isinstance(parsed, list):
        if attempt < MAX_RETRIES:
            logger.warning("Flags JSON malformed, retrying (attempt %d)", attempt + 1)
            return await _generate_flags(document_text, attempt + 1)
        logger.error("Flags JSON failed after retries: %s", raw_text[:200])
        return []

    flags: list[RiskFlag] = []
    for item in parsed:
        try:
            flags.append(RiskFlag.model_validate(item))
        except Exception as exc:
            logger.warning("Skipping malformed flag: %s — %s", item, exc)

    # Sort: red first, amber second, green last
    severity_order = {"red": 0, "amber": 1, "green": 2}
    flags.sort(key=lambda f: severity_order.get(f.severity, 3))

    logger.info("Generated %d risk flags", len(flags))
    return flags


def _parse_json(text: str) -> Any | None:
    """
    Attempt to parse JSON from Gemini response.
    Strips markdown code fences if present.
    """
    cleaned = text
    if cleaned.startswith("```"):
        first_newline = cleaned.index("\n") if "\n" in cleaned else len(cleaned)
        cleaned = cleaned[first_newline + 1:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return None
