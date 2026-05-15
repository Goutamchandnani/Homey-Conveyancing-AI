import { create } from "zustand";
import type {
  DocumentStatus,
  UploadResponse,
  ExtractedData,
  RiskFlag,
} from "@/types";

interface DocumentState {
  sessionId: string | null;
  filename: string | null;
  pageCount: number;
  status: DocumentStatus;
  summary: string | null;
  extractedData: ExtractedData | null;
  riskFlags: RiskFlag[];
  errorMessage: string | null;

  setUploading: (filename: string) => void;
  setExtracting: () => void;
  setAnalysing: () => void;
  setReady: (response: UploadResponse) => void;
  setError: (message: string) => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  filename: null,
  pageCount: 0,
  status: "idle" as DocumentStatus,
  summary: null,
  extractedData: null,
  riskFlags: [],
  errorMessage: null,
};

export const useDocumentStore = create<DocumentState>((set) => ({
  ...initialState,

  setUploading: (filename: string) =>
    set({ ...initialState, status: "uploading", filename }),

  setExtracting: () => set({ status: "extracting" }),

  setAnalysing: () => set({ status: "analysing" }),

  setReady: (response: UploadResponse) =>
    set({
      status: "ready",
      sessionId: response.session_id,
      filename: response.filename,
      pageCount: response.page_count,
      summary: response.summary,
      extractedData: response.extracted_data,
      riskFlags: response.risk_flags,
      errorMessage: null,
    }),

  setError: (message: string) =>
    set({ status: "error", errorMessage: message }),

  reset: () => set(initialState),
}));
