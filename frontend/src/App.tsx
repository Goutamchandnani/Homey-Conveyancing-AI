import { useDocumentStore } from "@/stores/documentStore";
import { UploadZone } from "@/components/UploadZone";
import { LoadingStates } from "@/components/LoadingStates";
import { SummaryPanel } from "@/components/SummaryPanel";
import { ExtractedDataPanel } from "@/components/ExtractedData";
import { RiskFlagsPanel } from "@/components/RiskFlags";
import { ChatInterface } from "@/components/ChatInterface";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

function App() {
  const status = useDocumentStore((s) => s.status);
  const reset = useDocumentStore((s) => s.reset);

  const isUploadView = status === "idle" || status === "error";
  const isLoading =
    status === "uploading" ||
    status === "extracting" ||
    status === "analysing";
  const isReady = status === "ready";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-homey-lime flex items-center justify-center">
              <Zap className="w-5 h-5 text-homey-black" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">
                <span className="text-homey-lime">Homey</span>
                <span className="text-foreground"> AI</span>
              </h1>
              <p className="text-[10px] text-muted-foreground leading-none -mt-0.5">
                Conveyancing Assistant
              </p>
            </div>
          </div>

          {isReady && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              New Document
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Upload View */}
          {isUploadView && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[70vh]"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-10"
              >
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                  <span className="text-foreground">Understand your </span>
                  <span className="text-homey-lime">property documents</span>
                  <span className="text-foreground"> instantly</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  Upload a title register, contract, or search result. Our AI extracts
                  the key data, flags risks, and answers your questions in plain English.
                </p>
              </motion.div>

              <UploadZone />
            </motion.div>
          )}

          {/* Loading View */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingStates />
            </motion.div>
          )}

          {/* Results View */}
          {isReady && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-6"
            >
              {/* Left panel — Analysis results */}
              <div className="lg:col-span-3 space-y-6">
                <SummaryPanel />
                <ExtractedDataPanel />
                <RiskFlagsPanel />
              </div>

              {/* Right panel — Chat */}
              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-24">
                  <ChatInterface />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <p>Powered by Gemini 2.5 Flash • Built for Homey Technology</p>
          <p>Prototype by Goutam Chandnani</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
