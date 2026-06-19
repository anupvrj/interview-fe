import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Zap,
  Trophy,
  Crown,
  Building2,
  Mic,
  Code2,
} from "lucide-react";

export const MARKETING_ICON_MAP = {
  Sparkles,
  Zap,
  Trophy,
  Crown,
  Building2,
  Mic,
  Code: Code2,
} as const;

export type MarketingIconName = keyof typeof MARKETING_ICON_MAP;

export const PLAN_CARD_GRADIENT: Record<string, string> = {
  free: "from-slate-500 to-slate-600",
  general_pass: "from-violet-500 to-purple-600",
  tech_basic: "from-blue-500 to-cyan-600",
  tech_pro: "from-primary to-indigo-700",
  premium: "from-primary to-indigo-700",
  enterprise: "from-slate-700 to-slate-900",
};

export const PLAN_ICON_KEY: Record<string, MarketingIconName> = {
  free: "Sparkles",
  general_pass: "Mic",
  tech_basic: "Code",
  tech_pro: "Trophy",
  premium: "Trophy",
  enterprise: "Building2",
};

export function getMarketingPlanIcon(
  planId: string,
  iconFromApi?: string | null,
): LucideIcon {
  const byId = PLAN_ICON_KEY[planId];
  if (byId) return MARKETING_ICON_MAP[byId];
  if (iconFromApi && iconFromApi in MARKETING_ICON_MAP) {
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
