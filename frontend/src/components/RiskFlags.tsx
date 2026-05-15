import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDocumentStore } from "@/stores/documentStore";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import type { RiskFlag } from "@/types";

const SEVERITY_CONFIG = {
  red: {
    label: "High Risk",
    bgClass: "bg-[var(--flag-red-bg)]",
    textClass: "text-[var(--flag-red)]",
    borderClass: "border-[var(--flag-red)]/20",
    badgeClass: "bg-[var(--flag-red)]/15 text-[var(--flag-red)] border-[var(--flag-red)]/30",
  },
  amber: {
    label: "Review",
    bgClass: "bg-[var(--flag-amber-bg)]",
    textClass: "text-[var(--flag-amber)]",
    borderClass: "border-[var(--flag-amber)]/20",
    badgeClass: "bg-[var(--flag-amber)]/15 text-[var(--flag-amber)] border-[var(--flag-amber)]/30",
  },
  green: {
    label: "Clear",
    bgClass: "bg-[var(--flag-green-bg)]",
    textClass: "text-[var(--flag-green)]",
    borderClass: "border-[var(--flag-green)]/20",
    badgeClass: "bg-[var(--flag-green)]/15 text-[var(--flag-green)] border-[var(--flag-green)]/30",
  },
};

interface FlagItemProps {
  flag: RiskFlag;
  index: number;
}

function FlagItem({ flag, index }: FlagItemProps) {
  const [isExpanded, setIsExpanded] = useState(flag.severity === "red");
  const config = SEVERITY_CONFIG[flag.severity];

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full text-left p-4 rounded-xl border transition-all duration-200
          ${config.bgClass} ${config.borderClass}
          hover:scale-[1.01]
        `}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <Badge
              variant="outline"
              className={`${config.badgeClass} shrink-0 text-xs font-medium`}
            >
              {config.label}
            </Badge>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{flag.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {flag.page_reference && (
              <span className="text-xs text-muted-foreground">
                p.{flag.page_reference}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-sm text-foreground/70 mt-3 leading-relaxed">
                {flag.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}

/**
 * Risk flags list sorted by severity (red → amber → green).
 */
export function RiskFlagsPanel() {
  const riskFlags = useDocumentStore((s) => s.riskFlags);

  if (!riskFlags.length) return null;

  const redCount = riskFlags.filter((f) => f.severity === "red").length;
  const amberCount = riskFlags.filter((f) => f.severity === "amber").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-homey-lime" />
              Risk Analysis
            </div>
            <div className="flex items-center gap-2">
              {redCount > 0 && (
                <Badge className="bg-[var(--flag-red)]/15 text-[var(--flag-red)] border-[var(--flag-red)]/30 text-xs">
                  {redCount} high
                </Badge>
              )}
              {amberCount > 0 && (
                <Badge className="bg-[var(--flag-amber)]/15 text-[var(--flag-amber)] border-[var(--flag-amber)]/30 text-xs">
                  {amberCount} review
                </Badge>
              )}
              {redCount === 0 && amberCount === 0 && (
                <div className="flex items-center gap-1 text-xs text-[var(--flag-green)]">
                  <CheckCircle className="w-3.5 h-3.5" />
                  All clear
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {riskFlags.map((flag, i) => (
            <FlagItem key={`${flag.severity}-${flag.title}`} flag={flag} index={i} />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
