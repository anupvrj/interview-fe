"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PeerCalendarGrid } from "@/components/peer/PeerCalendarGrid";
import { PeerTimezoneBadge } from "@/components/peer/PeerTimezoneSelect";
import { formatPeerSchedule, isSlotStartInPast } from "@/components/peer/peerSlotTime";
import { peerApi, type PeerBooking, type PeerSlot } from "@/lib/api";
import { cn } from "@/lib/utils";

const RESCHEDULE_ONCE_NOTE =
  "Please note that you can only reschedule peer interview only once.";

export function RescheduleBookingDialog({
  booking,
  timezone,
  timezoneLabel,
  open,
  onOpenChange,
  onRescheduled,
}: {
  booking: PeerBooking;
  timezone: string;
  timezoneLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRescheduled: () => void | Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [slots, setSlots] = useState<PeerSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<PeerSlot | null>(null);

  const eligibleSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (slot.id === booking.slotId) return false;
      if (slot.status !== "open") return false;
      if (isSlotStartInPast(slot.start)) return false;
      if (!slot.availableForTypes.includes(booking.interviewType)) return false;
      if (booking.status === "paid_confirmed") {
        return slot.prices[booking.interviewType] === booking.amount;
      }
      return true;
    });
  }, [slots, booking]);

  useEffect(() => {
    if (!open) {
      setSelectedSlot(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void peerApi
      .getInterviewer(booking.interviewerId)
      .then((res) => {
        if (!cancelled) setSlots(res.slots);
      })
      .catch((e: any) => {
        if (!cancelled) {
          toast.error(e?.response?.data?.message || "Could not load available slots");
          onOpenChange(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, booking.interviewerId, onOpenChange]);

  const confirmReschedule = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      await peerApi.rescheduleBooking(booking.id, selectedSlot.id);
      toast.success("Interview rescheduled");
      onOpenChange(false);
      setSelectedSlot(null);
      await onRescheduled();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not reschedule booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule interview</DialogTitle>
          <DialogDescription>
            Pick another open slot with {booking.interviewer?.name || "your interviewer"}.{" "}
            {RESCHEDULE_ONCE_NOTE}{" "}
            {booking.status === "paid_confirmed"
              ? "Reschedule is available only more than 24 hours before your current interview time."
              : "You can pick any future open slot with the same interviewer while this booking is pending or awaiting payment."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarClock className="h-4 w-4 text-[#7367F0]" />
              <span className="text-muted-foreground">Current:</span>
              <span className="font-medium">
                {formatPeerSchedule(booking.start, timezone, { dateStyle: "full" })}
              </span>
            </div>
            <PeerTimezoneBadge label={timezoneLabel} />
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
            </div>
          ) : eligibleSlots.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
              No other eligible slots are available right now. Try again later or contact support.
            </p>
          ) : (
            <PeerCalendarGrid
              slots={eligibleSlots}
              mode="candidate"
              timezone={timezone}
              onSelectSlot={setSelectedSlot}
            />
          )}

          {selectedSlot ? (
            <div
              className={cn(
                "rounded-lg border border-[#7367F0]/30 bg-[#7367F0]/[0.06] px-4 py-3 text-sm",
              )}
            >
              <span className="text-muted-foreground">New time: </span>
              <span className="font-medium">
                {formatPeerSchedule(selectedSlot.start, timezone, { dateStyle: "full" })}
              </span>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => void confirmReschedule()}
            disabled={!selectedSlot || submitting}
            className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirm reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
