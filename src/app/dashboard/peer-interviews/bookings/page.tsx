"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useUser } from "@clerk/nextjs";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  IndianRupee,
  Loader2,
  Plus,
  Video,
} from "lucide-react";
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
import { CandidateBookingsTable } from "@/components/peer/CandidateBookingsTable";
import { PeerMeetingJoinButton } from "@/components/peer/PeerMeetingJoinButton";
import { PeerTimezoneBadge, PeerTimezoneSelect } from "@/components/peer/PeerTimezoneSelect";
import { usePeerTimezone } from "@/components/peer/usePeerTimezone";
import { formatPeerSchedule } from "@/components/peer/peerSlotTime";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { RecentInterviewsList } from "@/components/dashboard/RecentInterviewsList";
import { appCard } from "@/lib/app-theme";
import { isPeerInterviewExpired } from "@/lib/peer-booking-expiry";
import {
  buildPeerHistorySessionRows,
  isPreviousPeerBooking,
} from "@/lib/dashboard-recent-sessions";
import { cn } from "@/lib/utils";
import {
  peerApi,
  type PeerBooking,
  type PeerInterviewType,
} from "@/lib/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function computeStats(bookings: PeerBooking[]) {
  const now = Date.now();
  let paymentDue = 0;
  let upcoming = 0;
  let completed = 0;

  for (const b of bookings) {
    if (b.status === "accepted_unpaid" && !isPeerInterviewExpired(b)) paymentDue += 1;
    if (b.status === "paid_confirmed" && new Date(b.start).getTime() >= now) upcoming += 1;
    if (b.status === "completed") completed += 1;
  }

  return {
    total: bookings.length,
    paymentDue,
    upcoming,
    completed,
  };
}

export default function CandidateBookingsPage() {
  const { isLoaded, user } = useUser();
  const { timezone, setTimezone, saving: savingTimezone, timezoneLabel, loading: tzLoading } =
    usePeerTimezone();
  const [bookings, setBookings] = useState<PeerBooking[]>([]);
  const [types, setTypes] = useState<PeerInterviewType[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [previousPage, setPreviousPage] = useState(1);

  const typeNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of types) m[t.key] = t.name;
    return m;
  }, [types]);

  const stats = useMemo(() => computeStats(bookings), [bookings]);

  const { activeBookings, previousBookings } = useMemo(() => {
    const active: PeerBooking[] = [];
    const previous: PeerBooking[] = [];
    for (const booking of bookings) {
      if (isPreviousPeerBooking(booking) || isPeerInterviewExpired(booking)) {
        previous.push(booking);
      } else {
        active.push(booking);
      }
    }
    return { activeBookings: active, previousBookings: previous };
  }, [bookings]);

  const previousSessionRows = useMemo(
    () => buildPeerHistorySessionRows(previousBookings, typeNames),
    [previousBookings, typeNames],
  );

  const nextUpcoming = useMemo(() => {
    const now = Date.now();
    return bookings
      .filter((b) => b.status === "paid_confirmed" && new Date(b.start).getTime() >= now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
  }, [bookings]);

  const load = async () => {
    setLoading(true);
    try {
      const [b, t] = await Promise.all([
        peerApi.listMyBookings(),
        peerApi.listInterviewTypes(),
      ]);
      setBookings(b);
      setTypes(t);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || !user) return;
    void load();
  }, [isLoaded, user]);

  const handlePay = async (booking: PeerBooking) => {
    if (isPeerInterviewExpired(booking)) {
      toast.error("This interview has expired.");
      return;
    }
    if (!razorpayLoaded || !window.Razorpay) {
      toast.error("Payment is still loading, please try again.");
      return;
    }
    setPayingId(booking.id);
    try {
      const { order } = await peerApi.payBooking(booking.id);
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Interview Trix",
        description: `Peer interview — ${booking.bookingRef}`,
        theme: { color: "#7367F0" },
        handler: async (resp: any) => {
          try {
            await peerApi.verifyBookingPayment(booking.id, {
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            toast.success("Payment confirmed! Your interview is booked.");
            await load();
          } catch (e: any) {
            toast.error(e?.response?.data?.message || "Payment verification failed");
          }
        },
        modal: { ondismiss: () => setPayingId(null) },
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not start payment");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden space-y-4 sm:space-y-6">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />
      <PageHeader
        title="My peer interviews"
        badge="Bookings"
        description="Track your booking requests, pay once accepted, and join your interviews."
        className="min-w-0"
        actions={
          <>
            <Link href="/dashboard/peer-interviews" className="lg:hidden">
              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 shrink-0"
                aria-label="Book new interview"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/peer-interviews" className="hidden lg:block">
              <Button className="h-10 bg-[#7367F0] text-white hover:bg-[#6e62e5]">
                Book new interview
              </Button>
            </Link>
          </>
        }
      />

      {loading ? (
        <div className={cn(appCard, "flex h-64 items-center justify-center")}>
          <Loader2 className="h-7 w-7 animate-spin text-[#7367F0]" />
        </div>
      ) : bookings.length === 0 ? (
        <div className={cn(appCard, "flex flex-col items-center gap-3 px-6 py-16 text-center")}>
          <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#7367F0]/10 text-[#7367F0]">
            <CalendarClock className="h-8 w-8" />
          </span>
          <p className="text-lg font-semibold">No bookings yet</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Find a verified interviewer, pick a slot, and get real mock interview practice.
          </p>
          <Link href="/dashboard/peer-interviews">
            <Button className="bg-[#7367F0] text-white hover:bg-[#6e62e5]">Find an interviewer</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className={cn(appCard, "min-w-0 overflow-hidden p-3 sm:p-4")}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <PeerTimezoneSelect
                timezone={timezone}
                onChange={setTimezone}
                disabled={tzLoading || savingTimezone}
                className="w-full min-w-0 flex-1 lg:max-w-md"
              />
              <PeerTimezoneBadge label={timezoneLabel} className="self-start lg:self-auto" />
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <DashboardStatCard
              theme="purple"
              label="Total bookings"
              value={stats.total}
              icon={CalendarClock}
              hint={
                <>
                  <CalendarClock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span>All your peer interviews</span>
                </>
              }
            />
            <DashboardStatCard
              theme="amber"
              label="Payment due"
              value={stats.paymentDue}
              icon={IndianRupee}
              hint={
                <>
                  <IndianRupee className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span>Accepted — pay to confirm</span>
                </>
              }
            />
            <DashboardStatCard
              theme="emerald"
              label="Upcoming"
              value={stats.upcoming}
              icon={Video}
              hint={
                <>
                  <Video className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span>Confirmed &amp; scheduled</span>
                </>
              }
            />
            <DashboardStatCard
              theme="violet"
              label="Completed"
              value={stats.completed}
              icon={CheckCircle2}
              hint={
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span>Finished sessions</span>
                </>
              }
            />
          </div>

          {nextUpcoming ? (
            <div
              className={cn(
                appCard,
                "flex min-w-0 flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4",
              )}
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#7367F0]">
                  Next interview
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {typeNames[nextUpcoming.interviewType] || nextUpcoming.interviewType}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatPeerSchedule(nextUpcoming.start, timezone)} · Ref{" "}
                  {nextUpcoming.bookingRef}
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                {nextUpcoming.videoLink ? (
                  <PeerMeetingJoinButton
                    bookingId={nextUpcoming.id}
                    videoLink={nextUpcoming.videoLink}
                    start={nextUpcoming.start}
                    end={nextUpcoming.end}
                    timezone={timezone}
                    label="Join meeting room"
                    size="default"
                    variant="default"
                    className="w-full bg-[#7367F0] text-white hover:bg-[#6e62e5] disabled:opacity-60 sm:w-auto"
                  />
                ) : null}
                <Link
                  href={`/dashboard/peer-interviews/bookings/${nextUpcoming.id}`}
                  className="w-full sm:w-auto"
                >
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Clock className="mr-2 h-4 w-4" /> View details
                  </Button>
                </Link>
              </div>
            </div>
          ) : null}

          {activeBookings.length > 0 ? (
            <Card className="min-w-0 max-w-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
              <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold text-foreground sm:text-lg">
                    Active bookings
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs sm:text-sm">
                    Requests awaiting acceptance, payment, or your upcoming confirmed sessions.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="min-w-0 max-w-full overflow-hidden p-0 pb-4">
                <CandidateBookingsTable
                  bookings={activeBookings}
                  types={types}
                  typeNames={typeNames}
                  timezone={timezone}
                  payingId={payingId}
                  onPay={handlePay}
                />
              </CardContent>
            </Card>
          ) : null}

          <Card className="min-w-0 max-w-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
            <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <CardTitle className="text-base font-semibold text-foreground sm:text-lg">
                  Previous peer interviews
                </CardTitle>
                <CardDescription className="mt-1 text-xs sm:text-sm">
                  Completed, past, and closed peer sessions — same layout as your dashboard history.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="min-w-0 max-w-full overflow-hidden p-0">
              <RecentInterviewsList
                sessionRows={previousSessionRows}
                currentPage={previousPage}
                itemsPerPage={10}
                onPageChange={setPreviousPage}
                onVideoUnavailable={() => undefined}
                emptyDescription="Finished peer interviews will show up here with scores and report links."
                emptyCtaHref="/dashboard/peer-interviews"
                emptyCtaLabel="Book a peer interview"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
