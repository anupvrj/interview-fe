"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mono } from "@/components/marketing-2026/primitives";
import { EASE, Eyebrow, ScoreRing } from "./ui";

/** The last scored rounds as a small line, oldest to newest — one measure, one axis. */
function ScoreTrend({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  const w = 220, h = 56, pad = 4;
  const pts = scores.map((s, i) => [pad + (i * (w - pad * 2)) / (scores.length - 1), h - pad - (s / 100) * (h - pad * 2)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full" role="img" aria-label={`Scores of your last ${scores.length} rounds: ${scores.join(", ")}`}>
      <defs><linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#7367F0" stopOpacity=".25" /><stop offset="1" stopColor="#7367F0" stopOpacity="0" /></linearGradient></defs>
      <line x1={pad} x2={w - pad} y1={h / 2} y2={h / 2} stroke="hsl(var(--border))" strokeDasharray="3 4" />
      <path d={`${d} L${last[0]} ${h} L${pts[0][0]} ${h}Z`} fill="url(#trend-fill)" />
      <path d={d} fill="none" stroke="#7367F0" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="4" fill="hsl(var(--card))" stroke="#7367F0" strokeWidth="2" />
    </svg>
  );
}

export type PracticeHeroProps = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  startLabel: string;
  onStart: () => void;
  starting?: boolean;
  /** Other formats, shown as a quiet line under the buttons. */
  links: { label: string; href: string }[];
  last?: { score: number; title: string; meta: string; href: string } | null;
  /** Oldest → newest. */
  trend: number[];
  emptyLast: string;
  stats: [label: string, value: string, hint: string][];
};

/** Hero shared by the practice pages: the pitch, a way in, the last scored round and the numbers behind it. */
export function PracticeHero({ eyebrow, title, accent, description, startLabel, onStart, starting, links, last, trend, emptyLast, stats }: PracticeHeroProps) {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.55, ease: EASE },
  });
  const delta = trend.length > 1 ? trend[trend.length - 1] - trend[0] : 0;

  return (
    <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
      <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_60%_at_10%_0%,rgba(115,103,240,.14),transparent_70%),radial-gradient(40%_60%_at_95%_30%,rgba(31,143,255,.10),transparent_70%)]" />
      <div className="relative grid items-center gap-8 p-6 md:p-9 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <motion.div {...rise(0)}><Eyebrow>{eyebrow}</Eyebrow></motion.div>
          <motion.h1 {...rise(0.08)} className="text-balance mt-5 text-[32px] font-black leading-[1.03] tracking-[-0.05em] text-foreground sm:text-[42px] xl:text-[50px]">
            {title}{" "}
            <span className="bg-gradient-to-r from-[#7367F0] to-[#1F8FFF] bg-clip-text text-transparent">{accent}</span>
          </motion.h1>
          <motion.p {...rise(0.16)} className="text-balance mt-4 max-w-[56ch] text-[15.5px] leading-relaxed text-muted-foreground md:text-[17px]">
            {description}
          </motion.p>
          <motion.div {...rise(0.24)} className="mt-6 grid grid-cols-2 gap-2.5 sm:flex sm:gap-3">
            <Button type="button" disabled={starting} onClick={onStart} className="h-11 rounded-xl px-3 text-[14px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90 sm:px-5 sm:text-[14.5px]">
              {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {startLabel}
            </Button>
            {last ? (
              <Button asChild variant="outline" className="h-11 rounded-xl px-3 text-[14px] sm:px-5 sm:text-[14.5px]">
                <Link href={last.href}>Last report <ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
            ) : null}
          </motion.div>
          {links.length > 0 && (
            <motion.p {...rise(0.3)} className="mt-4 text-[13.5px] text-muted-foreground">
              Need another format?{" "}
              {links.map((l, i) => (
                <span key={l.href}>
                  {i > 0 && " · "}
                  <Link href={l.href} className="font-medium text-foreground underline decoration-primary/40 underline-offset-4 hover:text-primary">{l.label}</Link>
                </span>
              ))}
            </motion.p>
          )}
        </div>

        <motion.div {...rise(0.3)} className="rounded-2xl border border-border bg-background/70 p-5 shadow-[0_24px_50px_-30px_rgba(47,43,61,.45)] backdrop-blur">
          <Mono className="text-[11px] text-muted-foreground">LAST SCORED ROUND</Mono>
          {last ? (
            <>
              <div className="mt-3 flex items-center gap-4">
                <ScoreRing score={last.score} />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">{last.title}</p>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">{last.meta}</p>
                  <Link href={last.href} className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">
                    Read the report <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              {trend.length > 1 && (
                <div className="mt-4 border-t border-border pt-3">
                  <div className="flex items-baseline justify-between">
                    <Mono className="text-[10.5px] text-muted-foreground">LAST {trend.length} ROUNDS</Mono>
                    <Mono className={cn("text-[11px]", delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500")}>
                      {delta >= 0 ? "+" : ""}{delta} since the first
                    </Mono>
                  </div>
                  <ScoreTrend scores={trend} />
                </div>
              )}
            </>
          ) : (
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">{emptyLast}</p>
          )}
        </motion.div>
      </div>

      <motion.div {...rise(0.36)} className="relative grid grid-cols-2 border-t border-border md:grid-cols-4 md:divide-x md:divide-border [&>*:nth-child(-n+2)]:max-md:border-b [&>*:nth-child(odd)]:max-md:border-r">
        {stats.map(([k, v, d]) => (
          <div key={k} className="border-border px-5 py-4 md:px-6">
            <p className="text-[12.5px] text-muted-foreground">{k}</p>
            <Mono className="mt-1 block text-[24px] tracking-tight text-foreground">{v}</Mono>
            <p className="text-[11.5px] text-muted-foreground/80">{d}</p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

/** Section header used above each practice list: eyebrow, title, one line, and room for tabs or actions. */
export function ListHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.035em] text-foreground">{title}</h2>
        <p className="mt-1 text-[13.5px] text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
