"use client";

import { cn } from "@/lib/utils";
import { ixScoreColorClass } from "@/lib/ix-score-colors";

type IxScoreRingProps = {
  score: number | null;
  size?: "sm" | "md" | "lg";
  showOutOf?: boolean;
  className?: string;
  animated?: boolean;
  accentColor?: string;
};

const SIZE_MAP = {
  sm: { box: "h-16 w-16", text: "text-lg", sub: "text-[10px]", ring: 4 },
  md: { box: "h-24 w-24", text: "text-3xl", sub: "text-xs", ring: 4 },
  lg: { box: "h-32 w-32", text: "text-4xl", sub: "text-sm", ring: 5 },
};

export function IxScoreRing({
  score,
  size = "md",
  showOutOf = true,
  className,
  animated = false,
  accentColor = "#7367F0",
}: IxScoreRingProps) {
  const dims = SIZE_MAP[size];
  const display = score != null ? score : "—";
  const pct = score != null ? Math.min(100, Math.max(0, score)) : 0;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full",
        dims.box,
        animated && "animate-circle-progress",
        className,
      )}
      style={{
        background:
          score != null
            ? `conic-gradient(${accentColor} ${pct * 3.6}deg, ${accentColor}22 0deg)`
            : `${accentColor}14`,
        boxShadow:
          score != null
            ? `0 0 0 ${dims.ring}px ${accentColor}22, 0 8px 24px ${accentColor}18`
            : `0 0 0 ${dims.ring}px ${accentColor}18`,
        transition: animated ? "background 1.2s cubic-bezier(0.22, 1, 0.36, 1)" : undefined,
      }}
    >
      <div className="flex h-[calc(100%-10px)] w-[calc(100%-10px)] flex-col items-center justify-center rounded-full bg-card/95 shadow-inner backdrop-blur-sm">
        <span
          className={cn(
            "font-bold tabular-nums leading-none",
            dims.text,
            ixScoreColorClass(score),
            animated && "animate-count-up",
          )}
        >
          {display}
        </span>
        {showOutOf && (
          <span className={cn("mt-0.5 text-muted-foreground leading-none", dims.sub)}>
            /100
          </span>
        )}
      </div>
    </div>
  );
}
