import { POPUP_BLOCKED_PATH_PREFIXES, type PopupDesign, type PublicSitePopup } from "./types";

/** Designs that dim the page and lock scrolling. */
export function isModalDesign(design: PopupDesign): boolean {
  return design === "spotlight" || design === "split" || design === "minimal" || design === "sheet";
}

function normalizePath(path: string): string {
  const clean = (path.split(/[?#]/)[0] || "/").replace(/\/+$/, "");
  return clean === "" ? "/" : clean;
}

function escapeRe(value: string): string {
  return value.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Page pattern match.
 *  "/"                       → home page only
 *  "/pricing"                → that page (trailing slash ignored)
 *  "/dashboard*"             → /dashboard and every page under it (not /dashboards)
 *  "/hackathon/*"            → pages under /hackathon (not /hackathon itself)
 *  "/hackathon/*\/dashboard" → * in the middle matches one path segment
 *  "/*"                      → every page
 */
export function matchesPagePattern(pattern: string, path: string): boolean {
  const p = pattern.trim();
  if (!p.startsWith("/")) return false;
  const target = normalizePath(path);
  if (p === "/*" || p === "*") return true;
  const toRe = (value: string) => escapeRe(value).replace(/\*/g, "[^/]+");
  if (p.endsWith("/*")) {
    return new RegExp(`^${toRe(normalizePath(p.slice(0, -2)))}/.+$`).test(target);
  }
  if (p.endsWith("*")) {
    const base = normalizePath(p.slice(0, -1));
    return new RegExp(`^${base === "/" ? "" : toRe(base)}(?:$|/.*)$`).test(target) || (base === "/" && target === "/");
  }
  return new RegExp(`^${toRe(normalizePath(p))}$`).test(target);
}

export function isBlockedPath(path: string): boolean {
  const target = normalizePath(path);
  return POPUP_BLOCKED_PATH_PREFIXES.some((prefix) => target === prefix || target.startsWith(`${prefix}/`));
}

export function popupMatchesPage(popup: PublicSitePopup, path: string): boolean {
  if (isBlockedPath(path)) return false;
  const { pages, excludePages } = popup.targeting;
  if (!pages.some((pattern) => matchesPagePattern(pattern, path))) return false;
  return !excludePages.some((pattern) => matchesPagePattern(pattern, path));
}

export function popupMatchesAudience(popup: PublicSitePopup, signedIn: boolean): boolean {
  const { audience } = popup.targeting;
  if (audience === "signed_in") return signedIn;
  if (audience === "signed_out") return !signedIn;
  return true;
}

export function popupMatchesDevice(popup: PublicSitePopup, isMobile: boolean): boolean {
  const { devices } = popup.targeting;
  if (devices === "mobile") return isMobile;
  if (devices === "desktop") return !isMobile;
  return true;
}

/** Popups that touch the hackathon (register button or hackathon countdown). */
export function popupNeedsHackathon(popup: PublicSitePopup): boolean {
  return (
    popup.primaryCta.action === "hackathon_register" ||
    (popup.secondaryCta.enabled && popup.secondaryCta.action === "hackathon_register") ||
    (popup.show.countdown && popup.countdown.mode.startsWith("hackathon"))
  );
}

/* ---------- per-browser cooldown ---------- */

const STORAGE_PREFIX = "ixp:v1:";

export function snoozePopup(id: string, hours: number): void {
  if (!(hours > 0)) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${id}`, String(Date.now() + hours * 3_600_000));
  } catch {
    /* storage blocked (private mode) — the popup simply may show again */
  }
}

export function isPopupSnoozed(id: string, now = Date.now()): boolean {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (!raw) return false;
    const until = Number(raw);
    if (Number.isFinite(until) && until > now) return true;
    localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
    return false;
  } catch {
    return false;
  }
}

/** Clears every popup cooldown in this browser (admin testing helper). */
export function clearPopupSnoozes(): number {
  let cleared = 0;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
        cleared++;
      }
    }
  } catch {
    /* ignore */
  }
  return cleared;
}

/** Same-origin site path → client-side navigation. Rejects "//host", "/\\host" and other tricks. */
export function isInternalHref(url: string): boolean {
  if (!/^\/(?![/\\])[^\s\\]*$/.test(url)) return false;
  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

/** Only http(s) links are followed. */
export function isSafeExternalHref(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/** True when `now` is inside the popup's optional schedule window. */
export function isWithinSchedule(schedule: { startsAt: string | null; endsAt: string | null } | undefined, now = Date.now()): boolean {
  if (!schedule) return true;
  if (schedule.startsAt && new Date(schedule.startsAt).getTime() > now) return false;
  if (schedule.endsAt && new Date(schedule.endsAt).getTime() <= now) return false;
  return true;
}
