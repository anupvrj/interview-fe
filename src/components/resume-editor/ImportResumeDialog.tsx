"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { FileText, Linkedin, Loader2, Upload, X } from "lucide-react";
import type { Resume } from "@/lib/api";
import { extractTextFromPDF } from "@/lib/pdf-utils";
import {
  RESUME_IMPORT_MAX_BYTES,
  pdfResumeDropzoneAccept,
  pdfResumeFileValidator,
} from "@/lib/pdf-dropzone";
import {
  importResumeFromExtractedText,
  importResumeFromLinkedIn,
  RESUME_IMPORT_PROCESSING_MESSAGES,
} from "@/lib/resume-data-import";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type ImportMethod = "pdf" | "linkedin";
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
  const [importMethod, setImportMethod] = useState<ImportMethod>("pdf");
  const [phase, setPhase] = useState<ImportPhase>("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [linkedinHandle, setLinkedinHandle] = useState("");
  const [extractingText, setExtractingText] = useState(false);
  const [processingMessageIndex, setProcessingMessageIndex] = useState(0);
  const [processingLabel, setProcessingLabel] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setImportMethod("pdf");
    setPhase("upload");
    setUploadedFile(null);
    setResumeText("");
    setLinkedinHandle("");
    setExtractingText(false);
    setProcessingMessageIndex(0);
    setProcessingLabel("");
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

  const resolveImportError = useCallback((error: unknown, source: ImportMethod) => {
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
      return source === "linkedin"
        ? "Importing your LinkedIn profile is taking longer than expected. Please try again."
        : "Import is taking longer than expected. Try a smaller PDF or check your connection.";
    }

    return (
      err?.response?.data?.message ||
      err?.message ||
      (source === "linkedin"
        ? "Failed to import from LinkedIn. Please try again."
        : "Failed to import resume. Please try again.")
    );
  }, []);

  const runPdfImport = useCallback(
    async (text: string, fileName: string) => {
      setPhase("processing");
      setProcessingLabel(fileName);
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
        console.error("Resume PDF import failed:", error);
        setErrorMessage(resolveImportError(error, "pdf"));
        setPhase("error");
      }
    },
    [layout, onImported, onOpenChange, resolveImportError, resumeId, templateId],
  );

  const runLinkedInImport = useCallback(async () => {
    const handle = linkedinHandle.trim();
    if (!handle) {
      setErrorMessage("Please enter your LinkedIn profile URL or username.");
      setPhase("error");
      return;
    }

    setPhase("processing");
    setProcessingLabel(handle);
    setErrorMessage(null);

    try {
      const updated = await importResumeFromLinkedIn(
        resumeId,
        templateId,
        handle,
        { layout: layout ?? undefined },
      );
      onImported(updated);
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Resume LinkedIn import failed:", error);
      setErrorMessage(resolveImportError(error, "linkedin"));
      setPhase("error");
    }
  }, [
    layout,
    linkedinHandle,
    onImported,
    onOpenChange,
    resolveImportError,
    resumeId,
    templateId,
  ]);

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
        await runPdfImport(text, file.name);
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
    [runPdfImport],
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

  const switchImportMethod = (method: ImportMethod) => {
    if (method === importMethod || phase === "processing") return;
    setImportMethod(method);
    setUploadedFile(null);
    setResumeText("");
    setLinkedinHandle("");
    setErrorMessage(null);
    setPhase("upload");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import resume data</DialogTitle>
          <DialogDescription>
            Replace your current editor content with AI-mapped sections from a
            PDF resume or your LinkedIn profile.
          </DialogDescription>
        </DialogHeader>

        {phase === "processing" && processingLabel ? (
          <ResumeImportProcessingView
            fileName={processingLabel}
            messageIndex={processingMessageIndex}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 rounded-lg border border-border/80 bg-muted/30 p-1">
              <button
                type="button"
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  importMethod === "pdf"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => switchImportMethod("pdf")}
              >
                <FileText className="h-4 w-4" />
                PDF
              </button>
              <button
                type="button"
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  importMethod === "linkedin"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => switchImportMethod("linkedin")}
              >
                <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                LinkedIn
              </button>
            </div>

            {phase === "error" && errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {errorMessage}
              </div>
            ) : null}

            {importMethod === "pdf" ? (
              <>
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
                      We&apos;ll extract and map sections to your current
                      template
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
                    onClick={() => runPdfImport(resumeText, uploadedFile.name)}
                    disabled={extractingText}
                  >
                    Import resume data
                  </Button>
                ) : null}
              </>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#0A66C2]/20 bg-[#0A66C2]/[0.04] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0A66C2]">
                      <Linkedin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Import from LinkedIn
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        We&apos;ll fetch your public profile, enhance it for
                        ATS, and replace your current resume sections.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="edit-linkedin-handle"
                    className="block text-sm font-medium text-foreground"
                  >
                    LinkedIn profile URL or username
                  </label>
                  <Input
                    id="edit-linkedin-handle"
                    value={linkedinHandle}
                    onChange={(e) => setLinkedinHandle(e.target.value)}
                    placeholder="https://www.linkedin.com/in/your-username  or  your-username"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && linkedinHandle.trim()) {
                        void runLinkedInImport();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: https://www.linkedin.com/in/john-doe or john-doe
                  </p>
                </div>

                <Button
                  type="button"
                  className={cn("w-full", appPrimaryButton)}
                  onClick={() => void runLinkedInImport()}
                  disabled={!linkedinHandle.trim()}
                >
                  Import from LinkedIn
                </Button>
              </div>
            )}

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
