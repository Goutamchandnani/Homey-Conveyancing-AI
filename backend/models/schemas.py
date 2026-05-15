"""
Pydantic v2 request/response models for all API endpoints.
"""

from pydantic import BaseModel, Field


# ── Extracted Data Sub-Models ──────────────────────────────────────────

class PartiesData(BaseModel):
    buyer: str | None = Field(None, description="Buyer / registered proprietor name")
    seller: str | None = Field(None, description="Seller / transferor name")


class SolicitorsData(BaseModel):
    buyer: str | None = Field(None, description="Buyer's solicitor firm")
    seller: str | None = Field(None, description="Seller's solicitor firm")


class ExtractedData(BaseModel):
    parties: PartiesData = Field(default_factory=PartiesData)
    property_address: str | None = Field(None, description="Full property address")
    purchase_price: str | None = Field(None, description="Purchase price as stated")
    completion_date: str | None = Field(None, description="Expected or actual completion date")
    tenure: str | None = Field(None, description="Freehold, Leasehold, or other")
    title_number: str | None = Field(None, description="Land Registry title number")
    solicitors: SolicitorsData = Field(default_factory=SolicitorsData)


# ── Risk Flags ─────────────────────────────────────────────────────────

class RiskFlag(BaseModel):
    severity: str = Field(..., description="red | amber | green")
    title: str = Field(..., description="Short flag headline")
    description: str = Field(..., description="Plain-English explanation")
    page_reference: int | None = Field(None, description="Relevant page number")


# ── Upload Response ────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    session_id: str = Field(..., description="UUID for this analysis session")
    filename: str = Field(..., description="Original uploaded filename")
    page_count: int = Field(0, description="Number of pages in the document")
    summary: str = Field(..., description="Plain-English document summary")
    extracted_data: ExtractedData = Field(default_factory=ExtractedData)
    risk_flags: list[RiskFlag] = Field(default_factory=list)


# ── Chat Request ───────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., description="user | assistant")
    content: str = Field(..., description="Message text")


class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Session UUID from upload")
    message: str = Field(..., description="User's question")
    history: list[ChatMessage] = Field(default_factory=list)


# ── Error Response ─────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message")
    detail: str | None = Field(None, description="Additional detail")
