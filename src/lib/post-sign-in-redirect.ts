import {
  isExtensionHandoffPath,
  loadPendingJobHandoffPath,
} from "@/lib/extension-job-handoff";

export const POST_SIGN_IN_RETURN_URL_KEY = "resumeBuilderReturnUrl";

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
  return true;
}

export function storePostSignInReturnUrl(returnPath: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(POST_SIGN_IN_RETURN_URL_KEY, returnPath);
}

export function peekPostSignInReturnUrl(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(POST_SIGN_IN_RETURN_URL_KEY);
}

/**
 * Persist the intended post-auth path. Prefers the sign-in query param, then a
 * waiting Chrome-extension job capture. Safe to call during render on the client.
 */
export function persistPostAuthReturnPath(
  redirectUrl: string | null | undefined,
): string {
  const destination =
    safeAppRedirectPath(redirectUrl) || loadPendingJobHandoffPath();
  if (destination) {
    storePostSignInReturnUrl(destination);
    return destination;
  }
  return "/onboarding";
}

export function consumePostSignInReturnUrl(): string | null {
  if (typeof window === "undefined") return null;
  const returnUrl = localStorage.getItem(POST_SIGN_IN_RETURN_URL_KEY);
  if (returnUrl) {
    localStorage.removeItem(POST_SIGN_IN_RETURN_URL_KEY);
    return returnUrl;
  }
  const handoffPath = loadPendingJobHandoffPath();
  return handoffPath && isExtensionHandoffPath(handoffPath) ? handoffPath : null;
}
