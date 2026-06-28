"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Loader2, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PeerTimezoneBadge } from "@/components/peer/PeerTimezoneSelect";
import {
  buildSlotStartInTimezone,
  isSlotStartInPast,
  toDateInputValueInTimezone,
  toTimeInputValueInTimezone,
} from "@/components/peer/peerSlotTime";
import { cn } from "@/lib/utils";
import {
  peerApi,
  type PeerInterviewType,
  type PeerInterviewerProfile,
  type PeerSlot,
} from "@/lib/api";

export function InterviewerSlotFormDialog({
  open,
  onOpenChange,
  slot,
  createDay,
  profile,
  types,
  typeNames,
  timezone,
  timezoneLabel,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: PeerSlot | null;
  createDay?: Date;
  profile: PeerInterviewerProfile;
  types: PeerInterviewType[];
  typeNames: Record<string, string>;
  timezone: string;
  timezoneLabel: string;
  onSaved: () => void | Promise<void>;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("17:00");
  const [duration, setDuration] = useState(60);
  const [videoLink, setVideoLink] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const allowedTypes = useMemo(
    () => types.filter((t) => profile.canTakeTypes?.includes(t.key)),
    [types, profile],
  );

  const todayInTimezone = toDateInputValueInTimezone(new Date(), timezone);

  useEffect(() => {
    if (!open) return;
    if (slot) {
      const start = new Date(slot.start);
      setDate(toDateInputValueInTimezone(start, timezone));
      setTime(toTimeInputValueInTimezone(start, timezone));
      setDuration(slot.durationMins);
      setVideoLink(slot.videoLink ?? "");
      setSelectedTypes([...slot.availableForTypes]);
    } else {
      const day = createDay ?? new Date();
      setDate(toDateInputValueInTimezone(day, timezone));
      setTime("17:00");
      setDuration(60);
      setVideoLink("");
      setSelectedTypes([]);
    }
  }, [open, slot, createDay, timezone]);

  const toggleType = (key: string) => {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const saveSlot = async () => {
    if (!date || !time) {
      toast.error("Pick a date and time");
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error("Select at least one interview type");
      return;
    }
    if (!videoLink.trim()) {
      toast.error("Add a Google Meet or Zoom link");
      return;
    }
    const start = buildSlotStartInTimezone(date, time, timezone);
    if (isSlotStartInPast(start)) {
      toast.error("Choose a date and time in the future");
      return;
    }
    const end = new Date(start.getTime() + duration * 60000);
    setSaving(true);
    try {
      const body = {
        start: start.toISOString(),
        end: end.toISOString(),
        availableForTypes: selectedTypes,
        videoLink: videoLink.trim(),
      };
      if (slot) {
        await peerApi.updateSlot(slot.id, body);
        toast.success("Slot updated");
      } else {
        await peerApi.createSlot(body);
        toast.success("Slot created");
      }
      onOpenChange(false);
      await onSaved();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          (slot ? "Could not update slot" : "Could not create slot"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl gap-0 overflow-hidden overflow-y-auto p-0 sm:max-w-2xl">
        <div className="border-b border-border/60 bg-gradient-to-br from-[#7367F0]/10 to-transparent px-6 py-5 text-center">
          <DialogHeader className="space-y-0 text-center sm:text-center">
            <DialogTitle className="text-center text-xl font-semibold sm:text-2xl">
              {slot ? "Edit availability slot" : "Create availability slot"}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="space-y-6 px-6 py-5">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
                <Clock className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">Schedule</p>
                <p className="text-xs text-muted-foreground">Duration must be 30–60 minutes</p>
              </div>
              <PeerTimezoneBadge label={timezoneLabel} className="ml-auto shrink-0" />
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Label htmlFor="slot-date" className="text-xs font-medium text-muted-foreground">
                    Date
                  </Label>
                  <Input
                    id="slot-date"
                    type="date"
                    min={todayInTimezone}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-card"
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Label htmlFor="slot-time" className="text-xs font-medium text-muted-foreground">
                    Start time ({timezoneLabel})
                  </Label>
                  <Input
                    id="slot-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="bg-card"
                  />
                </div>
              </div>
              <div className="mt-3 flex min-w-0 flex-col gap-1.5">
                <Label htmlFor="slot-duration" className="text-xs font-medium text-muted-foreground">
                  Duration
                </Label>
                <AppSelect
                  id="slot-duration"
                  value={String(duration)}
                  onChange={(v) => setDuration(Number(v))}
                  options={[
                    { value: "30", label: "30 minutes" },
                    { value: "45", label: "45 minutes" },
                    { value: "60", label: "60 minutes" },
                  ]}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="slot-rounds" className="text-sm font-semibold">
                Interview rounds
              </Label>
              <p className="text-xs text-muted-foreground">
                Select every round you can take in this slot. Candidates pick one when booking.
              </p>
              <fieldset
                id="slot-rounds"
                className="overflow-hidden rounded-xl border border-border/60 bg-card"
              >
                <legend className="sr-only">Interview rounds</legend>
                {allowedTypes.map((t, index) => {
                  const checked = selectedTypes.includes(t.key);
                  return (
                    <label
                      key={t.key}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/30",
                        index > 0 && "border-t border-border/60",
                        checked && "bg-[#7367F0]/[0.04]",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleType(t.key)}
                          className="h-4 w-4 shrink-0 accent-[#7367F0]"
                        />
                        <span className="text-sm font-medium">{typeNames[t.key]}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-[#7367F0]">
                        ₹{profile.pricing?.[t.key] ?? "—"}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
                <Video className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">Meeting link</p>
                <p className="text-xs text-muted-foreground">Google Meet or Zoom URL for this session</p>
              </div>
            </div>
            <Input
              id="slot-video"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              placeholder="https://meet.google.com/…"
              className="w-full bg-card text-base sm:text-sm"
            />
          </section>
        </div>

        <div className="flex justify-end gap-2 border-t border-border/60 bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void saveSlot()}
            disabled={saving}
            className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {slot ? "Save changes" : "Create slot"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
