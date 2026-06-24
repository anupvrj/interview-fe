"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { FileText, Loader2, Upload, X } from "lucide-react";
import type { Resume } from "@/lib/api";
import { extractTextFromPDF } from "@/lib/pdf-utils";
import {
  RESUME_IMPORT_MAX_BYTES,
  pdfResumeDropzoneAccept,
  pdfResumeFileValidator,
} from "@/lib/pdf-dropzone";
import {
  importResumeFromExtractedText,
  RESUME_IMPORT_PROCESSING_MESSAGES,
} from "@/lib/resume-data-import";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { appPrimaryButton } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import { ResumeImportProcessingView } from "@/components/resume-editor/ResumeImportProcessingView";

type ImportPhase = "upload" | "processing" | "error";

interface ImportResumeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: string;
  templateId: string;
  layout: Resume["layout"] | null | undefined;
  onImported: (resume: Resume) => void;
}

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function ImportResumeDialog({
  open,
  onOpenChange,
  resumeId,
  templateId,
  layout,
  onImported,
}: ImportResumeDialogProps) {
  const [phase, setPhase] = useState<ImportPhase>("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [extractingText, setExtractingText] = useState(false);
  const [processingMessageIndex, setProcessingMessageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setPhase("upload");
    setUploadedFile(null);
    setResumeText("");
    setExtractingText(false);
    setProcessingMessageIndex(0);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  useEffect(() => {
    if (phase !== "processing") {
      setProcessingMessageIndex(0);
      return;
    }

    const lastIndex = RESUME_IMPORT_PROCESSING_MESSAGES.length - 1;
    const interval = setInterval(() => {
      setProcessingMessageIndex((prev) =>
        prev >= lastIndex ? prev : prev + 1,
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [phase]);

  const runImport = useCallback(
    async (text: string) => {
      setPhase("processing");
      setErrorMessage(null);

      try {
        const updated = await importResumeFromExtractedText(
          resumeId,
          templateId,
          text,
          { layout: layout ?? undefined },
        );
        onImported(updated);
        onOpenChange(false);
      } catch (error: unknown) {
        console.error("Resume import failed:", error);
        const err = error as {
          response?: { data?: { message?: string } };
          message?: string;
          code?: string;
        };

        if (
          err?.code === "ECONNABORTED" ||
          err?.message?.includes("timeout") ||
          err?.message?.includes("Request timeout")
        ) {
          setErrorMessage(
            "Import is taking longer than expected. Try a smaller PDF or check your connection.",
          );
        } else {
          setErrorMessage(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to import resume. Please try again.",
          );
        }
        setPhase("error");
      }
    },
    [layout, onImported, onOpenChange, resumeId, templateId],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        const err = fileRejections[0].errors[0];
        setErrorMessage(
          err.code === "file-too-large"
            ? "File size must be less than 5 MB"
            : err.message || "Only PDF files are allowed",
        );
        setPhase("error");
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      setUploadedFile(file);
      setExtractingText(true);
      setErrorMessage(null);
      setPhase("upload");

      try {
        const text = await extractTextFromPDF(file);
        if (!text.trim()) {
          throw new Error(
            "Could not read text from this PDF. Try a text-based PDF export.",
          );
        }
        setResumeText(text);
        setExtractingText(false);
        await runImport(text);
      } catch (error: unknown) {
        console.error("PDF text extraction failed:", error);
        setExtractingText(false);
        setUploadedFile(null);
        setResumeText("");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to extract text from PDF.",
        );
        setPhase("error");
      }
    },
    [runImport],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: pdfResumeDropzoneAccept,
    maxSize: RESUME_IMPORT_MAX_BYTES,
    maxFiles: 1,
    validator: pdfResumeFileValidator,
    disabled: phase === "processing" || extractingText,
  });

  const handleOpenChange = (next: boolean) => {
    if (phase === "processing") return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import from resume</DialogTitle>
          <DialogDescription>
            Upload your existing PDF resume to replace editor content with
            AI-extracted sections mapped to your current template.
          </DialogDescription>
        </DialogHeader>

        {phase === "processing" && uploadedFile ? (
          <ResumeImportProcessingView
            fileName={uploadedFile.name}
            messageIndex={processingMessageIndex}
          />
        ) : (
          <div className="space-y-4">
            {phase === "error" && errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {errorMessage}
              </div>
            ) : null}

            {!uploadedFile ? (
              <div
                {...getRootProps()}
                className={cn(
                  "cursor-pointer rounded-xl border-2 border-dashed border-[#7367F0]/30 bg-gradient-to-br from-[#7367F0]/[0.04] via-card to-[#7367F0]/[0.08] p-8 text-center transition-colors",
                  isDragActive && "border-primary/50 bg-primary/[0.06]",
                  extractingText && "pointer-events-none opacity-70",
                )}
              >
                <input {...getInputProps()} />
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  {extractingText ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-8 w-8 text-primary" />
                  )}
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">
                  {extractingText
                    ? "Reading your PDF…"
                    : isDragActive
                      ? "Drop your resume here"
                      : "Select or drag your resume PDF"}
                </h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  We&apos;ll extract and map sections to your current template
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF only · max {formatFileSize(RESUME_IMPORT_MAX_BYTES)}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-8 w-8 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {uploadedFile.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(uploadedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUploadedFile(null);
                    setResumeText("");
                    setPhase("upload");
                    setErrorMessage(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {uploadedFile && resumeText && phase === "upload" ? (
              <Button
                type="button"
                className={cn("w-full", appPrimaryButton)}
                onClick={() => runImport(resumeText)}
                disabled={extractingText}
              >
                Import resume data
              </Button>
            ) : null}

            {phase === "error" ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={resetState}
              >
                Try again
              </Button>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
