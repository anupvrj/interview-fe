export const DEFAULT_PEER_TIMEZONE = "Asia/Kolkata";

export const PEER_TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Dubai", label: "UAE (GST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Asia/Seoul", label: "Korea (KST)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
  { value: "Asia/Bangkok", label: "Thailand (ICT)" },
  { value: "Europe/London", label: "United Kingdom (GMT/BST)" },
  { value: "Europe/Berlin", label: "Central Europe (CET)" },
  { value: "Europe/Paris", label: "France (CET)" },
  { value: "America/New_York", label: "US Eastern (ET)" },
  { value: "America/Chicago", label: "US Central (CT)" },
  { value: "America/Denver", label: "US Mountain (MT)" },
  { value: "America/Los_Angeles", label: "US Pacific (PT)" },
  { value: "America/Toronto", label: "Canada Eastern" },
  { value: "America/Vancouver", label: "Canada Pacific" },
  { value: "Australia/Sydney", label: "Australia Eastern" },
  { value: "Australia/Melbourne", label: "Australia (Melbourne)" },
  { value: "Pacific/Auckland", label: "New Zealand (NZST)" },
];

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const read = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const hour = read("hour");
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: hour === 24 ? 0 : hour,
    minute: read("minute"),
  };
}

export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_PEER_TIMEZONE;
  } catch {
    return DEFAULT_PEER_TIMEZONE;
  }
}

export function isValidPeerTimezone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function formatPeerTimezoneLabel(timeZone: string): string {
  const known = PEER_TIMEZONE_OPTIONS.find((o) => o.value === timeZone);
  if (known) return known.label;
  try {
    const short =
      new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
        .formatToParts(new Date())
        .find((p) => p.type === "timeZoneName")?.value ?? "";
    const city = timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;
    return short ? `${city} (${short})` : city;
  } catch {
    return timeZone;
  }
}

/** Calendar date for `<input type="date">` in a specific timezone. */
export function toDateInputValueInTimezone(d: Date, timeZone: string): string {
  const p = getZonedParts(d, timeZone);
  return dateInputFromParts(p.year, p.month, p.day);
}

export function parseDateInput(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

export function dateInputFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function weekdayOfDateParts(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

export type DateInputCell = {
  year: number;
  month: number;
  day: number;
  inMonth: boolean;
};

/** Six-row month grid (Sun-first) using calendar date parts, not browser-local midnight. */
export function buildDateInputMonthGrid(year: number, month: number): DateInputCell[] {
  const firstDow = weekdayOfDateParts(year, month, 1);
  const dim = daysInMonth(year, month);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevDim = daysInMonth(prevYear, prevMonth);
  const cells: DateInputCell[] = [];

  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push({ year: prevYear, month: prevMonth, day: prevDim - i, inMonth: false });
  }
  for (let d = 1; d <= dim; d++) {
    cells.push({ year, month, day: d, inMonth: true });
  }

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  let trailing = 1;
  while (cells.length < 42) {
    cells.push({ year: nextYear, month: nextMonth, day: trailing++, inMonth: false });
  }

  return cells;
}

export const PEER_SLOT_TIME_OPTIONS = (() => {
  const slots: string[] = [];
  for (let hour = 7; hour <= 21; hour++) {
    slots.push(`${String(hour).padStart(2, "0")}:00`, `${String(hour).padStart(2, "0")}:30`);
  }
  return slots;
})();

/** Time for `<input type="time">` in a specific timezone. */
export function toTimeInputValueInTimezone(d: Date, timeZone: string): string {
  const p = getZonedParts(d, timeZone);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** Wall-clock date + time in `timeZone` → UTC instant. */
export function buildSlotStartInTimezone(date: string, time: string, timeZone: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  let ts = Date.UTC(y, mo - 1, d, h, mi, 0);

  for (let i = 0; i < 3; i++) {
    const parts = getZonedParts(new Date(ts), timeZone);
    const desiredMs = Date.UTC(y, mo - 1, d, h, mi, 0);
    const actualMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
    ts += desiredMs - actualMs;
  }

  return new Date(ts);
}

/** @deprecated Use buildSlotStartInTimezone with an explicit timezone. */
export function buildLocalSlotStart(date: string, time: string): Date {
  return buildSlotStartInTimezone(date, time, detectBrowserTimezone());
}

/** @deprecated Use toDateInputValueInTimezone with an explicit timezone. */
export function toLocalDateInputValue(d: Date = new Date()): string {
  return toDateInputValueInTimezone(d, detectBrowserTimezone());
}

export function formatPeerSchedule(
  date: string | Date,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Date(date).toLocaleString("en-IN", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  });
}

export function formatPeerTimeInTimezone(date: string | Date, timeZone: string): string {
  return new Date(date).toLocaleString("en-IN", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
}

/** e.g. "5 days 4 hrs", "17 hrs 25 mins", "45 mins", "Less than 1 min" */
export function formatHumanDuration(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  if (sec < 60) return "Less than 1 min";

  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(days === 1 ? "1 day" : `${days} days`);
    if (hours > 0) {
      parts.push(hours === 1 ? "1 hr" : `${hours} hrs`);
    }
    if (minutes > 0) {
      parts.push(minutes === 1 ? "1 min" : `${minutes} mins`);
    }
    return parts.join(" ");
  }

  if (hours > 0) {
    parts.push(hours === 1 ? "1 hr" : `${hours} hrs`);
  }
  if (minutes > 0) {
    parts.push(minutes === 1 ? "1 min" : `${minutes} mins`);
  }

  return parts.length > 0 ? parts.join(" ") : "Less than 1 min";
}

export function isSlotStartInPast(start: string | Date): boolean {
  return new Date(start).getTime() < Date.now();
}

export function isTimeOptionInPast(date: string, time: string, timeZone: string): boolean {
  if (!date || !time) return false;
  return isSlotStartInPast(buildSlotStartInTimezone(date, time, timeZone));
}

/** Sun → Sat single-letter labels (Google Calendar style). */
export const PEER_WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;

export const PEER_WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const PEER_RECURRING_WEEK_OPTIONS = [4, 8, 12] as const;

export const DEFAULT_PEER_RECURRING_WEEKS = 8;

export type PeerSlotScheduleMode = "once" | "weekly";

function addDaysToDateParts(
  year: number,
  month: number,
  day: number,
  days: number,
): { year: number; month: number; day: number } {
  const dt = new Date(year, month - 1, day);
  dt.setDate(dt.getDate() + days);
  return { year: dt.getFullYear(), month: dt.getMonth() + 1, day: dt.getDate() };
}

/** Weekly recurrence: every selected weekday for `weeks` calendar weeks starting at `fromDate`. */
export function expandWeeklyRecurringDates(opts: {
  fromDate: string;
  weekdays: number[];
  weeks: number;
}): string[] {
  const { fromDate, weeks } = opts;
  const weekdays = [...new Set(opts.weekdays)].sort((a, b) => a - b);
  if (!fromDate || weekdays.length === 0 || weeks < 1) return [];

  const { year, month, day } = parseDateInput(fromDate);
  const results: string[] = [];
  const totalDays = weeks * 7;

  for (let offset = 0; offset < totalDays; offset++) {
    const parts = addDaysToDateParts(year, month, day, offset);
    const dow = weekdayOfDateParts(parts.year, parts.month, parts.day);
    if (weekdays.includes(dow)) {
      results.push(dateInputFromParts(parts.year, parts.month, parts.day));
    }
  }

  return results;
}

export function formatRecurringWeekdaySummary(weekdays: number[]): string {
  const sorted = [...new Set(weekdays)].sort((a, b) => a - b);
  if (sorted.length === 0) return "";
  return sorted.map((d) => PEER_WEEKDAY_NAMES[d].slice(0, 3)).join(", ");
}

export function countFutureRecurringSlots(opts: {
  fromDate: string;
  time: string;
  timezone: string;
  weekdays: number[];
  weeks: number;
}): number {
  const dates = expandWeeklyRecurringDates({
    fromDate: opts.fromDate,
    weekdays: opts.weekdays,
    weeks: opts.weeks,
  });
  return dates.filter(
    (d) => !isSlotStartInPast(buildSlotStartInTimezone(d, opts.time, opts.timezone)),
  ).length;
}

/** TEMP (testing): set back to `10 * 60 * 1000` before production. */
export const PEER_JOIN_EARLY_MS = 0;

function meetingStartMs(start: string | Date): number {
  return new Date(start).getTime();
}

export function peerJoinOpensAtMs(start: string | Date): number {
  return meetingStartMs(start) - PEER_JOIN_EARLY_MS;
}

export function canJoinPeerMeeting(
  start: string | Date,
  end?: string | Date,
  nowMs: number = Date.now(),
): boolean {
  const endAt = end ? new Date(end).getTime() : meetingStartMs(start) + 60 * 60 * 1000;
  // TEMP (testing): join anytime before end — restore early-window check for production
  return nowMs < endAt;
}

export function peerJoinDisabledTooltip(start: string | Date, timeZone: string): string {
  const label = formatPeerTimezoneLabel(timeZone);
  return `Join is available until the meeting ends (${formatPeerTimeInTimezone(start, timeZone)} · ${label})`;
}

export function peerTimezoneOptionsIncluding(timeZone: string) {
  if (PEER_TIMEZONE_OPTIONS.some((o) => o.value === timeZone)) {
    return PEER_TIMEZONE_OPTIONS;
  }
  return [
    { value: timeZone, label: formatPeerTimezoneLabel(timeZone) },
    ...PEER_TIMEZONE_OPTIONS,
  ];
}
