import type { PlanRecord } from "@/lib/planRecord";
import { getPlanMarketingHighlights } from "@/lib/planHighlightsFromFeatures";
import { COMING_SOON_PLAN_FEATURES } from "@/lib/pricingPageContent";

/** Display rows for pricing cards, built from the plans the backend returns. Shared by every pricing UI. */
const COMING_SOON_SUFFIX = /\s*\(Coming soon\)\s*$/i;

function isComingSoonHighlight(
  line: string,
  comingSoonHighlights?: string[],
): boolean {
  const stripped = line.replace(COMING_SOON_SUFFIX, "").trim();
  if (COMING_SOON_SUFFIX.test(line)) return true;
  const markers = comingSoonHighlights?.length
    ? comingSoonHighlights
    : [...COMING_SOON_PLAN_FEATURES];
  return markers.some(
    (h) => h === line || h === stripped || stripped.startsWith(h),
  );
}

export function parseHighlightLine(
  line: string,
  comingSoonHighlights?: string[],
): { text: string; comingSoon: boolean } {
  const text = line.replace(COMING_SOON_SUFFIX, "").trim();
  return {
    text,
    comingSoon: isComingSoonHighlight(line, comingSoonHighlights),
  };
}

export function buildDisplayRows(plans: PlanRecord[]) {
  return plans.map((p) => {
    const isEnterprise = p.planId === "enterprise";
    const isFree = p.planId === "free";
    const priceLabel = isEnterprise
      ? "Custom"
      : isFree
        ? "0"
        : String(p.pricing.monthly);
    const creditsMonthly = p.creditsIncluded.monthly;
    const periodLabel = isEnterprise || isFree ? "" : "month";
    const rawHighlights = p.highlights?.length
      ? p.highlights
      : getPlanMarketingHighlights(p);
    const highlights = rawHighlights.filter(
      (line) => !/^\d[\d,]*\s*credits?\b/i.test(line.trim()),
    );
    const comingSoonHighlights = Array.isArray(p.metadata?.comingSoonHighlights)
      ? p.metadata.comingSoonHighlights
      : [...COMING_SOON_PLAN_FEATURES];
    return {
      id: p.planId,
      plan: p,
      popular: p.isPopular,
      priceLabel,
      creditsMonthly,
      isEnterprise,
      isFree,
      periodLabel,
      highlights,
      comingSoonHighlights,
    };
  });
}

export type PlanRow = ReturnType<typeof buildDisplayRows>[number];
