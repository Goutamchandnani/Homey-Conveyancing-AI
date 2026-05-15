import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/useChat";
import { useDocumentStore } from "@/stores/documentStore";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Sparkles } from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "What is the completion date?",
  "Are there any restrictive covenants?",
  "Who are the solicitors?",
  "Is this property freehold or leasehold?",
  "What charges are registered against this title?",
];

/**
 * Chat interface for asking questions about the uploaded document.
 */
export function ChatInterface() {
  const { messages, isStreaming, send } = useChat();
  const status = useDocumentStore((s) => s.status);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDisabled = status !== "ready";

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    send(input.trim());
    setInput("");
  };

  const handleSuggestion = (question: string) => {
    if (isStreaming) return;
    send(question);
  };

  return (
    <Card className="bg-card border-border flex flex-col h-full min-h-[500px]">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-homey-lime" />
          Ask About Your Document
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages area */}
        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 && !isDisabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 text-homey-purple-light mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Ask any question about your document
                  </p>
                </div>

                {/* Suggested questions */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSuggestion(q)}
                      className="text-xs px-3 py-2 rounded-full border border-border
                        bg-muted/30 text-muted-foreground
                        hover:border-homey-purple/40 hover:text-foreground hover:bg-homey-purple/5
                        transition-all duration-200"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`
                      max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                      ${
                        msg.role === "user"
                          ? "bg-homey-lime text-homey-black rounded-br-md"
                          : "bg-muted border border-border rounded-bl-md"
                      }
                    `}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isStreaming && messages[messages.length - 1]?.content === "" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-muted border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Input bar */}
        <div className="px-6 pb-6 pt-3 shrink-0 border-t border-border">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isDisabled
                  ? "Upload a document first..."
                  : "Ask a question about your document..."
              }
              disabled={isDisabled || isStreaming}
              className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-3
                text-sm placeholder:text-muted-foreground/50
                focus:outline-none focus:ring-2 focus:ring-homey-purple/50 focus:border-homey-purple/50
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200"
            />
            <Button
              type="submit"
              disabled={isDisabled || isStreaming || !input.trim()}
              className="bg-homey-lime text-homey-black hover:bg-homey-lime-dim
                rounded-xl px-4 disabled:opacity-30"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
