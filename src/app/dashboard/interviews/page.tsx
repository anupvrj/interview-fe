"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import { Interview, interviewApi } from "@/lib/api";
import { formatDate, getScoreColor } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

export default function InterviewsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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
      const data = await interviewApi.list(user.id);
      setInterviews(data);
    } catch (error) {
      console.error("Error loading interviews:", error);
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
          <Loader2 className="w-12 h-12 animate-spin text-landing-blue-700 mx-auto mb-4" />
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
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-landing-blue-600 via-landing-blue-700 to-landing-blue-800 p-6 lg:p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Your Interviews</h1>
          </div>
          <p className="text-base lg:text-lg text-white/90 max-w-2xl">
            View and manage all your interview sessions. Track your progress and
            review detailed feedback.
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-transparent opacity-50"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* Quick Stats */}
      {interviews.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-2 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-4 lg:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Total Interviews
                  </p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {interviews.length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-4 lg:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Completed
                  </p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {completedCount}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {averageScore > 0 && (
            <Card className="border-2 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-4 lg:pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Average Score
                    </p>
                    <p
                      className={`text-2xl lg:text-3xl font-bold ${getScoreColor(
                        averageScore
                      )}`}
                    >
                      {Math.round(averageScore)}%
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
            Interview History
          </h2>
          <p className="text-gray-600 mt-1">
            {(() => {
              if (interviews.length === 0) {
                return "Start your first interview to see it here";
              }
              const plural = interviews.length === 1 ? "" : "s";
              return `Showing ${startIndex + 1}-${Math.min(
                endIndex,
                interviews.length
              )} of ${interviews.length} interview${plural}`;
            })()}
          </p>
        </div>
        <Link href="/dashboard/interviews/new">
          <Button
            size="lg"
            className="bg-gradient-to-r from-landing-blue-600 to-landing-blue-700 hover:from-landing-blue-800 hover:to-landing-blue-900 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start New Interview
          </Button>
        </Link>
      </div>

      {/* Interviews List */}
      {interviews.length === 0 ? (
        <Card className="border-2 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-16 pb-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-landing-blue-700" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No interviews yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              Start your first mock interview to get personalized feedback and
              improve your interview skills
            </p>
            <Link href="/dashboard/interviews/new">
              <Button
                size="lg"
                className="bg-gradient-to-r from-landing-blue-600 to-landing-blue-700 hover:from-landing-blue-800 hover:to-landing-blue-900 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start Your First Interview
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-2 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {currentInterviews.map((interview) => {
                  const StatusIcon = getStatusIcon(interview.status);
                  return (
                    <div
                      key={interview._id}
                      className="p-4 lg:p-6 hover:bg-landing-blue-50/50 transition-colors cursor-pointer group"
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
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        {/* Left Section - Main Info */}
                        <div className="flex items-start gap-3 lg:gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                            <StatusIcon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3 mb-2 flex-wrap">
                              <h3 className="text-base lg:text-lg font-bold text-gray-900">
                                {interview.metadata.role || "General Interview"}
                              </h3>
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                                  interview.status
                                )}`}
                              >
                                {interview.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {formatDate(interview.createdAt)}
                              </span>
                              {interview.metadata.targetCompany && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4" />
                                    {interview.metadata.targetCompany}
                                  </span>
                                </>
                              )}
                              {interview.metadata.experience > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1.5">
                                    <Briefcase className="w-4 h-4" />
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
                            </div>
                            {interview.report && (
                              <div className="flex items-center gap-4 mt-2">
                                <div>
                                  <span className="text-xs text-gray-500">
                                    Score:{" "}
                                  </span>
                                  <span
                                    className={`text-base font-bold ${getScoreColor(
                                      interview.report.overallScore
                                    )}`}
                                  >
                                    {interview.report.overallScore}%
                                  </span>
                                </div>
                                {interview.report.strengths &&
                                  interview.report.strengths.length > 0 && (
                                    <div className="hidden sm:block">
                                      <span className="text-xs text-gray-500">
                                        Strength:{" "}
                                      </span>
                                      <span className="text-xs font-medium text-gray-700">
                                        {interview.report.strengths[0]}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Section - Action Buttons */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                          {interview.status === "completed" && (
                            <>
                              {(interview.session?.videoUrl ||
                                interview.session?.s3VideoKey) && (
                                <Button
                                  variant="outline"
                                  size="default"
                                  className="border-blue-300 text-blue-700 hover:bg-blue-50 group-hover:border-blue-400 transition-all whitespace-nowrap"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      // Get presigned URL from backend
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
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  Play Video
                                </Button>
                              )}
                              <Link
                                href={`/dashboard/interviews/${interview.interviewId}/report`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="outline"
                                  size="default"
                                  className="border-purple-300 text-landing-blue-800 hover:bg-landing-blue-50 group-hover:border-purple-400 transition-all whitespace-nowrap"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
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
                                size="default"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 whitespace-nowrap"
                              >
                                <Clock className="w-4 h-4 mr-2" />
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
                                  size="default"
                                  className="bg-gradient-to-r from-landing-blue-600 to-landing-blue-700 hover:from-landing-blue-800 hover:to-landing-blue-900 text-white shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                                >
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  Continue
                                </Button>
                              </Link>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="border-gray-300"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="default"
                      onClick={() => goToPage(pageNum)}
                      className={
                        currentPage === pageNum
                          ? "bg-gradient-to-r from-landing-blue-600 to-landing-blue-700 hover:from-landing-blue-800 hover:to-landing-blue-900 text-white border-0"
                          : "border-gray-300"
                      }
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="default"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="border-gray-300"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
