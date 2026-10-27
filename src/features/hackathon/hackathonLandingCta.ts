import type { HackathonPublic } from "./api";
import { CTA_LABELS } from "./copy";
import { isHackathonSignupClosedForNewParticipants } from "./hackathonRegistration";

export type HackathonLandingCtaKey = keyof typeof CTA_LABELS;

export type HackathonLandingCta = {
  labelKey: HackathonLandingCtaKey;
  disabled: boolean;
  hint: string | null;
};

function spotsHint(pub: HackathonPublic | undefined): string | null {
  if (!pub || pub.spotsLeft === null || pub.spotsLeft <= 0 || pub.spotsLeft >= 20) return null;
  return `Only ${pub.spotsLeft} spot${pub.spotsLeft === 1 ? "" : "s"} left`;
}

/**
 * Landing / hero CTA from event phase, capacity, and the user's registration.
 * `returning`: signed out, but this browser has joined before (see returningMember) — they get
 * "Go to Challenge", and the click goes to sign-in rather than the sign-up questions.
 */
export function resolveHackathonLandingCta(
  pub: HackathonPublic | undefined,
  isSignedIn: boolean,
  registered: boolean,
  returning = false,
): HackathonLandingCta {
  const hint = spotsHint(pub);
  /** Signed-out returning browsers only — not the same as an active participant. */
  const browseAsReturning = !isSignedIn && returning;

  if (!pub) {
    return {
      labelKey: browseAsReturning ? "goToChallenges" : "register",
      disabled: false,
      hint: null,
    };
  }

  if (pub.phase === "ended") {
    if (registered) {
      return { labelKey: "seeResults", disabled: false, hint: null };
    }
    return { labelKey: "registerForEvent", disabled: false, hint: null };
  }

  if (pub.isFull) {
    return {
      labelKey: registered || browseAsReturning ? "goToChallenges" : "full",
      disabled: !(registered || browseAsReturning),
      hint: null,
    };
  }

  if (isHackathonSignupClosedForNewParticipants(pub, registered)) {
    return {
      labelKey: "registerForEvent",
      disabled: false,
      hint,
    };
  }

  if (registered || browseAsReturning) {
    return {
      labelKey: "goToChallenges",
      disabled: false,
      hint,
    };
  }

  return { labelKey: "register", disabled: false, hint };
}

export function hackathonLandingCtaLabel(
  cta: HackathonLandingCta,
  registerOverride?: string | null,
): string {
  if (cta.labelKey === "register") {
    const custom = registerOverride?.trim();
    if (custom) return custom;
  }
  return CTA_LABELS[cta.labelKey];
}
