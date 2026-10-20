"use client";

import React from "react";
import {
  ArrowDownUp,
  CircleCheckBig,
  Download,
  Eye,
  LayoutTemplate,
  Link2,
  Loader2,
  Palette,
  Plus,
  Redo2,
  Sparkles,
  Target,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CanvasPanel = "fix" | "tailor" | "templates" | "design" | "details" | "ai";

/** ATS score → letter grade shown on the Fix Mistakes chip. */
export function atsGrade(score: number | null | undefined): { letter: string; tone: string } {
  if (score == null) return { letter: "?", tone: "bg-slate-200 text-slate-700" };
  if (score >= 90) return { letter: "A", tone: "bg-emerald-500 text-white" };
  if (score >= 80) return { letter: "B", tone: "bg-lime-500 text-white" };
  if (score >= 70) return { letter: "C", tone: "bg-amber-400 text-slate-900" };
  if (score >= 60) return { letter: "D", tone: "bg-orange-500 text-white" };
  return { letter: "F", tone: "bg-red-500 text-white" };
}

function Chip({
  active,
  onClick,
  children,
  disabled,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      title={label}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors disabled:opacity-50",
        active ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function CanvasToolRow({
  activePanel,
  onPanel,
  atsScore,
  checkingAts,
  onTailor,
  tailoring,
  jobMatchScore,
  onRearrange,
  rearrangeDisabled,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isMobile,
  onAddSection,
  onShare,
  sharing,
}: {
  activePanel: CanvasPanel | null;
  onPanel: (panel: CanvasPanel) => void;
  atsScore: number | null;
  checkingAts: boolean;
  onTailor: () => void;
  tailoring: boolean;
  /** Job match % once a job has been checked. */
  jobMatchScore?: number | null;
  onRearrange: () => void;
  rearrangeDisabled: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isMobile: boolean;
  /** Mobile only: the desktop rail holds these. */
  onAddSection: () => void;
  onShare: () => void;
  sharing: boolean;
}) {
  const grade = atsGrade(atsScore);
  return (
    <div className="flex items-center gap-2 border-b border-border bg-background px-2 py-1.5 md:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto md:justify-center [&::-webkit-scrollbar]:hidden">
        <Chip active={activePanel === "fix"} onClick={() => onPanel("fix")} label="ATS score and fixes">
          <CircleCheckBig className="h-4 w-4 text-primary" />
          Fix Mistakes
          {checkingAts ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold", grade.tone)}>
              {grade.letter}
            </span>
          )}
        </Chip>
        <span className="mx-1 hidden h-5 w-px bg-border md:block" aria-hidden />
        <Chip active={activePanel === "tailor"} onClick={onTailor} label="Match your resume to a job description">
          {tailoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
          Check &amp; Tailor
          {typeof jobMatchScore === "number" ? (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                jobMatchScore >= 75 ? "bg-emerald-500 text-white" : jobMatchScore >= 50 ? "bg-amber-400 text-slate-900" : "bg-red-500 text-white",
              )}
            >
              {jobMatchScore}%
            </span>
          ) : null}
        </Chip>
        <span className="mx-1 hidden h-5 w-px bg-border md:block" aria-hidden />
        <Chip onClick={onRearrange} disabled={rearrangeDisabled} label="Drag sections into a new order">
          <ArrowDownUp className="h-4 w-4" />
          Rearrange
        </Chip>
        <Chip active={activePanel === "templates"} onClick={() => onPanel("templates")}>
          <LayoutTemplate className="h-4 w-4" />
          Templates
        </Chip>
        <Chip active={activePanel === "design"} onClick={() => onPanel("design")}>
          <Palette className="h-4 w-4" />
          Design &amp; Font
        </Chip>
        {isMobile ? (
          <>
            <Chip active={activePanel === "ai"} onClick={() => onPanel("ai")}>
              <Sparkles className="h-4 w-4" />
              AI
            </Chip>
            <Chip onClick={onAddSection}>
              <Plus className="h-4 w-4" />
              Section
            </Chip>
            <Chip onClick={onShare} disabled={sharing}>
              {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Share
            </Chip>
          </>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground/80 hover:bg-muted disabled:opacity-30"
          title="Undo (Ctrl/⌘ Z)"
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground/80 hover:bg-muted disabled:opacity-30"
          title="Redo (Ctrl/⌘ Shift Z)"
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function RailButton({
  label,
  onClick,
  children,
  busy,
  active,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  busy?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={label}
      aria-label={label}
      className={cn(
        "group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-background shadow-sm transition-colors",
        active ? "border-primary text-primary" : "border-border text-foreground/80 hover:border-primary/50 hover:text-primary",
      )}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      <span className="pointer-events-none absolute right-12 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white group-hover:block">
        {label}
      </span>
    </button>
  );
}

/** Icon rail beside the page (desktop). */
export function CanvasRail({
  onPreview,
  onDownload,
  downloading,
  onShare,
  sharing,
  onAi,
  aiActive,
  onAddSection,
}: {
  onPreview: () => void;
  onDownload: () => void;
  downloading: boolean;
  onShare: () => void;
  sharing: boolean;
  onAi: () => void;
  aiActive: boolean;
  onAddSection: () => void;
}) {
  return (
    <div className="flex flex-col gap-2" role="toolbar" aria-label="Resume actions">
      <RailButton label="Preview" onClick={onPreview}>
        <Eye className="h-4 w-4" />
      </RailButton>
      <RailButton label="Download PDF" onClick={onDownload} busy={downloading}>
        <Download className="h-4 w-4" />
      </RailButton>
      <RailButton label="Copy share link" onClick={onShare} busy={sharing}>
        <Link2 className="h-4 w-4" />
      </RailButton>
      <RailButton label="AI assistant" onClick={onAi} active={aiActive}>
        <Sparkles className="h-4 w-4" />
      </RailButton>
      <span className="mx-auto my-1 h-px w-6 bg-border" aria-hidden />
      <RailButton label="Add section" onClick={onAddSection}>
        <Plus className="h-4 w-4" />
      </RailButton>
    </div>
  );
}
