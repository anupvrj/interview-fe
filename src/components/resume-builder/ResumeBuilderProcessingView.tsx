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
    <div className={cn("py-2 sm:py-4", className)}>
      <ResumeImportProcessingView
        fileName={label}
        messageIndex={messageIndex}
        messages={messages}
      />
    </div>
  );
}
