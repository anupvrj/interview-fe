import { isPaidPlanId } from "@/lib/pricingPageContent";
import { consumePostSignInReturnUrl } from "@/lib/post-sign-in-redirect";

function isOnboardingReturn(path: string): boolean {
  const pathname = path.split("?")[0];
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

/**
 * Destination after onboarding is saved.
 * A stored return of /onboarding is ignored: router.push of the current URL
 * never unmounts the form, so Finish stays on "Finishing…".
 */
export function resolveCompletedOnboardingPath(): string {
  const returnUrl = consumePostSignInReturnUrl();
  if (returnUrl && !isOnboardingReturn(returnUrl)) {
    return returnUrl;
  }

  const pendingPlan = localStorage.getItem("pendingPlan");
  if (pendingPlan === "enterprise") {
    localStorage.removeItem("pendingPlan");
    return "/contact";
  }
  if (pendingPlan && isPaidPlanId(pendingPlan)) {
    localStorage.removeItem("pendingPlan");
    return `/checkout?plan=${pendingPlan}&cycle=monthly`;
  }
  if (pendingPlan) localStorage.removeItem("pendingPlan");
  return "/select-role";
}

/** How long to wait before forcing the leave if the first load never starts. */
export const ONBOARDING_LEAVE_RETRY_MS = 2000;

/**
 * Leave /onboarding with a document navigation.
 *
 * /onboarding is public. router.push to /select-role or /dashboard is an RSC
 * fetch, and Clerk will not run its session handshake on that fetch. For a
 * new account the middleware then redirects the fetch to an HTML page. The
 * App Router never commits that navigation, so the Finish button stays on
 * "Finishing…" even though the profile is already saved. A full page load
 * follows the handshake and lands on the dashboard.
 *
 * If that load is swallowed and the tab is still on /onboarding, assign the
 * same path again, then /dashboard.
 */
export function leaveOnboarding(path: string): void {
  window.location.replace(path);
  window.setTimeout(() => {
    if (!window.location.pathname.startsWith("/onboarding")) return;
    window.location.assign(path);
  }, ONBOARDING_LEAVE_RETRY_MS);
  window.setTimeout(() => {
    if (!window.location.pathname.startsWith("/onboarding")) return;
    window.location.assign("/dashboard");
  }, ONBOARDING_LEAVE_RETRY_MS * 2);
}
