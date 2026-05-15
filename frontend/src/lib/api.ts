import axios from "axios";
import type { UploadResponse, ChatMessage } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 min timeout for large docs
});

/**
 * Upload a document for analysis.
 * Returns the full analysis result (summary, extracted data, risk flags).
 */
export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<UploadResponse>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

/**
 * Send a chat message and stream the response via SSE.
 * Calls onChunk for each text chunk, onDone when complete.
 */
export async function sendMessage(
  sessionId: string,
  message: string,
  history: ChatMessage[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        message,
        history,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      onError(errorData?.detail || "Failed to get a response.");
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError("No response stream available.");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            onDone();
            return;
          }
          onChunk(data);
        }
      }
    }

    onDone();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Connection failed.";
    onError(message);
  }
}
