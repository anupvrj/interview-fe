"use client";

import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Lock, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  PDF_RESUME_MAX_BYTES,
  pdfResumeDropzoneAccept,
  pdfResumeFileValidator,
} from "@/lib/pdf-dropzone";
import type { FileRejection } from "react-dropzone";

type ModalStep = "upload" | "job-description";

interface ATSUploadHeroProps {
  onStart: (file: File, jobDescription: string) => void;
  uploading?: boolean;
  error?: string | null;
  compact?: boolean;
  showSignInHint?: boolean;
  onSignInRequired?: () => void;
}

function resetModalState(
  setModalStep: (step: ModalStep) => void,
  setPendingFile: (file: File | null) => void,
  setLocalJd: (value: string) => void,
  setWantsJd: (value: boolean | null) => void,
  setLocalError: (value: string | null) => void,
) {
  setModalStep("upload");
  setPendingFile(null);
  setLocalJd("");
  setWantsJd(null);
  setLocalError(null);
}

export function ATSUploadHero({
  onStart,
  uploading = false,
  error,
  compact = false,
  showSignInHint,
  onSignInRequired,
}: ATSUploadHeroProps) {
  const [open, setOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("upload");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [localJd, setLocalJd] = useState("");
  const [wantsJd, setWantsJd] = useState<boolean | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (uploading || error) {
      setOpen(true);
    }
  }, [uploading, error]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (uploading && !nextOpen) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      resetModalState(
        setModalStep,
        setPendingFile,
        setLocalJd,
        setWantsJd,
        setLocalError,
      );
    }
  };

  const handleFileDrop = (
    acceptedFiles: File[],
    fileRejections: FileRejection[],
  ) => {
    if (fileRejections.length > 0) {
      const err = fileRejections[0].errors[0];
      if (err.code === "file-too-large") {
        setLocalError("File size must be less than 2 MB");
      } else {
        setLocalError(err.message || "Only PDF files are allowed");
      }
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    if (onSignInRequired) {
      onSignInRequired();
      return;
    }

    setLocalError(null);
    setPendingFile(file);
    setModalStep("job-description");
    setWantsJd(null);
    setLocalJd("");
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    accept: pdfResumeDropzoneAccept,
    maxSize: PDF_RESUME_MAX_BYTES,
    validator: pdfResumeFileValidator,
    multiple: false,
    disabled: uploading,
  });

  const handleSkipJd = () => {
    if (!pendingFile || uploading) return;
    onStart(pendingFile, "");
  };

  const handleStartWithJd = () => {
    if (!pendingFile || uploading) return;
    onStart(pendingFile, localJd.trim());
  };

  const displayError = localError || error;

  return (
    <>
      <div className={cn("space-y-4", compact ? "max-w-xl" : "max-w-lg")}>
        <Button
          type="button"
          size="lg"
          onClick={() => setOpen(true)}
          className="h-12 px-8 text-base bg-primary text-white hover:bg-primary/90 shadow-lg"
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload Your Resume
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3 shrink-0" />
          PDF only · Max 2MB · Privacy guaranteed
        </p>
        {showSignInHint && (
          <p className="text-sm text-muted-foreground">
            Sign in after upload — your resume is saved and analysis continues
            automatically.
          </p>
        )}
        {!open && displayError && (
          <p className="text-sm text-red-600">{displayError}</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[480px]">
          <div className="flex max-h-[85vh] flex-col gap-6 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
          {modalStep === "upload" ? (
            <>
              <DialogHeader className="space-y-2 pr-8 text-left">
                <DialogTitle>Upload your resume</DialogTitle>
                <DialogDescription>
                  Choose a PDF resume first. We&apos;ll ask about a job description next.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div
                  {...getRootProps()}
                  className={cn(
                    "rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all bg-muted/30",
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-primary/40 hover:border-primary",
                    uploading && "opacity-60 pointer-events-none",
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-10 w-10 mx-auto text-primary mb-4" />
                  <p className="font-medium text-foreground mb-1">
                    Drop your resume here or choose a file
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF only. Max 2MB file size.
                  </p>
                  <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-4">
                    <Lock className="h-3 w-3" /> Privacy guaranteed
                  </p>
                </div>

                {showSignInHint && (
                  <p className="text-sm text-muted-foreground">
                    Sign in when you start analysis — your upload is remembered.
                  </p>
                )}

                {displayError && <p className="text-sm text-red-600">{displayError}</p>}
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="space-y-2 pr-8 text-left">
                <DialogTitle>Do you have a job description?</DialogTitle>
                <DialogDescription>
                  Paste it to unlock tailoring checks, or skip to run a general ATS score on your resume.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {pendingFile && (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {pendingFile.name}
                      </p>
                      <p className="text-xs text-emerald-700">Resume ready</p>
                    </div>
                  </div>
                )}

                {wantsJd === null ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full"
                      disabled={uploading}
                      onClick={() => setWantsJd(true)}
                    >
                      Yes, I have one
                    </Button>
                    <Button
                      type="button"
                      className="h-11 w-full bg-primary text-white hover:bg-primary/90"
                      disabled={uploading}
                      onClick={handleSkipJd}
                    >
                      Continue Without JD
                    </Button>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={localJd}
                      onChange={(e) => setLocalJd(e.target.value)}
                      autoFocus
                      placeholder="Paste the job description here for tailored keyword and skills matching..."
                      className="w-full min-h-[140px] rounded-xl border border-border bg-card p-4 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-muted-foreground shrink-0"
                        disabled={uploading}
                        onClick={() => setWantsJd(null)}
                      >
                        Back
                      </Button>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploading}
                          onClick={handleSkipJd}
                        >
                          Skip & analyze
                        </Button>
                        <Button
                          type="button"
                          className="bg-primary text-white hover:bg-primary/90"
                          disabled={uploading}
                          onClick={handleStartWithJd}
                        >
                          Start analysis
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {uploading && (
                  <p className="text-sm font-medium text-foreground text-center">
                    We are scanning your file...
                  </p>
                )}

                {displayError && <p className="text-sm text-red-600">{displayError}</p>}
              </div>
            </>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
