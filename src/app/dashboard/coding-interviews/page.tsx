"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
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
import {
  Plus,
  Code2,
  Loader2,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Star,
  Clock,
  Target,
  Percent,
  Award,
  Coins,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { codingInterviewApi, interviewApi, Interview } from "@/lib/api";
import { cn, sumInterviewCreditsUsed } from "@/lib/utils";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";
import { CodingRoundHeroPreview } from "@/components/coding-interviews/CodingRoundHeroPreview";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { RecentInterviewsList } from "@/components/dashboard/RecentInterviewsList";
import { SubscriptionExpiredDialog } from "@/components/SubscriptionExpiredDialog";
import { useSubscriptionExpiredGate } from "@/hooks/useSubscriptionExpiredGate";

const ITEMS_PER_PAGE = 10;

export default function CodingInterviewsPage() {
  const { user, isLoaded } = useUser();
  const [rows, setRows] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [videoUnavailableOpen, setVideoUnavailableOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const {
    open: subscriptionExpiredOpen,
    setOpen: setSubscriptionExpiredOpen,
    checking: checkingSubscription,
    navigateToNewSession,
  } = useSubscriptionExpiredGate();

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#7367F0]" />
          <p className="text-muted-foreground">Loading your coding sessions…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      {/* Hero — aligned with Practice Interview page */}
      <section className="relative overflow-hidden rounded-xl bg-[#7367F0]/[0.04] px-4 pb-8 pt-4 sm:px-6 sm:pb-12 sm:pt-6 md:pb-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
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
              <Code2 className="h-12 w-12 text-[#7367F0]/40 sm:h-16 sm:w-16" />
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
              <Terminal className="h-10 w-10 text-[#7367F0]/30 sm:h-14 sm:w-14" />
            </div>
          ))}
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-4 text-center sm:space-y-5 md:space-y-6 lg:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#7367F0]/10 px-3 py-1 text-sm font-medium text-[#7367F0]">
                <Sparkles className="h-3 w-3" />
                <span>Practice coding rounds</span>
              </div>
              <h1 className="mb-4 text-2xl font-bold leading-[1.25] tracking-tight text-slate-900 sm:mb-6 sm:text-3xl sm:leading-[1.15] md:text-4xl lg:text-[34px] lg:leading-[42px]">
                <span className="text-slate-900">Code</span>{" "}
                <span className="text-[#7367F0]">Interview-Style</span>{" "}
                <span className="text-slate-900">Problems</span>
                <br />
                <span className="text-slate-900">Then</span>{" "}
                <span className="text-[#7367F0]">Discuss</span>{" "}
                <span className="text-slate-900">With AI</span>
              </h1>

              <div className="space-y-3 px-2 pt-4 sm:px-0 sm:pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7367F0]" />
                  <span className="text-xs text-gray-700 sm:text-sm">
                    Three problems matched to your target company tier
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7367F0]" />
                  <span className="text-xs text-gray-700 sm:text-sm">
                    Monaco editor, run tests, then AI Interview Practice discussion
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7367F0]" />
                  <span className="text-xs text-gray-700 sm:text-sm">
                    Full report with coding + discussion scores
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-3 px-2 pt-2 sm:flex-row sm:gap-4 lg:justify-start">
                <Button
                  type="button"
                  size="lg"
                  disabled={checkingSubscription}
                  onClick={() =>
                    navigateToNewSession("/dashboard/coding-interviews/new")
                  }
                  className={cn(
                    institutePrimaryClass,
                    "h-auto w-full px-5 py-4 text-sm font-semibold shadow-lg transition-all hover:shadow-xl sm:w-auto sm:px-6 sm:py-5 sm:text-base",
                  )}
                >
                  {checkingSubscription ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Start new session
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
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

      {rows.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            theme="emerald"
            label="Total sessions"
            value={rows.length}
            icon={Code2}
            hint={
              <>
                <Clock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>All time</span>
              </>
            }
          />
          <DashboardStatCard
            theme="violet"
            label="Average score"
            value={scoredRows.length > 0 ? `${Math.round(averageScore)}/100` : "—"}
            icon={Target}
            progress={scoredRows.length > 0 ? Math.round(averageScore) : undefined}
            hint={
              <>
                <Percent className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>Out of 100</span>
              </>
            }
          />
          <DashboardStatCard
            theme="sky"
            label="Completed"
            value={completedCount}
            icon={Award}
            hint={
              <>
                <CheckCircle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>Finished sessions</span>
              </>
            }
          />
          <DashboardStatCard
            theme="amber"
            label="Credits used"
            value={totalCreditsUsed}
            icon={Coins}
            hint={
              <>
                <Coins className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>From billed sessions</span>
              </>
            }
          />
        </div>
      )}

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Coding round history
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {rows.length === 0
                  ? "Start a session to see it here."
                  : `${rows.length} session${rows.length === 1 ? "" : "s"} in your history`}
              </CardDescription>
            </div>
            <Button
              type="button"
              disabled={checkingSubscription}
              onClick={() =>
                navigateToNewSession("/dashboard/coding-interviews/new")
              }
              className={institutePrimaryClass}
            >
              {checkingSubscription ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Start new session
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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

      <SubscriptionExpiredDialog
        open={subscriptionExpiredOpen}
        onOpenChange={setSubscriptionExpiredOpen}
      />
    </div>
  );
}
