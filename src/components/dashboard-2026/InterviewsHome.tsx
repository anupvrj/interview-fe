"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Building2, CalendarClock, Clock, Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { interviewApi, interviewScheduleApi } from "@/lib/api";
import { useInterviewsQuery } from "@/hooks/queries/useInterviewsQuery";
import { useInterviewSchedulesQuery } from "@/hooks/queries/useInterviewSchedulesQuery";
import { useDashboardInvalidation } from "@/hooks/useDashboardInvalidation";
import { cn, scheduledInterviewCanStartNow, sumInterviewCreditsUsed } from "@/lib/utils";
import { filterInterviewsByType } from "@/lib/interview-kind";
import { instituteScheduleRoundLabel, routeAfterScheduledStart } from "@/lib/institute-schedule-round";
import { RecentInterviewsList } from "@/components/dashboard/RecentInterviewsList";
import { PracticeSessionGateDialogs } from "@/components/upsell/PracticeSessionGateDialogs";
import { PracticeLockedGate } from "@/components/upsell/PracticeLockedGate";
import { usePracticeSessionGate } from "@/components/upsell/usePracticeSessionGate";
import { Mono } from "@/components/marketing-2026/primitives";
import { dash2026Scope } from "./ui";
import { ListHeader, PracticeHero } from "./PracticeHero";

const ITEMS_PER_PAGE = 10;

export function InterviewsHome() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { data: interviews = [], isLoading: interviewsLoading } = useInterviewsQuery();
  const { data: scheduled = [], isLoading: schedulesLoading } = useInterviewSchedulesQuery();
  const { invalidate } = useDashboardInvalidation();
  const [currentPage, setCurrentPage] = useState(1);
  const [listTab, setListTab] = useState<"history" | "scheduled">("history");
  const [startingScheduleId, setStartingScheduleId] = useState<string | null>(null);
  const [videoUnavailableOpen, setVideoUnavailableOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const { startPracticeSession, checkingSubscription, canUse, showTrialUpsell, entitlementsLoading, ...practiceGate } = usePracticeSessionGate();

  useEffect(() => {
    if (isLoaded && user) localStorage.setItem("clerk-user-id", user.id);
  }, [isLoaded, user]);

  const screening = useMemo(() => filterInterviewsByType(interviews, "screening"), [interviews]);
  const byDate = useMemo(() => [...screening].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [screening]);

  const handleConfirmDeleteInterview = async () => {
    if (!deleteConfirmId) return;
    setDeleteBusy(true);
    try {
      await interviewApi.deleteDraftOrActive(deleteConfirmId);
      toast.success("Interview deleted");
      setDeleteConfirmId(null);
      await invalidate(["interviews", "entitlements"]);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Could not delete interview";
      toast.error(msg);
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleStartScheduled = async (scheduleId: string) => {
    try {
      setStartingScheduleId(scheduleId);
      const payload = await interviewScheduleApi.start(scheduleId);
      await invalidate(["interviewSchedules", "interviews", "entitlements"]);
      const path = routeAfterScheduledStart(payload);
      if (!path) throw new Error("Could not open this scheduled interview.");
      router.push(path);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Could not start interview. You may need a saved resume, or the scheduled time is not open yet (starts 24 hours before).");
    } finally {
      setStartingScheduleId(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isLoaded || ((interviewsLoading || schedulesLoading) && interviews.length === 0 && scheduled.length === 0)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your interviews...</p>
        </div>
      </div>
    );
  }

  const completed = screening.filter((i) => i.status === "completed").length;
  const scored = byDate.filter((i) => i.report?.overallScore);
  const avg = scored.length ? Math.round(scored.reduce((n, i) => n + (i.report?.overallScore || 0), 0) / scored.length) : null;
  const credits = sumInterviewCreditsUsed(screening);
  const locked = !entitlementsLoading && !canUse("aiMockInterview");
  const lastScored = scored[0];
  const trend = scored.slice(0, 10).reverse().map((i) => Math.round(i.report!.overallScore));
  const startNew = () => startPracticeSession("ai", { path: "/dashboard/interviews/new" });

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl space-y-5 lg:space-y-6")}>
      <PracticeHero
        eyebrow="AI INTERVIEW PRACTICE"
        title="Say it out loud."
        accent="Then read what to fix."
        description="A voice interviewer asks the questions that role and company really ask, follows up when you go vague, and scores every answer."
        startLabel="Start an interview"
        onStart={startNew}
        starting={checkingSubscription}
        links={[{ label: "Coding round", href: "/dashboard/coding-interviews" }, { label: "Peer interview", href: "/dashboard/peer-interviews" }]}
        last={lastScored ? {
          score: Math.round(lastScored.report!.overallScore),
          title: lastScored.metadata.role,
          meta: `${lastScored.metadata.targetCompany ? `${lastScored.metadata.targetCompany} · ` : ""}${new Date(lastScored.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
          href: `/dashboard/interviews/${lastScored.interviewId}/report`,
        } : null}
        trend={trend}
        emptyLast="No scored round yet. Your first report lands here, with the score and the answers that cost you points."
        stats={[
          ["Interviews", String(screening.length), "screening rounds"],
          ["Average score", avg != null ? String(avg) : "—", avg != null ? `${scored.length} scored, out of 100` : "after your first report"],
          ["Completed", String(completed), "finished with a report"],
          ["Credits used", String(credits), "from billed sessions"],
        ]}
      />

      {locked ? (
        <PracticeLockedGate type="ai" showTrialUpsell={showTrialUpsell} />
      ) : (
        <section className="overflow-hidden rounded-[22px] border border-border bg-card">
          <ListHeader
            eyebrow={listTab === "history" ? "YOUR ROUNDS" : "SCHEDULED FOR YOU"}
            title={listTab === "history"
              ? screening.length === 0 ? "Nothing here yet." : `${screening.length} round${screening.length === 1 ? "" : "s"}, newest first.`
              : scheduled.length === 0 ? "Nothing scheduled." : `${scheduled.length} scheduled by your institution.`}
            description={listTab === "history"
              ? "Scores, recordings and reports for every screening round."
              : "Start from 24 hours before the slot until the expire deadline. A saved resume is required."}
          >
            <div role="tablist" aria-label="Interview list sections" className="inline-flex w-fit gap-1 rounded-xl border border-border bg-background p-1">
              {([
                ["history", "History", screening.length],
                ["scheduled", "Scheduled", scheduled.length],
              ] as const).map(([id, label, count]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={listTab === id}
                  onClick={() => { setListTab(id); setCurrentPage(1); }}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13.5px] font-medium transition-colors",
                    listTab === id ? "bg-primary text-white shadow-[0_6px_16px_-8px_rgba(115,103,240,.8)]" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {id === "scheduled" ? <CalendarClock className="h-4 w-4" /> : null}
                  {label}
                  <Mono className={cn("text-[11px]", listTab === id ? "text-white/75" : "text-muted-foreground/70")}>{count}</Mono>
                </button>
              ))}
            </div>
          </ListHeader>

          {listTab === "history" ? (
            <RecentInterviewsList
              interviews={screening}
              currentPage={currentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
              onVideoUnavailable={() => setVideoUnavailableOpen(true)}
              onDelete={setDeleteConfirmId}
              emptyDescription={
                <>
                  Run your first round with a role and company in mind. When you want the full loop, add a{" "}
                  <Link href="/dashboard/peer-interviews" className="font-medium text-primary underline-offset-2 hover:underline">peer interview</Link>{" "}
                  or a{" "}
                  <Link href="/dashboard/coding-interviews" className="font-medium text-primary underline-offset-2 hover:underline">coding round</Link>.
                </>
              }
            />
          ) : scheduled.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <span className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><CalendarClock className="h-7 w-7" /></span>
              <h3 className="text-[17px] font-bold tracking-tight text-foreground">No scheduled interviews</h3>
              <p className="mx-auto mt-1.5 max-w-md text-[13.5px] text-muted-foreground">
                When your school schedules a round, the role, the window and a start button show up here. Same scoring as your own practice.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 p-5 md:p-6">
              {scheduled.map((s) => {
                const { canStart, reason } = scheduledInterviewCanStartNow(s.scheduledAt, s.expiresAt);
                const busy = startingScheduleId === String(s._id);
                return (
                  <div key={s._id} className="flex flex-col gap-3 rounded-[18px] border border-border bg-background/60 p-4 transition-colors hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-foreground">{s.role}</p>
                      <Mono className="text-[11px] text-primary">{instituteScheduleRoundLabel(s.roundType).toUpperCase()}</Mono>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(s.scheduledAt).toLocaleString()}</span>
                        {s.targetCompany ? <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{s.targetCompany}</span> : null}
                        {s.experience != null && s.experience > 0 ? <span>{s.experience} yrs experience</span> : null}
                        {s.interviewDuration ? <span>{s.interviewDuration} min</span> : null}
                      </p>
                      {s.expiresAt ? <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">Start by {new Date(s.expiresAt).toLocaleString()}</p> : null}
                      {s.notes ? <p className="mt-2 text-xs text-muted-foreground">{s.notes}</p> : null}
                      {!canStart && reason === "too_early" ? (
                        <p className="mt-1 text-xs text-muted-foreground">Opens {new Date(new Date(s.scheduledAt).getTime() - 24 * 60 * 60 * 1000).toLocaleString()}</p>
                      ) : null}
                      {!canStart && reason === "expired" ? <p className="mt-1 text-xs text-rose-600">Past expire deadline</p> : null}
                    </div>
                    <Button className="h-10 shrink-0 gap-2 rounded-xl" onClick={() => handleStartScheduled(String(s._id))} disabled={busy || !canStart}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                      Start interview
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this interview?</DialogTitle>
            <DialogDescription>This removes the session and any recording stored for it from our systems. You cannot undo this.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmId(null)} disabled={deleteBusy}>Cancel</Button>
            <Button type="button" variant="destructive" disabled={deleteBusy} onClick={() => void handleConfirmDeleteInterview()}>
              {deleteBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={videoUnavailableOpen} onOpenChange={setVideoUnavailableOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>No video available</DialogTitle>
            <DialogDescription>This interview does not have a recording, or the video could not be loaded. If you just finished the interview, try again in a few minutes.</DialogDescription>
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
