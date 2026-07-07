"use client";

import type { ReactNode } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  resumeBuilderDropzone,
  resumeBuilderDropzoneActive,
  resumeBuilderHeroCard,
  resumeBuilderInfoBanner,
  resumeBuilderPrimaryIconShell,
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
        <div className={resumeBuilderInfoBanner}>
          <div className="flex items-start gap-4">
            <div className={resumeBuilderPrimaryIconShell}>
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-foreground">
                Template: {templateName}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Upload an existing PDF to auto-fill sections with AI, or skip and
                start from polished template defaults.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className={cn(resumeBuilderHeroCard, "p-0")}>
        {!uploadedFile ? (
          <div
            {...getRootProps()}
            className={cn(
              resumeBuilderDropzone,
              isDragActive && resumeBuilderDropzoneActive,
              extracting && "pointer-events-none opacity-70",
            )}
          >
            <input {...getInputProps()} />
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/15">
              {extracting ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <Upload className="h-8 w-8 text-primary" />
              )}
            </div>
            <h3 className="text-base font-semibold text-foreground sm:text-lg">
              {extracting
                ? "Reading your PDF…"
                : isDragActive
                  ? "Drop your resume here"
                  : "Select or drag your resume PDF"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              We&apos;ll extract and map sections to your chosen template
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              PDF only · max {maxSizeLabel}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 p-5 sm:p-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                <FileText className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {uploadedFile.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-foreground"
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
