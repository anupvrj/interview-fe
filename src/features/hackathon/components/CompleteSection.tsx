"use client";

import { useState } from "react";
import { AlertCircle, Loader2, PartyPopper, Trophy } from "lucide-react";
import { toHackathonError, type HackathonMe } from "../api";
import { formatIst } from "../copy";
import { useCompleteHackathon } from "../hooks";
import { hkSecondaryButton } from "./ResumeChallenge";

export function CompleteSection({ me }: Readonly<{ me: HackathonMe }>) {
  const complete = useCompleteHackathon();
  const [confirming, setConfirming] = useState(false);
  const error = complete.error ? toHackathonError(complete.error).message : null;

  if (me.progress.completed) {
    return (
      <section className="hk-sheen relative overflow-hidden rounded-2xl border border-[#1f8a82]/80 bg-gradient-to-b from-[#0c3238]/90 to-[#0a1f2b]/90 px-4 py-8 text-center sm:rounded-[28px] sm:px-10 sm:py-10">
        <span className="hk-beam rounded-[28px]" aria-hidden />
        <span className="relative mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-[#29d6a0]/12 text-[#29d6a0] ring-1 ring-[#29d6a0]/40">
          <Trophy className="hk-trophy size-8" aria-hidden />
        </span>
        <h2 className="relative text-2xl font-extrabold tracking-[-0.03em] text-white sm:text-3xl">
          You&apos;ve completed the hackathon!
        </h2>
        <p className="relative mx-auto mt-2 max-w-lg text-[15px] text-[#cfdbe8]">
          Your submission is in{me.participant?.completedAt ? ` (${formatIst(me.participant.completedAt)})` : ""}. We&apos;ll
          announce the winners after judging. Good luck!
        </p>
      </section>
    );
  }

  if (!me.progress.canComplete) return null;

  return (
    <section className="hk-sheen relative overflow-hidden rounded-2xl border border-[#2a64b0]/80 bg-gradient-to-b from-[#0f2a52]/90 to-[#0a1b36]/90 px-4 py-8 text-center sm:rounded-[28px] sm:px-10">
      <span className="hk-beam rounded-[28px]" aria-hidden />
      <PartyPopper className="relative mx-auto mb-3 size-9 text-[#ffc44d]" aria-hidden />
      <h2 className="relative text-xl font-extrabold text-white sm:text-2xl">
        {me.progress.requiredChallengeCount === 1
          ? "The challenge is done"
          : `All ${me.progress.requiredChallengeCount ?? me.hackathon.challenges.length} challenges are done`}
      </h2>
      <p className="relative mx-auto mt-2 max-w-lg text-sm text-[#cfdbe8]">
        Mark the hackathon complete to lock in your submission. You won&apos;t be able to change your resume,
        interviews or links afterwards.
      </p>
      <div className="relative mt-6 flex flex-wrap justify-center gap-3">
        {confirming ? (
          <>
            <button
              type="button"
              disabled={complete.isPending}
              onClick={() => complete.mutate()}
              className="hk-btn h-12 px-7 text-sm disabled:pointer-events-none disabled:opacity-60"
            >
              {complete.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Submitting…
                </>
              ) : (
                "Yes, submit my hackathon"
              )}
            </button>
            <button type="button" className={hkSecondaryButton} onClick={() => setConfirming(false)} disabled={complete.isPending}>
              Not yet
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="hk-btn hk-btn-idle h-12 w-full px-6 text-sm sm:h-14 sm:w-auto sm:px-8 sm:text-base">
            Mark the Hackathon Complete
          </button>
        )}
      </div>
      {error ? (
        <p role="alert" className="mt-4 flex items-center justify-center gap-2 text-sm text-[#ff6f9f]">
          <AlertCircle className="size-4" aria-hidden />
          {error}
        </p>
      ) : null}
    </section>
  );
}
