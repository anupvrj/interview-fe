"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  peerInterviewApi,
  type PeerAvailabilitySlot,
  type PeerInterviewBooking,
  type PeerReschedulePolicy,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";

const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Asia/Singapore",
  "UTC",
];

function weekRange(base: Date): { from: string; to: string } {
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 14);
  return { from: start.toISOString(), to: end.toISOString() };
}

function RescheduleContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const router = useRouter();
  const { isLoaded } = useUser();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<PeerInterviewBooking | null>(null);
  const [policy, setPolicy] = useState<PeerReschedulePolicy | null>(null);
  const [slots, setSlots] = useState<PeerAvailabilitySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [weekStart, setWeekStart] = useState(() => new Date());
  const [selectedSlot, setSelectedSlot] =
    useState<PeerAvailabilitySlot | null>(null);

  useEffect(() => {
    if (!isLoaded || !bookingId) return;
    peerInterviewApi
      .getBooking(bookingId)
      .then(({ booking: b, reschedule }) => {
        setBooking(b);
        setPolicy(reschedule);
        setTimezone(b.timezone || "Asia/Kolkata");
        if (!reschedule.allowed) {
          toast.error(reschedule.reason || "Cannot reschedule");
        }
      })
      .catch((e: unknown) => {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || "Could not load booking";
        toast.error(msg);
        router.push("/dashboard/peer-interviews");
      })
      .finally(() => setLoading(false));
  }, [isLoaded, bookingId, router]);

  const loadSlots = async () => {
    if (!bookingId) return;
    setSlotsLoading(true);
    try {
      const { from, to } = weekRange(weekStart);
      const data = await peerInterviewApi.getAvailability(
        from,
        to,
        timezone,
        bookingId
      );
      setSlots(data);
      if (data.length === 0) {
        toast.message("No slots in this range—try another week or timezone.");
      }
    } catch {
      toast.error("Could not load availability");
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && bookingId && policy?.allowed) {
      loadSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, timezone, isLoaded, bookingId, policy?.allowed]);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, PeerAvailabilitySlot[]>();
    for (const s of slots) {
      const day = new Date(s.scheduledAt).toLocaleDateString(undefined, {
        timeZone: timezone,
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(s);
    }
    return map;
  }, [slots, timezone]);

  const handleReschedule = async () => {
    if (!bookingId || !selectedSlot) return;
    setSubmitting(true);
    try {
      await peerInterviewApi.rescheduleBooking(bookingId, {
        scheduledAt: selectedSlot.scheduledAt,
        interviewerId: selectedSlot.interviewerId,
        timezone,
      });
      toast.success("Session rescheduled");
      router.push("/dashboard/peer-interviews");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Reschedule failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!bookingId) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-muted-foreground">Missing booking id.</p>
        <Link href="/dashboard/peer-interviews" className="mt-4 text-primary">
          Back
        </Link>
      </div>
    );
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  if (!booking || !policy) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 pb-12">
      <Link
        href="/dashboard/peer-interviews"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to peer interviews
      </Link>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#7367F0]" />
            Reschedule session
          </CardTitle>
          <CardDescription>
            {booking.targetJobRole} · up to {policy.remaining} reschedule
            {policy.remaining === 1 ? "" : "s"} left · must be at least 2 hours
            before the current session time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Current time:{" "}
            <span className="font-medium text-foreground">
              {new Date(booking.scheduledAt).toLocaleString(undefined, {
                timeZone: booking.timezone,
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </p>

          {!policy.allowed ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {policy.reason}
            </p>
          ) : (
            <>
              <div>
                <Label htmlFor="tz">Timezone</Label>
                <select
                  id="tz"
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const d = new Date(weekStart);
                    d.setDate(d.getDate() - 7);
                    setWeekStart(d);
                    setSelectedSlot(null);
                  }}
                >
                  Previous week
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const d = new Date(weekStart);
                    d.setDate(d.getDate() + 7);
                    setWeekStart(d);
                    setSelectedSlot(null);
                  }}
                >
                  Next week
                </Button>
              </div>

              {slotsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
                </div>
              ) : (
                <div className="max-h-[320px] space-y-4 overflow-y-auto">
                  {[...slotsByDay.entries()].map(([day, daySlots]) => (
                    <div key={day}>
                      <p className="mb-2 text-sm font-medium text-muted-foreground">
                        {day}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {daySlots.map((s) => {
                          const selected =
                            selectedSlot?.scheduledAt === s.scheduledAt &&
                            selectedSlot.interviewerId === s.interviewerId;
                          return (
                            <button
                              key={`${s.interviewerId}-${s.scheduledAt}`}
                              type="button"
                              onClick={() => setSelectedSlot(s)}
                              className={cn(
                                "rounded-md border px-3 py-2 text-left text-xs transition-colors",
                                selected
                                  ? "border-[#7367F0] bg-[#7367F0]/10"
                                  : "border-border hover:border-[#7367F0]/50"
                              )}
                            >
                              <span className="block font-medium">
                                {new Date(s.scheduledAt).toLocaleTimeString(
                                  undefined,
                                  {
                                    timeZone: timezone,
                                    hour: "numeric",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                              <span className="text-muted-foreground">
                                {s.interviewerName}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                className={cn("w-full", institutePrimaryClass)}
                disabled={!selectedSlot || submitting}
                onClick={handleReschedule}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rescheduling…
                  </>
                ) : (
                  "Confirm new time"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReschedulePeerInterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#7367F0]" />
        </div>
      }
    >
      <RescheduleContent />
    </Suspense>
  );
}
