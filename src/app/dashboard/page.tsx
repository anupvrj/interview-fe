"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  TrendingUp,
  Clock,
  CalendarClock,
  Award,
  PlayCircle,
  FileText,
  FileEdit,
  Loader2,
  BarChart3,
  Target,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  UsersRound,
  Percent,
  X,
  FileCheck,
  Download,
} from "lucide-react";
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
import {
  Interview,
  Resume,
  interviewApi,
  interviewScheduleApi,
  resumeApi,
  userApi,
} from "@/lib/api";
import { TEMPLATES_CATALOG } from "@/configs/resume-templates/templates-catalog";
import {
  cn,
  formatDate,
  getInterviewCreditsUsed,
  getScoreColor,
  scheduledInterviewCanStartNow,
} from "@/lib/utils";
import { getPeerInterviewUnlockStatus } from "@/lib/peer-interviews";
import {
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";

const ONBOARDING_BANNER_DISMISSED_KEY = "dashboard-onboarding-banner-dismissed";

/** session.duration from API is seconds; show whole minutes (ceil, min 1 when > 0). */
function formatInterviewDurationMinutes(
  durationSeconds: number | undefined,
): string | null {
  if (
    typeof durationSeconds !== "number" ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    return null;
  }
  const mins = Math.max(1, Math.ceil(durationSeconds / 60));
  return mins === 1 ? "1 min" : `${mins} min`;
}

function resumeTemplateLabel(templateId: string): string {
  return (
    TEMPLATES_CATALOG.find((t) => t.id === templateId)?.name ?? templateId
  );
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState<number>(0);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    completedInterviews: 0,
    improvement: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [resumePage, setResumePage] = useState(1);
  const resumeItemsPerPage = 8;
  const [scheduledInterviews, setScheduledInterviews] = useState<any[]>([]);
  const [startingScheduleId, setStartingScheduleId] = useState<string | null>(null);
  /** null = not read yet (avoid flash); false = show banner; true = user dismissed */
  const [onboardingBannerDismissed, setOnboardingBannerDismissed] = useState<
    boolean | null
  >(null);
  const [videoUnavailableOpen, setVideoUnavailableOpen] = useState(false);
  const [downloadingResumeId, setDownloadingResumeId] = useState<string | null>(null);

  useEffect(() => {
    try {
      setOnboardingBannerDismissed(
        sessionStorage.getItem(ONBOARDING_BANNER_DISMISSED_KEY) === "1",
      );
    } catch {
      setOnboardingBannerDismissed(false);
    }
  }, []);

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

      const userInterviews = await interviewApi.list(user.id);
      setInterviews(userInterviews);

      try {
        const userResumes = await resumeApi.list(user.id);
        setResumes(userResumes);
      } catch (err) {
        console.error("Error loading resumes:", err);
        setResumes([]);
      }

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

  const handleResumeDownload = async (resumeId: string) => {
    try {
      setDownloadingResumeId(resumeId);
      const pdfUrl = await resumeApi.downloadPDF(resumeId);
      globalThis.open(pdfUrl, "_blank");
    } catch (error: any) {
      const shouldOpenEditor =
        error?.message?.includes("PDF not found") || error?.response?.status === 404;
      if (
        shouldOpenEditor &&
        globalThis.confirm("PDF is not generated yet. Open editor to generate/download it?")
      ) {
        router.push(`/dashboard/resumes/${resumeId}/edit`);
        return;
      }
      alert("Could not download resume PDF. Please try again.");
    } finally {
      setDownloadingResumeId(null);
    }
  };

  const sortedResumes = [...resumes].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const resumesWithAts = resumes.filter(
    (r) =>
      typeof r.atsScore === "number" && Number.isFinite(r.atsScore),
  );
  const avgAts =
    resumesWithAts.length > 0
      ? Math.round(
          resumesWithAts.reduce((s, r) => s + (r.atsScore ?? 0), 0) /
            resumesWithAts.length,
        )
      : 0;
  const resumeTotalPages = Math.max(
    1,
    Math.ceil(sortedResumes.length / resumeItemsPerPage),
  );
  const resumeSlice = sortedResumes.slice(
    (resumePage - 1) * resumeItemsPerPage,
    resumePage * resumeItemsPerPage,
  );
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
      { day, interviews: 0, scoredCount: 0, scoreTotal: 0, credits: 0 },
    ]),
  );
  for (const interview of interviews) {
    const day = new Date(interview.createdAt).toISOString().slice(0, 10);
    const row = dailyMap.get(day);
    if (!row) continue;
    row.interviews += 1;
    const score = interview.report?.overallScore;
    if (typeof score === "number" && Number.isFinite(score)) {
      row.scoredCount += 1;
      row.scoreTotal += score;
    }
    const credits = getInterviewCreditsUsed(interview);
    if (credits != null) row.credits += credits;
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
  const totalTokensSpent = dailyData.reduce((sum, d) => sum + d.credits, 0);
  const activeDays = dailyData.filter((d) => d.interviews > 0).length;
  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 px-4 py-3 sm:px-5 sm:py-4 text-white shadow-lg">
        <div className="relative z-10">
          <div className="mb-1.5 flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/20 shadow-sm backdrop-blur-sm sm:h-9 sm:w-9">
              <BarChart3 className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
            <h1 className="truncate text-lg font-bold leading-tight text-white sm:text-xl lg:text-2xl">
              Welcome back, {user?.firstName || "User"}!
            </h1>
          </div>
          <p className="text-[10px] leading-tight text-white/85 sm:text-xs md:text-sm">
            Track your progress, review your interviews, and continue improving your skills
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 to-transparent opacity-40"></div>
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl"></div>
      </div>

      {scheduledInterviews.length > 0 && (
        <Card className="rounded-md border-2 border-amber-200 bg-gradient-to-br from-amber-50/80 to-white shadow-lg">
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
                className="flex flex-col gap-2 rounded-md border border-amber-100 bg-white/90 p-4 sm:flex-row sm:items-center sm:justify-between"
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

      {profileCompletion < 100 &&
        onboardingBannerDismissed === false && (
          <div className="flex items-center gap-2 rounded-md border border-amber-200/70 bg-amber-50/50 px-3 py-2 text-sm text-slate-800">
            <p className="min-w-0 flex-1 leading-snug">
              <span className="text-slate-700">
                Complete your onboarding ({profileCompletion}% done) —{" "}
              </span>
              <Link
                href="/dashboard/profile"
                className="font-medium text-[rgb(37,99,235)] underline-offset-2 hover:underline"
              >
                Finish your profile
              </Link>
            </p>
            <button
              type="button"
              aria-label="Dismiss reminder"
              className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-amber-100/80 hover:text-slate-800"
              onClick={() => {
                try {
                  sessionStorage.setItem(ONBOARDING_BANNER_DISMISSED_KEY, "1");
                } catch {
                  /* ignore */
                }
                setOnboardingBannerDismissed(true);
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

      {/* Stats */}
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
            <Target className="h-5 w-5 text-white sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs font-bold leading-tight text-[rgb(37,99,235)] sm:text-sm">
                Average Score
              </p>
              <p className="shrink-0 text-right text-lg font-bold tabular-nums leading-none text-slate-900 sm:text-xl lg:text-2xl">
                {stats.averageScore}
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
            <Award className="h-5 w-5 text-white sm:h-6 sm:w-6" />
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
              <p className="shrink-0 text-right text-lg font-bold tabular-nums leading-none text-slate-900 sm:text-xl lg:text-2xl">
                {stats.improvement !== undefined && !isNaN(stats.improvement) ? (
                  <>
                    {stats.improvement > 0 ? "+" : ""}
                    {stats.improvement}%
                  </>
                ) : (
                  "0%"
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-600 sm:text-sm">
              <TrendingUp className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>Last 3 sessions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-md border border-slate-200/80 bg-white shadow-sm xl:col-span-2">
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

        <Card className="rounded-md border border-slate-200/80 bg-white shadow-sm">
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

      {/* Recent Interviews */}
      <Card className="rounded-md border border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 rounded-md flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
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
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/interviews"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  instituteSecondaryClass,
                  "h-9 px-3 text-xs no-underline sm:h-10 sm:px-4 sm:text-sm",
                )}
              >
                View all
              </Link>
              <Link href="/dashboard/interviews/new">
                <Button
                  size="lg"
                  className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" /> Start Interview
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {interviews.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-md flex items-center justify-center mx-auto mb-6 shadow-lg">
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
              <div className="divide-y divide-slate-100">
                {interviews
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage,
                  )
                  .map((interview) => {
                    const durationLabel = formatInterviewDurationMinutes(
                      interview.session?.duration,
                    );
                    const creditsUsed = getInterviewCreditsUsed(interview);
                    return (
                    <div
                      key={interview._id}
                      className="group flex min-w-0 flex-nowrap items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 transition-colors hover:bg-slate-50/80"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="truncate text-sm font-semibold leading-tight text-slate-900">
                          {interview.metadata.role || "General Interview"}
                        </h4>
                        <p className="flex flex-wrap items-center gap-x-1.5 text-xs leading-normal text-slate-500">
                          <span>{formatDate(interview.createdAt)}</span>
                          <span className="text-slate-300">·</span>
                          <span>
                            {interview.metadata.language === "hi"
                              ? "Hindi"
                              : "English"}
                          </span>
                          {durationLabel && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="tabular-nums text-slate-600">
                                {durationLabel}
                              </span>
                            </>
                          )}
                          {creditsUsed != null && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="tabular-nums text-slate-600">
                                {creditsUsed} credits
                              </span>
                            </>
                          )}
                          {interview.report && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span
                                className={cn(
                                  "font-semibold tabular-nums",
                                  getScoreColor(
                                    interview.report.overallScore,
                                  ),
                                )}
                              >
                                {interview.report.overallScore}/100
                              </span>
                            </>
                          )}
                          <span className="text-slate-300">·</span>
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-1.5 py-px text-[10px] font-semibold capitalize leading-none",
                              getStatusBadge(interview.status),
                            )}
                          >
                            {interview.status}
                          </span>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5 self-center">
                        {interview.status === "completed" && (
                          <>
                            <Button
                              variant="outline"
                              className={cn(
                                instituteSecondaryClass,
                                "size-8 shrink-0 p-0 [&_svg]:size-3.5",
                              )}
                              title="Play video"
                              aria-label="Play interview video"
                              onClick={async () => {
                                try {
                                  const { videoUrl } =
                                    await interviewApi.getRecordingVideoUrl(
                                      interview.interviewId,
                                    );
                                  if (!videoUrl?.trim()) {
                                    setVideoUnavailableOpen(true);
                                    return;
                                  }
                                  window.open(videoUrl, "_blank");
                                } catch (error) {
                                  console.error(
                                    "Error getting video URL:",
                                    error,
                                  );
                                  setVideoUnavailableOpen(true);
                                }
                              }}
                            >
                              <PlayCircle className="size-3.5" />
                            </Button>
                            <Link
                              href={`/dashboard/interviews/${interview.interviewId}/report`}
                              className={cn(
                                buttonVariants({ variant: "outline" }),
                                instituteSecondaryClass,
                                "h-8 shrink-0 gap-1.5 px-2.5 py-0 text-xs leading-none no-underline",
                              )}
                            >
                              <FileText className="size-3.5 shrink-0" />
                              View Report
                            </Link>
                          </>
                        )}
                        {interview.status === "draft" && (
                          <Link
                            href={`/interview/${interview.interviewId}/realtime`}
                            className={cn(
                              buttonVariants({ variant: "default" }),
                              institutePrimaryClass,
                              "h-8 shrink-0 gap-1 px-3 py-0 text-xs leading-none no-underline",
                            )}
                          >
                            <PlayCircle className="size-3.5 shrink-0" />
                            Start
                          </Link>
                        )}
                      </div>
                    </div>
                    );
                  })}
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

      {/* Resume quick stats */}
      {resumes.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2">
          <div className="flex min-h-0 min-w-0 items-start gap-3 rounded-md border border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 shadow-lg shadow-blue-500/10 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50 sm:h-12 sm:w-12">
              <FileEdit className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs font-bold leading-tight text-[rgb(37,99,235)] sm:text-sm">
                  Total resumes
                </p>
                <p className="shrink-0 text-right text-lg font-bold tabular-nums leading-none text-slate-900 sm:text-xl lg:text-2xl">
                  {resumes.length}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-600 sm:text-sm">
                <FileText className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>In builder</span>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 items-start gap-3 rounded-md border border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 shadow-lg shadow-blue-500/10 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50 sm:h-12 sm:w-12">
              <FileCheck className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs font-bold leading-tight text-[rgb(37,99,235)] sm:text-sm">
                  Average ATS
                </p>
                <p
                  className={cn(
                    "shrink-0 text-right text-lg font-bold tabular-nums leading-none sm:text-xl lg:text-2xl",
                    resumesWithAts.length > 0
                      ? getScoreColor(avgAts)
                      : "text-slate-900",
                  )}
                >
                  {resumesWithAts.length > 0 ? `${avgAts}/100` : "—"}
                </p>
              </div>
              <Progress
                value={avgAts}
                className="h-2 w-full overflow-hidden rounded-full border border-blue-300/90 bg-blue-100/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] sm:h-2.5"
              />
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-600 sm:text-sm">
                <Percent className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>
                  {resumesWithAts.length > 0
                    ? `${resumesWithAts.length} scored`
                    : "No ATS run yet"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Your resumes */}
      <Card className="rounded-md border border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
                  <FileEdit className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-900 lg:text-2xl">
                  Your resumes
                </CardTitle>
              </div>
              <CardDescription className="text-sm text-gray-600">
                Open the builder to edit, run ATS, or export PDF
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/resumes"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  instituteSecondaryClass,
                  "h-9 px-3 text-xs no-underline sm:h-10 sm:px-4 sm:text-sm",
                )}
              >
                View all
              </Link>
              <Link href="/dashboard/resumes/new">
                <Button
                  size="lg"
                  className="!bg-[rgb(37,99,235)] text-white shadow-lg transition-all hover:!bg-[rgb(17,24,39)] hover:shadow-xl"
                >
                  <Plus className="mr-2 h-4 w-4" /> New resume
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {resumes.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-md bg-gradient-to-br from-blue-100 to-blue-200 shadow-lg">
                <FileEdit className="h-10 w-10 text-[rgb(37,99,235)]" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">
                No resumes yet
              </h3>
              <p className="mx-auto mb-8 max-w-md text-gray-600">
                Create a resume to use in interviews and track ATS feedback
              </p>
              <Link href="/dashboard/resumes/new">
                <Button
                  size="lg"
                  className="!bg-[rgb(37,99,235)] text-white shadow-lg transition-all hover:!bg-[rgb(17,24,39)] hover:shadow-xl"
                >
                  <Plus className="mr-2 h-5 w-5" /> Create your first resume
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {resumeSlice.map((resume) => (
                  <div
                    key={resume.resumeId}
                    className="group flex min-w-0 flex-nowrap items-center justify-between gap-3 py-2.5 transition-colors first:pt-0 last:pb-0 hover:bg-slate-50/80"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <Link
                        href={`/dashboard/resumes/${resume.resumeId}/edit`}
                        className="block truncate text-sm font-semibold leading-tight text-slate-900 hover:text-[rgb(37,99,235)]"
                      >
                        {resume.title?.trim() || "Untitled resume"}
                      </Link>
                      <p className="flex flex-wrap items-center gap-x-1.5 text-xs leading-normal text-slate-500">
                        <span>Updated {formatDate(resume.updatedAt)}</span>
                        <span className="text-slate-300">·</span>
                        <span>{resumeTemplateLabel(resume.templateId)}</span>
                        {typeof resume.atsScore === "number" &&
                        Number.isFinite(resume.atsScore) ? (
                          <>
                            <span className="text-slate-300">·</span>
                            <span
                              className={cn(
                                "font-semibold tabular-nums",
                                getScoreColor(resume.atsScore),
                              )}
                            >
                              ATS {resume.atsScore}/100
                            </span>
                          </>
                        ) : null}
                        {resume.pdfS3Key ? (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-600">PDF</span>
                          </>
                        ) : null}
                        {resume.isDefault ? (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="inline-flex rounded-full border border-violet-200 bg-violet-100 px-1.5 py-px text-[10px] font-semibold leading-none text-violet-800">
                              Default
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5 self-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleResumeDownload(resume.resumeId)}
                        disabled={downloadingResumeId === resume.resumeId}
                        className={cn(
                          instituteSecondaryClass,
                          "h-8 shrink-0 gap-1.5 px-2.5 py-0 text-xs leading-none",
                        )}
                      >
                        {downloadingResumeId === resume.resumeId ? (
                          <Loader2 className="size-3.5 shrink-0 animate-spin" />
                        ) : (
                          <Download className="size-3.5 shrink-0" />
                        )}
                        Download
                      </Button>
                      <Link
                        href={`/dashboard/resumes/${resume.resumeId}/edit`}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          instituteSecondaryClass,
                          "h-8 shrink-0 gap-1.5 px-2.5 py-0 text-xs leading-none no-underline",
                        )}
                      >
                        <FileEdit className="size-3.5 shrink-0" />
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {sortedResumes.length > resumeItemsPerPage && (
                <div className="mt-6 flex flex-col gap-4 border-t border-blue-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {(resumePage - 1) * resumeItemsPerPage + 1} to{" "}
                    {Math.min(
                      resumePage * resumeItemsPerPage,
                      sortedResumes.length,
                    )}{" "}
                    of {sortedResumes.length} resumes
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setResumePage((p) => Math.max(1, p - 1))
                      }
                      disabled={resumePage === 1}
                      className="border-blue-300 text-[rgb(37,99,235)] transition-all hover:!border-[rgb(17,24,39)] hover:!bg-[rgb(17,24,39)] hover:!text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <span className="px-3 text-sm text-gray-600">
                      Page {resumePage} of {resumeTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setResumePage((p) =>
                          Math.min(resumeTotalPages, p + 1),
                        )
                      }
                      disabled={resumePage >= resumeTotalPages}
                      className="border-blue-300 text-[rgb(37,99,235)] transition-all hover:!border-[rgb(17,24,39)] hover:!bg-[rgb(17,24,39)] hover:!text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={videoUnavailableOpen}
        onOpenChange={setVideoUnavailableOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>No video available</DialogTitle>
            <DialogDescription>
              This interview does not have a recording, or the video could not
              be loaded. If you just finished the interview, try again in a few
              minutes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setVideoUnavailableOpen(false)}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
