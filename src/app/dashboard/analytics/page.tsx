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
  Target,
  Loader2,
  FileText,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { interviewApi } from "@/lib/api";
import { getScoreColor } from "@/lib/utils";

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
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
        const firstScore = completed[completed.length - 1].report?.overallScore;
        const lastScore = completed[0].report?.overallScore;
        if (firstScore !== undefined && lastScore !== undefined) {
          improvement = lastScore - firstScore;
          // Check for NaN and set to 0 if invalid
          if (isNaN(improvement) || !isFinite(improvement)) {
            improvement = 0;
          }
        }
      }

      setStats({
        totalInterviews: interviews.length,
        averageScore: avgScore,
        completedInterviews: completed.length,
        improvement,
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

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-6 lg:p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics</h1>
          </div>
          <p className="text-base lg:text-lg text-white/90 max-w-2xl">
            Track your interview performance, identify trends, and measure your
            progress over time
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-transparent opacity-50"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Interviews */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">Total Interviews</p>
            <h3 className="text-3xl lg:text-4xl font-bold text-slate-900">
              {stats.totalInterviews}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[rgb(37,99,235)] font-medium mt-3">
            <BarChart3 className="w-4 h-4" />
            <span>All time</span>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">Average Score</p>
            <h3
              className={`text-3xl lg:text-4xl font-bold ${getScoreColor(
                stats.averageScore
              )}`}
            >
              {stats.averageScore}%
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[rgb(37,99,235)] font-medium mt-3">
            <Target className="w-4 h-4" />
            <span>Overall performance</span>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">Completed</p>
            <h3 className="text-3xl lg:text-4xl font-bold text-slate-900">
              {stats.completedInterviews}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[rgb(37,99,235)] font-medium mt-3">
            <Target className="w-4 h-4" />
            <span>Finished interviews</span>
          </div>
        </div>

        {/* Improvement */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">Improvement</p>
            <h3
              className={`text-3xl lg:text-4xl font-bold ${
                stats.improvement >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {stats.improvement !== undefined && !isNaN(stats.improvement) ? (
                <>
                  {stats.improvement >= 0 ? "+" : ""}
                  {stats.improvement}%
                </>
              ) : (
                "0%"
              )}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[rgb(37,99,235)] font-medium mt-3">
            <TrendingUp className="w-4 h-4" />
            <span>Since first interview</span>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="border-2 border-blue-200/50 shadow-xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-xl lg:text-2xl">
              Performance Over Time
            </CardTitle>
          </div>
          <CardDescription className="text-sm">
            Track your scores across all interviews and visualize your progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.completedInterviews === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <BarChart3 className="w-10 h-10 text-[rgb(37,99,235)]" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                No Data Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Complete your first interview to see performance analytics and
                track your improvement over time
              </p>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Sparkles className="w-10 h-10 text-[rgb(37,99,235)]" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Chart Visualization Coming Soon
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                We're working on interactive charts to help you visualize your
                interview performance trends
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
