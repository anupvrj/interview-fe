"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, PencilLine, ScanSearch } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { hackathonReelFontVars } from "@/lib/fonts/hackathon-reel";
import { cn } from "@/lib/utils";
import { HackathonHelpOnWhatsApp } from "./HackathonHelpOnWhatsApp";

/**
 * analysing  → scoring the resume (nothing saved yet)
 * scored     → score shown, "Update resume" or "Submit"
 * submitting → saving the submission
 * submitted  → saved; "Complete challenge N" makes it final and unlocks the next one
 * completing → finishing the challenge
 */
export type ResumeScorePhase = "analysing" | "scored" | "submitting" | "submitted" | "completing";

const ghostButton =
  "hk-btn-ghost inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/70 bg-transparent px-5 text-[15px] font-semibold text-white transition-colors hover:border-white hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 sm:w-auto";
const primaryButton =
  "hk-btn inline-flex min-h-12 w-full items-center justify-center gap-2 px-6 text-[15px] disabled:pointer-events-none disabled:opacity-60 sm:w-auto";

function ScoreRing({ score, good }: Readonly<{ score: number; good: boolean }>) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = good ? "#29d6a0" : "#ffc44d";
  return (
    <div className="relative mx-auto size-36" role="img" aria-label={`ATS score ${score} out of 100`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#173252" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold tabular-nums text-white">{score}</span>
        <span className="text-xs font-semibold tracking-wide text-[#9eb2ca]">out of 100</span>
      </div>
    </div>
  );
}

export function ResumeScoreDialog({
  open,
  onOpenChange,
  phase,
  score,
  scoring = false,
  minScore,
  target,
  challengeNumber,
  editHref,
  errorMessage,
  onSubmit,
  onComplete,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase: ResumeScorePhase;
  score: number | null;
  /** Submitted and the ATS score is still being worked out. */
  scoring?: boolean;
  /** Pass mark set by the organisers (blocks completing below it); null = none. */
  minScore: number | null;
  /** Score we encourage ("aim for 75+"). */
  target: number | null;
  challengeNumber: number;
  editHref: string | null;
  errorMessage: string | null;
  onSubmit: () => void;
  onComplete: () => void;
}>) {
  const busy = phase === "analysing" || phase === "submitting" || phase === "completing";
  const belowPass = minScore !== null && score !== null && score < minScore;
  const good = score !== null && score >= (minScore ?? target ?? 75);
  const submitted = phase === "submitted" || phase === "completing";
  // "Submit" asks once before it goes through.
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (phase !== "scored" || !open) setConfirming(false);
  }, [phase, open]);

  return (
    <Dialog open={open} onOpenChange={(next) => (!busy || next ? onOpenChange(next) : undefined)}>
      <DialogContent
        overlayClassName="bg-[#020810]/80"
        onPointerDownOutside={(e) => busy && e.preventDefault()}
        onEscapeKeyDown={(e) => busy && e.preventDefault()}
        className={`hk-root hk-modal ${hackathonReelFontVars} ${busy ? "[&>button:last-child]:hidden" : ""} max-h-[90svh] w-[calc(100%-1.5rem)] max-w-lg gap-0 overflow-y-auto border border-[#27547d]/90 bg-[#071426] p-0 text-[#dbe9f8] shadow-none`}
      >
        {phase === "analysing" ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <span className="grid size-16 place-items-center rounded-2xl bg-[#0b2142] text-[#6fc0ff] ring-1 ring-[#2f64a8]">
              <ScanSearch className="size-8 animate-pulse" aria-hidden />
            </span>
            <DialogHeader className="space-y-2 text-center">
              <DialogTitle className="text-xl font-bold text-white">Analysing your resume…</DialogTitle>
              <DialogDescription className="text-sm text-[#9eb2ca]">
                Checking it the way an applicant tracking system would. This takes a few seconds.
              </DialogDescription>
            </DialogHeader>
            <Loader2 className="size-6 animate-spin text-[#6fc0ff]" aria-hidden />
          </div>
        ) : confirming ? (
          <>
            <DialogHeader className="space-y-2 border-b border-[#27547d]/60 px-5 pb-4 pt-6 text-center sm:px-6">
              <DialogTitle className="text-xl font-bold text-white sm:text-2xl">Submit this resume?</DialogTitle>
              <DialogDescription className="text-sm text-[#9eb2ca]">
                {score !== null ? `ATS ${score}/100. ` : ""}It becomes your hackathon entry and your mock interview is based on it.
              </DialogDescription>
            </DialogHeader>
            <div className="px-5 py-5 sm:px-6">
              <p className="flex items-start gap-2 rounded-xl border border-[#ffc44d]/50 bg-[#2e2410]/40 p-3 text-left text-sm text-[#ffe2a3]">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#ffc44d]" aria-hidden />
                <span>
                  Once you start Challenge {challengeNumber + 1}, this resume is locked and can&apos;t be changed or undone.
                </span>
              </p>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-[#27547d]/60 px-5 py-4 sm:flex-row sm:justify-center sm:px-6">
              <button type="button" className={ghostButton} onClick={() => setConfirming(false)}>
                Go back
              </button>
              <button
                type="button"
                className={primaryButton}
                onClick={() => {
                  setConfirming(false);
                  onSubmit();
                }}
              >
                Yes, submit
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="space-y-2 border-b border-[#27547d]/60 px-5 pb-4 pt-6 text-center sm:px-6">
              <DialogTitle className="text-xl font-bold text-white sm:text-2xl">
                {submitted ? "Resume submitted" : "Your resume score"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Your resume scored {score ?? "—"} out of 100.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-5 py-5 text-center sm:px-6">
              {score !== null ? (
                <ScoreRing score={score} good={good} />
              ) : scoring ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <Loader2 className="size-8 animate-spin text-[#6fc0ff]" aria-hidden />
                  <p className="text-sm text-[#9eb2ca]">Checking your ATS score… this takes about 20 seconds.</p>
                </div>
              ) : (
                <p className="text-sm text-[#9eb2ca]">We couldn&apos;t calculate a score right now.</p>
              )}

              {score !== null ? (
                <p className="text-[15px] leading-relaxed text-[#dbe9f8]">
                  Your resume has scored <strong className="text-white">{score}</strong> out of 100.
                  {submitted
                    ? " You can still improve it before you complete the challenge."
                    : " Would you like to improve it further? A higher score improves your chance of winning."}
                </p>
              ) : null}

              {submitted && !belowPass && !scoring ? (
                <p className="flex items-start justify-center gap-2 text-sm text-[#29d6a0]">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                  Submitted. Press Complete Challenge {challengeNumber} to lock it in and unlock the next challenge.
                </p>
              ) : null}

              {belowPass ? (
                <p className="flex items-start justify-center gap-2 text-sm text-[#ffc44d]">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  You need at least {minScore} to complete this challenge. Update your resume to raise the score.
                </p>
              ) : null}

              {errorMessage ? (
                <p role="alert" className="flex items-start justify-center gap-2 text-sm text-[#ff6f9f]">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {errorMessage}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#27547d]/60 px-5 py-4 sm:flex-row sm:justify-center sm:px-6">
              {editHref ? (
                <Link
                  href={editHref}
                  className={cn(ghostButton, busy && "pointer-events-none opacity-60")}
                  aria-disabled={busy}
                >
                  <PencilLine className="size-4" aria-hidden />
                  Update Resume
                </Link>
              ) : null}
              {submitted ? (
                <button type="button" className={primaryButton} disabled={busy || belowPass || scoring} onClick={onComplete}>
                  {phase === "completing" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Complete Challenge {challengeNumber}
                </button>
              ) : (
                <button type="button" className={primaryButton} disabled={busy} onClick={() => setConfirming(true)}>
                  {phase === "submitting" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden /> Submitting…
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              )}
            </div>
            {errorMessage ? (
              <div className="px-5 pb-5 sm:px-6">
                <HackathonHelpOnWhatsApp />
              </div>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
