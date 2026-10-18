"use client";

import { Trophy } from "lucide-react";
import type { HackathonMe } from "../api";
import { formatIst } from "../copy";

export function CompleteSection({ me }: Readonly<{ me: HackathonMe }>) {
  if (!me.progress.completed) return null;

  return (
    <section className="hk-sheen hk-bracket relative overflow-hidden rounded-2xl border border-[#1f8a82]/80 bg-gradient-to-b from-[#0c3238]/90 to-[#0a1f2b]/90 px-4 py-8 text-center sm:rounded-[28px] sm:px-10 sm:py-10">
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
