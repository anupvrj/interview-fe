"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Award,
  Percent,
  Clock,
  Loader2,
  FileText,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Interview, interviewApi } from "@/lib/api";
import { getInterviewCreditsUsed, getScoreColor } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    completedInterviews: 0,
    improvement: 0,
  });

  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      loadData();
    }
  }, [isLoaded, user]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const interviews = await interviewApi.list(user.id);
      setInterviews(interviews);

      const completed = interviews.filter(
        (i) => i.status === "completed" && i.report
      );
      const scores = completed.map((i) => i.report!.overallScore);
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

      let improvement = 0;
      if (completed.length >= 2) {
        const firstScore = completed.at(-1)?.report?.overallScore;
        const lastScore = completed.at(0)?.report?.overallScore;
        if (firstScore !== undefined && lastScore !== undefined) {
          improvement = lastScore - firstScore;
          // Check for NaN and set to 0 if invalid
          if (Number.isNaN(improvement) || !Number.isFinite(improvement)) {
            improvement = 0;
          }
        }
      }

      setStats({
        totalInterviews: interviews.length,
        averageScore: avgScore,
        completedInterviews: completed.length,
        improvement: Math.round(improvement),
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[rgb(37,99,235)] mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const lastNDays = 14;
  const now = new Date();
  const dayKeys = Array.from({ length: lastNDays }, (_, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (lastNDays - 1 - idx));
    return d.toISOString().slice(0, 10);
  });
  const dailyMap = new Map(
    dayKeys.map((day) => [
      day,
      {
        day,
        interviews: 0,
        completed: 0,
        credits: 0,
        scoredCount: 0,
        scoreTotal: 0,
      },
    ]),
  );

  for (const interview of interviews) {
    const day = new Date(interview.createdAt).toISOString().slice(0, 10);
    const row = dailyMap.get(day);
    if (!row) continue;
    row.interviews += 1;
    if (interview.status === "completed") row.completed += 1;
    const credits = getInterviewCreditsUsed(interview);
    if (credits != null) row.credits += credits;
    const score = interview.report?.overallScore;
    if (typeof score === "number" && Number.isFinite(score)) {
      row.scoredCount += 1;
      row.scoreTotal += score;
    }
  }

  const dailyData = dayKeys.map((day) => {
    const row = dailyMap.get(day)!;
    const dateObj = new Date(`${day}T00:00:00`);
    return {
      ...row,
      label: dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      avgScore:
        row.scoredCount > 0 ? Math.round(row.scoreTotal / row.scoredCount) : 0,
    };
  });

  const completedSorted = interviews
    .filter(
      (i) =>
        i.status === "completed" &&
        typeof i.report?.overallScore === "number" &&
        Number.isFinite(i.report.overallScore),
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  const firstCompletedScore = completedSorted[0]?.report?.overallScore ?? 0;
  const lastCompletedScore = completedSorted.at(-1)?.report?.overallScore ?? 0;
  const scoreDelta = lastCompletedScore - firstCompletedScore;
  const totalCreditsSpent = dailyData.reduce((sum, d) => sum + d.credits, 0);
  const totalTokensSpent = totalCreditsSpent;
  const activeDays = dailyData.filter((d) => d.interviews > 0).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 px-4 py-3 sm:px-5 sm:py-4 text-white shadow-lg">
        <div className="relative z-10">
          <div className="mb-1.5 flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/20 shadow-sm backdrop-blur-sm sm:h-9 sm:w-9">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h1 className="truncate text-lg font-bold leading-tight text-white sm:text-xl lg:text-2xl">
              Analytics
            </h1>
          </div>
          <p className="max-w-2xl text-[10px] leading-tight text-white/85 sm:text-xs md:text-sm">
            Track your interview performance, identify trends, and measure your
            progress over time
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 to-transparent opacity-40"></div>
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {/* Total Interviews */}
        <div className="flex min-h-0 min-w-0 items-start gap-3 rounded-md border border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 shadow-lg shadow-blue-500/10 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 sm:gap-4 sm:p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50 sm:h-12 sm:w-12">
            <FileText className="h-5 w-5 text-white sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs font-bold leading-tight text-[rgb(37,99,235)] sm:text-sm">
                Total Interviews
              </p>
              <p className="shrink-0 text-right text-lg font-bold tabular-nums leading-none text-slate-900 sm:text-xl lg:text-2xl">
                {stats.totalInterviews}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-600 sm:text-sm">
              <Clock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>All time</span>
            </div>
          </div>
        </div>

        {/* Average Score */}
        <div className="flex min-h-0 min-w-0 items-start gap-3 rounded-md border border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 shadow-lg shadow-blue-500/10 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 sm:gap-4 sm:p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50 sm:h-12 sm:w-12">
            <Award className="h-5 w-5 text-white sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs font-bold leading-tight text-[rgb(37,99,235)] sm:text-sm">
                Average Score
              </p>
              <p
                className={`shrink-0 text-right text-lg font-bold tabular-nums leading-none sm:text-xl lg:text-2xl ${getScoreColor(
                  stats.averageScore
                )}`}
              >
                {stats.averageScore}/100
              </p>
            </div>
            <Progress
              value={stats.averageScore}
              className="h-2 w-full overflow-hidden rounded-full border border-blue-300/90 bg-blue-100/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] sm:h-2.5"
            />
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-600 sm:text-sm">
              <Percent className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>Out of 100</span>
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="flex min-h-0 min-w-0 items-start gap-3 rounded-md border border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 shadow-lg shadow-blue-500/10 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 sm:gap-4 sm:p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50 sm:h-12 sm:w-12">
            <CheckCircle className="h-5 w-5 text-white sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs font-bold leading-tight text-[rgb(37,99,235)] sm:text-sm">
                Completed
              </p>
              <p className="shrink-0 text-right text-lg font-bold tabular-nums leading-none text-slate-900 sm:text-xl lg:text-2xl">
                {stats.completedInterviews}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-600 sm:text-sm">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>Finished interviews</span>
            </div>
          </div>
        </div>

        {/* Improvement */}
        <div className="flex min-h-0 min-w-0 items-start gap-3 rounded-md border border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 shadow-lg shadow-blue-500/10 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 sm:gap-4 sm:p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50 sm:h-12 sm:w-12">
            <TrendingUp className="h-5 w-5 text-white sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs font-bold leading-tight text-[rgb(37,99,235)] sm:text-sm">
                Improvement
              </p>
              <p
                className={`shrink-0 text-right text-lg font-bold tabular-nums leading-none sm:text-xl lg:text-2xl ${
                  stats.improvement >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {stats.improvement !== undefined && !Number.isNaN(stats.improvement) ? (
                  <>
                    {stats.improvement >= 0 ? "+" : ""}
                    {stats.improvement}%
                  </>
                ) : (
                  "0%"
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-600 sm:text-sm">
              <TrendingUp className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>Since first interview</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-md border border-border bg-card shadow-sm xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-900">
              Daily interviews and score trend
            </CardTitle>
            <CardDescription>
              Last 14 days: bar = interviews, line = average score
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, borderColor: "#cbd5e1" }}
                  formatter={(value: number, name: string) => {
                    if (name === "Average score") return [`${value}/100`, name];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="interviews"
                  name="Interviews"
                  fill="rgb(37,99,235)"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgScore"
                  name="Average score"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-md border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-900">Insights</CardTitle>
            <CardDescription>Quick performance summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Total token spend</p>
              <p className="text-xl font-bold tabular-nums text-slate-900">
                {totalTokensSpent}
              </p>
              <p className="text-xs text-slate-500">
                Approximated from billed interview credits
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Active days</p>
              <p className="text-xl font-bold tabular-nums text-slate-900">
                {activeDays}/14
              </p>
              <p className="text-xs text-slate-500">Days with at least one interview</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Completed ratio</p>
              <p className="text-xl font-bold tabular-nums text-slate-900">
                {stats.totalInterviews > 0
                  ? Math.round((stats.completedInterviews / stats.totalInterviews) * 100)
                  : 0}
                %
              </p>
              <p className="text-xs text-slate-500">Completed out of all interviews</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="rounded-md border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-900">
              Daily token spend
            </CardTitle>
            <CardDescription>
              Last 14 days token spend (using billed credits)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#cbd5e1" }} />
                <Bar
                  dataKey="credits"
                  name="Token spend"
                  fill="#7c3aed"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-md border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg text-slate-900">
                Improvement trend
              </CardTitle>
              <div
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  scoreDelta >= 0
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {scoreDelta >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {scoreDelta >= 0 ? "+" : ""}
                {Math.round(scoreDelta)}
              </div>
            </div>
            <CardDescription>
              From first completed score ({Math.round(firstCompletedScore)}) to latest (
              {Math.round(lastCompletedScore)})
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, borderColor: "#cbd5e1" }}
                  formatter={(value: number) => [`${value}/100`, "Average score"]}
                />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke={scoreDelta >= 0 ? "#16a34a" : "#dc2626"}
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
