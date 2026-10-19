/**
 * Thin, safe wrapper around the Meta Pixel `fbq` loaded by `AppMetaPixel`.
 *
 * - No-ops on the server and when the pixel is disabled.
 * - Events fired before the base code runs are queued and flushed once `fbq` exists.
 * - Never pass personal data (names, emails, phones, free text) as params.
 */

export type MetaParamValue = string | number | boolean;
export type MetaParams = Record<string, MetaParamValue | null | undefined>;

/** Standard events we send. Custom names would need `trackCustom`. */
export type MetaStandardEvent = "PageView" | "CompleteRegistration" | "Lead";

type FbqWindow = Window & { fbq?: (...args: unknown[]) => void };

const pending: Array<[MetaStandardEvent, Record<string, MetaParamValue>, string | undefined]> = [];
let flushTimer: number | null = null;
let flushAttempts = 0;
const MAX_FLUSH_ATTEMPTS = 40; // ~10s at 250ms

function clean(params: MetaParams): Record<string, MetaParamValue> {
  const out: Record<string, MetaParamValue> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    out[key] = value;
  }
  return out;
}

function fbqFn() {
  const fn = (window as FbqWindow).fbq;
  return typeof fn === "function" ? fn : null;
}

function send(fbq: (...args: unknown[]) => void, name: MetaStandardEvent, params: Record<string, MetaParamValue>, eventId?: string) {
  if (eventId) {
    fbq("track", name, params, { eventID: eventId });
  } else {
    fbq("track", name, params);
  }
}

function scheduleFlush() {
  if (flushTimer !== null) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    const fbq = fbqFn();
    if (fbq) {
      for (const [name, params, eventId] of pending.splice(0)) send(fbq, name, params, eventId);
      flushAttempts = 0;
      return;
    }
    flushAttempts += 1;
    if (flushAttempts < MAX_FLUSH_ATTEMPTS) {
      scheduleFlush();
    } else {
      // Pixel disabled or blocked — drop quietly.
      pending.length = 0;
      flushAttempts = 0;
    }
  }, 250);
}

/**
 * `eventId` lets Meta dedupe this browser event against a server (Conversions API)
 * event with the same id, if one is added later.
 */
export function trackMetaEvent(name: MetaStandardEvent, params: MetaParams = {}, eventId?: string): void {
  if (typeof window === "undefined") return;
  const payload = clean(params);
  if (process.env.NODE_ENV === "development") {
    console.debug("[meta-pixel]", name, payload, eventId ?? "");
  }
  const fbq = fbqFn();
  if (fbq && pending.length === 0) {
    send(fbq, name, payload, eventId);
    return;
  }
  pending.push([name, payload, eventId]);
  scheduleFlush();
}
