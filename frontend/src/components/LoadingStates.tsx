import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useDocumentStore } from "@/stores/documentStore";
import { motion } from "framer-motion";

const STATUS_MESSAGES: Record<string, string> = {
  uploading: "Uploading document...",
  extracting: "Extracting text from document...",
  analysing: "AI is analysing your document...",
};

/**
 * Skeleton loading states shown during document processing.
 */
export function LoadingStates() {
  const status = useDocumentStore((s) => s.status);
  const message = STATUS_MESSAGES[status] || "Processing...";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-5xl mx-auto space-y-6 p-6"
    >
      {/* Status indicator */}
      <div className="flex items-center gap-3 mb-8">
        <div className="relative">
          <div className="w-3 h-3 rounded-full bg-homey-lime animate-pulse" />
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-homey-lime/50 animate-ping" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>

      {/* Summary skeleton */}
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </CardContent>
      </Card>

      {/* Extracted data skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk flags skeleton */}
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-6 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
