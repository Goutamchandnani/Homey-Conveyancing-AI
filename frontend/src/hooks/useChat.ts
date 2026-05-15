import { useCallback } from "react";
import { sendMessage } from "@/lib/api";
import { useDocumentStore } from "@/stores/documentStore";
import { useChatStore } from "@/stores/chatStore";

/**
 * Hook for sending chat messages and handling SSE streaming responses.
 */
export function useChat() {
  const sessionId = useDocumentStore((s) => s.sessionId);
  const chatStore = useChatStore();

  const send = useCallback(
    async (message: string) => {
      if (!sessionId || chatStore.isStreaming) return;

      chatStore.addUserMessage(message);
      chatStore.startAssistantMessage();

      await sendMessage(
        sessionId,
        message,
        chatStore.messages,
        (chunk) => chatStore.appendToAssistantMessage(chunk),
        () => chatStore.finishAssistantMessage(),
        (error) => {
          chatStore.appendToAssistantMessage(
            `\n\n_Error: ${error}_`
          );
          chatStore.finishAssistantMessage();
        }
      );
    },
    [sessionId, chatStore]
  );

  return {
    messages: chatStore.messages,
    isStreaming: chatStore.isStreaming,
    send,
  };
}
