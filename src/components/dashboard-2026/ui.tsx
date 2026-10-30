"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Mono } from "@/components/marketing-2026/primitives";
import { geist, geistMono } from "@/components/marketing-2026/fonts";

export const EASE = [0.16, 1, 0.3, 1] as const;

/** The 2026 type scope (Geist + Geist Mono) for a logged-in page body. */
export const dash2026Scope = cn("mk26", geist.variable, geistMono.variable);

/** Section eyebrow, the logged-in twin of the marketing chapter label. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-[12px] tracking-wider text-primary", className)}>
      <Mono className="whitespace-nowrap">— {children} —</Mono>
      <span className="h-px w-20 min-w-0 shrink border-t-2 border-dotted border-primary/40" />
    </div>
  );
}

/** Score out of 100 as a gradient ring with the number in the middle. */
export function ScoreRing({ score }: { score: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[112px] shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <defs><linearGradient id="dash-ring" x1="0" x2="1"><stop offset="0" stopColor="#7367F0" /><stop offset="1" stopColor="#1F8FFF" /></linearGradient></defs>
        <motion.circle cx="50" cy="50" r={r} fill="none" stroke="url(#dash-ring)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - score / 100) }} transition={{ delay: 0.4, duration: 1.1, ease: EASE }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div><p className="text-[30px] font-black leading-none tracking-[-0.04em] tabular-nums">{score}</p><Mono className="text-[10px] text-muted-foreground">/ 100</Mono></div>
      </div>
    </div>
  );
}

/** Segmented progress for multi-step setup flows; same look as the resume flow's stepper. */
export function SegmentedSteps({ labels, current }: { labels: readonly string[]; current: number }) {
  return (
    <nav aria-label="Progress">
      <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>
        {labels.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} aria-current={active ? "step" : undefined} className="min-w-0">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#1F8FFF] transition-[width] duration-700 ease-out", done ? "w-full" : active ? "w-1/2" : "w-0")} />
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <Mono className={cn("text-[11px]", done || active ? "text-primary" : "text-muted-foreground/70")}>{done ? "✓" : String(i + 1).padStart(2, "0")}</Mono>
                <span className={cn("truncate text-[12.5px] font-medium", active ? "text-foreground" : done ? "text-foreground/80" : "text-muted-foreground", !active && "max-sm:hidden")}>{label}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
