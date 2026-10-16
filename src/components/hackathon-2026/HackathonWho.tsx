"use client";

import { Briefcase, GraduationCap, Users } from "lucide-react";
import { HackathonRegisterButton } from "@/components/hackathon-2026/HackathonRegisterButton";
import { Reveal, Ribbon, trackSpotlight } from "@/components/hackathon-2026/HackathonMotion";
import { HACKATHON_HERO, HACKATHON_WHO } from "@/lib/hackathon-2026-content";
import { cn } from "@/lib/utils";

const ICONS = { GraduationCap, Briefcase, Users } as const;

export function HackathonWho() {
  return (
    <section id="who" className="relative scroll-mt-20 overflow-hidden py-16 sm:py-20">
      <Ribbon variant="b" slow className="-right-40 top-0 h-[380px] w-[320px] opacity-40 md:-right-48 md:h-[520px] md:w-[440px] md:opacity-50" />

      <div className="relative z-[1] mx-auto w-full max-w-[1360px] px-5">
        <Reveal className="mx-auto mb-12 max-w-[48rem] text-center">
          <h2 className="text-[clamp(2.1rem,4.6vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-white">
            {HACKATHON_WHO.titleLead} <span className="hk-grad-text">{HACKATHON_WHO.titleAccent}</span>
          </h2>
          <p className="mt-3 text-base text-[#dbe6f3] sm:text-lg">{HACKATHON_WHO.copy}</p>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          {HACKATHON_WHO.groups.map((group, index) => {
            const Icon = ICONS[group.icon];
            return (
              <Reveal key={group.title} delay={index * 110} className="h-full">
                <article
                  onPointerMove={trackSpotlight}
                  className="hk-card group flex h-full items-center gap-4 rounded-[22px] border border-[#2a64b0]/80 bg-gradient-to-b from-[#0f2a52]/90 to-[#0a1b36]/90 px-5 py-5 text-left sm:gap-5 sm:px-6 sm:py-6"
                >
                  <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#1a4fc0,#0f2f7a_75%)] text-[#6fc0ff] shadow-[0_0_0_6px_rgba(45,106,208,0.12),0_0_22px_rgba(58,160,255,0.28)] ring-1 ring-[#2d6ad0] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 sm:size-16">
                    <Icon className="size-7 sm:size-8" strokeWidth={1.8} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white sm:text-lg">{group.title}</h3>
                    <p className="mt-1 text-[14px] leading-[1.55] text-[#cfdbe8] sm:text-[14.5px]">{group.body}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={300} className="mt-12 flex justify-center">
          <HackathonRegisterButton size="lg" className={cn("min-w-[18rem] rounded-2xl text-lg")}>
            {HACKATHON_HERO.registerLabel}
          </HackathonRegisterButton>
        </Reveal>
      </div>
    </section>
  );
}
