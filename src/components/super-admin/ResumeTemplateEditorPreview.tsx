"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Resume, ResumeTemplate } from "@/lib/api";
import { PaginatedPreview } from "@/components/PaginatedPreview";
import { CanvasEditProvider } from "@/components/resume-canvas/CanvasEditContext";
import { buildLayoutFromTemplate, buildResumeTemplateApplication } from "@/lib/applyResumeTemplate";
import { applyConfigOverrides, type ResumeTemplateOverrides } from "@/lib/resume-template-overrides";
import { cssRegistry, TemplateLoader, type TemplateConfig } from "@/lib/templateLoader";
import type { ExtendedResumeTemplate } from "@/configs/resume-templates/template-types";

const PAGE_WIDTH_PX = 794; // 210mm at 96dpi

type Base = { code: TemplateConfig; content: Resume["content"]; sectionOrder: Resume["sectionOrder"] };

/**
 * The template's sample resume rendered by the real resume renderer, with the unsaved
 * edits applied (CSS and config), scaled to fit the column.
 */
export function ResumeTemplateEditorPreview({
  templateId,
  draft,
}: Readonly<{ templateId: string; draft: ResumeTemplateOverrides | null }>) {
  const [base, setBase] = useState<Base | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState<ResumeTemplateOverrides | null>(draft);
  const [width, setWidth] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [code, content] = await Promise.all([
        TemplateLoader.loadCodeTemplate(templateId),
        TemplateLoader.loadDummyContent(templateId),
      ]);
      const application = await buildResumeTemplateApplication(templateId, { content });
      if (!cancelled) setBase({ code, content, sectionOrder: application.sectionOrder });
    })().catch((e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? e.message : "Preview failed");
    });
    return () => {
      cancelled = true;
      // put the published CSS back for anything else on the page
      void cssRegistry.loadTemplateCSS(templateId);
    };
  }, [templateId]);

  // Re-render a moment after the last change, not on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setShown(draft), 250);
    return () => clearTimeout(id);
  }, [draft]);

  const [cssReady, setCssReady] = useState<string | null>(null);
  const editsKey = JSON.stringify(shown ?? null);
  useEffect(() => {
    let cancelled = false;
    void cssRegistry.loadTemplateCSS(templateId, { overrides: shown ?? null }).then(() => {
      if (!cancelled) setCssReady(editsKey);
    });
    return () => {
      cancelled = true;
    };
  }, [templateId, shown, editsKey]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const view = useMemo(() => {
    if (!base) return null;
    const config = applyConfigOverrides(base.code, shown);
    const extended = { ...config.template, ...config.extended } as ExtendedResumeTemplate;
    const layout = buildLayoutFromTemplate(extended);
    const template = { ...config.template, previewOverrides: shown ?? null } as ResumeTemplate;
    const resume = {
      resumeId: `template-preview-${templateId}`,
      userId: "preview",
      title: "Preview",
      templateId,
      content: base.content,
      sectionOrder: base.sectionOrder,
      layout,
    } as unknown as Resume;
    return { template, resume, layout };
  }, [base, shown, templateId]);

  const scale = width > 0 ? Math.min(1, width / PAGE_WIDTH_PX) : 0.5;

  // The scaled page still takes its full height in the layout; size the frame to what shows.
  const pageRef = useRef<HTMLDivElement>(null);
  const [pageHeight, setPageHeight] = useState(0);
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPageHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [view, cssReady]);

  return (
    <div ref={boxRef} className="w-full">
      {error ? (
        <p className="py-10 text-center text-sm text-destructive">{error}</p>
      ) : !view || cssReady !== editsKey ? (
        <div className="flex aspect-[210/297] items-center justify-center rounded-lg bg-muted/40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-zinc-200/70 dark:bg-zinc-800/60" style={{ height: pageHeight ? pageHeight * scale : undefined }}>
          <div ref={pageRef} style={{ width: PAGE_WIDTH_PX, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <CanvasEditProvider value={null}>
              <PaginatedPreview
                key={editsKey}
                resume={view.resume}
                template={view.template}
                sections={view.resume.sectionOrder as unknown[]}
                layout={view.layout}
              />
            </CanvasEditProvider>
          </div>
        </div>
      )}
    </div>
  );
}
