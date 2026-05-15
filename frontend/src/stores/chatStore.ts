import { create } from "zustand";
import type { ChatMessage } from "@/types";

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;

  addUserMessage: (content: string) => void;
  startAssistantMessage: () => void;
  appendToAssistantMessage: (chunk: string) => void;
  finishAssistantMessage: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,

  addUserMessage: (content: string) =>
    set((state) => ({
      messages: [...state.messages, { role: "user", content }],
    })),

  startAssistantMessage: () =>
    set((state) => ({
      isStreaming: true,
      messages: [...state.messages, { role: "assistant", content: "" }],
    })),

  appendToAssistantMessage: (chunk: string) =>
    set((state) => {
      const messages = [...state.messages];
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === "assistant") {
        messages[messages.length - 1] = {
          ...lastMessage,
          content: lastMessage.content + chunk,
        };
      }
      return { messages };
    }),

  finishAssistantMessage: () => set({ isStreaming: false }),

  clearMessages: () => set({ messages: [], isStreaming: false }),
}));
