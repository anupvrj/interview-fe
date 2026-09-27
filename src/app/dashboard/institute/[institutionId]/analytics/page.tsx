"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Award,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  FileText,
  Loader2,
  Users,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { InstituteAnalyticsHero } from "@/components/institute/InstituteAnalyticsHero";
import {
  InstituteEmptyState,
  InstituteTableShell,
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import { ChartPanel } from "@/components/app/ChartPanel";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchInstitutionAnalytics, type InstituteAnalyticsData } from "@/lib/institute-analytics";
import {
  dashboardAverageScoreTooltipFormatter,
  dashboardChartColors,
  dashboardChartGrid,
  dashboardChartTick,
  dashboardChartTooltipStyle,
} from "@/lib/dashboard-chart-theme";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS = [
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

function memberInitials(name: string | undefined, email: string | undefined): string {
  const n = (name || "").trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ""}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  const local = (email || "").split("@")[0] || "?";
  return local.slice(0, 2).toUpperCase();
}

function AnalyticsPeriodToggle({
  days,
  onChange,
  disabled,
}: {
  days: number;
  onChange: (days: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="inline-flex flex-wrap gap-1 rounded-xl border border-border/60 bg-muted/30 p-1"
      role="group"
      aria-label="Analytics time range"
    >
      {PERIOD_OPTIONS.map((opt) => {
        const active = days === opt.days;
        return (
          <Button
            key={opt.days}
            type="button"
            size="sm"
            variant={active ? "default" : "ghost"}
            disabled={disabled}
            className={cn(
              "h-9 rounded-lg px-3 text-sm font-medium",
              active ? institutePrimaryClass : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onChange(opt.days)}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}

function StatLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl no-underline transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7367F0]/40"
    >
      {children}
    </Link>
  );
}

export default function InstituteAnalyticsPage() {
  const params = useParams();
  const institutionId = params.institutionId as string;
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InstituteAnalyticsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchInstitutionAnalytics(institutionId, days)
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
  }, [institutionId, days]);

  const topBatches = useMemo(() => (data?.batchPerformance || []).slice(0, 8), [data]);

  const periodSummary = useMemo(() => {
    if (!data?.daily.length) {
      return { interviewsInPeriod: 0, avgScoreInPeriod: null as number | null };
    }
    let interviewsInPeriod = 0;
    let scoreSum = 0;
    let scoreWeight = 0;
    for (const d of data.daily) {
      interviewsInPeriod += d.interviews;
      if (d.interviews > 0 && d.avgScore > 0) {
        scoreSum += d.avgScore * d.interviews;
        scoreWeight += d.interviews;
      }
    }
    return {
      interviewsInPeriod,
      avgScoreInPeriod: scoreWeight > 0 ? scoreSum / scoreWeight : null,
    };
  }, [data]);

  if (loading && !data) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
        <div className="h-[8.5rem] animate-pulse rounded-2xl bg-muted/60" />
        <div className="flex justify-end">
          <div className="h-11 w-72 animate-pulse rounded-xl bg-muted/50" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
        <div className="h-[380px] animate-pulse rounded-xl bg-muted/40" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <p className="rounded-xl border border-rose-200/80 bg-rose-50/90 px-4 py-8 text-center text-sm text-rose-900 shadow-card">
          Could not load institute analytics.
        </p>
      </div>
    );
  }

  const base = `/dashboard/institute/${institutionId}`;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      <InstituteAnalyticsHero
        days={days}
        interviewsInPeriod={periodSummary.interviewsInPeriod}
        avgScoreInPeriod={periodSummary.avgScoreInPeriod}
        loading={loading}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing metrics for the last{" "}
          <span className="font-semibold text-foreground">{days} days</span>.
          {loading ? (
            <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin text-[#7367F0]" />
          ) : null}
        </p>
        <AnalyticsPeriodToggle days={days} onChange={setDays} disabled={loading} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatLink href={`${base}/candidates`}>
          <DashboardStatCard
            theme="purple"
            label="Users invited"
            icon={Users}
            value={data.totals.usersInvited}
            hint={
              <span>Pending onboarding: {data.totals.usersPendingOnboarding}</span>
            }
          />
        </StatLink>
        <StatLink href={`${base}/schedules`}>
          <DashboardStatCard
            theme="sky"
            label="Interview schedules"
            icon={CalendarClock}
            value={data.totals.schedulesCount}
            hint={
              <span>
                {data.totals.schedulesStarted} started · {data.totals.schedulesCompleted}{" "}
                completed
              </span>
            }
          />
        </StatLink>
        <StatLink href={`${base}/candidates`}>
          <DashboardStatCard
            theme="violet"
            label="Resumes created"
            icon={FileText}
            value={data.totals.resumesCount}
            hint={<span>Across invited candidates</span>}
          />
        </StatLink>
        <StatLink href={`${base}/billing`}>
          <DashboardStatCard
            theme="amber"
            label="Credits spent"
            icon={Coins}
            value={data.totals.totalCreditsSpent}
            hint={<span>In the selected window</span>}
          />
        </StatLink>
      </div>

      <ChartPanel
        title="Daily activity & scores"
        description={`Interviews and resumes per day, with average score trend (last ${days} days).`}
      >
        {data.daily.every((d) => d.interviews === 0 && d.resumes === 0) ? (
          <div className="px-2 py-10">
            <InstituteEmptyState
              icon={BarChart3}
              title="No activity in this window"
              description="Try a longer range or schedule batch interviews once candidates are enrolled."
            />
          </div>
        ) : (
          <div className="h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.daily}>
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
                  dataKey="avgScore"
                  name="Average score"
                  stroke={dashboardChartColors.lineScore}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartPanel>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Daily credit spend" description="Credits consumed per day in this window">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily}>
                <CartesianGrid {...dashboardChartGrid} />
                <XAxis dataKey="label" tick={dashboardChartTick} />
                <YAxis allowDecimals={false} tick={dashboardChartTick} />
                <Tooltip contentStyle={dashboardChartTooltipStyle} />
                <Bar
                  dataKey="credits"
                  name="Credits spent"
                  fill={dashboardChartColors.lineCredits}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="Schedule outcomes" description="Current status across all institute schedules">
          <div className="grid grid-cols-1 gap-3 p-1 sm:grid-cols-2">
            <DashboardStatCard
              theme="sky"
              label="Scheduled pending"
              icon={Clock}
              value={data.totals.schedulesPending}
              hint={<span>Awaiting candidate start</span>}
            />
            <DashboardStatCard
              theme="violet"
              label="Started"
              icon={CalendarClock}
              value={data.totals.schedulesStarted}
              hint={<span>At least one session begun</span>}
            />
            <DashboardStatCard
              theme="emerald"
              label="Completed"
              icon={CheckCircle2}
              value={data.totals.schedulesCompleted}
              hint={<span>Finished with report</span>}
            />
            <DashboardStatCard
              theme="rose"
              label="Cancelled"
              icon={XCircle}
              value={data.totals.schedulesCancelled}
              hint={<span>No longer active</span>}
            />
          </div>
        </ChartPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Top performing batches"
          description="Ranked by average report score (when available)"
        >
          {topBatches.length === 0 ? (
            <div className="px-2 py-8">
              <InstituteEmptyState
                icon={Award}
                title="No batch scores yet"
                description="Scores appear after batch interviews complete and reports are generated."
                action={
                  <Button asChild size="sm" className={cn(institutePrimaryClass, "gap-2")}>
                    <Link href={`${base}/batches`}>View batches</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topBatches} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid {...dashboardChartGrid} />
                  <XAxis type="number" domain={[0, 100]} tick={dashboardChartTick} />
                  <YAxis
                    type="category"
                    dataKey="batchName"
                    width={140}
                    tick={{ fontSize: 11 }}
                    interval={0}
                  />
                  <Tooltip
                    contentStyle={dashboardChartTooltipStyle}
                    formatter={dashboardAverageScoreTooltipFormatter}
                  />
                  <Bar
                    dataKey="averageScore"
                    name="Average score"
                    fill={dashboardChartColors.barPrimary}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartPanel>

        <ChartPanel
          title="Batch activity"
          description="Interviews started vs reports completed by batch"
        >
          {data.batchPerformance.length === 0 ? (
            <div className="px-2 py-8">
              <InstituteEmptyState
                icon={Users}
                title="No batches yet"
                description="Create a cohort and run bulk schedules to compare activity here."
                action={
                  <Button asChild size="sm" className={cn(institutePrimaryClass, "gap-2")}>
                    <Link href={`${base}/batches`}>Create batch</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.batchPerformance.slice(0, 10)}>
                  <CartesianGrid {...dashboardChartGrid} />
                  <XAxis
                    dataKey="batchName"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-12}
                    height={52}
                  />
                  <YAxis allowDecimals={false} tick={dashboardChartTick} />
                  <Tooltip contentStyle={dashboardChartTooltipStyle} />
                  <Legend />
                  <Bar
                    dataKey="interviewsStarted"
                    name="Started"
                    fill={dashboardChartColors.barPrimary}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="reportsCompleted"
                    name="Completed reports"
                    fill={dashboardChartColors.lineScore}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartPanel>
      </div>

      <ChartPanel
        title="Top performing candidates"
        description="Highest interview scores from batch-linked runs"
      >
        {data.topPerformers.length === 0 ? (
          <div className="px-4 py-6">
            <InstituteEmptyState
              icon={Award}
              title="No leaderboard yet"
              description="Candidate scores will show here once interviews finish and reports are ready."
            />
          </div>
        ) : (
          <InstituteTableShell>
            <Table className="w-full min-w-[640px]">
              <TableHeader>
                <TableRow className="border-b border-border/80 bg-muted/30 hover:bg-muted/30">
                  <TableHead className="pl-6 font-semibold text-foreground">Candidate</TableHead>
                  <TableHead className="font-semibold text-foreground">Batch</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Score</TableHead>
                  <TableHead className="w-[88px] min-w-[88px] pr-6 text-right font-semibold text-foreground">
                    Open
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topPerformers.map((row, idx) => (
                  <TableRow
                    key={`${row.clerkId}-${row.interviewId}-${idx}`}
                    className="border-border transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="pl-6 align-middle">
                      <div className="flex items-center gap-3 py-1">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-sm font-bold text-white shadow-md shadow-primary/15 ring-2 ring-white"
                          aria-hidden
                        >
                          {memberInitials(row.name ?? undefined, row.email ?? undefined)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">
                            {row.name || "Candidate"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {row.email || "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate align-middle text-sm text-muted-foreground">
                      {row.sourceBatch}
                    </TableCell>
                    <TableCell className="text-right align-middle">
                      <span className="inline-flex min-w-[3rem] justify-end rounded-full bg-muted/30 px-2.5 py-0.5 text-sm font-bold tabular-nums text-primary ring-1 ring-border">
                        {Math.round(row.score)}
                      </span>
                    </TableCell>
                    <TableCell className="w-[88px] min-w-[88px] pr-6 text-right align-middle">
                      <Button
                        variant="outline"
                        size="icon"
                        className={cn(instituteSecondaryClass, "h-8 w-8 shrink-0 p-0")}
                        asChild
                        title="Open report"
                        aria-label={`Open report for ${row.name || row.email || "candidate"}`}
                      >
                        <Link
                          href={`${base}/candidates/${encodeURIComponent(row.clerkId)}/reports/${encodeURIComponent(row.interviewId)}`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </InstituteTableShell>
        )}
      </ChartPanel>
    </div>
  );
}
