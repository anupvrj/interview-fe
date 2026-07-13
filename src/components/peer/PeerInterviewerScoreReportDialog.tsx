"use client";

import { BarChart3, CalendarClock, Hash, IndianRupee } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPeerSchedule } from "@/components/peer/peerSlotTime";
import { cn } from "@/lib/utils";
import type { PeerBooking, PeerInterviewerCandidateScore } from "@/lib/api";

const DIMENSIONS: Array<{
  key: keyof Pick<PeerInterviewerCandidateScore, "technical" | "behaviour" | "communication">;
  label: string;
}> = [
  { key: "technical", label: "Technical skills" },
  { key: "behaviour", label: "Behavioural" },
  { key: "communication", label: "Communication skills" },
];

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums text-foreground">{score}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/60">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500",
          )}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/15 px-3 py-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function PeerInterviewerScoreReportContent({
  booking,
  timezone,
  interviewLabel,
  className,
}: {
  booking: PeerBooking;
  timezone?: string;
  interviewLabel?: string;
  className?: string;
}) {
  const score = booking.interviewerCandidateScore;
  const label = interviewLabel ?? booking.interviewType.replace(/_/g, " ");
  const scheduleLabel = timezone
    ? formatPeerSchedule(booking.start, timezone)
    : new Date(booking.start).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
  const interviewerName =
    booking.interviewer?.name || booking.interviewerName || "Your interviewer";
  const candidateName = booking.candidate?.name || booking.candidateName || "Candidate";

  return (
    <div className={cn("space-y-5", className)}>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Booking details
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <DetailRow icon={Hash} label="Reference" value={booking.bookingRef} />
          <DetailRow icon={CalendarClock} label="Scheduled" value={scheduleLabel} />
          <DetailRow icon={BarChart3} label="Interview type" value={label} />
          <DetailRow icon={IndianRupee} label="Amount" value={`₹${booking.amount}`} />
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{interviewerName}</span>
          {booking.viewerRole === "candidate" ? " interviewed " : " evaluated "}
          <span className="font-medium text-foreground">{candidateName}</span>
        </p>
      </div>

      {score ? (
        <div className="space-y-4 rounded-2xl border border-[#7367F0]/20 bg-[#7367F0]/[0.04] p-4 sm:p-5">
          <div className="flex items-end gap-3 border-b border-border/40 pb-4">
            <span className="text-4xl font-bold tabular-nums leading-none text-[#7367F0]">
              {score.overall}
            </span>
            <div className="pb-0.5">
              <p className="text-sm font-medium text-foreground">Overall score</p>
              <p className="text-xs text-muted-foreground">out of 100</p>
            </div>
          </div>

          <div className="space-y-3">
            {DIMENSIONS.map(({ key, label: dimLabel }) => (
              <ScoreBar key={key} label={dimLabel} score={score[key]} />
            ))}
          </div>

          {score.comments ? (
            <blockquote className="rounded-xl border border-border/40 bg-background/60 px-3.5 py-2.5 text-sm leading-relaxed text-muted-foreground">
              &ldquo;{score.comments}&rdquo;
            </blockquote>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Interviewer scores are not available for this booking.
        </p>
      )}
    </div>
  );
}

export function PeerInterviewerScoreReportDialog({
  booking,
  open,
  onOpenChange,
  timezone,
  interviewLabel,
}: {
  booking: PeerBooking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timezone?: string;
  interviewLabel?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Interview report</DialogTitle>
          <DialogDescription>
            Based on your peer interviewer&apos;s evaluation. No Meet transcript was available for
            this session.
          </DialogDescription>
        </DialogHeader>
        <PeerInterviewerScoreReportContent
          booking={booking}
          timezone={timezone}
          interviewLabel={interviewLabel}
          className="py-1"
        />
      </DialogContent>
    </Dialog>
  );
}

export function isScoreBasedPeerReportBooking(booking: PeerBooking): boolean {
  if (booking.meetArtifacts?.transcriptAvailable === true) return false;
  return Boolean(booking.interviewerCandidateScore);
}
