"use client";

import { Check, FileText, Mic, Trophy } from "lucide-react";
import { HACKATHON_HERO } from "@/lib/hackathon-2026-content";
import { cn } from "@/lib/utils";

export const HACKATHON_FLOAT_ICONS = { FileText, Mic, Trophy } as const;

export const HACKATHON_FLOAT_CARD_TONE = {
  blue: "bg-gradient-to-br from-[#1a5cff] to-[#3aa6ff] text-white shadow-[0_8px_22px_rgba(30,110,255,0.45)]",
  rose: "bg-gradient-to-br from-[#5a1636] to-[#3a0f26] text-[#ff5b93] ring-1 ring-[#8a2f57]",
  cyan: "bg-gradient-to-br from-[#123f78] to-[#0c2a52] text-[#8fd3ff] ring-1 ring-[#2b69b0]",
} as const;

const TICK = "-right-2.5 top-1/2 -translate-y-1/2";

export type HackathonFloatCardData = (typeof HACKATHON_HERO.floatCards)[number];

export function HackathonFloatCard({
  card,
  index,
  tickSide = "right",
  compact = false,
}: {
  card: HackathonFloatCardData;
  index: number;
  tickSide?: "left" | "right";
  compact?: boolean;
}) {
  const Icon = HACKATHON_FLOAT_ICONS[card.icon];
  const tick = tickSide === "left" ? "-left-2.5 top-1/2 -translate-y-1/2" : TICK;
  return (
    <div
      className={cn(
        "relative flex w-max items-center gap-2 rounded-2xl border border-[#3a7bd0]/60 bg-[linear-gradient(135deg,rgba(24,52,98,0.82),rgba(10,26,54,0.78))] shadow-[0_20px_50px_rgba(0,0,0,0.45),0_0_30px_rgba(40,120,255,0.22),inset_0_1px_0_rgba(160,200,255,0.18)] backdrop-blur-md",
        compact ? "py-2 pl-2 pr-4" : "gap-3 py-3 sm:gap-3.5",
        tickSide === "left" ? (compact ? "pl-5 pr-2" : "pl-6 pr-3") : compact ? "pl-2 pr-5" : "pl-3 pr-6",
        `hk-bob-${index + 1}`,
      )}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-xl",
          compact ? "size-9" : "size-12",
          HACKATHON_FLOAT_CARD_TONE[card.tone],
        )}
      >
        <Icon className={compact ? "size-4" : "size-6"} aria-hidden />
      </span>
      <span className="min-w-0 text-[13px] font-bold leading-none text-white">
        <span className="block whitespace-nowrap">{card.title}</span>
        <span
          className={cn(
            "mt-1 block whitespace-nowrap font-semibold leading-none text-[#e2ecf8]",
            compact ? "text-[10px]" : "text-[11.5px]",
          )}
        >
          {card.subtitle}
        </span>
      </span>
      <span
        className={cn(
          "hk-verified absolute grid place-items-center rounded-full bg-[#22c7a9] text-[#032a22] shadow-[0_0_0_3px_#0a1f3f,0_0_14px_rgba(34,199,169,0.6)]",
          compact ? "size-5" : "size-6",
          tick,
        )}
        style={{ animationDelay: `${index * 0.6}s` }}
      >
        <Check className={compact ? "size-3" : "size-3.5"} strokeWidth={3.5} aria-hidden />
      </span>
    </div>
  );
}
