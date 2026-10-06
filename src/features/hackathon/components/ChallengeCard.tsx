"use client";

import { CheckCircle2, Loader2, Lock } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { trackSpotlight } from "@/components/hackathon-2026/HackathonMotion";
import type { HackathonChallengeKind, LockReason, StepState } from "../api";
import { lockReasonText } from "../copy";
import { cn } from "@/lib/utils";

const ACCENTS = {
  blue: {
    rgb: "43 140 255",
    border: "border-[#2a72d6]/75",
    badge: "bg-gradient-to-b from-[#2a9dff] to-[#1677ff] text-white shadow-[0_0_22px_rgba(29,140,255,0.6)]",
    bar: "bg-[#1d8cff] shadow-[0_0_18px_4px_rgba(29,140,255,0.55)]",
  },
  teal: {
    rgb: "41 214 180",
    border: "border-[#1fa596]/70",
    badge: "bg-gradient-to-b from-[#3ff0c8] to-[#16c9a2] text-[#03201a] shadow-[0_0_22px_rgba(34,211,176,0.55)]",
    bar: "bg-[#22d3b0] shadow-[0_0_18px_4px_rgba(34,211,176,0.5)]",
  },
  violet: {
    rgb: "168 110 255",
    border: "border-[#8a5ce6]/70",
    badge: "bg-gradient-to-b from-[#b08cff] to-[#7c4dff] text-white shadow-[0_0_22px_rgba(150,100,255,0.55)]",
    bar: "bg-[#a06bff] shadow-[0_0_18px_4px_rgba(160,107,255,0.5)]",
  },
} as const;

const KIND_LABEL = {
  resume: "Resume",
  screening: "Screening",
  coding: "Coding",
  system_design: "System design",
  social: "Social",
} as const;

function StateBadge({ state }: Readonly<{ state: StepState }>) {
  const map: Record<StepState, { label: string; className: string }> = {
    locked: { label: "Locked", className: "border-white/25 text-[#dbe6f3]" },
    available: { label: "Active", className: "border-[#3a8dff] text-[#6fc0ff] bg-[#0d2550]/60" },
    in_progress: { label: "In progress", className: "border-[#ffc44d]/70 text-[#ffc44d] bg-[#2e2410]/50" },
    processing: { label: "Scoring", className: "border-[#2bd2ff]/70 text-[#2bd2ff] bg-[#082f45]/50" },
    completed: { label: "Completed", className: "border-[#29d6a0]/70 text-[#29d6a0] bg-[#0b2e2b]/50" },
  };
  const { label, className } = map[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em]",
        className,
      )}
    >
      {state === "completed" ? <CheckCircle2 className="size-4" aria-hidden /> : null}
      {state === "locked" ? <Lock className="size-3.5" aria-hidden /> : null}
      {state === "processing" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
      {state === "available" ? (
        <span className="size-2.5 rounded-full bg-[#1d8cff] shadow-[0_0_8px_rgba(29,140,255,0.9)]" aria-hidden />
      ) : null}
      {label}
    </span>
  );
}

function ScoreBadge({ passed, score, minScore }: Readonly<{ passed?: boolean; score: number; minScore: number }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em]",
        passed ? "border-[#29d6a0]/50 text-[#29d6a0]" : "border-[#ffc44d]/45 text-[#ffc44d]",
      )}
    >
      {passed ? "Passed" : "Below pass"} · {score}/{minScore}
    </span>
  );
}

export function ChallengeCard({
  number,
  title,
  description,
  state,
  lockReason,
  accent = "blue",
  kind,
  passed,
  score,
  minScore,
  children,
}: Readonly<{
  number: number;
  title: string;
  description: string;
  state: StepState;
  lockReason?: LockReason;
  accent?: keyof typeof ACCENTS;
  kind?: HackathonChallengeKind;
  passed?: boolean;
  score?: number | null;
  minScore?: number | null;
  children?: ReactNode;
}>) {
  const a = ACCENTS[accent];
  const locked = state === "locked";
  const current = state === "available" || state === "in_progress" || state === "processing";
  const hasScore = typeof score === "number" && minScore != null;

  return (
    <article
      onPointerMove={locked ? undefined : trackSpotlight}
      style={{ "--hk-accent": a.rgb } as CSSProperties}
      className={cn(
        "relative overflow-hidden rounded-[22px] border bg-[linear-gradient(160deg,rgba(13,34,70,0.92),rgba(8,22,46,0.95))] py-5 pl-6 pr-5 shadow-[0_18px_50px_rgba(0,15,45,0.45),inset_0_1px_0_rgba(140,190,255,0.08)] backdrop-blur-sm sm:py-6 sm:pl-8 sm:pr-6",
        !locked && "hk-card",
        a.border,
        current && "shadow-[0_20px_60px_rgba(16,80,180,0.3),inset_0_1px_0_rgba(140,190,255,0.1)]",
      )}
    >
      {/* Accent bar */}
      <span className={cn("absolute inset-y-0 left-0 w-[5px]", a.bar)} aria-hidden />

      <div className="relative flex items-start gap-4 sm:gap-5">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full text-lg font-extrabold sm:size-12 sm:text-xl",
            locked ? "border-2 border-white/30 bg-[#06122a] text-white" : a.badge,
          )}
        >
          {number}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#2bb8ff] sm:text-xs">
                Challenge {number}
                {kind ? ` · ${KIND_LABEL[kind]}` : ""}
              </p>
              <h2 className="mt-1.5 text-lg font-bold leading-snug tracking-[-0.02em] text-white sm:text-[22px]">{title}</h2>
            </div>
            <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
              <StateBadge state={state} />
              {hasScore ? <ScoreBadge passed={passed} score={score!} minScore={minScore!} /> : null}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 sm:hidden">
            <StateBadge state={state} />
            {hasScore ? <ScoreBadge passed={passed} score={score!} minScore={minScore!} /> : null}
          </div>
          <p className="mt-2 max-w-5xl text-[15px] leading-relaxed text-[#dbe6f3]">{description}</p>
        </div>
      </div>

      {locked && lockReason ? (
        <p className="relative mt-5 flex items-center gap-3 rounded-2xl border border-white/20 bg-[#06122a]/60 px-5 py-3.5 text-[15px] text-[#cfdbe8]">
          <Lock className="size-4 shrink-0 text-[#9eb2ca]" aria-hidden />
          {lockReasonText(lockReason, number)}
        </p>
      ) : null}
      {children ? <div className={cn("relative mt-5", locked && "opacity-60")}>{children}</div> : null}
    </article>
  );
}
