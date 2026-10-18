"use client";

import { GoogleAnalytics } from "@next/third-parties/google";

type Props = Readonly<{
  gaId: string | null;
  /**
   * Non-production hosts send `debug_mode` so their hits land in DebugView and are
   * dropped from reports by the GA4 "Developer traffic" data filter.
   */
  debugMode?: boolean;
}>;

/**
 * GA4 via `@next/third-parties/google` — same gtag behavior Google documents, with Next.js Script optimization.
 * `gaId` comes from the server layout (`getGaMeasurementId()`).
 */
export function AppGoogleAnalytics({ gaId, debugMode = false }: Props) {
  if (!gaId) {
    return null;
  }

  return <GoogleAnalytics gaId={gaId} debugMode={debugMode} />;
}
