/**
 * GA4 measurement ID — single place to document behavior.
 *
 * - Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env.local` (or deployment env) to use a specific property.
 * - Omit the variable to use the default ID below (production default).
 * - Disable analytics: set `NEXT_PUBLIC_GA_MEASUREMENT_ID=` (empty) or `NEXT_PUBLIC_GA_DISABLED=true`.
 *
 * Custom events (after this loads): `import { sendGAEvent } from "@next/third-parties/google"`.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries#google-analytics
 * @see https://support.google.com/analytics/answer/9539598
 */

const DEFAULT_GA_MEASUREMENT_ID = "G-P12J6RSLEQ";

/** GA4 IDs are `G-` followed by alphanumeric (Google may extend length). */
const GA4_ID_PATTERN = /^G-[A-Z0-9]+$/i;

export function getGaMeasurementId(): string | null {
  if (process.env.NEXT_PUBLIC_GA_DISABLED === "true") {
    return null;
  }

  const raw = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const resolved =
    raw === undefined || raw === null
      ? DEFAULT_GA_MEASUREMENT_ID
      : raw.trim();

  if (resolved === "") {
    return null;
  }

  if (!GA4_ID_PATTERN.test(resolved)) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[analytics] Ignoring invalid NEXT_PUBLIC_GA_MEASUREMENT_ID (expected G-XXXXXXXX): "${resolved}"`,
      );
    }
    return null;
  }

  return resolved;
}
