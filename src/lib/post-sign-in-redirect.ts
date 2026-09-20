import { isPrivateAppPath } from "@/lib/seo/site-url";

export const POST_SIGN_IN_RETURN_URL_KEY = "resumeBuilderReturnUrl";
export const POST_SIGN_IN_ONE_SHOT_RETURN_KEY = "interviewtrix.oneShotReturnUrl";
export const EXTENSION_CONNECTED_PATH = "/dashboard/extension/connected";

/** Only in-app paths. Blocks protocol-relative, off-site, and wildcard placeholders. */
export function safeAppRedirectPath(redirectUrl: string | null | undefined): string | null {
  if (!redirectUrl) return null;
  const path = redirectUrl.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return null;
  }
  if (/[*{}<>]/.test(path)) {
    return null;
  }
  return path;
}

export function getSignInUrlWithRedirect(returnPath: string): string {
  return `/sign-in?redirect_url=${encodeURIComponent(returnPath)}`;
}

/** Home is public marketing — not a useful or safe post-auth destination. */
export function resolvePostAuthRedirectPath(
  redirectUrl: string | null | undefined,
): string {
  const destination = safeAppRedirectPath(redirectUrl);
  if (destination && destination !== "/") {
    return destination;
  }
  return "/onboarding";
}

/**
 * Extension connect is a one-tab handshake. Storing it in localStorage made the
 * next normal InterviewTrix login reopen /dashboard/extension/connected and close.
 */
export function isOneShotPostAuthPath(path: string | null | undefined): boolean {
  if (!path) return false;
  return path.split("?")[0] === EXTENSION_CONNECTED_PATH;
}

/**
 * A 401 while already on sign-in or ChatGPT OAuth consent used to bounce
 * consent → sign-in → consent forever (Clerk is already signed in).
 */
export function shouldRedirectUnauthorizedToSignIn(
  pathname: string,
  requestUrl?: string,
): boolean {
  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/connector/oauth")
  ) {
    return false;
  }
  if (requestUrl?.includes("/connector/v1/oauth/")) {
    return false;
  }
  return isPrivateAppPath(pathname);
}

export function storePostSignInReturnUrl(returnPath: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(POST_SIGN_IN_RETURN_URL_KEY, returnPath);
}

export function peekPostSignInReturnUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const oneShot = sessionStorage.getItem(POST_SIGN_IN_ONE_SHOT_RETURN_KEY);
    if (oneShot) return oneShot;
  } catch {
    /* private mode */
  }
  return localStorage.getItem(POST_SIGN_IN_RETURN_URL_KEY);
}

function clearOneShotReturnUrl(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(POST_SIGN_IN_ONE_SHOT_RETURN_KEY);
  } catch {
    /* private mode */
  }
}

function clearLeftoverOneShotFromLocalStorage(): void {
  if (typeof window === "undefined") return;
  const leftover = localStorage.getItem(POST_SIGN_IN_RETURN_URL_KEY);
  if (leftover && isOneShotPostAuthPath(leftover)) {
    localStorage.removeItem(POST_SIGN_IN_RETURN_URL_KEY);
  }
}

function storeOneShotReturnUrl(path: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(POST_SIGN_IN_ONE_SHOT_RETURN_KEY, path);
  } catch {
    /* private mode */
  }
  clearLeftoverOneShotFromLocalStorage();
}

/**
 * Persist the intended post-auth path from an explicit `redirect_url` only.
 * Do not fall back to a leftover Chrome-extension job capture — that capture
 * is re-injected on every InterviewTrix visit and would hijack normal login
 * to /dashboard/interviews/new. The extension already opens that path, so
 * middleware supplies redirect_url for a real handoff.
 *
 * Extension connect is session-scoped so a later /sign-in is not sent back
 * to /dashboard/extension/connected.
 */
export function persistPostAuthReturnPath(
  redirectUrl: string | null | undefined,
): string {
  const raw = safeAppRedirectPath(redirectUrl);
  if (!raw) {
    clearOneShotReturnUrl();
    clearLeftoverOneShotFromLocalStorage();
    return "/onboarding";
  }
  const destination = resolvePostAuthRedirectPath(raw);
  if (isOneShotPostAuthPath(destination)) {
    storeOneShotReturnUrl(destination);
    return destination;
  }
  clearOneShotReturnUrl();
  storePostSignInReturnUrl(destination);
  return destination;
}

export function consumePostSignInReturnUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const oneShot = sessionStorage.getItem(POST_SIGN_IN_ONE_SHOT_RETURN_KEY);
    if (oneShot) {
      sessionStorage.removeItem(POST_SIGN_IN_ONE_SHOT_RETURN_KEY);
      clearLeftoverOneShotFromLocalStorage();
      return oneShot;
    }
  } catch {
    /* private mode */
  }
  const returnUrl = localStorage.getItem(POST_SIGN_IN_RETURN_URL_KEY);
  if (!returnUrl) return null;
  localStorage.removeItem(POST_SIGN_IN_RETURN_URL_KEY);
  if (isOneShotPostAuthPath(returnUrl)) {
    return null;
  }
  return returnUrl;
}
