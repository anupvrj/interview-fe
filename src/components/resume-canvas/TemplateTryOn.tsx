"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { Resume, ResumeTemplate } from "@/lib/api";
import { ResumePdfPreviewDialog } from "@/components/ResumePdfPreviewDialog";
import { Button } from "@/components/ui/button";
import { buildResumeTemplateApplication } from "@/lib/applyResumeTemplate";
import { cssRegistry } from "@/lib/templateLoader";
import { CanvasEditProvider } from "./CanvasEditContext";

/**
 * Full-screen preview of *this* resume in another template, laid out exactly as
 * applying it would (same layout/section order), with Apply in the header.
 */
export function TemplateTryOn({
  resume,
  template,
  currentTemplateId,
  compact,
  applying,
  onApply,
  onClose,
}: {
  resume: Resume;
  template: ResumeTemplate | null;
  currentTemplateId: string;
  compact: boolean;
  applying: boolean;
  onApply: (templateId: string) => void;
  onClose: () => void;
}) {
  const [prepared, setPrepared] = useState<{ resume: Resume; sections: unknown[] } | null>(null);

  useEffect(() => {
    if (!template) {
      setPrepared(null);
      return;
    }
    let cancelled = false;
    (async () => {
      await cssRegistry.loadTemplateCSS(template.id);
      const application = await buildResumeTemplateApplication(template.id, {
        content: resume.content,
        sectionOrder: resume.sectionOrder,
      });
      if (cancelled) return;
      setPrepared({
        resume: { ...resume, templateId: template.id, layout: application.layout, sectionOrder: application.sectionOrder } as Resume,
        sections: (application.sectionOrder ?? []) as unknown[],
      });
    })().catch((error) => console.error("Template preview failed:", error));
    return () => {
      cancelled = true;
    };
  }, [template, resume]);

  const close = () => {
    // The registry keeps one template's CSS at a time — put the editor's back.
    void cssRegistry.loadTemplateCSS(currentTemplateId);
    setPrepared(null);
    onClose();
  };

  if (!template) return null;
  if (!prepared) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }
  return (
    <CanvasEditProvider value={null}>
      <ResumePdfPreviewDialog
        open
        onOpenChange={(open) => {
          if (!open) close();
        }}
        resume={prepared.resume}
        template={template}
        sections={prepared.sections}
        layout={prepared.resume.layout as never}
        compact={compact}
        title={template.name}
        actions={
          template.id === currentTemplateId ? (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">Current design</span>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={applying}
              onClick={() => {
                onApply(template.id);
                close();
              }}
            >
              {applying ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
              Apply this design
            </Button>
          )
        }
      />
    </CanvasEditProvider>
  );
}
