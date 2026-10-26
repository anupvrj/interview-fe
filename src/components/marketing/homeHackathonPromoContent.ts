import { HACKATHON_LANDING_PATH, HACKATHON_SLUG } from "@/features/hackathon/config";
import { HACKATHON_LAUNCH } from "@/lib/hackathon-2026-content";

/** Matches the default Hiring Games site popup (super-admin seed / spotlight promo). */
export const HOME_HACKATHON_PROMO = {
  slug: HACKATHON_SLUG,
  landingPath: HACKATHON_LANDING_PATH,
  eyebrow: "Live hackathon · The Hiring Games",
  title: "InterviewTrix:",
  titleAccent: "The Hiring Games",
  body: "Build an ATS-ready resume, face the AI interviewer and compete for the prize pool.",
  launchEyebrow: "31 Oct · Live online event",
  launchTitle: "Learn from",
  launchTitleAccent: "Industry Leaders",
  launchBody: "Join the live launch — winners, product updates, and expert career advice in the AI hiring era.",
  launchCountdownLabel: "Live event in",
  priceOriginal: "₹799",
  priceNow: "FREE",
  prizeLabel: "Total prize pool",
  prizeValue: "₹20,000",
  primaryLabel: "Register for free",
  secondaryLabel: "See how it works",
  secondaryChallengeLabel: "Finish your challenge",
  launchPath: `${HACKATHON_LANDING_PATH}?launch=1`,
  launchAt: HACKATHON_LAUNCH.startISO,
} as const;
