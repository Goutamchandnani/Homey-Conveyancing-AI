"""
Document embedding and vector storage service.
Chunks document text using LangChain and stores in ChromaDB (in-memory).
Uses the new google.genai SDK for embeddings.
"""

import logging
from typing import Any

import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter
from google import genai

from config import settings

logger = logging.getLogger(__name__)

# In-memory ChromaDB client — shared across sessions
_chroma_client = chromadb.Client()

# Text splitter configured per ai_rules
_text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=settings.CHUNK_SIZE,
    chunk_overlap=settings.CHUNK_OVERLAP,
    separators=["\n\n", "\n", ". ", " ", ""],
)


def _get_client() -> genai.Client:
    """Get a configured Gemini client instance."""
    return genai.Client(api_key=settings.GEMINI_API_KEY)


async def embed_document(session_id: str, document_text: str) -> int:
    """
    Chunk document text, embed each chunk, and store in ChromaDB.

    Args:
        session_id: Unique session UUID to namespace the collection.
        document_text: Full extracted document text.

    Returns:
        Number of chunks stored.
    """
    logger.info("Chunking document for session '%s'", session_id)
    chunks = _text_splitter.split_text(document_text)

    if not chunks:
        logger.warning("No chunks generated from document text")
        return 0

    logger.info("Generated %d chunks, embedding via Gemini", len(chunks))

    # Embed all chunks in a single batch call
    embeddings = _batch_embed(chunks)

    # Create or get ChromaDB collection for this session
    collection = _chroma_client.get_or_create_collection(
        name=f"session_{session_id.replace('-', '_')}",
        metadata={"hnsw:space": "cosine"},
    )

    # Prepare IDs and metadata for each chunk
    ids = [f"chunk_{i}" for i in range(len(chunks))]
    metadatas = _build_chunk_metadata(chunks)

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )

    logger.info(
        "Stored %d chunks in ChromaDB for session '%s'",
        len(chunks), session_id,
    )
    return len(chunks)


async def query_similar_chunks(
    session_id: str, query_text: str, top_k: int | None = None
) -> list[dict[str, Any]]:
    """
    Embed a query and retrieve the most similar document chunks.

    Args:
        session_id: Session UUID to query.
        query_text: User's question.
        top_k: Number of results to return.

    Returns:
        List of dicts with keys: text, page_reference, distance.
    """
    if top_k is None:
        top_k = settings.RAG_TOP_K

    collection_name = f"session_{session_id.replace('-', '_')}"

    try:
        collection = _chroma_client.get_collection(name=collection_name)
    except Exception:
        logger.error("No ChromaDB collection found for session '%s'", session_id)
        return []

    # Embed the query
    query_embedding = _single_embed(query_text)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
    )

    # Format results
    similar_chunks: list[dict[str, Any]] = []
    if results and results["documents"]:
        for i, doc in enumerate(results["documents"][0]):
            metadata = results["metadatas"][0][i] if results["metadatas"] else {}
            distance = results["distances"][0][i] if results["distances"] else 0.0
            page_ref = metadata.get("page_reference")
            similar_chunks.append({
                "text": doc,
                "page_reference": page_ref if page_ref != -1 else None,
                "distance": distance,
            })

    logger.info(
        "Retrieved %d similar chunks for session '%s'",
        len(similar_chunks), session_id,
    )
    return similar_chunks


def session_exists(session_id: str) -> bool:
    """Check whether a ChromaDB collection exists for the given session."""
    collection_name = f"session_{session_id.replace('-', '_')}"
    try:
        _chroma_client.get_collection(name=collection_name)
        return True
    except Exception:
        return False


def _batch_embed(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts using Gemini embedding model."""
    client = _get_client()
    result = client.models.embed_content(
        model=settings.EMBEDDING_MODEL,
        contents=texts,
    )
    return [e.values for e in result.embeddings]


def _single_embed(text: str) -> list[float]:
    """Embed a single text using Gemini embedding model."""
    client = _get_client()
    result = client.models.embed_content(
        model=settings.EMBEDDING_MODEL,
        contents=text,
    )
    return result.embeddings[0].values


def _build_chunk_metadata(chunks: list[str]) -> list[dict[str, Any]]:
    """
    Build metadata for each chunk, attempting to extract page references
    from the [Page N] markers inserted by the extractor.
    """
    metadatas: list[dict[str, Any]] = []
    for i, chunk in enumerate(chunks):
        page_ref = None
        if "[Page " in chunk:
            try:
                start = chunk.index("[Page ") + 6
                end = chunk.index("]", start)
                page_ref = int(chunk[start:end])
            except (ValueError, IndexError):
                pass
        metadatas.append({
            "chunk_index": i,
            "page_reference": page_ref if page_ref is not None else -1,
        })
    return metadatas
