"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Download,
  FileCheck,
  Loader2,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import {
  InstituteEmptyState,
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import { InstituteBatchDetailHero } from "@/components/institute/InstituteBatchDetailHero";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { ChartPanel } from "@/components/app/ChartPanel";
import {
  dashboardChartColors,
  dashboardChartGrid,
  dashboardChartTick,
  dashboardChartTooltipStyle,
} from "@/lib/dashboard-chart-theme";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

type BatchReport = {
  batchName: string;
  memberCount: number;
  interviewsStarted: number;
  reportsCompleted: number;
  averageScore: number | null;
  highestScore: number | null;
  topPerformers: Array<{ name: string | null; overallScore: number }>;
  schedulesWithBatchTag: number;
};

export default function BatchReportPage() {
  const params = useParams();
  const institutionId = params.institutionId as string;
  const batchId = params.batchId as string;
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<BatchReport | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getBatchReport(batchId)
      .then((d) => {
        if (!cancelled) setReport(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [batchId]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const csv = await adminApi.exportBatchCandidatesCsv(batchId);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `batch-${batchId}-candidates.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const batchHref = `/dashboard/institute/${institutionId}/batches/${batchId}`;

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
        <Button
          variant="outline"
          size="sm"
          asChild
          className={cn(instituteSecondaryClass, "h-9 gap-2 px-3")}
        >
          <Link href={batchHref}>
            <ArrowLeft className="h-4 w-4" />
            Batch
          </Link>
        </Button>
        <div className="h-[7.5rem] animate-pulse rounded-2xl bg-muted/60" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
        <div className="h-[360px] animate-pulse rounded-xl bg-muted/40" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Button
          variant="outline"
          size="sm"
          asChild
          className={cn(instituteSecondaryClass, "h-9 gap-2 px-3")}
        >
          <Link href={batchHref}>
            <ArrowLeft className="h-4 w-4" />
            Batch
          </Link>
        </Button>
        <p className="rounded-xl border border-border/60 bg-card px-4 py-8 text-center text-sm text-muted-foreground shadow-card">
          Could not load batch report.
        </p>
      </div>
    );
  }

  const chartData = (report.topPerformers || []).map(
    (p: { name: string | null; overallScore: number }) => ({
      name: (p.name || "Candidate").split(" ")[0],
      score: p.overallScore,
    }),
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      <Button
        variant="outline"
        size="sm"
        asChild
        className={cn(instituteSecondaryClass, "h-9 gap-2 px-3")}
      >
        <Link href={batchHref}>
          <ArrowLeft className="h-4 w-4" />
          Batch
        </Link>
      </Button>

      <InstituteBatchDetailHero
        title="Report"
        eyebrow=""
        batchName={report.batchName || "Untitled batch"}
        memberCount={report.memberCount}
        reportsCompleted={report.reportsCompleted}
        subtitle="Summary scores and top performers — export the full roster as CSV anytime."
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className={cn(instituteSecondaryClass, "h-10 gap-2")}
          disabled={exporting}
          onClick={() => void handleExport()}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <DashboardStatCard
          theme="purple"
          label="Members"
          icon={Users}
          value={report.memberCount}
          hint={<span>In this cohort</span>}
        />
        <DashboardStatCard
          theme="sky"
          label="Interviews started"
          icon={FileCheck}
          value={report.interviewsStarted}
          hint={<span>At least one session started</span>}
        />
        <DashboardStatCard
          theme="violet"
          label="Average score"
          icon={Target}
          value={
            report.averageScore != null ? `${report.averageScore.toFixed(1)}/100` : "—"
          }
          progress={
            report.averageScore != null ? Math.round(report.averageScore) : undefined
          }
          hint={<span>Across completed reports</span>}
        />
        <DashboardStatCard
          theme="emerald"
          label="Reports completed"
          icon={Trophy}
          value={report.reportsCompleted}
          hint={
            report.highestScore != null ? (
              <span>Top score {report.highestScore}/100</span>
            ) : (
              <span>When reports are ready</span>
            )
          }
        />
      </div>

      <ChartPanel
        title="Top performers"
        description="Highest overall scores in this batch (up to five candidates)."
      >
        {chartData.length === 0 ? (
          <div className="px-2 py-8">
            <InstituteEmptyState
              icon={Trophy}
              title="No scores yet"
              description={
                report.schedulesWithBatchTag === 0
                  ? "Schedule interviews for this batch — scores appear here after candidates finish and reports are generated."
                  : "Interviews may be scheduled or in progress. Rankings show once reports are ready."
              }
              action={
                <Button asChild size="sm" className={cn(institutePrimaryClass, "gap-2")}>
                  <Link href={batchHref}>Back to batch</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid {...dashboardChartGrid} vertical={false} />
                <XAxis dataKey="name" tick={dashboardChartTick} />
                <YAxis domain={[0, 100]} tick={dashboardChartTick} />
                <Tooltip contentStyle={dashboardChartTooltipStyle} />
                <Bar
                  dataKey="score"
                  name="Score"
                  fill={dashboardChartColors.barPrimary}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartPanel>
    </div>
  );
}
