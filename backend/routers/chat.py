"""
Chat router — POST /chat endpoint for RAG-powered document Q&A.
"""

import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import ChatRequest
from services.embedder import session_exists
from services.rag import generate_rag_response

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


@router.post("/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    """
    Ask a question about a previously uploaded document.
    Streams the response using Server-Sent Events.
    """
    if not session_exists(request.session_id):
        raise HTTPException(
            status_code=404,
            detail="Session not found. Please upload a document first.",
        )

    logger.info(
        "Chat request for session '%s': %s",
        request.session_id, request.message[:100],
    )

    async def event_stream():
        try:
            async for chunk in generate_rag_response(
                session_id=request.session_id,
                question=request.message,
                history=request.history,
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:
            logger.error("Chat streaming error: %s", exc)
            yield f"data: Sorry, something went wrong.\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
