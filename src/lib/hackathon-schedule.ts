/** IST labels for the challenge window, derived from the public hackathon record. */

export type ChallengeWindow = {
  startISO: string;
  endISO: string;
  /** e.g. 17–24 Oct 2026 */
  dateLabel: string;
  /** e.g. 17th-24th Oct 2026 */
  publicRangeLabel: string;
  /** e.g. 17 Oct 2026 */
  registrationDateLabel: string;
  /** Inclusive IST calendar days from start through end. */
  dayCount: number;
};

const IST = "Asia/Kolkata";

type IstDate = { day: number; month: string; year: string };

function istDate(iso: string): IstDate {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { day: Number(get("day")), month: get("month"), year: get("year") };
}

function inclusiveDays(startISO: string, endISO: string): number {
  const partsOf = (iso: string) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: IST,
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }).formatToParts(new Date(iso));
    const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
    return { year: value("year"), month: value("month"), day: value("day") };
  };
  const start = partsOf(startISO);
  const end = partsOf(endISO);
  const span = Date.UTC(end.year, end.month - 1, end.day) - Date.UTC(start.year, start.month - 1, start.day);
  return Math.round(span / 86_400_000) + 1;
}

function ordinal(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

export function formatChallengeWindow(startISO: string, endISO: string): ChallengeWindow {
  const start = istDate(startISO);
  const end = istDate(endISO);
  const sameMonth = start.month === end.month && start.year === end.year;

  const dateLabel = sameMonth
    ? `${start.day}–${end.day} ${start.month} ${start.year}`
    : `${start.day} ${start.month} ${start.year}–${end.day} ${end.month} ${end.year}`;

  const publicRangeLabel = sameMonth
    ? `${ordinal(start.day)}-${ordinal(end.day)} ${start.month} ${start.year}`
    : `${ordinal(start.day)} ${start.month}–${ordinal(end.day)} ${end.month} ${end.year}`;

  return {
    startISO,
    endISO,
    dateLabel,
    publicRangeLabel,
    registrationDateLabel: `${start.day} ${start.month} ${start.year}`,
    dayCount: inclusiveDays(startISO, endISO),
  };
}
