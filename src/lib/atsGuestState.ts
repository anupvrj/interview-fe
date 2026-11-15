/**
 * What a signed-out ATS check leaves in the browser, so nothing is lost on the way to an
 * account: the claim token, the result on screen, and the design they tried on.
 * localStorage, because email verification can finish in another tab. No heavy imports:
 * the sign-in pages read this too.
 */

const TOKEN_KEY = "ats-checker-guest-token";
const CHECK_KEY = "ats-checker-guest-check";
const FLOW_KEY = "ats-checker-guest-flow";
const TEMPLATE_KEY = "ats-checker-guest-template";

/** Matches how long the server keeps an unclaimed check. */
export const GUEST_CHECK_TTL_MS = 2 * 60 * 60 * 1000;

/** Where a signed-in visitor with an unclaimed check is taken to collect it. */
export const GUEST_CHECK_CLAIM_PATH = "/dashboard/ats-checker";

type Stamped<T> = { data: T; expiresAt: number };

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const stamped = JSON.parse(raw) as Partial<Stamped<T>> & { token?: string };
    if (!stamped.expiresAt || stamped.expiresAt <= Date.now()) {
      localStorage.removeItem(key);
      return null;
    }
    // Older entries stored the token at the top level.
    return (stamped.data ?? stamped.token ?? null) as T | null;
  } catch {
    return null;
  }
}

function write<T>(key: string, data: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify({ data, expiresAt: Date.now() + GUEST_CHECK_TTL_MS }));
    return true;
  } catch {
    return false;
  }
}

function remove(...keys: string[]): void {
  try {
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    /* private mode */
  }
}

/**
 * Keep the check until it is claimed. The result is optional: if it doesn't fit, the token
 * still carries the check into the account, only a refresh before sign-up shows the upload.
 */
export function rememberGuestCheck<T>(token: string, result?: T): void {
  write(TOKEN_KEY, token);
  if (result !== undefined && !write(CHECK_KEY, result)) remove(CHECK_KEY);
  try {
    localStorage.setItem(FLOW_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function loadGuestCheckToken(): string | null {
  const token = read<string>(TOKEN_KEY);
  return typeof token === "string" && token ? token : null;
}

export function hasUnclaimedGuestCheck(): boolean {
  return typeof window !== "undefined" && loadGuestCheckToken() !== null;
}

export function loadGuestCheckResult<T>(): T | null {
  return loadGuestCheckToken() ? read<T>(CHECK_KEY) : null;
}

/** Claimed, expired, or replaced by "Check another": nothing of it should come back. */
export function forgetGuestCheck(): void {
  remove(TOKEN_KEY, CHECK_KEY, TEMPLATE_KEY);
}

export function isGuestFlowBrowser(): boolean {
  try {
    return localStorage.getItem(FLOW_KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberGuestTemplate(templateId: string): void {
  try {
    localStorage.setItem(TEMPLATE_KEY, templateId);
  } catch {
    /* private mode: they can pick it again in the editor */
  }
}

/** The design they tried on, read once. */
export function takeGuestTemplate(): string | null {
  try {
    const id = localStorage.getItem(TEMPLATE_KEY);
    localStorage.removeItem(TEMPLATE_KEY);
    return id;
  } catch {
    return null;
  }
}

const DEVICE_KEY = "ats-checker-device";
const SCAN_KEY = "ats-checker-scan-in-progress";
/** A scan older than this was abandoned, not interrupted. */
const SCAN_RESUME_WINDOW_MS = 15 * 60 * 1000;

/**
 * An anonymous id for this browser, sent with signed-out checks so limits apply per browser:
 * many phones share one carrier IP. Not tied to a person; null when storage is off.
 */
export function atsDeviceId(): string | null {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      const bytes = crypto.getRandomValues(new Uint8Array(18));
      id = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/**
 * A scan is running. Phones freeze or reload a tab when you switch apps, so if the page
 * comes back without a result, the scan picks up with the PDF already kept here.
 */
export function markScanStarted(fileName: string): void {
  try {
    localStorage.setItem(SCAN_KEY, JSON.stringify({ fileName, startedAt: Date.now() }));
  } catch {
    /* private mode */
  }
}

export function clearScanMark(): void {
  remove(SCAN_KEY);
}

export function interruptedScan(): { fileName: string } | null {
  try {
    const raw = localStorage.getItem(SCAN_KEY);
    if (!raw) return null;
    const { fileName, startedAt } = JSON.parse(raw) as { fileName?: string; startedAt?: number };
    if (!startedAt || Date.now() - startedAt > SCAN_RESUME_WINDOW_MS) {
      localStorage.removeItem(SCAN_KEY);
      return null;
    }
    return { fileName: fileName ?? "your resume" };
  } catch {
    return null;
  }
}

/** Instagram, Facebook, LinkedIn and similar in-app browsers, where Google sign-in often fails. */
export function inAppBrowserName(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "Facebook";
  if (/LinkedInApp/i.test(ua)) return "LinkedIn";
  if (/Twitter/i.test(ua)) return "X";
  if (/Snapchat/i.test(ua)) return "Snapchat";
  if (/\bLine\//i.test(ua)) return "LINE";
  return null;
}
