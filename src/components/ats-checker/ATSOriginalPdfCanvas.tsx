"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { CanvasMark } from "@/components/resume-canvas/CanvasInteractionLayer";
import { Mono } from "@/components/marketing-2026/primitives";
import { locateTextInPdf, type PdfHit, type PdfPage } from "@/lib/pdf-snapshot";
import { cn } from "@/lib/utils";

type Box = PdfHit & { id: string; tone: CanvasMark["tone"] };

/** Widest a page is drawn at 100%, in px (about A4 on screen). */
const PAGE_W = 794;

/**
 * Their own PDF, exactly as they designed it, with each finding boxed where its text is.
 * No rebuilding in our template and no AI: the PDF's text layer says where everything is.
 */
export function ATSOriginalPdfCanvas({
  pages,
  marks,
  activeIds,
  onPick,
  className,
}: {
  pages: PdfPage[];
  marks: CanvasMark[];
  activeIds: Set<string>;
  onPick?: (markId: string) => void;
  className?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.6);
  const [zoomDelta, setZoomDelta] = useState(0);
  const zoom = Math.min(1.6, Math.max(0.35, fit + zoomDelta));

  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFit(Math.min(1, Math.max(0.35, (el.clientWidth - 40) / PAGE_W))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const boxes = useMemo<Box[]>(
    () =>
      marks.flatMap((mark) =>
        mark.text && mark.text.length >= 2
          ? locateTextInPdf(pages, mark.text).map((hit) => ({ ...hit, id: mark.id, tone: mark.tone }))
          : [],
      ),
    [pages, marks],
  );
  const marked = new Set(boxes.map((b) => b.id)).size;

  // bring the open check's first box into view inside the canvas
  useEffect(() => {
    const first = boxes.find((b) => activeIds.has(b.id));
    if (!first) return;
    const el = frameRef.current?.querySelector<HTMLElement>(`[data-box="${CSS.escape(first.id)}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIds, boxes]);

  return (
    <div className={cn("flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-border bg-[#E9E8F1] dark:bg-[#0B1424]", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Mono className="shrink-0 text-[11px] text-muted-foreground">YOUR RESUME · ORIGINAL</Mono>
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
        <div className="mx-auto flex w-fit flex-col gap-5">
          {pages.map((page, p) => (
            <div
              key={p}
              className="relative overflow-hidden rounded-[4px] bg-white shadow-[0_18px_40px_-24px_rgba(30,20,90,.45)]"
              style={{ width: PAGE_W * zoom, aspectRatio: String(page.aspect) }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL of their own PDF */}
              <img src={page.dataUrl} alt={`Page ${p + 1} of your resume`} className="absolute inset-0 size-full select-none" draggable={false} />
              {boxes.filter((b) => b.page === p).map((b, i) => {
                const active = activeIds.has(b.id);
                return (
                  <button
                    key={`${b.id}-${i}`}
                    type="button"
                    data-box={b.id}
                    onClick={() => onPick?.(b.id)}
                    aria-label="Show this issue in the report"
                    className={cn(
                      "absolute rounded-[3px] border transition-all duration-200",
                      b.tone === "error" ? "border-rose-600/80 bg-rose-500/[0.14]" : "border-rose-500/70 bg-rose-500/[0.08]",
                      active ? "z-10 border-2 border-primary bg-primary/[0.12] shadow-[0_0_0_4px_rgba(115,103,240,.18)]" : "hover:bg-rose-500/20",
                    )}
                    style={{
                      top: `calc(${b.top * 100}% - 2px)`,
                      left: `calc(${b.left * 100}% - 3px)`,
                      width: `calc(${b.width * 100}% + 6px)`,
                      height: `calc(${b.height * 100}% + 2px)`,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
