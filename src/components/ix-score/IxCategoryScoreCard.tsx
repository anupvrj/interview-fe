"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IxCategoryKey, IxCategorySnapshot } from "@/lib/api";
import { IX_CATEGORY_META } from "@/lib/ix-score-constants";
import { IX_CATEGORY_VISUAL } from "@/lib/ix-report-theme";
import { ixScoreColorClass } from "@/lib/ix-score-colors";
import { cn } from "@/lib/utils";

type IxCategoryScoreCardProps = {
  category: IxCategoryKey;
  snapshot?: IxCategorySnapshot;
  opted: boolean;
  index?: number;
};

export function IxCategoryScoreCard({
  category,
  snapshot,
  opted,
  index = 0,
}: IxCategoryScoreCardProps) {
  if (!opted) return null;

  const meta = IX_CATEGORY_META[category];
  const visual = IX_CATEGORY_VISUAL[category];
  const Icon = visual.icon;
  const score = snapshot?.score;
  const hasData = snapshot?.hasData;

  return (
    <div
      className={cn(
        "ix-report-enter group relative min-w-0 overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 sm:p-5",
        visual.cardClass,
      )}
      style={{ animationDelay: `${0.12 + index * 0.06}s` }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30"
        style={{ backgroundColor: `${visual.ringColor}22` }}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/40",
              visual.iconShell,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold text-foreground sm:text-base">
              {meta.label}
            </h3>
            {hasData && snapshot?.sessionCount != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                {snapshot.sessionCount} session
                {snapshot.sessionCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p
            className={cn(
              "text-3xl font-bold tabular-nums transition-transform duration-300 group-hover:scale-105",
              ixScoreColorClass(score),
            )}
          >
            {score ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground">/ 100</p>
        </div>
      </div>

      {hasData && score != null && (
        <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-muted/60">
          <div
            className={cn("h-full rounded-full ix-report-bar-animate", visual.barColor)}
            style={{
              width: `${Math.min(100, score)}%`,
              animationDelay: `${0.3 + index * 0.08}s`,
            }}
          />
        </div>
      )}

      {!hasData && (
        <div className="relative mt-4 rounded-lg border border-dashed border-border/70 bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">No sessions yet</p>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-3 border-[#7367F0]/30 text-[#7367F0] hover:bg-[#7367F0]/10"
          >
            <Link href={meta.hubHref}>
              Start practising
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
