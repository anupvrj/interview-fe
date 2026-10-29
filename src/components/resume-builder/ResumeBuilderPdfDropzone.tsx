"use client";

import type { ReactNode } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  resumeBuilderDropzone,
  resumeBuilderDropzoneActive,
  resumeBuilderHeroCard,
} from "./resumeBuilderStyles";
import { cn } from "@/lib/utils";

interface ResumeBuilderPdfDropzoneProps {
  uploadedFile: File | null;
  extracting?: boolean;
  isDragActive?: boolean;
  maxSizeLabel: string;
  templateName?: string;
  getRootProps: () => Record<string, unknown>;
  getInputProps: () => Record<string, unknown>;
  onRemoveFile: () => void;
  footer?: ReactNode;
  compact?: boolean;
}

export function ResumeBuilderPdfDropzone({
  uploadedFile,
  extracting = false,
  isDragActive = false,
  maxSizeLabel,
  templateName,
  getRootProps,
  getInputProps,
  onRemoveFile,
  footer,
  compact = false,
}: ResumeBuilderPdfDropzoneProps) {
  return (
    <div className="space-y-5">
      {!compact && templateName ? (
        <p className="text-[13.5px] text-muted-foreground">
          Going into <b className="font-semibold text-foreground">{templateName}</b>. No PDF to hand? Skip and start from the template&apos;s sample content.
        </p>
      ) : null}

      <div className={cn(resumeBuilderHeroCard, "p-2")}>
        {!uploadedFile ? (
          <div
            {...getRootProps()}
            className={cn(
              resumeBuilderDropzone,
              compact && "py-8",
              isDragActive && resumeBuilderDropzoneActive,
              extracting && "pointer-events-none opacity-70",
            )}
          >
            <input {...getInputProps()} />
            {/* a page lifting out of the drop area */}
            <div className={cn("relative mx-auto mb-5 h-[76px] w-[60px] transition-transform duration-300", isDragActive ? "-translate-y-2 rotate-[-4deg]" : "")}>
              <div className="absolute inset-0 rotate-[-8deg] rounded-lg border border-border bg-card opacity-70" />
              <div className="absolute inset-0 grid place-items-center rounded-lg border border-primary/25 bg-card shadow-[0_14px_30px_-16px_rgba(75,63,208,.6)]">
                {extracting ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-primary" />}
              </div>
            </div>
            <h3 className="text-[18px] font-bold tracking-tight text-foreground">
              {extracting ? "Reading your PDF…" : isDragActive ? "Drop it here" : "Drag your resume PDF here"}
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-[13.5px] text-muted-foreground">
              {extracting ? "Pulling out your sections." : <>or <span className="font-semibold text-primary underline decoration-primary/40 underline-offset-4">browse your files</span> · we map every section to your template</>}
            </p>
            <p className="mt-4 font-[family-name:var(--font-geist-mono)] text-[11px] text-muted-foreground/80">PDF ONLY · MAX {maxSizeLabel.toUpperCase()}</p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                <FileText className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-foreground">{uploadedFile.name}</p>
                <p className="text-[13px] text-muted-foreground">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB · {extracting ? "reading…" : "ready to import"}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove file"
              className="shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={onRemoveFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {footer}
    </div>
  );
}
