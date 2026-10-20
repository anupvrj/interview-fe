import { HACKATHON_LANDING_PATH, HACKATHON_SLUG } from "@/features/hackathon/config";

export const FOOTER_HACKATHON_PROMO = {
  slug: HACKATHON_SLUG,
  landingPath: HACKATHON_LANDING_PATH,
  eyebrow: "The Hiring Games · Free to join",
  title: "Challenge the AI interviewer",
  titleAccent: "Win prizes worth ₹20,000",
  highlights: [
    "Claude subscription",
    "Amazon gift card",
    "InterviewTrix credits",
  ] as const,
  primaryLabel: "Join the hackathon",
  secondaryLabel: "See prizes & rules",
} as const;
