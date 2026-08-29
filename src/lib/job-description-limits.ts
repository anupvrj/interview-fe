/**
 * Job description length limits for AI tailoring.
 *
 * The backend JD analyzer only reads the first ~8000 characters (it slices the
 * text before sending it to the model), so anything beyond this adds no signal
 * and only risks bloating request payloads / token usage. We therefore treat
 * this as a soft cap: the UI lets users paste any length, warns when the JD is
 * longer, and trims the overflow before sending. Trimming does not hurt tailoring
 * because the meaningful role context lives well within this budget.
 */
export const MAX_JOB_DESCRIPTION_CHARS = 8000;

/** Number of characters beyond the cap (0 when within the limit). */
export function getJobDescriptionOverflow(value: string): number {
  return Math.max(0, value.length - MAX_JOB_DESCRIPTION_CHARS);
}

export function isJobDescriptionOverLimit(value: string): boolean {
  return value.length > MAX_JOB_DESCRIPTION_CHARS;
}

/** Trim (and clean) a job description to the max length before sending. */
export function trimJobDescriptionForSend(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed.length > MAX_JOB_DESCRIPTION_CHARS
    ? trimmed.slice(0, MAX_JOB_DESCRIPTION_CHARS)
    : trimmed;
}
