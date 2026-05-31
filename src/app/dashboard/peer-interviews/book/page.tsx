"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import {
  peerInterviewApi,
  type PeerAvailabilitySlot,
  type PeerEligibility,
  type PeerInterviewBooking,
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

export default function BookPeerInterviewPage() {
  const { isLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState<PeerEligibility | null>(null);
  const [slots, setSlots] = useState<PeerAvailabilitySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState<PeerInterviewBooking | null>(null);

  const [currentJobRole, setCurrentJobRole] = useState("");
  const [targetJobRole, setTargetJobRole] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [weekStart, setWeekStart] = useState(() => new Date());
  const [selectedSlot, setSelectedSlot] = useState<PeerAvailabilitySlot | null>(
    null
  );

  useEffect(() => {
    if (!isLoaded) return;
    peerInterviewApi
      .getEligibility()
      .then((e) => {
        setEligibility(e);
        if (!e.eligible) {
          toast.error(e.reason || "Not eligible");
        }
      })
      .catch(() => toast.error("Could not load eligibility"))
      .finally(() => setLoading(false));
  }, [isLoaded]);

  const loadSlots = async () => {
    setSlotsLoading(true);
    try {
      const { from, to } = weekRange(weekStart);
      const data = await peerInterviewApi.getAvailability(from, to, timezone);
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
    if (step === 3 && isLoaded) {
      loadSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, weekStart, timezone, isLoaded]);

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

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      const result = await peerInterviewApi.createBooking({
        currentJobRole: currentJobRole.trim(),
        targetJobRole: targetJobRole.trim(),
        scheduledAt: selectedSlot.scheduledAt,
        timezone,
        interviewerId: selectedSlot.interviewerId,
      });
      setBooking(result);
      setStep(4);
      toast.success("Booking submitted");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Booking failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  if (!eligibility?.eligible) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <p className="text-muted-foreground">{eligibility?.reason}</p>
        <Link href="/pricing">
          <Button className={institutePrimaryClass}>View Premium plans</Button>
        </Link>
        <Link href="/dashboard/peer-interviews" className="block text-sm text-primary">
          Back to peer interviews
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 pb-12">
      <Link
        href="/dashboard/peer-interviews"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="flex gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={cn(
              "h-1 flex-1 rounded-full",
              step >= n ? "bg-[#7367F0]" : "bg-muted"
            )}
          />
        ))}
      </div>

      {step === 1 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Your roles</CardTitle>
            <CardDescription>
              Help us match you with the right industry interviewer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current">Current job role</Label>
              <Input
                id="current"
                value={currentJobRole}
                onChange={(e) => setCurrentJobRole(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="target">Target job role</Label>
              <Input
                id="target"
                value={targetJobRole}
                onChange={(e) => setTargetJobRole(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="mt-1"
              />
            </div>
            <Button
              className={cn(institutePrimaryClass, "w-full")}
              disabled={!currentJobRole.trim() || !targetJobRole.trim()}
              onClick={() => setStep(2)}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Timezone</CardTitle>
            <CardDescription>Slots are shown in your selected timezone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tz">Timezone</Label>
              <select
                id="tz"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                className={cn(institutePrimaryClass, "flex-1")}
                onClick={() => setStep(3)}
              >
                Pick a time slot
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Available slots</CardTitle>
            <CardDescription>
              Times from verified interviewers only ({eligibility.used}/
              {eligibility.limit} used this period).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date(weekStart);
                  d.setDate(d.getDate() - 7);
                  setWeekStart(d);
                }}
              >
                Previous week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date(weekStart);
                  d.setDate(d.getDate() + 7);
                  setWeekStart(d);
                }}
              >
                Next week
              </Button>
            </div>
            {slotsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No open slots—ask admin to add interviewer availability or try another week.
              </p>
            ) : (
              <div className="max-h-[360px] space-y-4 overflow-y-auto">
                {[...slotsByDay.entries()].map(([day, daySlots]) => (
                  <div key={day}>
                    <p className="mb-2 text-sm font-medium text-muted-foreground">{day}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {daySlots.map((s) => {
                        const time = new Date(s.scheduledAt).toLocaleTimeString(
                          undefined,
                          { timeZone: timezone, hour: "2-digit", minute: "2-digit" }
                        );
                        const selected =
                          selectedSlot?.slotKey === s.slotKey;
                        return (
                          <button
                            key={s.slotKey}
                            type="button"
                            onClick={() => setSelectedSlot(s)}
                            className={cn(
                              "rounded-lg border p-3 text-left text-sm transition-colors",
                              selected
                                ? "border-[#7367F0] bg-[#7367F0]/10"
                                : "border-border hover:bg-muted/40"
                            )}
                          >
                            <p className="font-medium">{time}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.interviewerName} · {s.interviewerRole}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                className={cn(institutePrimaryClass, "flex-1")}
                disabled={!selectedSlot || submitting}
                onClick={() => setStep(4)}
              >
                Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && !booking && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Confirm booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Current role:</span>{" "}
              {currentJobRole}
            </p>
            <p>
              <span className="text-muted-foreground">Target role:</span>{" "}
              {targetJobRole}
            </p>
            {selectedSlot ? (
              <p>
                <span className="text-muted-foreground">When:</span>{" "}
                {new Date(selectedSlot.scheduledAt).toLocaleString(undefined, {
                  timeZone: timezone,
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </p>
            ) : null}
            {selectedSlot ? (
              <p>
                <span className="text-muted-foreground">Interviewer:</span>{" "}
                {selectedSlot.interviewerName}
              </p>
            ) : null}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                className={cn(institutePrimaryClass, "flex-1")}
                disabled={submitting}
                onClick={handleConfirm}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm booking"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && booking && (
        <Card className="border-emerald-200 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <CheckCircle className="h-5 w-5" />
              Booking {booking.status === "confirmed" ? "confirmed" : "received"}
            </CardTitle>
            <CardDescription>
              {booking.status === "pending_assignment"
                ? "We will assign an interviewer and email you shortly."
                : "Check your email for calendar invite and Meet link."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.meetLink ? (
              <Button asChild className={institutePrimaryClass}>
                <a href={booking.meetLink} target="_blank" rel="noopener noreferrer">
                  <Video className="mr-2 h-4 w-4" />
                  Open Google Meet
                </a>
              </Button>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Booking ID: {booking.bookingId}
            </p>
            <Button variant="outline" onClick={() => router.push("/dashboard/peer-interviews")}>
              Back to peer interviews
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
