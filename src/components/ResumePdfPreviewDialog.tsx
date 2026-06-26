"use client";

import { useEffect, useState } from "react";
import { Resume, ResumeTemplate } from "@/lib/api";
import { PaginatedPreview } from "@/components/PaginatedPreview";
import { TemplateStyleLoader } from "@/components/TemplateStyleLoader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ResumePdfPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resume: Resume;
  template: ResumeTemplate;
  sections?: unknown[];
  layout?: {
    type: "single" | "double";
    columnWidths?: { left: number; right: number };
    padding?: { top: number; bottom: number; left: number; right: number };
    dismissedEmptyTrailingPages?: number;
  };
}

export function ResumePdfPreviewDialog({
  open,
  onOpenChange,
  resume,
  template,
  sections,
  layout,
}: ResumePdfPreviewDialogProps) {
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    if (open) {
      setRenderKey((key) => key + 1);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] max-h-[92vh] w-[calc(210mm+4rem)] max-w-[96vw] flex-col gap-0 overflow-hidden border-border/60 bg-zinc-950 p-0 shadow-2xl sm:rounded-xl [&>button]:text-zinc-300 [&>button]:hover:text-white">
        <DialogHeader className="shrink-0 border-b border-white/10 px-5 py-3 text-left">
          <DialogTitle className="text-base text-white">PDF Preview</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Full resume preview — how it will look when exported
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-800/90 px-4 py-8 sm:px-8">
          <div className="mx-auto flex w-full justify-center">
            <TemplateStyleLoader templateId={template.id} />
            <PaginatedPreview
              key={`pdf-preview-${renderKey}`}
              resume={resume}
              template={template}
              sections={sections}
              layout={layout}
              dismissedEmptyTrailingPages={
                layout?.dismissedEmptyTrailingPages ?? 0
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
