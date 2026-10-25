"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { hackathonReelFontVars } from "@/lib/fonts/hackathon-reel";
import { cn } from "@/lib/utils";
import { HackathonConfettiLayer } from "../celebration/HackathonConfettiLayer";

/** What the participant sees after an interview. Never a score — results come after the event. */
export type InterviewResultPhase = "analysing" | "low_score" | "short_interview" | "submitted" | "failed";

const COPY: Record<InterviewResultPhase, { title: string; body: string }> = {
  analysing: {
    title: "Analysing your interview",
    body: "We're reviewing your answers. This usually takes about a minute — keep this open.",
  },
  low_score: {
    title: "Your interview scored low",
    body: "You can take one re-attempt — we'll keep whichever of the two scores higher. Or submit this one as it is.",
  },
  short_interview: {
    title: "Your interview was too short",
    body: "It ended before 8 minutes, which usually scores low. Take a re-attempt — we'll keep the better of the two — or submit this one.",
  },
  submitted: {
    title: "Interview submitted!",
    body: "You're through this round and the next challenge is unlocked. Scores are revealed after the hackathon.",
  },
  failed: {
    title: "We couldn't analyse that interview",
    body: "Something went wrong on our side. That try wasn't used — start the interview again when you're ready.",
  },
};

const PRIMARY =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#3aa0ff] bg-[linear-gradient(135deg,#1273f5_0%,#1f95ff_55%,#35b1ff_100%)] px-6 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[0_14px_36px_rgba(20,130,255,0.42),inset_0_1px_0_rgba(255,255,255,0.25)] transition disabled:pointer-events-none disabled:opacity-60";
const SECONDARY =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#2f6fb8] bg-transparent px-6 text-sm font-bold uppercase tracking-[0.08em] text-white transition hover:bg-white/5 disabled:pointer-events-none disabled:opacity-60";

function PhaseIcon({ phase }: Readonly<{ phase: InterviewResultPhase }>) {
  const ring = "relative grid size-[4.5rem] place-items-center rounded-full border-2";
  if (phase === "analysing") {
    return (
      <div className={cn(ring, "border-[#3aa6ff]/45 bg-[#0d2550]/80")}>
        <span className="absolute inset-0 animate-ping rounded-full bg-[#3aa6ff]/15" aria-hidden />
        <Loader2 className="size-9 animate-spin text-[#6fc0ff]" aria-hidden />
      </div>
    );
  }
  if (phase === "submitted") {
    return (
      <div className={cn(ring, "border-[#29d6a0]/55 bg-[#0b2e28]/80")}>
        <CheckCircle2 className="size-10 text-[#29d6a0]" strokeWidth={2.25} aria-hidden />
      </div>
    );
  }
  if (phase === "failed") {
    return (
      <div className={cn(ring, "border-[#ff8a8a]/50 bg-[#2e1414]/70")}>
        <AlertTriangle className="size-9 text-[#ff8a8a]" aria-hidden />
      </div>
    );
  }
  const Icon = phase === "short_interview" ? Clock : Sparkles;
  return (
    <div className={cn(ring, "border-[#ffc44d]/55 bg-[#2e2410]/70")}>
      <Icon className="size-9 text-[#ffc44d]" aria-hidden />
    </div>
  );
}

export function InterviewResultModal({
  open,
  phase,
  canReattempt,
  busy,
  error,
  slow,
  onReattempt,
  onSubmit,
  onStartAgain,
  onClose,
}: Readonly<{
  open: boolean;
  phase: InterviewResultPhase;
  canReattempt: boolean;
  /** A choice is being saved. */
  busy: "reattempt" | "submit" | null;
  error: string | null;
  /** Analysing for a while: say so, keep waiting. */
  slow: boolean;
  onReattempt: () => void;
  onSubmit: () => void;
  onStartAgain: () => void;
  onClose: () => void;
}>) {
  const copy = COPY[phase];
  const deciding = phase === "low_score" || phase === "short_interview";
  // A decision must be made here or on the card; analysing can't be dismissed by a stray click.
  const lockOpen = phase === "analysing" || busy !== null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !lockOpen && onClose()}>
      <HackathonConfettiLayer active={open && phase === "submitted"} />
      <DialogContent
        overlayClassName="bg-[#020810]/80"
        className={`hk-root hk-modal ${hackathonReelFontVars} w-[calc(100%-1.5rem)] max-w-[25rem] gap-0 overflow-hidden rounded-[22px] border border-[#27547d]/90 bg-[#071426] p-0 text-[#dbe9f8] shadow-none [&>button]:hidden`}
        onPointerDownOutside={(e) => lockOpen && e.preventDefault()}
        onEscapeKeyDown={(e) => lockOpen && e.preventDefault()}
      >
        <div key={phase} className="flex flex-col items-center px-6 pb-2 pt-9 text-center animate-in fade-in zoom-in-95 duration-300 sm:px-8">
          <PhaseIcon phase={phase} />
          <DialogTitle className="mt-6 text-balance text-xl font-extrabold leading-tight tracking-tight text-white sm:text-[1.35rem]">
            {copy.title}
          </DialogTitle>
          <DialogDescription className="mt-3 max-w-[19rem] text-pretty text-sm leading-relaxed text-[#9eb2ca]">
            {phase === "analysing" && slow
              ? "This is taking a little longer than usual. We're still working on it — you can keep this open or come back later."
              : deciding && !canReattempt
                ? "This was your last try, so it will be submitted."
                : copy.body}
          </DialogDescription>
          {error ? (
            <p className="mt-3 text-sm text-[#ff8a8a]" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-5 space-y-3 border-t border-[#27547d]/60 px-6 py-5 sm:px-8">
          {phase === "analysing" ? (
            <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#7189a6]">Please wait</p>
          ) : deciding ? (
            <>
              {canReattempt ? (
                <button type="button" className={PRIMARY} disabled={busy !== null} onClick={onReattempt}>
                  {busy === "reattempt" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RotateCcw className="size-4" aria-hidden />}
                  Re-attempt
                </button>
              ) : null}
              <button type="button" className={canReattempt ? SECONDARY : PRIMARY} disabled={busy !== null} onClick={onSubmit}>
                {busy === "submit" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <CheckCircle2 className="size-4" aria-hidden />}
                Submit this one
              </button>
            </>
          ) : phase === "failed" ? (
            <button type="button" className={PRIMARY} onClick={onStartAgain}>
              Start again <ArrowRight className="size-4" aria-hidden />
            </button>
          ) : (
            <button type="button" className={PRIMARY} onClick={onClose}>
              Continue <ArrowRight className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
