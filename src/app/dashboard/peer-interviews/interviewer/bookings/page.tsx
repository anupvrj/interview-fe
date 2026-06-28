"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Eye, Loader2, Star, Video } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookingStatusBadge } from "@/components/peer/BookingStatusBadge";
import { PendingBookingDetailsDialog } from "@/components/peer/PendingBookingDetailsDialog";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import { peerApi, type PeerBooking, type PeerInterviewType } from "@/lib/api";

export default function InterviewerBookingsPage() {
  const searchParams = useSearchParams();
  const showPendingOnly = searchParams.get("filter") === "pending";
  const [bookings, setBookings] = useState<PeerBooking[]>([]);
  const [types, setTypes] = useState<PeerInterviewType[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [feedbackFor, setFeedbackFor] = useState<PeerBooking | null>(null);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [detailsBookingId, setDetailsBookingId] = useState<string | null>(null);
  const [detailsTypeLabel, setDetailsTypeLabel] = useState<string | undefined>();

  const typeNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of types) m[t.key] = t.name;
    return m;
  }, [types]);

  const visibleBookings = useMemo(() => {
    if (!showPendingOnly) return bookings;
    return bookings.filter(
      (b) => b.status === "pending_acceptance" || b.status === "accepted_unpaid",
    );
  }, [bookings, showPendingOnly]);

  const load = async () => {
    setLoading(true);
    try {
      const [b, t] = await Promise.all([
        peerApi.listInterviewerBookings(),
        peerApi.listInterviewTypes(),
      ]);
      setBookings(b);
      setTypes(t);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const acceptBooking = async (bookingId: string) => {
    setBusyId(bookingId);
    try {
      await peerApi.acceptBooking(bookingId);
      toast.success("Booking accepted. The candidate can now pay.");
      setDetailsBookingId(null);
      setDetailsTypeLabel(undefined);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not accept");
      throw e;
    } finally {
      setBusyId(null);
    }
  };

  const declineBooking = async (bookingId: string, reason: string) => {
    setBusyId(bookingId);
    try {
      await peerApi.rejectBooking(bookingId, reason);
      toast.success("Booking rejected");
      setDetailsBookingId(null);
      setDetailsTypeLabel(undefined);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not reject");
      throw e;
    } finally {
      setBusyId(null);
    }
  };

  const openFeedback = (b: PeerBooking) => {
    setFeedbackFor(b);
    setRating(b.interviewerFeedback?.rating || 0);
    setComments(b.interviewerFeedback?.comments || "");
  };

  const submitFeedback = async () => {
    if (!feedbackFor || rating < 1) {
      toast.error("Select a rating");
      return;
    }
    setBusyId(feedbackFor.id);
    try {
      await peerApi.submitFeedback(feedbackFor.id, { rating, comments });
      toast.success("Feedback submitted");
      setFeedbackFor(null);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not submit feedback");
    } finally {
      setBusyId(null);
    }
  };

  const markDone = async (b: PeerBooking) => {
    setBusyId(b.id);
    try {
      await peerApi.markDone(b.id);
      toast.success("Marked done");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not mark done");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/peer-interviews/interviewer">
        <Button variant="ghost" className="w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </Link>
      <PageHeader
        title={showPendingOnly ? "Pending bookings" : "Booking requests"}
        badge="Interviewer"
        description={
          showPendingOnly
            ? "Requests awaiting your acceptance or candidate payment."
            : "Accept or decline requests, then run the interview and leave feedback."
        }
        actions={
          showPendingOnly ? (
            <Link href="/dashboard/peer-interviews/interviewer/bookings">
              <Button variant="outline">View all bookings</Button>
            </Link>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
        </div>
      ) : visibleBookings.length === 0 ? (
        <p className="text-muted-foreground">
          {showPendingOnly ? "No pending bookings." : "No bookings yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {visibleBookings.map((b) => {
            const canInteract = b.status === "paid_confirmed" || b.status === "completed";
            return (
              <div key={b.id} className={cn(appCard, "flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between")}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{typeNames[b.interviewType] || b.interviewType}</span>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(b.start).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · ₹{b.amount} · Ref {b.bookingRef}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {b.status === "pending_acceptance" || b.status === "accepted_unpaid" ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDetailsTypeLabel(typeNames[b.interviewType] || b.interviewType);
                        setDetailsBookingId(b.id);
                      }}
                    >
                      <Eye className="mr-1 h-4 w-4" /> View details
                    </Button>
                  ) : null}
                  {b.videoLink && b.status === "paid_confirmed" ? (
                    <a href={b.videoLink} target="_blank" rel="noreferrer">
                      <Button variant="outline">
                        <Video className="mr-2 h-4 w-4" /> Join
                      </Button>
                    </a>
                  ) : null}
                  {canInteract ? (
                    <>
                      <Button variant="outline" onClick={() => openFeedback(b)}>
                        <Star className="mr-2 h-4 w-4" />
                        {b.interviewerFeedback ? "Edit feedback" : "Feedback"}
                      </Button>
                      {!b.interviewerMarkedDone ? (
                        <Button variant="outline" onClick={() => void markDone(b)} disabled={busyId === b.id}>
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Mark done
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" /> Done
                        </span>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PendingBookingDetailsDialog
        bookingId={detailsBookingId}
        typeLabel={detailsTypeLabel}
        open={!!detailsBookingId}
        busyBookingId={busyId}
        onAccept={acceptBooking}
        onDecline={declineBooking}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsBookingId(null);
            setDetailsTypeLabel(undefined);
          }
        }}
      />

      {/* Feedback dialog */}
      <Dialog open={!!feedbackFor} onOpenChange={(o) => !o && setFeedbackFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interview feedback</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
                <Star
                  className={cn(
                    "h-7 w-7",
                    n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
                  )}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="How did the candidate perform?"
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFeedbackFor(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => void submitFeedback()}
              disabled={busyId === feedbackFor?.id}
              className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
            >
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
