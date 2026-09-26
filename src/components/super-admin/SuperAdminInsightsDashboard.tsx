"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Award,
  BarChart3,
  Building2,
  CalendarDays,
  FileCheck2,
  FileText,
  Gauge,
  Handshake,
  Mic2,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { SuperAdminPeriodFilter } from "@/components/super-admin/SuperAdminPeriodFilter";
import {
  DashboardSectionIcon,
  DashboardStatCard,
} from "@/components/dashboard/DashboardStatCard";
import { ChartPanel } from "@/components/app/ChartPanel";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import {
  INTERVIEW_TYPE_LABEL,
  interviewsInsightsHref,
  institutionsInsightsHref,
  resumesInsightsHref,
  usersInsightsHref,
  type AdminInsights,
  type InsightDailyPoint,
  type InsightPeriod,
} from "@/lib/super-admin-insights";

const COLORS = {
  primary: "#7367F0",
  success: "#28C76F",
  info: "#00CFE8",
  warning: "#FF9F43",
};

const TYPE_COLORS = {
  screening: COLORS.primary,
  coding: COLORS.success,
  systemDesign: COLORS.info,
  peer: COLORS.warning,
} as const;

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  trial: "Trial",
  general_pass: "General Pass",
  tech_basic: "Tech Basic",
  tech_pro: "Tech Pro",
  enterprise: "Enterprise",
  unknown: "Unknown",
};

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(47,43,61,0.08)",
};

function formatCount(value?: number) {
  return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function share(part: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function sumDaily(
  daily: InsightDailyPoint[],
  key: keyof Omit<InsightDailyPoint, "date" | "label">,
) {
  return daily.reduce((sum, row) => sum + (row[key] ?? 0), 0);
}

function SectionHeader({
  icon,
  theme,
  title,
  description,
  href,
  actionLabel,
}: Readonly<{
  icon: LucideIcon;
  theme: "purple" | "cyan" | "emerald" | "violet";
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}>) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        <DashboardSectionIcon theme={theme} icon={icon} />
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">{description}</p>
        </div>
      </div>
      <Button asChild variant="outline" className="h-11 w-full sm:w-auto">
        <Link href={href}>
          {actionLabel}
          <TrendingUp className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function StatLink({
  href,
  children,
}: Readonly<{ href?: string; children: ReactNode }>) {
  if (!href) return <>{children}</>;
  return (
    <Link href={href} className="block min-w-0 transition-transform hover:-translate-y-0.5">
      {children}
    </Link>
  );
}

export function SuperAdminInsightsDashboard({
  insights,
  period,
  from,
  to,
  onPeriodChange,
  onRangeChange,
}: Readonly<{
  insights: AdminInsights;
  period: InsightPeriod;
  from: string;
  to: string;
  onPeriodChange: (period: InsightPeriod) => void;
  onRangeChange: (from: string, to: string) => void;
}>) {
  const daily = insights.chart?.daily ?? [];
  const chartLabel = insights.chart?.label ?? "Recent activity";
  const byPlan = insights.users.byPlan ?? [];
  const byTemplate = insights.resumes.byTemplate ?? [];
  const byType = insights.interviews.byType ?? {
    screening: 0,
    coding: 0,
    systemDesign: 0,
    peer: 0,
  };

  const typeMix = (
    ["screening", "coding", "systemDesign", "peer"] as const
  )
    .map((key) => ({
      key,
      name: INTERVIEW_TYPE_LABEL[key],
      value: byType[key],
      color: TYPE_COLORS[key],
    }))
    .filter((row) => row.value > 0);

  const planMix = byPlan.map((row) => ({
    name: PLAN_LABELS[row.plan] || titleCase(row.plan),
    count: row.count,
  }));

  const templateMix = byTemplate.map((row) => ({
    name: titleCase(row.templateId),
    count: row.count,
  }));

  const rangeUsers = sumDaily(daily, "users");
  const rangeResumes = sumDaily(daily, "resumes");
  const rangeInterviews = sumDaily(daily, "interviews");
  const rangeInstitutions = sumDaily(daily, "institutions");
  const partners = insights.institutions ?? {
    total: 0,
    today: 0,
    week: 0,
    month: 0,
    assignedUsers: 0,
    withMembers: 0,
    empty: 0,
    batches: 0,
    top: [],
  };
  const topInstitutes = (partners.top ?? []).map((row) => ({
    name: row.name,
    count: row.userCount,
  }));

  return (
    <div className="space-y-5">
      <section className={cn(appCard, "overflow-hidden")}>
        <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <DashboardSectionIcon theme="purple" icon={BarChart3} />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground sm:text-lg">
                Platform activity
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Signups, partners, resumes, and completed interviews
              </p>
            </div>
          </div>
          <SuperAdminPeriodFilter
            embedded
            period={period}
            from={from}
            to={to}
            onPeriodChange={onPeriodChange}
            onRangeChange={onRangeChange}
          />
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCard
              theme="purple"
              label="Signups in range"
              value={formatCount(rangeUsers)}
              icon={Users}
              hint={<span>{chartLabel}</span>}
            />
            <DashboardStatCard
              theme="violet"
              label="Institutes onboarded"
              value={formatCount(rangeInstitutions)}
              icon={Building2}
              hint={<span>{chartLabel}</span>}
            />
            <DashboardStatCard
              theme="cyan"
              label="Resumes in range"
              value={formatCount(rangeResumes)}
              icon={FileText}
              hint={<span>{chartLabel}</span>}
            />
            <DashboardStatCard
              theme="emerald"
              label="Interviews in range"
              value={formatCount(rangeInterviews)}
              icon={Mic2}
              hint={<span>{chartLabel}</span>}
            />
          </div>
          <ChartPanel
            title="Daily volume"
            description="Bars are interviews. Lines are signups, resumes, and new institutes."
          >
            <div className="h-[220px] min-w-0 sm:h-[280px]">
              {daily.length === 0 ? (
                <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No chart data yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      minTickGap={16}
                      interval="preserveStartEnd"
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="interviews"
                      name="Interviews"
                      fill={COLORS.primary}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      name="Signups"
                      stroke={COLORS.warning}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="resumes"
                      name="Resumes"
                      stroke={COLORS.info}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="institutions"
                      name="Institutes"
                      stroke={COLORS.success}
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartPanel>
        </div>
      </section>

      <section className={cn(appCard, "overflow-hidden")}>
        <SectionHeader
          icon={Users}
          theme="purple"
          title="Users"
          description="Platform signups and current plan mix"
          href={usersInsightsHref("all")}
          actionLabel="View users"
        />
        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatLink href={usersInsightsHref("all")}>
              <DashboardStatCard
                theme="purple"
                label="Total signups"
                value={formatCount(insights.users.total)}
                icon={Users}
                hint={<span>All accounts</span>}
              />
            </StatLink>
            <StatLink href={usersInsightsHref("today")}>
              <DashboardStatCard
                theme="purple"
                label="Today"
                value={formatCount(insights.users.today)}
                icon={CalendarDays}
                hint={<span>Created today</span>}
              />
            </StatLink>
            <StatLink href={usersInsightsHref("week")}>
              <DashboardStatCard
                theme="purple"
                label="This week"
                value={formatCount(insights.users.week)}
                icon={TrendingUp}
                hint={<span>Since Monday</span>}
              />
            </StatLink>
            <StatLink href={usersInsightsHref("month")}>
              <DashboardStatCard
                theme="purple"
                label="This month"
                value={formatCount(insights.users.month)}
                icon={CalendarDays}
                hint={<span>Calendar month</span>}
              />
            </StatLink>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <ChartPanel title="Signup trend" description={chartLabel}>
              <div className="h-[200px] min-w-0 sm:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily}>
                    <defs>
                      <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      minTickGap={16}
                      interval="preserveStartEnd"
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="users"
                      name="Signups"
                      stroke={COLORS.primary}
                      fill="url(#usersFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>
            <ChartPanel title="Plan mix" description="Current subscription on each account">
              <div className="h-[200px] min-w-0 sm:h-[260px]">
                {planMix.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No plan data yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={planMix} layout="vertical" margin={{ left: 4, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={88}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" name="Users" fill={COLORS.primary} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartPanel>
          </div>
        </div>
      </section>

      <section className={cn(appCard, "overflow-hidden")}>
        <SectionHeader
          icon={FileText}
          theme="cyan"
          title="Resumes"
          description="Builder resumes designed on the platform"
          href={resumesInsightsHref("all")}
          actionLabel="View resumes"
        />
        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatLink href={resumesInsightsHref("all")}>
              <DashboardStatCard
                theme="cyan"
                label="Designed"
                value={formatCount(insights.resumes.total)}
                icon={FileText}
                hint={<span>All builder resumes</span>}
              />
            </StatLink>
            <StatLink href={resumesInsightsHref("today")}>
              <DashboardStatCard
                theme="cyan"
                label="Today"
                value={formatCount(insights.resumes.today)}
                icon={CalendarDays}
                hint={<span>Created today</span>}
              />
            </StatLink>
            <StatLink href={resumesInsightsHref("week")}>
              <DashboardStatCard
                theme="cyan"
                label="This week"
                value={formatCount(insights.resumes.week)}
                icon={TrendingUp}
                hint={<span>{formatCount(insights.resumes.month)} this month</span>}
              />
            </StatLink>
            <DashboardStatCard
              theme="cyan"
              label="PDF ready"
              value={formatCount(insights.resumes.withPdf)}
              icon={FileCheck2}
              progress={
                insights.resumes.total
                  ? (insights.resumes.withPdf / insights.resumes.total) * 100
                  : 0
              }
              hint={<span>{share(insights.resumes.withPdf, insights.resumes.total)} have a PDF</span>}
            />
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <ChartPanel title="Resumes created" description={chartLabel}>
              <div className="h-[200px] min-w-0 sm:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily}>
                    <defs>
                      <linearGradient id="resumesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.info} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={COLORS.info} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      minTickGap={16}
                      interval="preserveStartEnd"
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="resumes"
                      name="Resumes"
                      stroke={COLORS.info}
                      fill="url(#resumesFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>
            <ChartPanel title="Top templates" description="Most used resume templates">
              <div className="h-[200px] min-w-0 sm:h-[260px]">
                {templateMix.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No templates yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={templateMix} layout="vertical" margin={{ left: 4, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={96}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" name="Resumes" fill={COLORS.info} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartPanel>
          </div>
        </div>
      </section>

      <section className={cn(appCard, "overflow-hidden")}>
        <SectionHeader
          icon={Mic2}
          theme="emerald"
          title="Interviews"
          description="Completed AI, coding, system design, and peer sessions"
          href={interviewsInsightsHref({ period, from, to })}
          actionLabel="View interviews"
        />
        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatLink href={interviewsInsightsHref()}>
              <DashboardStatCard
                theme="emerald"
                label="Completed"
                value={formatCount(insights.interviews.total)}
                icon={Mic2}
                hint={<span>All time</span>}
              />
            </StatLink>
            <StatLink href={interviewsInsightsHref({ period: "today" })}>
              <DashboardStatCard
                theme="emerald"
                label="Today"
                value={formatCount(insights.interviews.today)}
                icon={CalendarDays}
                hint={<span>{formatCount(insights.interviews.week)} this week</span>}
              />
            </StatLink>
            <StatLink href={interviewsInsightsHref({ period: "month" })}>
              <DashboardStatCard
                theme="emerald"
                label="This month"
                value={formatCount(insights.interviews.month)}
                icon={TrendingUp}
                hint={<span>Calendar month</span>}
              />
            </StatLink>
            <DashboardStatCard
              theme="amber"
              label="Avg score"
              value={
                insights.interviews.avgScore != null
                  ? `${insights.interviews.avgScore}`
                  : "—"
              }
              icon={insights.interviews.avgScore != null ? Award : Gauge}
              progress={insights.interviews.avgScore ?? 0}
              hint={
                <span>{formatCount(insights.interviews.scoredReports)} scored reports</span>
              }
            />
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <ChartPanel title="Interviews by type" description={chartLabel}>
              <div className="h-[240px] min-w-0 sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      minTickGap={16}
                      interval="preserveStartEnd"
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="screening" name="AI Screening" stackId="i" fill={TYPE_COLORS.screening} />
                    <Bar dataKey="coding" name="Coding" stackId="i" fill={TYPE_COLORS.coding} />
                    <Bar
                      dataKey="systemDesign"
                      name="System Design"
                      stackId="i"
                      fill={TYPE_COLORS.systemDesign}
                    />
                    <Bar
                      dataKey="peer"
                      name="Peer"
                      stackId="i"
                      fill={TYPE_COLORS.peer}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>
            <ChartPanel
              title="Type mix"
              description={
                period === "all" ? "All completed interviews" : "In the selected period"
              }
            >
              <div className="h-[200px] min-w-0 sm:h-[220px]">
                {typeMix.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No completed interviews yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeMix}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={78}
                        paddingAngle={3}
                      >
                        {typeMix.map((row) => (
                          <Cell key={row.key} fill={row.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 px-1 pb-2">
                {(
                  ["screening", "coding", "systemDesign", "peer"] as const
                ).map((key) => (
                  <Link
                    key={key}
                    href={interviewsInsightsHref({ period, from, to, type: key })}
                    className="min-w-0 rounded-lg border border-border/50 px-2 py-2 hover:border-[#7367F0]/30 hover:bg-[#7367F0]/[0.04]"
                  >
                    <p className="truncate text-[11px] text-muted-foreground">
                      {INTERVIEW_TYPE_LABEL[key]}
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {formatCount(byType[key])}
                    </p>
                  </Link>
                ))}
              </div>
            </ChartPanel>
          </div>
        </div>
      </section>

      <section className={cn(appCard, "overflow-hidden")}>
        <SectionHeader
          icon={Building2}
          theme="violet"
          title="Partners"
          description="Institutions onboarded and users assigned to them"
          href={institutionsInsightsHref()}
          actionLabel="View institutions"
        />
        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatLink href={institutionsInsightsHref()}>
              <DashboardStatCard
                theme="violet"
                label="Onboarded"
                value={formatCount(partners.total)}
                icon={Handshake}
                hint={<span>All partner institutions</span>}
              />
            </StatLink>
            <DashboardStatCard
              theme="violet"
              label="Users at institutes"
              value={formatCount(partners.assignedUsers)}
              icon={Users}
              hint={
                <span>
                  {formatCount(partners.withMembers)} institutes have members
                </span>
              }
            />
            <DashboardStatCard
              theme="cyan"
              label="Batches"
              value={formatCount(partners.batches)}
              icon={CalendarDays}
              hint={<span>Across all institutes</span>}
            />
            <DashboardStatCard
              theme="violet"
              label="This month"
              value={formatCount(partners.month)}
              icon={TrendingUp}
              hint={<span>New institutes this month</span>}
            />
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <ChartPanel title="Institutes onboarded" description={chartLabel}>
              <div className="h-[200px] min-w-0 sm:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily}>
                    <defs>
                      <linearGradient id="institutesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={COLORS.success} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      minTickGap={16}
                      interval="preserveStartEnd"
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="institutions"
                      name="Institutes"
                      stroke={COLORS.success}
                      fill="url(#institutesFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>
            <ChartPanel title="Largest partners" description="Users assigned to each institute">
              <div className="h-[200px] min-w-0 sm:h-[260px]">
                {topInstitutes.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No assigned institute users yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topInstitutes} layout="vertical" margin={{ left: 4, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" name="Users" fill={COLORS.success} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartPanel>
          </div>
        </div>
      </section>
    </div>
  );
}
