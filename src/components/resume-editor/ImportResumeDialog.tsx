"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResumeBuilderImportMethodToggle } from "@/components/resume-builder/ResumeBuilderImportMethodToggle";
import { ResumeBuilderLinkedInForm } from "@/components/resume-builder/ResumeBuilderLinkedInForm";
import { ResumeBuilderPdfDropzone } from "@/components/resume-builder/ResumeBuilderPdfDropzone";
import { ResumeBuilderProcessingView } from "@/components/resume-builder/ResumeBuilderProcessingView";
import {
  resumeBuilderErrorBanner,
  resumeBuilderFooterActions,
  resumeBuilderOutlineButton,
  resumeBuilderPrimaryButton,
} from "@/components/resume-builder/resumeBuilderStyles";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

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

  const resolveImportError = useCallback(
    (error: unknown, source: ImportMethod) => {
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
    },
    [],
  );

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
    [
      layout,
      onImported,
      onOpenChange,
      resolveImportError,
      resumeId,
      templateId,
    ],
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

  const maxSizeLabel = `${(RESUME_IMPORT_MAX_BYTES / 1024 / 1024).toFixed(0)} MB`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          appCard,
          "gap-0 overflow-hidden border-primary/15 p-0",
          phase === "processing" ? "sm:max-w-4xl" : "sm:max-w-lg",
        )}
      >
        <DialogHeader className="space-y-2 border-b border-border/60 bg-gradient-to-br from-[#7367F0]/[0.05] via-card to-transparent px-6 pb-5 pt-6">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Import resume data
          </DialogTitle>
          <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
            Replace your current editor content with AI-mapped sections from a
            PDF resume or your LinkedIn profile.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5">
          {phase === "processing" && processingLabel ? (
            <ResumeBuilderProcessingView
              label={processingLabel}
              messageIndex={processingMessageIndex}
              messages={RESUME_IMPORT_PROCESSING_MESSAGES}
            />
          ) : (
            <div className="space-y-5">
              <ResumeBuilderImportMethodToggle
                value={importMethod}
                onChange={switchImportMethod}
              />

              {phase === "error" && errorMessage ? (
                <div className={resumeBuilderErrorBanner}>{errorMessage}</div>
              ) : null}

              {importMethod === "pdf" ? (
                <ResumeBuilderPdfDropzone
                  compact
                  uploadedFile={uploadedFile}
                  extracting={extractingText}
                  isDragActive={isDragActive}
                  maxSizeLabel={maxSizeLabel}
                  getRootProps={getRootProps}
                  getInputProps={getInputProps}
                  onRemoveFile={() => {
                    setUploadedFile(null);
                    setResumeText("");
                    setPhase("upload");
                    setErrorMessage(null);
                  }}
                  footer={
                    uploadedFile && resumeText && phase === "upload" ? (
                      <Button
                        type="button"
                        className={cn("w-full", resumeBuilderPrimaryButton)}
                        onClick={() =>
                          runPdfImport(resumeText, uploadedFile.name)
                        }
                        disabled={extractingText}
                      >
                        Import resume data
                      </Button>
                    ) : null
                  }
                />
              ) : (
                <ResumeBuilderLinkedInForm
                  id="edit-linkedin-handle"
                  value={linkedinHandle}
                  onChange={setLinkedinHandle}
                  onSubmit={() => void runLinkedInImport()}
                  footer={
                    <div className={resumeBuilderFooterActions}>
                      {phase === "error" ? (
                        <Button
                          type="button"
                          variant="outline"
                          className={cn("w-full sm:w-auto", resumeBuilderOutlineButton)}
                          onClick={resetState}
                        >
                          Try again
                        </Button>
                      ) : (
                        <span className="hidden sm:block" />
                      )}
                      <Button
                        type="button"
                        className={cn("w-full sm:w-auto", resumeBuilderPrimaryButton)}
                        onClick={() => void runLinkedInImport()}
                        disabled={!linkedinHandle.trim()}
                      >
                        Import from LinkedIn
                      </Button>
                    </div>
                  }
                />
              )}

              {importMethod === "pdf" && phase === "error" ? (
                <Button
                  type="button"
                  variant="outline"
                  className={cn("w-full", resumeBuilderOutlineButton)}
                  onClick={resetState}
                >
                  Try again
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
