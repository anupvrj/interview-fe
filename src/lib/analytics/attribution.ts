/**
 * Browser identifiers forwarded with a conversion request, so the server-side
 * GA4 / Meta event joins the same visitor (and ad click) as the browser tags.
 *
 * Only analytics ids from first-party cookies and the page URL without its
 * query string. No personal data.
 */
import { getGaMeasurementId } from "@/config/google-analytics";

export interface ConversionAttribution {
  gaClientId?: string;
  gaSessionId?: string;
  fbp?: string;
  fbc?: string;
  pageUrl?: string;
}

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

const GTAG_GET_TIMEOUT_MS = 800;

export function readCookie(name: string, cookieString: string = typeof document === "undefined" ? "" : document.cookie): string | undefined {
  for (const part of cookieString.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      const value = rest.join("=");
      try {
        return decodeURIComponent(value) || undefined;
      } catch {
        return value || undefined;
      }
    }
  }
  return undefined;
}

/** `_ga` = `GA1.1.<random>.<timestamp>` → `<random>.<timestamp>`. */
export function clientIdFromGaCookie(value: string | undefined): string | undefined {
  const match = value?.match(/^GA\d\.\d+\.(\d+\.\d+)$/);
  return match?.[1];
}

/** `_ga_<ID>` = `GS1.1.<session>.…` or `GS2.1.s<session>$o…` → `<session>`. */
export function sessionIdFromStreamCookie(value: string | undefined): string | undefined {
  const match = value?.match(/^GS\d\.\d+\.s?(\d+)/);
  return match?.[1];
}

function gtagGet(measurementId: string, field: "client_id" | "session_id"): Promise<string | undefined> {
  const gtag = typeof window === "undefined" ? undefined : (window as GtagWindow).gtag;
  if (typeof gtag !== "function") return Promise.resolve(undefined);
  return new Promise((resolve) => {
    // gtag never calls back when gtag.js is blocked.
    const timer = setTimeout(() => resolve(undefined), GTAG_GET_TIMEOUT_MS);
    try {
      gtag("get", measurementId, field, (value: unknown) => {
        clearTimeout(timer);
        resolve(value === undefined || value === null || value === "" ? undefined : String(value));
      });
    } catch {
      clearTimeout(timer);
      resolve(undefined);
    }
  });
}

export async function collectConversionAttribution(): Promise<ConversionAttribution> {
  if (typeof window === "undefined") return {};
  const measurementId = getGaMeasurementId();
  const [gtagClientId, gtagSessionId] = measurementId
    ? await Promise.all([gtagGet(measurementId, "client_id"), gtagGet(measurementId, "session_id")])
    : [undefined, undefined];
  const streamCookie = measurementId ? readCookie(`_ga_${measurementId.replace(/^G-/, "")}`) : undefined;

  const out: ConversionAttribution = {
    gaClientId: gtagClientId ?? clientIdFromGaCookie(readCookie("_ga")),
    gaSessionId: gtagSessionId ?? sessionIdFromStreamCookie(streamCookie),
    fbp: readCookie("_fbp"),
    fbc: readCookie("_fbc"),
    pageUrl: `${window.location.origin}${window.location.pathname}`,
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v)) as ConversionAttribution;
}
