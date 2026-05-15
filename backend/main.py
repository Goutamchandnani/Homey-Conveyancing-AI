"""
FastAPI application entry point — Homey AI Conveyancing Assistant.
"""

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from routers import upload, chat

# ── Logging ──────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan ─────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown events."""
    logger.info("Homey AI Conveyancing Assistant starting up")
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is not set — API calls will fail")
    yield
    logger.info("Shutting down")


# ── App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Homey AI Conveyancing Assistant",
    description="AI-powered UK conveyancing document analysis",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────
# Note: allow_credentials=True is incompatible with allow_origins=["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://homey-conveyancing-ai.vercel.app",
        "http://localhost:5173",
        "http://localhost:5174",
        "*"
    ],
    allow_credentials=False, # Must be False for wildcard support
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────
app.include_router(upload.router)
app.include_router(chat.router)


# ── Health Check ─────────────────────────────────────────────────────
@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "service": "homey-conveyancing-ai"}


# ── Global Error Handler ─────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all error handler for unhandled exceptions."""
    logger.error("Unhandled error on %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": "Something went wrong. Please try again.",
        },
    )
