/* ── Shared TypeScript interfaces ─────────────────────────────── */
/* Mirrors backend Pydantic schemas exactly.                      */

export interface PartiesData {
  buyer: string | null;
  seller: string | null;
}

export interface SolicitorsData {
  buyer: string | null;
  seller: string | null;
}

export interface ExtractedData {
  parties: PartiesData;
  property_address: string | null;
  purchase_price: string | null;
  completion_date: string | null;
  tenure: string | null;
  title_number: string | null;
  solicitors: SolicitorsData;
}

export interface RiskFlag {
  severity: "red" | "amber" | "green";
  title: string;
  description: string;
  page_reference: number | null;
}

export interface UploadResponse {
  session_id: string;
  filename: string;
  page_count: number;
  summary: string;
  extracted_data: ExtractedData;
  risk_flags: RiskFlag[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  session_id: string;
  message: string;
  history: ChatMessage[];
}

export type DocumentStatus =
  | "idle"
  | "uploading"
  | "extracting"
  | "analysing"
  | "ready"
  | "error";
