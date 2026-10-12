"use client";

import Image from "next/image";
import { FileCheck2, Gift, MessagesSquare, MonitorPlay, Trophy, type LucideIcon } from "lucide-react";
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

                <div className="mt-5 flex justify-center">
                  <p className="inline-flex items-center justify-center rounded-full border border-[#d6a440]/70 bg-[#120e08]/80 px-3.5 py-1.5 text-[13px] font-semibold text-[#ffd45e] shadow-[0_0_18px_rgba(214,164,64,0.18)] sm:text-sm">
                    Approx. total value: ₹{prize.approxValue.toLocaleString("en-IN")}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={150} className="mt-6">
          <CreditsStrip />
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

const CREDIT_ICONS: Record<"interview" | "ats" | "premium", LucideIcon> = {
  interview: MessagesSquare,
  ats: FileCheck2,
  premium: MonitorPlay,
};

function CreditsStrip() {
  const { title, lead, items } = HACKATHON_PRIZES.credits;
  return (
    <div
      onPointerMove={trackSpotlight}
      className="hk-card grid items-center gap-5 rounded-[22px] border border-[#2a5f9e]/80 bg-gradient-to-br from-[#0c2344] to-[#0a1a33] p-5 sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-0 lg:px-7"
    >
      <div className="flex items-center gap-4 lg:pr-5">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#0f2f5c] ring-1 ring-[#2d6ad0] shadow-[0_0_22px_rgba(46,155,255,0.25)]">
          <Gift className="hk-glint size-8 text-[#7cc8ff]" strokeWidth={1.7} aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-snug sm:text-xl lg:text-lg xl:whitespace-nowrap">
            <span className="hk-grad-text">{title}</span>
          </h3>
          <p className="mt-1 text-[15px] text-[#c5d3e2]">{lead}</p>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-3 sm:gap-0">
        {items.map((item) => {
          const Icon = CREDIT_ICONS[item.icon];
          const value = "value" in item ? item.value : null;
          return (
            <li
              key={item.label}
              className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3.5 py-3 transition-colors duration-300 hover:border-white/15 hover:bg-white/[0.07] sm:rounded-none sm:border-0 sm:border-l sm:border-l-[#2a5f9e]/70 sm:bg-transparent sm:px-4 sm:py-1 sm:hover:bg-transparent"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0f2f5c] ring-1 ring-[#2d6ad0] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_0_16px_rgba(46,155,255,0.45)]">
                <Icon className="size-5 text-[#6fc0ff]" strokeWidth={1.9} aria-hidden />
              </span>
              <p className="min-w-0 text-[13.5px] font-medium leading-snug text-[#c5d3e2]">
                {value ? (
                  <span className="block text-xl font-extrabold leading-tight tabular-nums text-white">{value}</span>
                ) : null}
                <span className={cn(!value && "font-semibold text-white")}>{item.label}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </div>
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
