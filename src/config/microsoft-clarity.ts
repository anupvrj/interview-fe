/**
 * Microsoft Clarity project ID — heatmaps / session replay.
 *
 * - Set `NEXT_PUBLIC_CLARITY_PROJECT_ID` in `.env.local` (or deployment env) to override.
 * - Omit the variable to use the default ID below.
 * - Disable: set `NEXT_PUBLIC_CLARITY_PROJECT_ID=` (empty) or `NEXT_PUBLIC_CLARITY_DISABLED=true`.
 *
 * @see https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup
 */

const DEFAULT_CLARITY_PROJECT_ID = "w2cfchg38k";

const CLARITY_ID_PATTERN = /^[a-z0-9]+$/i;

export function getClarityProjectId(): string | null {
  if (process.env.NEXT_PUBLIC_CLARITY_DISABLED === "true") {
    return null;
  }

  const raw = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const resolved =
    raw === undefined || raw === null
      ? DEFAULT_CLARITY_PROJECT_ID
      : raw.trim();

  if (resolved === "") {
    return null;
  }

  if (!CLARITY_ID_PATTERN.test(resolved)) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[clarity] Ignoring invalid NEXT_PUBLIC_CLARITY_PROJECT_ID (alphanumeric only): "${resolved}"`,
      );
    }
    return null;
  }

  return resolved;
}
