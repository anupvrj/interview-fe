"use client";

import { CheckCircle2, Copy, FileText, Instagram, Linkedin, Loader2, Lock, Mic, PlayCircle } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { trackSpotlight } from "@/components/hackathon-2026/HackathonMotion";
import type { HackathonChallengeKind, LockReason, StepState } from "../api";
import { lockReasonText } from "../copy";
import { cn } from "@/lib/utils";
import { hkInputClass, hkSecondaryButton } from "./ResumeChallenge";

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
    locked: { label: "Locked", className: "border-white/20 text-[#9eb2ca] bg-[#06122a]/80" },
    available: { label: "Active", className: "border-[#3a8dff] text-[#6fc0ff] bg-[#0d2550]/60" },
    in_progress: { label: "In progress", className: "border-[#ffc44d]/70 text-[#ffc44d] bg-[#2e2410]/50" },
    processing: { label: "Scoring", className: "border-[#2bd2ff]/70 text-[#2bd2ff] bg-[#082f45]/50" },
    completed: { label: "Completed", className: "border-[#29d6a0]/70 text-[#29d6a0] bg-[#0b2e2b]/70" },
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

const SOCIAL_CAPTION =
  "I just took two AI mock interviews in the InterviewTrix Hackathon 2026 — Navigating Careers in 2027! 🚀 #InterviewTrix #InterviewTrixHackathon";

/** Full fake UI behind the lock, same idea as PracticeLockedGate — not gray bars. */
function SocialLockedPreview() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#27547d]/80 bg-[#071426]/60 p-4">
        <p className="text-sm text-[#cfdbe8]">
          Share a post about your mock interview on <strong className="text-white">LinkedIn</strong> and{" "}
          <strong className="text-white">Instagram</strong>, then paste both post links below. Posts must be public.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-[#9eb2ca]">{SOCIAL_CAPTION}</p>
          <span className={cn(hkSecondaryButton, "pointer-events-none")}>
            <Copy className="size-4" />
            Copy caption
          </span>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#dbe9f8]">
            <Linkedin className="size-4 text-[#6fc0ff]" /> LinkedIn post URL
          </p>
          <div className={cn(hkInputClass, "flex items-center text-[#7189a6]")}>
            https://www.linkedin.com/posts/…
          </div>
        </div>
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#dbe9f8]">
            <Instagram className="size-4 text-[#ff5f97]" /> Instagram post URL
          </p>
          <div className={cn(hkInputClass, "flex items-center text-[#7189a6]")}>
            https://www.instagram.com/p/…
          </div>
        </div>
      </div>
      <span className="hk-btn pointer-events-none inline-flex h-12 px-6 text-sm">Submit links</span>
    </div>
  );
}

function InterviewLockedPreview() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {[1, 2].map((slot) => (
        <div key={slot} className="flex h-full flex-col rounded-2xl border border-white/45 bg-[#06142c]/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-3 text-[17px] font-bold text-white">
              <Mic className="size-5 text-[#3aa0ff]" />
              Interview {slot}
            </h3>
            <span className="text-sm font-medium text-white">15 min</span>
          </div>
          <p className="mt-4 text-sm text-[#cfdbe8]">Start this free mock interview when you&apos;re ready.</p>
          <span className="hk-btn pointer-events-none mt-4 inline-flex min-h-11 w-fit px-5 text-sm">
            <PlayCircle className="size-4" />
            Start interview {slot}
          </span>
        </div>
      ))}
    </div>
  );
}

function ResumeLockedPreview() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#2a5a94]/60 bg-[#06142c]/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-[#2f64a8] bg-[#0b2142] text-[#6fc0ff]">
          <FileText className="size-6" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="text-[17px] font-semibold text-white">ATS-ready resume</p>
          <span className="mt-1.5 inline-flex items-center rounded-full border border-[#29d6a0]/70 bg-[#0b2e2b]/50 px-3 py-0.5 text-sm font-bold text-[#29d6a0]">
            ATS 82/100
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <span className={cn(hkSecondaryButton, "pointer-events-none")}>View PDF</span>
        <span className="hk-btn pointer-events-none inline-flex min-h-11 px-5 text-sm">Design a resume</span>
      </div>
    </div>
  );
}

function LockedChallengePreview({ kind }: Readonly<{ kind?: HackathonChallengeKind }>) {
  if (kind === "social") return <SocialLockedPreview />;
  if (kind === "resume") return <ResumeLockedPreview />;
  return <InterviewLockedPreview />;
}

function lockedDetail(reason: LockReason | undefined, challengeNumber: number): string {
  if (!reason || reason === "previous_step") {
    return "Complete the current challenge to unlock this.";
  }
  return lockReasonText(reason, challengeNumber);
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
  const completed = state === "completed";
  const faded = locked || completed;
  const current = state === "available" || state === "in_progress" || state === "processing";
  const hasScore = typeof score === "number" && minScore != null;
  const preview = locked ? <LockedChallengePreview kind={kind} /> : children;

  return (
    <article
      onPointerMove={faded ? undefined : trackSpotlight}
      style={{ "--hk-accent": a.rgb } as CSSProperties}
      className={cn(
        "relative overflow-hidden rounded-[22px] border bg-[linear-gradient(160deg,rgba(13,34,70,0.92),rgba(8,22,46,0.95))] py-5 pl-6 pr-5 shadow-[0_18px_50px_rgba(0,15,45,0.45),inset_0_1px_0_rgba(140,190,255,0.08)] sm:py-6 sm:pl-8 sm:pr-6",
        !faded && "hk-card",
        completed && "border-[#29d6a0]/40",
        locked && "border-white/15",
        !faded && a.border,
        current && "shadow-[0_20px_60px_rgba(16,80,180,0.3),inset_0_1px_0_rgba(140,190,255,0.1)]",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-[5px]",
          completed ? "bg-[#29d6a0] shadow-[0_0_18px_4px_rgba(41,214,160,0.4)]" : locked ? "bg-white/25" : a.bar,
        )}
        aria-hidden
      />

      <div className="relative flex items-start gap-4 sm:gap-5">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full text-lg font-extrabold sm:size-12 sm:text-xl",
            completed
              ? "border border-[#29d6a0]/45 bg-[#0b2e2b] text-[#29d6a0] shadow-[0_0_18px_rgba(41,214,160,0.35)]"
              : locked
                ? "border-2 border-white/20 bg-[#06122a] text-[#9eb2ca]"
                : a.badge,
          )}
        >
          {completed ? <CheckCircle2 className="size-6" strokeWidth={2.2} aria-hidden /> : null}
          {locked ? <Lock className="size-5" aria-hidden /> : null}
          {!completed && !locked ? number : null}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={cn(
                  "text-[11px] font-extrabold uppercase tracking-[0.18em] sm:text-xs",
                  completed ? "text-[#29d6a0]" : locked ? "text-[#7189a6]" : "text-[#2bb8ff]",
                )}
              >
                Challenge {number}
                {kind ? ` · ${KIND_LABEL[kind]}` : ""}
              </p>
              <h2 className="mt-1.5 text-lg font-bold leading-snug tracking-[-0.02em] text-white sm:text-[22px]">
                {title}
              </h2>
            </div>
            <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
              <StateBadge state={state} />
              {hasScore && !locked ? <ScoreBadge passed={passed} score={score!} minScore={minScore!} /> : null}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 sm:hidden">
            <StateBadge state={state} />
            {hasScore && !locked ? <ScoreBadge passed={passed} score={score!} minScore={minScore!} /> : null}
          </div>
          <p className="mt-2 max-w-5xl text-[15px] leading-relaxed text-[#dbe6f3]">{description}</p>
        </div>
      </div>

      {preview ? (
        faded ? (
          <div className="relative isolate mt-5 min-h-[280px] overflow-hidden rounded-2xl sm:min-h-[320px]">
            <div className="pointer-events-none absolute inset-0 select-none overflow-hidden" aria-hidden>
              <div className="min-h-full origin-center scale-[1.04] p-4 blur-[7px] sm:p-5 sm:blur-[9px]">
                {preview}
              </div>
            </div>
            <div
              className={cn(
                "pointer-events-none absolute inset-0 rounded-2xl",
                completed
                  ? "bg-gradient-to-b from-[#071a16]/72 from-0% via-[#071426]/42 via-[42%] to-transparent to-100%"
                  : "bg-gradient-to-b from-[#040b17]/75 from-0% via-[#040b17]/40 via-[42%] to-transparent to-100%",
              )}
              aria-hidden
            />
            <div
              className={cn(
                "pointer-events-none absolute inset-0 rounded-2xl",
                completed
                  ? "bg-[radial-gradient(ellipse_95%_80%_at_50%_45%,transparent_35%,rgba(4,11,23,0.55)_100%)]"
                  : "bg-[radial-gradient(ellipse_95%_80%_at_50%_45%,transparent_30%,rgba(4,11,23,0.6)_100%)]",
              )}
              aria-hidden
            />
            <div className="relative z-10 flex flex-col items-center px-5 py-8 text-center sm:px-8 sm:py-10">
              <div
                className={cn(
                  "mb-4 flex size-14 items-center justify-center rounded-2xl border shadow-lg",
                  completed
                    ? "border-[#29d6a0]/30 bg-[#0b2e2b] text-[#29d6a0]"
                    : "border-white/15 bg-[#0b1d35] text-[#9eb2ca]",
                )}
              >
                {completed ? (
                  <CheckCircle2 className="size-7" strokeWidth={2} aria-hidden />
                ) : (
                  <Lock className="size-7" strokeWidth={1.8} aria-hidden />
                )}
              </div>
              <span
                className={cn(
                  "mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                  completed
                    ? "border-[#29d6a0]/30 bg-[#29d6a0]/10 text-[#29d6a0]"
                    : "border-white/15 bg-white/[0.06] text-[#cfdbe8]",
                )}
              >
                {completed ? "Completed" : "Locked"}
              </span>
              <h3 className="max-w-md text-xl font-bold text-white sm:text-2xl">
                {completed ? "Challenge complete" : "This challenge is locked"}
              </h3>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#9eb2ca]">
                {completed
                  ? "Nice work. This challenge is finished."
                  : lockedDetail(lockReason, number)}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative mt-5">{preview}</div>
        )
      ) : null}
    </article>
  );
}
