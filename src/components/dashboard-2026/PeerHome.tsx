"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, CalendarClock, Clock, IndianRupee, Loader2, Plus, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CandidateBookingsTable } from "@/components/peer/CandidateBookingsTable";
import { SeoVideoPlayer } from "@/components/seo/SeoVideoPlayer";
import { usePeerTimezone } from "@/components/peer/usePeerTimezone";
import { peerInterviewBookingDemoVideo } from "@/lib/seo/marketing-video-content";
import { isPreviousPeerBooking } from "@/lib/dashboard-recent-sessions";
import { isPeerInterviewExpired } from "@/lib/peer-booking-expiry";
import { cn } from "@/lib/utils";
import { peerApi, type PeerBooking, type PeerInterviewType } from "@/lib/api";
import { usePeerBookingsQuery } from "@/hooks/queries/usePeerBookingsQuery";
import { useDashboardInvalidation } from "@/hooks/useDashboardInvalidation";
import { useActiveRole } from "@/components/roles/ActiveRoleProvider";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Emblem, Mono, type EmblemKind } from "@/components/marketing-2026/primitives";
import { useDashboardTheme } from "@/components/dashboard-theme";
import { dash2026Scope, EASE, Eyebrow } from "./ui";
import { ListHeader } from "./PracticeHero";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const BOOK_HREF = "/dashboard/peer-interviews/book";

/** A face for each round, picked from its key/name so admin-added rounds still get a sensible one. */
function roundEmblem(t: PeerInterviewType): EmblemKind {
  const k = `${t.key} ${t.name}`.toLowerCase();
  if (/cod|dsa|algorithm/.test(k)) return "code";
  if (/system|design|architect/.test(k)) return "whiteboard";
  if (/manager|leader/.test(k)) return "seats";
  if (/salary|negotiat|offer/.test(k)) return "spark";
  if (/screen|general/.test(k)) return "voice";
  return "peers";
}

function apiMessage(e: unknown, fallback: string) {
  const m = (e as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof m === "string" ? m : fallback;
}

export function PeerHome() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const roleCtx = useActiveRole();
  const { theme } = useDashboardTheme();
  const { data: entitlements } = useEntitlements();
  const { isLoaded, user } = useUser();
  const { data: bookings = [], isLoading: bookingsLoading } = usePeerBookingsQuery();
  const { invalidate } = useDashboardInvalidation();
  const [types, setTypes] = useState<PeerInterviewType[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { timezone } = usePeerTimezone();

  useEffect(() => {
    if (!roleCtx?.ready || roleCtx?.activeRole !== "interviewer") return;
    router.replace("/dashboard/peer-interviews/interviewer");
  }, [roleCtx?.ready, roleCtx?.activeRole, router]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    localStorage.setItem("clerk-user-id", user.id);
    setTypesLoading(true);
    peerApi
      .listInterviewTypes()
      .then(setTypes)
      .catch(() => setTypes([]))
      .finally(() => setTypesLoading(false));
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
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await peerApi.verifyBookingPayment(booking.id, {
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            toast.success("Payment confirmed! Your interview is booked.");
            await invalidate(["peerBookings", "entitlements"]);
          } catch (e: unknown) {
            toast.error(apiMessage(e, "Payment verification failed"));
          }
        },
        modal: { ondismiss: () => setPayingId(null) },
      });
      rzp.open();
    } catch (e: unknown) {
      toast.error(apiMessage(e, "Could not start payment"));
    } finally {
      setPayingId(null);
    }
  };

  const typeNames = useMemo(() => Object.fromEntries(types.map((t) => [t.key, t.name])) as Record<string, string>, [types]);
  const activeBookings = useMemo(
    () => bookings.filter((b) => !isPreviousPeerBooking(b) && !isPeerInterviewExpired(b)),
    [bookings],
  );
  const stats = useMemo(() => {
    const now = Date.now();
    return {
      total: bookings.length,
      paymentDue: bookings.filter((b) => b.status === "accepted_unpaid" && !isPeerInterviewExpired(b)).length,
      upcoming: bookings.filter((b) => b.status === "paid_confirmed" && new Date(b.start).getTime() >= now).length,
      completed: bookings.filter((b) => b.status === "completed").length,
    };
  }, [bookings]);

  // the one thing to act on next: pay, then the next confirmed session, then a request still waiting
  const nextUp = useMemo(() => {
    const now = Date.now();
    const soonest = (rows: PeerBooking[]) => [...rows].sort((a, b) => +new Date(a.start) - +new Date(b.start))[0];
    const due = soonest(activeBookings.filter((b) => b.status === "accepted_unpaid"));
    if (due) return { kind: "pay" as const, booking: due };
    const upcoming = soonest(activeBookings.filter((b) => b.status === "paid_confirmed" && new Date(b.end).getTime() >= now));
    if (upcoming) return { kind: "upcoming" as const, booking: upcoming };
    const pending = soonest(activeBookings.filter((b) => b.status === "pending_acceptance"));
    if (pending) return { kind: "pending" as const, booking: pending };
    return null;
  }, [activeBookings]);

  if (!isLoaded || bookingsLoading || typesLoading || (roleCtx?.ready && roleCtx.activeRole === "interviewer")) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading peer interviews…</p>
        </div>
      </div>
    );
  }

  const when = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: timezone || undefined });
  const freeLeft = entitlements?.plan === "tech_pro" ? entitlements.peerInterviewsRemaining : 0;
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.55, ease: EASE },
  });

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl space-y-5 lg:space-y-6")}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setRazorpayLoaded(true)} />

      {/* ── Hero */}
      <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_60%_at_10%_0%,rgba(115,103,240,.14),transparent_70%),radial-gradient(40%_60%_at_95%_30%,rgba(31,143,255,.10),transparent_70%)]" />
        <div className="relative grid items-center gap-8 p-6 md:p-9 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <motion.div {...rise(0)} className="flex flex-wrap items-center gap-3">
              <Eyebrow>PEER INTERVIEWS</Eyebrow>
              {freeLeft > 0 ? (
                <Mono className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10.5px] text-emerald-700 dark:text-emerald-300">
                  {freeLeft} FREE LEFT THIS PERIOD
                </Mono>
              ) : null}
            </motion.div>
            <motion.h1 {...rise(0.08)} className="text-balance mt-5 text-[32px] font-black leading-[1.03] tracking-[-0.05em] text-foreground sm:text-[42px] xl:text-[50px]">
              A real interviewer.{" "}
              <span className="bg-gradient-to-r from-[#7367F0] to-[#1F8FFF] bg-clip-text text-transparent">Honest feedback.</span>
            </motion.h1>
            <motion.p {...rise(0.16)} className="text-balance mt-4 max-w-[56ch] text-[15.5px] leading-relaxed text-muted-foreground md:text-[17px]">
              Book a live video mock with a verified interviewer, get structured feedback and a recording, and pay only after they accept your request.
            </motion.p>
            <motion.div {...rise(0.24)} className="mt-6 grid grid-cols-2 gap-2.5 sm:flex sm:gap-3">
              <Button asChild className="h-11 rounded-xl px-3 text-[14px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90 sm:px-5 sm:text-[14.5px]">
                <Link href={BOOK_HREF}><Plus className="h-4 w-4" />Book an interview</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-xl px-3 text-[14px] sm:px-5 sm:text-[14.5px]">
                <Link href="/dashboard/peer-interviews/bookings">My bookings</Link>
              </Button>
            </motion.div>
          </div>

          {/* next thing to do, or the booking demo when there's nothing yet */}
          <motion.div {...rise(0.3)}>
            {nextUp ? (
              <div className="rounded-2xl border border-border bg-background/70 p-5 shadow-[0_24px_50px_-30px_rgba(47,43,61,.45)] backdrop-blur">
                <Mono className={cn("text-[11px]", nextUp.kind === "pay" ? "text-amber-600 dark:text-amber-400" : nextUp.kind === "upcoming" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                  {nextUp.kind === "pay" ? "ACCEPTED · PAY TO CONFIRM" : nextUp.kind === "upcoming" ? "NEXT INTERVIEW" : "WAITING FOR THE INTERVIEWER"}
                </Mono>
                <p className="mt-2 text-[18px] font-bold tracking-tight text-foreground">{typeNames[nextUp.booking.interviewType] ?? "Peer interview"}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {when(nextUp.booking.start)}
                </p>
                <Mono className="mt-1 block text-[11px] text-muted-foreground/80">REF {nextUp.booking.bookingRef}</Mono>
                <div className="mt-4">
                  {nextUp.kind === "pay" ? (
                    <Button onClick={() => void handlePay(nextUp.booking)} disabled={payingId === nextUp.booking.id} className="h-10 w-full rounded-xl">
                      {payingId === nextUp.booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <IndianRupee className="h-4 w-4" />}
                      Pay {nextUp.booking.currency === "INR" ? "₹" : `${nextUp.booking.currency} `}{nextUp.booking.amount.toLocaleString("en-IN")} to confirm
                    </Button>
                  ) : nextUp.kind === "upcoming" && nextUp.booking.videoLink ? (
                    <Button asChild className="h-10 w-full rounded-xl">
                      <a href={nextUp.booking.videoLink} target="_blank" rel="noopener noreferrer"><Video className="h-4 w-4" />Join the call</a>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className="h-10 w-full rounded-xl">
                      <Link href={`/dashboard/peer-interviews/bookings/${nextUp.booking.id}`}>Open booking <ArrowRight className="h-4 w-4" /></Link>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <SeoVideoPlayer
                videoUrl={peerInterviewBookingDemoVideo.videoUrl}
                title={peerInterviewBookingDemoVideo.name}
                thumbnailUrl={peerInterviewBookingDemoVideo.thumbnailUrl}
                className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_50px_-30px_rgba(47,43,61,.45)]"
                autoPlay
                loop
                muted
              />
            )}
          </motion.div>
        </div>

        <motion.div {...rise(0.36)} className="relative grid grid-cols-2 border-t border-border md:grid-cols-4 md:divide-x md:divide-border [&>*:nth-child(-n+2)]:max-md:border-b [&>*:nth-child(odd)]:max-md:border-r">
          {[
            ["Bookings", String(stats.total), "all your peer interviews"],
            ["Payment due", String(stats.paymentDue), "accepted, pay to confirm"],
            ["Upcoming", String(stats.upcoming), "confirmed and scheduled"],
            ["Completed", String(stats.completed), "finished sessions"],
          ].map(([k, v, d]) => (
            <div key={k} className="border-border px-5 py-4 md:px-6">
              <p className="text-[12.5px] text-muted-foreground">{k}</p>
              <Mono className={cn("mt-1 block text-[24px] tracking-tight", k === "Payment due" && stats.paymentDue > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>{v}</Mono>
              <p className="text-[11.5px] text-muted-foreground/80">{d}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Rounds you can book (admin-set caps from the backend) */}
      {types.length > 0 ? (
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <Eyebrow>PICK A ROUND</Eyebrow>
              <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.035em] text-foreground md:text-[26px]">What do you want to rehearse?</h2>
            </div>
            <Link href={BOOK_HREF} className="shrink-0 text-[13.5px] font-medium text-primary hover:underline">Browse interviewers →</Link>
          </div>
          <div className={cn("mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2", types.length % 3 === 0 ? "xl:grid-cols-3" : "xl:grid-cols-4")}>
            {[...types].sort((a, b) => a.order - b.order).map((t, i) => (
              <motion.div key={t.key} {...rise(0.1 + i * 0.05)}>
                <Link
                  href={BOOK_HREF}
                  className="group flex h-full flex-col rounded-[18px] border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_24px_50px_-30px_rgba(115,103,240,.6)]"
                >
                  <Emblem kind={roundEmblem(t)} tone={theme === "dark" ? "dark" : "light"} />
                  <h3 className="mt-4 text-[16px] font-bold tracking-tight text-foreground">{t.name}</h3>
                  <p className="mt-1 flex-1 text-[13px] leading-relaxed text-muted-foreground">{t.shortDescription}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <Mono className="text-[11px] text-muted-foreground">{t.defaultDurationMins} MIN · UP TO ₹{t.maxPriceCap.toLocaleString("en-IN")}</Mono>
                    <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Active bookings */}
      <section className="overflow-hidden rounded-[22px] border border-border bg-card">
        <ListHeader
          eyebrow="ACTIVE BOOKINGS"
          title={activeBookings.length === 0 ? "Nothing booked yet." : `${activeBookings.length} active booking${activeBookings.length === 1 ? "" : "s"}.`}
          description="Requests waiting for acceptance, bookings to pay for, and your confirmed sessions."
        >
          <Button asChild variant="outline" className="h-10 rounded-xl px-4 text-[13.5px]">
            <Link href="/dashboard/peer-interviews/bookings"><CalendarClock className="h-4 w-4" />All bookings</Link>
          </Button>
        </ListHeader>
        <div className="pb-4">
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
    </div>
  );
}
