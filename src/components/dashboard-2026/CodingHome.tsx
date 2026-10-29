"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { interviewApi } from "@/lib/api";
import { useCodingInterviewsQuery } from "@/hooks/queries/useCodingInterviewsQuery";
import { useDashboardInvalidation } from "@/hooks/useDashboardInvalidation";
import { cn, sumInterviewCreditsUsed } from "@/lib/utils";
import { isStartedInterview } from "@/lib/interview-kind";
import { RecentInterviewsList } from "@/components/dashboard/RecentInterviewsList";
import { PracticeSessionGateDialogs } from "@/components/upsell/PracticeSessionGateDialogs";
import { PracticeLockedGate } from "@/components/upsell/PracticeLockedGate";
import { usePracticeSessionGate } from "@/components/upsell/usePracticeSessionGate";
import { Mono } from "@/components/marketing-2026/primitives";
import { dash2026Scope } from "./ui";
import { ListHeader, PracticeHero } from "./PracticeHero";

const ITEMS_PER_PAGE = 10;

export function CodingHome() {
  const { user, isLoaded } = useUser();
  const { data: listedRows = [], isLoading: loading } = useCodingInterviewsQuery();
  const rows = useMemo(() => listedRows.filter(isStartedInterview), [listedRows]);
  const { invalidate } = useDashboardInvalidation();
  const [currentPage, setCurrentPage] = useState(1);
  const [videoUnavailableOpen, setVideoUnavailableOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const { startPracticeSession, checkingSubscription, canUse, showTrialUpsell, entitlementsLoading, ...practiceGate } = usePracticeSessionGate();

  useEffect(() => {
    if (isLoaded && user) localStorage.setItem("clerk-user-id", user.id);
  }, [isLoaded, user]);

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleteBusy(true);
    try {
      await interviewApi.deleteDraftOrActive(deleteConfirmId);
      toast.success("Session deleted");
      setDeleteConfirmId(null);
      await invalidate(["codingInterviews", "entitlements"]);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Could not delete session";
      toast.error(msg);
    } finally {
      setDeleteBusy(false);
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
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your coding sessions…</p>
        </div>
      </div>
    );
  }

  const completed = rows.filter((r) => r.status === "completed").length;
  const scored = [...rows].filter((r) => r.report?.overallScore != null).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const avg = scored.length ? Math.round(scored.reduce((n, r) => n + (r.report?.overallScore ?? 0), 0) / scored.length) : null;
  const credits = sumInterviewCreditsUsed(rows);
  const locked = !entitlementsLoading && !canUse("codingRound");
  const last = scored[0];
  // problems solved across every submitted coding round: all tests green
  const submissions = rows.flatMap((r) => r.codingRound?.submissions ?? []);
  const solved = submissions.filter((s) => s.testsTotal > 0 && s.testsPassed === s.testsTotal).length;
  const startNew = () => startPracticeSession("coding", { path: "/dashboard/coding-interviews/new" });

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl space-y-5 lg:space-y-6")}>
      <PracticeHero
        eyebrow="CODING ROUND"
        title="Solve it, then"
        accent="defend it out loud."
        description="Three problems matched to your target company, a real editor with tests, then an AI interviewer who asks why you chose that approach. One report scores both."
        startLabel="Start a session"
        onStart={startNew}
        starting={checkingSubscription}
        links={[{ label: "AI interview", href: "/dashboard/interviews" }, { label: "System design", href: "/dashboard/system-design" }]}
        last={last ? {
          score: Math.round(last.report!.overallScore),
          title: last.metadata.role,
          meta: `${last.metadata.targetCompany ? `${last.metadata.targetCompany} · ` : ""}${new Date(last.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
          href: `/dashboard/interviews/${last.interviewId}/report`,
        } : null}
        trend={scored.slice(0, 10).reverse().map((r) => Math.round(r.report!.overallScore))}
        emptyLast="No scored session yet. Your first report shows the coding and discussion scores side by side."
        stats={[
          ["Sessions", String(rows.length), "coding rounds started"],
          ["Average score", avg != null ? String(avg) : "—", avg != null ? `${scored.length} scored, out of 100` : "after your first report"],
          ["Problems solved", submissions.length ? `${solved}/${submissions.length}` : "—", "all tests passing"],
          ["Credits used", String(credits), `${completed} finished session${completed === 1 ? "" : "s"}`],
        ]}
      />

      {locked ? (
        <PracticeLockedGate type="coding" showTrialUpsell={showTrialUpsell} />
      ) : (
        <section className="overflow-hidden rounded-[22px] border border-border bg-card">
          <ListHeader
            eyebrow="YOUR SESSIONS"
            title={rows.length === 0 ? "Nothing here yet." : `${rows.length} session${rows.length === 1 ? "" : "s"}, newest first.`}
            description="Scores, recordings and reports for every coding round."
          >
            <div className="flex flex-wrap gap-2">
              {["3 problems", "Monaco editor", "Run tests", "AI discussion"].map((t) => (
                <Mono key={t} className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground">{t.toUpperCase()}</Mono>
              ))}
            </div>
          </ListHeader>
          <RecentInterviewsList
            interviews={rows}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
            onVideoUnavailable={() => setVideoUnavailableOpen(true)}
            onDelete={setDeleteConfirmId}
            getDraftActiveHref={(id) => `/dashboard/coding-interviews/${id}`}
            emptyDescription="Solve three problems in the editor, then discuss your approach with AI. Your report will include coding and discussion scores."
          />
        </section>
      )}

      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this session?</DialogTitle>
            <DialogDescription>This removes the coding session and any recording stored for it from our systems. You cannot undo this.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmId(null)} disabled={deleteBusy}>Cancel</Button>
            <Button type="button" variant="destructive" disabled={deleteBusy} onClick={() => void handleConfirmDelete()}>
              {deleteBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={videoUnavailableOpen} onOpenChange={setVideoUnavailableOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>No recording available</DialogTitle>
            <DialogDescription>
              This session does not have a screen recording yet, or the video could not be loaded. If you just finished, wait a few minutes and try again. Recording requires sharing your screen and camera during the coding round.
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
