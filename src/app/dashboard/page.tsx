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
  Target,
  CheckCircle,
  Coins,
  Lock,
  UsersRound,
  Percent,
  X,
  FileCheck,
  Sparkles,
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
import { getPeerInterviewUnlockStatus } from "@/lib/peer-interviews";
import {
  cn,
  getInterviewCreditsUsed,
  scheduledInterviewCanStartNow,
} from "@/lib/utils";
import {
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import {
  DashboardInsightTile,
  DashboardStatCard,
} from "@/components/dashboard/DashboardStatCard";
import { DashboardWelcomeHero } from "@/components/dashboard/DashboardWelcomeHero";
import { RecentInterviewsList } from "@/components/dashboard/RecentInterviewsList";
import { DashboardResumesList } from "@/components/dashboard/DashboardResumesList";

const ONBOARDING_BANNER_DISMISSED_KEY = "dashboard-onboarding-banner-dismissed";

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
  const [startingScheduleId, setStartingScheduleId] = useState<string | null>(
    null,
  );
  /** null = not read yet (avoid flash); false = show banner; true = user dismissed */
  const [onboardingBannerDismissed, setOnboardingBannerDismissed] = useState<
    boolean | null
  >(null);
  const [videoUnavailableOpen, setVideoUnavailableOpen] = useState(false);
  const [downloadingResumeId, setDownloadingResumeId] = useState<string | null>(
    null,
  );

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
            `/dashboard/institute/${String(profile.institutionId)}`,
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

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const handleStartScheduled = async (scheduleId: string) => {
    try {
      setStartingScheduleId(scheduleId);
      const { interviewId } = await interviewScheduleApi.start(scheduleId);
      router.push(`/interview/${interviewId}/realtime`);
    } catch (e: any) {
      alert(
        e?.response?.data?.message ||
          "Could not start interview. You may need a saved resume, or the scheduled time is not open yet (starts 24 hours before).",
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
        error?.message?.includes("PDF not found") ||
        error?.response?.status === 404;
      if (
        shouldOpenEditor &&
        globalThis.confirm(
          "PDF is not generated yet. Open editor to generate/download it?",
        )
      ) {
        router.push(`/dashboard/resumes/${resumeId}/edit`);
        return;
      }
      alert("Could not download resume PDF. Please try again.");
    } finally {
      setDownloadingResumeId(null);
    }
  };

  const resumesWithAts = resumes.filter(
    (r) => typeof r.atsScore === "number" && Number.isFinite(r.atsScore),
  );
  const avgAts =
    resumesWithAts.length > 0
      ? Math.round(
          resumesWithAts.reduce((s, r) => s + (r.atsScore ?? 0), 0) /
            resumesWithAts.length,
        )
      : 0;
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
      label: dateObj.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      avgScore:
        row.scoredCount > 0 ? Math.round(row.scoreTotal / row.scoredCount) : 0,
    };
  });
  const totalTokensSpent = dailyData.reduce((sum, d) => sum + d.credits, 0);
  const activeDays = dailyData.filter((d) => d.interviews > 0).length;
  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 lg:space-y-6">
      <DashboardWelcomeHero firstName={user?.firstName || "User"} />

      {scheduledInterviews.length > 0 && (
        <Card className="rounded-md border-2 border-amber-200 bg-gradient-to-br from-amber-50/80 to-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-amber-950">
              <CalendarClock className="h-5 w-5 text-amber-700" />
              Scheduled interviews
            </CardTitle>
            <CardDescription>
              Your institution scheduled these for you. You can start from 24
              hours before the scheduled time until the expire deadline (if
              set). A saved resume is required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scheduledInterviews.map((s) => {
              const { canStart, reason } = scheduledInterviewCanStartNow(
                s.scheduledAt,
                s.expiresAt,
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
                        Opens{" "}
                        {new Date(
                          new Date(s.scheduledAt).getTime() -
                            24 * 60 * 60 * 1000,
                        ).toLocaleString()}
                      </p>
                    ) : null}
                    {!canStart && reason === "expired" ? (
                      <p className="mt-1 text-xs text-red-600">
                        Past expire deadline
                      </p>
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

      {profileCompletion < 100 && onboardingBannerDismissed === false && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200/70 bg-amber-50/50 px-3 py-2 text-sm text-slate-800">
          <p className="min-w-0 flex-1 leading-snug">
            <span className="text-slate-700">
              Complete your profile ({profileCompletion}% done) — it unlocks your
              full loop (resume polish → AI Interview Practice & coding mocks → interviews &
              offers) —{" "}
            </span>
            <Link
              href="/dashboard/profile"
              className="font-medium text-primary underline-offset-2 hover:underline"
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
        <DashboardStatCard
          theme="purple"
          label="Total Interviews"
          value={stats.totalInterviews}
          icon={FileText}
          hint={
            <>
              <Clock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>All time</span>
            </>
          }
        />
        <DashboardStatCard
          theme="emerald"
          label="Average Score"
          value={stats.averageScore}
          icon={Target}
          progress={stats.averageScore}
          hint={
            <>
              <Percent className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>Out of 100</span>
            </>
          }
        />
        <DashboardStatCard
          theme="cyan"
          label="Completed"
          value={stats.completedInterviews}
          icon={Award}
          hint={
            <>
              <CheckCircle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>Finished interviews</span>
            </>
          }
        />
        <DashboardStatCard
          theme="amber"
          label="Improvement"
          value={
            stats.improvement !== undefined && !isNaN(stats.improvement) ? (
              <>
                {stats.improvement > 0 ? "+" : ""}
                {stats.improvement}%
              </>
            ) : (
              "0%"
            )
          }
          icon={TrendingUp}
          hint={
            <>
              <TrendingUp className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>Last 3 sessions</span>
            </>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-xl border border-border/80 bg-card shadow-card xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-900">
              Daily interviews and score trend
            </CardTitle>
            <CardDescription>
              Bars = daily sessions, line = average score.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  yAxisId="left"
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                />
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
                  fill="#7367F0"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgScore"
                  name="Average score"
                  stroke="#28c76f"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border/80 bg-card shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-foreground">Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DashboardInsightTile
              theme="purple"
              label="Total token spend"
              value={totalTokensSpent}
              description="Proxy for billed AI Interview Practice & coding credits"
            />
            <DashboardInsightTile
              theme="emerald"
              label="Active days"
              value={`${activeDays}/14`}
              description="Consistency beats cramming—practice counts the same"
            />
            <DashboardInsightTile
              theme="amber"
              label="Completed ratio"
              value={
                stats.totalInterviews > 0
                  ? `${Math.round(
                      (stats.completedInterviews / stats.totalInterviews) * 100,
                    )}%`
                  : "0%"
              }
              description="Finishing sessions earns full AI discussion feedback & scores"
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Interviews */}
      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Recent Interviews
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                Your latest practice sessions with scores and reports.
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
                <Button className={institutePrimaryClass}>
                  <Plus className="mr-2 h-4 w-4" /> Start Interview
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <RecentInterviewsList
            interviews={interviews}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onVideoUnavailable={() => setVideoUnavailableOpen(true)}
          />
        </CardContent>
      </Card>

      {/* Resume quick stats */}
      {resumes.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2">
          <DashboardStatCard
            theme="emerald"
            label="Total resumes"
            value={resumes.length}
            icon={FileEdit}
            hint={
              <>
                <FileText className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>In builder</span>
              </>
            }
          />
          <DashboardStatCard
            theme="violet"
            label="Average ATS"
            value={resumesWithAts.length > 0 ? `${avgAts}/100` : "—"}
            icon={FileCheck}
            progress={resumesWithAts.length > 0 ? avgAts : undefined}
            hint={
              <>
                <Percent className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>
                  {resumesWithAts.length > 0
                    ? `${resumesWithAts.length} scored`
                    : "No ATS run yet"}
                </span>
              </>
            }
          />
        </div>
      )}

      {/* Your resumes */}
      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Your resumes
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                Build and refine resumes with ATS scoring before you apply.
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
                <Button className={institutePrimaryClass}>
                  <Plus className="mr-2 h-4 w-4" /> New resume
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DashboardResumesList
            resumes={resumes}
            currentPage={resumePage}
            itemsPerPage={resumeItemsPerPage}
            onPageChange={setResumePage}
            onDownload={handleResumeDownload}
            downloadingResumeId={downloadingResumeId}
          />
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
