"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { isHackathonSignupPath, peekPostSignInReturnUrl } from "@/lib/post-sign-in-redirect";
import {
  HK_EVENTS,
  readHackathonFunnel,
  trackHackathon,
  trackHackathonOnce,
  type HackathonErrorType,
} from "../analytics";

type Props = Readonly<{
  pageType: "sign_up" | "sign_in";
  redirectUrl: string | null;
  children: ReactNode;
}>;

const KNOWN_FIELDS = new Set(["emailAddress", "password", "code", "firstName", "lastName", "identifier", "username"]);

/** Clerk marks fields as `cl-formField__<name>`; inputs carry `name`. Only known names are reported. */
function fieldOf(node: Element): string {
  const holder = node.closest("[class*='cl-formField__']");
  const match = holder?.className.toString().match(/cl-formField__(\w+)/);
  const name = match?.[1] ?? node.closest("form")?.querySelector("input[aria-invalid='true']")?.getAttribute("name") ?? "";
  if (name === "identifier") return "emailAddress";
  return KNOWN_FIELDS.has(name) ? name : "other";
}

/** Coarse category from Clerk's banner text. The text itself is never sent. */
function alertType(text: string): HackathonErrorType {
  if (/already|exists|taken|in use/i.test(text)) return "account_exists";
  if (/network|offline|connection/i.test(text)) return "network_error";
  if (/server|unexpected|try again later/i.test(text)) return "server_error";
  return "authentication_error";
}

/**
 * Observes Clerk's <SignUp>/<SignIn> (via its stable `cl-*` classes) for the
 * hackathon funnel. Inactive unless the visitor is headed back to the hackathon.
 */
/**
 * Clerk's later steps (e.g. /sign-up/verify-email-address) can drop `redirect_url`
 * from the address, so also trust the stored return path and the Register-click context.
 */
function isHackathonAuthVisit(redirectUrl: string | null): boolean {
  if (isHackathonSignupPath(redirectUrl)) return true;
  if (readHackathonFunnel()) return true;
  // Stored return path only counts on Clerk sub-steps (/sign-up/verify-…), where the
  // query was dropped — not on a fresh, unrelated sign-up later in this browser.
  if (window.location.pathname.split("/").filter(Boolean).length < 2) return false;
  try {
    return isHackathonSignupPath(peekPostSignInReturnUrl());
  } catch {
    return false;
  }
}

const OTP_SELECTOR = "input[name='code'], .cl-otpCodeField, [class*='cl-otpCodeField']";
const FIELD_ERROR_SELECTOR =
  ".cl-formFieldErrorText, [class*='cl-formFieldErrorText'], [class*='cl-otpCodeFieldErrorText'], [class*='cl-'][class*='ErrorText']";
const ALERT_SELECTOR = ".cl-alert, [class*='cl-alert__'], [class*='cl-alertText']";

/**
 * Observes Clerk's <SignUp>/<SignIn> (via its stable `cl-*` classes) for the
 * hackathon funnel. Inactive unless the visitor is headed back to the hackathon.
 */
export function HackathonAuthAnalytics({ pageType, redirectUrl, children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !isHackathonAuthVisit(redirectUrl)) return;
    const funnel = readHackathonFunnel();
    const base = { signup_page_type: pageType, cta_location: funnel?.ctaLocation };
    trackHackathonOnce(`auth_view:${pageType}`, HK_EVENTS.signupView, base);

    const start = () => trackHackathonOnce(`auth_start:${pageType}`, HK_EVENTS.signupStart, base);
    const method = (m: string) => {
      start();
      trackHackathonOnce(`auth_method:${pageType}:${m}`, HK_EVENTS.signupMethod, { ...base, signup_method: m });
    };

    // A button click also fires the form's submit event — count one attempt, not two.
    let lastSubmitAt = 0;
    const submit = () => {
      const now = Date.now();
      if (now - lastSubmitAt < 1500) return;
      lastSubmitAt = now;
      const step = root.querySelector(OTP_SELECTOR) ? "verify_code" : "details";
      if (step === "details") method("email");
      trackHackathon(HK_EVENTS.signupSubmit, { ...base, submit_step: step });
    };

    const onClick = (event: Event) => {
      const target = event.target as Element | null;
      if (!target) return;
      const social = target.closest("[class*='cl-socialButtons']");
      const provider = social?.className.toString().match(/cl-socialButtons\w*Button__(\w+)/)?.[1];
      if (provider) {
        method(provider.replace(/_oidc$/, ""));
        return;
      }
      if (target.closest(".cl-formButtonPrimary")) submit();
    };
    const onFocus = (event: Event) => {
      const target = event.target as Element | null;
      if (target?.matches("input")) {
        start();
        const name = target.getAttribute("name");
        if (name === "emailAddress" || name === "identifier") method("email");
      }
    };
    // Enter key / native submit.
    const onSubmit = () => submit();
    // Clerk auto-submits the email code once every digit is filled — no click, no submit event.
    const onInput = (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      const otp = target?.closest(OTP_SELECTOR) ?? (target?.getAttribute("name") === "code" ? target : null);
      if (!otp) return;
      const container = target?.closest("[class*='cl-otpCodeField']") ?? root;
      const inputs = Array.from(container.querySelectorAll<HTMLInputElement>("input"));
      const code = inputs.map((i) => i.value).join("");
      if (code.length >= 6 && inputs.every((i) => i.value || inputs.length === 1)) submit();
    };

    // Clerk renders errors asynchronously — watch for them.
    const seen = new WeakSet<Element>();
    const scan = () => {
      root.querySelectorAll(FIELD_ERROR_SELECTOR).forEach((el) => {
        if (seen.has(el) || !el.textContent?.trim()) return;
        seen.add(el);
        // Nested matches (wrapper + inner text) are one error.
        if (el.parentElement?.closest(FIELD_ERROR_SELECTOR)) return;
        const field = el.closest(OTP_SELECTOR) || root.querySelector(OTP_SELECTOR) ? "code" : fieldOf(el);
        trackHackathon(HK_EVENTS.validationError, { ...base, form_step: "account", field });
      });
      root.querySelectorAll(ALERT_SELECTOR).forEach((el) => {
        if (seen.has(el) || !el.textContent?.trim()) return;
        seen.add(el);
        trackHackathon(HK_EVENTS.signupError, { ...base, error_type: alertType(el.textContent) });
      });
    };
    const observer = new MutationObserver(scan);
    observer.observe(root, { childList: true, subtree: true, characterData: true });

    root.addEventListener("click", onClick, true);
    root.addEventListener("focusin", onFocus);
    root.addEventListener("submit", onSubmit, true);
    root.addEventListener("input", onInput, true);
    return () => {
      observer.disconnect();
      root.removeEventListener("click", onClick, true);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("submit", onSubmit, true);
      root.removeEventListener("input", onInput, true);
    };
  }, [redirectUrl, pageType]);

  return (
    <div ref={rootRef} className="contents">
      {children}
    </div>
  );
}
