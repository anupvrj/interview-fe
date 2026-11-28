"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, CircleAlert } from "lucide-react";
import { Mono } from "@/components/marketing-2026/primitives";
import type { AtsHistoryEntry } from "@/lib/api";
import { atsProgress } from "@/lib/atsProgress";
import { cn } from "@/lib/utils";

/**
 * "Your progress": the score across the resume's last full checks, points gained, and which
 * checks were fixed (or newly flagged) since the previous check. Hidden until there are two.
 */
export function ATSProgressCard({ history, labels }: { history: AtsHistoryEntry[]; labels: Record<string, string> }) {
  const progress = atsProgress(history);
  const [hover, setHover] = useState<number | null>(null);
  if (!progress) return null;
  const { series, sinceFirst, sinceLast, fixedSinceLast, newSinceLast } = progress;

  // Trend line: score 0–100 on a fixed scale, so movement reads true.
  const W = 300, H = 72, pad = 6;
  const x = (i: number) => pad + (series.length === 1 ? 0 : (i * (W - pad * 2)) / (series.length - 1));
  const y = (score: number) => pad + ((100 - score) * (H - pad * 2)) / 100;
  const path = series.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
  const shown = hover !== null ? series[hover] : series[series.length - 1];
  const up = sinceFirst >= 0;

  return (
    <section className="overflow-hidden rounded-[22px] border border-border bg-card" aria-labelledby="ats-progress-title">
      <div className="border-b border-border px-5 py-4">
        <Mono className="text-[11px] text-primary">— YOUR PROGRESS —</Mono>
        <p id="ats-progress-title" className="mt-1 flex items-center gap-1.5 text-[15px] font-semibold text-foreground">
          {up ? <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <ArrowDownRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
          {sinceFirst === 0 ? "Same score as your first check" : `${up ? "Up" : "Down"} ${Math.abs(sinceFirst)} points since your first check`}
        </p>
        {sinceLast !== undefined && sinceLast !== 0 && (
          <p className="mt-0.5 text-[13px] text-muted-foreground">{sinceLast > 0 ? "+" : ""}{sinceLast} since the previous check</p>
        )}
      </div>
      <div className="px-5 pt-4">
        <div className="flex items-baseline justify-between">
          <Mono className="text-[11px] text-muted-foreground">{series.length} CHECKS</Mono>
          <span className="text-[12.5px] text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{shown.score}</span>
            {" · "}
            {new Date(shown.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
          </span>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mt-1 h-[72px] w-full"
          role="img"
          aria-label={`ATS score over ${series.length} checks: ${series.map((p) => p.score).join(", ")}`}
          onMouseLeave={() => setHover(null)}
        >
          <line x1={pad} x2={W - pad} y1={y(50)} y2={y(50)} className="stroke-border" strokeDasharray="3 4" />
          <path d={path} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {series.map((p, i) => (
            <g key={p.at}>
              <circle cx={x(i)} cy={y(p.score)} r={hover === i || i === series.length - 1 ? 4.5 : 3} className="fill-card stroke-primary" strokeWidth={2} />
              {/* a wider invisible target for hover and touch */}
              <rect x={x(i) - 12} y={0} width={24} height={H} fill="transparent" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />
            </g>
          ))}
        </svg>
      </div>
      {(fixedSinceLast.length > 0 || newSinceLast.length > 0) && (
        <ul className="space-y-1.5 px-5 pb-4 pt-2">
          {fixedSinceLast.slice(0, 4).map((id) => (
            <li key={id} className="flex items-center gap-2 text-[13px] text-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              {labels[id] ?? id} <span className="text-muted-foreground">fixed</span>
            </li>
          ))}
          {newSinceLast.slice(0, 3).map((id) => (
            <li key={id} className="flex items-center gap-2 text-[13px] text-foreground">
              <CircleAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              {labels[id] ?? id} <span className="text-muted-foreground">needs a look</span>
            </li>
          ))}
        </ul>
      )}
      <p className={cn("border-t border-border px-5 py-3 text-[12px] text-muted-foreground", fixedSinceLast.length + newSinceLast.length === 0 && "mt-3")}>
        Each full check is saved here (last 20). Scores move only when your resume changes.
      </p>
    </section>
  );
}
