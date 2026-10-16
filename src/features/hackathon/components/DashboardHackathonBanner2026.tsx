"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Brain, Check, Flag } from "lucide-react";
import "@/components/hackathon-2026/hackathon.css";
import {
  HACKATHON_FLOAT_CARD_TONE,
  HACKATHON_FLOAT_ICONS,
  HackathonFloatCard,
} from "@/components/hackathon-2026/HackathonFloatCard";
import { Ribbon } from "@/components/hackathon-2026/HackathonMotion";
import { HACKATHON_HERO, HACKATHON_PRIZES } from "@/lib/hackathon-2026-content";
import { cn } from "@/lib/utils";
import "./DashboardHackathonBanner.css";

const DASH_PARTICLES = [
  { left: "28%", dur: "8s", delay: "0s", dx: "10px" },
  { left: "44%", dur: "9.5s", delay: "2s", dx: "-8px" },
  { left: "58%", dur: "7.5s", delay: "1.2s", dx: "12px" },
  { left: "72%", dur: "10s", delay: "3.4s", dx: "-14px" },
] as const;

const primaryBtn =
  "inline-flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-[#1677ff] px-5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(22,119,255,0.45)] transition-colors hover:bg-[#3a8fff] sm:w-auto";

export function DashboardHackathonBanner2026({
  live,
  message,
  when,
  cta,
  spotsLeft,
}: Readonly<{
  live: boolean;
  message: string;
  when: string | null;
  cta: { href: string; label: string } | null;
  spotsLeft: number | null | undefined;
}>) {
  const isRegisterPitch = message === HACKATHON_PRIZES.registerPitch;

  return (
    <section
      className={cn(
        "hk-dash-banner relative overflow-hidden rounded-xl border border-[#2a64a8]/45 text-white shadow-[0_16px_48px_rgba(4,12,28,0.45)]",
        live && "hk-dash-live-card border-emerald-300/40",
      )}
    >
      <Ribbon
        variant="a"
        slow
        className="pointer-events-none absolute -left-16 bottom-0 hidden h-[180px] w-[420px] opacity-60 md:block"
      />
      <Ribbon
        variant="b"
        className="pointer-events-none absolute -right-[12%] top-[-20%] h-[140%] w-[55%] opacity-70 [mask-image:radial-gradient(ellipse_70%_65%_at_55%_45%,#000_35%,transparent_88%)]"
      />

      {live ? (
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1 overflow-hidden bg-emerald-400/30" aria-hidden>
          <span className="hk-dash-live-sheen absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
        </span>
      ) : null}

      <div className="relative z-[1] grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <div className="min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
                live
                  ? "border-emerald-300/60 bg-emerald-400/20 text-emerald-100"
                  : "border-sky-300/40 bg-sky-400/10 text-sky-200",
              )}
            >
              {live ? (
                <>
                  <span className="relative flex size-2" aria-hidden>
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-75 motion-reduce:animate-none" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-300" />
                  </span>
                  <Flag className="hk-dash-live-flag size-3.5" aria-hidden />
                  Live now
                </>
              ) : (
                <>
                  <Brain className="size-3" aria-hidden />
                  Upcoming Hackathon
                </>
              )}
            </span>
            {spotsLeft != null && spotsLeft > 0 && spotsLeft < 20 ? (
              <span className="text-xs text-sky-200/80">
                {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
              </span>
            ) : null}
          </div>

          <h2 className="text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
            {HACKATHON_HERO.headlineLead}{" "}
            <span className="hk-grad-text">{HACKATHON_HERO.headlineAccent}</span>
          </h2>

          <p className="text-sm font-semibold text-[#ffc44d] sm:text-[15px]">{HACKATHON_PRIZES.poolLine}</p>

          <p
            className={cn(
              "text-sm leading-snug text-[#dbe6f3]",
              isRegisterPitch && "hk-dash-pitch text-[13px] sm:text-sm",
            )}
          >
            {message}
          </p>

          {when ? (
            <p className="text-xs font-medium text-[#8fb4d8] sm:text-[13px]">{when}</p>
          ) : null}

          {cta ? (
            <div className="pt-1">
              <Link href={cta.href} className={primaryBtn}>
                {cta.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          ) : null}

          <ul className="grid grid-cols-3 gap-1.5 pt-2 md:hidden">
            {HACKATHON_HERO.floatCards.map((card) => {
              const Icon = HACKATHON_FLOAT_ICONS[card.icon];
              return (
                <li
                  key={card.title}
                  className="relative flex flex-col items-center gap-1.5 rounded-2xl border border-[#3a7bd0]/60 bg-[linear-gradient(160deg,rgba(24,52,98,0.85),rgba(10,26,54,0.85))] px-1 pb-2.5 pt-3 text-center shadow-[0_12px_30px_rgba(0,0,0,0.4),0_0_20px_rgba(40,120,255,0.18)]"
                >
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-xl",
                      HACKATHON_FLOAT_CARD_TONE[card.tone],
                    )}
                  >
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <span className="text-[10px] font-bold leading-tight text-white">
                    {card.title}
                    <span className="mt-0.5 block text-[9px] font-medium leading-snug text-[#cfdbe8]">
                      {card.subtitle}
                    </span>
                  </span>
                  <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[#22c7a9] text-[#032a22] shadow-[0_0_0_2px_#0a1f3f]">
                    <Check className="size-3" strokeWidth={3.5} aria-hidden />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          className="relative mx-auto hidden min-h-[220px] w-full max-w-[520px] [--hk-r:6.5rem] md:block lg:min-h-[240px] lg:max-w-none"
          aria-hidden
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-[58%] size-[min(100%,280px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(30,120,255,0.45),rgba(22,119,255,0.1)_48%,transparent_72%)]" />
            <div
              className="hk-orbit hk-orbit-a"
              style={{
                width: 220,
                height: 220,
                left: "50%",
                top: "58%",
                marginLeft: -110,
                marginTop: -110,
              }}
            />
            <div
              className="hk-orbit hk-orbit-b"
              style={{
                width: 300,
                height: 300,
                left: "50%",
                top: "58%",
                marginLeft: -150,
                marginTop: -150,
              }}
            />
          </div>

          {DASH_PARTICLES.map((p, i) => (
            <span
              key={i}
              className="hk-particle pointer-events-none"
              style={
                {
                  left: p.left,
                  "--hk-dur": p.dur,
                  "--hk-delay": p.delay,
                  "--hk-dx": p.dx,
                } as CSSProperties
              }
            />
          ))}

          <div className="absolute right-[2%] top-[2%] z-[5] flex w-[10.5rem] flex-col items-end gap-3 sm:w-[11rem] sm:gap-3.5 lg:w-[11.5rem]">
            <div className="w-full text-right">
              <div className="hk-hand -rotate-6 text-[22px] leading-[1.02] !text-white lg:text-[26px]">
                {HACKATHON_HERO.noteTop[0]}
                <br />
                <span className="pl-6">{HACKATHON_HERO.noteTop[1]}</span>
                <svg className="hk-draw ml-auto mt-1 block h-3.5 w-32" viewBox="0 0 160 16" fill="none">
                  <path
                    d="M2 12 C 50 2, 110 2, 158 8"
                    stroke="#2e9bff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ "--hk-len": 170 } as CSSProperties}
                  />
                </svg>
              </div>
            </div>
            <div className="origin-top-right scale-[0.88] lg:scale-95">
              <HackathonFloatCard card={HACKATHON_HERO.floatCards[0]} index={0} tickSide="left" compact />
            </div>
          </div>

          <div className="absolute left-0 top-[8%] z-[4] hidden max-w-[10rem] lg:block">
            <div className="hk-hand -rotate-6 text-[18px] leading-[1.05] !text-white">
              {HACKATHON_HERO.noteSide[0]}
              <br />
              <span className="pl-2">{HACKATHON_HERO.noteSide[1]}</span>
            </div>
          </div>
          <div className="absolute left-[4%] top-[52%] z-[5] -translate-y-1/2 scale-[0.88] origin-left lg:scale-95">
            <HackathonFloatCard card={HACKATHON_HERO.floatCards[1]} index={1} tickSide="left" compact />
          </div>
          <div className="absolute -right-1 bottom-[8%] z-[5] scale-[0.88] origin-bottom-right lg:scale-95">
            <HackathonFloatCard card={HACKATHON_HERO.floatCards[2]} index={2} compact />
          </div>
        </div>
      </div>
    </section>
  );
}
