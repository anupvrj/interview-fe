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
  CalendarClock,
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
  Coins,
  Lock,
  UsersRound,
} from "lucide-react";
import {
  Interview,
  interviewApi,
  interviewScheduleApi,
  paymentApi,
  userApi,
  planApi,
} from "@/lib/api";
import { formatDate, getScoreColor, scheduledInterviewCanStartNow } from "@/lib/utils";
import { getPeerInterviewUnlockStatus } from "@/lib/peer-interviews";

interface Plan {
  _id: string;
  planId: string;
  name: string;
  displayName: string;
  features: any;
  pricing: any;
  creditsIncluded: any;
}

interface NextPlanDisplay {
  id: string;
  name: string;
  price: number;
  interviews: number;
  features: string[];
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [limitCheck, setLimitCheck] = useState<any>(null);
  const [profileCompletion, setProfileCompletion] = useState<number>(0);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    completedInterviews: 0,
    improvement: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [scheduledInterviews, setScheduledInterviews] = useState<any[]>([]);
  const [startingScheduleId, setStartingScheduleId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      initializeUser();
      loadPlans();
    }
  }, [isLoaded, user]);

  const loadPlans = async () => {
    try {
      const plans = await planApi.getAllPlans();
      setAllPlans(plans);
    } catch (error) {
      console.error("Error loading plans:", error);
    }
  };

  const initializeUser = async () => {
    try {
      if (!user) return;

      const createdUser = await userApi.createOrGetUser(
        user.id,
        user.primaryEmailAddress?.emailAddress || "",
        user.fullName || user.firstName || "User",
      );

      // Check if onboarding is completed
      if (!createdUser.onboardingCompleted) {
        router.push("/onboarding");
        return;
      }

      let profile: Awaited<ReturnType<typeof userApi.getMyProfile>> | null =
        null;
      try {
        profile = await userApi.getMyProfile();
        if (
          profile.accessRole === "institution_admin" &&
          profile.institutionId
        ) {
          router.replace(
            `/dashboard/institute/${String(profile.institutionId)}`
          );
          return;
        }
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

        // Update subscription with credit info (new credit-based system)
        if (limit.creditsAvailable !== undefined) {
          setSubscription((prev: any) => ({
            ...prev,
            creditsAvailable: limit.creditsAvailable,
            minimumRequired: limit.minimumRequired,
          }));
        }
      } catch (error) {
        console.error("Error checking limit:", error);
      }

      const userInterviews = await interviewApi.list(user.id);
      setInterviews(userInterviews);

      try {
        const schedules = await interviewScheduleApi.listMine();
        setScheduledInterviews(schedules || []);
      } catch {
        setScheduledInterviews([]);
      }

      const completed = userInterviews.filter((i) => i.status === "completed");
      const totalScore = completed.reduce(
        (sum, i) => sum + (i.report?.overallScore || 0),
        0,
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

  const getNextPlan = (currentPlan: string): NextPlanDisplay | null => {
    if (!allPlans || allPlans.length === 0) return null;

    const planOrder = ["free", "premium", "enterprise"];
    const currentIndex = planOrder.indexOf(currentPlan);

    if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
      return null;
    }

    const nextPlanId = planOrder[currentIndex + 1];
    const nextPlan = allPlans.find((p) => p.planId === nextPlanId);

    if (!nextPlan) return null;

    // Generate features list from plan data
    const features: string[] = [];

    if (nextPlan.features.freeInterviews) {
      features.push(
        `${nextPlan.features.freeInterviews.count} voice interviews per month`,
      );
    }

    if (nextPlan.features.additionalInterviews) {
      features.push(
        `${nextPlan.features.additionalInterviews.count} additional interviews`,
      );
    }

    if (nextPlan.features.resumeBuilder?.enabled) {
      features.push("Resume Builder Pro");
    }

    if (nextPlan.features.atsScoring?.detailed) {
      features.push("Detailed ATS scoring");
    }

    if (nextPlan.features.teacherAssistant?.enabled) {
      features.push("Teacher Assistant");
    }

    if (nextPlan.features.progressTracking?.enabled) {
      features.push("Progress tracking");
    }

    if (nextPlan.features.prioritySupport) {
      features.push("Priority support");
    }

    if (nextPlan.features.customQuestions) {
      features.push("Custom questions");
    }

    if (nextPlan.features.specializedQuestions) {
      features.push("Specialized questions (BPSC/SSC/IBPS)");
    }

    if (nextPlan.features.curatedQuestionBank) {
      features.push("Curated question bank");
    }

    if (nextPlan.features.certification) {
      features.push("Certification/score report");
    }

    return {
      id: nextPlan.planId,
      name: nextPlan.displayName,
      price: nextPlan.pricing?.monthly || 0,
      interviews: nextPlan.features.freeInterviews?.count || 0,
      features,
    };
  };

  const nextPlan = subscription ? getNextPlan(subscription.plan) : null;

  // Get plan display name from database
  const getPlanName = (planId: string): string => {
    const plan = allPlans.find((p) => p.planId === planId);
    return plan?.displayName || "Free Plan";
  };

  const planName = subscription?.plan
    ? getPlanName(subscription.plan)
    : "Free Plan";

  const peerUnlock = getPeerInterviewUnlockStatus(interviews);

  const handleStartScheduled = async (scheduleId: string) => {
    try {
      setStartingScheduleId(scheduleId);
      const { interviewId } = await interviewScheduleApi.start(scheduleId);
      router.push(`/interview/${interviewId}/realtime`);
    } catch (e: any) {
      alert(
        e?.response?.data?.message ||
          "Could not start interview. You may need a saved resume, or the scheduled time is not open yet (starts 24 hours before)."
      );
    } finally {
      setStartingScheduleId(null);
    }
  };

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

      {scheduledInterviews.length > 0 && (
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50/80 to-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-amber-950">
              <CalendarClock className="h-5 w-5 text-amber-700" />
              Scheduled interviews
            </CardTitle>
            <CardDescription>
              Your institution scheduled these for you. You can start from 24 hours before the
              scheduled time until the expire deadline (if set). A saved resume is required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scheduledInterviews.map((s) => {
              const { canStart, reason } = scheduledInterviewCanStartNow(
                s.scheduledAt,
                s.expiresAt
              );
              const startDisabled =
                startingScheduleId === String(s._id) || !canStart;
              return (
              <div
                key={s._id}
                className="flex flex-col gap-2 rounded-xl border border-amber-100 bg-white/90 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{s.role}</p>
                  <p className="text-sm text-slate-600">
                    {new Date(s.scheduledAt).toLocaleString()}
                    {s.targetCompany ? ` · ${s.targetCompany}` : ""}
                  </p>
                  {s.expiresAt ? (
                    <p className="mt-1 text-xs text-amber-800">
                      Start by {new Date(s.expiresAt).toLocaleString()}
                    </p>
                  ) : null}
                  {s.notes ? (
                    <p className="mt-1 text-xs text-slate-500">{s.notes}</p>
                  ) : null}
                  {!canStart && reason === "too_early" ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Opens {new Date(new Date(s.scheduledAt).getTime() - 24 * 60 * 60 * 1000).toLocaleString()}
                    </p>
                  ) : null}
                  {!canStart && reason === "expired" ? (
                    <p className="mt-1 text-xs text-red-600">Past expire deadline</p>
                  ) : null}
                </div>
                <Button
                  className="shrink-0 gap-2 bg-amber-600 hover:bg-amber-700"
                  onClick={() => handleStartScheduled(String(s._id))}
                  disabled={startDisabled}
                >
                  {startingScheduleId === String(s._id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlayCircle className="h-4 w-4" />
                  )}
                  Start interview
                </Button>
              </div>
            );
            })}
          </CardContent>
        </Card>
      )}

      <Card
        className={`border-2 shadow-lg ${
          peerUnlock.unlocked
            ? "border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white"
            : "border-slate-200 bg-gradient-to-br from-slate-50/90 to-blue-50/40"
        }`}
      >
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 shadow-inner ${
                peerUnlock.unlocked
                  ? "border-emerald-300 bg-emerald-100"
                  : "border-slate-300 bg-gradient-to-br from-slate-200 to-slate-100"
              }`}
            >
              {peerUnlock.unlocked ? (
                <UsersRound className="h-7 w-7 text-emerald-700" />
              ) : (
                <Lock className="h-7 w-7 text-slate-500" strokeWidth={2.25} />
              )}
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  Peer-to-peer interviews
                </h2>
                {!peerUnlock.unlocked && (
                  <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Locked
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                {peerUnlock.unlocked
                  ? "You have unlocked peer-to-peer interviews. Open the hub to continue when matching is available."
                  : "Unlock peer-to-peer interviews by scoring 80% on average in your last 10 completed interviews."}
              </p>
            </div>
          </div>
          <Link href="/dashboard/peer-interviews" className="w-full shrink-0 sm:w-auto">
            <Button
              type="button"
              variant={peerUnlock.unlocked ? "default" : "outline"}
              className={
                peerUnlock.unlocked
                  ? "w-full !bg-emerald-600 text-white hover:!bg-emerald-700"
                  : "w-full border-slate-300"
              }
            >
              {peerUnlock.unlocked ? "Open peer hub" : "View requirements"}
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Profile & Subscription Section */}
      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Subscription Status Card - Left Side (First) */}
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
              <div className="p-4 lg:p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
                {/* Content Section - Top */}
                <div className="flex items-center gap-3 lg:gap-4 mb-4">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                    <Crown className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg lg:text-xl text-gray-900 mb-1">
                      {planName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {subscription.creditsAvailable || 0} credits available
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      5 credits per minute • Min. 25 credits to start
                    </p>
                  </div>
                </div>

                {/* Buttons Section - Bottom */}
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  {nextPlan && (
                    <Link href="/pricing" className="flex-1">
                      <Button
                        size="lg"
                        className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-lg hover:shadow-xl transition-all w-full"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to {nextPlan.name}
                      </Button>
                    </Link>
                  )}
                  <Link href="/purchase-credits" className="flex-1">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 shadow-md hover:shadow-lg transition-all w-full"
                    >
                      <Coins className="h-4 w-4 mr-2" />
                      Buy Credits
                    </Button>
                  </Link>
                </div>
              </div>

              {subscription.creditsAvailable !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      Available Credits
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {subscription.creditsAvailable} credits
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <p>• 30-min interview = 150 credits</p>
                    <p>• 60-min interview = 300 credits</p>
                  </div>
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
                        Only ₹{nextPlan.price}/month
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

        {/* Profile Completion Card - Right Side (Second) */}
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
            <p className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">
              Total Interviews
            </p>
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
            <p className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">
              Average Score
            </p>
            <h3
              className={`text-3xl lg:text-4xl font-bold mb-3 ${getScoreColor(
                stats.averageScore,
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
            <p className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">
              Completed
            </p>
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
            <p className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">
              Improvement
            </p>
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
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage,
                  )
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
                                        interview.report.overallScore,
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
                                interview.status,
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
                                            interview.interviewId,
                                          );
                                        window.open(videoUrl, "_blank");
                                      } catch (error) {
                                        console.error(
                                          "Error getting video URL:",
                                          error,
                                        );
                                        alert(
                                          "Failed to load video. Please try again.",
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
                                  <PlayCircle className="w-3.5 h-3.5 mr-1.5" />{" "}
                                  Start
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="border-blue-300 text-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] hover:!text-white hover:border-[rgb(17,24,39)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 px-3">
                      Page {currentPage} of{" "}
                      {Math.ceil(interviews.length / itemsPerPage)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(
                            Math.ceil(interviews.length / itemsPerPage),
                            prev + 1,
                          ),
                        )
                      }
                      disabled={
                        currentPage >=
                        Math.ceil(interviews.length / itemsPerPage)
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
