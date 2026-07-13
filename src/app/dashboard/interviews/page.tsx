"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
  FileText,
  PlayCircle,
  Clock,
  CheckCircle,
  Loader2,
  Plus,
  Award,
  Building2,
  ArrowRight,
  Star,
  Mic,
  Brain,
  MessageSquare,
  Sparkles,
  CalendarClock,
  Target,
  Percent,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import { Interview, interviewApi, interviewScheduleApi } from "@/lib/api";
import {
  cn,
  scheduledInterviewCanStartNow,
  sumInterviewCreditsUsed,
} from "@/lib/utils";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";
import { appHeroBullet, appHeroCaption } from "@/lib/app-theme";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { RecentInterviewsList } from "@/components/dashboard/RecentInterviewsList";
import { filterInterviewsByType } from "@/lib/interview-kind";
import { PracticeSessionGateDialogs } from "@/components/upsell/PracticeSessionGateDialogs";
import { PracticeLockedGate } from "@/components/upsell/PracticeLockedGate";
import { usePracticeSessionGate } from "@/components/upsell/usePracticeSessionGate";

const ITEMS_PER_PAGE = 10;

export default function InterviewsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [listTab, setListTab] = useState<"history" | "scheduled">("history");
  const [startingScheduleId, setStartingScheduleId] = useState<string | null>(null);
  const [videoUnavailableOpen, setVideoUnavailableOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const {
    startPracticeSession,
    checkingSubscription,
    canUse,
    showTrialUpsell,
    entitlementsLoading,
    ...practiceGate
  } = usePracticeSessionGate();

  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      loadInterviews();
    }
  }, [isLoaded, user]);

  const loadInterviews = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [data, schedules] = await Promise.all([
        interviewApi.list(user.id),
        interviewScheduleApi.listMine().catch(() => [] as any[]),
      ]);
      setInterviews(data);
      setScheduled(Array.isArray(schedules) ? schedules : []);
    } catch (error) {
      console.error("Error loading interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeleteInterview = async () => {
    if (!deleteConfirmId) return;
    setDeleteBusy(true);
    try {
      await interviewApi.deleteDraftOrActive(deleteConfirmId);
      toast.success("Interview deleted");
      setDeleteConfirmId(null);
      await loadInterviews();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not delete interview";
      toast.error(msg);
    } finally {
      setDeleteBusy(false);
    }
  };

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#7367F0]" />
          <p className="text-muted-foreground">Loading your interviews...</p>
        </div>
      </div>
    );
  }

  const screeningInterviews = filterInterviewsByType(interviews, "screening");

  const completedCount = screeningInterviews.filter(
    (i) => i.status === "completed",
  ).length;
  const scoredInterviews = screeningInterviews.filter((i) => i.report?.overallScore);
  const averageScore =
    scoredInterviews.length > 0
      ? scoredInterviews.reduce(
          (sum, i) => sum + (i.report?.overallScore || 0),
          0,
        ) / scoredInterviews.length
      : 0;
  const totalCreditsUsed = sumInterviewCreditsUsed(screeningInterviews);
  const aiPracticeLocked =
    !entitlementsLoading && !canUse("aiMockInterview");

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Hero Section - Similar to Resumes Page */}
      <section className="relative overflow-hidden rounded-xl bg-[#7367F0]/[0.04] px-4 pb-8 pt-4 sm:px-6 sm:pb-12 sm:pt-6 md:pb-16">
        {/* Animated Background Elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${(i * 15) % 100}%`,
                top: `${(i * 20) % 100}%`,
                opacity: 0.09,
                animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              <Mic className="h-12 w-12 text-[#7367F0]/40 sm:h-16 sm:w-16" />
            </div>
          ))}
          {[...Array(8)].map((_, i) => (
            <div
              key={`brain-${i}`}
              className="absolute"
              style={{
                left: `${(i * 16) % 100}%`,
                top: `${(i * 22) % 100}%`,
                opacity: 0.07,
                animation: `float-${i % 3} ${7 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              <Brain className="h-10 w-10 text-[#7367F0]/30 sm:h-14 sm:w-14" />
            </div>
          ))}
          {[...Array(6)].map((_, i) => (
            <div
              key={`message-${i}`}
              className="absolute"
              style={{
                left: `${(i * 20) % 100}%`,
                top: `${(i * 15) % 100}%`,
                opacity: 0.06,
                animation: `float-${i % 3} ${8 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.7}s`,
              }}
            >
              <MessageSquare className="h-8 w-8 text-violet-300/60 sm:h-12 sm:w-12" />
            </div>
          ))}
        </div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Left Side - Marketing Content */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 text-center lg:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#7367F0]/10 px-3 py-1 text-sm font-medium text-[#7367F0]">
                <Sparkles className="h-3 w-3" />
                <span>AI Interview Practice</span>
              </div>
              <h1 className="mb-4 text-2xl font-bold leading-[1.25] tracking-tight text-foreground sm:mb-6 sm:text-3xl sm:leading-[1.15] md:text-4xl lg:text-[34px] lg:leading-[42px]">
                <span className="text-foreground">Company-aware prep,</span>{" "}
                <span className="text-[#7367F0]">multilingual AI practice,</span>{" "}
                <span className="text-foreground">and interview-ready</span>{" "}
                <span className="text-[#7367F0]">reports</span>
              </h1>
              
              {/* Features List */}
              <div className="space-y-3 pt-4 sm:pt-6 px-2 sm:px-0">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7367F0]" />
                  <span className={appHeroBullet}>
                    Company- and round-specific prompts—just like a real recruiter screen.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7367F0]" />
                  <span className={appHeroBullet}>
                    Practice out loud in your language—scores and discussion notes you can act on fast.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7367F0]" />
                  <span className={appHeroBullet}>
                    Need peer or coding rounds? Continue in{" "}
                    <Link
                      href="/dashboard/peer-interviews"
                      className="font-semibold text-[#7367F0] underline-offset-2 hover:underline"
                    >
                      Peer interviews
                    </Link>{" "}
                    or the{" "}
                    <Link
                      href="/dashboard/coding-interviews"
                      className="font-semibold text-[#7367F0] underline-offset-2 hover:underline"
                    >
                      coding round
                    </Link>
                    .
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 px-2 sm:px-0">
                <Button
                  type="button"
                  size="lg"
                  disabled={checkingSubscription}
                  onClick={() =>
                    startPracticeSession("ai", {
                      path: "/dashboard/interviews/new",
                    })
                  }
                  className={cn(
                    institutePrimaryClass,
                    "h-auto w-full px-5 py-4 text-sm font-semibold shadow-lg transition-all hover:shadow-xl sm:w-auto sm:px-6 sm:py-5 sm:text-base",
                  )}
                >
                  {checkingSubscription ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Start New Interview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className={appHeroCaption}>4.9/5</span>
                </div>
              </div>
            </div>

            {/* Right Section - Interview Preview */}
            <div className="relative flex justify-center lg:justify-start">
              <div className="relative w-full max-w-[600px] overflow-hidden rounded-xl border border-[#7367F0]/15 bg-card shadow-lg sm:max-w-[700px]">
                <Image
                  src="/mock-interview-previewiew.png"
                  alt="AI Interview Practice interface"
                  width={700}
                  height={560}
                  className="w-full h-auto object-contain"
                  priority
                />
                {/* Overlay Badges */}
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-green-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shadow-lg flex items-center gap-1 sm:gap-1.5 animate-bounce" style={{ animationDuration: '2s' }}>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-card text-green-600 rounded-full flex items-center justify-center font-bold text-[9px] sm:text-[10px] animate-pulse">
                    AI
                  </div>
                  <div className="text-[9px] sm:text-[10px] leading-tight hidden xs:block">
                    <div className="font-semibold">Live</div>
                    <div className="text-green-100 text-[8px] sm:text-[9px]">Interview</div>
                  </div>
                </div>
                <div className="absolute left-1.5 top-1.5 rounded-md bg-[#7367F0] px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-lg animate-pulse sm:left-2 sm:top-2 sm:px-2 sm:py-1 sm:text-[10px]" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                  <span className="hidden sm:inline">Real-time Feedback</span>
                  <span className="sm:hidden">Feedback</span>
                </div>
                <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2">
                  <Button
                    size="sm"
                    className={cn(
                      institutePrimaryClass,
                      "h-6 animate-bounce px-1.5 text-[9px] shadow-lg sm:h-7 sm:px-2 sm:text-[10px]",
                    )}
                    style={{ animationDuration: '2.2s', animationDelay: '1s' }}
                  >
                    <Mic className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Start Answer</span>
                    <span className="sm:hidden">Start</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {aiPracticeLocked ? (
        <PracticeLockedGate type="ai" showTrialUpsell={showTrialUpsell} />
      ) : (
        <>
      {/* Quick Stats — screening round counts (table below is screening-only) */}
      {interviews.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            theme="emerald"
            label="Total Interviews"
            value={screeningInterviews.length}
            icon={FileText}
            hint={
              <>
                <Clock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>Screening sessions</span>
              </>
            }
          />
          <DashboardStatCard
            theme="violet"
            label="Average Score"
            value={
              scoredInterviews.length > 0
                ? `${Math.round(averageScore)}/100`
                : "0/100"
            }
            icon={Target}
            progress={
              scoredInterviews.length > 0 ? Math.round(averageScore) : 0
            }
            hint={
              <>
                <Percent className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>Out of 100</span>
              </>
            }
          />
          <DashboardStatCard
            theme="sky"
            label="Completed"
            value={completedCount}
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
            label="Credits used"
            value={totalCreditsUsed}
            icon={Coins}
            hint={
              <>
                <Coins className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>From billed sessions</span>
              </>
            }
          />
        </div>
      )}

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                {listTab === "history"
                  ? "Interview history"
                  : "Scheduled interviews"}
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {listTab === "history"
                  ? screeningInterviews.length === 0
                    ? "Spin up AI Interview Practice tailored to role + company to populate this history tab."
                    : `${screeningInterviews.length} screening interview${screeningInterviews.length === 1 ? "" : "s"} in your history`
                  : scheduled.length === 0
                    ? "When your institution schedules an interview, it will appear here."
                    : "Start from 24 hours before the scheduled slot until the expire deadline. Saved resume required."}
              </CardDescription>
            </div>
            <Button
              type="button"
              disabled={checkingSubscription}
              onClick={() =>
                startPracticeSession("ai", {
                  path: "/dashboard/interviews/new",
                })
              }
              className={institutePrimaryClass}
            >
              {checkingSubscription ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Start New Interview
            </Button>
          </div>

          <div
            role="tablist"
            aria-label="Interview list sections"
            className="mt-4 flex flex-wrap gap-2"
          >
            <button
              type="button"
              role="tab"
              aria-selected={listTab === "history"}
              id="interviews-tab-history"
              onClick={() => {
                setListTab("history");
                setCurrentPage(1);
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                listTab === "history"
                  ? "bg-[#7367F0] text-white shadow-md"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted",
              )}
            >
              <FileText className="h-4 w-4 shrink-0" />
              Screening history
              {screeningInterviews.length > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold",
                    listTab === "history"
                      ? "bg-card/20 text-white"
                      : "bg-card text-foreground",
                  )}
                >
                  {screeningInterviews.length}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={listTab === "scheduled"}
              id="interviews-tab-scheduled"
              onClick={() => setListTab("scheduled")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                listTab === "scheduled"
                  ? "bg-[#7367F0] text-white shadow-md"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted",
              )}
            >
              <CalendarClock className="h-4 w-4 shrink-0" />
              Scheduled
              {scheduled.length > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold",
                    listTab === "scheduled"
                      ? "bg-card/20 text-white"
                      : "bg-card text-foreground",
                  )}
                >
                  {scheduled.length}
                </span>
              ) : null}
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {listTab === "history" ? (
            <RecentInterviewsList
              interviews={screeningInterviews}
              currentPage={currentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
              onVideoUnavailable={() => setVideoUnavailableOpen(true)}
              onDelete={setDeleteConfirmId}
              emptyDescription={
                <>
                  Run multilingual AI Interview Practice, lock in company context,
                  and review the AI discussion report—then layer{" "}
                  <Link
                    href="/dashboard/peer-interviews"
                    className="font-medium text-[#7367F0] underline-offset-2 hover:underline"
                  >
                    peer feedback
                  </Link>{" "}
                  or a{" "}
                  <Link
                    href="/dashboard/coding-interviews"
                    className="font-medium text-[#7367F0] underline-offset-2 hover:underline"
                  >
                    coding mock
                  </Link>{" "}
                  when you need the full loop.
                </>
              }
            />
          ) : scheduled.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-[#7367F0]/10">
                <CalendarClock className="h-8 w-8 text-[#7367F0]" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                No scheduled interviews
              </h3>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                When your school schedules AI Interview Practice, the role,
                window, and start button land here—same AI scoring flow you use
                for self-serve practice.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {scheduled.map((s) => {
                const { canStart, reason } = scheduledInterviewCanStartNow(
                  s.scheduledAt,
                  s.expiresAt,
                );
                const startDisabled =
                  startingScheduleId === String(s._id) || !canStart;
                return (
                  <div
                    key={s._id}
                    className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {s.role}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(s.scheduledAt).toLocaleString()}
                        </span>
                        {s.targetCompany ? (
                          <>
                            <span className="text-border">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {s.targetCompany}
                            </span>
                          </>
                        ) : null}
                        {s.experience != null && s.experience > 0 ? (
                          <>
                            <span className="text-border">·</span>
                            <span>{s.experience} yrs experience</span>
                          </>
                        ) : null}
                        <span className="text-border">·</span>
                        <span>{s.language === "hi" ? "Hindi" : "English"}</span>
                        {s.interviewDuration ? (
                          <>
                            <span className="text-border">·</span>
                            <span>{s.interviewDuration} min</span>
                          </>
                        ) : null}
                      </p>
                      {s.expiresAt ? (
                        <p className="mt-2 text-xs font-medium text-amber-700">
                          Start by {new Date(s.expiresAt).toLocaleString()}
                        </p>
                      ) : null}
                      {s.notes ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {s.notes}
                        </p>
                      ) : null}
                      {!canStart && reason === "too_early" ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Opens{" "}
                          {new Date(
                            new Date(s.scheduledAt).getTime() -
                              24 * 60 * 60 * 1000,
                          ).toLocaleString()}
                        </p>
                      ) : null}
                      {!canStart && reason === "expired" ? (
                        <p className="mt-1 text-xs text-rose-600">
                          Past expire deadline
                        </p>
                      ) : null}
                    </div>
                    <Button
                      className={cn(institutePrimaryClass, "shrink-0 gap-2")}
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
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}

      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this interview?</DialogTitle>
            <DialogDescription>
              This removes the session and any recording stored for it from our
              systems. You cannot undo this.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              disabled={deleteBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteBusy}
              onClick={() => void handleConfirmDeleteInterview()}
            >
              {deleteBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <PracticeSessionGateDialogs {...practiceGate} />
    </div>
  );
}
