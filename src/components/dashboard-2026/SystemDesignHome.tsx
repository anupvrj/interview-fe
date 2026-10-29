"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RecentInterviewsList } from "@/components/dashboard/RecentInterviewsList";
import { PracticeSessionGateDialogs } from "@/components/upsell/PracticeSessionGateDialogs";
import { PracticeLockedGate } from "@/components/upsell/PracticeLockedGate";
import { usePracticeSessionGate } from "@/components/upsell/usePracticeSessionGate";
import { Mono } from "@/components/marketing-2026/primitives";
import { type SystemDesignDimensionScores, type SystemDesignSession } from "@/lib/api";
import { useSystemDesignSessionsQuery } from "@/hooks/queries/useSystemDesignSessionsQuery";
import { buildDashboardRecentSessions } from "@/lib/dashboard-recent-sessions";
import { getProblemById } from "@/lib/systemDesignProblems";
import { cn } from "@/lib/utils";
import { dash2026Scope } from "./ui";
import { ListHeader, PracticeHero } from "./PracticeHero";

const ITEMS_PER_PAGE = 10;

/** Same four dimensions and weights the system design report scores against. */
const DIMENSIONS: { key: keyof SystemDesignDimensionScores; label: string; weight: string }[] = [
  { key: "scopeRequirements", label: "Scope & requirements", weight: "~15%" },
  { key: "componentArchitecture", label: "Component architecture", weight: "~25%" },
  { key: "scalingDeepDive", label: "Scaling & deep dive", weight: "~40%" },
  { key: "tradeoffsCommunication", label: "Trade-offs & communication", weight: "~20%" },
];

function sessionScore(session: SystemDesignSession): number | null {
  const raw = session.scoreReport?.overallScore ?? session.score;
  return typeof raw === "number" && !Number.isNaN(raw) ? Math.round(raw) : null;
}

const dayMonth = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** The rubric, with your average on each dimension once you have scored rounds. */
function Rubric({ sessions }: { sessions: SystemDesignSession[] }) {
  const scored = sessions.map((s) => s.scoreReport?.dimensionScores).filter((d): d is SystemDesignDimensionScores => !!d);
  const avg = (k: keyof SystemDesignDimensionScores) =>
    scored.length ? Math.round(scored.reduce((n, d) => n + (d[k] ?? 0), 0) / scored.length) : null;
  const rows = DIMENSIONS.map((d) => ({ ...d, value: avg(d.key) }));
  const weakest = scored.length ? rows.reduce((a, b) => ((b.value ?? 101) < (a.value ?? 101) ? b : a)) : null;

  return (
    <section className="overflow-hidden rounded-[22px] border border-border bg-card">
      <ListHeader
        eyebrow={scored.length ? "WHERE YOU STAND" : "HOW YOU'RE SCORED"}
        title={scored.length ? `Averaged over ${scored.length} scored round${scored.length === 1 ? "" : "s"}.` : "Four things the interviewer weighs."}
        description={weakest ? `Your lowest dimension is ${weakest.label.toLowerCase()}. Open your next round there.` : "Each report scores these out of 100. Scaling carries the most weight."}
      />
      <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((d) => (
          <div key={d.key} className="bg-card p-5 md:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[13.5px] font-semibold text-foreground">{d.label}</p>
              <Mono className="text-[11px] text-muted-foreground">{d.weight}</Mono>
            </div>
            <Mono className={cn("mt-3 block text-[30px] leading-none tracking-tight", d.value == null ? "text-muted-foreground/50" : "text-foreground")}>
              {d.value ?? "—"}
            </Mono>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={d.value == null ? `${d.label}: no score yet` : `${d.label}: ${d.value} out of 100`}>
              <div
                className={cn("h-full rounded-full", weakest?.key === d.key ? "bg-amber-500" : "bg-primary")}
                style={{ width: `${d.value ?? 0}%` }}
              />
            </div>
            {weakest?.key === d.key && <Mono className="mt-2 block text-[10.5px] text-amber-600 dark:text-amber-400">WORK ON THIS NEXT</Mono>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SystemDesignHome() {
  const { user, isLoaded } = useUser();
  const { data: sessions = [], isLoading } = useSystemDesignSessionsQuery();
  const [currentPage, setCurrentPage] = useState(1);
  const [videoUnavailableOpen, setVideoUnavailableOpen] = useState(false);
  const { startPracticeSession, checkingSubscription, canUse, showTrialUpsell, entitlementsLoading, ...practiceGate } = usePracticeSessionGate();

  useEffect(() => {
    if (isLoaded && user) localStorage.setItem("clerk-user-id", user.id);
  }, [isLoaded, user]);

  const sessionRows = useMemo(
    () => buildDashboardRecentSessions({ interviews: [], systemDesignSessions: sessions, peerBookings: [] }),
    [sessions],
  );

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(sessions.length / ITEMS_PER_PAGE));
    if (currentPage > maxPage) setCurrentPage(maxPage);
  }, [currentPage, sessions.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your system design sessions…</p>
        </div>
      </div>
    );
  }

  const completed = sessions.filter((s) => s.status === "completed").length;
  const scored = sessions
    .filter((s) => sessionScore(s) != null)
    .sort((a, b) => +new Date(b.completedAt ?? b.createdAt) - +new Date(a.completedAt ?? a.createdAt));
  const avg = scored.length ? Math.round(scored.reduce((n, s) => n + sessionScore(s)!, 0) / scored.length) : null;
  const best = scored.length ? Math.max(...scored.map((s) => sessionScore(s)!)) : null;
  const problems = new Set(sessions.map((s) => s.problemId)).size;
  const last = scored[0];
  const locked = !entitlementsLoading && !canUse("systemDesign");
  const startNew = () => startPracticeSession("system_design", { path: "/dashboard/system-design/new" });

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl space-y-5 lg:space-y-6")}>
      <PracticeHero
        eyebrow="SYSTEM DESIGN"
        title="Draw the architecture,"
        accent="then defend every box."
        description="Pick a prompt, sketch it on a whiteboard, and talk through requirements, scaling and trade-offs with an AI interviewer. The report scores you on the same four dimensions a real panel would."
        startLabel="Start a session"
        onStart={startNew}
        starting={checkingSubscription}
        links={[{ label: "AI interview", href: "/dashboard/interviews" }, { label: "Coding round", href: "/dashboard/coding-interviews" }]}
        last={last ? {
          score: sessionScore(last)!,
          title: getProblemById(last.problemId)?.title ?? last.problemId,
          meta: dayMonth(last.completedAt ?? last.createdAt),
          href: `/dashboard/system-design/${last.sessionId}/report`,
        } : null}
        trend={scored.slice(0, 10).reverse().map((s) => sessionScore(s)!)}
        emptyLast="No scored session yet. Finish a round and your report shows scope, architecture, scaling and trade-offs side by side."
        stats={[
          ["Sessions", String(sessions.length), `${completed} finished`],
          ["Average score", avg != null ? String(avg) : "—", avg != null ? `${scored.length} scored, out of 100` : "after your first report"],
          ["Best score", best != null ? String(best) : "—", "your highest round"],
          ["Prompts tried", String(problems), problems === 1 ? "one system so far" : "different systems"],
        ]}
      />

      {locked ? (
        <PracticeLockedGate type="system_design" showTrialUpsell={showTrialUpsell} />
      ) : (
        <>
          <Rubric sessions={sessions} />
          <section className="overflow-hidden rounded-[22px] border border-border bg-card">
            <ListHeader
              eyebrow="YOUR SESSIONS"
              title={sessions.length === 0 ? "Nothing here yet." : `${sessions.length} session${sessions.length === 1 ? "" : "s"}, newest first.`}
              description="Scores, recordings and reports for every system design round."
            >
              <div className="flex flex-wrap gap-2">
                {["Whiteboard", "Voice", "Deep dives", "Scored report"].map((t) => (
                  <Mono key={t} className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground">{t.toUpperCase()}</Mono>
                ))}
              </div>
            </ListHeader>
            <RecentInterviewsList
              sessionRows={sessionRows}
              currentPage={currentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
              onVideoUnavailable={() => setVideoUnavailableOpen(true)}
              emptyTitle="No sessions yet"
              emptyCtaHref="/dashboard/system-design/new"
              emptyCtaLabel="Start a session"
              emptyDescription="Pick a prompt, sketch your architecture, and talk through trade-offs. Finished sessions show their score and recording here."
            />
          </section>
        </>
      )}

      <Dialog open={videoUnavailableOpen} onOpenChange={setVideoUnavailableOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>No recording available</DialogTitle>
            <DialogDescription>
              This session does not have a recording, or the video could not be loaded. If you just finished, try again in a few minutes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setVideoUnavailableOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PracticeSessionGateDialogs {...practiceGate} />
    </div>
  );
}
