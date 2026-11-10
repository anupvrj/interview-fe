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
