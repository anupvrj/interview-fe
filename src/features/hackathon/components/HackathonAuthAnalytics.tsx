"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { isHackathonSignupPath } from "@/lib/post-sign-in-redirect";
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
export function HackathonAuthAnalytics({ pageType, redirectUrl, children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const active = isHackathonSignupPath(redirectUrl);

  useEffect(() => {
    const root = rootRef.current;
    if (!active || !root) return;
    const funnel = readHackathonFunnel();
    const base = { signup_page_type: pageType, cta_location: funnel?.ctaLocation };
    trackHackathonOnce(`auth_view:${pageType}`, HK_EVENTS.signupView, base);

    const start = () => trackHackathonOnce(`auth_start:${pageType}`, HK_EVENTS.signupStart, base);
    const method = (m: string) => {
      start();
      trackHackathonOnce(`auth_method:${pageType}:${m}`, HK_EVENTS.signupMethod, { ...base, signup_method: m });
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
      if (target.closest(".cl-formButtonPrimary")) {
        const step = root.querySelector("input[name='code'], .cl-otpCodeField, [class*='cl-otpCodeField']")
          ? "verify_code"
          : "details";
        if (step === "details") method("email");
        trackHackathon(HK_EVENTS.signupSubmit, { ...base, submit_step: step });
      }
    };
    const onFocus = (event: Event) => {
      const target = event.target as Element | null;
      if (target?.matches("input")) {
        start();
        const name = target.getAttribute("name");
        if (name === "emailAddress" || name === "identifier") method("email");
      }
    };

    // Clerk renders errors asynchronously — watch for them.
    const seen = new WeakSet<Element>();
    const scan = () => {
      root.querySelectorAll(".cl-formFieldErrorText, [class*='cl-formFieldErrorText']").forEach((el) => {
        if (seen.has(el) || !el.textContent?.trim()) return;
        seen.add(el);
        trackHackathon(HK_EVENTS.validationError, { ...base, form_step: "account", field: fieldOf(el) });
      });
      root.querySelectorAll(".cl-alert, [class*='cl-alert__']").forEach((el) => {
        if (seen.has(el) || !el.textContent?.trim()) return;
        seen.add(el);
        trackHackathon(HK_EVENTS.signupError, { ...base, error_type: alertType(el.textContent) });
      });
    };
    const observer = new MutationObserver(scan);
    observer.observe(root, { childList: true, subtree: true, characterData: true });

    root.addEventListener("click", onClick, true);
    root.addEventListener("focusin", onFocus);
    return () => {
      observer.disconnect();
      root.removeEventListener("click", onClick, true);
      root.removeEventListener("focusin", onFocus);
    };
  }, [active, pageType]);

  return (
    <div ref={rootRef} className="contents">
      {children}
    </div>
  );
}
