"use client";

import React from "react";
import { Brush, Gauge, LayoutPanelLeft, ListTree, Loader2, MoveVertical, Plus, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export type CanvasPanel = "outline" | "fix" | "tailor" | "templates" | "design" | "details" | "ai";

/** ATS score → band shown next to the number (we show a 0–100 score, not a letter grade). */
export function scoreBand(score: number | null | undefined): { label: string; ring: string; text: string } {
  if (score == null) return { label: "Not checked yet", ring: "stroke-slate-300", text: "text-muted-foreground" };
  if (score >= 80) return { label: "Strong", ring: "stroke-emerald-500", text: "text-emerald-600" };
  if (score >= 60) return { label: "Getting there", ring: "stroke-amber-500", text: "text-amber-600" };
  return { label: "Needs work", ring: "stroke-rose-500", text: "text-rose-600" };
}

/** Circular 0–100 score with a % inside; the stroke sits clear of the number. */
export function ScoreRing({
  score,
  size = 34,
  busy = false,
  tone,
}: {
  score: number | null;
  size?: number;
  busy?: boolean;
  /** Override the band colour (e.g. job match uses the brand colour). */
  tone?: { ring: string; text: string };
}) {
  const band = tone ?? scoreBand(score);
  const stroke = size >= 48 ? 4 : 2.5;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const value = Math.max(0, Math.min(100, score ?? 0));
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-muted" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={cn("fill-none transition-all", band.ring)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
        />
      </svg>
      <span className={cn("absolute flex items-baseline font-bold leading-none tabular-nums", band.text)}>
        {busy ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : score == null ? (
          <span className={size >= 48 ? "text-base" : "text-[10px]"}>–</span>
        ) : (
          <>
            <span className={size >= 48 ? "text-lg" : "text-[10px]"}>{score}</span>
            <span className={size >= 48 ? "text-[10px]" : "text-[7px]"}>%</span>
          </>
        )}
      </span>
    </span>
  );
}

interface StudioItem {
  id: CanvasPanel | "reorder" | "add";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ITEMS: StudioItem[] = [
  { id: "outline", label: "Outline", icon: ListTree },
  { id: "fix", label: "ATS score", icon: Gauge },
  { id: "tailor", label: "Job match", icon: Target },
  { id: "ai", label: "AI Coach", icon: Sparkles },
  { id: "templates", label: "Designs", icon: LayoutPanelLeft },
  { id: "design", label: "Style", icon: Brush },
  { id: "reorder", label: "Reorder", icon: MoveVertical },
];

export interface StudioProps {
  activePanel: CanvasPanel | null;
  onPanel: (panel: CanvasPanel) => void;
  onReorder: () => void;
  reorderDisabled: boolean;
  onAddSection: () => void;
  atsScore: number | null;
  checkingAts: boolean;
  jobMatchScore: number | null;
  tailoring: boolean;
}

const MATCH_TONE = { ring: "stroke-primary", text: "text-primary" };

/** Items that show a live number as a ring instead of an icon. */
function ringFor(id: StudioItem["id"], p: StudioProps, size: number): React.ReactNode | null {
  if (id === "fix") return <ScoreRing score={p.atsScore} size={size} busy={p.checkingAts} />;
  if (id === "tailor" && (p.tailoring || typeof p.jobMatchScore === "number"))
    return <ScoreRing score={p.jobMatchScore} size={size} busy={p.tailoring} tone={MATCH_TONE} />;
  return null;
}

/** Desktop: vertical studio sidebar on the left edge of the editor. */
export function StudioSidebar(props: StudioProps) {
  return (
    <nav aria-label="Resume studio" className="flex w-[92px] shrink-0 flex-col items-stretch gap-1 overflow-y-auto border-r border-border bg-background px-2 py-3">
      {ITEMS.map((item) => {
        const active = item.id === props.activePanel;
        const ring = ringFor(item.id, props, 34);
        return (
          <button
            key={item.id}
            type="button"
            disabled={item.id === "reorder" && props.reorderDisabled}
            aria-pressed={active}
            onClick={() => (item.id === "reorder" ? props.onReorder() : props.onPanel(item.id as CanvasPanel))}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition-colors disabled:opacity-40",
              active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {active ? <span className="absolute left-0 top-2 h-[calc(100%-1rem)] w-[3px] rounded-r bg-primary" aria-hidden /> : null}
            {ring ?? <item.icon className="h-5 w-5" />}
            <span className="text-center leading-tight">{item.label}</span>
          </button>
        );
      })}
      <div className="mt-auto flex flex-col items-center gap-1 pt-2">
        <button
          type="button"
          onClick={props.onAddSection}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-dashed border-primary/50 text-primary hover:bg-primary/5"
          title="Insert section"
          aria-label="Insert section"
        >
          <Plus className="h-5 w-5" />
        </button>
        <span className="text-[10px] text-muted-foreground">Section</span>
      </div>
    </nav>
  );
}

/** Mobile: the same studio as a bottom tab bar (scrolls sideways). */
export function StudioTabBar(props: StudioProps) {
  const items: StudioItem[] = [...ITEMS, { id: "add", label: "Section", icon: Plus }];
  return (
    <nav
      aria-label="Resume studio"
      data-editor-bottom-bar
      className="flex shrink-0 gap-1 overflow-x-auto border-t border-border bg-background px-2 pb-[max(env(safe-area-inset-bottom),0.4rem)] pt-1.5 [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item) => {
        const active = item.id === props.activePanel;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            disabled={item.id === "reorder" && props.reorderDisabled}
            onClick={() =>
              item.id === "reorder" ? props.onReorder() : item.id === "add" ? props.onAddSection() : props.onPanel(item.id as CanvasPanel)
            }
            className={cn(
              "flex min-w-[64px] shrink-0 flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 text-[10px] font-medium disabled:opacity-40",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            {ringFor(item.id, props, 28) ?? <item.icon className="h-5 w-5" />}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
