"use client";

import Image from "next/image";
import {
  Calendar,
  Check,
  Clock,
  FileText,
  MapPin,
  Mic,
  Plus,
  Trophy,
  Zap,
} from "lucide-react";
import { HackathonRegisterButton } from "@/components/hackathon-2026/HackathonRegisterButton";
import { HackathonRegisterHint } from "@/components/hackathon-2026/HackathonRegisterContext";
import {
  Reveal,
  Ribbon,
  parallax,
  useCountdown,
  useParallax,
} from "@/components/hackathon-2026/HackathonMotion";
import { HACKATHON_EVENT, HACKATHON_HERO } from "@/lib/hackathon-2026-content";
import { cn } from "@/lib/utils";

const FLOAT_ICONS = { FileText, Mic, Trophy } as const;

/** Solid icon tiles, matching the key visual. */
const TONE = {
  blue: "bg-gradient-to-br from-[#1a5cff] to-[#3aa6ff] text-white shadow-[0_8px_22px_rgba(30,110,255,0.45)]",
  rose: "bg-gradient-to-br from-[#5a1636] to-[#3a0f26] text-[#ff5b93] ring-1 ring-[#8a2f57]",
  cyan: "bg-gradient-to-br from-[#123f78] to-[#0c2a52] text-[#8fd3ff] ring-1 ring-[#2b69b0]",
} as const;

const TICK = "-right-2.5 top-1/2 -translate-y-1/2";

// Deterministic particle field (avoids hydration mismatch)
const PARTICLES = [
  { left: "22%", dur: "7.5s", delay: "0s", dx: "14px" },
  { left: "34%", dur: "9s", delay: "1.8s", dx: "-10px" },
  { left: "46%", dur: "8s", delay: "3.1s", dx: "8px" },
  { left: "58%", dur: "10s", delay: "0.9s", dx: "-16px" },
  { left: "67%", dur: "7s", delay: "4.2s", dx: "12px" },
  { left: "76%", dur: "9.5s", delay: "2.4s", dx: "-6px" },
  { left: "30%", dur: "11s", delay: "5.5s", dx: "18px" },
  { left: "62%", dur: "8.5s", delay: "6.3s", dx: "-12px" },
] as const;

function FloatCard({
  card,
  index,
  tick = TICK,
}: {
  card: (typeof HACKATHON_HERO.floatCards)[number];
  index: number;
  tick?: string;
}) {
  const Icon = FLOAT_ICONS[card.icon];
  return (
    <div
      className={cn(
        "relative flex w-full items-center gap-3 rounded-2xl border border-[#3a7bd0]/60 bg-[linear-gradient(135deg,rgba(24,52,98,0.82),rgba(10,26,54,0.78))] py-3 pl-3 pr-6 shadow-[0_20px_50px_rgba(0,0,0,0.45),0_0_30px_rgba(40,120,255,0.22),inset_0_1px_0_rgba(160,200,255,0.18)] backdrop-blur-md sm:gap-3.5 sm:pr-7",
        `hk-bob-${index + 1}`,
      )}
    >
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl", TONE[card.tone])}>
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="min-w-0 text-[15px] font-bold leading-snug text-white">
        {card.title}
        <span className="block font-semibold text-[#e2ecf8]">{card.subtitle}</span>
      </span>
      <span
        className={cn(
          "hk-verified absolute grid size-6 place-items-center rounded-full bg-[#22c7a9] text-[#032a22] shadow-[0_0_0_3px_#0a1f3f,0_0_14px_rgba(34,199,169,0.6)]",
          tick,
        )}
        style={{ animationDelay: `${index * 0.6}s` }}
      >
        <Check className="size-3.5" strokeWidth={3.5} aria-hidden />
      </span>
    </div>
  );
}

export function HackathonHero() {
  const visualRef = useParallax<HTMLDivElement>();

  return (
    <section className="relative overflow-hidden pt-8 sm:pt-10 lg:pt-6">
      {/* Glossy ribbons: bottom-left sweep + large sweep behind the candidate */}
      <Ribbon variant="a" slow className="-left-24 bottom-10 hidden h-[260px] w-[560px] opacity-70 lg:block" />
      <Ribbon variant="b" className="right-[-6%] top-[4%] hidden h-[760px] w-[62%] opacity-75 [mask-image:radial-gradient(ellipse_75%_70%_at_60%_55%,#000_45%,transparent_85%)] lg:block" />

      <div className="relative z-[1] mx-auto grid w-full max-w-[1240px] items-end gap-6 px-5 lg:grid-cols-[1.08fr_1fr] lg:gap-2">
        {/* ---------- Copy ---------- */}
        <div className="min-w-0 self-center py-4 text-center lg:pb-24 lg:pt-8 lg:text-left">
          <Reveal immediate>
            <div className="inline-flex items-center overflow-hidden rounded-full border border-[#2a64a8] bg-[#081c38]/80 text-xs font-bold uppercase tracking-[0.1em] shadow-[0_0_24px_rgba(30,120,255,0.18)] backdrop-blur">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 text-white">
                <Zap className="size-3.5 fill-[#39b8ff] text-[#39b8ff]" aria-hidden />
                {HACKATHON_HERO.badgeLeft}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#0f3163] px-3.5 py-2 text-[#6fcfff]">
                <Plus className="size-3.5" strokeWidth={3} aria-hidden />
                {HACKATHON_HERO.badgeRight}
              </span>
            </div>
          </Reveal>

          <h1 className="mt-6 text-[clamp(2.75rem,5.3vw,4.6rem)] font-extrabold leading-[0.98] tracking-[-0.045em] text-white">
            <Reveal immediate as="span" delay={80} className="block">
              {HACKATHON_HERO.headlineLead}
            </Reveal>
            <Reveal immediate as="span" delay={180} className="block">
              <span className="hk-grad-text sm:whitespace-nowrap">{HACKATHON_HERO.headlineAccent}</span>
            </Reveal>
          </h1>

          <Reveal immediate delay={260}>
            <p className="mx-auto mt-6 max-w-[36rem] text-base leading-7 text-[#dbe6f3] sm:text-lg sm:leading-8 lg:mx-0">
              {HACKATHON_HERO.copy}
            </p>
          </Reveal>

          <Reveal immediate delay={320}>
            <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-white sm:text-[15px] lg:justify-start lg:gap-x-7">
              <li className="inline-flex items-center gap-2.5">
                <Calendar className="size-5 text-[#2e9bff]" aria-hidden />
                {HACKATHON_EVENT.dateLabel}
              </li>
              <li className="inline-flex items-center gap-2.5">
                <Clock className="size-5 text-[#2e9bff]" aria-hidden />
                {HACKATHON_EVENT.timeLabel}
              </li>
              <li className="inline-flex items-center gap-2.5">
                <MapPin className="size-5 fill-[#2e9bff]/25 text-[#2e9bff]" aria-hidden />
                {HACKATHON_EVENT.formatLabel}
                <span className="hk-live-dot" aria-hidden />
              </li>
            </ul>
          </Reveal>

          <Reveal immediate delay={380}>
            <div className="mt-8">
              <HackathonRegisterButton
                size="lg"
                idle
                className="min-h-16 w-full rounded-2xl text-lg sm:w-auto sm:min-w-[25rem]"
              />
              <HackathonRegisterHint className="mt-3 text-center text-sm font-medium text-[#ffc44d] lg:text-left" />
            </div>
          </Reveal>

          <Reveal immediate delay={440}>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2.5 text-[13px] font-medium text-[#dbe6f3] sm:text-sm lg:justify-start lg:gap-x-6">
              {HACKATHON_HERO.checks.map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full bg-[#3aa9ff] text-[#04172f] shadow-[0_0_12px_rgba(58,169,255,0.55)]">
                    <Check className="size-3" strokeWidth={3.5} aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* ---------- Visual ---------- */}
        <div
          ref={visualRef}
          className="relative mx-auto h-[340px] w-full max-w-[640px] [--hk-fy:36%] [--hk-r:9.25rem] sm:h-[600px] lg:h-[700px]"
        >
          {/* Mobile/tablet ribbon behind the candidate (desktop uses the section-level one) */}
          <Ribbon variant="b" className="-right-[18%] top-[-6%] h-[112%] w-[125%] opacity-80 lg:hidden" />

          {/* Glow + orbits */}
          <div className="pointer-events-none absolute inset-0" style={parallax(-8)} aria-hidden>
            <div className="absolute left-1/2 top-[52%] size-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(30,120,255,0.5),rgba(22,119,255,0.12)_45%,transparent_70%)] sm:size-[580px]" />
            <div className="hk-orbit hk-orbit-a" style={{ width: 440, height: 440, left: "50%", top: "52%", marginLeft: -220, marginTop: -220 }} />
            <div className="hk-orbit hk-orbit-b" style={{ width: 580, height: 580, left: "50%", top: "52%", marginLeft: -290, marginTop: -290 }} />
          </div>

          {/* Rising particles */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {PARTICLES.map((p, i) => (
              <span
                key={i}
                className="hk-particle"
                style={
                  {
                    left: p.left,
                    "--hk-dur": p.dur,
                    "--hk-delay": p.delay,
                    "--hk-dx": p.dx,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>

          {/* Candidate — anchored to the hero's bottom edge like the key visual */}
          <Reveal immediate from="scale" delay={150} className="absolute inset-x-[-2%] bottom-0 top-[14%] z-[2]">
            <div className="relative h-full w-full" style={parallax(6)}>
              <Image
                src="/hackathon-2026/hero-candidate-desk.webp"
                alt="Candidate celebrating interview success at a desk with InterviewTrix"
                fill
                priority
                sizes="(min-width: 1024px) 660px, 95vw"
                className="object-contain object-bottom drop-shadow-[0_30px_60px_rgba(0,70,200,0.5)]"
              />
            </div>
          </Reveal>

          {/* Top handwritten note */}
          <Reveal immediate delay={600} from="none" className="absolute right-[4%] top-[2%] z-[4] hidden w-[11rem] sm:block">
            <div className="hk-hand -rotate-6 text-right text-[28px] leading-[1.02] !text-white" style={parallax(10)}>
              {HACKATHON_HERO.noteTop[0]}
              <br />
              <span className="pl-8">{HACKATHON_HERO.noteTop[1]}</span>
              <svg className="hk-draw ml-auto mt-1 block h-4 w-40" viewBox="0 0 160 16" fill="none" aria-hidden>
                <path d="M2 12 C 50 2, 110 2, 158 8" stroke="#2e9bff" strokeWidth="2.5" strokeLinecap="round" style={{ "--hk-len": 170 } as React.CSSProperties} />
              </svg>
            </div>
          </Reveal>

          {/* Spark doodle near the head */}
          <Reveal immediate delay={700} from="none" className="absolute left-[26%] top-[30%] z-[3] hidden sm:block">
            <svg className="hk-draw h-14 w-14" viewBox="0 0 48 48" fill="none" aria-hidden style={parallax(12)}>
              <path d="M8 30 L2 26" stroke="#3aa6ff" strokeWidth="2.6" strokeLinecap="round" style={{ "--hk-len": 10 } as React.CSSProperties} />
              <path d="M14 20 L10 12" stroke="#3aa6ff" strokeWidth="2.6" strokeLinecap="round" style={{ "--hk-len": 10 } as React.CSSProperties} />
              <path d="M24 16 L25 6" stroke="#3aa6ff" strokeWidth="2.6" strokeLinecap="round" style={{ "--hk-len": 12 } as React.CSSProperties} />
            </svg>
          </Reveal>

          {/* Equilateral triangle around the face. Each card's inner edge sits on the same circle. */}
          <Reveal
            immediate
            from="right"
            delay={450}
            className="absolute right-[calc(50%_+_var(--hk-r))] top-[70%] z-[5] hidden w-[16rem] sm:block"
          >
            <div className="-translate-y-1/2">
              <div style={parallax(14)}>
                <FloatCard card={HACKATHON_HERO.floatCards[0]} index={0} tick="-left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </Reveal>
          <Reveal
            immediate
            from="right"
            delay={590}
            className="absolute right-[calc(50%_+_var(--hk-r)_-_7rem)] top-[20%] z-[5] hidden w-[16rem] sm:block"
          >
            <div style={parallax(18)}>
              <FloatCard card={HACKATHON_HERO.floatCards[1]} index={1} tick="-left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </Reveal>
          <Reveal
            immediate
            from="right"
            delay={730}
            className="absolute right-3 top-[70%] z-[5] hidden w-[16rem] sm:block"
          >
            <div className="-translate-y-1/2">
              <div style={parallax(22)}>
                <FloatCard card={HACKATHON_HERO.floatCards[2]} index={2} />
              </div>
            </div>
          </Reveal>

          {/* Side handwritten note — points down at the first verified card */}
          <Reveal immediate delay={1000} from="none" className="absolute left-[-6%] top-[-1%] z-[4] hidden sm:block">
            <div className="hk-hand relative -rotate-6 text-[23px] leading-[1.02] !text-white" style={parallax(10)}>
              {HACKATHON_HERO.noteSide[0]}
              <br />
              <span className="pl-3">{HACKATHON_HERO.noteSide[1]}</span>
              <svg className="hk-draw absolute -bottom-9 left-3 h-9 w-9" viewBox="0 0 36 36" fill="none" aria-hidden>
                <path d="M26 2 C 12 6, 6 16, 10 32" stroke="#2e9bff" strokeWidth="2.2" strokeLinecap="round" style={{ "--hk-len": 40 } as React.CSSProperties} />
                <path d="M4 25 L10 33 L17 27" stroke="#2e9bff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ "--hk-len": 22 } as React.CSSProperties} />
              </svg>
            </div>
          </Reveal>
        </div>

        {/* Phones: the floating cards would cover the face, so show them as a strip under the photo */}
        <ul className="relative z-[3] -mt-2 mb-5 grid grid-cols-3 gap-2.5 sm:hidden">
          {HACKATHON_HERO.floatCards.map((card) => {
            const Icon = FLOAT_ICONS[card.icon];
            return (
              <li
                key={card.title}
                className="relative flex flex-col items-center gap-2 rounded-2xl border border-[#3a7bd0]/60 bg-[linear-gradient(160deg,rgba(24,52,98,0.85),rgba(10,26,54,0.85))] px-2 pb-3 pt-3.5 text-center shadow-[0_12px_30px_rgba(0,0,0,0.4),0_0_20px_rgba(40,120,255,0.18)]"
              >
                <span className={cn("grid size-10 place-items-center rounded-xl", TONE[card.tone])}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="text-[12px] font-bold leading-tight text-white">
                  {card.title}
                  <span className="block font-medium text-[#cfdbe8]">{card.subtitle}</span>
                </span>
                <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[#22c7a9] text-[#032a22] shadow-[0_0_0_2px_#0a1f3f]">
                  <Check className="size-3" strokeWidth={3.5} aria-hidden />
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <HeroTicker />
    </section>
  );
}

function HeroTicker() {
  const countdown = useCountdown(HACKATHON_EVENT.startISO, HACKATHON_EVENT.endISO);
  const items = [...HACKATHON_HERO.marquee, ...HACKATHON_HERO.marquee];

  return (
    <div
      className="hk-enter relative z-[3] mx-auto -mt-2 w-full max-w-[1240px] px-5 pb-8"
      style={{ "--hk-delay": "600ms" } as React.CSSProperties}
    >
      <div className="flex flex-col overflow-hidden rounded-2xl border border-[#23508a] bg-[#071630]/85 shadow-[0_20px_60px_rgba(0,20,60,0.5)] backdrop-blur-md md:flex-row md:items-stretch">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[#1b3c62] px-5 py-3.5 md:flex-nowrap md:border-b-0 md:border-r">
          <span className="inline-flex items-center gap-2 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.16em] text-[#9cc6f0]">
            <span className="hk-live-dot" aria-hidden />
            {countdown.phase === "live" ? "Live now" : countdown.phase === "ended" ? "Event wrapped" : "Launch in"}
          </span>
          <CountdownDigits state={countdown} />
        </div>
        <div className="hk-marquee relative flex min-w-0 flex-1 items-center overflow-hidden py-3.5">
          <div className="hk-marquee-track flex w-max items-center gap-8 pr-8 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8fb4d9]">
            {items.map((item, i) => (
              <span key={`${item}-${i}`} className="flex items-center gap-8 whitespace-nowrap">
                {item}
                <span className="size-1 rounded-full bg-[#2bd2ff]/70" aria-hidden />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CountdownDigits({ state }: { state: ReturnType<typeof useCountdown> }) {
  if (state.phase === "live") {
    return <span className="text-sm font-bold text-[#29d6a0]">Join the stream</span>;
  }
  if (state.phase === "ended") {
    return <span className="text-sm font-bold text-[#9eb2ca]">Winners announced</span>;
  }
  const parts =
    state.phase === "upcoming"
      ? [
          { v: state.days, l: "d" },
          { v: state.hours, l: "h" },
          { v: state.minutes, l: "m" },
          { v: state.seconds, l: "s" },
        ]
      : [
          { v: null, l: "d" },
          { v: null, l: "h" },
          { v: null, l: "m" },
          { v: null, l: "s" },
        ];
  return (
    <span className="flex items-baseline gap-1.5 text-white" aria-live="off">
      {parts.map((part, i) => (
        <span key={part.l} className="flex items-baseline gap-1.5">
          <span className="hk-count-digit rounded-md bg-[#0f2f5c] px-1.5 py-0.5 text-[15px] font-extrabold tabular-nums">
            {part.v === null ? "--" : String(part.v).padStart(2, "0")}
          </span>
          <span className="text-[10px] font-semibold uppercase text-[#7fa0c2]">{part.l}</span>
          {i < parts.length - 1 && <span className="text-[#3c6a99]">:</span>}
        </span>
      ))}
    </span>
  );
}
