"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  PlayCircle,
  Clock,
  CheckCircle,
  Loader2,
  Plus,
  TrendingUp,
  Building2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Star,
  Mic,
  Brain,
  MessageSquare,
  Sparkles,
  CalendarClock,
} from "lucide-react";
import { Interview, interviewApi, interviewScheduleApi } from "@/lib/api";
import {
  cn,
  formatDate,
  getScoreColor,
  scheduledInterviewCanStartNow,
} from "@/lib/utils";

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
      completed: "bg-blue-100 text-[rgb(37,99,235)] border-blue-200",
      processing: "bg-blue-100 text-[rgb(37,99,235)] border-blue-200",
      active: "bg-yellow-100 text-yellow-700 border-yellow-200",
      draft: "bg-gray-100 text-gray-700 border-gray-200",
      failed: "bg-red-100 text-red-700 border-red-200",
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "processing":
        return Clock;
      case "active":
        return PlayCircle;
      default:
        return FileText;
    }
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
                <span>AI-Powered Interviews</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[43px] font-bold tracking-tight text-slate-900 leading-[1.2] sm:leading-[1.1] lg:leading-[52px] mb-4 sm:mb-6">
                <span className="text-slate-900">Ace Your Next</span>{" "}
                <span className="text-[rgb(37,99,235)]">Interview</span>{" "}
                <span className="text-slate-900">Before the Real One</span>{" "}
                <span className="text-[rgb(37,99,235)]">Happens</span>
              </h1>
              
              {/* Features List */}
              <div className="space-y-3 pt-4 sm:pt-6 px-2 sm:px-0">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[rgb(37,99,235)] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">Real-time AI feedback and scoring</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[rgb(37,99,235)] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">Personalized questions based on your role</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[rgb(37,99,235)] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">Detailed performance analysis and improvement tips</span>
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
                  alt="Mock Interview Interface - AI-Powered Interview Platform"
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                {interviews.length}
              </h3>
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
                {completedCount}
              </h3>
            </div>
          </div>

          {/* Average Score */}
          {averageScore > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mb-2">
                <p className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">Average Score</p>
                <h3
                  className={`text-3xl lg:text-4xl font-bold ${getScoreColor(
                    averageScore
                  )}`}
                >
                  {Math.round(averageScore)}%
                </h3>
              </div>
            </div>
          )}
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
                  ? "Start your first interview to see it here"
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
      {listTab === "history" && interviews.length === 0 ? (
        <Card className="border-2 border-blue-200/50 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardContent className="pt-16 pb-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FileText className="w-12 h-12 text-[rgb(37,99,235)]" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              No interviews yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              Start your first mock interview to get personalized feedback and
              improve your interview skills
            </p>
            <Link href="/dashboard/interviews/new">
              <Button
                size="lg"
                className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start Your First Interview
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : listTab === "history" ? (
        <>
          <div className="space-y-3">
            {currentInterviews.map((interview) => {
              const StatusIcon = getStatusIcon(interview.status);
              return (
                <div
                  key={interview._id}
                  className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-sm cursor-pointer group"
                  onClick={() => {
                    if (interview.status === "completed") {
                      router.push(
                        `/dashboard/interviews/${interview.interviewId}/report`
                      );
                    } else if (interview.status === "processing") {
                      router.push(
                        `/dashboard/interviews/${interview.interviewId}/processing`
                      );
                    } else {
                      router.push(
                        `/interview/${interview.interviewId}/realtime`
                      );
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Interview Icon Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
                      <StatusIcon className="w-6 h-6 text-white" />
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
                            {interview.metadata.targetCompany && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {interview.metadata.targetCompany}
                                </span>
                              </>
                            )}
                            {interview.metadata.experience > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Briefcase className="w-3 h-3" />
                                  {interview.metadata.experience} years exp
                                </span>
                              </>
                            )}
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
                                onClick={async (e) => {
                                  e.stopPropagation();
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
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-300 text-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] hover:!text-white hover:border-[rgb(17,24,39)] transition-all"
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                View Report
                              </Button>
                            </Link>
                          </>
                        )}
                        {interview.status === "processing" && (
                          <Link
                            href={`/dashboard/interviews/${interview.interviewId}/processing`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-blue-300 text-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] hover:!text-white hover:border-[rgb(17,24,39)] transition-all"
                            >
                              <Clock className="w-3.5 h-3.5 mr-1.5" />
                              Processing
                            </Button>
                          </Link>
                        )}
                        {interview.status !== "completed" &&
                          interview.status !== "processing" && (
                            <Link
                              href={`/interview/${interview.interviewId}/realtime`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                size="sm"
                                className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-md transition-all"
                              >
                                <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                                Continue
                              </Button>
                            </Link>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="border-blue-300 text-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] hover:!text-white hover:border-[rgb(17,24,39)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                      className={
                        currentPage === pageNum
                          ? "!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white border-0"
                          : "border-blue-300 text-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] hover:!text-white hover:border-[rgb(17,24,39)] transition-all"
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
                  className="border-blue-300 text-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] hover:!text-white hover:border-[rgb(17,24,39)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
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
                  Your institution can schedule a session for you. You will see the role, time,
                  and a button to start here when one is assigned.
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
    </div>
  );
}
