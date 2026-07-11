"use client";

import { MessageCircle, Zap } from "lucide-react";
import type { IxScoreSnapshot } from "@/lib/api";
import { ixReportHeroGradient } from "@/lib/ix-report-theme";
import { ixScoreBarColor, ixScoreColorClass } from "@/lib/ix-score-colors";
import { cn } from "@/lib/utils";

type IxCommunicationBreakdownProps = {
  communication: IxScoreSnapshot["communication"];
};

function MetricBar({
  label,
  value,
  icon: Icon,
  delay,
}: {
  label: string;
  value: number | null;
  icon: typeof MessageCircle;
  delay: string;
}) {
  if (value == null) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
            <Icon className="h-4 w-4" />
          </span>
          {label}
        </span>
        <span
          className={cn(
            "text-xl font-bold tabular-nums",
            ixScoreColorClass(value),
          )}
        >
          {value}
          <span className="text-xs font-normal text-muted-foreground"> / 100</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted/70">
        <div
          className={cn(
            "h-full rounded-full ix-report-bar-animate shadow-sm",
            ixScoreBarColor(value),
          )}
          style={{ width: `${Math.min(100, value)}%`, animationDelay: delay }}
        />
      </div>
    </div>
  );
}

export function IxCommunicationBreakdown({
  communication,
}: IxCommunicationBreakdownProps) {
  const hasData =
    communication.sessionCount > 0 &&
    (communication.behavioral != null || communication.technical != null);

  if (!hasData) {
    return (
      <div className={cn(ixReportHeroGradient, "ix-report-enter p-6")}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Communication</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete interview sessions to see your behavioural and skills breakdown.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(ixReportHeroGradient, "ix-report-enter p-6 sm:p-7")}>
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7367F0]/8 text-[#7367F0]">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Communication</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Aggregated from {communication.sessionCount} session
            {communication.sessionCount === 1 ? "" : "s"} with score data
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricBar
          label="Behavioural"
          value={communication.behavioral}
          icon={MessageCircle}
          delay="0.35s"
        />
        <MetricBar
          label={communication.technicalLabel}
          value={communication.technical}
          icon={Zap}
          delay="0.45s"
        />
      </div>
    </div>
  );
}
