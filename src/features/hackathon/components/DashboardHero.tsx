"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Flag, Sparkles } from "lucide-react";
import { Ribbon } from "@/components/hackathon-2026/HackathonMotion";
import type { HackathonMe } from "../api";
import { formatIst } from "../copy";
import { hackathonKeys } from "../hooks";
import { Countdown } from "./Countdown";
import { DashboardArt } from "./DashboardArt";
import { cn } from "@/lib/utils";

const KIND_COPY: Record<string, string> = {
  resume: "resume",
  screening: "screening",
  coding: "coding",
  system_design: "system design",
  social: "social",
};

function ProgressRing({ value, max }: Readonly<{ value: number; max: number }>) {
  // Fixed id: this app's useId() prefix differs between server and client (hydration mismatch).
  const gradId = "hk-dash-ring";
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="flex shrink-0 flex-col items-center">
      <div className="relative grid size-[7.5rem] place-items-center sm:size-32">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(120,160,220,0.14)" strokeWidth="7" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            className="drop-shadow-[0_0_6px_rgba(43,210,255,0.7)] transition-[stroke-dashoffset] duration-700"
          />
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1677ff" />
              <stop offset="100%" stopColor="#2bd2ff" />
            </linearGradient>
          </defs>
        </svg>
        <p className="relative font-extrabold leading-none tracking-tight text-white" aria-label={`${value} of ${max} challenges done`}>
          <span className="text-[2.75rem] tabular-nums sm:text-5xl">{value}</span>
          <span className="text-lg text-[#cfdbe8] sm:text-xl">/{max || 0}</span>
        </p>
      </div>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-white">Challenges</p>
    </div>
  );
}

function PhasePill({ me }: Readonly<{ me: HackathonMe }>) {
  const queryClient = useQueryClient();
  const { phase, endsAt, startsAt, serverNow } = me.hackathon;
  const refresh = () => void queryClient.invalidateQueries({ queryKey: hackathonKeys.me(me.hackathon.slug) });

  if (phase === "live") {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-[#29d6a0]/60 bg-[#0b2e2b]/70 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-[#29d6a0]">
        <span className="hk-live-dot" aria-hidden />
        Live now
        {endsAt ? (
          <span className="font-semibold normal-case tracking-normal text-[#bfeee0]">
            · closes in <Countdown compact target={endsAt} serverNow={serverNow} onDone={refresh} />
          </span>
        ) : null}
      </span>
    );
  }
  if (phase === "ended") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-[#ffc44d]/50 bg-[#2e2410]/60 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-[#ffc44d]">
        <Flag className="size-3.5" aria-hidden /> Closed
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-[#3aa0ff]/55 bg-[#0d2550]/70 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-[#6fc0ff]">
      <Sparkles className="size-3.5" aria-hidden /> Upcoming
      {startsAt ? <span className="font-semibold normal-case tracking-normal text-[#cfdbe8]">· opens {formatIst(startsAt)}</span> : null}
    </span>
  );
}

export function DashboardHero({ me }: Readonly<{ me: HackathonMe }>) {
  const { phase, title, challenges } = me.hackathon;
  const required = me.progress.requiredChallengeCount ?? challenges.length;
  const done = me.progress.challengesCompleted;
  const remaining = Math.max(0, required - done);
  const firstName = me.profile.name?.split(" ")[0];
  const current = (me.progress.challenges ?? []).find(
    (c) => c.state === "available" || c.state === "in_progress" || c.state === "processing",
  );

  return (
    <section className="relative isolate overflow-hidden rounded-[24px] border border-[#2a64b0]/60 bg-[radial-gradient(700px_380px_at_75%_120%,rgba(40,90,255,0.35),transparent_65%),linear-gradient(135deg,#0c2246_0%,#0a1b3a_55%,#0b1a40_100%)] px-5 py-6 shadow-[0_30px_80px_rgba(0,20,60,0.45),inset_0_1px_0_rgba(140,190,255,0.12)] sm:rounded-[28px] sm:px-8 sm:py-8 lg:px-10">
      <Ribbon variant="a" className="-bottom-24 left-[30%] -z-[1] h-[260px] w-[760px] opacity-60" />
      <Ribbon variant="b" slow className="-right-24 -top-16 -z-[1] hidden h-[420px] w-[460px] opacity-50 lg:block" />

      <div className="grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,300px)] lg:gap-8">
        {/* Greeting */}
        <div className="min-w-0 text-center lg:text-left">
          <PhasePill me={me} />
          <h1 className="mt-4 text-balance text-[2rem] font-extrabold leading-[1.08] tracking-[-0.035em] text-white sm:text-[2.6rem] lg:text-[2.85rem]">
            {firstName ? `Hi ${firstName}, ` : ""}
            <span className="hk-grad-text">{phase === "ended" ? "here’s your run" : "let’s do this"}</span>{" "}
            <span className="hk-wave-hand inline-block" role="img" aria-label="waving hand">
              👋
            </span>
          </h1>
          <p className="mt-3 text-pretty text-base text-[#cfdbe8] sm:text-lg">{title}</p>
          <p className="mt-2 text-pretty text-base text-white sm:text-lg">
            Finish each challenge to unlock the next.
            {current ? (
              <>
                {" "}
                You’re on <strong className="font-bold text-[#3aa6ff]">{KIND_COPY[current.kind] ?? current.kind}</strong>.
              </>
            ) : me.progress.completed ? (
              " You’re all done."
            ) : (
              ` ${done} of ${required} complete.`
            )}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-5 sm:gap-7">
          <ProgressRing value={done} max={required} />
          <div className="grid w-[11.5rem] gap-3 sm:w-[12.5rem]">
            <Stat label="Completed" value={done} tone="teal" />
            <Stat label="Remaining" value={remaining} tone="blue" />
          </div>
        </div>

        {/* Illustration */}
        <DashboardArt className="mx-auto hidden max-w-[300px] sm:block lg:mx-0" />
      </div>
    </section>
  );
}

function Stat({ label, value, tone }: Readonly<{ label: string; value: number; tone: "teal" | "blue" }>) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#2f64a8]/70 bg-[#071630]/75 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(140,190,255,0.08)]">
      {tone === "teal" ? (
        <CheckCircle2 className="size-9 shrink-0 text-[#29d6a0] drop-shadow-[0_0_8px_rgba(41,214,160,0.5)]" strokeWidth={1.8} aria-hidden />
      ) : (
        <span className="size-9 shrink-0 rounded-full border-[3px] border-[#3a8dff] shadow-[0_0_10px_rgba(58,141,255,0.45)]" aria-hidden />
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#cfdbe8]">{label}</p>
        <p className={cn("mt-0.5 text-[1.75rem] font-extrabold leading-none tabular-nums text-white")}>{value}</p>
      </div>
    </div>
  );
}
