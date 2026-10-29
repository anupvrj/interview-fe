"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  Loader2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { dash2026Scope, Eyebrow } from "@/components/dashboard-2026/ui";
import { ListHeader } from "@/components/dashboard-2026/PracticeHero";
import { Button } from "@/components/ui/button";
import { CandidateBookingsTable } from "@/components/peer/CandidateBookingsTable";
import { PeerMeetingJoinButton } from "@/components/peer/PeerMeetingJoinButton";
import { PeerTimezoneBadge, PeerTimezoneSelect } from "@/components/peer/PeerTimezoneSelect";
import { usePeerTimezone } from "@/components/peer/usePeerTimezone";
import { formatPeerSchedule } from "@/components/peer/peerSlotTime";
import { RecentInterviewsList } from "@/components/dashboard/RecentInterviewsList";
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
import { usePeerBookingsQuery } from "@/hooks/queries/usePeerBookingsQuery";
import { useDashboardInvalidation } from "@/hooks/useDashboardInvalidation";

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
  const { data: bookings = [], isLoading: bookingsLoading } =
    usePeerBookingsQuery();
  const { invalidate } = useDashboardInvalidation();
  const [types, setTypes] = useState<PeerInterviewType[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const loading = bookingsLoading || typesLoading;
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

  const loadInterviewTypes = async () => {
    setTypesLoading(true);
    try {
      const t = await peerApi.listInterviewTypes();
      setTypes(t);
    } finally {
      setTypesLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || !user) return;
    void loadInterviewTypes();
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
            await invalidate(["peerBookings", "entitlements"]);
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

  const card = "min-w-0 overflow-hidden rounded-[22px] border border-border bg-card";

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl min-w-0 space-y-5 overflow-x-hidden lg:space-y-6")}>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />

      {/* header: what you've booked, at a glance */}
      <section className={cn(card, "relative")}>
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_70%_at_8%_0%,rgba(115,103,240,.13),transparent_70%),radial-gradient(40%_70%_at_95%_20%,rgba(31,143,255,.09),transparent_70%)]" />
        <div className="relative p-6 md:p-8">
          <Link href="/dashboard/peer-interviews" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Peer interviews
          </Link>
          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <Eyebrow>MY BOOKINGS</Eyebrow>
              <h1 className="text-balance mt-4 text-[30px] font-black leading-[1.04] tracking-[-0.045em] text-foreground md:text-[40px]">Your peer interviews.</h1>
              <p className="text-balance mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground md:text-[16px]">
                Track requests, pay once they&apos;re accepted, and join your sessions from here.
              </p>
            </div>
            <Button asChild className="h-11 shrink-0 rounded-xl px-5 text-[14.5px] shadow-[0_10px_30px_-12px_rgba(115,103,240,.75)] hover:bg-primary/90">
              <Link href="/dashboard/peer-interviews/book"><Plus className="h-4 w-4" />Book an interview</Link>
            </Button>
          </div>
        </div>
        {!loading && bookings.length > 0 ? (
          <div className="relative grid grid-cols-2 border-t border-border md:grid-cols-4 md:divide-x md:divide-border [&>*:nth-child(-n+2)]:max-md:border-b [&>*:nth-child(odd)]:max-md:border-r">
            {[
              ["Bookings", String(stats.total), "all your peer interviews"],
              ["Payment due", String(stats.paymentDue), "accepted, pay to confirm"],
              ["Upcoming", String(stats.upcoming), "confirmed and scheduled"],
              ["Completed", String(stats.completed), "finished sessions"],
            ].map(([k, v, d]) => (
              <div key={k} className="border-border px-5 py-4 md:px-6">
                <p className="text-[12.5px] text-muted-foreground">{k}</p>
                <p className={cn("mt-1 font-[family-name:var(--font-geist-mono)] text-[24px] tracking-tight", k === "Payment due" && stats.paymentDue > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>{v}</p>
                <p className="text-[11.5px] text-muted-foreground/80">{d}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {loading ? (
        <div className={cn(card, "flex h-64 items-center justify-center")}>
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : bookings.length === 0 ? (
        <div className={cn(card, "flex flex-col items-center gap-3 px-6 py-16 text-center")}>
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/15 bg-gradient-to-br from-[#F1EEFF] to-[#E3EEFF] text-primary dark:from-primary/20 dark:to-sky-500/10">
            <CalendarClock className="h-8 w-8" />
          </span>
          <p className="text-[18px] font-bold tracking-tight">No bookings yet.</p>
          <p className="max-w-md text-[14px] text-muted-foreground">
            Find a verified interviewer, pick a slot, and get real mock interview practice.
          </p>
          <Button asChild className="mt-1 h-11 rounded-xl px-5">
            <Link href="/dashboard/peer-interviews/book">Find an interviewer</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* next session first, with the timezone it's shown in */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
            {nextUpcoming ? (
              <div className={cn(card, "flex flex-col gap-4 border-emerald-500/30 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6")}>
                <div className="min-w-0">
                  <p className="font-[family-name:var(--font-geist-mono)] text-[11px] text-emerald-600 dark:text-emerald-400">NEXT INTERVIEW</p>
                  <p className="mt-1 text-[18px] font-bold tracking-tight text-foreground">
                    {typeNames[nextUpcoming.interviewType] || nextUpcoming.interviewType}
                  </p>
                  <p className="mt-0.5 text-[13.5px] text-muted-foreground">
                    {formatPeerSchedule(nextUpcoming.start, timezone)} · Ref {nextUpcoming.bookingRef}
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
                      className="h-10 w-full rounded-xl disabled:opacity-60 sm:w-auto"
                    />
                  ) : null}
                  <Button asChild variant="outline" className="h-10 w-full rounded-xl sm:w-auto">
                    <Link href={`/dashboard/peer-interviews/bookings/${nextUpcoming.id}`}>
                      <Clock className="mr-2 h-4 w-4" /> View details
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className={cn(card, "flex items-center p-5 text-[14px] text-muted-foreground md:p-6")}>
                No confirmed session coming up. Requests and payments due are listed below.
              </div>
            )}
            <div className={cn(card, "p-5 md:p-6")}>
              <PeerTimezoneSelect
                timezone={timezone}
                onChange={setTimezone}
                disabled={tzLoading || savingTimezone}
                className="w-full min-w-0"
              />
              <PeerTimezoneBadge label={timezoneLabel} className="mt-3" />
            </div>
          </div>

          {activeBookings.length > 0 ? (
            <section className={card}>
              <ListHeader
                eyebrow="ACTIVE BOOKINGS"
                title={`${activeBookings.length} active booking${activeBookings.length === 1 ? "" : "s"}.`}
                description="Requests waiting for acceptance, bookings to pay for, and your confirmed sessions."
              />
              <div className="min-w-0 max-w-full overflow-hidden pb-4">
                <CandidateBookingsTable
                  bookings={activeBookings}
                  types={types}
                  typeNames={typeNames}
                  timezone={timezone}
                  payingId={payingId}
                  onPay={handlePay}
                />
              </div>
            </section>
          ) : null}

          <section className={card}>
            <ListHeader
              eyebrow="PREVIOUS INTERVIEWS"
              title="Finished, past and closed sessions."
              description="Scores and report links for every peer interview you've had."
            />
            <div className="min-w-0 max-w-full overflow-hidden">
              <RecentInterviewsList
                sessionRows={previousSessionRows}
                currentPage={previousPage}
                itemsPerPage={10}
                onPageChange={setPreviousPage}
                onVideoUnavailable={() => undefined}
                emptyDescription="Finished peer interviews will show up here with scores and report links."
                emptyCtaHref="/dashboard/peer-interviews/book"
                emptyCtaLabel="Book a peer interview"
                tableHeaders={[
                  "Interview",
                  "Scheduled on",
                  "Score",
                  "Status",
                  "Actions",
                ]}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
