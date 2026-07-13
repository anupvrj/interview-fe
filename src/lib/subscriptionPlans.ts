/**
 * Canonical plan slugs — keep aligned with interview-core/src/constants/subscriptionPlans.ts
 */

export const SUBSCRIPTION_PLAN_IDS = [
  "free",
  "trial",
  "general_pass",
  "tech_basic",
  "tech_pro",
  "enterprise",
] as const;

export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLAN_IDS)[number];

/** Self-serve upgrade ladder (excludes enterprise — sales-led). */
export const SELF_SERVE_PLAN_ORDER: SubscriptionPlanId[] = [
  "free",
  "general_pass",
  "tech_basic",
  "tech_pro",
];

export function normalizeSubscriptionPlan(
  raw: string | undefined | null,
): SubscriptionPlanId {
  const s = String(raw || "free").toLowerCase();
  if (s === "starter" || s === "basic") return "tech_basic";
  if (s === "premium" || s === "elite") return "tech_pro";
  if (s === "general") return "general_pass";
  if ((SUBSCRIPTION_PLAN_IDS as readonly string[]).includes(s)) {
    return s as SubscriptionPlanId;
  }
  return "free";
}

export function isHighestSelfServePlan(plan: SubscriptionPlanId): boolean {
  return plan === "tech_pro" || plan === "enterprise";
}

export function getNextPlanId(
  currentPlan: SubscriptionPlanId,
): SubscriptionPlanId | null {
  const index = SELF_SERVE_PLAN_ORDER.indexOf(currentPlan);
  if (index === -1 || index >= SELF_SERVE_PLAN_ORDER.length - 1) {
    return null;
  }
  return SELF_SERVE_PLAN_ORDER[index + 1];
}
