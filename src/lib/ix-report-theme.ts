import type { LucideIcon } from "lucide-react";
import { Code2, MessageSquare, Network, UsersRound } from "lucide-react";
import type { IxCategoryKey } from "@/lib/api";

export type IxCategoryVisual = {
  icon: LucideIcon;
  cardClass: string;
  iconShell: string;
  accentText: string;
  ringColor: string;
  barColor: string;
};

const categoryCardBase =
  "border-border/70 bg-card hover:shadow-sm dark:bg-card";

export const IX_CATEGORY_VISUAL: Record<IxCategoryKey, IxCategoryVisual> = {
  screening: {
    icon: MessageSquare,
    cardClass: `${categoryCardBase} hover:border-violet-500/25`,
    iconShell: "bg-violet-500/8 text-violet-600 dark:text-violet-400",
    accentText: "text-violet-600 dark:text-violet-400",
    ringColor: "#8b5cf6",
    barColor: "bg-violet-500",
  },
  coding: {
    icon: Code2,
    cardClass: `${categoryCardBase} hover:border-cyan-500/25`,
    iconShell: "bg-cyan-500/8 text-cyan-600 dark:text-cyan-400",
    accentText: "text-cyan-600 dark:text-cyan-400",
    ringColor: "#06b6d4",
    barColor: "bg-cyan-500",
  },
  systemDesign: {
    icon: Network,
    cardClass: `${categoryCardBase} hover:border-indigo-500/25`,
    iconShell: "bg-indigo-500/8 text-indigo-600 dark:text-indigo-400",
    accentText: "text-indigo-600 dark:text-indigo-400",
    ringColor: "#6366f1",
    barColor: "bg-indigo-500",
  },
  peer: {
    icon: UsersRound,
    cardClass: `${categoryCardBase} hover:border-amber-500/25`,
    iconShell: "bg-amber-500/8 text-amber-600 dark:text-amber-400",
    accentText: "text-amber-600 dark:text-amber-400",
    ringColor: "#f59e0b",
    barColor: "bg-amber-500",
  },
};

/** Clean white card shell for iX Report panels */
export const ixReportHeroGradient =
  "relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm dark:bg-card";

export const ixReportSectionEnter = "ix-report-enter";
