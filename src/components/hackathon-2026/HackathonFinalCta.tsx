"use client";

import { Award, Calendar, Trophy, Zap } from "lucide-react";
import { HackathonRegisterButton } from "@/components/hackathon-2026/HackathonRegisterButton";
import { HackathonRegisterHint } from "@/components/hackathon-2026/HackathonRegisterContext";
import { Reveal, Ribbon, useLoopingOfferCountdown } from "@/components/hackathon-2026/HackathonMotion";
import { HACKATHON_FINAL_CTA, HACKATHON_HERO } from "@/lib/hackathon-2026-content";

const POINTS = [
  { icon: Calendar, tone: "text-[#6fcfff]" },
  { icon: Trophy, tone: "text-[#ffc44d]" },
  { icon: Award, tone: "text-[#7dffc3]" },
] as const;

export function HackathonFinalCta() {
  const offerTime = useLoopingOfferCountdown();
  const title = HACKATHON_FINAL_CTA.title;
  const splitAt = title.lastIndexOf(" ");
  const titleLead = title.slice(0, splitAt);
  const titleAccent = title.slice(splitAt + 1);

  return (
    <section id="register" className="scroll-mt-20 pb-16 pt-8 sm:pb-24 sm:pt-10">
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <Reveal from="scale">
          <div className="relative isolate overflow-hidden rounded-[28px] border border-[#3a7bd0]/55 bg-[#071428] shadow-[0_30px_80px_rgba(0,16,48,0.5),0_0_70px_rgba(30,120,255,0.16)]">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_300px_at_92%_-10%,rgba(32,120,255,0.38),transparent_62%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(420px_260px_at_0%_110%,rgba(43,210,255,0.14),transparent_58%)]"
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" aria-hidden />
            <Ribbon variant="b" className="pointer-events-none absolute -right-16 -top-24 h-[340px] w-[480px] opacity-60" />

            <div className="relative z-10 flex flex-col gap-8 px-5 py-8 sm:px-10 sm:py-11 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-12 lg:py-14">
              <div className="min-w-0 max-w-xl text-center lg:text-left">
                <p className="inline-flex items-center gap-2 rounded-full border border-[#2a64a8] bg-[#081c38]/80 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#6fcfff] shadow-[0_0_24px_rgba(30,120,255,0.16)]">
                  <Zap className="size-3.5 fill-[#39b8ff] text-[#39b8ff]" aria-hidden />
                  Free registration
                </p>
                <h2 className="mt-5 text-balance text-[clamp(2.05rem,4.2vw,3.35rem)] font-extrabold leading-[0.98] tracking-[-0.04em] text-white">
                  {titleLead}{" "}
                  <span className="hk-grad-text">{titleAccent}</span>
                </h2>
                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#dbe6f3] sm:text-[15px] sm:leading-7 lg:mx-0">
                  {HACKATHON_FINAL_CTA.copy}
                </p>
                <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] font-medium text-[#e2ebf5] lg:justify-start">
                  {HACKATHON_FINAL_CTA.points.map((point, index) => {
                    const { icon: Icon, tone } = POINTS[index];
                    return (
                      <li key={point} className="inline-flex items-center gap-2">
                        <Icon className={`size-4 shrink-0 ${tone}`} strokeWidth={2} aria-hidden />
                        {point}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="w-full shrink-0 rounded-[22px] border border-[#5b9cf0]/40 bg-[linear-gradient(165deg,rgba(20,56,112,0.96),rgba(7,22,48,0.94))] p-5 text-center shadow-[0_24px_50px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(190,220,255,0.22)] sm:p-6 lg:w-[22.5rem] lg:text-left">
                <p className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 lg:justify-start">
                  <span className="hk-hand text-[1.65rem] leading-none !text-white">{HACKATHON_HERO.offerNow}</span>
                  <span className="text-lg font-semibold text-[#8fa6c0] line-through decoration-[#9eb4cc]">
                    {HACKATHON_HERO.offerWas}
                  </span>
                </p>
                <p className="mt-1.5 text-sm font-medium text-[#dbe6f3]">
                  {HACKATHON_HERO.offerEndsLabel}{" "}
                  <span className="tabular-nums text-base font-extrabold text-[#ff9a3c]">{offerTime}</span>
                </p>
                <HackathonRegisterButton
                  size="lg"
                  className="mt-5 min-h-[3.75rem] w-full rounded-2xl px-8 text-base"
                />
                <p className="mt-3 text-sm font-medium text-[#dbe6f3]">
                  <span className="font-semibold text-[#ff9a3c]">{HACKATHON_HERO.seatNoteLead}</span>{" "}
                  {HACKATHON_HERO.seatNote}
                </p>
                <HackathonRegisterHint className="mt-2 text-sm font-medium text-[#ffc44d]" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
