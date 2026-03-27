"use client";

import { GoogleAnalytics } from "@next/third-parties/google";

type Props = Readonly<{
  gaId: string | null;
}>;

/**
 * GA4 via `@next/third-parties/google` — same gtag behavior Google documents, with Next.js Script optimization.
 * `gaId` comes from the server layout (`getGaMeasurementId()`).
 */
export function AppGoogleAnalytics({ gaId }: Props) {
  if (!gaId) {
    return null;
  }

  return <GoogleAnalytics gaId={gaId} />;
}
