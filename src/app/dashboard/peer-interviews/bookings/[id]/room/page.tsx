"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PeerMeetingRoom } from "@/components/peer/PeerMeetingRoom";
import { usePeerTimezone } from "@/components/peer/usePeerTimezone";
import { peerApi, type PeerBooking } from "@/lib/api";

function RoomLoadingSkeleton() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(115,103,240,0.12),transparent_55%)]"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 md:px-6 md:py-8">
        <div className="flex items-center justify-between">
          <div className="h-9 w-28 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-32 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-44 animate-pulse rounded-2xl bg-[#7367F0]/20 sm:h-48" />
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-3">
            <div className="h-6 w-40 animate-pulse rounded-lg bg-muted" />
            <div className="h-32 animate-pulse rounded-2xl bg-muted/70" />
            <div className="h-28 animate-pulse rounded-2xl bg-muted/70" />
            <div className="h-24 animate-pulse rounded-2xl bg-muted/70" />
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-muted/70 lg:col-span-2" />
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[#7367F0]" />
          Loading meeting room…
        </div>
      </div>
    </div>
  );
}

export default function PeerBookingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { timezone, timezoneLabel } = usePeerTimezone();

  const [booking, setBooking] = useState<PeerBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const b = await peerApi.getBooking(id);
        setBooking(b);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Could not load meeting room");
        router.replace("/dashboard/peer-interviews/bookings");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  if (loading || !booking) {
    return <RoomLoadingSkeleton />;
  }

  return (
    <PeerMeetingRoom
      booking={booking}
      timezone={timezone}
      timezoneLabel={timezoneLabel}
      onLeave={({ feedback } = {}) => {
        const q = feedback ? "?feedback=1" : "";
        if (booking.viewerRole === "interviewer") {
          router.push(`/dashboard/peer-interviews/interviewer/bookings${q}`);
          return;
        }
        router.push(`/dashboard/peer-interviews/bookings/${id}${q}`);
      }}
      onSessionComplete={() => {
        router.push(`/dashboard/peer-interviews/bookings/${id}`);
      }}
    />
  );
}
