"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Boxes,
  Loader2,
  ChevronRight,
  ChevronLeft,
  FileText,
  GitBranch,
  LayoutGrid,
  Layers,
  MessageCircle,
  Network,
  Play,
  Share2,
  Sparkles,
  Star,
  Workflow,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import {
  institutePrimaryClass,
} from "@/components/institute/InstituteChrome";
import { SystemDesignHeroPreview } from "@/components/system-design/SystemDesignHeroPreview";

import {
  systemDesignApi,
  type SystemDesignSession,
  type SystemDesignProblemSummary,
} from "@/lib/api";
import { getProblemById } from "@/lib/systemDesignProblems";
import { cn, formatDate } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

function sessionScore(session: SystemDesignSession): number | null {
  const raw =
    session.scoreReport?.overallScore ?? session.score ?? undefined;
  if (typeof raw !== "number" || Number.isNaN(raw)) return null;
  return raw;
}

function formatScore(score: number | null): string {
  if (score == null) return "—";
  return score % 1 === 0 ? String(score) : score.toFixed(1);
}

function problemTitle(session: SystemDesignSession): string {
  return getProblemById(session.problemId)?.title ?? session.problemId;
}

const getStatusBadge = (status: string) => {
  const badges = {
    completed: "bg-green-100 text-green-700 border-green-200",
    active: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };
  return badges[status as keyof typeof badges] || badges.active;
};

function ProblemPickerBody(
  props: Readonly<{
    problemsLoading: boolean;
    problems: SystemDesignProblemSummary[];
    createBusyProblemId: string | null;
    createRandomBusy: boolean;
    onPick: (problemId?: string) => void;
  }>,
) {
  const {
    problemsLoading,
    problems,
    createBusyProblemId,
    createRandomBusy,
    onPick,
  } = props;

  if (problemsLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading problems…
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        No problems are available right now. Please try again later.
      </p>
    );
  }

  return (
    <ul className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
      {problems.map((p) => {
        const busy = createBusyProblemId === p.id;
        return (
          <li key={p.id}>
            <button
              type="button"
              disabled={!!createBusyProblemId || createRandomBusy || busy}
              onClick={() => {
                onPick(p.id);
              }}
              className={cn(
                "flex w-full flex-col items-stretch gap-1 rounded-lg border border-slate-200 bg-white p-3 text-left text-sm transition hover:border-blue-300 hover:bg-blue-50/50",
                busy && "opacity-70",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-slate-900">{p.title}</span>
                {busy ? (
                  <Loader2
                    className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-[rgb(37,99,235)]"
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium capitalize">
                  {p.difficulty}
                </span>
                <span>{p.category}</span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function SystemDesignDashboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [sessions, setSessions] = useState<SystemDesignSession[]>([]);
  const [problems, setProblems] = useState<SystemDesignProblemSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [problemDialogOpen, setProblemDialogOpen] = useState(false);
  const [createBusyProblemId, setCreateBusyProblemId] = useState<string | null>(
    null,
  );
  const [createRandomBusy, setCreateRandomBusy] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const refreshSessions = useCallback(async () => {
    try {
      const rows = await systemDesignApi.listMySessions();
      setSessions(rows);
    } catch {
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setSessionsLoading(false);
      return;
    }
    localStorage.setItem("clerk-user-id", user.id);
    refreshSessions().finally(() => setSessionsLoading(false));
  }, [isLoaded, user, refreshSessions]);

  useEffect(() => {
    if (!problemDialogOpen || !user) return;
    setProblemsLoading(true);
    systemDesignApi
      .listProblems()
      .then(setProblems)
      .catch(() => {
        setProblems([]);
        toast.error("Could not load problems");
      })
      .finally(() => setProblemsLoading(false));
  }, [problemDialogOpen, user]);

  const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSessions = sessions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const maxPage = Math.max(
      1,
      Math.ceil(sessions.length / ITEMS_PER_PAGE) || 1,
    );
    if (currentPage > maxPage) setCurrentPage(maxPage);
  }, [currentPage, sessions.length]);

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

  const stats = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === "completed").length;
    const scores = sessions
      .map(sessionScore)
      .filter((n): n is number => n != null);
    const avgScore =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null;
    return { total, completed, avgScore };
  }, [sessions]);

  const startSession = async (problemId?: string) => {
    if (problemId) setCreateBusyProblemId(problemId);
    else setCreateRandomBusy(true);
    try {
      const session = await systemDesignApi.createSession(problemId);
      setProblemDialogOpen(false);
      router.push(`/dashboard/system-design/${session.sessionId}`);
      void refreshSessions();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not start session";
      toast.error(msg);
    } finally {
      setCreateBusyProblemId(null);
      setCreateRandomBusy(false);
    }
  };

  if (!isLoaded || sessionsLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[rgb(37,99,235)]" />
          <p className="text-gray-600">Loading your system design sessions…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-slate-600">Sign in to view system design sessions.</p>
        <Button asChild className={cn("mt-4", institutePrimaryClass)}>
          <Link href="/sign-in">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 z-0 h-48 w-48 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 z-0 h-56 w-56 rounded-full bg-indigo-200/25 blur-3xl" />

        {/* Floating system-design motifs — same motion pattern as coding practice hero */}
        <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-2xl">
          {[...Array(8)].map((_, i) => (
            <div
              key={`sd-net-${i}`}
              className="absolute"
              style={{
                left: `${(i * 15) % 100}%`,
                top: `${(i * 20) % 100}%`,
                opacity: 0.09,
                animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              <Network className="h-12 w-12 text-blue-400 sm:h-16 sm:w-16" aria-hidden />
            </div>
          ))}
          {[...Array(8)].map((_, i) => (
            <div
              key={`sd-grid-${i}`}
              className="absolute"
              style={{
                left: `${(i * 16) % 100}%`,
                top: `${(i * 22) % 100}%`,
                opacity: 0.07,
                animation: `float-${i % 3} ${7 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              <LayoutGrid className="h-10 w-10 text-indigo-300 sm:h-14 sm:w-14" aria-hidden />
            </div>
          ))}
          {[...Array(6)].map((_, i) => {
            const Icon = [Layers, Boxes, Workflow, Share2, GitBranch, Network][i % 6];
            return (
              <div
                key={`sd-mix-${i}`}
                className="absolute"
                style={{
                  left: `${(i * 17 + 8) % 100}%`,
                  top: `${(i * 19 + 12) % 100}%`,
                  opacity: 0.06,
                  animation: `float-${(i + 1) % 3} ${8 + (i % 2) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.65}s`,
                }}
              >
                <Icon className="h-9 w-9 text-violet-300/90 sm:h-12 sm:w-12" aria-hidden />
              </div>
            );
          })}
        </div>

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.85fr] lg:items-center">
          <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-2 motion-safe:duration-700 motion-safe:ease-out">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-blue-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Whiteboard + voice practice
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Design{" "}
              <span className="text-[rgb(37,99,235)]">systems</span>
              {" "}
              like it&apos;s{" "}
              <span className="text-[rgb(37,99,235)]">interview</span> day
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Pick a prompt, sketch your architecture on the canvas, and get
              structured feedback — with optional screen recording after you wrap
              up.
            </p>

            <ul className="mt-6 space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgb(37,99,235)] text-[11px] font-bold text-white">
                  1
                </span>
                <span>
                  <span className="font-semibold text-slate-900">Flow:</span>{" "}
                  requirements → high-level diagram → drilldowns.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgb(37,99,235)] text-[11px] font-bold text-white">
                  2
                </span>
                <span>
                  <span className="font-semibold text-slate-900">Voice:</span>{" "}
                  talk through tradeoffs like a real interview.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgb(37,99,235)] text-[11px] font-bold text-white">
                  3
                </span>
                <span>
                  <span className="font-semibold text-slate-900">
                    Feedback:
                  </span>{" "}
                  scoring and strengths/risks when you finalize.
                </span>
              </li>
            </ul>

            <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button
                type="button"
                onClick={() => setProblemDialogOpen(true)}
                size="lg"
                className={cn(
                  "h-auto px-5 py-4 text-sm font-semibold sm:px-6 sm:py-5 sm:text-base",
                  institutePrimaryClass,
                )}
              >
                Start New Session
                <ChevronRight className="ml-2 h-4 w-4" aria-hidden />
              </Button>
              <div
                className="flex items-center gap-1.5 sm:gap-2"
                aria-label="Rated 4.9 out of 5"
              >
                <div className="flex items-center gap-0.5 sm:gap-1" aria-hidden>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={`hero-star-${i}`}
                      className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 sm:h-4 sm:w-4"
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-slate-600 sm:text-sm">
                  4.9/5
                </span>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[420px] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:delay-150 motion-safe:ease-out lg:mx-0 lg:justify-self-end">
            <div className="pointer-events-none absolute -left-8 top-10 hidden rotate-[-8deg] rounded-xl border border-blue-200/60 bg-white/70 px-3 py-2 text-[11px] font-semibold text-blue-800 shadow-sm sm:block">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4" aria-hidden />
                End-to-end flow
              </div>
            </div>
            <div className="pointer-events-none absolute -right-6 bottom-6 hidden rotate-[6deg] rounded-xl border border-indigo-200/60 bg-white/70 px-3 py-2 text-[11px] font-semibold text-indigo-800 shadow-sm sm:block">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" aria-hidden />
                Tradeoffs + deep dives
              </div>
            </div>
            <SystemDesignHeroPreview />
          </div>
        </div>
      </section>

      {sessions.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <div className="flex min-h-0 min-w-0 items-start gap-3 rounded-md border border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 shadow-lg shadow-blue-500/10 sm:gap-4 sm:p-5">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[rgb(37,99,235)] sm:text-sm">
                  Sessions
                </p>
                <p className="shrink-0 text-right text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>
          <div className="flex min-h-0 min-w-0 items-start gap-3 rounded-md border border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 shadow-lg shadow-blue-500/10 sm:gap-4 sm:p-5">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[rgb(37,99,235)] sm:text-sm">
                  Completed
                </p>
                <p className="shrink-0 text-right text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
                  {stats.completed}
                </p>
              </div>
            </div>
          </div>
          <div className="flex min-h-0 min-w-0 items-start gap-3 rounded-md border border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 shadow-lg shadow-blue-500/10 sm:gap-4 sm:p-5">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[rgb(37,99,235)] sm:text-sm">
                  Average score
                </p>
                <p className="shrink-0 text-right text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
                  {stats.avgScore == null ? "—" : stats.avgScore.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          System design history
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Continue an in-progress session or open a completed review.
        </p>
      </div>

      <Card className="border border-slate-200 bg-white">
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <LayoutGrid className="h-6 w-6 text-slate-500" aria-hidden />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No sessions yet
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Start your first system design session to see it here.
              </p>
              <div className="mt-6 flex justify-center">
                <Button
                  type="button"
                  onClick={() => setProblemDialogOpen(true)}
                  className={institutePrimaryClass}
                >
                  Start New Session
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {paginatedSessions.map((row) => {
                  const score = sessionScore(row);
                  const chatCount = row.chatHistory?.length ?? 0;
                  const href =
                    row.status === "completed"
                      ? `/dashboard/system-design/${row.sessionId}/report`
                      : `/dashboard/system-design/${row.sessionId}`;
                  const isCompleted = row.status === "completed";
                  const title = problemTitle(row);
                  return (
                    <div
                      key={row.sessionId}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {title}
                          </div>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                              getStatusBadge(row.status),
                            )}
                          >
                            {row.status}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>{formatDate(row.updatedAt)}</span>
                          <span>
                            Score:{" "}
                            <span className="font-medium text-slate-700">
                              {formatScore(score)}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                            {chatCount} messages
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {isCompleted &&
                        (row.recordingS3Key?.trim() || row.recordingVideoUrl) ? (
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "h-8 gap-1.5 px-2.5 text-xs font-semibold",
                            )}
                            onClick={async () => {
                              try {
                                const { videoUrl } =
                                  await systemDesignApi.getRecordingPlaybackUrl(
                                    row.sessionId,
                                  );
                                if (!videoUrl?.trim()) {
                                  toast.error("Recording unavailable");
                                  return;
                                }
                                window.open(videoUrl, "_blank", "noopener,noreferrer");
                              } catch {
                                toast.error(
                                  "Could not open recording — try again later.",
                                );
                              }
                            }}
                          >
                            <Play className="h-3.5 w-3.5" aria-hidden />
                            Recording
                          </Button>
                        ) : null}
                        <Link
                          href={href}
                          className={cn(
                            buttonVariants({ size: "sm" }),
                            institutePrimaryClass,
                            "h-8 gap-1 px-3 text-xs font-semibold no-underline",
                          )}
                        >
                          {row.status === "active" ? (
                            <>
                              Continue
                              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                            </>
                          ) : (
                            <>
                              <FileText
                                className="h-3.5 w-3.5 shrink-0"
                                aria-hidden
                              />
                              View Report
                            </>
                          )}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 ? (
                <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 px-4 pb-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
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
                      <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
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
                      <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={problemDialogOpen} onOpenChange={setProblemDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose a system design problem</DialogTitle>
            <DialogDescription>
              Select a prompt to start a new whiteboard session. You can also
              let us pick one at random.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center border-dashed"
              disabled={createRandomBusy || problemsLoading}
              onClick={() => void startSession()}
            >
              {createRandomBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                "Surprise me (random problem)"
              )}
            </Button>

            <ProblemPickerBody
              problemsLoading={problemsLoading}
              problems={problems}
              createBusyProblemId={createBusyProblemId}
              createRandomBusy={createRandomBusy}
              onPick={startSession}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
