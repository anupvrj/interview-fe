export const POST_SIGN_IN_RETURN_URL_KEY = "resumeBuilderReturnUrl";

export function getSignInUrlWithRedirect(returnPath: string): string {
  return `/sign-in?redirect_url=${encodeURIComponent(returnPath)}`;
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
