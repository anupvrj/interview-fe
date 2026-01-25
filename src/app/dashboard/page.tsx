"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  TrendingUp,
  Clock,
  Award,
  PlayCircle,
  FileText,
  Loader2,
  Crown,
  Sparkles,
  BarChart3,
  Target,
  ArrowRight,
  CheckCircle,
  Edit2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Interview, interviewApi, paymentApi, userApi } from "@/lib/api";
import { formatDate, getScoreColor } from "@/lib/utils";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [limitCheck, setLimitCheck] = useState<any>(null);
  const [profileCompletion, setProfileCompletion] = useState<number>(0);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    completedInterviews: 0,
    improvement: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (isLoaded && user) {
      initializeUser();
    }
  }, [isLoaded, user]);

  const initializeUser = async () => {
    try {
      if (!user) return;

      const createdUser = await userApi.createOrGetUser(
        user.id,
        user.primaryEmailAddress?.emailAddress || "",
        user.fullName || user.firstName || "User"
      );

      // Check if onboarding is completed
      if (!createdUser.onboardingCompleted) {
        router.push("/onboarding");
        return;
      }

      try {
        const profile = await userApi.getMyProfile();
        const completion = profile.profileCompletionPercentage || 0;
        console.log("📊 Profile completion:", completion);
        setProfileCompletion(completion);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }

      try {
        const sub = await paymentApi.getSubscription();
        setSubscription(sub);
        console.log("Subscription fetched:", sub);
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }

      try {
        const limit = await paymentApi.checkInterviewLimit();
        setLimitCheck(limit);
        console.log("Limit check:", limit);

        if (limit.interviewsUsed !== undefined) {
          setSubscription((prev: any) => ({
            ...prev,
            interviewsUsed: limit.interviewsUsed,
            interviewsLimit: limit.interviewsLimit,
          }));
        }
      } catch (error) {
        console.error("Error checking limit:", error);
      }

      const userInterviews = await interviewApi.list(user.id);
      setInterviews(userInterviews);

      const completed = userInterviews.filter((i) => i.status === "completed");
      const totalScore = completed.reduce(
        (sum, i) => sum + (i.report?.overallScore || 0),
        0
      );
      const avgScore =
        completed.length > 0 ? Math.round(totalScore / completed.length) : 0;

      const scores = completed.map((i) => i.report?.overallScore || 0);

      // Calculate improvement only if we have enough data
      let improvement = 0;
      if (scores.length >= 3) {
        const recentScores = scores.slice(-3);
        const initialScores = scores.slice(0, 3);
        const recentAvg =
          recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        const initialAvg =
          initialScores.reduce((a, b) => a + b, 0) / initialScores.length;
        improvement = recentAvg - initialAvg;

        // Check for NaN and set to 0 if invalid
        if (isNaN(improvement) || !isFinite(improvement)) {
          improvement = 0;
        }
      }

      setStats({
        totalInterviews: userInterviews.length,
        averageScore: avgScore,
        completedInterviews: completed.length,
        improvement: Math.round(improvement),
      });
    } catch (error) {
      console.error("Error initializing user:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: "bg-green-100 text-green-700 border-green-200",
      processing: "bg-blue-100 text-blue-700 border-blue-200",
      active: "bg-yellow-100 text-yellow-700 border-yellow-200",
      draft: "bg-gray-100 text-gray-700 border-gray-200",
      failed: "bg-red-100 text-red-700 border-red-200",
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-landing-blue-700 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const getNextPlan = (currentPlan: string) => {
    if (currentPlan === "free")
      return {
        id: "starter",
        name: "Starter",
        price: 299,
        interviews: 3,
        features: [
          "3 voice interviews per month",
          "Basic feedback (score + transcript)",
          "Teacher Assistant unlimited",
          "Progress tracking",
        ],
      };
    if (currentPlan === "starter")
      return {
        id: "pro",
        name: "Pro",
        price: 699,
        interviews: 10,
        features: [
          "10 voice interviews per month",
          "Detailed behavioral analysis + action items",
          "Teacher Assistant + custom questions",
          "Progress tracking + weak area radar",
          "Priority support",
        ],
      };
    if (currentPlan === "pro")
      return {
        id: "exam_pack",
        name: "Exam Pack",
        price: 1499,
        interviews: 20,
        features: [
          "20 voice interviews (3 months)",
          "BPSC/SSC/IBPS specialized questions",
          "Curated question bank",
          "Certification/score report",
          "Priority support",
        ],
      };
    return null;
  };

  const nextPlan = subscription ? getNextPlan(subscription.plan) : null;

  let planName = "Free Plan";
  if (subscription?.plan === "starter") {
    planName = "Starter Plan";
  } else if (subscription?.plan === "pro") {
    planName = "Pro Plan";
  } else if (subscription?.plan === "exam_pack") {
    planName = "Exam Pack";
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
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Welcome back, {user?.firstName || "User"}!
            </h1>
          </div>
          <p className="text-base lg:text-lg text-white/90 max-w-2xl">
            Track your progress, review your interviews, and continue improving
            your skills
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-transparent opacity-50"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* Profile & Subscription Section */}
      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Profile Completion Card - Left Side */}
        <Card
          className={`border-2 shadow-xl ${
            profileCompletion >= 100
              ? "border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100"
              : "border-yellow-300 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50"
          }`}
        >
          <CardContent className="p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                  profileCompletion >= 100
                    ? "bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600"
                    : "bg-gradient-to-br from-yellow-500 to-orange-500"
                }`}
              >
                {profileCompletion >= 100 ? (
                  <CheckCircle className="w-7 h-7 text-white" />
                ) : (
                  <Sparkles className="w-7 h-7 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">
                  {profileCompletion >= 100
                    ? "Profile Complete! 🎉"
                    : "Complete your onboarding"}
                </h3>
                <p className="text-sm lg:text-base text-gray-700 mb-4">
                  {profileCompletion >= 100
                    ? "Your profile is complete. You can update it anytime from your profile page."
                    : "Let us understand and serve you better. Complete your profile to get personalized interview experiences."}
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      Profile Completion
                    </span>
                    <span
                      className={`font-semibold ${
                        profileCompletion >= 100
                          ? "text-[rgb(37,99,235)]"
                          : "text-yellow-700"
                      }`}
                    >
                      {profileCompletion}%
                    </span>
                  </div>
                  <Progress value={profileCompletion} className="h-3" />
                </div>
                <Link href="/dashboard/profile">
                  <Button
                    size="lg"
                    className={`w-full sm:w-auto ${
                      profileCompletion >= 100
                        ? "!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-lg hover:shadow-xl transition-all"
                        : "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all"
                    }`}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    {profileCompletion >= 100
                      ? "Update Profile"
                      : "Complete Profile"}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status Card - Right Side */}
        {subscription && (
        <Card className="border-2 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-xl lg:text-2xl">
                Your Subscription
              </CardTitle>
            </div>
            <CardDescription className="text-sm">
              Current plan and usage details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 lg:p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Crown className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg lg:text-xl text-gray-900 mb-1">
                    {planName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {subscription.interviewsUsed || 0} /{" "}
                    {subscription.interviewsLimit || 3} interviews used this
                    period
                  </p>
                </div>
              </div>
              {nextPlan && (
                <Link href="/pricing">
                  <Button
                    size="lg"
                    className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to {nextPlan.name}
                  </Button>
                </Link>
              )}
            </div>

            {subscription.interviewsUsed !== undefined &&
              subscription.interviewsLimit !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      Interview Usage
                    </span>
                    <span className="font-semibold text-[rgb(37,99,235)]">
                      {Math.round(
                        (subscription.interviewsUsed /
                          subscription.interviewsLimit) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      (subscription.interviewsUsed /
                        subscription.interviewsLimit) *
                      100
                    }
                    className="h-3"
                  />
                </div>
              )}

            {nextPlan && (
              <div className="p-4 lg:p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 shadow-md">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-base lg:text-lg text-slate-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-[rgb(37,99,235)]" />
                      Upgrade to {nextPlan.name} and get:
                    </h4>
                    <ul className="space-y-2 mb-4">
                      {nextPlan.features.slice(0, 3).map((feature) => (
                        <li
                          key={feature}
                          className="text-sm text-slate-700 flex items-start gap-2"
                        >
                          <CheckCircle className="w-4 h-4 text-[rgb(37,99,235)] mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm font-bold text-[rgb(37,99,235)]">
                      Only ₹{nextPlan.price}/
                      {nextPlan.id === "exam_pack" ? "3 months" : "month"}
                    </p>
                  </div>
                  <Link href="/pricing">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-blue-300 text-[rgb(37,99,235)] hover:bg-blue-50 whitespace-nowrap"
                    >
                      View Plans
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {!nextPlan && (
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  You're on our highest plan! Enjoy unlimited benefits.
                </p>
              </div>
            )}

            {limitCheck && !limitCheck.allowed && (
              <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
                <p className="text-sm font-medium text-orange-700">
                  {limitCheck.reason ||
                    "You've reached your interview limit. Please upgrade to continue."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Interviews Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">Total Interviews</p>
            <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
              {stats.totalInterviews}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium">
            <Clock className="w-4 h-4" />
            <span>All time</span>
          </div>
        </div>

        {/* Average Score Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">Average Score</p>
            <h3
              className={`text-3xl lg:text-4xl font-bold mb-3 ${getScoreColor(
                stats.averageScore
              )}`}
            >
              {stats.averageScore}/100
            </h3>
          </div>
          <Progress value={stats.averageScore} className="h-2.5 bg-blue-100" />
        </div>

        {/* Completed Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">Completed</p>
            <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
              {stats.completedInterviews}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium">
            <CheckCircle className="w-4 h-4" />
            <span>Finished interviews</span>
          </div>
        </div>

        {/* Improvement Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">Improvement</p>
            <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
              {stats.improvement !== undefined && !isNaN(stats.improvement) ? (
                <>
                  {stats.improvement > 0 ? "+" : ""}
                  {stats.improvement}%
                </>
              ) : (
                "0%"
              )}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>Last 3 sessions</span>
          </div>
        </div>
      </div>

      {/* Recent Interviews */}
      <Card className="border-2 border-blue-200/50 shadow-xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-xl lg:text-2xl text-slate-900">
                  Recent Interviews
                </CardTitle>
              </div>
              <CardDescription className="text-sm text-gray-600">
                Your interview history and performance
              </CardDescription>
            </div>
            <Link href="/dashboard/interviews/new">
              <Button
                size="lg"
                className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-4 h-4 mr-2" /> Start Interview
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {interviews.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FileText className="w-10 h-10 text-[rgb(37,99,235)]" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                No interviews yet
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start your first mock interview to get personalized feedback and
                improve your interview skills
              </p>
              <Link href="/dashboard/interviews/new">
                <Button
                  size="lg"
                  className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="w-5 h-5 mr-2" /> Create Your First Interview
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {interviews
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((interview) => (
                <div
                  key={interview._id}
                  className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-4">
                    {/* Interview Icon Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Header with Role and Status */}
                      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                            {interview.metadata.role || "General Interview"}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(interview.createdAt)}
                            </span>
                            <span>•</span>
                            <span>
                              {interview.metadata.language === "hi"
                                ? "Hindi"
                                : "English"}
                            </span>
                            {interview.report && (
                              <>
                                <span>•</span>
                                <span
                                  className={`font-semibold ${getScoreColor(
                                    interview.report.overallScore
                                  )}`}
                                >
                                  Score: {interview.report.overallScore}/100
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${getStatusBadge(
                            interview.status
                          )}`}
                        >
                          {interview.status}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {interview.status === "completed" && (
                          <>
                            {(interview.session?.videoUrl ||
                              interview.session?.s3VideoKey) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-300 text-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] hover:!text-white hover:border-[rgb(17,24,39)] transition-all"
                                onClick={async () => {
                                  try {
                                    const { videoUrl } =
                                      await interviewApi.getRecordingVideoUrl(
                                        interview.interviewId
                                      );
                                    window.open(videoUrl, "_blank");
                                  } catch (error) {
                                    console.error(
                                      "Error getting video URL:",
                                      error
                                    );
                                    alert(
                                      "Failed to load video. Please try again."
                                    );
                                  }
                                }}
                              >
                                <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                                Play Video
                              </Button>
                            )}
                            <Link
                              href={`/dashboard/interviews/${interview.interviewId}/report`}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-300 text-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] hover:!text-white hover:border-[rgb(17,24,39)] transition-all"
                              >
                                View Report
                              </Button>
                            </Link>
                          </>
                        )}
                        {interview.status === "draft" && (
                          <Link
                            href={`/interview/${interview.interviewId}/realtime`}
                          >
                            <Button
                              size="sm"
                              className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-md transition-all"
                            >
                              <PlayCircle className="w-3.5 h-3.5 mr-1.5" /> Start
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                  ))}
              </div>

              {/* Pagination */}
              {interviews.length > itemsPerPage && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-blue-200">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, interviews.length)} of{" "}
                    {interviews.length} interviews
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="border-blue-300 text-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] hover:!text-white hover:border-[rgb(17,24,39)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 px-3">
                      Page {currentPage} of {Math.ceil(interviews.length / itemsPerPage)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(
                            Math.ceil(interviews.length / itemsPerPage),
                            prev + 1
                          )
                        )
                      }
                      disabled={
                        currentPage >= Math.ceil(interviews.length / itemsPerPage)
                      }
                      className="border-blue-300 text-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] hover:!text-white hover:border-[rgb(17,24,39)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
