/** Convert seconds to Schema.org / ISO 8601 duration (e.g. PT1M21S). */
export function secondsToIso8601Duration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  let value = "PT";
  if (hours > 0) value += `${hours}H`;
  if (minutes > 0) value += `${minutes}M`;
  if (secs > 0 || (hours === 0 && minutes === 0)) value += `${secs}S`;
  return value;
}

/** Google Video Sitemap expects integer seconds. */
export function secondsToVideoSitemapDuration(totalSeconds: number): number {
  return Math.max(1, Math.round(totalSeconds));
}
