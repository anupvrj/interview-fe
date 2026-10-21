"use client";

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

const selectClass =
  "h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none focus:border-primary";

/** Month + year selects for one date ("2021-03" / "2021" / ""). */
function MonthYear({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const parsed = parseResumeDate(value);
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 61 }, (_, i) => thisYear + 6 - i);
  return (
    <div className={cn("space-y-1", disabled && "opacity-40")}>
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      <div className="flex gap-1.5">
        <select
          aria-label={`${label} month`}
          disabled={disabled || !parsed.year}
          value={parsed.month ?? ""}
          onChange={(e) => parsed.year && onChange(formatResumeDateValue(parsed.year, e.target.value ? Number(e.target.value) : null))}
          className={selectClass}
        >
          <option value="">Month</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} year`}
          disabled={disabled}
          value={parsed.year ?? ""}
          onChange={(e) => onChange(e.target.value ? formatResumeDateValue(Number(e.target.value), parsed.month) : "")}
          className={selectClass}
        >
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/** Start / End editor for one entry, with a "Currently here" switch for ongoing roles. */
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
  const start = parseResumeDate(dates.startDate);
  const end = parseResumeDate(dates.endDate);
  const startAfterEnd =
    !dates.current &&
    start.year !== null &&
    end.year !== null &&
    start.year * 100 + (start.month ?? 1) > end.year * 100 + (end.month ?? 12);
  return (
    <div className="w-72 space-y-3 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl" role="dialog" aria-label="Dates">
      <MonthYear label="Start" value={dates.startDate} onChange={(startDate) => onChange({ ...dates, startDate })} />
      <MonthYear label="End" value={dates.endDate} disabled={dates.current} onChange={(endDate) => onChange({ ...dates, endDate })} />
      {allowPresent ? (
        <label className="flex cursor-pointer items-center justify-between rounded-lg bg-muted/50 px-2.5 py-2 text-xs font-medium">
          Currently here
          <input
            type="checkbox"
            role="switch"
            className="h-4 w-7 cursor-pointer appearance-none rounded-full bg-slate-300 transition before:block before:h-3 before:w-3 before:translate-x-0.5 before:rounded-full before:bg-white before:transition checked:bg-primary checked:before:translate-x-3.5"
            checked={dates.current}
            onChange={(e) => onChange({ ...dates, current: e.target.checked, endDate: e.target.checked ? "" : dates.endDate })}
          />
        </label>
      ) : null}
      {startAfterEnd ? <p className="text-[11px] font-medium text-rose-600">Start is after the end — check the years.</p> : null}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => onChange({ startDate: "", endDate: "", current: false })}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Remove dates
        </button>
        <button type="button" onClick={onClose} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          Done
        </button>
      </div>
    </div>
  );
}
