/**
 * GA4 funnel events for the Hiring Games hackathon, plus the two Meta Pixel
 * conversions the ads optimise for (`CompleteRegistration`, `Lead`).
 *
 * Landing → Register click → Sign-up (Clerk) → Account created (`sign_up`)
 *   → Profile wizard steps → Registration confirmed by the API → Challenges.
 *
 * Only controlled, non-personal values are sent (ids, steps, categories). Never
 * names, emails, phone numbers, URLs the user typed, or raw error messages.
 */
import { trackEvent, type GaParams } from "@/lib/analytics/gtag";
import { trackMetaEvent } from "@/lib/analytics/fbq";

export const HK_EVENTS = {
  pageView: "hackathon_page_view",
  engaged: "hackathon_engaged",
  sectionView: "hackathon_section_view",
  scrollDepth: "hackathon_scroll_depth",
  faqInteraction: "hackathon_faq_interaction",
  registerClick: "hackathon_register_click",
  signupRedirect: "hackathon_signup_redirect",
  signupView: "hackathon_signup_view",
  signupStart: "hackathon_signup_start",
  signupMethod: "hackathon_signup_method",
  signupSubmit: "hackathon_signup_submit",
  validationError: "hackathon_validation_error",
  signupError: "hackathon_signup_error",
  formProgress: "hackathon_form_progress",
  registrationSuccess: "hackathon_registration_success",
  dashboardView: "hackathon_dashboard_view",
  challengeStarted: "hackathon_challenge_started",
  challengeCompleted: "hackathon_challenge_completed",
  submissionCompleted: "hackathon_submission_completed",
} as const;

export type HackathonCtaLocation =
  | "header"
  | "mobile_menu"
  | "hero"
  | "participate"
  | "who"
  | "final_cta"
  | "other";

export type HackathonErrorType =
  | "validation_error"
  | "authentication_error"
  | "account_exists"
  | "server_error"
  | "network_error"
  | "unknown_error";

export type HackathonFormStep = "profile_type_phone" | "details" | "resume";

const PAGE_TYPE = "hackathon_landing";
const FUNNEL_KEY = "ix.hk.ga.funnel";
const FUNNEL_TTL_MS = 2 * 60 * 60 * 1000;
const META_CONTENT_NAME = "hiring_games_2026";

export function trackHackathon(name: (typeof HK_EVENTS)[keyof typeof HK_EVENTS], params: GaParams = {}) {
  trackEvent(name, { hackathon_id: "hiring_games_2026", ...params });
}

/** Fire at most once per page load (per key). */
const firedThisPage = new Set<string>();
export function trackHackathonOnce(key: string, name: (typeof HK_EVENTS)[keyof typeof HK_EVENTS], params: GaParams = {}) {
  if (firedThisPage.has(key)) return;
  firedThisPage.add(key);
  trackHackathon(name, params);
}

/** Lets the sign-up page know the visitor came from a hackathon Register button. */
type FunnelContext = { ctaLocation: HackathonCtaLocation; at: number };

export function rememberHackathonFunnel(ctaLocation: HackathonCtaLocation) {
  try {
    sessionStorage.setItem(FUNNEL_KEY, JSON.stringify({ ctaLocation, at: Date.now() } satisfies FunnelContext));
  } catch {
    /* storage blocked */
  }
}

export function readHackathonFunnel(): FunnelContext | null {
  try {
    const raw = sessionStorage.getItem(FUNNEL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FunnelContext;
    if (!parsed?.at || Date.now() - parsed.at > FUNNEL_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function trackRegisterClick(opts: {
  ctaLocation: HackathonCtaLocation;
  ctaState: string;
  signedIn: boolean;
  destination: "sign_up" | "profile" | "dashboard";
}) {
  rememberHackathonFunnel(opts.ctaLocation);
  markHackathonEngaged("cta_click");
  trackHackathon(HK_EVENTS.registerClick, {
    cta_location: opts.ctaLocation,
    cta_state: opts.ctaState,
    auth_state: opts.signedIn ? "signed_in" : "signed_out",
    page_type: PAGE_TYPE,
  });
  trackHackathon(HK_EVENTS.signupRedirect, {
    destination_type: opts.destination,
    cta_location: opts.ctaLocation,
  });
}

/** Map an API/axios failure to a coarse category — never the raw message. */
export function classifyError(err: unknown): HackathonErrorType {
  const e = err as { response?: { status?: number }; code?: string; message?: string } | undefined;
  const status = e?.response?.status;
  if (!e?.response && (e?.code === "ERR_NETWORK" || /network/i.test(e?.message ?? ""))) return "network_error";
  if (status === 401 || status === 403) return "authentication_error";
  if (status === 400 || status === 409 || status === 422) return "validation_error";
  if (typeof status === "number" && status >= 500) return "server_error";
  return "unknown_error";
}

/**
 * `hackathon_registration_success` must count each account once, even across
 * reloads/tabs. Key is local only (never sent to GA).
 */
export function trackRegistrationSuccessOnce(opts: { userKey: string | null | undefined; source: string; userType?: string | null }) {
  const key = `ix.hk.ga.registered.${opts.userKey ?? "anon"}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, String(Date.now()));
  } catch {
    /* storage blocked — still send once per page via the Set below */
  }
  if (firedThisPage.has(key)) return;
  const funnel = readHackathonFunnel();
  trackHackathonOnce(key, HK_EVENTS.registrationSuccess, {
    source: opts.source,
    user_type: opts.userType ?? undefined,
    cta_location: funnel?.ctaLocation,
  });
  trackMetaEvent("CompleteRegistration", { content_name: META_CONTENT_NAME, status: true });
}

/**
 * Meta `Lead` once per account, the first time the submitted resume's ATS score
 * reaches the hackathon target (75 by default). Key is local only.
 */
export function trackAtsQualifiedOnce(opts: { userKey: string | null | undefined; atsScore: number | null | undefined; target: number }) {
  if (!opts.userKey || typeof opts.atsScore !== "number" || opts.atsScore < opts.target) return;
  const key = `ix.hk.meta.lead.${opts.userKey}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, String(Date.now()));
  } catch {
    /* storage blocked — still send once per page via the Set below */
  }
  if (firedThisPage.has(key)) return;
  firedThisPage.add(key);
  trackMetaEvent("Lead", { content_name: META_CONTENT_NAME, content_category: "ats_qualified" });
}

/** `hackathon_engaged` — once per landing visit, whichever rule trips first. */
export function markHackathonEngaged(trigger: "time_15s" | "scroll_50" | "cta_click" | "faq_open") {
  trackHackathonOnce("engaged", HK_EVENTS.engaged, { engage_trigger: trigger, page_type: PAGE_TYPE });
}

type ProgressSnapshot = { states: Record<string, string>; completed: boolean };

/**
 * Participation funnel from server progress. The first snapshot per account is a
 * silent baseline, so work done before tracking shipped is never replayed as new.
 */
export function trackParticipationProgress(opts: {
  userKey: string | null | undefined;
  challenges: Array<{ challengeId: string; kind: string; state: string }>;
  completed: boolean;
}) {
  if (!opts.userKey) return;
  const key = `ix.hk.ga.progress.${opts.userKey}`;
  let previous: ProgressSnapshot | null = null;
  try {
    const raw = localStorage.getItem(key);
    previous = raw ? (JSON.parse(raw) as ProgressSnapshot) : null;
  } catch {
    return;
  }
  const next: ProgressSnapshot = {
    states: Object.fromEntries(opts.challenges.map((c) => [c.challengeId, c.state])),
    completed: opts.completed,
  };
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    return;
  }
  if (!previous) return;

  opts.challenges.forEach((c, index) => {
    const before = previous?.states[c.challengeId];
    const params = { challenge_kind: c.kind, challenge_index: index + 1 };
    const startedNow =
      (c.state === "in_progress" || c.state === "processing") &&
      (before === undefined || before === "locked" || before === "available");
    if (startedNow) trackHackathon(HK_EVENTS.challengeStarted, params);
    if (c.state === "completed" && before !== "completed") {
      if (before === "locked" || before === "available") trackHackathon(HK_EVENTS.challengeStarted, params);
      trackHackathon(HK_EVENTS.challengeCompleted, params);
    }
  });
  if (opts.completed && !previous.completed) {
    trackHackathon(HK_EVENTS.submissionCompleted, { challenges_completed: opts.challenges.length });
  }
}
