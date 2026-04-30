"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
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
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Code2,
  Loader2,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Star,
  FileText,
  Clock,
  Target,
  Percent,
  Award,
  Coins,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Terminal,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { codingInterviewApi, interviewApi, Interview } from "@/lib/api";
import {
  cn,
  formatDate,
  getInterviewCreditsUsed,
  getScoreColor,
  sumInterviewCreditsUsed,
} from "@/lib/utils";
import {
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import { CodingRoundHeroPreview } from "@/components/coding-interviews/CodingRoundHeroPreview";

const ITEMS_PER_PAGE = 10;

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

export default function CodingInterviewsPage() {
  const { user, isLoaded } = useUser();
  const [rows, setRows] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [videoUnavailableOpen, setVideoUnavailableOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const refreshRows = async () => {
    try {
      const data = await codingInterviewApi.listMine();
      setRows(data);
    } catch {
      setRows([]);
    }
  };

  useEffect(() => {
    if (!isLoaded || !user) return;
    localStorage.setItem("clerk-user-id", user.id);
    codingInterviewApi
      .listMine()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [isLoaded, user]);

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleteBusy(true);
    try {
      await interviewApi.deleteDraftOrActive(deleteConfirmId);
      toast.success("Session deleted");
      setDeleteConfirmId(null);
      await refreshRows();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not delete session";
      toast.error(msg);
    } finally {
      setDeleteBusy(false);
    }
  };

  const totalPages = Math.ceil(rows.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentRows = rows.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }
    return pages;
  };

  const completedCount = useMemo(
    () => rows.filter((r) => r.status === "completed").length,
    [rows],
  );
  const scoredRows = useMemo(
    () => rows.filter((r) => r.report?.overallScore != null),
    [rows],
  );
  const averageScore =
    scoredRows.length > 0
      ? scoredRows.reduce(
          (sum, r) => sum + (r.report?.overallScore ?? 0),
          0,
        ) / scoredRows.length
      : 0;
  const totalCreditsUsed = sumInterviewCreditsUsed(rows);

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[rgb(37,99,235)]" />
          <p className="text-gray-600">Loading your coding sessions…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      {/* Hero — aligned with Practice Interview page */}
      <section className="relative overflow-hidden rounded-2xl bg-blue-50 px-4 pb-8 pt-4 sm:px-6 sm:pb-12 sm:pt-6 md:pb-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
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
              <Code2 className="h-12 w-12 text-blue-400 sm:h-16 sm:w-16" />
            </div>
          ))}
          {[...Array(8)].map((_, i) => (
            <div
              key={`term-${i}`}
              className="absolute"
              style={{
                left: `${(i * 16) % 100}%`,
                top: `${(i * 22) % 100}%`,
                opacity: 0.07,
                animation: `float-${i % 3} ${7 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              <Terminal className="h-10 w-10 text-indigo-300 sm:h-14 sm:w-14" />
            </div>
          ))}
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-4 text-center sm:space-y-5 md:space-y-6 lg:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                <Sparkles className="h-3 w-3" />
                <span>Practice coding rounds</span>
              </div>
              <h1 className="mb-4 text-2xl font-bold leading-[1.25] tracking-tight text-slate-900 sm:mb-6 sm:text-3xl sm:leading-[1.15] md:text-4xl lg:text-[34px] lg:leading-[42px]">
                <span className="text-slate-900">Code</span>{" "}
                <span className="text-[rgb(37,99,235)]">Interview-Style</span>{" "}
                <span className="text-slate-900">Problems</span>
                <br />
                <span className="text-slate-900">Then</span>{" "}
                <span className="text-[rgb(37,99,235)]">Discuss</span>{" "}
                <span className="text-slate-900">With AI</span>
              </h1>

              <div className="space-y-3 px-2 pt-4 sm:px-0 sm:pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[rgb(37,99,235)]" />
                  <span className="text-xs text-gray-700 sm:text-sm">
                    Three problems matched to your target company tier
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[rgb(37,99,235)]" />
                  <span className="text-xs text-gray-700 sm:text-sm">
                    Monaco editor, run tests, then AI Interview Practice discussion
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[rgb(37,99,235)]" />
                  <span className="text-xs text-gray-700 sm:text-sm">
                    Full report with coding + discussion scores
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-3 px-2 pt-2 sm:flex-row sm:gap-4 lg:justify-start">
                <Link href="/dashboard/coding-interviews/new" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="h-auto w-full px-5 py-4 text-sm font-semibold !bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] sm:w-auto sm:px-6 sm:py-5 sm:text-base"
                  >
                    Start new session
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 sm:h-4 sm:w-4"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-gray-600 sm:text-sm">
                    4.9/5
                  </span>
                </div>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <CodingRoundHeroPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Quick stats — same card style as interviews page */}
      {rows.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <div className="flex min-h-0 min-w-0 items-start gap-3 rounded-md border border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 shadow-lg shadow-blue-500/10 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50 sm:h-12 sm:w-12">
              <Code2 className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs font-bold leading-tight text-[rgb(37,99,235)] sm:text-sm">
                  Total sessions
                </p>
                <p className="shrink-0 text-right text-lg font-bold tabular-nums leading-none text-slate-900 sm:text-xl lg:text-2xl">
                  {rows.length}
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
                  Average score
                </p>
                <p
                  className={cn(
                    "shrink-0 text-right text-lg font-bold tabular-nums leading-none sm:text-xl lg:text-2xl",
                    averageScore > 0 ? getScoreColor(averageScore) : "text-slate-900",
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
                <span>Finished sessions</span>
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

      {/* List header */}
      <div className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 lg:text-2xl">
              Coding round history
            </h2>
            <p className="mt-1 text-gray-600">
              {rows.length === 0
                ? "Start a session to see it here"
                : (() => {
                    const plural = rows.length === 1 ? "" : "s";
                    return `Showing ${startIndex + 1}-${Math.min(endIndex, rows.length)} of ${rows.length} session${plural}`;
                  })()}
            </p>
          </div>
          <Link href="/dashboard/coding-interviews/new">
            <Button
              size="lg"
              className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-lg transition-all hover:shadow-xl"
            >
              <Plus className="mr-2 h-4 w-4" />
              Start new session
            </Button>
          </Link>
        </div>
      </div>

      <Card className="rounded-md border border-border bg-card shadow-sm">
        <CardContent className="pb-6 pt-6">
          {rows.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-md bg-gradient-to-br from-blue-100 to-blue-200 shadow-lg">
                <Code2 className="h-10 w-10 text-[rgb(37,99,235)]" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">
                No coding sessions yet
              </h3>
              <p className="mx-auto mb-8 max-w-md text-gray-600">
                Solve three problems in the editor, then discuss your approach with
                AI. Your report will include coding and discussion scores.
              </p>
              <Link href="/dashboard/coding-interviews/new">
                <Button
                  size="lg"
                  className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-lg transition-all hover:shadow-xl"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Start your first session
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {currentRows.map((r) => {
                  const creditsUsed = getInterviewCreditsUsed(r);
                  return (
                    <div
                      key={r.interviewId}
                      className="group flex min-w-0 flex-nowrap items-center justify-between gap-3 py-2.5 transition-colors first:pt-0 last:pb-0 hover:bg-slate-50/80"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="truncate text-sm font-semibold leading-tight text-slate-900">
                          {r.metadata.role || "Coding practice"}
                        </h4>
                        <p className="flex flex-wrap items-center gap-x-1.5 text-xs leading-normal text-slate-500">
                          <span>{formatDate(r.createdAt)}</span>
                          <span className="text-slate-300">·</span>
                          <span>
                            {r.metadata.language === "hi" ? "Hindi" : "English"}
                          </span>
                          {r.metadata.targetCompany ? (
                            <>
                              <span className="text-slate-300">·</span>
                              <span>{r.metadata.targetCompany}</span>
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
                          {r.report?.overallScore != null ? (
                            <>
                              <span className="text-slate-300">·</span>
                              <span
                                className={cn(
                                  "font-semibold tabular-nums",
                                  getScoreColor(r.report.overallScore),
                                )}
                              >
                                {r.report.overallScore}/100
                              </span>
                            </>
                          ) : null}
                          <span className="text-slate-300">·</span>
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-1.5 py-px text-[10px] font-semibold capitalize leading-none",
                              getStatusBadge(r.status),
                            )}
                          >
                            {r.status}
                          </span>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5 self-center">
                        {r.status === "completed" && (
                          <>
                            <Button
                              variant="outline"
                              className={cn(
                                instituteSecondaryClass,
                                "size-8 shrink-0 p-0 [&_svg]:size-3.5",
                              )}
                              title="Play session recording"
                              aria-label="Play session recording"
                              onClick={async () => {
                                try {
                                  const { videoUrl } =
                                    await interviewApi.getRecordingVideoUrl(
                                      r.interviewId,
                                    );
                                  if (!videoUrl?.trim()) {
                                    setVideoUnavailableOpen(true);
                                    return;
                                  }
                                  window.open(videoUrl, "_blank");
                                } catch (error) {
                                  console.error(
                                    "Error getting recording URL:",
                                    error,
                                  );
                                  setVideoUnavailableOpen(true);
                                }
                              }}
                            >
                              <PlayCircle className="size-3.5" />
                            </Button>
                            {r.report ? (
                              <Link
                                href={`/dashboard/interviews/${r.interviewId}/report`}
                                className={cn(
                                  buttonVariants({ variant: "outline" }),
                                  instituteSecondaryClass,
                                  "h-8 shrink-0 gap-1.5 px-2.5 py-0 text-xs leading-none no-underline",
                                )}
                              >
                                <FileText className="size-3.5 shrink-0" />
                                View report
                              </Link>
                            ) : (
                              <Link
                                href={`/dashboard/interviews/${r.interviewId}/report`}
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
                        {r.status === "failed" && (
                          <>
                            <Button
                              variant="outline"
                              className={cn(
                                instituteSecondaryClass,
                                "size-8 shrink-0 p-0 [&_svg]:size-3.5",
                              )}
                              title="Play session recording"
                              aria-label="Play session recording"
                              onClick={async () => {
                                try {
                                  const { videoUrl } =
                                    await interviewApi.getRecordingVideoUrl(
                                      r.interviewId,
                                    );
                                  if (!videoUrl?.trim()) {
                                    setVideoUnavailableOpen(true);
                                    return;
                                  }
                                  window.open(videoUrl, "_blank");
                                } catch (error) {
                                  console.error(
                                    "Error getting recording URL:",
                                    error,
                                  );
                                  setVideoUnavailableOpen(true);
                                }
                              }}
                            >
                              <PlayCircle className="size-3.5" />
                            </Button>
                            <Link
                              href={`/dashboard/interviews/${r.interviewId}/report`}
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
                        {r.status === "processing" && (
                          <Link
                            href={`/dashboard/interviews/${r.interviewId}/processing`}
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
                        {(r.status === "draft" || r.status === "active") && (
                          <>
                            <Link
                              href={`/dashboard/coding-interviews/${r.interviewId}`}
                              className={cn(
                                buttonVariants({ variant: "default" }),
                                institutePrimaryClass,
                                "h-8 shrink-0 gap-1 px-3 py-0 text-xs leading-none no-underline",
                              )}
                            >
                              <PlayCircle className="size-3.5 shrink-0" />
                              {r.status === "draft" ? "Start" : "Continue"}
                            </Link>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                instituteSecondaryClass,
                                "size-8 shrink-0 border-red-200 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 [&_svg]:size-3.5",
                              )}
                              title="Delete session"
                              aria-label="Delete session"
                              onClick={() =>
                                setDeleteConfirmId(r.interviewId)
                              }
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </>
                        )}
                        {r.status !== "completed" &&
                          r.status !== "processing" &&
                          r.status !== "draft" &&
                          r.status !== "active" &&
                          r.status !== "failed" && (
                            <Link
                              href={`/dashboard/coding-interviews/${r.interviewId}`}
                              className={cn(
                                buttonVariants({ variant: "outline" }),
                                instituteSecondaryClass,
                                "h-8 shrink-0 gap-1.5 px-2.5 py-0 text-xs leading-none no-underline",
                              )}
                            >
                              Open
                            </Link>
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
                          variant={currentPage === pageNum ? "default" : "outline"}
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

      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this session?</DialogTitle>
            <DialogDescription>
              This removes the coding session and any recording stored for it
              from our systems. You cannot undo this.
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
              onClick={() => void handleConfirmDelete()}
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
            <DialogTitle>No recording available</DialogTitle>
            <DialogDescription>
              This session does not have a screen recording yet, or the video
              could not be loaded. If you just finished, wait a few minutes and
              try again. Recording requires sharing your screen and camera
              during the coding round.
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
