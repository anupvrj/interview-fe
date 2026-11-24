"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { PaginatedPreview } from "@/components/PaginatedPreview";
import { CanvasEditProvider } from "@/components/resume-canvas/CanvasEditContext";
import { resumeApi, type Resume, type ResumeTemplate } from "@/lib/api";
import { buildResumeTemplateApplication, type ApplyResumeTemplateResult } from "@/lib/applyResumeTemplate";
import { cssRegistry } from "@/lib/templateLoader";
import { cn } from "@/lib/utils";

/** A4 at 96dpi, the width PaginatedPreview lays pages out at. */
const PAGE_WIDTH = 794;
/** Each page on its own sheet: no gap to fill after the last one. */
const PAGE_STACK = "[&_.resume-page]:ring-1 [&_.resume-page]:ring-slate-900/5 [&_.relative.mb-5:last-child]:!mb-0";

/** Their real content in a template: the same thing they'll edit after signing up. */
export function ResumeTemplatePreview({ templateId, content, sectionOrder }: { templateId: string; content?: Record<string, unknown>; sectionOrder?: unknown[] }) {
  const [shown, setShown] = useState<{ template: ResumeTemplate; application: ApplyResumeTemplateResult } | null>(null);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(0.6);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!content) return;
    let cancelled = false;
    (async () => {
      try {
        const [template, application] = await Promise.all([
          resumeApi.getTemplate(templateId),
          buildResumeTemplateApplication(templateId, { content, sectionOrder } as Pick<Resume, "content" | "sectionOrder">),
          cssRegistry.loadTemplateCSS(templateId),
        ]);
        if (!cancelled) setShown({ template, application });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateId, content, sectionOrder]);

  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const fit = () => setZoom(el.clientWidth / PAGE_WIDTH);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const resume = shown && ({
    resumeId: "ats-preview",
    userId: "",
    title: "Your resume",
    templateId: shown.application.templateId,
    content,
    sectionOrder: shown.application.sectionOrder,
    layout: shown.application.layout,
    profileSummary: typeof content?.profileSummary === "string" ? content.profileSummary : "",
  } as unknown as Resume);

  return (
    <div ref={frame} className="w-full">
      {failed || !content ? (
        <p className="rounded-lg bg-white py-16 text-center text-[14px] text-slate-500">The preview couldn&apos;t load. Your resume is safe.</p>
      ) : !shown || !resume ? (
        <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        // the pages bring their own paper and shadow; this only drops the gap after the last one
        <div className={cn("pointer-events-none [&_.resume-page]:!shadow-none [&_.resume-page]:rounded-[6px]", PAGE_STACK)} style={{ zoom }}>
          <CanvasEditProvider value={null}>
            <PaginatedPreview resume={resume} template={shown.template} sections={shown.application.sectionOrder} layout={shown.application.layout} />
          </CanvasEditProvider>
        </div>
      )}
    </div>
  );
}
