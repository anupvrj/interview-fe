"use client";

import { Check } from "lucide-react";
import { HackathonRegisterButton } from "@/components/hackathon-2026/HackathonRegisterButton";
import { Reveal, Ribbon } from "@/components/hackathon-2026/HackathonMotion";
import { HACKATHON_FINAL_CTA, HACKATHON_HERO } from "@/lib/hackathon-2026-content";

export function HackathonFinalCta() {
  return (
    <section id="register" className="scroll-mt-20 pb-16 pt-6 sm:pb-20">
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <Reveal from="scale">
          <div className="relative isolate overflow-hidden rounded-[26px] border-[1.5px] border-[#2a86f0]/80 bg-[radial-gradient(700px_320px_at_80%_0%,rgba(20,120,255,0.28),transparent_60%),linear-gradient(135deg,#0a2146,#0b1c3c_55%,#08152e)] px-6 py-10 shadow-[0_0_60px_rgba(30,130,255,0.18)] sm:px-10 sm:py-12">
            <span className="hk-beam" aria-hidden />
            <Ribbon variant="a" className="-bottom-20 -left-24 -z-[1] h-[240px] w-[620px] opacity-80" />
            <CornerSparks />

            <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr_auto] lg:gap-10">
              <GradCap className="hk-bob-1 mx-auto h-24 w-28 drop-shadow-[0_18px_30px_rgba(30,120,255,0.55)] sm:h-28 sm:w-32 lg:mx-0" />

              <div className="text-center lg:text-left">
                <h2 className="text-balance text-[clamp(1.5rem,2.5vw,1.9rem)] font-extrabold leading-tight tracking-[-0.03em] text-white">
                  {HACKATHON_FINAL_CTA.titleLead}{" "}
                  <span className="hk-grad-text">{HACKATHON_FINAL_CTA.titleAccent}</span>{" "}
                  {HACKATHON_FINAL_CTA.titleTail}{" "}
                  <span className="relative inline-block">
                    <span className="hk-grad-text">{HACKATHON_FINAL_CTA.titleYear}</span>
                    <span className="absolute inset-x-0 -bottom-0.5 h-[3px] rounded-full bg-gradient-to-r from-[#1a8cff] to-[#4fd2ff]" aria-hidden />
                  </span>
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#dbe6f3] lg:mx-0">
                  {HACKATHON_FINAL_CTA.copy}
                </p>
              </div>

              <div className="flex flex-col items-center gap-5 lg:items-end">
                <HackathonRegisterButton size="lg" idle className="min-h-16 w-full rounded-2xl text-lg sm:w-auto sm:min-w-[20rem]">
                  {HACKATHON_HERO.registerLabel}
                </HackathonRegisterButton>
                <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium text-[#e2ebf5]">
                  {HACKATHON_FINAL_CTA.points.map((point) => (
                    <li key={point} className="inline-flex items-center gap-2">
                      <span className="grid size-5 place-items-center rounded-full bg-[#2e9bff] text-[#04172f]">
                        <Check className="size-3" strokeWidth={3.5} aria-hidden />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function GradCap({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="hk-cap-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6cc6ff" />
          <stop offset="1" stopColor="#1463ff" />
        </linearGradient>
        <linearGradient id="hk-cap-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f7dff" />
          <stop offset="1" stopColor="#0d3fb0" />
        </linearGradient>
      </defs>
      <path d="M30 46 V70 C30 80 90 80 90 70 V46 L60 58 Z" fill="url(#hk-cap-base)" />
      <path d="M60 14 L114 38 L60 62 L6 38 Z" fill="url(#hk-cap-top)" />
      <path d="M60 14 L114 38 L60 62" fill="none" stroke="#bfe6ff" strokeOpacity="0.5" strokeWidth="1.2" />
      <path d="M100 44 V72" stroke="#6cc6ff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="76" r="5" fill="#2e9bff" />
    </svg>
  );
}

function CornerSparks() {
  return (
    <svg aria-hidden viewBox="0 0 60 60" className="hk-draw absolute right-5 top-4 hidden h-14 w-14 text-[#2e9bff] sm:block" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <path d="M18 4 L22 18" style={{ "--hk-len": 16 } as React.CSSProperties} />
      <path d="M44 10 L32 22" style={{ "--hk-len": 18 } as React.CSSProperties} />
      <path d="M56 34 L38 32" style={{ "--hk-len": 20 } as React.CSSProperties} />
    </svg>
  );
}
