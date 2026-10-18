"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { trackEvent } from "@/lib/analytics/gtag";
import { readHackathonFunnel } from "@/features/hackathon/analytics";
import { peekPostSignInReturnUrl, isHackathonSignupPath } from "@/lib/post-sign-in-redirect";

/** Accounts created within this window of the first signed-in page count as new sign-ups. */
const NEW_ACCOUNT_WINDOW_MS = 30 * 60 * 1000;

/**
 * GA4 recommended `sign_up` — once per new account, after Clerk confirms it.
 * The localStorage key stays in the browser; the user id is never sent to GA.
 */
export function SignUpTracker() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.createdAt) return;
    if (Date.now() - new Date(user.createdAt).getTime() > NEW_ACCOUNT_WINDOW_MS) return;
    const key = `ix.ga.signup.${user.id}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, String(Date.now()));
    } catch {
      return; // can't dedupe — skip rather than double count
    }
    const provider = user.externalAccounts?.[0]?.provider?.replace(/^oauth_/, "").replace(/_oidc$/, "");
    const hackathon =
      Boolean(readHackathonFunnel()) ||
      isHackathonSignupPath(window.location.pathname) ||
      isHackathonSignupPath(peekPostSignInReturnUrl());
    trackEvent("sign_up", {
      method: provider || "email",
      signup_context: hackathon ? "hackathon" : "general",
    });
  }, [isLoaded, isSignedIn, user]);

  return null;
}
