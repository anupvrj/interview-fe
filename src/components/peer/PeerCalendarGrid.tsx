"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PeerSlot } from "@/lib/api";
import { DEFAULT_PEER_TIMEZONE, isSlotStartInPast } from "@/components/peer/peerSlotTime";
import {
  canEditInterviewerSlot,
  isPeerSlotReserved,
} from "@/lib/peer-slot-guards";

type View = "day" | "week" | "month";

const VIEW_OPTIONS: View[] = ["day", "week", "month"];

interface PeerCalendarGridProps {
  slots: PeerSlot[];
  mode: "interviewer" | "candidate";
  timezone?: string;
  /** Drop outer border/shadow when nested inside a parent Card */
  embedded?: boolean;
  /** Interviewer: clicking an empty day cell to create a slot */
  onCreate?: (date: Date) => void;
  /** Candidate: clicking an available (green) slot */
  onSelectSlot?: (slot: PeerSlot) => void;
  /** Interviewer: delete an open slot */
  onDeleteSlot?: (slot: PeerSlot) => void;
  /** Interviewer: edit an open slot */
  onEditSlot?: (slot: PeerSlot) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function fmtTime(d: string, timeZone: string) {
  return new Date(d).toLocaleTimeString("en-IN", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Very light weekday column tints (Sun → Sat). */
const WEEKDAY_TONES = [
  "bg-rose-50/40 dark:bg-rose-950/20",
  "bg-sky-50/35 dark:bg-sky-950/20",
  "bg-violet-50/30 dark:bg-violet-950/20",
  "bg-muted/30 dark:bg-muted/20",
  "bg-cyan-50/30 dark:bg-cyan-950/20",
  "bg-indigo-50/25 dark:bg-indigo-950/20",
  "bg-fuchsia-50/25 dark:bg-fuchsia-950/20",
] as const;

function getDayCellTone(
  day: Date,
  inMonth: boolean,
  isPast: boolean,
  isToday: boolean,
  daySlots: PeerSlot[],
): string {
  if (!inMonth) return "bg-muted/15 dark:bg-muted/10";

  const hasOpen = daySlots.some((s) => s.status === "open" && !s.bookingId);
  const hasBooked = daySlots.some((s) => isPeerSlotReserved(s));

  if (hasOpen) return "bg-emerald-50/80 dark:bg-emerald-950/25";
  if (isToday) return "bg-[#7367F0]/[0.05]";
  if (hasBooked) return "bg-amber-50/45 dark:bg-amber-950/20";
  if (isPast) return "bg-muted/25 dark:bg-muted/15";

  return WEEKDAY_TONES[day.getDay()];
}

export function PeerCalendarGrid({
  slots,
  mode,
  timezone = DEFAULT_PEER_TIMEZONE,
  embedded = false,
  onCreate,
  onSelectSlot,
  onDeleteSlot,
  onEditSlot,
}: PeerCalendarGridProps) {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => new Date());

  const slotsByDay = useMemo(() => {
    const map = new Map<string, PeerSlot[]>();
    for (const s of slots) {
      const day = new Date(s.start).toDateString();
      const arr = map.get(day) || [];
      arr.push(s);
      map.set(day, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }
    return map;
  }, [slots]);

  const monthCells = useMemo(() => {
    const first = startOfMonth(cursor);
    const startOffset = first.getDay();
    const gridStart = addDays(first, -startOffset);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [cursor]);

  const weekCells = useMemo(() => {
    const start = addDays(cursor, -cursor.getDay());
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const label =
    view === "month"
      ? cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
      : view === "week"
        ? `Week of ${addDays(cursor, -cursor.getDay()).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}`
        : cursor.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          });

  const shift = (dir: number) => {
    setCursor((c) => {
      if (view === "month") return new Date(c.getFullYear(), c.getMonth() + dir, 1);
      if (view === "week") return addDays(c, dir * 7);
      return addDays(c, dir);
    });
  };

  const renderSlotChip = (slot: PeerSlot, compact = true) => {
    const reserved = isPeerSlotReserved(slot);
    const past = isSlotStartInPast(slot.start);
    const clickable = mode === "candidate" && !reserved && !past;

    if (!compact) {
      return (
        <div
          key={slot.id}
          className={cn(
            "group flex items-center justify-between gap-3 rounded-lg border px-3 py-3",
            past && mode === "candidate"
              ? "border-border bg-muted/30 text-muted-foreground"
              : reserved
                ? "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-200"
                : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200",
          )}
        >
          <button
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onSelectSlot?.(slot)}
            className={cn("min-w-0 flex-1 text-left", clickable && "hover:opacity-90")}
          >
            <p className="text-sm font-semibold">
              {fmtTime(slot.start, timezone)} – {fmtTime(slot.end, timezone)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {slot.durationMins} min · {reserved ? "Booked" : past ? "Past" : "Available"}
            </p>
          </button>
          {mode === "interviewer" && canEditInterviewerSlot(slot) ? (
            <span className="flex shrink-0 items-center gap-1">
              {onEditSlot ? (
                <button
                  type="button"
                  onClick={() => onEditSlot(slot)}
                  className="rounded-md p-1.5 text-[#7367F0] hover:bg-[#7367F0]/10"
                  aria-label="Edit slot"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              ) : null}
              {onDeleteSlot ? (
                <button
                  type="button"
                  onClick={() => onDeleteSlot(slot)}
                  className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                  aria-label="Delete slot"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </span>
          ) : null}
        </div>
      );
    }

    return (
      <div
        key={slot.id}
        className={cn(
          "group flex items-center justify-between gap-1 rounded-md border px-1.5 py-1 text-[11px] font-medium",
          past && mode === "candidate"
            ? "border-border bg-muted/40 text-muted-foreground"
            : reserved
              ? "border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-200"
              : "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200",
        )}
      >
        <button
          type="button"
          disabled={!clickable}
          onClick={() => clickable && onSelectSlot?.(slot)}
          className={cn("min-w-0 flex-1 truncate text-left", clickable && "hover:underline")}
          title={
            past && mode === "candidate"
              ? "Past slot — cannot book"
              : reserved
                ? "Booked"
                : "Available — click to book"
          }
        >
          {fmtTime(slot.start, timezone)}
        </button>
        {mode === "interviewer" && canEditInterviewerSlot(slot) ? (
          <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            {onEditSlot ? (
              <button
                type="button"
                onClick={() => onEditSlot(slot)}
                className="rounded p-0.5 text-[#7367F0] hover:bg-[#7367F0]/10"
                aria-label="Edit slot"
              >
                <Pencil className="h-3 w-3" />
              </button>
            ) : null}
            {onDeleteSlot ? (
              <button
                type="button"
                onClick={() => onDeleteSlot(slot)}
                className="rounded p-0.5 text-red-600 hover:bg-red-50"
                aria-label="Delete slot"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            ) : null}
          </span>
        ) : null}
      </div>
    );
  };

  const renderDayPanel = (day: Date) => {
    const isPast = startOfDay(day) < startOfDay(new Date());
    const isToday = sameDay(day, new Date());
    const daySlots = slotsByDay.get(day.toDateString()) || [];
    const canCreate = mode === "interviewer" && !isPast;

    return (
      <div
        className={cn(
          "border-b border-border/60 p-4 sm:p-5",
          getDayCellTone(day, true, isPast, isToday, daySlots),
        )}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {day.toLocaleDateString("en-IN", { weekday: "long" })}
            </p>
            <p className="text-lg font-semibold text-foreground sm:text-xl">
              {day.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {daySlots.length === 0
                ? "No slots"
                : `${daySlots.length} slot${daySlots.length === 1 ? "" : "s"}`}
            </p>
          </div>
          {canCreate ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onCreate?.(day)}
              className="gap-1.5 border-[#7367F0]/30 text-[#7367F0] hover:bg-[#7367F0]/10"
            >
              <Plus className="h-4 w-4" />
              Add slot
            </Button>
          ) : null}
        </div>

        {daySlots.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/70 bg-card/60 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {canCreate ? "No slots on this day. Add one to get started." : "No slots on this day."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">{daySlots.map((slot) => renderSlotChip(slot, false))}</div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "overflow-hidden",
        !embedded && "rounded-xl border border-border/80 bg-card shadow-card",
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span
            className={cn(
              "min-w-0 text-center text-sm font-semibold tracking-tight",
              view === "day" ? "max-w-[11rem] leading-snug sm:max-w-none" : "min-w-[140px]",
            )}
          >
            {label}
          </span>
          <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:justify-start">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-300" /> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-orange-300" /> Booked
            </span>
          </div>
          <div className="flex justify-center sm:justify-end">
            <div className="inline-flex w-full overflow-hidden rounded-lg border border-border sm:w-auto">
              {VIEW_OPTIONS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={cn(
                    "flex-1 px-3 py-1.5 text-xs font-medium capitalize sm:flex-none sm:px-4",
                    view === v ? "bg-[#7367F0] text-white" : "bg-card text-muted-foreground",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        {view === "day" ? (
          renderDayPanel(cursor)
        ) : (
          <div className="min-w-[42rem] sm:min-w-full">
            <div className="grid grid-cols-7 border-b border-border/70 bg-muted/20">
              {WEEKDAYS.map((d, i) => (
                <div
                  key={d}
                  className={cn(
                    "border-r border-border/60 px-2 py-2 text-center text-[11px] font-semibold text-muted-foreground last:border-r-0",
                    WEEKDAY_TONES[i],
                  )}
                >
                  {d}
                </div>
              ))}
            </div>

            <div className={cn("grid grid-cols-7", view === "month" && "grid-rows-6")}>
              {(view === "month" ? monthCells : weekCells).map((day) => {
                const inMonth = view === "week" || day.getMonth() === cursor.getMonth();
                const isPast = startOfDay(day) < startOfDay(new Date());
                const isToday = sameDay(day, new Date());
                const daySlots = slotsByDay.get(day.toDateString()) || [];
                const canCreate = mode === "interviewer" && !isPast;
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-[108px] border-b border-r border-border/60 p-2 sm:min-h-[100px]",
                      view === "week" && "min-h-[220px]",
                      getDayCellTone(day, inMonth, isPast, isToday, daySlots),
                      isPast && inMonth && "opacity-70",
                    )}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          "text-base font-semibold tabular-nums",
                          !inMonth && "text-muted-foreground",
                          isToday &&
                            "flex h-8 w-8 items-center justify-center rounded-full bg-[#7367F0] text-sm font-bold text-white",
                          !isToday && inMonth && "text-foreground",
                        )}
                      >
                        {day.getDate()}
                      </span>
                      {canCreate ? (
                        <button
                          type="button"
                          onClick={() => onCreate?.(day)}
                          className="rounded p-0.5 text-[#7367F0] hover:bg-[#7367F0]/10"
                          aria-label="Add slot"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                    <div className="space-y-1">{daySlots.map((slot) => renderSlotChip(slot))}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
