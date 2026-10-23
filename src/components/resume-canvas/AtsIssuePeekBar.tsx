"use client";

import { ChevronLeft, ChevronRight, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasMark } from "./CanvasInteractionLayer";

/**
 * Phones: after picking an ATS issue the sheet steps aside so the marked text is visible on
 * the page. This bar names the issue, steps through the others, and brings the list back.
 */
export function AtsIssuePeekBar({
  title,
  tone,
  index,
  total,
  onPrev,
  onNext,
  onShowList,
}: Readonly<{
  title: string;
  tone: CanvasMark["tone"];
  /** 0-based position among the issues marked on the page. */
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onShowList: () => void;
}>) {
  const step = "grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-background text-foreground disabled:opacity-40";
  return (
    <div
      role="region"
      aria-label="ATS issue"
      data-editor-bottom-bar
      className="flex shrink-0 items-center gap-2 border-t border-border bg-card px-3 py-2 shadow-[0_-6px_18px_rgba(15,23,42,0.08)]"
    >
      <button type="button" className={step} onClick={onPrev} disabled={index <= 0} aria-label="Previous issue">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button type="button" onClick={onShowList} className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span
            aria-hidden
            className={cn("h-1.5 w-1.5 rounded-full", tone === "error" ? "bg-red-500" : tone === "weak" ? "bg-amber-500" : "bg-primary")}
          />
          Issue {index + 1} of {total}
        </span>
        <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
      </button>
      <button type="button" className={step} onClick={onNext} disabled={index >= total - 1} aria-label="Next issue">
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onShowList}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground"
      >
        <ListChecks className="h-4 w-4" aria-hidden />
        See fix
      </button>
    </div>
  );
}
