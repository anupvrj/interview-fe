"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  ChevronLeft,
  ChevronRight,
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
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Interview, interviewApi, interviewScheduleApi } from "@/lib/api";
import {
  cn,
  formatDate,
  getInterviewCreditsUsed,
  getScoreColor,
  scheduledInterviewCanStartNow,
  sumInterviewCreditsUsed,
} from "@/lib/utils";
import {
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import { Progress } from "@/components/ui/progress";

const ITEMS_PER_PAGE = 10;

/** session.duration from API is seconds; whole minutes (ceil, min 1 when > 0). */
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

  // Pagination logic
  const totalPages = Math.ceil(interviews.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentInterviews = interviews.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[rgb(37,99,235)] mx-auto mb-4" />
          <p className="text-gray-600">Loading your interviews...</p>
        </div>
      </div>
    );
  }

  const completedCount = interviews.filter(
    (i) => i.status === "completed"
  ).length;
  const scoredInterviews = interviews.filter((i) => i.report?.overallScore);
  const averageScore =
    scoredInterviews.length > 0
      ? scoredInterviews.reduce(
          (sum, i) => sum + (i.report?.overallScore || 0),
          0
        ) / scoredInterviews.length
      : 0;
  const totalCreditsUsed = sumInterviewCreditsUsed(interviews);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Hero Section - Similar to Resumes Page */}
      <section className="pt-4 sm:pt-6 pb-8 sm:pb-12 md:pb-16 px-4 sm:px-6 overflow-hidden bg-blue-50 relative rounded-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
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
              <Mic className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400" />
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
              <Brain className="w-10 h-10 sm:w-14 sm:h-14 text-blue-300" />
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
              <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 text-indigo-300" />
            </div>
          ))}
        </div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Left Side - Marketing Content */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-700 font-medium text-sm mb-4">
                <Sparkles className="w-3 h-3" />
                <span>AI Interview Practice</span>
              </div>
              <h1 className="mb-4 text-2xl font-bold leading-[1.25] tracking-tight text-slate-900 sm:mb-6 sm:text-3xl sm:leading-[1.15] md:text-4xl lg:text-[34px] lg:leading-[42px]">
                <span className="text-slate-900">Company-aware prep,</span>{" "}
                <span className="text-[rgb(37,99,235)]">multilingual AI practice,</span>{" "}
                <span className="text-slate-900">and interview-ready</span>{" "}
                <span className="text-[rgb(37,99,235)]">reports</span>
              </h1>
              
              {/* Features List */}
              <div className="space-y-3 pt-4 sm:pt-6 px-2 sm:px-0">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[rgb(37,99,235)] flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-700 sm:text-sm">
                    Stack rank stories for the hiring company & round—prompts tighten like a real recruiter screen.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[rgb(37,99,235)] flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-700 sm:text-sm">
                    Rehearse out loud in the language you need; finish with structured scores plus discussion notes you can act on immediately.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[rgb(37,99,235)] flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-700 sm:text-sm">
                    Want engineer signal or a timed build? Continue in{" "}
                    <Link
                      href="/dashboard/peer-interviews"
                      className="font-semibold text-[rgb(37,99,235)] underline-offset-2 hover:underline"
                    >
                      Peer interviews
                    </Link>{" "}
                    or the{" "}
                    <Link
                      href="/dashboard/coding-interviews"
                      className="font-semibold text-[rgb(37,99,235)] underline-offset-2 hover:underline"
                    >
                      coding round
                    </Link>{" "}
                    Practice area.
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 px-2 sm:px-0">
                <Link href="/dashboard/interviews/new" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto !bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white font-semibold text-sm sm:text-base px-5 sm:px-6 py-4 sm:py-5 h-auto shadow-lg hover:shadow-xl transition-all"
                  >
                    Start New Interview
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-600">4.9/5</span>
                </div>
              </div>
            </div>

            {/* Right Section - Interview Preview */}
            <div className="relative flex justify-center lg:justify-start">
              <div className="relative rounded-lg sm:rounded-xl shadow-2xl overflow-hidden bg-white w-full max-w-[600px] sm:max-w-[700px] border-2 sm:border-4 border-blue-100">
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
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white text-green-600 rounded-full flex items-center justify-center font-bold text-[9px] sm:text-[10px] animate-pulse">
                    AI
                  </div>
                  <div className="text-[9px] sm:text-[10px] leading-tight hidden xs:block">
                    <div className="font-semibold">Live</div>
                    <div className="text-green-100 text-[8px] sm:text-[9px]">Interview</div>
                  </div>
                </div>
                <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-blue-700 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shadow-lg text-[9px] sm:text-[10px] font-semibold animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                  <span className="hidden sm:inline">Real-time Feedback</span>
                  <span className="sm:hidden">Feedback</span>
                </div>
                <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2">
                  <Button
                    size="sm"
                    className="bg-blue-700 hover:bg-blue-800 text-white shadow-lg h-6 sm:h-7 px-1.5 sm:px-2 text-[9px] sm:text-[10px] animate-bounce" 
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

      {/* Quick Stats */}
      {interviews.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2 xl:grid-cols-4">
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
                  {interviews.length}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-600 sm:text-sm">
                <Clock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>All time</span>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 items-start gap-3 rounded-md border border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 shadow-lg shadow-blue-500/10 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50 sm:h-12 sm:w-12">
              <Target className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs font-bold leading-tight text-[rgb(37,99,235)] sm:text-sm">
                  Average Score
                </p>
                <p
                  className={cn(
                    "shrink-0 text-right text-lg font-bold tabular-nums leading-none sm:text-xl lg:text-2xl",
                    averageScore > 0
                      ? getScoreColor(averageScore)
                      : "text-slate-900",
                  )}
                >
                  {Math.round(averageScore)}/100
                </p>
              </div>
              <Progress
                value={averageScore}
                className="h-2 w-full overflow-hidden rounded-full border border-blue-300/90 bg-blue-100/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] sm:h-2.5"
              />
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-600 sm:text-sm">
                <Percent className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>Out of 100</span>
              </div>
            </div>
          </div>

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
                  {completedCount}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-600 sm:text-sm">
                <CheckCircle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>Finished interviews</span>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 items-start gap-3 rounded-md border border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 shadow-lg shadow-blue-500/10 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 sm:col-span-2 sm:gap-4 sm:p-5 xl:col-span-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50 sm:h-12 sm:w-12">
              <Coins className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs font-bold leading-tight text-[rgb(37,99,235)] sm:text-sm">
                  Credits used
                </p>
                <p className="shrink-0 text-right text-lg font-bold tabular-nums leading-none text-slate-900 sm:text-xl lg:text-2xl">
                  {totalCreditsUsed}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-600 sm:text-sm">
                <Coins className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>From billed sessions</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List tabs + header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
              {listTab === "history" ? "Interview history" : "Scheduled interviews"}
            </h2>
            <p className="text-gray-600 mt-1">
              {listTab === "history"
                ? interviews.length === 0
                  ? "Spin up AI Interview Practice tailored to role + company to populate this history tab."
                  : (() => {
                      const plural = interviews.length === 1 ? "" : "s";
                      return `Showing ${startIndex + 1}-${Math.min(
                        endIndex,
                        interviews.length
                      )} of ${interviews.length} interview${plural}`;
                    })()
                : scheduled.length === 0
                  ? "When your institution schedules an interview, it will appear here"
                  : "Set by your institution — start from 24 hours before the scheduled slot until the expire deadline (if any). Saved resume required."}
            </p>
          </div>
          <Link href="/dashboard/interviews/new">
            <Button
              size="lg"
              className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Start New Interview
            </Button>
          </Link>
        </div>

        <div
          role="tablist"
          aria-label="Interview list sections"
          className="flex flex-wrap gap-2 border-b border-slate-200 pb-3"
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
                ? "bg-[rgb(37,99,235)] text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            <FileText className="h-4 w-4 shrink-0" />
            All interviews
            {interviews.length > 0 ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold",
                  listTab === "history" ? "bg-white/20 text-white" : "bg-white text-slate-700"
                )}
              >
                {interviews.length}
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
                ? "bg-amber-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            <CalendarClock className="h-4 w-4 shrink-0" />
            Scheduled
            {scheduled.length > 0 ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold",
                  listTab === "scheduled" ? "bg-white/20 text-white" : "bg-white text-slate-700"
                )}
              >
                {scheduled.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Interviews List — history tab */}
      {listTab === "history" ? (
        <Card className="rounded-md border border-border bg-card shadow-sm">
          <CardContent className="pb-6 pt-6">
            {interviews.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-md bg-gradient-to-br from-blue-100 to-blue-200 shadow-lg">
                  <FileText className="h-10 w-10 text-[rgb(37,99,235)]" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">
                  No interviews yet
                </h3>
                <p className="mx-auto mb-8 max-w-md text-gray-600">
                  Run multilingual AI Interview Practice, lock in company context, and
                  review the AI discussion report—then layer{" "}
                  <Link
                    href="/dashboard/peer-interviews"
                    className="font-medium text-[rgb(37,99,235)] underline-offset-2 hover:underline"
                  >
                    peer feedback
                  </Link>{" "}
                  or a{" "}
                  <Link
                    href="/dashboard/coding-interviews"
                    className="font-medium text-[rgb(37,99,235)] underline-offset-2 hover:underline"
                  >
                    coding mock
                  </Link>{" "}
                  when you need the full loop.
                </p>
                <Link href="/dashboard/interviews/new">
                  <Button
                    size="lg"
                    className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-lg transition-all hover:shadow-xl"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Start Your First Interview
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-100">
                  {currentInterviews.map((interview) => {
                    const durationLabel = formatInterviewDurationMinutes(
                      interview.session?.duration,
                    );
                    const creditsUsed = getInterviewCreditsUsed(interview);
                    return (
                      <div
                        key={interview._id}
                        className="group flex min-w-0 flex-nowrap items-center justify-between gap-3 py-2.5 transition-colors first:pt-0 last:pb-0 hover:bg-slate-50/80"
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
                            {interview.metadata.targetCompany ? (
                              <>
                                <span className="text-slate-300">·</span>
                                <span>{interview.metadata.targetCompany}</span>
                              </>
                            ) : null}
                            {interview.metadata.experience > 0 ? (
                              <>
                                <span className="text-slate-300">·</span>
                                <span className="tabular-nums">
                                  {interview.metadata.experience} yrs
                                </span>
                              </>
                            ) : null}
                            {durationLabel ? (
                              <>
                                <span className="text-slate-300">·</span>
                                <span className="tabular-nums text-slate-600">
                                  {durationLabel}
                                </span>
                              </>
                            ) : null}
                            {creditsUsed != null ? (
                              <>
                                <span className="text-slate-300">·</span>
                                <span className="tabular-nums text-slate-600">
                                  {creditsUsed} credits
                                </span>
                              </>
                            ) : null}
                            {interview.report ? (
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
                            ) : null}
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
                              {interview.report ? (
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
                              ) : (
                                <Link
                                  href={`/dashboard/interviews/${interview.interviewId}/report`}
                                  className={cn(
                                    buttonVariants({ variant: "default" }),
                                    institutePrimaryClass,
                                    "h-8 shrink-0 gap-1.5 px-2.5 py-0 text-xs leading-none no-underline",
                                  )}
                                >
                                  <Sparkles className="size-3.5 shrink-0" />
                                  Generate report
                                </Link>
                              )}
                            </>
                          )}
                          {interview.status === "failed" && (
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
                                  buttonVariants({ variant: "default" }),
                                  institutePrimaryClass,
                                  "h-8 shrink-0 gap-1.5 px-2.5 py-0 text-xs leading-none no-underline",
                                )}
                              >
                                <Sparkles className="size-3.5 shrink-0" />
                                Generate report
                              </Link>
                            </>
                          )}
                          {interview.status === "processing" && (
                            <Link
                              href={`/dashboard/interviews/${interview.interviewId}/processing`}
                              className={cn(
                                buttonVariants({ variant: "outline" }),
                                instituteSecondaryClass,
                                "h-8 shrink-0 gap-1.5 px-2.5 py-0 text-xs leading-none no-underline",
                              )}
                            >
                              <Clock className="size-3.5 shrink-0" />
                              Processing
                            </Link>
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
                          {interview.status === "active" && (
                            <Link
                              href={`/interview/${interview.interviewId}/realtime`}
                              className={cn(
                                buttonVariants({ variant: "default" }),
                                institutePrimaryClass,
                                "h-8 shrink-0 gap-1 px-3 py-0 text-xs leading-none no-underline",
                              )}
                            >
                              <PlayCircle className="size-3.5 shrink-0" />
                              Continue
                            </Link>
                          )}
                          {interview.status !== "completed" &&
                            interview.status !== "processing" &&
                            interview.status !== "draft" &&
                            interview.status !== "active" &&
                            interview.status !== "failed" && (
                              <Link
                                href={`/interview/${interview.interviewId}/realtime`}
                                className={cn(
                                  buttonVariants({ variant: "default" }),
                                  institutePrimaryClass,
                                  "h-8 shrink-0 gap-1 px-3 py-0 text-xs leading-none no-underline",
                                )}
                              >
                                <PlayCircle className="size-3.5 shrink-0" />
                                Continue
                              </Link>
                            )}
                          {(interview.status === "draft" ||
                            interview.status === "active") && (
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                instituteSecondaryClass,
                                "size-8 shrink-0 border-red-200 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 [&_svg]:size-3.5",
                              )}
                              title="Delete interview"
                              aria-label="Delete interview"
                              onClick={() =>
                                setDeleteConfirmId(interview.interviewId)
                              }
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="border-blue-300 text-[rgb(37,99,235)] transition-all hover:!border-[rgb(17,24,39)] hover:!bg-[rgb(17,24,39)] hover:!text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Previous
                      </Button>

                      <div className="flex flex-wrap items-center gap-1">
                        {getPageNumbers().map((pageNum) => (
                          <Button
                            key={pageNum}
                            variant={
                              currentPage === pageNum ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className={
                              currentPage === pageNum
                                ? "!bg-[rgb(37,99,235)] border-0 text-white hover:!bg-[rgb(17,24,39)]"
                                : "border-blue-300 text-[rgb(37,99,235)] transition-all hover:!border-[rgb(17,24,39)] hover:!bg-[rgb(17,24,39)] hover:!text-white"
                            }
                          >
                            {pageNum}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
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
      ) : (
        /* Scheduled tab */
        <div className="space-y-3">
          {scheduled.length === 0 ? (
            <Card className="border-2 border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-white shadow-lg">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
                  <CalendarClock className="h-8 w-8 text-amber-700" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">
                  No scheduled interviews
                </h3>
                <p className="mx-auto max-w-md text-gray-600">
                  When your school schedules AI Interview Practice, the role, window, and
                  start button land here—same AI scoring flow you use for
                  self-serve practice.
                </p>
              </CardContent>
            </Card>
          ) : (
            scheduled.map((s) => {
              const { canStart, reason } = scheduledInterviewCanStartNow(
                s.scheduledAt,
                s.expiresAt
              );
              const startDisabled =
                startingScheduleId === String(s._id) || !canStart;
              return (
              <div
                key={s._id}
                className="flex flex-col gap-3 rounded-xl border-2 border-amber-200/70 bg-gradient-to-br from-amber-50/90 to-white p-4 shadow-lg shadow-amber-900/5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-slate-900">{s.role}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(s.scheduledAt).toLocaleString()}
                    </span>
                    {s.targetCompany ? (
                      <>
                        <span className="text-slate-400">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {s.targetCompany}
                        </span>
                      </>
                    ) : null}
                    {s.experience != null && s.experience > 0 ? (
                      <>
                        <span className="text-slate-400">·</span>
                        <span>
                          {s.experience} yrs experience
                        </span>
                      </>
                    ) : null}
                    <span className="text-slate-400">·</span>
                    <span>{s.language === "hi" ? "Hindi" : "English"}</span>
                    {s.interviewDuration ? (
                      <>
                        <span className="text-slate-400">·</span>
                        <span>{s.interviewDuration} min</span>
                      </>
                    ) : null}
                  </p>
                  {s.expiresAt ? (
                    <p className="mt-2 text-sm font-medium text-amber-900">
                      Start by {new Date(s.expiresAt).toLocaleString()}
                    </p>
                  ) : null}
                  {s.notes ? (
                    <p className="mt-2 text-sm text-slate-500">{s.notes}</p>
                  ) : null}
                  {!canStart && reason === "too_early" ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Opens{" "}
                      {new Date(
                        new Date(s.scheduledAt).getTime() - 24 * 60 * 60 * 1000
                      ).toLocaleString()}
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
            })
          )}
        </div>
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
    </div>
  );
}
