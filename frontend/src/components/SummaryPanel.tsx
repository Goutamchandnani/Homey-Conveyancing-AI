import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useDocumentStore } from "@/stores/documentStore";
import { motion } from "framer-motion";
import { FileText, Clock } from "lucide-react";

/**
 * Plain-English summary of the analysed document.
 */
export function SummaryPanel() {
  const summary = useDocumentStore((s) => s.summary);
  const filename = useDocumentStore((s) => s.filename);
  const pageCount = useDocumentStore((s) => s.pageCount);

  if (!summary) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-card border-border overflow-hidden">
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-homey-lime via-homey-purple to-homey-lime" />

        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-homey-lime" />
            Document Summary
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-sm leading-relaxed text-foreground/90"
          >
            {summary}
          </motion.p>

          <Separator className="bg-border" />

          {/* Document metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>{filename}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>{pageCount} {pageCount === 1 ? "page" : "pages"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Just now</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
