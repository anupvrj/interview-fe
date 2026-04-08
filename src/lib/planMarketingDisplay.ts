import type { LucideIcon } from "lucide-react";
import { Sparkles, Zap, Trophy, Crown, Building2 } from "lucide-react";

/**
 * Shared Lucide icons for marketing plan cards (homepage + /pricing).
 * Tailwind gradient strings must appear as literals here so they are generated.
 */
export const MARKETING_ICON_MAP = {
  Sparkles,
  Zap,
  Trophy,
  Crown,
  Building2,
} as const;

export type MarketingIconName = keyof typeof MARKETING_ICON_MAP;

export const PLAN_CARD_GRADIENT: Record<string, string> = {
  free: "from-slate-500 to-slate-600",
  premium: "from-blue-600 to-blue-700",
  enterprise: "from-slate-700 to-slate-900",
};

export const PLAN_ICON_KEY: Record<string, MarketingIconName> = {
  free: "Sparkles",
  premium: "Trophy",
  enterprise: "Building2",
};

export function getMarketingPlanIcon(
  planId: string,
  iconFromApi?: string | null,
): LucideIcon {
  const byId = PLAN_ICON_KEY[planId];
  if (byId) return MARKETING_ICON_MAP[byId];
  if (
    iconFromApi &&
    iconFromApi in MARKETING_ICON_MAP
  ) {
    return MARKETING_ICON_MAP[iconFromApi as MarketingIconName];
  }
  return Sparkles;
}

export function getMarketingPlanGradient(
  planId: string,
  fallbackFromApi?: string | null,
): string {
  return (
    PLAN_CARD_GRADIENT[planId] ??
    fallbackFromApi ??
    "from-gray-500 to-gray-600"
  );
}
