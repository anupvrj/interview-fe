"use client";

import Link from "next/link";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IxCommunicationBreakdown } from "@/components/ix-score/IxCommunicationBreakdown";
import { IxOverallScoreHero } from "@/components/ix-score/IxOverallScoreHero";
import { IxReportPageHero } from "@/components/ix-score/IxReportPageHero";
import type { IxScoreSnapshot } from "@/lib/api";
import { appTableShell } from "@/lib/app-theme";
import { IX_CATEGORY_META } from "@/lib/ix-score-constants";
import { ixScoreColorClass } from "@/lib/ix-score-colors";
import { cn, formatDate } from "@/lib/utils";

const MOCK_SNAPSHOT: IxScoreSnapshot = {
  clerkId: "preview",
  userId: "preview",
  computedAt: new Date().toISOString(),
  optIns: {
    screening: true,
    coding: true,
    systemDesign: true,
    peer: false,
  },
  categories: {
    screening: {
      score: 82,
      sessionCount: 6,
      lastSessionAt: new Date().toISOString(),
      hasData: true,
    },
    coding: {
      score: 74,
      sessionCount: 4,
      lastSessionAt: new Date().toISOString(),
      hasData: true,
    },
    systemDesign: {
      score: 68,
      sessionCount: 3,
      lastSessionAt: new Date().toISOString(),
      hasData: true,
    },
  },
  overall: {
    average: 78,
    rawSum: 224,
    maxRaw: 300,
    optedCount: 3,
    categoriesWithData: 3,
  },
  communication: {
    behavioral: 81,
    technical: 76,
    technicalLabel: "Technical depth",
    sessionCount: 13,
  },
};

const MOCK_SESSION_ROWS = [
  {
    title: "SDE-2 · Amazon",
    category: "screening" as const,
    score: 84,
    date: "2026-03-08T10:00:00.000Z",
  },
  {
    title: "Backend · Google",
    category: "coding" as const,
    score: 76,
    date: "2026-03-05T14:30:00.000Z",
  },
  {
    title: "URL Shortener",
    category: "systemDesign" as const,
    score: 71,
    date: "2026-03-01T09:15:00.000Z",
  },
  {
    title: "Full Stack · Startup",
    category: "screening" as const,
    score: 79,
    date: "2026-02-22T16:00:00.000Z",
  },
];

function IxReportLockedOptInBanner() {
  return (
    <div className="ix-report-enter flex flex-col gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7367F0]/10 text-[#7367F0]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            If you are also practising{" "}
            <span className="text-[#7367F0]">Peer Interview</span>, update your
            iX Score settings.
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Choose which interview types count toward your report.
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="shrink-0" tabIndex={-1}>
        Update categories
      </Button>
    </div>
  );
}

function IxReportLockedSessionPreview() {
  return (
    <div className={cn(appTableShell, "ix-report-enter overflow-hidden")}>
      <div className="border-b border-border/60 bg-card px-4 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-foreground">Session history</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All scored sessions included in your iX Report
        </p>
      </div>
      <div className="divide-y divide-border/50">
        {MOCK_SESSION_ROWS.map((row) => {
          const meta = IX_CATEGORY_META[row.category];
          return (
            <div
              key={`${row.date}-${row.title}`}
              className="flex items-center gap-3 px-4 py-3.5 sm:px-6"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {row.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {meta.label} · {formatDate(row.date)}
                </p>
              </div>
              <p
                className={cn(
                  "shrink-0 text-lg font-bold tabular-nums",
                  ixScoreColorClass(row.score),
                )}
              >
                {row.score}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IxReportLockedPreview() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <IxReportLockedOptInBanner />
      <IxOverallScoreHero snapshot={MOCK_SNAPSHOT} />
      <IxCommunicationBreakdown communication={MOCK_SNAPSHOT.communication} />
      <IxReportLockedSessionPreview />
    </div>
  );
}

export function IxReportLockedGate() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <IxReportPageHero score={MOCK_SNAPSHOT.overall.average} title="iX Report" />

      <div className="relative isolate min-h-[520px] overflow-hidden rounded-xl border border-border/60 bg-card sm:min-h-[600px]">
        {/* Report content — background layer */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 select-none"
          aria-hidden
        >
          <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
            <IxReportLockedPreview />
          </div>
        </div>

        {/* Light frosted overlay */}
        <div
          className="pointer-events-none absolute inset-0 bg-background/25 backdrop-blur-[2.4px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/90 from-0% via-background/55 via-[42%] to-background/20 to-100%"
          aria-hidden
        />

        {/* Lock CTA — on top of overlay */}
        <div className="relative z-10 flex flex-col items-center px-6 py-8 text-center sm:px-10 sm:py-10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#7367F0]/25 bg-card shadow-lg">
            <Lock className="h-7 w-7 text-[#7367F0]" aria-hidden />
          </div>
          <span className="mb-3 inline-flex rounded-full border border-[#7367F0]/25 bg-[#7367F0]/10 px-3 py-1 text-xs font-semibold text-[#7367F0]">
            General Pass required
          </span>
          <h2 className="max-w-md text-xl font-bold text-foreground sm:text-2xl">
            Unlock your full iX Report
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Scores, category breakdown, communication metrics, certification badge,
            session history, and exportable PDF — all in one report card.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              size="lg"
              className="bg-[#7367F0] shadow-lg shadow-[#7367F0]/20 hover:bg-[#6358d8]"
              asChild
            >
              <Link href="/checkout?plan=general_pass">
                Upgrade &amp; unlock
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-card/90" asChild>
              <Link href="/pricing">Compare plans</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
