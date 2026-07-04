"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/peer/BookingStatusBadge";
import { PeerEarningCard } from "@/components/peer/PeerEarningCard";
import { AdminPeerBookingReassignDialog } from "@/components/peer/AdminPeerBookingReassignDialog";
import { AdminPeerBookingRefundDialog } from "@/components/peer/AdminPeerBookingRefundDialog";
import { appCard } from "@/lib/app-theme";
import { isPlatformAdmin } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";
import { userApi, peerApi, type PeerInterviewerCandidateScore } from "@/lib/api";

type AdminPeerBookingDetail = Awaited<ReturnType<typeof peerApi.admin.getBooking>>;

function FeedbackBox({
  title,
  fb,
}: Readonly<{ title: string; fb?: { rating: number; comments?: string } }>) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {fb ? (
        <>
          <p className="mt-1 text-sm font-semibold text-foreground">{fb.rating}/5</p>
          {fb.comments ? <p className="mt-1 text-sm text-muted-foreground">{fb.comments}</p> : null}
        </>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">Not submitted</p>
      )}
    </div>
  );
}

function CandidateScoreBox({
  score,
}: Readonly<{ score?: PeerInterviewerCandidateScore }>) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 sm:col-span-2">
      <p className="text-xs font-medium text-muted-foreground">Interviewer candidate scores</p>
      {score ? (
        <div className="mt-2 space-y-2">
          <p className="text-sm font-semibold text-foreground">
            Overall {score.overall}/100
          </p>
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <p className="text-muted-foreground">
              Technical: <span className="font-medium text-foreground">{score.technical}/100</span>
            </p>
            <p className="text-muted-foreground">
              Behavioural: <span className="font-medium text-foreground">{score.behaviour}/100</span>
            </p>
            <p className="text-muted-foreground">
              Communication:{" "}
              <span className="font-medium text-foreground">{score.communication}/100</span>
            </p>
          </div>
          {score.comments ? (
            <p className="text-sm text-muted-foreground">{score.comments}</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">Not submitted</p>
      )}
    </div>
  );
}

export default function AdminPeerBookingDetailPage() {
  const { isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminPeerBookingDetail | null>(null);
  const [acting, setActing] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const p = await userApi.getMyProfile();
        if (!isPlatformAdmin(p.accessRole ?? null)) {
          router.replace("/dashboard");
          return;
        }
        setAuthorized(true);
      } catch {
        router.replace("/dashboard");
      }
    })();
  }, [isLoaded, router]);

  const load = async () => {
    setLoading(true);
    try {
      const d = await peerApi.admin.getBooking(id);
      setDetail(d);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Failed to load booking");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, id]);

  const decidePayout = async (approve: boolean) => {
    if (!detail) return;
    setActing(true);
    try {
      await peerApi.admin.decidePayout(detail.id, approve);
      toast.success(approve ? "Payout approved" : "Payout rejected");
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setActing(false);
    }
  };

  const markPaidOut = async () => {
    if (!detail?.earning) return;
    setActing(true);
    try {
      await peerApi.admin.markEarningPaid(detail.earning.id);
      toast.success("Marked as paid out");
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setActing(false);
    }
  };

  if (!authorized) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild className="w-fit">
          <Link href="/dashboard/super-admin/peer-bookings">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to bookings
          </Link>
        </Button>
        <p className="text-muted-foreground">Booking not found.</p>
      </div>
    );
  }

  const canRefund =
    Boolean(detail.paymentId) ||
    detail.status === "paid_confirmed" ||
    detail.status === "completed";

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="w-fit">
        <Link href="/dashboard/super-admin/peer-bookings">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to bookings
        </Link>
      </Button>

      <PageHeader
        title={`Booking ${detail.bookingRef}`}
        badge="Oversight"
        description="Review booking details, manage payout, issue refunds, or reassign the interviewer."
        actions={
          <>
            {canRefund ? (
              <Button variant="outline" onClick={() => setRefundOpen(true)}>
                Refund candidate
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setReassignOpen(true)}>
              Reassign interviewer
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <BookingStatusBadge status={detail.status} />
            <span className="text-sm font-semibold tabular-nums text-foreground">₹{detail.amount}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={cn(appCard, "p-4")}>
              <p className="text-xs font-medium text-muted-foreground">Interviewer</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {detail.interviewer?.name || "—"}
                {detail.interviewer?.company ? ` (${detail.interviewer.company})` : ""}
              </p>
              {detail.interviewer?.email ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{detail.interviewer.email}</p>
              ) : null}
            </div>
            <div className={cn(appCard, "p-4")}>
              <p className="text-xs font-medium text-muted-foreground">Candidate</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {detail.candidate?.name || "—"}
                {detail.candidate?.email ? ` (${detail.candidate.email})` : ""}
              </p>
            </div>
            <div className={cn(appCard, "p-4 sm:col-span-2")}>
              <p className="text-xs font-medium text-muted-foreground">When</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {new Date(detail.start).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FeedbackBox title="Candidate feedback" fb={detail.candidateFeedback} />
            <FeedbackBox title="Interviewer feedback" fb={detail.interviewerFeedback} />
            <CandidateScoreBox score={detail.interviewerCandidateScore} />
          </div>

          {detail.refund?.status && detail.refund.status !== "none" ? (
            <p className="rounded-xl border border-orange-200/80 bg-orange-50/60 p-3 text-sm text-orange-800 dark:border-orange-900/40 dark:bg-orange-950/20 dark:text-orange-200">
              Refund {detail.refund.status}: ₹{detail.refund.amount} ({detail.refund.type})
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <CardTitle className="text-base font-semibold">Interviewer earning</CardTitle>
          <CardDescription className="text-sm">
            Net payout after 15% platform fee. Created when the interviewer marks the session done.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          {detail.earning ? (
            <>
              <PeerEarningCard earning={detail.earning} />
              <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                {detail.status === "completed" && detail.earning.status === "pending" ? (
                  <>
                    <Button
                      onClick={() => void decidePayout(true)}
                      disabled={acting}
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Approve payout (₹{detail.earning.amount})
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void decidePayout(false)}
                      disabled={acting}
                    >
                      Reject payout
                    </Button>
                  </>
                ) : null}
                {detail.earning.status === "approved" ? (
                  <Button
                    onClick={() => void markPaidOut()}
                    disabled={acting}
                    className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
                  >
                    Mark paid out
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Waiting for the interviewer to mark this interview done.
            </p>
          )}
        </CardContent>
      </Card>

      <AdminPeerBookingReassignDialog
        open={reassignOpen}
        bookingId={detail.id}
        onOpenChange={setReassignOpen}
        onReassigned={load}
      />

      {canRefund ? (
        <AdminPeerBookingRefundDialog
          open={refundOpen}
          bookingId={detail.id}
          amount={detail.amount}
          bookingRef={detail.bookingRef}
          onOpenChange={setRefundOpen}
          onRefunded={load}
        />
      ) : null}
    </div>
  );
}
