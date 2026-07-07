"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PeerBookingViewReportButton } from "@/components/peer/PeerBookingViewReportButton";
import { peerApi, type PeerBooking } from "@/lib/api";

export function PeerBookingReportButton({
  booking,
  canInteract,
  onUpdated,
  className,
  size = "default",
  timezone,
  interviewLabel,
}: {
  booking: PeerBooking;
  canInteract: boolean;
  onUpdated?: () => void | Promise<void>;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  timezone?: string;
  interviewLabel?: string;
}) {
  const [generating, setGenerating] = useState(false);

  if (!canInteract) return null;

  const isProcessing =
    booking.reportStatus === "processing" || booking.reportStatus === "pending";
  const canGenerate = booking.interviewerMarkedDone;

  if (booking.peerReportId) {
    return (
      <PeerBookingViewReportButton
        booking={booking}
        timezone={timezone}
        interviewLabel={interviewLabel}
        className={className}
        size={size}
      />
    );
  }

  if (isProcessing) {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Generating report…
      </Button>
    );
  }

  const generateReport = async () => {
    setGenerating(true);
    try {
      const result = await peerApi.generatePeerReport(booking.id);
      if (result.generated) {
        toast.success("Interview report generated");
      } else {
        toast.success("Interview report is ready");
      }
      await onUpdated?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not generate report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size={size}
      disabled={generating || !canGenerate}
      title={
        !canGenerate
          ? "Mark the interview done before generating a report"
          : undefined
      }
      onClick={() => void generateReport()}
      className={className}
    >
      {generating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileText className="mr-2 h-4 w-4" />
      )}
      Generate Report
    </Button>
  );
}
