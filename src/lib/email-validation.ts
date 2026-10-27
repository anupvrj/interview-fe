/** Max length aligned with hackathon launch RSVP API (Zod `.email().max(254)`). */
export const EMAIL_MAX_LENGTH = 254;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmailForStorage(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmailAddress(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > EMAIL_MAX_LENGTH) return false;
  return EMAIL_RE.test(trimmed);
}

/** User-facing message for forms; `null` when valid. */
export function emailValidationMessage(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Enter your email address.";
  if (trimmed.length > EMAIL_MAX_LENGTH) return "Email is too long.";
  if (!EMAIL_RE.test(trimmed)) return "Enter a valid email address.";
  return null;
}
