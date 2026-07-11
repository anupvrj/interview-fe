"use client";

import type { IxScoreSnapshot } from "@/lib/api";
import { BarChart3, TrendingUp } from "lucide-react";
import { IxCategoryScoreCard } from "@/components/ix-score/IxCategoryScoreCard";
import { IxScoreRing } from "@/components/ix-score/IxScoreRing";
import { ixReportHeroGradient } from "@/lib/ix-report-theme";
import { IX_CATEGORY_KEYS } from "@/lib/ix-score-constants";
import { cn } from "@/lib/utils";

type IxOverallScoreHeroProps = {
  snapshot: IxScoreSnapshot;
  viewerMode?: "self" | "candidate";
};

function gradeBand(score: number): { label: string; className: string } {
  if (score >= 80) {
    return {
      label: "Excellent",
      className:
        "border-emerald-500/30 bg-card text-emerald-700 dark:text-emerald-300",
    };
  }
  if (score >= 60) {
    return {
      label: "Good",
      className: "border-[#7367F0]/35 bg-card text-[#7367F0]",
    };
  }
  if (score >= 40) {
    return {
      label: "Fair",
      className:
        "border-amber-500/30 bg-card text-amber-700 dark:text-amber-300",
    };
  }
  return {
    label: "Needs work",
    className: "border-rose-500/30 bg-card text-rose-700 dark:text-rose-300",
  };
}

export function IxOverallScoreHero({
  snapshot,
  viewerMode = "self",
}: IxOverallScoreHeroProps) {
  const { overall } = snapshot;
  const hasOverall = overall.average != null;
  const grade = hasOverall ? gradeBand(overall.average!) : null;
  const optedCategories = IX_CATEGORY_KEYS.filter(
    (key) => snapshot.optIns[key],
  );
  const overallDescription = hasOverall
    ? viewerMode === "candidate"
      ? "Composite average across opted-in interview categories"
      : "Your composite average across opted-in interview categories"
    : viewerMode === "candidate"
      ? "Complete scored sessions to calculate the overall iX Score"
      : "Complete scored sessions to calculate your overall iX Score";

  return (
    <div
      className={cn(
        ixReportHeroGradient,
        "ix-report-enter overflow-hidden p-5 transition-shadow duration-300 hover:shadow-sm sm:p-6 lg:p-7",
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">
        {/* Left — overall score */}
        <div className="flex shrink-0 flex-col items-center gap-4 text-center lg:w-[min(100%,17.5rem)] lg:items-start lg:text-left lg:pr-2">
          <IxScoreRing
            score={overall.average}
            size="md"
            animated
            className="shrink-0"
          />

          <div className="w-full space-y-3">
            <div>
              <p className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7367F0] lg:justify-start">
                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                Overall iX Score
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {overallDescription}
              </p>
            </div>

            {grade ? (
              <div
                className={cn(
                  "w-full rounded-xl border-2 px-4 py-3 text-center lg:text-left",
                  grade.className,
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-75">
                  Grade
                </p>
                <p className="mt-0.5 text-2xl font-bold leading-none tracking-tight">
                  {grade.label}
                </p>
              </div>
            ) : null}

            {hasOverall && overall.maxRaw > 100 && overall.rawSum > 0 && (
              <div className="w-full rounded-xl border border-border/60 bg-card p-3.5">
                <div className="flex items-start gap-2.5 lg:items-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
                    <BarChart3 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Category total
                    </p>
                    <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
                      {overall.rawSum}
                      <span className="text-sm font-medium text-muted-foreground">
                        {" "}
                        / {overall.maxRaw}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Sum across opted categories
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — per-interview category scores */}
        {optedCategories.length > 0 ? (
          <div className="min-w-0 flex-1 lg:border-l lg:border-border/60 lg:pl-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Interview categories
            </p>
            <div
              className={cn(
                "grid gap-3",
                optedCategories.length === 1
                  ? "grid-cols-1"
                  : "grid-cols-1 sm:grid-cols-2",
              )}
            >
              {optedCategories.map((key, index) => (
                <IxCategoryScoreCard
                  key={key}
                  category={key}
                  opted
                  snapshot={snapshot.categories[key]}
                  index={index}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
