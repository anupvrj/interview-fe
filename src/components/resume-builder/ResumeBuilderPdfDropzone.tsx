"use client";

import type { ReactNode } from "react";
import { CloudUpload, Loader2 } from "lucide-react";
import {
  resumeBuilderDropzone,
  resumeBuilderDropzoneActive,
  resumeBuilderHeroCard,
} from "./resumeBuilderStyles";
import { ResumeReadingProgress } from "./ResumeReadingProgress";
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
  /** Closest-design match running after the upload (null when it doesn't apply). */
  matchingDesign?: boolean | null;
  /** Parts found in the uploaded resume's text. */
  parts?: string[] | null;
  /** The uploaded resume's look in words. */
  layout?: { label: string; color?: string }[] | null;
  /** The closest of our designs, by name. */
  closestName?: string | null;
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
  matchingDesign = null,
  parts = null,
  layout = null,
  closestName = null,
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
              "group cursor-pointer border-primary/35 hover:border-primary/70 hover:bg-primary/[0.04]",
              compact ? "py-8" : "py-10 sm:py-12",
              isDragActive && resumeBuilderDropzoneActive,
              extracting && "pointer-events-none opacity-70",
            )}
          >
            <input {...getInputProps()} />
            {/* a page lifting out of the drop area */}
            <div className={cn("relative mx-auto mb-5 h-[76px] w-[60px] transition-transform duration-300", isDragActive ? "-translate-y-2 rotate-[-4deg]" : "group-hover:-translate-y-1")}>
              <div className="absolute inset-0 rotate-[-8deg] rounded-lg border border-border bg-card opacity-70" />
              <div className="absolute inset-0 grid place-items-center rounded-lg border border-primary/25 bg-card shadow-[0_14px_30px_-16px_rgba(75,63,208,.6)]">
                {extracting ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <CloudUpload className="h-6 w-6 text-primary" />}
              </div>
            </div>
            <h3 className="text-[19px] font-bold tracking-tight text-foreground sm:text-[21px]">
              {isDragActive ? "Drop it here" : "Drop your old resume here"}
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-[13.5px] text-muted-foreground">
              We pull out every section and suggest the design closest to yours.
            </p>
            <span className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#7367F0] to-[#1F8FFF] px-6 text-[14.5px] font-semibold text-white shadow-[0_12px_28px_-12px_rgba(115,103,240,.9)] transition-transform group-hover:-translate-y-0.5">
              <CloudUpload className="h-4 w-4" /> Choose a PDF
            </span>
            <p className="mt-4 font-[family-name:var(--font-geist-mono)] text-[11px] text-muted-foreground/80">PDF ONLY · MAX {maxSizeLabel.toUpperCase()}</p>
          </div>
        ) : (
          <ResumeReadingProgress
            key={`${uploadedFile.name}-${uploadedFile.lastModified}`}
            file={uploadedFile}
            reading={extracting}
            matchingDesign={matchingDesign}
            parts={parts}
            layout={layout}
            closestName={closestName}
            onRemove={onRemoveFile}
          />
        )}
      </div>

      {footer}
    </div>
  );
}
