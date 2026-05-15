import { useCallback, useState } from "react";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/stores/documentStore";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE_MB = 10;

/**
 * Drag-and-drop upload zone for PDF/DOCX documents.
 */
export function UploadZone() {
  const { upload, isLoading } = useDocumentUpload();
  const errorMessage = useDocumentStore((s) => s.errorMessage);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Please upload a PDF or DOCX file.";
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        setSelectedFile(null);
        return;
      }
      setValidationError(null);
      setSelectedFile(file);
    },
    [validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleUpload = useCallback(() => {
    if (selectedFile) upload(selectedFile);
  }, [selectedFile, upload]);

  const handleSampleDocument = useCallback(() => {
    // Create a sample document for demo purposes
    const sampleText = `HM LAND REGISTRY - OFFICIAL COPY OF REGISTER OF TITLE
Title Number: WM123456
Edition Date: 15 May 2024

A: PROPERTY REGISTER
The Freehold land shown edged with red on the plan of the above Title filed at the Registry and being 42 Oakwood Drive, Birmingham, West Midlands, B15 2TT.

B: PROPRIETORSHIP REGISTER
TITLE ABSOLUTE
1. (15.03.2020) PROPRIETOR: JOHN SMITH and JANE SMITH of 42 Oakwood Drive, Birmingham, West Midlands, B15 2TT.
2. (15.03.2020) The price stated to have been paid on 15 March 2020 was £285,000.
3. (15.03.2020) RESTRICTION: No disposition by a sole proprietor of the registered estate (except a trust corporation) under which capital money arises is to be registered unless authorised by an order of the court.

C: CHARGES REGISTER
1. (15.03.2020) REGISTERED CHARGE dated 12 March 2020 to secure the moneys including the further advances therein mentioned.
2. (15.03.2020) Proprietor of Charge: NATIONWIDE BUILDING SOCIETY of Nationwide House, Pipers Way, Swindon SN38 1NW.
3. The land is subject to the following restrictive covenants contained in a Transfer dated 1 June 1985:
   (i) Not to use the property other than as a single private dwelling house.
   (ii) Not to erect any building, wall or fence on the property without the prior written consent of the Estate Management Company.
   (iii) To maintain the boundary fences and hedges in good repair.
4. A Conveyance of the land in this title dated 1 June 1985 contains the following provision:
   "The Purchaser hereby covenants with the Vendor to contribute and pay one equal share of the cost of maintaining repairing and renewing the shared driveway shown coloured brown on the plan."`;

    const blob = new Blob([sampleText], { type: "text/plain" });
    const file = new File([blob], "sample-title-register.txt", {
      type: "text/plain",
    });
    upload(file);
  }, [upload]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Upload area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative rounded-2xl border-2 border-dashed p-12
          transition-all duration-300 cursor-pointer
          ${
            isDragging
              ? "border-homey-lime bg-homey-lime/5 scale-[1.02]"
              : "border-border hover:border-homey-purple/50 hover:bg-muted/30"
          }
        `}
      >
        <input
          id="file-upload"
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div
            animate={isDragging ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
            className={`
              p-4 rounded-2xl
              ${isDragging ? "bg-homey-lime/10" : "bg-muted"}
            `}
          >
            <Upload
              className={`w-8 h-8 ${isDragging ? "text-homey-lime" : "text-muted-foreground"}`}
            />
          </motion.div>

          <div>
            <p className="text-lg font-semibold text-foreground">
              Drop your document here
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse • PDF or DOCX • Max {MAX_FILE_SIZE_MB}MB
            </p>
          </div>
        </div>
      </div>

      {/* Selected file info */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-homey-lime" />
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                onClick={handleUpload}
                disabled={isLoading}
                className="bg-homey-lime text-homey-black hover:bg-homey-lime-dim font-medium"
              >
                Analyse Document
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation error */}
      <AnimatePresence>
        {(validationError || errorMessage) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError || errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sample document button */}
      <div className="mt-8 text-center">
        <Button
          id="try-sample-button"
          variant="outline"
          onClick={handleSampleDocument}
          disabled={isLoading}
          className="border-homey-purple/30 text-homey-purple-light hover:bg-homey-purple/10 hover:border-homey-purple/50"
        >
          <FileText className="w-4 h-4 mr-2" />
          Try with sample document
        </Button>
      </div>
    </motion.div>
  );
}
