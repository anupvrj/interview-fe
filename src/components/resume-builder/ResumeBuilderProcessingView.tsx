"use client";

import { ResumeImportProcessingView } from "@/components/resume-editor/ResumeImportProcessingView";
import { cn } from "@/lib/utils";

interface ResumeBuilderProcessingViewProps {
  label: string;
  messageIndex: number;
  messages: readonly string[];
  className?: string;
}

export function ResumeBuilderProcessingView({
  label,
  messageIndex,
  messages,
  className,
}: ResumeBuilderProcessingViewProps) {
  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden rounded-[22px] border border-border bg-card px-4 py-8 sm:px-8 sm:py-12",
        className,
      )}
    >
      <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative">
      <ResumeImportProcessingView
        fileName={label}
        messageIndex={messageIndex}
        messages={messages}
        headerLabel="Building your resume"
      />
      </div>
    </div>
  );
}
