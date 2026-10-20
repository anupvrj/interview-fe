/**
 * "Give your resume a final read" reminder, shown before download/submit when no
 * sample data is found. Users can opt out per resume; stored in this browser only.
 */
const KEY_PREFIX = "ix.resume.reviewAck.";

export function shouldShowReviewReminder(resumeId: string | undefined | null): boolean {
  if (!resumeId) return false;
  try {
    return localStorage.getItem(KEY_PREFIX + resumeId) === null;
  } catch {
    return true;
  }
}

export function dismissReviewReminder(resumeId: string | undefined | null): void {
  if (!resumeId) return;
  try {
    localStorage.setItem(KEY_PREFIX + resumeId, String(Date.now()));
  } catch {
    /* storage blocked — the reminder simply shows again next time */
  }
}
