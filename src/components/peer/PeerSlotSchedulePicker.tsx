"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Repeat, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  buildDateInputMonthGrid,
  buildSlotStartInTimezone,
  countFutureRecurringSlots,
  dateInputFromParts,
  formatPeerSchedule,
  formatRecurringWeekdaySummary,
  isTimeOptionInPast,
  parseDateInput,
  PEER_RECURRING_WEEK_OPTIONS,
  PEER_SLOT_TIME_OPTIONS,
  PEER_WEEKDAY_LETTERS,
  PEER_WEEKDAY_NAMES,
  type PeerSlotScheduleMode,
  weekdayOfDateParts,
} from "@/components/peer/peerSlotTime";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
] as const;

function formatTimeLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function PeerSlotSchedulePicker({
  date,
  time,
  duration,
  timezone,
  timezoneLabel,
  minDate,
  scheduleMode,
  recurringWeekdays,
  recurringWeeks,
  onDateChange,
  onTimeChange,
  onDurationChange,
  onScheduleModeChange,
  onRecurringWeekdaysChange,
  onRecurringWeeksChange,
  showScheduleMode = true,
}: {
  date: string;
  time: string;
  duration: number;
  timezone: string;
  timezoneLabel: string;
  minDate: string;
  scheduleMode: PeerSlotScheduleMode;
  recurringWeekdays: number[];
  recurringWeeks: number;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onDurationChange: (duration: number) => void;
  onScheduleModeChange: (mode: PeerSlotScheduleMode) => void;
  onRecurringWeekdaysChange: (weekdays: number[]) => void;
  onRecurringWeeksChange: (weeks: number) => void;
  /** Hide one-time / weekly toggle when editing an existing slot. */
  showScheduleMode?: boolean;
}) {
  const parsed = date ? parseDateInput(date) : parseDateInput(minDate);
  const [cursorYear, setCursorYear] = useState(parsed.year);
  const [cursorMonth, setCursorMonth] = useState(parsed.month);

  useEffect(() => {
    if (!date) return;
    const p = parseDateInput(date);
    setCursorYear(p.year);
    setCursorMonth(p.month);
  }, [date]);

  const timeOptions = useMemo(() => {
    if (!time || PEER_SLOT_TIME_OPTIONS.includes(time)) return PEER_SLOT_TIME_OPTIONS;
    return [...PEER_SLOT_TIME_OPTIONS, time].sort();
  }, [time]);

  const monthCells = useMemo(
    () => buildDateInputMonthGrid(cursorYear, cursorMonth),
    [cursorYear, cursorMonth],
  );

  const shiftMonth = (dir: number) => {
    const next = new Date(cursorYear, cursorMonth - 1 + dir, 1);
    setCursorYear(next.getFullYear());
    setCursorMonth(next.getMonth() + 1);
  };

  const toggleWeekday = (dow: number) => {
    onRecurringWeekdaysChange(
      recurringWeekdays.includes(dow)
        ? recurringWeekdays.filter((d) => d !== dow)
        : [...recurringWeekdays, dow].sort((a, b) => a - b),
    );
  };

  const selectDate = (cellDate: string) => {
    onDateChange(cellDate);
    if (scheduleMode === "weekly") {
      const { year, month, day } = parseDateInput(cellDate);
      const dow = weekdayOfDateParts(year, month, day);
      if (!recurringWeekdays.includes(dow)) {
        onRecurringWeekdaysChange([...recurringWeekdays, dow].sort((a, b) => a - b));
      }
    }
  };

  const preview =
    date && time
      ? formatPeerSchedule(buildSlotStartInTimezone(date, time, timezone), timezone, {
          dateStyle: "full",
          timeStyle: "short",
        })
      : null;

  const recurringSlotCount =
    scheduleMode === "weekly" && date && time
      ? countFutureRecurringSlots({
          fromDate: date,
          time,
          timezone,
          weekdays: recurringWeekdays,
          weeks: recurringWeeks,
        })
      : 0;

  const weekdaySummary = formatRecurringWeekdaySummary(recurringWeekdays);

  return (
    <div className="space-y-4">
      {showScheduleMode ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Event type</p>
          <div className="inline-flex w-full overflow-hidden rounded-lg border border-border/70 bg-card p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => onScheduleModeChange("once")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none sm:min-w-[7rem]",
                scheduleMode === "once"
                  ? "bg-[#7367F0] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              One time
            </button>
            <button
              type="button"
              onClick={() => onScheduleModeChange("weekly")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none sm:min-w-[7rem]",
                scheduleMode === "weekly"
                  ? "bg-[#7367F0] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Repeat className="h-3.5 w-3.5" />
              Weekly
            </button>
          </div>
        </div>
      ) : null}

      {scheduleMode === "weekly" ? (
        <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
          <p className="mb-2.5 text-sm font-semibold">Repeat on</p>
          <div className="flex justify-between gap-1 sm:justify-start sm:gap-1.5">
            {PEER_WEEKDAY_LETTERS.map((letter, dow) => {
              const selected = recurringWeekdays.includes(dow);
              return (
                <button
                  key={`${PEER_WEEKDAY_NAMES[dow]}-${dow}`}
                  type="button"
                  aria-label={PEER_WEEKDAY_NAMES[dow]}
                  aria-pressed={selected}
                  onClick={() => toggleWeekday(dow)}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all sm:h-10 sm:w-10 sm:text-sm",
                    selected
                      ? "bg-[#7367F0] text-white shadow-[0_2px_8px_rgba(115,103,240,0.35)]"
                      : "border border-border/70 bg-card text-muted-foreground hover:border-[#7367F0]/40 hover:bg-[#7367F0]/[0.04] hover:text-foreground",
                  )}
                >
                  {letter}
                </button>
              );
            })}
          </div>
          {recurringWeekdays.length === 0 ? (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              Select at least one day of the week.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/20 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
              <CalendarDays className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-semibold">
              {scheduleMode === "weekly" ? "Starts" : "Date"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[9.5rem] text-center text-sm font-semibold tracking-tight">
              {monthLabel(cursorYear, cursorMonth)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-border/50 bg-muted/10">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-border/40 p-2">
          {monthCells.map((cell) => {
            const cellDate = dateInputFromParts(cell.year, cell.month, cell.day);
            const isSelected = date === cellDate;
            const isToday = cellDate === minDate;
            const isPast = cellDate < minDate;
            const disabled = !cell.inMonth || isPast;
            const cellDow = weekdayOfDateParts(cell.year, cell.month, cell.day);
            const isRecurringDay =
              scheduleMode === "weekly" && recurringWeekdays.includes(cellDow);

            return (
              <button
                key={cellDate}
                type="button"
                disabled={disabled}
                onClick={() => selectDate(cellDate)}
                className={cn(
                  "relative flex h-9 items-center justify-center rounded-lg text-sm font-medium tabular-nums transition-all",
                  !cell.inMonth && "text-muted-foreground/40",
                  cell.inMonth && !isSelected && !isPast && "text-foreground hover:bg-[#7367F0]/[0.06]",
                  isPast && cell.inMonth && "cursor-not-allowed text-muted-foreground/45",
                  isSelected &&
                    "bg-[#7367F0] text-white shadow-[0_2px_8px_rgba(115,103,240,0.35)] hover:bg-[#6e62e5]",
                  isToday && !isSelected && "ring-1 ring-[#7367F0]/40 ring-offset-1 ring-offset-card",
                  isRecurringDay &&
                    !isSelected &&
                    cell.inMonth &&
                    !isPast &&
                    "bg-[#7367F0]/[0.08] font-semibold text-[#7367F0]",
                )}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>

      {scheduleMode === "weekly" ? (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Repeat for</p>
          <div className="inline-flex w-full overflow-hidden rounded-lg border border-border/70 bg-card p-1 sm:w-auto">
            {PEER_RECURRING_WEEK_OPTIONS.map((weeks) => (
              <button
                key={weeks}
                type="button"
                onClick={() => onRecurringWeeksChange(weeks)}
                className={cn(
                  "flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none sm:min-w-[5rem]",
                  recurringWeeks === weeks
                    ? "bg-[#7367F0] text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {weeks} wk
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/20 px-3 py-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
            <Timer className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Start time</p>
            <p className="text-[11px] text-muted-foreground">{timezoneLabel}</p>
          </div>
        </div>

        <div className="max-h-44 overflow-y-auto p-3">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {timeOptions.map((slot) => {
              const isPast = isTimeOptionInPast(date, slot, timezone);
              const isSelected = time === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={!date || isPast}
                  onClick={() => onTimeChange(slot)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-xs font-semibold transition-all",
                    isSelected
                      ? "border-[#7367F0] bg-[#7367F0] text-white shadow-sm"
                      : "border-border/70 bg-card text-foreground hover:border-[#7367F0]/40 hover:bg-[#7367F0]/[0.04]",
                    isPast && "cursor-not-allowed border-transparent bg-muted/30 text-muted-foreground/50",
                  )}
                >
                  {formatTimeLabel(slot)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Duration</p>
        <div className="inline-flex w-full overflow-hidden rounded-lg border border-border/70 bg-card p-1 sm:w-auto">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onDurationChange(option.value)}
              className={cn(
                "flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none sm:min-w-[5.5rem]",
                duration === option.value
                  ? "bg-[#7367F0] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {scheduleMode === "once" && preview ? (
        <div className="rounded-lg border border-[#7367F0]/20 bg-[#7367F0]/[0.05] px-3 py-2.5 text-sm">
          <span className="text-muted-foreground">Scheduled for </span>
          <span className="font-semibold text-foreground">{preview}</span>
          <span className="text-muted-foreground"> · {duration} min</span>
        </div>
      ) : null}

      {scheduleMode === "weekly" && date && time && recurringWeekdays.length > 0 ? (
        <div className="rounded-lg border border-[#7367F0]/20 bg-[#7367F0]/[0.05] px-3 py-2.5 text-sm">
          <span className="font-semibold text-foreground">
            Every {weekdaySummary} at {formatTimeLabel(time)}
          </span>
          <span className="text-muted-foreground">
            {" "}
            · {recurringWeeks} weeks · {duration} min · {recurringSlotCount} slot
            {recurringSlotCount === 1 ? "" : "s"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
