"use client";

import Image from "next/image";
import { Calendar, Trophy } from "lucide-react";
import { HackathonRegisterButton } from "@/components/hackathon-2026/HackathonRegisterButton";
import { HackathonRegisterHint } from "@/components/hackathon-2026/HackathonRegisterContext";
import { Reveal } from "@/components/hackathon-2026/HackathonMotion";
import { HACKATHON_FINAL_CTA } from "@/lib/hackathon-2026-content";

export function HackathonFinalCta() {
  return (
    <section id="register" className="scroll-mt-20 pb-16 pt-6 sm:pb-20">
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <Reveal from="scale">
          <div className="relative isolate overflow-hidden rounded-[22px] border-[1.5px] border-[#2a86f0]/70 bg-[#061830] shadow-[0_0_60px_rgba(30,130,255,0.18)] sm:rounded-[28px]">
            <Image
              src="/hackathon-2026/cta-summit-navy.webp"
              alt=""
              fill
              sizes="(min-width: 1200px) 1160px, 94vw"
              className="object-cover object-[78%_42%]"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#061830]/80 via-[#0a2146]/35 to-transparent"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-[radial-gradient(700px_320px_at_82%_8%,rgba(20,120,255,0.22),transparent_60%)]"
              aria-hidden
            />

            <div className="relative z-10 flex flex-col gap-6 px-5 py-8 sm:px-9 sm:py-10 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:px-12 lg:py-12">
              <div className="min-w-0 max-w-xl">
                <h2 className="text-balance text-[clamp(1.55rem,3.2vw,2.25rem)] font-extrabold leading-tight tracking-[-0.03em] text-white">
                  {HACKATHON_FINAL_CTA.title}
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#dbe6f3] sm:text-[15px] sm:leading-7">
                  {HACKATHON_FINAL_CTA.copy}
                </p>
                <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium text-[#e2ebf5]">
                  <li className="inline-flex items-center gap-2">
                    <Calendar className="size-4 shrink-0 text-[#6fcfff]" strokeWidth={2} aria-hidden />
                    {HACKATHON_FINAL_CTA.dateLabel}
                  </li>
                  <li className="inline-flex items-center gap-2">
                    <Trophy className="size-4 shrink-0 text-[#ffc44d]" strokeWidth={2} aria-hidden />
                    {HACKATHON_FINAL_CTA.prizeNote}
                  </li>
                </ul>
              </div>

              <div className="w-full shrink-0 sm:w-auto lg:self-center">
                <HackathonRegisterButton
                  size="lg"
                  className="min-h-12 w-full rounded-full px-8 text-[15px] sm:min-w-[13.5rem] lg:min-h-[3.25rem]"
                />
                <HackathonRegisterHint className="mt-2 text-center text-sm font-medium text-[#ffc44d] lg:text-right" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
