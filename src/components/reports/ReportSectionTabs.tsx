"use client";

import { useId, useState, type ReactNode } from "react";
import { ClipboardList, ShieldCheck } from "lucide-react";
import {
  IntegrityMissingPrompt,
  IntegrityReportCard,
} from "@/components/integrity/IntegrityReportCard";
import { useIntegrityConfig } from "@/hooks/useIntegrityConfig";
import { resolveIntegrityStatus } from "@/lib/integrity/resolveIntegrityStatus";
import type { IntegrityReport } from "@/lib/integrity/types";
import { cn } from "@/lib/utils";

type ReportTab = "performance" | "integrity";

function scoreBadgeClass(score: number, active: boolean) {
  if (active) {
    return "bg-white/20 text-white";
  }
  if (score >= 80) {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (score >= 50) {
    return "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
  }
  return "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
}

export function ReportSectionTabs({
  performance,
  integrityReport,
  audience,
  alwaysShowIntegrity = false,
  performanceLabel = "Score & questions",
}: Readonly<{
  performance: ReactNode;
  integrityReport?: IntegrityReport | null;
  audience: "candidate" | "reviewer";
  alwaysShowIntegrity?: boolean;
  performanceLabel?: string;
}>) {
  const baseId = useId();
  const [tab, setTab] = useState<ReportTab>("performance");
  const { isLoading, showReportToCandidate, showReportToReviewers } =
    useIntegrityConfig();

  const performancePanelId = `${baseId}-performance`;
  const integrityPanelId = `${baseId}-integrity`;
  const integrityStatus = resolveIntegrityStatus(integrityReport);
  const score = integrityReport?.score;
  const surfaceMissing =
    integrityStatus === "missing" ||
    integrityStatus === "processing" ||
    integrityStatus === "skipped";
  const allowed =
    alwaysShowIntegrity ||
    surfaceMissing ||
    (audience === "candidate"
      ? showReportToCandidate
      : showReportToReviewers);

  if (!alwaysShowIntegrity && !surfaceMissing && (isLoading || !allowed)) {
    return <div className="space-y-4 lg:space-y-6">{performance}</div>;
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {audience === "candidate" &&
      integrityStatus === "missing" &&
      tab === "performance" ? (
        <IntegrityMissingPrompt audience="candidate" compact />
      ) : null}

      <div className="rounded-xl border border-border/70 bg-card p-1 shadow-card">
        <div
          role="tablist"
          aria-label="Report sections"
          className="grid grid-cols-2 gap-1"
        >
          <button
            type="button"
            role="tab"
            id={`${baseId}-tab-performance`}
            aria-controls={performancePanelId}
            aria-selected={tab === "performance"}
            onClick={() => setTab("performance")}
            className={cn(
              "inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors sm:gap-2 sm:px-3",
              tab === "performance"
                ? "bg-[#7367F0] text-white shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{performanceLabel}</span>
          </button>
          <button
            type="button"
            role="tab"
            id={`${baseId}-tab-integrity`}
            aria-controls={integrityPanelId}
            aria-selected={tab === "integrity"}
            onClick={() => setTab("integrity")}
            className={cn(
              "inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors sm:gap-2 sm:px-3",
              tab === "integrity"
                ? "bg-[#7367F0] text-white shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">Session integrity</span>
            {integrityStatus === "missing" ? (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                  tab === "integrity"
                    ? "bg-white/20 text-white"
                    : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
                )}
              >
                Missing
              </span>
            ) : integrityStatus === "skipped" ? (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                  tab === "integrity"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
                )}
              >
                Skipped
              </span>
            ) : integrityStatus === "processing" ? (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                  tab === "integrity"
                    ? "bg-white/20 text-white"
                    : "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
                )}
              >
                Processing
              </span>
            ) : typeof score === "number" ? (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
                  scoreBadgeClass(score, tab === "integrity"),
                )}
              >
                {score}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {tab === "performance" ? (
        <div
          role="tabpanel"
          id={performancePanelId}
          aria-labelledby={`${baseId}-tab-performance`}
          className="space-y-4 lg:space-y-6"
        >
          {performance}
        </div>
      ) : (
        <div
          role="tabpanel"
          id={integrityPanelId}
          aria-labelledby={`${baseId}-tab-integrity`}
        >
          <IntegrityReportCard report={integrityReport} audience={audience} />
        </div>
      )}
    </div>
  );
}
