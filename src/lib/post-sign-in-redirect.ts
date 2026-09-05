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

export function consumePostSignInReturnUrl(): string | null {
  if (typeof window === "undefined") return null;
  const returnUrl = localStorage.getItem(POST_SIGN_IN_RETURN_URL_KEY);
  if (returnUrl) {
    localStorage.removeItem(POST_SIGN_IN_RETURN_URL_KEY);
  }
  return returnUrl;
}
