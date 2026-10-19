/**
 * Thin, safe wrapper around the GA4 `gtag` loaded by `AppGoogleAnalytics`.
 *
 * - No-ops on the server and when GA is disabled.
 * - Events fired before gtag.js is ready are queued and flushed once it loads.
 * - Never pass personal data (names, emails, phones, free text) as params.
 */

export type GaParamValue = string | number | boolean;
export type GaParams = Record<string, GaParamValue | null | undefined>;

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

const pending: Array<[string, Record<string, GaParamValue>]> = [];
let flushTimer: number | null = null;
let flushAttempts = 0;
const MAX_FLUSH_ATTEMPTS = 40; // ~10s at 250ms

function clean(params: GaParams): Record<string, GaParamValue> {
  const out: Record<string, GaParamValue> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    out[key] = value;
  }
  return out;
}

function gtagFn() {
  const fn = (window as GtagWindow).gtag;
  return typeof fn === "function" ? fn : null;
}

function scheduleFlush() {
  if (flushTimer !== null) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    const gtag = gtagFn();
    if (gtag) {
      for (const [name, params] of pending.splice(0)) gtag("event", name, params);
      flushAttempts = 0;
      return;
    }
    flushAttempts += 1;
    if (flushAttempts < MAX_FLUSH_ATTEMPTS) {
      scheduleFlush();
    } else {
      // GA disabled or blocked — drop quietly.
      pending.length = 0;
      flushAttempts = 0;
    }
  }, 250);
}

export function trackEvent(name: string, params: GaParams = {}): void {
  if (typeof window === "undefined") return;
  const payload = clean(params);
  if (process.env.NODE_ENV === "development") {
    console.debug("[ga4]", name, payload);
  }
  const gtag = gtagFn();
  if (gtag && pending.length === 0) {
    gtag("event", name, payload);
    return;
  }
  pending.push([name, payload]);
  scheduleFlush();
}
