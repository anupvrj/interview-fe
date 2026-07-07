"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isScoreBasedPeerReportBooking,
  PeerInterviewerScoreReportDialog,
} from "@/components/peer/PeerInterviewerScoreReportDialog";
import { peerApi, type PeerBooking } from "@/lib/api";

export function PeerBookingViewReportButton({
  booking,
  timezone,
  interviewLabel,
  className,
  size = "default",
  variant = "outline",
}: {
  booking: PeerBooking;
  timezone?: string;
  interviewLabel?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "link";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (isScoreBasedPeerReportBooking(booking)) {
      setOpen(true);
      return;
    }

    setLoading(true);
    try {
      const report = await peerApi.getPeerReport(booking.id);
      if (report?.transcriptSource === "interviewer_score") {
        setOpen(true);
        return;
      }
      router.push(`/dashboard/peer-interviews/bookings/${booking.id}/report`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={loading}
        onClick={() => void handleClick()}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        View report
      </Button>
      <PeerInterviewerScoreReportDialog
        booking={booking}
        open={open}
        onOpenChange={setOpen}
        timezone={timezone}
        interviewLabel={interviewLabel}
      />
    </>
  );
}

export function PeerBookingViewReportLink({
  booking,
  timezone,
  interviewLabel,
  className,
  children,
}: {
  booking: PeerBooking;
  timezone?: string;
  interviewLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;

    if (isScoreBasedPeerReportBooking(booking)) {
      setOpen(true);
      return;
    }

    setLoading(true);
    try {
      const report = await peerApi.getPeerReport(booking.id);
      if (report?.transcriptSource === "interviewer_score") {
        setOpen(true);
        return;
      }
      router.push(`/dashboard/peer-interviews/bookings/${booking.id}/report`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" onClick={(e) => void handleClick(e)} className={className}>
        {children}
      </button>
      <PeerInterviewerScoreReportDialog
        booking={booking}
        open={open}
        onOpenChange={setOpen}
        timezone={timezone}
        interviewLabel={interviewLabel}
      />
    </>
  );
}
