"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Boxes,
  Loader2,
  ChevronRight,
  GitBranch,
  LayoutGrid,
  Layers,
  Network,
  Plus,
  Share2,
  Sparkles,
  Star,
  Workflow,
  Target,
  CheckCircle,
} from "lucide-react";

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

import { institutePrimaryClass } from "@/components/institute/InstituteChrome";
import { SystemDesignHeroPreview } from "@/components/system-design/SystemDesignHeroPreview";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { RecentInterviewsList } from "@/components/dashboard/RecentInterviewsList";
import { PracticeSessionGateDialogs } from "@/components/upsell/PracticeSessionGateDialogs";
import { PracticeLockedGate } from "@/components/upsell/PracticeLockedGate";
import { usePracticeSessionGate } from "@/components/upsell/usePracticeSessionGate";
import { type SystemDesignSession } from "@/lib/api";
import { useSystemDesignSessionsQuery } from "@/hooks/queries/useSystemDesignSessionsQuery";
import { buildDashboardRecentSessions } from "@/lib/dashboard-recent-sessions";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

function sessionScore(session: SystemDesignSession): number | null {
  const raw =
    session.scoreReport?.overallScore ?? session.score ?? undefined;
  if (typeof raw !== "number" || Number.isNaN(raw)) return null;
  return raw;
}

export default function SystemDesignDashboardPage() {
  const { user, isLoaded } = useUser();

  const { data: sessions = [], isLoading: sessionsLoading } =
    useSystemDesignSessionsQuery();
  const [currentPage, setCurrentPage] = useState(1);
  const [videoUnavailableOpen, setVideoUnavailableOpen] = useState(false);
  const practiceGate = usePracticeSessionGate();
  const {
    startPracticeSession,
    checkingSubscription,
    canUse,
    showTrialUpsell,
    entitlementsLoading,
  } = practiceGate;

  useEffect(() => {
    if (!isLoaded || !user) return;
    localStorage.setItem("clerk-user-id", user.id);
  }, [isLoaded, user]);

  const sessionRows = useMemo(
    () =>
      buildDashboardRecentSessions({
        interviews: [],
        systemDesignSessions: sessions,
        peerBookings: [],
      }),
    [sessions],
  );

  const handlePageChange = (page: number) => {
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

  const systemDesignLocked =
    !entitlementsLoading && !canUse("systemDesign");

  const openProblemPicker = () => {
    startPracticeSession("system_design", {
      path: "/dashboard/system-design/new",
    });
  };

  if (!isLoaded || sessionsLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#7367F0]" />
          <p className="text-muted-foreground">Loading your system design sessions…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">Sign in to view system design sessions.</p>
        <Button asChild className={cn("mt-4", institutePrimaryClass)}>
          <Link href="/sign-in">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      <section className="relative overflow-hidden rounded-xl bg-[#7367F0]/[0.04] px-4 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-6 md:pb-12">
        <div className="pointer-events-none absolute -right-16 -top-16 z-0 h-48 w-48 rounded-full bg-[#7367F0]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 z-0 h-56 w-56 rounded-full bg-violet-200/20 blur-3xl" />

        <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-xl">
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
              <Network className="h-12 w-12 text-[#7367F0]/40 sm:h-16 sm:w-16" aria-hidden />
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
              <LayoutGrid className="h-10 w-10 text-[#7367F0]/30 sm:h-14 sm:w-14" aria-hidden />
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
            <div className="inline-flex items-center gap-2 rounded-full bg-[#7367F0]/10 px-3 py-1 text-xs font-semibold text-[#7367F0]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Whiteboard + voice practice
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Design{" "}
              <span className="text-[#7367F0]">systems</span>
              {" "}
              like it&apos;s{" "}
              <span className="text-[#7367F0]">interview</span> day
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Pick a prompt, sketch your architecture on the canvas, and get
              structured feedback — with optional screen recording after you wrap
              up.
            </p>

            <ul className="mt-6 space-y-2 text-sm text-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7367F0] text-[11px] font-bold text-white">
                  1
                </span>
                <span>
                  <span className="font-semibold text-foreground">Flow:</span>{" "}
                  requirements → high-level diagram → drilldowns.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7367F0] text-[11px] font-bold text-white">
                  2
                </span>
                <span>
                  <span className="font-semibold text-foreground">Voice:</span>{" "}
                  talk through tradeoffs like a real interview.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7367F0] text-[11px] font-bold text-white">
                  3
                </span>
                <span>
                  <span className="font-semibold text-foreground">
                    Feedback:
                  </span>{" "}
                  scoring and strengths/risks when you finalize.
                </span>
              </li>
            </ul>

            <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button
                type="button"
                disabled={checkingSubscription}
                onClick={openProblemPicker}
                size="lg"
                className={cn(
                  "h-auto px-5 py-4 text-sm font-semibold sm:px-6 sm:py-5 sm:text-base",
                  institutePrimaryClass,
                )}
              >
                {checkingSubscription ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
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
                <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                  4.9/5
                </span>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[420px] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:delay-150 motion-safe:ease-out lg:mx-0 lg:justify-self-end">
            <div className="pointer-events-none absolute -left-8 top-10 hidden rotate-[-8deg] rounded-xl border border-[#7367F0]/20 bg-card/80 px-3 py-2 text-[11px] font-semibold text-[#7367F0] shadow-sm sm:block">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4" aria-hidden />
                End-to-end flow
              </div>
            </div>
            <div className="pointer-events-none absolute -right-6 bottom-6 hidden rotate-[6deg] rounded-xl border border-violet-200/60 bg-card/80 px-3 py-2 text-[11px] font-semibold text-violet-700 shadow-sm sm:block">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" aria-hidden />
                Tradeoffs + deep dives
              </div>
            </div>
            <SystemDesignHeroPreview />
          </div>
        </div>
      </section>

      {systemDesignLocked ? (
        <PracticeLockedGate
          type="system_design"
          showTrialUpsell={showTrialUpsell}
        />
      ) : (
        <>
      {sessions.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <DashboardStatCard
            theme="emerald"
            label="Sessions"
            value={stats.total}
            icon={LayoutGrid}
          />
          <DashboardStatCard
            theme="sky"
            label="Completed"
            value={stats.completed}
            icon={CheckCircle}
          />
          <DashboardStatCard
            theme="violet"
            label="Average score"
            value={stats.avgScore == null ? "—" : stats.avgScore.toFixed(1)}
            icon={Target}
            progress={stats.avgScore ?? undefined}
          />
        </div>
      ) : null}

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                System design history
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {sessions.length === 0
                  ? "Start a session to see it here."
                  : `${sessions.length} session${sessions.length === 1 ? "" : "s"} in your history`}
              </CardDescription>
            </div>
            <Button
              type="button"
              disabled={checkingSubscription}
              onClick={openProblemPicker}
              className={institutePrimaryClass}
            >
              {checkingSubscription ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Start New Session
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <RecentInterviewsList
            sessionRows={sessionRows}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
            onVideoUnavailable={() => setVideoUnavailableOpen(true)}
            emptyTitle="No sessions yet"
            emptyCtaHref="/dashboard/system-design/new"
            emptyCtaLabel="Start New Session"
            emptyDescription="Pick a prompt, sketch your architecture, and talk through tradeoffs. Completed sessions show score and recording here."
          />
        </CardContent>
      </Card>
        </>
      )}

      <Dialog
        open={videoUnavailableOpen}
        onOpenChange={setVideoUnavailableOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>No video available</DialogTitle>
            <DialogDescription>
              This session does not have a recording, or the video could not
              be loaded. If you just finished, try again in a few minutes.
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
