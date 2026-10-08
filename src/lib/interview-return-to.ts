import { safeAppRedirectPath } from "@/lib/post-sign-in-redirect";

/** Query param that sends a finished interview back to the page that launched it. */
export const INTERVIEW_RETURN_TO_PARAM = "returnTo";

const STORAGE_PREFIX = "interviewReturnTo:";

function storageKey(interviewId: string): string {
  return `${STORAGE_PREFIX}${interviewId}`;
}

export function readInterviewReturnTo(
  search: URLSearchParams | string | null | undefined,
): string | null {
  if (!search) return null;
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  return safeAppRedirectPath(params.get(INTERVIEW_RETURN_TO_PARAM));
}

export function withInterviewReturnTo(path: string, returnTo: string | null | undefined): string {
  const safe = safeAppRedirectPath(returnTo);
  if (!safe) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${INTERVIEW_RETURN_TO_PARAM}=${encodeURIComponent(safe)}`;
}

export function isHackathonDashboardReturn(path: string | null | undefined): boolean {
  return Boolean(hackathonSlugFromDashboardPath(path));
}

/** Closing the tab must not delete a hackathon attempt the dashboard still points at. */
export function shouldAutoDiscardUnstartedInterview(input: {
  status?: string;
  tags?: string[] | null;
  returnTo?: string | null;
}): boolean {
  if (input.status !== "draft") return false;
  if (input.tags?.includes("hackathon")) return false;
  if (isHackathonDashboardReturn(input.returnTo)) return false;
  return true;
}

export function hackathonSlugFromDashboardPath(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = path.split("?")[0]?.replace(/\/$/, "") ?? "";
  const match = /^\/hackathon\/([^/]+)\/dashboard$/.exec(base);
  return match?.[1] ?? null;
}

/** Dashboard to open after a hackathon interview error or exit. */
export function resolveHackathonInterviewHome(
  returnTo?: string | null,
): string | null {
  const slug = hackathonSlugFromDashboardPath(returnTo);
  if (slug) return `/hackathon/${slug}/dashboard`;
  if (!returnTo) return null;
  const base = returnTo.split("?")[0]?.replace(/\/$/, "") ?? "";
  if (base === "/hackathon-2026") return "/hackathon/hackathon-2026/dashboard";
  const landing = /^\/hackathon\/([^/]+)$/.exec(base);
  return landing?.[1] ? `/hackathon/${landing[1]}/dashboard` : null;
}

export function rememberInterviewReturnTo(
  interviewId: string,
  returnTo: string | null | undefined,
): string | null {
  const safe = safeAppRedirectPath(returnTo);
  if (!safe || typeof window === "undefined") return safe;
  try {
    sessionStorage.setItem(storageKey(interviewId), safe);
  } catch {
    /* private mode */
  }
  return safe;
}

export function peekStoredInterviewReturnTo(interviewId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return safeAppRedirectPath(sessionStorage.getItem(storageKey(interviewId)));
  } catch {
    return null;
  }
}

export function resolveInterviewReturnTo(
  interviewId: string,
  search?: URLSearchParams | string | null,
): string | null {
  const fromQuery = readInterviewReturnTo(search);
  if (fromQuery) return rememberInterviewReturnTo(interviewId, fromQuery);
  return peekStoredInterviewReturnTo(interviewId);
}

export function currentInterviewReturnTo(interviewId: string): string | null {
  if (typeof window === "undefined") return null;
  return resolveInterviewReturnTo(interviewId, window.location.search);
}

export function clearStoredInterviewReturnTo(interviewId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(interviewId));
  } catch {
    /* private mode */
  }
}

/** Hackathon interviews are tagged `hackathon` plus the event slug. */
export function hackathonDashboardFromTags(
  tags: string[] | null | undefined,
): string | null {
  if (!tags?.includes("hackathon")) return null;
  const slug = tags.find((tag) => tag !== "hackathon") ?? "hackathon-2026";
  return `/hackathon/${slug}/dashboard?fromInterview=1`;
}
