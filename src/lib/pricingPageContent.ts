/**
 * Pricing page static content — aligned with plansSeedData.ts
 */

export const PAID_PLAN_IDS = [
  "general_pass",
  "tech_basic",
  "tech_pro",
] as const;

export const CHECKOUT_PLAN_IDS = ["trial", ...PAID_PLAN_IDS] as const;

export type PaidPlanId = (typeof PAID_PLAN_IDS)[number];
export type CheckoutPlanId = (typeof CHECKOUT_PLAN_IDS)[number];

export function isPaidPlanId(id: string): id is PaidPlanId {
  return (PAID_PLAN_IDS as readonly string[]).includes(id);
}

export function isCheckoutPlanId(id: string): id is CheckoutPlanId {
  return (CHECKOUT_PLAN_IDS as readonly string[]).includes(id);
}

/** Features tagged "Coming soon" on plan cards — aligned with plansSeedData.ts */
export const COMING_SOON_PLAN_FEATURES = [
  "Personalized Job Matcher",
  "Peer Interview",
  "Interview Scheduler",
] as const;

export type ComparisonCell = string | boolean;

export interface ComparisonRow {
  feature: string;
  general_pass: ComparisonCell;
  tech_basic: ComparisonCell;
  tech_pro: ComparisonCell;
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Target audience",
    general_pass: "Plan for everyone",
    tech_basic: "Jr & mid developers",
    tech_pro: "Sr engineers / tech leads",
  },
  {
    feature: "Monthly pricing",
    general_pass: "₹699/mo",
    tech_basic: "₹899/mo",
    tech_pro: "₹1,999/mo",
  },
  {
    feature: "Monthly credits on renewal",
    general_pass: "600",
    tech_basic: "1,000",
    tech_pro: "3,000",
  },
  {
    feature: "Interview burn rate",
    general_pass: "5 credits / min",
    tech_basic: "5 credits / min",
    tech_pro: "5 credits / min",
  },
  {
    feature: "AI mock interviews",
    general_pass: "Unlimited (credits)",
    tech_basic: "Unlimited (credits)",
    tech_pro: "Unlimited (credits)",
  },
  {
    feature: "Coding round practice",
    general_pass: "—",
    tech_basic: "Unlimited (credits)",
    tech_pro: "Unlimited (credits)",
  },
  {
    feature: "System design practice",
    general_pass: "—",
    tech_basic: "Unlimited (credits)",
    tech_pro: "Unlimited (credits)",
  },
  {
    feature: "Free peer interviews / period",
    general_pass: "—",
    tech_basic: "—",
    tech_pro: "2",
  },
  {
    feature: "White board drawing",
    general_pass: false,
    tech_basic: true,
    tech_pro: true,
  },
  {
    feature: "Unlimited resume design",
    general_pass: true,
    tech_basic: true,
    tech_pro: true,
  },
  {
    feature: "Unlimited ATS checker",
    general_pass: true,
    tech_basic: true,
    tech_pro: true,
  },
  {
    feature: "Unlimited ATS optimizer",
    general_pass: true,
    tech_basic: true,
    tech_pro: true,
  },
  {
    feature: "One click resume optimizer",
    general_pass: true,
    tech_basic: true,
    tech_pro: true,
  },
  {
    feature: "Detailed interview report",
    general_pass: true,
    tech_basic: true,
    tech_pro: true,
  },
  {
    feature: "Growth tracking",
    general_pass: true,
    tech_basic: true,
    tech_pro: true,
  },
  {
    feature: "Target company practice",
    general_pass: true,
    tech_basic: true,
    tech_pro: true,
  },
  {
    feature: "Latest real interview questions",
    general_pass: true,
    tech_basic: true,
    tech_pro: true,
  },
  {
    feature: "Behavioural mock interviews",
    general_pass: true,
    tech_basic: true,
    tech_pro: true,
  },
  {
    feature: "Advanced & fine-tuned AI",
    general_pass: true,
    tech_basic: true,
    tech_pro: true,
  },
  {
    feature: "Personalized job matcher",
    general_pass: "Coming soon",
    tech_basic: "Coming soon",
    tech_pro: "Coming soon",
  },
  {
    feature: "Peer interview",
    general_pass: "Coming soon",
    tech_basic: "Coming soon",
    tech_pro: "Coming soon",
  },
  {
    feature: "Interview scheduler",
    general_pass: "Coming soon",
    tech_basic: "Coming soon",
    tech_pro: "Coming soon",
  },
];

export const PRICING_FAQ = [
  {
    question: "Why is the General Pass cheaper?",
    answer:
      "General Pass focuses on mock screening interviews, resume design, and ATS tools — without live coding compilers or system design whiteboards. That keeps the price lower for candidates who do not need the full technical stack.",
  },
  {
    question: "Can I upgrade from General Pass to Tech Basic?",
    answer:
      "Yes. You can upgrade or downgrade your active subscription from your profile settings. Pricing adjustments are prorated for your remaining billing period.",
  },
  {
    question: "How do monthly session limits reset?",
    answer:
      "Mock interview, coding, and system design counters reset at the start of each billing cycle on your subscription payment date. Unused sessions do not roll over.",
  },
  {
    question: "Do resumes or ATS scans use my interview limits?",
    answer:
      "No. Resume design, ATS checker, ATS optimizer, and one-click resume optimizer are included with your plan and do not consume your mock interview allotments.",
  },
  {
    question: "What payment methods work for auto-renewal?",
    answer:
      "Checkout accepts credit cards, debit cards, and UPI AutoPay mandates. You can cancel recurring billing anytime with no exit fees.",
  },
];

export const PLAN_COLUMN_LABELS: Record<PaidPlanId, string> = {
  general_pass: "General Pass",
  tech_basic: "Tech Basic",
  tech_pro: "Tech Pro",
};
