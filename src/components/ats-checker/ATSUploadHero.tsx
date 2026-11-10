"use client";

import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { dash2026Scope, Eyebrow } from "@/components/dashboard-2026/ui";
import { cn } from "@/lib/utils";
import {
  PDF_RESUME_MAX_BYTES,
  pdfResumeDropzoneAccept,
  pdfResumeFileValidator,
} from "@/lib/pdf-dropzone";
import type { FileRejection } from "react-dropzone";

interface ATSUploadHeroProps {
  onStart: (file: File, jobDescription: string) => void;
  uploading?: boolean;
  error?: string | null;
  compact?: boolean;
  showSignInHint?: boolean;
  onSignInRequired?: () => void;
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
  const [jdOpen, setJdOpen] = useState(false);
  const [localJd, setLocalJd] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (error) setOpen(true);
  }, [error]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (uploading && !nextOpen) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      setJdOpen(false);
      setLocalJd("");
      setLocalError(null);
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
    onStart(file, localJd.trim());
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    accept: pdfResumeDropzoneAccept,
    maxSize: PDF_RESUME_MAX_BYTES,
    validator: pdfResumeFileValidator,
    multiple: false,
    disabled: uploading,
  });

  const displayError = localError || error;

  return (
    <>
      <div className={cn("space-y-4", compact ? "max-w-xl" : "max-w-lg")}>
        <Button
          type="button"
          size="lg"
          onClick={() => setOpen(true)}
          className="h-12 rounded-xl px-6 text-[15.5px] bg-primary text-white shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90"
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
            Get your score free, no sign-up needed.
          </p>
        )}
        {!open && displayError && (
          <p className="text-sm text-destructive">{displayError}</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className={cn(dash2026Scope, "gap-0 overflow-hidden rounded-[22px] p-0 sm:max-w-[480px]")}>
          <div className="flex max-h-[85vh] flex-col gap-5 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
            <DialogHeader className="space-y-2 pr-8 text-left">
              <Eyebrow>ATS CHECK</Eyebrow>
              <DialogTitle className="text-[24px] font-black tracking-[-0.04em]">Upload your resume</DialogTitle>
              <DialogDescription>Your check starts as soon as you add the file.</DialogDescription>
            </DialogHeader>

            <div
              {...getRootProps()}
              className={cn(
                "cursor-pointer rounded-[18px] border-2 border-dashed bg-muted/30 p-8 text-center transition-all",
                isDragActive ? "border-primary bg-primary/5" : "border-primary/40 hover:border-primary",
                uploading && "pointer-events-none opacity-60",
              )}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto mb-4 h-10 w-10 text-primary" />
              <p className="mb-1 font-semibold text-foreground">Drop your resume here or choose a file</p>
              <p className="text-sm text-muted-foreground">PDF only. Max 2MB.</p>
              <p className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" /> Privacy guaranteed
              </p>
            </div>

            {jdOpen ? (
              <textarea
                value={localJd}
                onChange={(e) => setLocalJd(e.target.value)}
                autoFocus
                aria-label="Job description"
                placeholder="Paste the job description, then add your resume."
                className="min-h-[120px] w-full resize-y rounded-xl border border-border bg-card p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            ) : (
              <button
                type="button"
                onClick={() => setJdOpen(true)}
                className="flex min-h-8 items-center gap-1.5 self-start text-[13.5px] font-medium text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add a job description (optional)
              </button>
            )}

            {displayError && <p className="text-sm text-destructive">{displayError}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
