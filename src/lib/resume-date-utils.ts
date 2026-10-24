/** Coerce LinkedIn/LLM/import date values into resume date strings (YYYY-MM or YYYY). */
export function coerceResumeDate(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);

  if (typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (record.year != null && record.year !== "") {
      const year = String(record.year);
      const month = Number(record.month);
      if (Number.isFinite(month) && month >= 1 && month <= 12) {
        return `${year}-${String(month).padStart(2, "0")}`;
      }
      return year;
    }
    if (typeof record.date === "string") return record.date.trim();
  }

  return String(value).trim();
}

function readExperienceDate(
  item: Record<string, unknown>,
  kind: "start" | "end",
): unknown {
  if (kind === "start") {
    return (
      item.startDate ??
      item.start_date ??
      item.fromDate ??
      item.from ??
      item.start
    );
  }
  return (
    item.endDate ??
    item.end_date ??
    item.toDate ??
    item.tillDate ??
    item.to ??
    item.end
  );
}

/** Normalize a single experience entry to the resume schema date fields. */
export function normalizeExperienceEntry<T extends Record<string, unknown>>(
  item: T,
): T & {
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
} {
  const startDate = coerceResumeDate(readExperienceDate(item, "start"));
  let endDate = coerceResumeDate(readExperienceDate(item, "end"));
  const endLower = endDate.toLowerCase();
  const current =
    Boolean(item.current) ||
    endLower === "present" ||
    endLower === "current" ||
    endLower === "till date" ||
    endLower === "till present";

  if (current && (endLower === "present" || endLower === "current")) {
    endDate = "";
  }

  return {
    ...item,
    position: String(item.position ?? item.title ?? item.role ?? "").trim(),
    startDate,
    endDate,
    current,
  };
}

export function normalizeExperienceList(
  items: unknown,
): ReturnType<typeof normalizeExperienceEntry>[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item) => normalizeExperienceEntry(item as Record<string, unknown>));
}

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Date style picked in the Style panel (layout.dateFormat). "auto" keeps each design's own
 * style (MM/YYYY, or "Jan 2023" for designs that use month names). ResumeRenderer sets it at
 * the start of each render, so every date on the page follows it — and the PDF, which is
 * printed from the same page.
 */
export type ResumeDateFormat = "auto" | "MM/YYYY" | "Mon YYYY" | "Month YYYY" | "YYYY";
export const RESUME_DATE_FORMATS: Array<{ id: ResumeDateFormat; label: string; example: string }> = [
  { id: "auto", label: "Design default", example: "" },
  { id: "MM/YYYY", label: "03/2024", example: "03/2024" },
  { id: "Mon YYYY", label: "Mar 2024", example: "Mar 2024" },
  { id: "Month YYYY", label: "March 2024", example: "March 2024" },
  { id: "YYYY", label: "2024", example: "2024" },
];
let activeDateFormat: ResumeDateFormat = "auto";
export function setResumeDateFormat(format: string | undefined | null): void {
  activeDateFormat = RESUME_DATE_FORMATS.some((f) => f.id === format) ? (format as ResumeDateFormat) : "auto";
}

const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Stored "2024-03" / "03/2024" / "2024" → the picked style; anything else as typed. */
function formatInStyle(value: string, style: Exclude<ResumeDateFormat, "auto">): string | null {
  const trimmed = value.trim();
  let year: string | null = null;
  let month: number | null = null;
  let m = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/.exec(trimmed);
  if (m) [year, month] = [m[1], Number(m[2])];
  else if ((m = /^(\d{1,2})\/(\d{4})$/.exec(trimmed))) [year, month] = [m[2], Number(m[1])];
  else if ((m = /^(\d{4})$/.exec(trimmed))) year = m[1];
  if (!year) return null;
  if (month !== null && (month < 1 || month > 12)) month = null;
  if (style === "YYYY" || month === null) return year;
  if (style === "MM/YYYY") return `${String(month).padStart(2, "0")}/${year}`;
  if (style === "Mon YYYY") return `${MONTH_ABBR[month - 1]} ${year}`;
  return `${MONTH_FULL[month - 1]} ${year}`;
}

/** Month-name display for templates that use abbreviated dates (e.g. Jan 2023). */
export function formatResumeDateAbbreviated(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (activeDateFormat !== "auto") return formatInStyle(trimmed, activeDateFormat) ?? trimmed;

  const isoMonth = /^(\d{4})-(\d{2})$/.exec(trimmed);
  if (isoMonth) {
    const monthIdx = parseInt(isoMonth[2], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${MONTH_ABBR[monthIdx]} ${isoMonth[1]}`;
    }
  }

  const yearOnly = /^(\d{4})$/.exec(trimmed);
  if (yearOnly) return yearOnly[1];

  return trimmed;
}

export function formatExperienceDateRangeAbbreviated(exp: {
  startDate?: unknown;
  endDate?: unknown;
  current?: boolean;
}): string {
  const start = formatResumeDateAbbreviated(coerceResumeDate(exp.startDate));
  const rawEnd = coerceResumeDate(exp.endDate);
  const rawEndLower = rawEnd.toLowerCase();
  const isPresent =
    Boolean(exp.current) ||
    rawEndLower === "present" ||
    rawEndLower === "current" ||
    rawEndLower === "till date" ||
    rawEndLower === "till present";

  const end = isPresent ? "Present" : formatResumeDateAbbreviated(rawEnd);

  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  return end;
}

/** Human-friendly display for stored resume dates (keeps non-ISO values as-is). */
export function formatResumeDateForDisplay(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (activeDateFormat !== "auto") return formatInStyle(trimmed, activeDateFormat) ?? trimmed;

  const isoMonth = /^(\d{4})-(\d{2})$/.exec(trimmed);
  if (isoMonth) {
    return `${isoMonth[2]}/${isoMonth[1]}`;
  }

  return trimmed;
}

export function formatExperienceDateRange(exp: {
  startDate?: unknown;
  endDate?: unknown;
  current?: boolean;
}): string {
  const start = formatResumeDateForDisplay(
    coerceResumeDate(exp.startDate),
  );
  const rawEnd = coerceResumeDate(exp.endDate);
  const rawEndLower = rawEnd.toLowerCase();
  const isPresent =
    Boolean(exp.current) ||
    rawEndLower === "present" ||
    rawEndLower === "current" ||
    rawEndLower === "till date" ||
    rawEndLower === "till present";

  const end = isPresent ? "Present" : formatResumeDateForDisplay(rawEnd);

  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  return end;
}

/** Format project/education date ranges using the same MM/YYYY display rules. */
export function formatProjectDateRange(project: {
  startDate?: unknown;
  endDate?: unknown;
  current?: boolean;
}): string {
  return formatExperienceDateRange(project);
}
