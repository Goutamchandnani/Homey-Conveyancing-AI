"""
RAG service — retrieves relevant document chunks and generates
grounded answers using Gemini with the chat prompt.
Uses the new google.genai SDK.
"""

import asyncio
import logging
from collections.abc import AsyncGenerator

from google import genai

from config import settings
from models.schemas import ChatMessage
from prompts.chat_prompt import CHAT_SYSTEM_PROMPT, CHAT_USER_PROMPT
from services.embedder import query_similar_chunks

logger = logging.getLogger(__name__)


def _get_client() -> genai.Client:
    """Get a configured Gemini client instance."""
    return genai.Client(api_key=settings.GEMINI_API_KEY)


async def generate_rag_response(
    session_id: str,
    question: str,
    history: list[ChatMessage],
) -> AsyncGenerator[str, None]:
    """
    Retrieve relevant chunks and stream a grounded answer.

    Args:
        session_id: Session UUID to query against.
        question: User's question.
        history: Conversation history.

    Yields:
        Chunks of the response text as they are generated.
    """
    logger.info("RAG query for session '%s': %s", session_id, question[:100])

    # Step 1: Retrieve relevant chunks
    similar_chunks = await query_similar_chunks(session_id, question)

    if not similar_chunks:
        yield "I don't have any document context to answer from. Please upload a document first."
        return

    # Step 2: Build context string from retrieved chunks
    context_parts: list[str] = []
    for chunk in similar_chunks:
        page_ref = chunk.get("page_reference")
        page_label = f" (page {page_ref})" if page_ref else ""
        context_parts.append(f"--- Excerpt{page_label} ---\n{chunk['text']}")

    context = "\n\n".join(context_parts)

    # Step 3: Format conversation history
    history_text = _format_history(history)

    # Step 4: Build the full prompt
    user_content = CHAT_USER_PROMPT.format(
        context=context,
        history=history_text,
        question=question,
    )

    # Step 5: Stream response from Gemini
    client = _get_client()

    response = await asyncio.to_thread(
        client.models.generate_content,
        model=settings.LLM_MODEL,
        contents=CHAT_SYSTEM_PROMPT + "\n\n" + user_content,
    )

    # The new SDK doesn't support streaming via generate_content the same way,
    # so we yield the full response (streaming is handled at the SSE level)
    if response.text:
        # Simulate streaming by yielding in chunks for a better UX
        text = response.text
        chunk_size = 20
        for i in range(0, len(text), chunk_size):
            yield text[i:i + chunk_size]


def _format_history(history: list[ChatMessage]) -> str:
    """Format conversation history into a readable string."""
    if not history:
        return "No previous conversation."

    lines: list[str] = []
    for msg in history[-10:]:  # Keep last 10 messages to stay within context
        role_label = "User" if msg.role == "user" else "Assistant"
        lines.append(f"{role_label}: {msg.content}")

    return "\n".join(lines)
