"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EntryDates {
  startDate: string;
  endDate: string;
  current: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2021-03", "03/2021", "2021" → { year, month (1-12 | null) }. */
export function parseResumeDate(value: string | undefined | null): { year: number | null; month: number | null } {
  const v = (value ?? "").trim();
  let m = v.match(/^(\d{4})-(\d{1,2})/);
  if (m) return { year: Number(m[1]), month: Number(m[2]) };
  m = v.match(/^(\d{1,2})\/(\d{4})$/);
  if (m) return { year: Number(m[2]), month: Number(m[1]) };
  m = v.match(/^(\d{4})$/);
  if (m) return { year: Number(m[1]), month: null };
  return { year: null, month: null };
}

export function formatResumeDateValue(year: number, month: number | null): string {
  return month ? `${year}-${String(month).padStart(2, "0")}` : String(year);
}

function Picker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const parsed = parseResumeDate(value);
  const thisYear = new Date().getFullYear();
  const [pageStart, setPageStart] = useState(() => {
    const anchor = parsed.year ?? thisYear;
    return anchor - (anchor % 12);
  });
  const years = Array.from({ length: 12 }, (_, i) => pageStart + i);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <button type="button" aria-label="Earlier years" onClick={() => setPageStart((y) => y - 12)} className="rounded p-1 hover:bg-muted">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold text-muted-foreground">
          {pageStart} – {pageStart + 11}
        </span>
        <button type="button" aria-label="Later years" onClick={() => setPageStart((y) => y + 12)} className="rounded p-1 hover:bg-muted">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onChange(formatResumeDateValue(y, parsed.month))}
            disabled={y > thisYear + 6}
            className={cn(
              "rounded-md py-1.5 text-xs font-medium disabled:opacity-30",
              parsed.year === y ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {y}
          </button>
        ))}
      </div>
      <div className="my-2 h-px bg-border" />
      <div className="grid grid-cols-4 gap-1">
        {MONTHS.map((label, i) => (
          <button
            key={label}
            type="button"
            disabled={!parsed.year}
            title={parsed.year ? undefined : "Pick a year first"}
            onClick={() => parsed.year && onChange(formatResumeDateValue(parsed.year, parsed.month === i + 1 ? null : i + 1))}
            className={cn(
              "rounded-md py-1.5 text-xs font-medium disabled:opacity-30",
              parsed.month === i + 1 ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** From / To date picker for one entry (Enhancv-style), with "Present" for ongoing roles. */
export function DatePickerPopover({
  dates,
  allowPresent,
  onChange,
  onClose,
}: {
  dates: EntryDates;
  allowPresent: boolean;
  onChange: (dates: EntryDates) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"from" | "to">("from");
  const startAfterEnd =
    !dates.current &&
    dates.startDate &&
    dates.endDate &&
    formatResumeDateValue(parseResumeDate(dates.startDate).year ?? 0, parseResumeDate(dates.startDate).month ?? 1) >
      formatResumeDateValue(parseResumeDate(dates.endDate).year ?? 0, parseResumeDate(dates.endDate).month ?? 12);
  return (
    <div className="w-64 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl" role="dialog" aria-label="Dates">
      <div className="mb-3 grid grid-cols-2 rounded-lg bg-muted p-0.5 text-xs font-semibold">
        {(["from", "to"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn("rounded-md py-1.5", tab === t ? "bg-background text-primary shadow-sm" : "text-muted-foreground")}
          >
            {t === "from" ? "From" : "To"}
          </button>
        ))}
      </div>
      {tab === "from" ? (
        <Picker value={dates.startDate} onChange={(startDate) => onChange({ ...dates, startDate })} />
      ) : (
        <>
          {allowPresent ? (
            <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs font-medium">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-primary"
                checked={dates.current}
                onChange={(e) => onChange({ ...dates, current: e.target.checked, endDate: e.target.checked ? "" : dates.endDate })}
              />
              I currently work here (Present)
            </label>
          ) : null}
          {dates.current ? null : <Picker value={dates.endDate} onChange={(endDate) => onChange({ ...dates, endDate })} />}
        </>
      )}
      {startAfterEnd ? <p className="mt-2 text-[11px] font-medium text-red-600">The start date is after the end date.</p> : null}
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChange({ startDate: "", endDate: "", current: false })}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Clear dates
        </button>
        <button type="button" onClick={onClose} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          Done
        </button>
      </div>
    </div>
  );
}
