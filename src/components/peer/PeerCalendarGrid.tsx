"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PeerSlot } from "@/lib/api";
import { DEFAULT_PEER_TIMEZONE, isSlotStartInPast } from "@/components/peer/peerSlotTime";

type View = "month" | "week";

interface PeerCalendarGridProps {
  slots: PeerSlot[];
  mode: "interviewer" | "candidate";
  timezone?: string;
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
  "bg-rose-50/40",
  "bg-sky-50/35",
  "bg-violet-50/30",
  "bg-slate-50/70",
  "bg-cyan-50/30",
  "bg-indigo-50/25",
  "bg-fuchsia-50/25",
] as const;

function getDayCellTone(
  day: Date,
  inMonth: boolean,
  isPast: boolean,
  isToday: boolean,
  daySlots: PeerSlot[],
): string {
  if (!inMonth) return "bg-neutral-50/50";

  const hasOpen = daySlots.some((s) => s.status === "open");
  const hasBooked = daySlots.some((s) => s.status !== "open");

  if (hasOpen) return "bg-emerald-50/80";
  if (isToday) return "bg-[#7367F0]/[0.05]";
  if (hasBooked) return "bg-amber-50/45";
  if (isPast) return "bg-neutral-100/35";

  return WEEKDAY_TONES[day.getDay()];
}

export function PeerCalendarGrid({
  slots,
  mode,
  timezone = DEFAULT_PEER_TIMEZONE,
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
      : `Week of ${addDays(cursor, -cursor.getDay()).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        })}`;

  const shift = (dir: number) => {
    setCursor((c) =>
      view === "month"
        ? new Date(c.getFullYear(), c.getMonth() + dir, 1)
        : addDays(c, dir * 7),
    );
  };

  const renderSlotChip = (slot: PeerSlot) => {
    const booked = slot.status !== "open";
    const past = isSlotStartInPast(slot.start);
    const clickable = mode === "candidate" && !booked && !past;
    return (
      <div
        key={slot.id}
        className={cn(
          "group flex items-center justify-between gap-1 rounded-md border px-1.5 py-1 text-[11px] font-medium",
          past && mode === "candidate"
            ? "border-neutral-200 bg-neutral-100 text-neutral-400"
            : booked
              ? "border-orange-300 bg-orange-100 text-orange-800"
              : "border-emerald-300 bg-emerald-100 text-emerald-800",
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
              : booked
                ? "Booked"
                : "Available — click to book"
          }
        >
          {fmtTime(slot.start, timezone)}
        </button>
        {mode === "interviewer" && !booked ? (
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

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-semibold tracking-tight">{label}</span>
          <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-300" /> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-orange-300" /> Booked
            </span>
          </div>
          <div className="inline-flex overflow-hidden rounded-lg border border-border">
            {(["month", "week"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium capitalize",
                  view === v ? "bg-[#7367F0] text-white" : "bg-card text-muted-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
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
              const isPast = day < new Date(new Date().toDateString());
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
                  <div className="space-y-1">{daySlots.map(renderSlotChip)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
