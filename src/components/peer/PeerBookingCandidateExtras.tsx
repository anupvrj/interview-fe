"use client";

import {
  CalendarClock,
  Check,
  FileText,
  Hash,
  Layers,
  Video,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PeerBookingCardShell,
  PeerBookingInlineNote,
  PeerBookingMetric,
  PeerBookingPrepareItem,
} from "@/components/peer/PeerBookingCardShell";
import type { PeerBooking } from "@/lib/api";

type BookingStepState = "complete" | "current" | "upcoming";

export function getCandidateBookingSteps(status: PeerBooking["status"]) {
  const isPaid = status === "paid_confirmed" || status === "completed";

  const steps: Array<{ key: string; label: string; state: BookingStepState }> = [
    { key: "requested", label: "Requested", state: "complete" },
    {
      key: "accepted",
      label: "Accepted",
      state:
        status === "pending_acceptance"
          ? "current"
          : ["accepted_unpaid", "paid_confirmed", "completed"].includes(status)
            ? "complete"
            : "upcoming",
    },
    {
      key: "paid",
      label: "Paid",
      state: isPaid ? "complete" : status === "accepted_unpaid" ? "current" : "upcoming",
    },
    {
      key: "done",
      label: "Complete",
      state: status === "completed" ? "complete" : "upcoming",
    },
  ];

  return steps;
}

function stepShowsLabel(
  step: { key: string; state: BookingStepState },
  status: PeerBooking["status"],
): boolean {
  if (step.state === "upcoming") return false;
  if (status === "completed") return step.key === "done";
  return true;
}

export function PeerBookingProgressStepper({ status }: { status: PeerBooking["status"] }) {
  return <BookingProgressStepper status={status} />;
}

function BookingProgressStepper({ status }: { status: PeerBooking["status"] }) {
  if (["rejected", "cancelled", "refunded"].includes(status)) return null;

  const steps = getCandidateBookingSteps(status);
  const currentStep = steps.find((s) => s.state === "current");

  return (
    <div className="space-y-4">
      <div className="flex w-full items-start">
        {steps.map((step, index) => (
          <div key={step.key} className="contents">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 px-0.5">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                  step.state === "complete" && "bg-emerald-500 text-white",
                  step.state === "current" &&
                    "peer-booking-step-current border-2 border-[#7367F0] bg-[#7367F0]/10 text-[#7367F0]",
                  step.state === "upcoming" && "bg-muted text-muted-foreground",
                )}
              >
                {step.state === "complete" ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  index + 1
                )}
              </span>
              {stepShowsLabel(step, status) ? (
                <span
                  className={cn(
                    "max-w-[4.5rem] text-center text-[10px] font-semibold uppercase leading-tight tracking-wide sm:max-w-none",
                    step.state === "complete" &&
                      "text-emerald-700 dark:text-emerald-300",
                    step.state === "current" && "text-[#7367F0]",
                  )}
                >
                  {step.label}
                </span>
              ) : (
                <span className="h-3" aria-hidden />
              )}
            </div>
            {index < steps.length - 1 ? (
              <div className="flex min-w-[0.35rem] max-w-[2rem] flex-1 items-center self-start pt-3.5 sm:max-w-none">
                <span
                  className={cn(
                    "h-0.5 w-full rounded-full",
                    step.state === "complete" ? "bg-emerald-500" : "bg-border",
                  )}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {currentStep ? (
        <PeerBookingInlineNote tone="default">
          {status === "pending_acceptance" && "Waiting for interviewer to accept"}
          {status === "accepted_unpaid" && "Pay to confirm your slot"}
        </PeerBookingInlineNote>
      ) : null}
      {!currentStep && status === "paid_confirmed" ? (
        <PeerBookingInlineNote tone="default">Join at your scheduled time</PeerBookingInlineNote>
      ) : null}
      {status === "completed" ? (
        <PeerBookingInlineNote tone="emerald">Session complete</PeerBookingInlineNote>
      ) : null}
    </div>
  );
}

export function PeerBookingSessionDetailsCard({
  booking,
  interviewLabel,
}: {
  booking: PeerBooking;
  interviewLabel: string;
  scheduleLabel?: string;
  endTime?: string;
  durationMins?: number;
}) {
  return (
    <PeerBookingCardShell title="Session details" icon={Layers}>
      <div className="flex flex-wrap gap-2.5">
        <PeerBookingMetric label="Round" value={interviewLabel} className="min-w-[9rem]" />
        <PeerBookingMetric label="Ref" value={booking.bookingRef} mono />
        <PeerBookingMetric
          label="Booked"
          value={
            booking.createdAt
              ? new Date(booking.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—"
          }
        />
      </div>
    </PeerBookingCardShell>
  );
}

export function PeerCandidatePrepareCard({ canJoin }: { canJoin: boolean }) {
  const items = canJoin
    ? [
        { icon: Video, title: "Join from meeting room" },
        { icon: Wifi, title: "Quiet space & stable internet" },
        { icon: FileText, title: "Keep resume handy" },
      ]
    : [
        { icon: Video, title: "Link unlocks after payment" },
        { icon: Wifi, title: "Join a few minutes early" },
        { icon: FileText, title: "Prepare your resume" },
      ];

  return (
    <PeerBookingCardShell title="Before your interview" icon={Video}>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <PeerBookingPrepareItem key={item.title} icon={item.icon} title={item.title} />
        ))}
      </div>
    </PeerBookingCardShell>
  );
}

export function PeerCandidateSessionProgressCard({
  booking,
}: {
  booking: PeerBooking;
}) {
  return (
    <PeerBookingCardShell title="Session progress" icon={CalendarClock}>
      <PeerBookingProgressStepper status={booking.status} />
    </PeerBookingCardShell>
  );
}

export function PeerCandidateBookingTimelineCard({
  status,
}: {
  status: PeerBooking["status"];
}) {
  if (["rejected", "cancelled", "refunded"].includes(status)) return null;

  return (
    <PeerBookingCardShell title="Booking progress" icon={Hash}>
      <PeerBookingProgressStepper status={status} />
    </PeerBookingCardShell>
  );
}
