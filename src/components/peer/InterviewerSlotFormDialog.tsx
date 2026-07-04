"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Copy, Loader2, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PeerSlotSchedulePicker } from "@/components/peer/PeerSlotSchedulePicker";
import { PeerTimezoneBadge } from "@/components/peer/PeerTimezoneSelect";
import {
  buildSlotStartInTimezone,
  countFutureRecurringSlots,
  DEFAULT_PEER_RECURRING_WEEKS,
  expandWeeklyRecurringDates,
  isSlotStartInPast,
  parseDateInput,
  type PeerSlotScheduleMode,
  toDateInputValueInTimezone,
  toTimeInputValueInTimezone,
  weekdayOfDateParts,
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
  const [googleMeetSpaceName, setGoogleMeetSpaceName] = useState("");
  const [generatingMeet, setGeneratingMeet] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<PeerSlotScheduleMode>("once");
  const [recurringWeekdays, setRecurringWeekdays] = useState<number[]>([]);
  const [recurringWeeks, setRecurringWeeks] = useState(DEFAULT_PEER_RECURRING_WEEKS);

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
      setVideoLink(slot.googleMeetSpaceName ? (slot.videoLink ?? "") : "");
      setGoogleMeetSpaceName(slot.googleMeetSpaceName ?? "");
      setSelectedTypes([...slot.availableForTypes]);
    } else {
      const day = createDay ?? new Date();
      const dayStr = toDateInputValueInTimezone(day, timezone);
      const { year, month, day: dom } = parseDateInput(dayStr);
      setDate(dayStr);
      setTime("17:00");
      setDuration(60);
      setVideoLink("");
      setGoogleMeetSpaceName("");
      setSelectedTypes([]);
      setScheduleMode("once");
      setRecurringWeekdays([weekdayOfDateParts(year, month, dom)]);
      setRecurringWeeks(DEFAULT_PEER_RECURRING_WEEKS);
    }
  }, [open, slot, createDay, timezone]);

  const toggleType = (key: string) => {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const generateMeetLink = async () => {
    setGeneratingMeet(true);
    try {
      if (slot?.id) {
        const updated = await peerApi.generateMeetLink(slot.id);
        setVideoLink(updated.videoLink ?? "");
        setGoogleMeetSpaceName(updated.googleMeetSpaceName ?? "");
      } else {
        const created = await peerApi.createMeetSpace();
        setVideoLink(created.videoLink);
        setGoogleMeetSpaceName(created.googleMeetSpaceName);
      }
      toast.success("Google Meet link generated");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not generate Meet link");
    } finally {
      setGeneratingMeet(false);
    }
  };

  const copyMeetLink = async () => {
    if (!videoLink.trim()) return;
    await navigator.clipboard.writeText(videoLink.trim());
    toast.success("Meeting link copied");
  };

  const handleScheduleModeChange = (mode: PeerSlotScheduleMode) => {
    setScheduleMode(mode);
    if (mode === "weekly" && date) {
      const { year, month, day: dom } = parseDateInput(date);
      const dow = weekdayOfDateParts(year, month, dom);
      setRecurringWeekdays((prev) => (prev.includes(dow) ? prev : [...prev, dow].sort((a, b) => a - b)));
    }
  };

  const recurringCreateCount =
    !slot && scheduleMode === "weekly" && date && time
      ? countFutureRecurringSlots({
          fromDate: date,
          time,
          timezone,
          weekdays: recurringWeekdays,
          weeks: recurringWeeks,
        })
      : 0;

  const requiresMeetUpfront = Boolean(slot) || scheduleMode === "once";

  const saveSlot = async () => {
    if (!date || !time) {
      toast.error("Pick a date and time");
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error("Select at least one interview type");
      return;
    }
    if (requiresMeetUpfront && (!videoLink.trim() || !googleMeetSpaceName.trim())) {
      toast.error("Generate a Google Meet link before saving");
      return;
    }
    const start = buildSlotStartInTimezone(date, time, timezone);
    if (isSlotStartInPast(start)) {
      toast.error("Choose a date and time in the future");
      return;
    }
    if (!slot && scheduleMode === "weekly") {
      if (recurringWeekdays.length === 0) {
        toast.error("Select at least one day of the week");
        return;
      }
    }
    const end = new Date(start.getTime() + duration * 60000);
    const meetPayload = {
      videoLink: videoLink.trim(),
      googleMeetSpaceName: googleMeetSpaceName.trim(),
      videoLinkSource: "google_meet_api" as const,
    };
    setSaving(true);
    try {
      if (slot) {
        await peerApi.updateSlot(slot.id, {
          start: start.toISOString(),
          end: end.toISOString(),
          availableForTypes: selectedTypes,
          ...meetPayload,
        });
        toast.success("Slot updated");
      } else if (scheduleMode === "weekly") {
        const dates = expandWeeklyRecurringDates({
          fromDate: date,
          weekdays: recurringWeekdays,
          weeks: recurringWeeks,
        });
        const slots = dates
          .map((d) => {
            const slotStart = buildSlotStartInTimezone(d, time, timezone);
            if (isSlotStartInPast(slotStart)) return null;
            const slotEnd = new Date(slotStart.getTime() + duration * 60000);
            return { start: slotStart.toISOString(), end: slotEnd.toISOString() };
          })
          .filter((s): s is { start: string; end: string } => s !== null);

        if (slots.length === 0) {
          toast.error("No future slots match this schedule");
          return;
        }

        const result = await peerApi.createSlotsBulk({
          slots,
          availableForTypes: selectedTypes,
        });
        const skipped = result.skippedPast + result.skippedOverlap + result.skippedMeet;
        toast.success(
          skipped > 0
            ? `Created ${result.created.length} slots with unique Meet links (${skipped} skipped)`
            : `Created ${result.created.length} slots with unique Meet links`,
        );
      } else {
        await peerApi.createSlot({
          start: start.toISOString(),
          end: end.toISOString(),
          availableForTypes: selectedTypes,
          ...meetPayload,
        });
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

  const legacyManualSlot =
    Boolean(slot) && !slot?.googleMeetSpaceName && slot?.videoLinkSource === "manual";

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
              <PeerSlotSchedulePicker
                date={date}
                time={time}
                duration={duration}
                timezone={timezone}
                timezoneLabel={timezoneLabel}
                minDate={todayInTimezone}
                scheduleMode={scheduleMode}
                recurringWeekdays={recurringWeekdays}
                recurringWeeks={recurringWeeks}
                showScheduleMode={!slot}
                onDateChange={setDate}
                onTimeChange={setTime}
                onDurationChange={setDuration}
                onScheduleModeChange={handleScheduleModeChange}
                onRecurringWeekdaysChange={setRecurringWeekdays}
                onRecurringWeeksChange={setRecurringWeeks}
              />
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
                <p className="text-xs text-muted-foreground">
                  {requiresMeetUpfront
                    ? "Generate a Google Meet room with auto-transcription. Calendar invites are sent after payment when the interview is confirmed."
                    : "A unique Google Meet room is created automatically for each slot when you save this weekly schedule."}
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
              {legacyManualSlot ? (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  This slot uses a legacy custom link. Generate a Google Meet link to update it.
                </p>
              ) : null}

              {!requiresMeetUpfront ? (
                <p className="text-sm text-muted-foreground">
                  No need to generate a link now — each of the{" "}
                  {recurringCreateCount > 0 ? recurringCreateCount : "scheduled"} slots will get
                  its own Meet room.
                </p>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={generatingMeet}
                    onClick={() => void generateMeetLink()}
                    className="gap-1"
                  >
                    {generatingMeet ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Video className="h-3.5 w-3.5" />
                    )}
                    {videoLink ? "Regenerate Google Meet link" : "Generate Google Meet link"}
                  </Button>

                  {videoLink ? (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <a
                        href={videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 flex-1 break-all text-sm leading-relaxed text-[#7367F0] hover:underline"
                      >
                        {videoLink}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void copyMeetLink()}
                        className="h-8 shrink-0 px-2 text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        Copy
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      A Google Meet link is required for every slot.
                    </p>
                  )}
                </>
              )}
            </div>
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
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {scheduleMode === "weekly" && !slot
                  ? `Creating ${recurringCreateCount || ""} slots…`
                  : null}
              </>
            ) : null}
            {!saving &&
              (slot
                ? "Save changes"
                : scheduleMode === "weekly" && recurringCreateCount > 0
                  ? `Create ${recurringCreateCount} slots`
                  : "Create slot")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
