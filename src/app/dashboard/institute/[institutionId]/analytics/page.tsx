"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Coins, FileText, CalendarClock, Users } from "lucide-react";
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
import {
  InstituteLoader,
  InstitutePageHeader,
  InstituteStatCard,
  institutePanelClass,
} from "@/components/institute/InstituteChrome";
import { cn } from "@/lib/utils";
import { fetchInstitutionAnalytics, type InstituteAnalyticsData } from "@/lib/institute-analytics";

export default function InstituteAnalyticsPage() {
  const params = useParams();
  const institutionId = params.institutionId as string;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InstituteAnalyticsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchInstitutionAnalytics(institutionId, 30)
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

  const topBatches = useMemo(() => (data?.batchPerformance || []).slice(0, 8), [data]);

  if (loading) return <InstituteLoader label="Loading analytics…" />;

  if (!data) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        Could not load institute analytics.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InstitutePageHeader
        badge="Institution"
        title="Analytics"
        description="Day wise trends, schedule outcomes, credits, invite funnel, and batch performance."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InstituteStatCard
          layout="horizontal"
          icon={Users}
          label="Users invited"
          value={data.totals.usersInvited}
          footer={`Pending onboarding: ${data.totals.usersPendingOnboarding}`}
          href={`/dashboard/institute/${institutionId}/candidates`}
        />
        <InstituteStatCard
          layout="horizontal"
          icon={CalendarClock}
          label="Interview schedules"
          value={data.totals.schedulesCount}
          footer={`${data.totals.schedulesStarted} started · ${data.totals.schedulesCompleted} completed`}
          href={`/dashboard/institute/${institutionId}/schedules`}
        />
        <InstituteStatCard
          layout="horizontal"
          icon={FileText}
          label="Resume created"
          value={data.totals.resumesCount}
          footer="Total resumes across invited users"
          href={`/dashboard/institute/${institutionId}/candidates`}
        />
        <InstituteStatCard
          layout="horizontal"
          icon={Coins}
          label="Credits spent"
          value={data.totals.totalCreditsSpent}
          footer="Estimated from billed interview credits"
          href={`/dashboard/institute/${institutionId}/billing`}
        />
      </div>

      <section className={cn(institutePanelClass)}>
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-sm font-bold text-slate-900">Day wise interviews, resumes and score</h2>
          <p className="text-xs text-slate-600">Last 30 days performance trend</p>
        </div>
        <div className="h-[330px] p-3">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#cbd5e1" }} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="interviews"
                name="Interviews"
                fill="rgb(37,99,235)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="resumes"
                name="Resumes"
                fill="#64748b"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgScore"
                name="Avg score"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={cn(institutePanelClass)}>
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-900">Day wise credit spend</h2>
            <p className="text-xs text-slate-600">Credits consumed per day</p>
          </div>
          <div className="h-[280px] p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#cbd5e1" }} />
                <Bar dataKey="credits" name="Credits" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={cn(institutePanelClass)}>
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-900">Schedule outcomes</h2>
            <p className="text-xs text-slate-600">Scheduled, started, completed and cancelled</p>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Scheduled pending</p>
              <p className="text-2xl font-bold tabular-nums text-slate-900">
                {data.totals.schedulesPending}
              </p>
            </div>
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-semibold text-blue-700">Started</p>
              <p className="text-2xl font-bold tabular-nums text-slate-900">
                {data.totals.schedulesStarted}
              </p>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-700">Completed</p>
              <p className="text-2xl font-bold tabular-nums text-slate-900">
                {data.totals.schedulesCompleted}
              </p>
            </div>
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
              <p className="text-xs font-semibold text-rose-700">Cancelled</p>
              <p className="text-2xl font-bold tabular-nums text-slate-900">
                {data.totals.schedulesCancelled}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={cn(institutePanelClass)}>
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-900">Top performing batches</h2>
            <p className="text-xs text-slate-600">Ranked by average report score</p>
          </div>
          <div className="h-[280px] p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBatches} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="batchName"
                  width={140}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#cbd5e1" }} />
                <Bar dataKey="averageScore" name="Avg score" fill="rgb(37,99,235)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={cn(institutePanelClass)}>
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-900">Batch wise performance</h2>
            <p className="text-xs text-slate-600">Interviews started and reports completed</p>
          </div>
          <div className="h-[280px] p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.batchPerformance.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="batchName" tick={{ fontSize: 11 }} interval={0} angle={-12} height={52} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#cbd5e1" }} />
                <Legend />
                <Bar dataKey="interviewsStarted" name="Started" fill="#2563eb" radius={[3, 3, 0, 0]} />
                <Bar dataKey="reportsCompleted" name="Completed reports" fill="#16a34a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className={cn(institutePanelClass)}>
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-sm font-bold text-slate-900">Top performing users</h2>
          <p className="text-xs text-slate-600">Best interview scores from batch runs</p>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Batch</th>
                <th className="px-2 py-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.topPerformers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-5 text-center text-slate-500">
                    No performance data yet.
                  </td>
                </tr>
              ) : (
                data.topPerformers.map((row, idx) => (
                  <tr key={`${row.clerkId}-${row.interviewId}-${idx}`} className="border-b border-slate-100">
                    <td className="px-2 py-2 font-medium text-slate-900">{row.name || "Candidate"}</td>
                    <td className="px-2 py-2 text-slate-600">{row.email || "—"}</td>
                    <td className="px-2 py-2 text-slate-600">{row.sourceBatch}</td>
                    <td className="px-2 py-2 text-right font-semibold tabular-nums text-slate-900">
                      {Math.round(row.score)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

