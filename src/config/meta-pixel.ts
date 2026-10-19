/**
 * Meta (Facebook / Instagram) Pixel ID — ad conversion tracking.
 *
 * - Set `NEXT_PUBLIC_META_PIXEL_ID` in `.env.local` (or deployment env) to override.
 * - Omit the variable to use the default ID below (production default).
 * - Disable: set `NEXT_PUBLIC_META_PIXEL_ID=` (empty) or `NEXT_PUBLIC_META_PIXEL_DISABLED=true`.
 *
 * Custom events (after this loads): `import { trackMetaEvent } from "@/lib/analytics/fbq"`.
 *
 * @see https://developers.facebook.com/docs/meta-pixel/get-started
 */

/** "InterviewTrix Website" dataset in ad account 1769948170688665. */
const DEFAULT_META_PIXEL_ID = "1622968385904661";

/** Pixel IDs are numeric (typically 15–16 digits). */
const META_PIXEL_ID_PATTERN = /^\d{6,20}$/;

export function getMetaPixelId(): string | null {
  if (process.env.NEXT_PUBLIC_META_PIXEL_DISABLED === "true") {
    return null;
  }

  const raw = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const resolved =
    raw === undefined || raw === null
      ? DEFAULT_META_PIXEL_ID
      : raw.trim();

  if (resolved === "") {
    return null;
  }

  if (!META_PIXEL_ID_PATTERN.test(resolved)) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[meta-pixel] Ignoring invalid NEXT_PUBLIC_META_PIXEL_ID (digits only): "${resolved}"`,
      );
    }
    return null;
  }

  return resolved;
}
