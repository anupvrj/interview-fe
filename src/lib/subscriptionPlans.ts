export const SUBSCRIPTION_PLAN_IDS = ["free", "premium", "enterprise"] as const;
export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLAN_IDS)[number];

/** Map legacy slugs and normalize casing (matches interview-core). */
export function normalizeSubscriptionPlan(
  raw: string | undefined | null,
): SubscriptionPlanId {
  const s = String(raw || "free").toLowerCase();
  if (s === "starter") return "free";
  if (s === "elite") return "premium";
  if ((SUBSCRIPTION_PLAN_IDS as readonly string[]).includes(s)) {
    return s as SubscriptionPlanId;
  }
  return "free";
}

export function subscriptionPlanDisplayName(
  plan: SubscriptionPlanId,
): string {
  switch (plan) {
    case "premium":
      return "Premium Plan";
    case "enterprise":
      return "Enterprise Plan";
    default:
      return "Free Plan";
  }
}

export function isPaidSubscriptionPlan(
  plan: string | undefined | null,
): boolean {
  const normalized = normalizeSubscriptionPlan(plan);
  return normalized === "premium" || normalized === "enterprise";
}

export type UpgradeOffer = {
  targetPlanId: SubscriptionPlanId;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
};

/** Self-serve upgrade path: free → Premium checkout; premium → Enterprise on pricing. */
export function getUpgradeOffer(
  currentPlan: SubscriptionPlanId,
): UpgradeOffer | null {
  if (currentPlan === "enterprise") {
    return null;
  }

  if (currentPlan === "free") {
    return {
      targetPlanId: "premium",
      title: "Upgrade to Premium",
      description:
        "Unlock more credits, peer interviews, resume tools, and full practice features.",
      ctaLabel: "Upgrade to Premium",
      href: "/checkout?plan=premium",
    };
  }

  return {
    targetPlanId: "enterprise",
    title: "Explore Enterprise",
    description:
      "Need team workflows, analytics, and dedicated support? Talk to us about Enterprise.",
    ctaLabel: "View Enterprise options",
    href: "/pricing#enterprise",
  };
}
