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
        "min-w-0 overflow-hidden px-1 py-2 sm:px-0 sm:py-4",
        className,
      )}
    >
      <ResumeImportProcessingView
        fileName={label}
        messageIndex={messageIndex}
        messages={messages}
      />
    </div>
  );
}
