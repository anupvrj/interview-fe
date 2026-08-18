"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import { PracticeSessionGateDialogs } from "@/components/upsell/PracticeSessionGateDialogs";
import { PracticeLockedGate } from "@/components/upsell/PracticeLockedGate";
import { usePracticeSessionGate } from "@/components/upsell/usePracticeSessionGate";
import {
  SystemDesignDifficultyFilterBar,
  SystemDesignProblemPickCard,
  SystemDesignSurpriseMeButton,
  type SystemDesignDifficultyFilter,
} from "@/components/system-design/SystemDesignProblemPicker";
import { SystemDesignProblemPreviewDialog } from "@/components/system-design/SystemDesignProblemPreviewDialog";
import {
  systemDesignApi,
  type SystemDesignProblemDetail,
  type SystemDesignProblemSummary,
} from "@/lib/api";
import { fetchSubscriptionExpired } from "@/lib/subscriptionAccess";
import { cn } from "@/lib/utils";

export default function SystemDesignNewSessionPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [problems, setProblems] = useState<SystemDesignProblemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] =
    useState<SystemDesignDifficultyFilter>("all");
  const [createBusyProblemId, setCreateBusyProblemId] = useState<string | null>(
    null,
  );
  const [createRandomBusy, setCreateRandomBusy] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewProblemId, setViewProblemId] = useState<string | null>(null);
  const [viewProblem, setViewProblem] = useState<SystemDesignProblemDetail | null>(
    null,
  );
  const [viewLoading, setViewLoading] = useState(false);

  const practiceGate = usePracticeSessionGate();
  const {
    canUse,
    showTrialUpsell,
    entitlementsLoading,
    setSubscriptionExpiredOpen,
  } = practiceGate;

  const systemDesignLocked =
    !entitlementsLoading && !canUse("systemDesign");

  useEffect(() => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }
    localStorage.setItem("clerk-user-id", user.id);
    systemDesignApi
      .listProblems()
      .then(setProblems)
      .catch(() => {
        setProblems([]);
        toast.error("Could not load problems");
      })
      .finally(() => setLoading(false));
  }, [isLoaded, user]);

  const difficultyCounts = useMemo(() => {
    const counts = {
      all: problems.length,
      easy: 0,
      medium: 0,
      hard: 0,
    } satisfies Record<SystemDesignDifficultyFilter, number>;
    for (const p of problems) {
      counts[p.difficulty] += 1;
    }
    return counts;
  }, [problems]);

  const filteredProblems = useMemo(() => {
    if (difficultyFilter === "all") return problems;
    return problems.filter((p) => p.difficulty === difficultyFilter);
  }, [problems, difficultyFilter]);

  const startSession = useCallback(
    async (problemId?: string) => {
      const expired = await fetchSubscriptionExpired();
      if (expired) {
        setSubscriptionExpiredOpen(true);
        return;
      }

      if (problemId) setCreateBusyProblemId(problemId);
      else setCreateRandomBusy(true);

      try {
        const session = await systemDesignApi.createSession(problemId);
        router.push(`/dashboard/system-design/${session.sessionId}`);
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Could not start session";
        toast.error(msg);
      } finally {
        setCreateBusyProblemId(null);
        setCreateRandomBusy(false);
      }
    },
    [router, setSubscriptionExpiredOpen],
  );

  const handleSurpriseMe = useCallback(() => {
    const pool =
      difficultyFilter === "all"
        ? problems
        : problems.filter((p) => p.difficulty === difficultyFilter);
    if (pool.length === 0) {
      toast.error("No problems match this filter");
      return;
    }
    const pick = pool[Math.floor(Math.random() * pool.length)]!;
    void startSession(pick.id);
  }, [difficultyFilter, problems, startSession]);

  const openProblemPreview = useCallback((problemId: string) => {
    setViewProblemId(problemId);
    setViewProblem(null);
    setViewDialogOpen(true);
  }, []);

  useEffect(() => {
    if (!viewDialogOpen || !viewProblemId) return;
    setViewLoading(true);
    systemDesignApi
      .getProblem(viewProblemId)
      .then(setViewProblem)
      .catch(() => {
        setViewProblem(null);
        toast.error("Could not load problem details");
      })
      .finally(() => setViewLoading(false));
  }, [viewDialogOpen, viewProblemId]);

  const handleViewDialogOpenChange = useCallback((open: boolean) => {
    setViewDialogOpen(open);
    if (!open) {
      setViewProblemId(null);
      setViewProblem(null);
    }
  }, []);

  const handleAttemptFromPreview = useCallback(() => {
    if (!viewProblemId) return;
    void startSession(viewProblemId);
  }, [viewProblemId, startSession]);

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#7367F0]" />
          <p className="text-muted-foreground">Loading problems…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">
          Sign in to choose a system design problem.
        </p>
        <Button asChild className={cn("mt-4", institutePrimaryClass)}>
          <Link href="/sign-in">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-5">
        <Button
          variant="ghost"
          asChild
          className="-ml-2 h-auto px-2 text-muted-foreground"
        >
          <Link href="/dashboard/system-design">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to system design
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Choose a problem
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Pick a system design prompt to practice on the whiteboard. Filter
              by difficulty or let us surprise you.
            </p>
          </div>

          {!systemDesignLocked ? (
            <SystemDesignSurpriseMeButton
              busy={createRandomBusy}
              disabled={!!createBusyProblemId || filteredProblems.length === 0}
              onClick={handleSurpriseMe}
              className="self-start sm:mb-0.5"
            />
          ) : null}
        </div>
      </div>

      {systemDesignLocked ? (
        <PracticeLockedGate
          type="system_design"
          showTrialUpsell={showTrialUpsell}
        />
      ) : (
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <SystemDesignDifficultyFilterBar
              value={difficultyFilter}
              onChange={setDifficultyFilter}
              counts={difficultyCounts}
            />
            <p className="text-xs text-muted-foreground sm:text-right">
              {filteredProblems.length} problem
              {filteredProblems.length === 1 ? "" : "s"}
            </p>
          </div>

          {filteredProblems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center">
              <p className="text-sm font-medium text-foreground">
                No problems for this difficulty
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try another filter or check back later.
              </p>
              <Button
                type="button"
                variant="outline"
                className={cn("mt-4", instituteSecondaryClass)}
                onClick={() => setDifficultyFilter("all")}
              >
                Show all problems
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProblems.map((problem) => (
                <SystemDesignProblemPickCard
                  key={problem.id}
                  problem={problem}
                  attemptBusy={createBusyProblemId === problem.id}
                  disabled={!!createBusyProblemId || createRandomBusy}
                  onView={openProblemPreview}
                  onAttempt={(id) => void startSession(id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <SystemDesignProblemPreviewDialog
        open={viewDialogOpen}
        onOpenChange={handleViewDialogOpenChange}
        loading={viewLoading}
        problem={viewProblem}
        attemptBusy={!!viewProblemId && createBusyProblemId === viewProblemId}
        onAttempt={viewProblemId ? handleAttemptFromPreview : undefined}
      />

      <PracticeSessionGateDialogs {...practiceGate} />
    </div>
  );
}
