"use client";

import Image from "next/image";
import { Check, Trophy } from "lucide-react";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import {
  Reveal,
  Ribbon,
  trackSpotlight,
  useCountUp,
  useInView,
} from "@/components/hackathon-2026/HackathonMotion";
import { HACKATHON_PRIZES, type HackathonRewardKind } from "@/lib/hackathon-2026-content";
import { cn } from "@/lib/utils";

export function HackathonPrizes() {
  const { ref, inView } = useInView<HTMLParagraphElement>(0.6);
  const pool = useCountUp(HACKATHON_PRIZES.poolAmount, inView);

  return (
    <section id="prizes" className="relative scroll-mt-20 overflow-hidden py-16 sm:py-20">
      <Ribbon variant="b" slow className="-left-36 top-0 h-[380px] w-[320px] -scale-x-100 opacity-40 md:-left-44 md:h-[520px] md:w-[440px] md:opacity-50" />
      <Ribbon variant="b" className="-right-36 top-0 h-[380px] w-[320px] opacity-40 md:-right-44 md:h-[520px] md:w-[440px] md:opacity-50" />

      <div className="relative z-[1] mx-auto w-full max-w-[1200px] px-5">
        <Reveal className="mx-auto mb-10 max-w-[48rem] text-center">
          <h2 className="text-[clamp(2.1rem,4.6vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-white">
            The <span className="hk-grad-text">Prizes</span>
          </h2>
          <div className="mt-4 flex items-center justify-center gap-4">
            <PoolSparks />
            <p ref={ref} className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-lg font-medium text-[#e6eef8] sm:text-xl">
              <Trophy className="size-7 text-[#cfe6ff]" strokeWidth={1.8} aria-hidden />
              {HACKATHON_PRIZES.poolLead}
              <span className="hk-count-digit relative text-xl font-extrabold text-white sm:text-2xl">
                ₹{pool.toLocaleString("en-IN")} INR
                <span className="absolute inset-x-0 -bottom-1 h-[3px] rounded-full bg-gradient-to-r from-[#1a8cff] to-[#4fd2ff] shadow-[0_0_12px_rgba(40,160,255,0.8)]" aria-hidden />
              </span>
            </p>
            <PoolSparks mirrored />
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {HACKATHON_PRIZES.ranks.map((prize, index) => (
            <Reveal key={prize.rank} delay={index * 120} from="scale" className="h-full">
              <article
                onPointerMove={trackSpotlight}
                className={cn(
                  "hk-card hk-sheen flex h-full flex-col rounded-[22px] border-[1.5px] p-5 sm:p-6",
                  `hk-tier-${prize.tier}`,
                )}
              >
                {prize.tier === "gold" && <span className="hk-ring-border" aria-hidden />}

                <div className="flex flex-col items-center pb-5 text-center">
                  <div className="relative z-[3] mx-auto flex h-[118px] w-[118px] items-center justify-center sm:h-[132px] sm:w-[132px] md:h-[124px] md:w-[124px] lg:h-[140px] lg:w-[140px]">
                    <Image
                      src={prize.icon}
                      alt={prize.title}
                      width={420}
                      height={337}
                      unoptimized
                      className="hk-trophy h-full w-full object-contain"
                    />
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-white">{prize.title}</h3>
                </div>

                <ul className="mt-auto space-y-2.5">
                  {prize.rewards.map((reward) => (
                    <li
                      key={reward.label}
                      className="flex items-center gap-3.5 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3.5 py-3 transition-colors duration-300 hover:border-white/15 hover:bg-white/[0.07]"
                    >
                      <RewardIcon kind={reward.kind} />
                      <span className="text-[15px] font-semibold leading-snug text-white">
                        {reward.label}
                        {"note" in reward && reward.note ? (
                          <span className="block text-[13px] font-medium text-[#c5d3e2]">({reward.note})</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={150} className="mt-6">
          <div
            onPointerMove={trackSpotlight}
            className="hk-card grid items-center gap-5 rounded-[22px] border border-[#2a5f9e]/80 bg-gradient-to-br from-[#0c2344] to-[#0a1a33] p-5 sm:p-7 md:grid-cols-[auto_1fr] md:gap-8"
          >
            <div className="hidden size-16 place-items-center rounded-2xl bg-[#0f2f5c] ring-1 ring-[#2d6ad0] md:grid">
              <GemMark id="hk-gem-desktop" className="hk-glint h-10 w-10" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#0f2f5c] ring-1 ring-[#2d6ad0] md:hidden">
                  <GemMark id="hk-gem-mobile" className="hk-glint h-7 w-7" />
                </span>
                <h3 className="text-lg font-bold leading-snug text-white sm:text-xl">{HACKATHON_PRIZES.premium.title}</h3>
              </div>
              <ul className="mt-4 grid gap-x-6 gap-y-3 text-[15px] text-[#e2ebf5] sm:grid-cols-2 lg:grid-cols-3">
                {HACKATHON_PRIZES.premium.benefits.map((benefit) => (
                  <li key={benefit} className="inline-flex items-center gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#2e9bff] text-[#04172f]">
                      <Check className="size-3" strokeWidth={3.5} aria-hidden />
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function RewardIcon({ kind }: { kind: HackathonRewardKind }) {
  if (kind === "claude") {
    // Orange starburst
    return (
      <span className="grid size-10 shrink-0 place-items-center">
        <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <rect
              key={i}
              x="14.6"
              y="2"
              width="2.8"
              height="12"
              rx="1.4"
              fill="#e8704a"
              transform={`rotate(${i * 30} 16 16)`}
            />
          ))}
        </svg>
      </span>
    );
  }
  if (kind === "voucher") {
    // Gift-card tile: lowercase "a" with a smile arrow
    return (
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#0b0d12] ring-1 ring-white/15">
        <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
          <text x="16" y="19" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">
            a
          </text>
          <path d="M8 22 Q16 27 24 22" fill="none" stroke="#ff9900" strokeWidth="2" strokeLinecap="round" />
          <path d="M21.5 20.5 L24.4 21.8 L23.2 24.6" fill="none" stroke="#ff9900" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="grid size-10 shrink-0 place-items-center">
      <InterviewTrixLogo variant="icon" className="size-9 w-auto" />
    </span>
  );
}

/** `id` must be unique per instance: a gradient inside a display:none SVG cannot be referenced. */
function GemMark({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 40 36" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9fe0ff" />
          <stop offset="0.5" stopColor="#2e9bff" />
          <stop offset="1" stopColor="#1256d8" />
        </linearGradient>
      </defs>
      <path d="M8 2 H32 L39 12 L20 34 L1 12 Z" fill={`url(#${id})`} />
      <path d="M1 12 H39 M8 2 L14 12 L20 34 L26 12 L32 2 M14 12 L20 2 L26 12" fill="none" stroke="#dff4ff" strokeOpacity="0.6" strokeWidth="1" />
    </svg>
  );
}

function PoolSparks({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 40 40"
      className={cn("hk-draw hidden h-10 w-10 text-[#2e9bff] sm:block", mirrored && "-scale-x-100")}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <path d="M32 8 L22 14" style={{ "--hk-len": 14 } as React.CSSProperties} />
      <path d="M34 20 L14 20" style={{ "--hk-len": 22 } as React.CSSProperties} />
      <path d="M32 32 L22 26" style={{ "--hk-len": 14 } as React.CSSProperties} />
    </svg>
  );
}
