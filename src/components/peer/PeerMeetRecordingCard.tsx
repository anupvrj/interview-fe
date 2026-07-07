"use client";

import { useState } from "react";
import { Loader2, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import { peerApi, type PeerBooking } from "@/lib/api";

function canShowRecording(booking: PeerBooking) {
  return (
    Boolean(booking.sessionRecording?.s3Key) ||
    Boolean(booking.meetArtifacts?.recordingAvailable)
  );
}

function useOpenPeerRecording(bookingId: string) {
  const [loading, setLoading] = useState(false);

  const openRecording = async () => {
    setLoading(true);
    try {
      const { url } = await peerApi.getRecordingVideoUrl(bookingId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Recording not ready yet");
    } finally {
      setLoading(false);
    }
  };

  return { loading, openRecording };
}

export function PeerMeetRecordingButton({
  booking,
  className,
  size = "default",
}: {
  booking: PeerBooking;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}) {
  const { loading, openRecording } = useOpenPeerRecording(booking.id);

  if (!canShowRecording(booking)) return null;

  return (
    <Button
      variant="outline"
      size={size}
      disabled={loading}
      onClick={() => void openRecording()}
      className={className}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Video className="mr-2 h-4 w-4" />
      )}
      View Recording
    </Button>
  );
}

export function PeerMeetRecordingCard({ booking }: { booking: PeerBooking }) {
  const hasSessionRecording = Boolean(booking.sessionRecording?.s3Key);

  if (!canShowRecording(booking)) return null;

  return (
    <div
      className={cn(
        appCard,
        "flex flex-wrap items-center justify-between gap-3 p-4",
      )}
    >
      <div className="flex items-start gap-3">
        <Video className="mt-0.5 h-5 w-5 text-[#7367F0]" />
        <div>
          <p className="text-sm font-medium">Session recording</p>
          <p className="text-xs text-muted-foreground">
            {hasSessionRecording
              ? "Interview screen recording captured during the session"
              : "Recording will appear after the session ends"}
          </p>
        </div>
      </div>
      <PeerMeetRecordingButton booking={booking} size="sm" />
    </div>
  );
}
