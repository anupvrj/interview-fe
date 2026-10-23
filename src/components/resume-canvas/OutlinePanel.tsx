"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OutlineSection {
  id: string;
  type: string;
  title: string;
  visible: boolean;
  count?: number;
}

/** Section navigator: jump to a section, show/hide it, move it — a map of the whole resume. */
export function OutlinePanel({
  sections,
  activeId,
  onJump,
  onToggle,
  onMove,
  canMove,
  columnOf,
  onInsert,
}: {
  sections: OutlineSection[];
  activeId: string | null;
  onJump: (id: string) => void;
  onToggle: (id: string) => void;
  onMove: (id: string, delta: -1 | 1) => void;
  /** Whether ↑ / ↓ can move it (within its column on two-column designs). */
  canMove?: (id: string) => { up: boolean; down: boolean };
  /** Two-column designs: which column a section is in (↑/↓ move within it). */
  columnOf?: (id: string) => "left" | "right" | null;
  onInsert: () => void;
}) {
  const shown = sections.filter((s) => s.visible);
  const hidden = sections.filter((s) => !s.visible);
  const row = (s: OutlineSection, i: number, list: OutlineSection[]) => (
    <li key={s.id} className={cn("group flex items-center gap-1 rounded-lg pr-1", activeId === s.id ? "bg-primary/10" : "hover:bg-muted")}>
      <button
        type="button"
        onClick={() => s.visible && onJump(s.id)}
        disabled={!s.visible}
        className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-sm disabled:cursor-default"
      >
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", s.visible ? "bg-primary" : "bg-muted-foreground/40")} />
        <span className={cn("truncate", s.visible ? "text-foreground" : "text-muted-foreground line-through")}>{s.title}</span>
        {typeof s.count === "number" && s.visible ? <span className="ml-auto text-[11px] text-muted-foreground">{s.count}</span> : null}
      </button>
      {s.visible && s.type !== "personalInfo" ? (
        <span className="flex items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button type="button" aria-label={`Move ${s.title} up`} disabled={canMove ? !canMove(s.id).up : i <= 1} onClick={() => onMove(s.id, -1)} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Move ${s.title} down`}
            disabled={canMove ? !canMove(s.id).down : i >= list.length - 1}
            onClick={() => onMove(s.id, 1)}
            className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </span>
      ) : null}
      {s.type !== "personalInfo" ? (
        <button
          type="button"
          aria-label={s.visible ? `Hide ${s.title}` : `Show ${s.title}`}
          title={s.visible ? "Hide from resume" : "Show on resume"}
          onClick={() => onToggle(s.id)}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
        >
          {s.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
      ) : null}
    </li>
  );
  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-6">
      <p className="px-1 text-xs text-muted-foreground">Click a section to jump to it. Hidden sections keep their content.</p>
      {columnOf && shown.some((s) => columnOf(s.id)) ? (
        (["top", "left", "right"] as const).map((col) => {
          const list = shown.filter((s) => (columnOf(s.id) ?? "top") === col);
          if (!list.length) return null;
          return (
            <div key={col}>
              {col !== "top" ? (
                <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {col === "left" ? "Left column" : "Right column"}
                </p>
              ) : null}
              <ul className="space-y-0.5">{list.map((s, i) => row(s, i, list))}</ul>
            </div>
          );
        })
      ) : (
        <ul className="space-y-0.5">{shown.map((s, i) => row(s, i, shown))}</ul>
      )}
      {hidden.length ? (
        <div>
          <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Hidden</p>
          <ul className="space-y-0.5">{hidden.map((s, i) => row(s, i, hidden))}</ul>
        </div>
      ) : null}
      <button
        type="button"
        onClick={onInsert}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/50 py-2 text-sm font-medium text-primary hover:bg-primary/5"
      >
        <Plus className="h-4 w-4" /> Insert section
      </button>
    </div>
  );
}
