"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, PlayCircle, Clock } from "lucide-react";
import { adminApi } from "@/lib/api";
import { InstituteAdminHubCards } from "@/components/institute/InstituteAdminHubCards";
import { InstituteOverviewHero } from "@/components/institute/InstituteOverviewHero";
import { DashboardInsightTile } from "@/components/dashboard/DashboardStatCard";
import { InstituteLoader, instituteSecondaryClass } from "@/components/institute/InstituteChrome";
import {
  dashboardAverageScoreTooltipFormatter,
  dashboardChartCardClass,
  dashboardChartColors,
  dashboardChartGrid,
  dashboardChartTick,
  dashboardChartTooltipStyle,
} from "@/lib/dashboard-chart-theme";
import { cn } from "@/lib/utils";
import { fetchInstitutionAnalytics, type InstituteAnalyticsData } from "@/lib/institute-analytics";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function InstituteOverviewPage() {
  const params = useParams();
  const institutionId = params.institutionId as string;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    institution: Record<string, unknown> & { userCount?: number; maxUsers?: number | null };
    userCount: number;
    planCounts: Record<string, number>;
    planSeats?: Array<{
      planId: string;
      purchased: number;
      used: number;
      remaining: number;
    }>;
    scheduledPending: number;
    batchCount: number;
    totalBatchMemberSlots: number;
    scheduleCounts: { scheduled: number; started: number; cancelled: number };
    creditsPool: number;
    interviewsCompleted: number;
  } | null>(null);
  const [analytics, setAnalytics] = useState<InstituteAnalyticsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getInstitutionDashboard(institutionId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [institutionId]);

  useEffect(() => {
    let cancelled = false;
    fetchInstitutionAnalytics(institutionId, 14)
      .then((d) => {
        if (!cancelled) setAnalytics(d);
      })
      .catch(() => {
        if (!cancelled) setAnalytics(null);
      });
    return () => {
      cancelled = true;
    };
  }, [institutionId]);

  if (loading) {
    return <InstituteLoader label="Loading institution…" />;
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-8 text-center text-sm text-red-900">
        Could not load institution.
      </div>
    );
  }

  const inst = data.institution;
  const sc = data.scheduleCounts;
  const scheduleTotal = sc.scheduled + sc.started + sc.cancelled;

  const instName =
    typeof inst.name === "string" && inst.name.trim() ? inst.name : "Overview";
  const domainStr =
    typeof inst.domain === "string" && inst.domain.trim() ? inst.domain : null;
  const contactStr =
    typeof inst.contactEmail === "string" && inst.contactEmail.trim()
      ? inst.contactEmail
      : null;

  return (
    <div className="space-y-8">
      <InstituteOverviewHero
        institutionName={instName}
        domain={domainStr}
        contactEmail={contactStr}
        memberCount={data.userCount}
        batchCount={data.batchCount}
        scheduledCount={sc.scheduled}
        startedCount={sc.started}
        completedCount={data.interviewsCompleted}
      />

      <InstituteAdminHubCards institutionId={institutionId} />

      <Card className={dashboardChartCardClass}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-foreground">Schedule activity</CardTitle>
          <CardDescription>
            Institution-wide interview schedules — scheduled, in progress, and cancelled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 text-center sm:gap-4">
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wide">Scheduled</span>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{sc.scheduled}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
              <div className="flex items-center justify-center gap-1 text-primary">
                <PlayCircle className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wide">Started</span>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{sc.started}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <span className="text-[10px] font-semibold uppercase tracking-wide">Cancelled</span>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{sc.cancelled}</p>
            </div>
          </div>
          {scheduleTotal > 0 ? (
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div className="flex h-full w-full">
                <div
                  className="bg-muted-foreground/40 transition-all"
                  style={{ width: `${(sc.scheduled / scheduleTotal) * 100}%` }}
                  title="Scheduled"
                />
                <div
                  className="transition-all"
                  style={{
                    width: `${(sc.started / scheduleTotal) * 100}%`,
                    backgroundColor: dashboardChartColors.barPrimary,
                  }}
                  title="Started"
                />
                <div
                  className="bg-rose-400/70 transition-all"
                  style={{ width: `${(sc.cancelled / scheduleTotal) * 100}%` }}
                  title="Cancelled"
                />
              </div>
            </div>
          ) : (
            <p className="mt-4 text-center text-sm text-muted-foreground">No schedules yet.</p>
          )}
          <Link
            href={`/dashboard/institute/${institutionId}/schedules`}
            className={cn(
              buttonVariants({ variant: "link" }),
              "mt-3 flex h-auto w-full items-center justify-center gap-1 p-0 text-sm font-semibold",
            )}
          >
            View all schedules
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>

      {analytics && (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className={cn(dashboardChartCardClass, "xl:col-span-2")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-foreground">
                  Daily interviews and score trend
                </CardTitle>
                <CardDescription>
                  Bars = daily sessions, line = average score (last 14 days).
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analytics.daily}>
                    <CartesianGrid {...dashboardChartGrid} />
                    <XAxis dataKey="label" tick={dashboardChartTick} />
                    <YAxis yAxisId="left" allowDecimals={false} tick={dashboardChartTick} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 100]}
                      tick={dashboardChartTick}
                    />
                    <Tooltip
                      contentStyle={dashboardChartTooltipStyle}
                      formatter={dashboardAverageScoreTooltipFormatter}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="interviews"
                      name="Interviews"
                      fill={dashboardChartColors.barPrimary}
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgScore"
                      name="Average score"
                      stroke={dashboardChartColors.lineScore}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className={dashboardChartCardClass}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-foreground">Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DashboardInsightTile
                  theme="purple"
                  label="Users invited"
                  value={analytics.totals.usersInvited}
                  description={`Pending onboarding: ${analytics.totals.usersPendingOnboarding}`}
                />
                <DashboardInsightTile
                  theme="emerald"
                  label="Token spend (credits)"
                  value={analytics.totals.totalCreditsSpent}
                  description="Institution-wide credit consumption"
                />
                <DashboardInsightTile
                  theme="amber"
                  label="Interview schedules"
                  value={analytics.totals.schedulesCount}
                  description={`${analytics.totals.schedulesStarted} started · ${analytics.totals.schedulesCompleted} completed`}
                />
                <Link
                  href={`/dashboard/institute/${institutionId}/analytics`}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    instituteSecondaryClass,
                    "w-full no-underline",
                  )}
                >
                  Open full analytics
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className={dashboardChartCardClass}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-foreground">
                  Daily resumes and credit spend
                </CardTitle>
                <CardDescription>Resumes created vs daily credit consumption.</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analytics.daily}>
                    <CartesianGrid {...dashboardChartGrid} />
                    <XAxis dataKey="label" tick={dashboardChartTick} />
                    <YAxis yAxisId="left" allowDecimals={false} tick={dashboardChartTick} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      allowDecimals={false}
                      tick={dashboardChartTick}
                    />
                    <Tooltip contentStyle={dashboardChartTooltipStyle} />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="resumes"
                      name="Resumes"
                      fill={dashboardChartColors.barMuted}
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="credits"
                      name="Credits spent"
                      stroke={dashboardChartColors.lineCredits}
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className={dashboardChartCardClass}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-foreground">Top performing batches</CardTitle>
                <CardDescription>Completed reports and average score by batch.</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analytics.batchPerformance.slice(0, 6)}>
                    <CartesianGrid {...dashboardChartGrid} />
                    <XAxis
                      dataKey="batchName"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-12}
                      height={52}
                    />
                    <YAxis yAxisId="left" allowDecimals={false} tick={dashboardChartTick} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 100]}
                      tick={dashboardChartTick}
                    />
                    <Tooltip
                      contentStyle={dashboardChartTooltipStyle}
                      formatter={dashboardAverageScoreTooltipFormatter}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="reportsCompleted"
                      name="Completed reports"
                      fill={dashboardChartColors.barReports}
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="averageScore"
                      name="Average score"
                      stroke={dashboardChartColors.lineScore}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

    </div>
  );
}
