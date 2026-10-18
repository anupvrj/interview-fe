"use client";

import Image from "next/image";
import { Calendar, Check, Plus, Video, Zap } from "lucide-react";
import {
  HACKATHON_FLOAT_CARD_TONE,
  HACKATHON_FLOAT_ICONS,
  HackathonFloatCard,
} from "@/components/hackathon-2026/HackathonFloatCard";
import { HackathonRegisterButton } from "@/components/hackathon-2026/HackathonRegisterButton";
import { HackathonHeroHud } from "@/components/hackathon-2026/HackathonHud";
import { HackathonRegisterHint } from "@/components/hackathon-2026/HackathonRegisterContext";
import {
  Reveal,
  Ribbon,
  parallax,
  useCountdown,
  useLoopingOfferCountdown,
  useParallax,
} from "@/components/hackathon-2026/HackathonMotion";
import { useLandingChallengeWindow } from "@/components/hackathon-2026/useLandingChallengeWindow";
import { HACKATHON_HERO, HACKATHON_LAUNCH } from "@/lib/hackathon-2026-content";
import { cn } from "@/lib/utils";

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

export function HackathonHero() {
  const visualRef = useParallax<HTMLDivElement>();
  const offerTime = useLoopingOfferCountdown();
  const challenge = useLandingChallengeWindow();

  return (
    <section className="relative overflow-hidden pt-8 sm:pt-10 lg:pt-6">
      {/* Reel-style 3D grid floor + horizon glow */}
      <div className="hk-floor" aria-hidden />
      <HackathonHeroHud className="relative z-[2] mx-auto mb-6 hidden w-full max-w-[1400px] px-5 md:block" />
      {/* Glossy ribbons: bottom-left sweep + large sweep behind the candidate */}
      <Ribbon
        variant="a"
        slow
        className="-left-24 bottom-10 hidden h-[260px] w-[560px] opacity-70 lg:block"
      />
      <Ribbon
        variant="b"
        className="right-[-6%] top-[4%] hidden h-[760px] w-[62%] opacity-75 [mask-image:radial-gradient(ellipse_75%_70%_at_60%_55%,#000_45%,transparent_85%)] lg:block"
      />

      <div className="relative z-[1] mx-auto grid w-full max-w-[1400px] items-end gap-6 px-5 lg:grid-cols-[1.08fr_1fr] lg:gap-2">
        {/* ---------- Copy ---------- */}
        <div className="min-w-0 self-center py-4 text-center lg:pb-24 lg:pt-8 lg:text-left">
          <Reveal immediate>
            <div className="inline-flex items-center overflow-hidden rounded-full border border-[#2a64a8] bg-[#081c38]/80 text-xs font-bold uppercase tracking-[0.1em] shadow-[0_0_24px_rgba(30,120,255,0.18)] backdrop-blur">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 text-white">
                <Zap
                  className="size-3.5 fill-[#39b8ff] text-[#39b8ff]"
                  aria-hidden
                />
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
              <span className="hk-grad-text sm:whitespace-nowrap">
                {HACKATHON_HERO.headlineAccent}
              </span>
            </Reveal>
          </h1>

          <Reveal immediate delay={260}>
            <p className="hk-lead mx-auto mt-6 max-w-[36rem] text-base leading-7 text-[#dbe6f3] sm:text-lg sm:leading-8 lg:mx-0">
              {HACKATHON_HERO.copy.replace(
                "{days}",
                String(challenge.dayCount),
              )}
            </p>
          </Reveal>

          <Reveal immediate delay={320}>
            <ul className="hk-meta mt-7 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2.5 text-[11px] font-medium tracking-tight text-white min-[380px]:gap-x-2 min-[380px]:text-xs min-[380px]:tracking-normal sm:gap-x-6 sm:gap-y-3 sm:text-[15px] lg:justify-start lg:gap-x-7">
              <li className="inline-flex basis-full items-center justify-center gap-2 sm:basis-auto sm:justify-start sm:gap-2.5">
                <Calendar
                  className="size-4 text-[#2e9bff] sm:size-5"
                  aria-hidden
                />
                Hackathon {challenge.publicRangeLabel}
              </li>
              <li className="inline-flex basis-full items-center justify-center gap-2 text-center sm:basis-auto sm:justify-start sm:gap-2.5 sm:text-left">
                <Video className="size-4 shrink-0 text-[#2e9bff] sm:size-5" aria-hidden />
                <span className="text-[#dbe6f3]">
                  <span className="font-semibold text-white">{HACKATHON_LAUNCH.summaryLabel}</span>
                  {" · "}
                  {HACKATHON_LAUNCH.dateLabel}, {HACKATHON_LAUNCH.timeLabel}
                </span>
                <span className="hk-live-dot shrink-0" aria-hidden />
              </li>
            </ul>
          </Reveal>

          <Reveal immediate delay={380}>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <div className="shrink-0 text-center sm:text-left">
                <p className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 sm:justify-start lg:flex-col lg:items-start lg:gap-y-1">
                  <span className="inline-flex items-baseline gap-x-2.5">
                    <span className="hk-hand text-[1.25rem] leading-none !text-white">
                      {HACKATHON_HERO.offerNow}
                    </span>
                    <span className="text-base font-semibold text-[#8fa6c0] line-through decoration-[#9eb4cc]">
                      {HACKATHON_HERO.offerWas}
                    </span>
                  </span>
                  <span className="hk-meta text-[13px] font-medium text-[#dbe6f3] sm:text-[15px]">
                    {HACKATHON_HERO.offerEndsLabel}{" "}
                    <span className="hk-num text-sm font-bold text-[#ffc44d] sm:text-base">
                      {offerTime}
                    </span>
                  </span>
                </p>
              </div>
              <HackathonRegisterButton
                ctaLocation="hero"
                size="lg"
                idle
                className="min-h-[3.75rem] w-full rounded-2xl px-8 text-base sm:w-auto sm:min-w-[17.5rem]"
              />
            </div>
            <p className="hk-meta mt-3 text-center text-sm font-medium text-[#dbe6f3] lg:text-left">
              <span className="font-semibold text-[#ffc44d]">
                {HACKATHON_HERO.seatNoteLead}
              </span>{" "}
              {HACKATHON_HERO.seatNote}
            </p>
            <HackathonRegisterHint className="mt-2 text-center text-sm font-medium text-[#ffc44d] lg:text-left" />
          </Reveal>
        </div>

        {/* ---------- Visual ---------- */}
        <div
          ref={visualRef}
          className="relative mx-auto h-[300px] w-full max-w-[640px] [--hk-fy:36%] [--hk-r:9.25rem] sm:h-[600px] lg:h-[700px]"
        >
          {/* Mobile/tablet ribbon behind the candidate (desktop uses the section-level one) */}
          <Ribbon
            variant="b"
            className="-right-[18%] top-[-6%] h-[112%] w-[125%] opacity-80 lg:hidden"
          />

          {/* Glow + orbits */}
          <div
            className="pointer-events-none absolute inset-0"
            style={parallax(-8)}
            aria-hidden
          >
            <div className="absolute left-1/2 top-[52%] size-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(30,120,255,0.5),rgba(22,119,255,0.12)_45%,transparent_70%)] sm:size-[580px]" />
            <div
              className="hk-orbit hk-orbit-a"
              style={{
                width: 440,
                height: 440,
                left: "50%",
                top: "52%",
                marginLeft: -220,
                marginTop: -220,
              }}
            />
            <div
              className="hk-orbit hk-orbit-b"
              style={{
                width: 580,
                height: 580,
                left: "50%",
                top: "52%",
                marginLeft: -290,
                marginTop: -290,
              }}
            />
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
          <Reveal
            immediate
            from="scale"
            delay={150}
            className="absolute inset-x-[-2%] bottom-0 top-0 z-[2] sm:top-[14%]"
          >
            <div className="relative h-full w-full" style={parallax(6)}>
              <Image
                src="/hackathon-2026/hero-candidate-desk.webp"
                alt="Candidate celebrating interview success at a desk with InterviewTrix"
                fill
                priority
                sizes="(min-width: 1024px) 660px, 95vw"
                className="object-contain object-top drop-shadow-[0_30px_60px_rgba(0,70,200,0.5)] sm:object-bottom"
              />
            </div>
          </Reveal>

          {/* Top handwritten note */}
          <Reveal
            immediate
            delay={600}
            from="none"
            className="absolute right-[4%] top-[2%] z-[4] hidden w-[11rem] sm:block"
          >
            <div
              className="hk-hand -rotate-6 text-right text-[28px] leading-[1.02] !text-white"
              style={parallax(10)}
            >
              {HACKATHON_HERO.noteTop[0]}
              <br />
              <span className="pl-8">{HACKATHON_HERO.noteTop[1]}</span>
              <svg
                className="hk-draw ml-auto mt-1 block h-4 w-40"
                viewBox="0 0 160 16"
                fill="none"
                aria-hidden
              >
                <path
                  d="M2 12 C 50 2, 110 2, 158 8"
                  stroke="#2e9bff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ "--hk-len": 170 } as React.CSSProperties}
                />
              </svg>
            </div>
          </Reveal>

          {/* Spark doodle near the head */}
          <Reveal
            immediate
            delay={700}
            from="none"
            className="absolute left-[26%] top-[30%] z-[3] hidden sm:block"
          >
            <svg
              className="hk-draw h-14 w-14"
              viewBox="0 0 48 48"
              fill="none"
              aria-hidden
              style={parallax(12)}
            >
              <path
                d="M8 30 L2 26"
                stroke="#3aa6ff"
                strokeWidth="2.6"
                strokeLinecap="round"
                style={{ "--hk-len": 10 } as React.CSSProperties}
              />
              <path
                d="M14 20 L10 12"
                stroke="#3aa6ff"
                strokeWidth="2.6"
                strokeLinecap="round"
                style={{ "--hk-len": 10 } as React.CSSProperties}
              />
              <path
                d="M24 16 L25 6"
                stroke="#3aa6ff"
                strokeWidth="2.6"
                strokeLinecap="round"
                style={{ "--hk-len": 12 } as React.CSSProperties}
              />
            </svg>
          </Reveal>

          {/* Equilateral triangle around the face. Each card's inner edge sits on the same circle. */}
          <Reveal
            immediate
            from="right"
            delay={450}
            className="absolute right-[calc(50%_+_var(--hk-r)_-_1.5rem)] top-[70%] z-[5] hidden w-max sm:block"
          >
            <div style={{ transform: "translate(2.75rem, -50%)" }}>
              <div style={parallax(14)}>
                <HackathonFloatCard
                  card={HACKATHON_HERO.floatCards[1]}
                  index={1}
                  tickSide="left"
                />
              </div>
            </div>
          </Reveal>
          <Reveal
            immediate
            from="right"
            delay={590}
            className="absolute right-[calc(50%_+_var(--hk-r)_-_8.5rem)] top-[20%] z-[5] hidden w-max sm:block"
          >
            <div style={parallax(18)}>
              <HackathonFloatCard
                card={HACKATHON_HERO.floatCards[0]}
                index={0}
                tickSide="left"
              />
            </div>
          </Reveal>
          <Reveal
            immediate
            from="right"
            delay={730}
            className="absolute -right-3 top-[70%] z-[5] hidden w-max sm:block"
          >
            <div className="-translate-y-1/2">
              <div style={parallax(22)}>
                <HackathonFloatCard card={HACKATHON_HERO.floatCards[2]} index={2} />
              </div>
            </div>
          </Reveal>

          {/* Side handwritten note — points down at the first verified card */}
          <Reveal
            immediate
            delay={1000}
            from="none"
            className="absolute left-[-6%] top-[-1%] z-[4] hidden sm:block"
          >
            <div
              className="hk-hand relative -rotate-6 text-[23px] leading-[1.02] !text-white"
              style={parallax(10)}
            >
              {HACKATHON_HERO.noteSide[0]}
              <br />
              <span className="pl-3">{HACKATHON_HERO.noteSide[1]}</span>
              <svg
                className="hk-draw absolute -bottom-9 left-3 h-9 w-9"
                viewBox="0 0 36 36"
                fill="none"
                aria-hidden
              >
                <path
                  d="M26 2 C 12 6, 6 16, 10 32"
                  stroke="#2e9bff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  style={{ "--hk-len": 40 } as React.CSSProperties}
                />
                <path
                  d="M4 25 L10 33 L17 27"
                  stroke="#2e9bff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ "--hk-len": 22 } as React.CSSProperties}
                />
              </svg>
            </div>
          </Reveal>
        </div>

        {/* Phones: the floating cards would cover the face, so show them as a strip under the photo */}
        <ul className="relative z-[3] -mt-2 mb-5 grid grid-cols-3 gap-1.5 sm:hidden">
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
                <span className="text-[11px] font-bold leading-tight text-white">
                  {card.title}
                  <span className="mt-0.5 block text-[10px] font-medium leading-snug text-[#cfdbe8]">
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

      <HeroTicker />
    </section>
  );
}

function countdownTarget(
  startISO: string,
  endISO: string,
  now = Date.now(),
): { startISO: string; endISO: string; label: string } {
  const challengeStart = Date.parse(startISO);
  const challengeEnd = Date.parse(endISO);
  if (now < challengeStart) {
    return {
      startISO,
      endISO: HACKATHON_LAUNCH.endISO,
      label: "Challenge opens in",
    };
  }
  if (now < challengeEnd) {
    return {
      startISO: endISO,
      endISO: HACKATHON_LAUNCH.endISO,
      label: "Submissions close in",
    };
  }
  return {
    startISO: HACKATHON_LAUNCH.startISO,
    endISO: HACKATHON_LAUNCH.endISO,
    label: "Launch in",
  };
}

function HeroTicker() {
  const challenge = useLandingChallengeWindow();
  const target = countdownTarget(challenge.startISO, challenge.endISO);
  const countdown = useCountdown(target.startISO, target.endISO);
  const items = [...HACKATHON_HERO.marquee, ...HACKATHON_HERO.marquee];

  return (
    <div
      className="hk-enter relative z-[3] mx-auto -mt-2 w-full max-w-[1400px] px-5 pb-8"
      style={{ "--hk-delay": "600ms" } as React.CSSProperties}
    >
      <div className="flex flex-col overflow-hidden rounded-2xl border border-[#23508a] bg-[#071630]/85 shadow-[0_20px_60px_rgba(0,20,60,0.5)] backdrop-blur-md md:flex-row md:items-stretch">
        <div className="flex shrink-0 flex-col items-center justify-center gap-2 border-b border-[#1b3c62] px-5 py-3.5 text-center md:flex-row md:flex-nowrap md:justify-between md:gap-x-4 md:border-b-0 md:border-r md:text-left">
          <span className="inline-flex items-center gap-2 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.16em] text-[#9cc6f0]">
            <span className="hk-live-dot" aria-hidden />
            {countdown.phase === "live"
              ? "Live now"
              : countdown.phase === "ended"
                ? "Event wrapped"
                : target.label}
          </span>
          <CountdownDigits state={countdown} />
        </div>
        <div className="hk-marquee relative flex min-w-0 flex-1 items-center overflow-hidden py-3.5">
          <div className="hk-marquee-track flex w-max items-center gap-8 pr-8 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8fb4d9]">
            {items.map((item, i) => (
              <span
                key={`${item}-${i}`}
                className="flex items-center gap-8 whitespace-nowrap"
              >
                {item}
                <span
                  className="size-1 rounded-full bg-[#2bd2ff]/70"
                  aria-hidden
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CountdownDigits({
  state,
}: {
  state: ReturnType<typeof useCountdown>;
}) {
  if (state.phase === "live") {
    return (
      <span className="text-sm font-bold text-[#29d6a0]">Join the stream</span>
    );
  }
  if (state.phase === "ended") {
    return (
      <span className="text-sm font-bold text-[#9eb2ca]">
        Winners announced
      </span>
    );
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
          <span className="text-[10px] font-semibold uppercase text-[#7fa0c2]">
            {part.l}
          </span>
          {i < parts.length - 1 && <span className="text-[#3c6a99]">:</span>}
        </span>
      ))}
    </span>
  );
}
