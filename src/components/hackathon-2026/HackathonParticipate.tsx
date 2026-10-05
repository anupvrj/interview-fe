"use client";

import { Fragment } from "react";
import { ArrowRight, FileText, MessageSquareText, Share2, UserPlus } from "lucide-react";
import { HackathonRegisterButton } from "@/components/hackathon-2026/HackathonRegisterButton";
import { Reveal, Ribbon, trackSpotlight } from "@/components/hackathon-2026/HackathonMotion";
import { HACKATHON_HERO, HACKATHON_STEPS } from "@/lib/hackathon-2026-content";
import { cn } from "@/lib/utils";

const ICONS = { UserPlus, FileText, MessageSquareText, Share2 } as const;

type Accent = (typeof HACKATHON_STEPS)[number]["accent"];

const ACCENT: Record<Accent, { rgb: string; card: string; badge: string; icon: string }> = {
  blue: {
    rgb: "43 140 255",
    card: "border-[#2a64b0]/80 from-[#0f2a52]/90 to-[#0a1b36]/90",
    badge: "bg-[#1d9bff] text-white shadow-[0_0_16px_rgba(29,155,255,0.6)]",
    icon: "bg-gradient-to-br from-[#1a4fc0] to-[#0f2f7a] text-[#6fc0ff] ring-1 ring-[#2d6ad0]",
  },
  teal: {
    rgb: "41 214 180",
    card: "border-[#1f8a82]/80 from-[#0c3238]/90 to-[#0a1f2b]/90",
    badge: "bg-[#22d3b0] text-[#03201a] shadow-[0_0_16px_rgba(34,211,176,0.55)]",
    icon: "bg-gradient-to-br from-[#0f5552] to-[#0a3336] text-[#4ee6cf] ring-1 ring-[#1f8a82]",
  },
  amber: {
    rgb: "90 160 255",
    card: "border-[#2a64b0]/80 from-[#0f2a52]/90 to-[#0a1b36]/90",
    badge: "bg-[#ffc233] text-[#2a1c00] shadow-[0_0_16px_rgba(255,194,51,0.55)]",
    icon: "bg-gradient-to-br from-[#1a4fc0] to-[#0f2f7a] text-[#6fc0ff] ring-1 ring-[#2d6ad0]",
  },
  rose: {
    rgb: "255 79 139",
    card: "border-[#8a3560]/80 from-[#2e1330]/90 to-[#1a0f24]/90",
    badge: "bg-[#ff4f8b] text-white shadow-[0_0_16px_rgba(255,79,139,0.55)]",
    icon: "bg-gradient-to-br from-[#5a1a3e] to-[#3a1028] text-[#ff5f97] ring-1 ring-[#8a3560]",
  },
};

export function HackathonParticipate() {
  return (
    <section id="participate" className="relative scroll-mt-20 overflow-hidden px-3 pb-16 pt-10 sm:px-5 sm:pb-20">
      {/* Ribbons sweep behind the panel from the page edges */}
      <Ribbon variant="b" className="-left-40 top-0 h-[420px] w-[360px] -scale-x-100 opacity-50 md:-left-56 md:h-[560px] md:w-[520px] md:opacity-70" />
      <Ribbon variant="b" slow className="-right-40 top-0 h-[420px] w-[360px] opacity-50 md:-right-56 md:h-[560px] md:w-[520px] md:opacity-70" />
      <Ribbon variant="a" className="-bottom-10 -left-40 h-[200px] w-[520px] opacity-50 md:h-[260px] md:w-[620px] md:opacity-60" />

      <div className="hk-panel relative z-[1] mx-auto w-full max-w-[1280px] overflow-hidden rounded-[32px] px-4 py-14 backdrop-blur-[2px] sm:rounded-[40px] sm:px-8 sm:py-16">

        <div className="relative z-[1] mx-auto w-full max-w-[1160px]">
          <Reveal className="mx-auto mb-12 max-w-[48rem] text-center">
            <h2 className="text-[clamp(2.1rem,4.6vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-white">
              How to <span className="hk-grad-text">Participate</span>
            </h2>
            <p className="mt-3 text-base text-[#dbe6f3] sm:text-lg">
              Complete these 4 simple steps and showcase your journey with Interview Trix.
            </p>
          </Reveal>

          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:gap-3">
            {HACKATHON_STEPS.map((step, index) => {
              const Icon = ICONS[step.icon];
              const accent = ACCENT[step.accent];
              return (
                <Fragment key={step.title}>
                  <Reveal as="li" delay={index * 110} className="h-full">
                    <article
                      onPointerMove={trackSpotlight}
                      style={{ "--hk-accent": accent.rgb } as React.CSSProperties}
                      className={cn(
                        "hk-card relative flex h-full flex-col items-center rounded-[22px] border bg-gradient-to-b px-5 pb-7 pt-6 text-center backdrop-blur-sm lg:min-h-[21rem] lg:pb-8 lg:pt-11",
                        accent.card,
                      )}
                    >
                      <span
                        className={cn(
                          "absolute left-4 top-4 grid size-9 place-items-center rounded-full text-base font-extrabold",
                          accent.badge,
                        )}
                      >
                        {step.num}
                      </span>
                      <span className={cn("hk-lift mb-5 grid size-[68px] place-items-center rounded-2xl", accent.icon)}>
                        <Icon className="size-8" strokeWidth={1.9} aria-hidden />
                      </span>
                      <h3 className="text-lg font-bold leading-snug text-white sm:text-[19px]">{step.title}</h3>
                      <p className="mx-auto mt-3 max-w-[18rem] text-[14.5px] leading-[1.65] text-[#cfdbe8]">{step.body}</p>
                    </article>
                  </Reveal>
                  {index < HACKATHON_STEPS.length - 1 && (
                    <li aria-hidden className="hidden items-center lg:flex">
                      <ArrowRight className="hk-nudge size-6 text-white" strokeWidth={2.2} />
                    </li>
                  )}
                </Fragment>
              );
            })}
          </ol>

          <Reveal delay={300} className="mt-12 flex items-center justify-center gap-5">
            <Sparks />
            <HackathonRegisterButton size="lg" className="min-w-[18rem] rounded-2xl text-lg">
              {HACKATHON_HERO.startChallengeLabel}
            </HackathonRegisterButton>
            <Sparks mirrored />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Sparks({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 40 40"
      className={cn("hk-draw hidden h-11 w-11 text-[#2e9bff] sm:block", mirrored && "-scale-x-100")}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <path d="M30 8 L20 14" style={{ "--hk-len": 14 } as React.CSSProperties} />
      <path d="M32 20 L14 20" style={{ "--hk-len": 20 } as React.CSSProperties} />
      <path d="M30 32 L20 26" style={{ "--hk-len": 14 } as React.CSSProperties} />
    </svg>
  );
}
