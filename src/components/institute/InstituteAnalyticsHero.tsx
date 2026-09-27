"use client";

import { BarChart3, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = Readonly<{
  days: number;
  interviewsInPeriod?: number;
  avgScoreInPeriod?: number | null;
  loading?: boolean;
}>;

export function InstituteAnalyticsHero({
  days,
  interviewsInPeriod,
  avgScoreInPeriod,
  loading,
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(115,103,240,0.22)]">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-[#7367F0] via-[#6e62e5] to-indigo-900"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 left-1/4 h-28 w-28 rounded-full bg-emerald-400/10 blur-3xl"
      />

      <div className="relative z-10 flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-2xl space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
            Institution
          </p>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Analytics</h1>
          <p className="text-sm leading-relaxed text-white/80">
            Day-wise trends, schedule outcomes, credit spend, invite funnel, and batch performance
            — all scoped to your selected time window.
          </p>
        </div>

        {!loading ? (
          <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
              <BarChart3 className="h-4 w-4 text-white/90" aria-hidden />
              <span className="text-sm font-semibold tabular-nums text-white">
                {days}
                <span className="font-medium text-white/85"> day window</span>
              </span>
            </div>
            {typeof interviewsInPeriod === "number" ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
                <TrendingUp className="h-4 w-4 text-white/90" aria-hidden />
                <span className="text-sm font-semibold tabular-nums text-white">
                  {interviewsInPeriod.toLocaleString()}{" "}
                  <span className="font-medium text-white/85">sessions</span>
                </span>
              </div>
            ) : null}
            {avgScoreInPeriod != null && avgScoreInPeriod > 0 ? (
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm",
                )}
              >
                <span className="text-sm font-semibold tabular-nums text-white">
                  {Math.round(avgScoreInPeriod)}
                  <span className="font-medium text-white/85"> avg score</span>
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
