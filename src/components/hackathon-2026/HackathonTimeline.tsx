"use client";

import { FileText, SquareUser, Trophy, UsersRound, type LucideIcon } from "lucide-react";
import { Reveal, Ribbon } from "@/components/hackathon-2026/HackathonMotion";
import { useLandingChallengeWindow } from "@/components/hackathon-2026/useLandingChallengeWindow";
import { HACKATHON_TIMELINE } from "@/lib/hackathon-2026-content";

const STEP_ICONS: readonly LucideIcon[] = [FileText, SquareUser, UsersRound, Trophy];

export function HackathonTimeline() {
  const challenge = useLandingChallengeWindow();
  const items = HACKATHON_TIMELINE.items.map((item, index) => {
    if (index === 0) return { ...item, date: challenge.registrationDateLabel };
    if (index === 1) return { ...item, date: challenge.dateLabel };
    return item;
  });

  return (
    <section id="timeline" className="relative scroll-mt-20 overflow-hidden py-16 sm:py-20">
      <Ribbon variant="b" className="-left-40 top-8 h-[380px] w-[320px] -scale-x-100 opacity-40 md:-left-48 md:h-[520px] md:w-[440px] md:opacity-50" />
      <Ribbon variant="a" slow className="-right-36 bottom-0 h-[220px] w-[480px] opacity-40 md:h-[280px] md:w-[580px]" />

      <div className="relative z-[1] mx-auto w-full max-w-[1360px] px-5">
        <Reveal className="mx-auto mb-10 max-w-[48rem] text-center sm:mb-12">
          <h2 className="text-[clamp(2.1rem,4.6vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-white">
            {HACKATHON_TIMELINE.titleLead} <span className="hk-grad-text">{HACKATHON_TIMELINE.titleAccent}</span>
          </h2>
          <p className="mt-3 text-base text-[#dbe6f3] sm:text-lg">{HACKATHON_TIMELINE.copy}</p>
        </Reveal>

        <Reveal from="none" className="relative mx-auto max-w-[26rem] md:max-w-none">
          {/* Connector: vertical on phones, horizontal from md up. Insets put its ends on the first/last node centres. */}
          <TrackLine className="left-6 top-6 bottom-6 w-[2px] md:hidden" vertical />
          <TrackLine
            className="hidden h-[2px] md:block md:top-[31px] md:left-[12.5%] md:right-[12.5%]"
          />

          <ol className="relative grid gap-7 md:grid-cols-4 md:gap-4">
            {items.map((item, index) => {
              const Icon = STEP_ICONS[index % STEP_ICONS.length];
              return (
                <Reveal
                  as="li"
                  key={item.title}
                  delay={150 + index * 140}
                  className="hk-tl-step group flex items-center gap-4 md:flex-col md:gap-0 md:text-center"
                >
                  <span className="hk-tl-node relative z-[1] grid size-12 shrink-0 place-items-center rounded-full border-2 border-[#3a8dff] bg-[radial-gradient(circle_at_35%_30%,#1a4fc0,#0b2153_70%)] text-[#8fd0ff] shadow-[0_0_0_5px_rgba(58,141,255,0.10),0_0_20px_rgba(58,160,255,0.38)] md:size-16">
                    <Icon className="size-5 md:size-7" strokeWidth={1.8} aria-hidden />
                  </span>
                  <div className="min-w-0 md:mt-4">
                    <p className="hk-num text-[15px] font-semibold uppercase leading-snug tracking-[0.06em] text-white sm:text-base">{item.date}</p>
                    <h3 className="mt-0.5 text-[14.5px] font-medium leading-snug text-[#cfdbe8] sm:text-[15px]">{item.title}</h3>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

function TrackLine({ className, vertical = false }: Readonly<{ className: string; vertical?: boolean }>) {
  return (
    <span aria-hidden className={`pointer-events-none absolute ${className}`}>
      <span className="absolute inset-0 rounded-full bg-[#2a64b0]/35" />
      <span
        className={`absolute inset-0 rounded-full shadow-[0_0_10px_rgba(58,160,255,0.65)] ${
          vertical
            ? "hk-timeline-fill bg-gradient-to-b from-[#1677ff] via-[#2bb8ff] to-[#1677ff]"
            : "hk-timeline-fill-x bg-gradient-to-r from-[#1677ff] via-[#2bb8ff] to-[#1677ff]"
        }`}
      />
    </span>
  );
}
