import { HACKATHON_LANDING_PATH, HACKATHON_SLUG } from "@/features/hackathon/config";

/** Matches the default Hiring Games site popup (super-admin seed / spotlight promo). */
export const HOME_HACKATHON_PROMO = {
  slug: HACKATHON_SLUG,
  landingPath: HACKATHON_LANDING_PATH,
  eyebrow: "Live hackathon · The Hiring Games",
  title: "InterviewTrix:",
  titleAccent: "The Hiring Games",
  body: "Build an ATS-ready resume, face the AI interviewer and compete for the prize pool.",
  priceOriginal: "₹799",
  priceNow: "FREE",
  prizeLabel: "Total prize pool",
  prizeValue: "₹20,000",
  primaryLabel: "Register for free",
  secondaryLabel: "See how it works",
} as const;
