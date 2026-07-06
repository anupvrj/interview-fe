"use client";

import type { ReactNode } from "react";
import { Award } from "lucide-react";
import { ixReportHeroGradient } from "@/lib/ix-report-theme";
import { ixScoreColorClass } from "@/lib/ix-score-colors";
import { cn } from "@/lib/utils";

type IxReportPageHeroProps = {
  score: number | null;
  actions?: ReactNode;
  title?: string;
  description?: string;
};

export function IxReportPageHero({
  score,
  actions,
  title = "iX Report",
  description = "Your complete performance report card across opted-in interview categories — scores, communication, and session history in one place.",
}: IxReportPageHeroProps) {
  return (
    <div className={cn(ixReportHeroGradient, "ix-report-enter p-5 sm:p-6")}>
      <div className="relative flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/30 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7367F0]">
              Performance report
            </span>
            {score != null && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/80 px-2.5 py-1 text-xs font-semibold tabular-nums backdrop-blur-sm",
                  ixScoreColorClass(score),
                )}
              >
                <Award className="h-3.5 w-3.5 opacity-80" />
                {score} / 100
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>
        </div>
        {actions ? (
          <div className="relative flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
