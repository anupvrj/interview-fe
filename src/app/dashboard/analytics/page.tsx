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
        const firstScore = completed[completed.length - 1].report!.overallScore;
        const lastScore = completed[0].report!.overallScore;
        improvement = lastScore - firstScore;
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
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 p-6 lg:p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
          </div>
          <p className="text-base lg:text-lg text-white/90 max-w-2xl">
            Track your interview performance, identify trends, and measure your
            progress over time
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-transparent opacity-50"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
            </div>
            <CardDescription className="text-sm font-medium">
              Total Interviews
            </CardDescription>
            <CardTitle className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">
              {stats.totalInterviews}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
              <BarChart3 className="w-4 h-4" />
              <span>All time</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
            </div>
            <CardDescription className="text-sm font-medium">
              Average Score
            </CardDescription>
            <CardTitle
              className={`text-2xl lg:text-3xl font-bold mt-2 ${getScoreColor(
                stats.averageScore
              )}`}
            >
              {stats.averageScore}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
              <Target className="w-4 h-4" />
              <span>Overall performance</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <CardDescription className="text-sm font-medium">
              Completed
            </CardDescription>
            <CardTitle className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">
              {stats.completedInterviews}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
              <Target className="w-4 h-4" />
              <span>Finished interviews</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <CardDescription className="text-sm font-medium">
              Improvement
            </CardDescription>
            <CardTitle
              className={`text-2xl lg:text-3xl font-bold mt-2 ${
                stats.improvement >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {stats.improvement >= 0 ? "+" : ""}
              {stats.improvement}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-pink-600 font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>Since first interview</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="border-2 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
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
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Data Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Complete your first interview to see performance analytics and
                track your improvement over time
              </p>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
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
