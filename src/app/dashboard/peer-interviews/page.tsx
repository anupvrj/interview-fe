"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle,
  CheckCircle2,
  IndianRupee,
  Loader2,
  Sparkles,
  Star,
  UsersRound,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CandidateBookingsTable } from "@/components/peer/CandidateBookingsTable";
import { SeoVideoPlayer } from "@/components/seo/SeoVideoPlayer";
import { usePeerTimezone } from "@/components/peer/usePeerTimezone";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";
import { appHeroBullet, appHeroCaption } from "@/lib/app-theme";
import { peerInterviewBookingDemoVideo } from "@/lib/seo/marketing-video-content";
import { isPreviousPeerBooking } from "@/lib/dashboard-recent-sessions";
import { isPeerInterviewExpired } from "@/lib/peer-booking-expiry";
import { cn } from "@/lib/utils";
import { peerApi, type PeerBooking, type PeerInterviewType } from "@/lib/api";
import { usePeerBookingsQuery } from "@/hooks/queries/usePeerBookingsQuery";
import { useDashboardInvalidation } from "@/hooks/useDashboardInvalidation";
import { useActiveRole } from "@/components/roles/ActiveRoleProvider";
import { useEntitlements } from "@/hooks/useEntitlements";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const BOOK_INTERVIEW_HREF = "/dashboard/peer-interviews/book";

function computeStats(bookings: PeerBooking[]) {
  const now = Date.now();
  let paymentDue = 0;
  let upcoming = 0;
  let completed = 0;

  for (const b of bookings) {
    if (b.status === "accepted_unpaid" && !isPeerInterviewExpired(b)) {
      paymentDue += 1;
    }
    if (b.status === "paid_confirmed" && new Date(b.start).getTime() >= now) {
      upcoming += 1;
    }
    if (b.status === "completed") completed += 1;
  }

  return {
    total: bookings.length,
    paymentDue,
    upcoming,
    completed,
  };
}

export default function PeerInterviewsLandingPage() {
  const router = useRouter();
  const roleCtx = useActiveRole();
  const { data: entitlements } = useEntitlements();
  const { isLoaded, user } = useUser();
  const { data: bookings = [], isLoading: bookingsLoading } =
    usePeerBookingsQuery();
  const { invalidate } = useDashboardInvalidation();
  const [types, setTypes] = useState<PeerInterviewType[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const loading = bookingsLoading || typesLoading;
  const [payingId, setPayingId] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { timezone } = usePeerTimezone();

  const loadInterviewTypes = async () => {
    setTypesLoading(true);
    try {
      const t = await peerApi.listInterviewTypes();
      setTypes(t);
    } catch {
      setTypes([]);
    } finally {
      setTypesLoading(false);
    }
  };

  useEffect(() => {
    if (!roleCtx?.ready || roleCtx?.activeRole !== "interviewer") return;
    router.replace("/dashboard/peer-interviews/interviewer");
  }, [roleCtx?.ready, roleCtx?.activeRole, router]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    localStorage.setItem("clerk-user-id", user.id);
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
        handler: async (resp: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await peerApi.verifyBookingPayment(booking.id, {
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            toast.success("Payment confirmed! Your interview is booked.");
            await invalidate(["peerBookings", "entitlements"]);
          } catch (e: unknown) {
            const message =
              e &&
              typeof e === "object" &&
              "response" in e &&
              e.response &&
              typeof e.response === "object" &&
              "data" in e.response &&
              e.response.data &&
              typeof e.response.data === "object" &&
              "message" in e.response.data &&
              typeof e.response.data.message === "string"
                ? e.response.data.message
                : "Payment verification failed";
            toast.error(message);
          }
        },
        modal: { ondismiss: () => setPayingId(null) },
      });
      rzp.open();
    } catch (e: unknown) {
      const message =
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "data" in e.response &&
        e.response.data &&
        typeof e.response.data === "object" &&
        "message" in e.response.data &&
        typeof e.response.data.message === "string"
          ? e.response.data.message
          : "Could not start payment";
      toast.error(message);
    } finally {
      setPayingId(null);
    }
  };

  const typeNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of types) m[t.key] = t.name;
    return m;
  }, [types]);

  const stats = useMemo(() => computeStats(bookings), [bookings]);

  const activeBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          !isPreviousPeerBooking(booking) && !isPeerInterviewExpired(booking),
      ),
    [bookings],
  );

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#7367F0]" />
          <p className="text-muted-foreground">Loading peer interviews…</p>
        </div>
      </div>
    );
  }

  if (roleCtx?.ready && roleCtx.activeRole === "interviewer") {
    return (
      <div className="flex h-48 items-center justify-center sm:h-64">
        <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />
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
              <UsersRound className="h-12 w-12 text-[#7367F0]/40 sm:h-16 sm:w-16" />
            </div>
          ))}
          {[...Array(6)].map((_, i) => (
            <div
              key={`video-${i}`}
              className="absolute"
              style={{
                left: `${(i * 18) % 100}%`,
                top: `${(i * 17) % 100}%`,
                opacity: 0.07,
                animation: `float-${i % 3} ${7 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.55}s`,
              }}
            >
              <Video className="h-10 w-10 text-[#7367F0]/30 sm:h-14 sm:w-14" />
            </div>
          ))}
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-4 text-center sm:space-y-5 md:space-y-6 lg:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#7367F0]/10 px-3 py-1 text-sm font-medium text-[#7367F0]">
                <Sparkles className="h-3 w-3" />
                <span>Peer Interviews</span>
              </div>

              {entitlements?.plan === "tech_pro" &&
              entitlements.peerInterviewsRemaining > 0 ? (
                <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  {entitlements.peerInterviewsRemaining} free interview
                  {entitlements.peerInterviewsRemaining === 1 ? "" : "s"} left
                  this period
                </span>
              ) : null}

              <h1 className="mb-4 text-2xl font-bold leading-[1.25] tracking-tight text-foreground sm:mb-6 sm:text-3xl sm:leading-[1.15] md:text-4xl lg:text-[34px] lg:leading-[42px]">
                <span className="text-foreground">Practice with</span>{" "}
                <span className="text-[#7367F0]">real engineers,</span>{" "}
                <span className="text-foreground">get</span>{" "}
                <span className="text-[#7367F0]">actionable feedback</span>
              </h1>

              <div className="space-y-3 px-2 pt-4 sm:px-0 sm:pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7367F0]" />
                  <span className={appHeroBullet}>
                    Book verified interviewers from top companies.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7367F0]" />
                  <span className={appHeroBullet}>
                    Live video mock interviews with structured feedback and
                    session recordings.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7367F0]" />
                  <span className={appHeroBullet}>
                    Pay only after your interviewer accepts — slots you can
                    trust.
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-3 px-2 pt-2 sm:flex-row sm:gap-4 lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className={cn(
                    institutePrimaryClass,
                    "h-auto w-full px-5 py-4 text-sm font-semibold shadow-lg transition-all hover:shadow-xl sm:w-auto sm:px-6 sm:py-5 sm:text-base",
                  )}
                >
                  <Link href={BOOK_INTERVIEW_HREF}>
                    Book Peer Interview
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
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
                  <span className={appHeroCaption}>4.9/5</span>
                </div>
              </div>
            </div>

            <div className="relative flex w-full justify-center lg:max-w-[480px] lg:justify-end">
              <SeoVideoPlayer
                videoUrl={peerInterviewBookingDemoVideo.videoUrl}
                title={peerInterviewBookingDemoVideo.name}
                thumbnailUrl={peerInterviewBookingDemoVideo.thumbnailUrl}
                className="w-full overflow-hidden rounded-xl border border-[#7367F0]/15 bg-card shadow-lg"
                autoPlay
                loop
                muted
              />
            </div>
          </div>
        </div>
      </section>

      {bookings.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2 xl:grid-cols-4">
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
      ) : null}

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Active bookings
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                Requests awaiting acceptance, payment, or your upcoming
                confirmed sessions.
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/peer-interviews/bookings">View all</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-4">
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
    </div>
  );
}
