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
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

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

export function isSlotStartInPast(start: string | Date): boolean {
  return new Date(start).getTime() < Date.now();
}

export const PEER_JOIN_EARLY_MS = 10 * 60 * 1000;

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
  const opensAt = peerJoinOpensAtMs(start);
  const endAt = end ? new Date(end).getTime() : meetingStartMs(start) + 60 * 60 * 1000;
  return nowMs >= opensAt && nowMs < endAt;
}

export function peerJoinDisabledTooltip(start: string | Date, timeZone: string): string {
  const opensAt = new Date(peerJoinOpensAtMs(start));
  const label = formatPeerTimezoneLabel(timeZone);
  return `Join opens 10 minutes before the meeting starts (${formatPeerTimeInTimezone(opensAt, timeZone)} · ${label})`;
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
