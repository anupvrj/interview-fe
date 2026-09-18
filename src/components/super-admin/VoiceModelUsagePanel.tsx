"use client";

import { Clock3, Coins, Gauge, Mic2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { appCard } from "@/lib/app-theme";
import type { VoiceModelUsageRow } from "@/lib/super-admin-insights";

const METRIC_COLORS = {
  used: "#7367F0",
  credits: "#28C76F",
  minutes: "#00CFE8",
  avg: "#FF9F43",
} as const;

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(47,43,61,0.08)",
};

function formatCount(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function shareOf(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: Readonly<{
  icon: typeof Mic2;
  label: string;
  value: string;
  hint?: string;
}>) {
  return (
    <div className="min-w-0 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7367F0]">
        <Icon className="h-3 w-3 shrink-0" />
        {label}
      </p>
      <p className="mt-1 text-base font-semibold tabular-nums leading-none text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function VoiceModelUsagePanel({
  name,
  row,
  mix,
}: Readonly<{
  name: string;
  row: VoiceModelUsageRow;
  mix: VoiceModelUsageRow[];
}>) {
  const avgCredits =
    row.sessions > 0 ? Math.round(row.credits / row.sessions) : 0;
  const totalMinutes = mix.reduce((sum, item) => sum + item.minutes, 0);
  const maxAvg = Math.max(
    0,
    ...mix.map((item) =>
      item.sessions > 0 ? Math.round(item.credits / item.sessions) : 0,
    ),
  );
  const minuteShare = shareOf(row.minutes, totalMinutes);
  const avgShare = shareOf(avgCredits, maxAvg);

  const chartData = [
    {
      name: "Used",
      value: row.sessionShare,
      fill: METRIC_COLORS.used,
      display: `${row.sessionShare}% of voice interviews`,
    },
    {
      name: "Credits",
      value: row.creditShare,
      fill: METRIC_COLORS.credits,
      display: `${row.creditShare}% of voice credits`,
    },
    {
      name: "Minutes",
      value: minuteShare,
      fill: METRIC_COLORS.minutes,
      display: `${minuteShare}% of voice minutes`,
    },
    {
      name: "Avg",
      value: avgShare,
      fill: METRIC_COLORS.avg,
      display: `${formatCount(avgCredits)} credits / session`,
    },
  ];
  const hasChartData = chartData.some((item) => item.value > 0);

  return (
    <section className={cn(appCard, "overflow-hidden p-4 sm:p-5")}>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground sm:text-lg">
          {name}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
          Interviews, credits, minutes, and average credits per session
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center">
        <div className="h-[176px] min-w-0 sm:h-[200px]">
          {hasChartData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  unit="%"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={64}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, _name, item) => [
                    item.payload.display ?? `${value}%`,
                    item.payload.name,
                  ]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No interviews yet.
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <Stat
            icon={Mic2}
            label="Used"
            value={formatCount(row.sessions)}
            hint={`${row.sessionShare}% of voice interviews`}
          />
          <Stat
            icon={Coins}
            label="Credits"
            value={formatCount(row.credits)}
            hint={`${row.creditShare}% of voice credits`}
          />
          <Stat
            icon={Clock3}
            label="Minutes"
            value={formatCount(row.minutes)}
            hint={`${formatCount(row.thisMonth)} this month`}
          />
          <Stat
            icon={Gauge}
            label="Avg / session"
            value={formatCount(avgCredits)}
            hint={`${formatCount(row.completed)} completed`}
          />
        </div>
      </div>
    </section>
  );
}
