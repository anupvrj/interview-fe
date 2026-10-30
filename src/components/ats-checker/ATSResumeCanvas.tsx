"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { PaginatedPreview } from "@/components/PaginatedPreview";
import { CanvasEditProvider } from "@/components/resume-canvas/CanvasEditContext";
import { locateMark, type CanvasMark } from "@/components/resume-canvas/CanvasInteractionLayer";
import { Mono } from "@/components/marketing-2026/primitives";
import { resumeApi, type Resume, type ResumeTemplate } from "@/lib/api";
import { cssRegistry } from "@/lib/templateLoader";
import { cn } from "@/lib/utils";

/** A4 at 96dpi, the width PaginatedPreview lays pages out at. */
const PAGE_W = 794;

type MarkBox = { id: string; tone: CanvasMark["tone"]; top: number; left: number; width: number; height: number };

/**
 * The resume as it prints, read-only, with every finding boxed on the page the same way the
 * editor's Fix panel shows them. Picking a box tells the report which check it belongs to.
 */
export function ATSResumeCanvas({
  resumeId,
  marks,
  activeIds,
  onPick,
  className,
}: {
  resumeId: string;
  marks: CanvasMark[];
  /** Marks of the check open in the report: outlined and scrolled to. */
  activeIds: Set<string>;
  onPick?: (markId: string) => void;
  className?: string;
}) {
  const [resume, setResume] = useState<Resume | null>(null);
  const [template, setTemplate] = useState<ResumeTemplate | null>(null);
  const [failed, setFailed] = useState(false);
  const [fit, setFit] = useState(0.6);
  const [zoomDelta, setZoomDelta] = useState(0);
  const [boxes, setBoxes] = useState<MarkBox[]>([]);
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const zoom = Math.min(1.4, Math.max(0.35, fit + zoomDelta));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await resumeApi.get(resumeId);
        const list = await resumeApi.getTemplates();
        const t = list.find((x) => x.id === r.templateId) ?? list[0] ?? null;
        if (t) await cssRegistry.loadTemplateCSS(t.id);
        if (!cancelled) {
          setResume(r);
          setTemplate(t);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resumeId]);

  // fit one page across the column
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFit(Math.min(1, Math.max(0.35, (el.clientWidth - 40) / PAGE_W))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // boxes are measured from the rendered text, relative to the (unzoomed) stage
  const measure = useCallback(() => {
    const root = pagesRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;
    const base = stage.getBoundingClientRect();
    const next: MarkBox[] = [];
    for (const mark of marks) {
      if (!mark.text || mark.text.length < 2) continue;
      for (const hit of locateMark(root, mark, 4)) {
        for (const r of hit.rects) {
          if (r.width < 1 || r.height < 1) continue;
          next.push({ id: mark.id, tone: mark.tone, top: r.top - base.top - 1, left: r.left - base.left - 2, width: r.width + 4, height: r.height + 2 });
        }
      }
    }
    setBoxes(next);
  }, [marks]);

  useEffect(() => {
    if (!resume || !template) return;
    // pagination settles over a few frames; measure again as it does
    const timers = [120, 600, 1500, 3000].map((ms) => window.setTimeout(measure, ms));
    const root = pagesRef.current;
    const ro = root ? new ResizeObserver(() => measure()) : null;
    if (root) ro!.observe(root);
    return () => {
      timers.forEach(clearTimeout);
      ro?.disconnect();
    };
  }, [resume, template, measure, zoom]);

  // bring the open check's first box into view inside the canvas
  useEffect(() => {
    const frame = frameRef.current;
    const first = boxes.find((b) => activeIds.has(b.id));
    if (!frame || !first) return;
    frame.scrollTo({ top: Math.max(0, first.top - 120), behavior: "smooth" });
  }, [activeIds, boxes]);

  const marked = new Set(boxes.map((b) => b.id)).size;

  return (
    <div className={cn("flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-border bg-[#E9E8F1] dark:bg-[#0B1424]", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Mono className="text-[11px] text-muted-foreground">YOUR RESUME</Mono>
          <span className="hidden items-center gap-1.5 text-[12px] text-muted-foreground sm:inline-flex">
            <span className="size-2.5 rounded-[3px] border border-rose-600/80 bg-rose-500/20" />
            {marked} {marked === 1 ? "issue" : "issues"} marked on the page
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Zoom out" onClick={() => setZoomDelta((z) => z - 0.1)} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><Minus className="h-3.5 w-3.5" /></button>
          <Mono className="w-10 text-center text-[11px] text-muted-foreground">{Math.round(zoom * 100)}%</Mono>
          <button type="button" aria-label="Zoom in" onClick={() => setZoomDelta((z) => z + 0.1)} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><Plus className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div ref={frameRef} className="relative min-h-0 flex-1 overflow-auto p-5">
        {failed ? (
          <p className="py-16 text-center text-[13.5px] text-muted-foreground">The resume preview couldn&apos;t load. The report still works on the right.</p>
        ) : !resume || !template ? (
          <div className="flex h-full min-h-[320px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div ref={stageRef} className="relative mx-auto w-fit">
            <div ref={pagesRef} className="pointer-events-none select-text [&_.resume-page]:shadow-[0_18px_40px_-24px_rgba(30,20,90,.45)]" style={{ zoom }}>
              <CanvasEditProvider value={null}>
                <PaginatedPreview resume={resume} template={template} sections={resume.sectionOrder ?? undefined} layout={resume.layout} />
              </CanvasEditProvider>
            </div>
            <div className="absolute inset-0">
              {boxes.map((b, i) => {
                const active = activeIds.has(b.id);
                return (
                  <button
                    key={`${b.id}-${i}`}
                    type="button"
                    onClick={() => onPick?.(b.id)}
                    aria-label="Show this issue in the report"
                    className={cn(
                      "absolute rounded-[3px] border transition-all duration-200",
                      b.tone === "error" ? "border-rose-600/80 bg-rose-500/[0.14]" : "border-rose-500/70 bg-rose-500/[0.08]",
                      active ? "z-10 border-2 border-primary bg-primary/[0.12] shadow-[0_0_0_4px_rgba(115,103,240,.18)]" : "hover:bg-rose-500/20",
                    )}
                    style={{ top: b.top, left: b.left, width: b.width, height: b.height }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
