"use client";

import { Clock, ExternalLink, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PeerTimezoneBadge } from "@/components/peer/PeerTimezoneSelect";
import { SlotStatusBadge } from "@/components/peer/SlotStatusBadge";
import { formatPeerSchedule, formatPeerTimeInTimezone } from "@/components/peer/peerSlotTime";
import type { PeerInterviewerProfile, PeerSlot } from "@/lib/api";

export function InterviewerSlotViewDialog({
  slot,
  open,
  onOpenChange,
  typeNames,
  profile,
  timezone,
  timezoneLabel,
  onEdit,
}: {
  slot: PeerSlot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeNames: Record<string, string>;
  profile: PeerInterviewerProfile | null;
  timezone: string;
  timezoneLabel: string;
  onEdit?: (slot: PeerSlot) => void;
}) {
  if (!slot) return null;

  const canEdit = slot.status === "open";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <div className="border-b border-border/60 bg-gradient-to-br from-[#7367F0]/10 to-transparent px-6 py-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold">Slot details</DialogTitle>
            <div className="flex flex-wrap items-center gap-2">
              <SlotStatusBadge status={slot.status} />
              <PeerTimezoneBadge label={timezoneLabel} />
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-[#7367F0]" />
              Schedule
            </div>
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="text-right font-medium">
                  {formatPeerSchedule(slot.start, timezone, { dateStyle: "full" })}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Time</dt>
                <dd className="text-right font-medium">
                  {formatPeerTimeInTimezone(slot.start, timezone)} –{" "}
                  {formatPeerTimeInTimezone(slot.end, timezone)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="font-medium">{slot.durationMins} minutes</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-semibold">Interview rounds</p>
            <ul className="space-y-2">
              {slot.availableForTypes.map((key) => (
                <li
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
                >
                  <span>{typeNames[key] ?? key}</span>
                  <span className="font-semibold tabular-nums text-[#7367F0]">
                    ₹{profile?.pricing?.[key] ?? slot.prices?.[key] ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {slot.videoLink ? (
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Video className="h-4 w-4 text-[#7367F0]" />
                Meeting link
              </div>
              <a
                href={slot.videoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 break-all text-sm text-[#7367F0] hover:underline"
              >
                {slot.videoLink}
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </section>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-border/60 bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canEdit && onEdit ? (
            <Button
              className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
              onClick={() => {
                onOpenChange(false);
                onEdit(slot);
              }}
            >
              Edit slot
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
