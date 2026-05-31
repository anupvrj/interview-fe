"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Calendar,
  ExternalLink,
  Loader2,
  Sparkles,
  UserRound,
  UsersRound,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import {
  peerInterviewApi,
  userApi,
  type PeerInterviewBooking,
  type PeerEligibility,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";
import { getPeerReschedulePolicy } from "@/lib/peerInterviewReschedule";

const STEPS = [
  {
    title: "Book your slot",
    description: "Share your current and target role, then pick a time from real interviewer availability.",
  },
  {
    title: "Get matched",
    description: "We assign an industry expert interviewer aligned with your target role.",
  },
  {
    title: "Join on Google Meet",
    description: "Receive calendar invite and Meet link by email once your session is confirmed.",
  },
  {
    title: "Practice live",
    description: "60-minute mock interview with structured feedback from someone who has been there.",
  },
];

function formatBookingTime(iso: string, tz: string) {
  return new Date(iso).toLocaleString(undefined, {
    timeZone: tz,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function interviewerName(booking: PeerInterviewBooking): string {
  const iv = booking.interviewerId;
  if (iv && typeof iv === "object" && "name" in iv) return iv.name;
  return "Assigning…";
}

export default function PeerInterviewsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [eligibility, setEligibility] = useState<PeerEligibility | null>(null);
  const [bookings, setBookings] = useState<PeerInterviewBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const refresh = async () => {
    const [elig, list] = await Promise.all([
      peerInterviewApi.getEligibility(),
      peerInterviewApi.listMyBookings(),
    ]);
    setEligibility(elig);
    setBookings(list);
  };

  useEffect(() => {
    if (!isLoaded || !user) return;
    (async () => {
      try {
        const profile = await userApi.getMyProfile();
        if (
          profile.accessRole === "institution_admin" &&
          profile.institutionId
        ) {
          router.replace(
            `/dashboard/institute/${String(profile.institutionId)}`
          );
          return;
        }
        await refresh();
      } catch {
        setEligibility(null);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, user, router]);

  const upcoming = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status !== "cancelled" &&
          new Date(b.scheduledAt) > new Date() &&
          (b.status === "confirmed" || b.status === "pending_assignment")
      ),
    [bookings]
  );

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      await peerInterviewApi.cancelBooking(bookingId);
      toast.success("Booking cancelled");
      await refresh();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not cancel";
      toast.error(msg);
    } finally {
      setCancellingId(null);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  const canBook = eligibility?.eligible && (eligibility.used < eligibility.limit);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      <section className="relative overflow-hidden rounded-xl bg-[#7367F0]/[0.04] px-4 pb-8 pt-4 sm:px-6 sm:pb-12 sm:pt-6 md:pb-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${(i * 18) % 90}%`,
                top: `${(i * 22) % 85}%`,
                opacity: 0.09,
                animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              <UsersRound className="h-10 w-10 text-[#7367F0]/40 sm:h-14 sm:w-14" />
            </div>
          ))}
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-4 text-center lg:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#7367F0]/10 px-3 py-1 text-sm font-medium text-[#7367F0]">
                <Sparkles className="h-3 w-3" />
                <span>Premium · up to 2 sessions / billing period</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-[34px] lg:leading-[42px]">
                <span className="text-[#7367F0]">Peer Interviews</span> with
                industry experts
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Practice with real engineers from top companies—not AI. Book a
                live mock interview and get actionable feedback.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                {canBook ? (
                  <Link href="/dashboard/peer-interviews/book" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className={cn(
                        institutePrimaryClass,
                        "w-full sm:w-auto"
                      )}
                    >
                      Book your peer interview
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/pricing" className="w-full sm:w-auto">
                    <Button size="lg" className={cn(institutePrimaryClass, "w-full sm:w-auto")}>
                      Upgrade to Premium
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
              {eligibility && !eligibility.eligible && eligibility.reason ? (
                <p className="text-sm text-amber-700">{eligibility.reason}</p>
              ) : null}
            </div>
            <div className="flex justify-center">
              <div className="rounded-xl border border-border/60 bg-card p-6 shadow-card">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/12 text-violet-600">
                    <UserRound className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your plan</p>
                    <p className="text-lg font-semibold capitalize">
                      {eligibility?.plan ?? "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {eligibility?.used ?? 0} / {eligibility?.limit ?? 2} peer
                      sessions used
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <Card key={step.title} className="border-border/60 shadow-card">
            <CardHeader className="pb-2">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#7367F0]/10 text-sm font-bold text-[#7367F0]">
                {i + 1}
              </div>
              <CardTitle className="text-base">{step.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{step.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {upcoming.length > 0 ? (
        <Card className="border-[#7367F0]/20 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#7367F0]" />
              Upcoming session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((b) => (
              <div
                key={b.bookingId}
                className="flex flex-col gap-3 rounded-lg border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{b.targetJobRole}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatBookingTime(b.scheduledAt, b.timezone)} ·{" "}
                    {interviewerName(b)}
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">
                    Status: {b.status.replace("_", " ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {b.meetLink ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={b.meetLink} target="_blank" rel="noopener noreferrer">
                        <Video className="mr-1 h-4 w-4" />
                        Join Meet
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  ) : null}
                  {(() => {
                    const rs = getPeerReschedulePolicy(b);
                    return rs.allowed ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/dashboard/peer-interviews/reschedule?bookingId=${encodeURIComponent(b.bookingId)}`}
                        >
                          Reschedule ({rs.remaining} left)
                        </Link>
                      </Button>
                    ) : null;
                  })()}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cancellingId === b.bookingId}
                    onClick={() => handleCancel(b.bookingId)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <section>
        <h2 className="mb-4 text-lg font-semibold">Your bookings</h2>
        {bookings.length === 0 ? (
          <Card className="border-dashed shadow-card">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <UsersRound className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No peer interviews booked yet.</p>
              {canBook ? (
                <Link href="/dashboard/peer-interviews/book" className="mt-4">
                  <Button className={institutePrimaryClass}>
                    Book your first session
                  </Button>
                </Link>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Target role</th>
                  <th className="px-4 py-3 text-left font-medium">When</th>
                  <th className="px-4 py-3 text-left font-medium">Interviewer</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.bookingId} className="border-b last:border-0">
                    <td className="px-4 py-3">{b.targetJobRole}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatBookingTime(b.scheduledAt, b.timezone)}
                    </td>
                    <td className="px-4 py-3">{interviewerName(b)}</td>
                    <td className="px-4 py-3 capitalize">
                      {b.status.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {b.meetLink && b.status === "confirmed" ? (
                          <Button variant="link" size="sm" asChild className="h-auto p-0">
                            <a href={b.meetLink} target="_blank" rel="noopener noreferrer">
                              Meet link
                            </a>
                          </Button>
                        ) : null}
                        {b.status !== "cancelled" &&
                        new Date(b.scheduledAt) > new Date() ? (
                          <>
                            {getPeerReschedulePolicy(b).allowed ? (
                              <Button variant="link" size="sm" asChild className="h-auto p-0">
                                <Link
                                  href={`/dashboard/peer-interviews/reschedule?bookingId=${encodeURIComponent(b.bookingId)}`}
                                >
                                  Reschedule
                                </Link>
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={cancellingId === b.bookingId}
                              onClick={() => handleCancel(b.bookingId)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
