/** Shared hero purple — light tinted stat cards (one primary colour) */
export const dashboardHeroStatPalette = {
  shell:
    "border-[#7367F0]/15 bg-gradient-to-br from-[#7367F0]/[0.07] via-card to-[#7367F0]/[0.12] shadow-card",
  label: "text-[#7367F0]",
  value: "text-foreground",
  hint: "text-muted-foreground",
  iconShell: "border-[#7367F0]/12 bg-[#7367F0]/10 text-[#7367F0]",
  progressTrack: "bg-[#7367F0]/12",
  progressFill: "bg-[#7367F0]",
  footerBars: [
    "bg-[#7367F0]/35",
    "bg-[#7367F0]/18",
    "bg-[#7367F0]/18",
  ] as [string, string, string],
};

/** Kept for API compatibility — labels use unified primary purple */
export const dashboardStatAccents = {
  purple: "text-[#7367F0]",
  emerald: "text-[#7367F0]",
  cyan: "text-[#7367F0]",
  amber: "text-[#7367F0]",
  rose: "text-[#7367F0]",
  sky: "text-[#7367F0]",
  violet: "text-[#7367F0]",
  orange: "text-[#7367F0]",
} as const;

export type DashboardStatThemeKey = keyof typeof dashboardStatAccents;

/** Original light tiles — insights section only */
export type DashboardInsightTheme = {
  card: string;
  icon: string;
  label: string;
};

export const dashboardInsightThemes = {
  purple: {
    card: "border-[#7367F0]/20 bg-card shadow-card",
    icon: "bg-[#7367F0]/12 text-[#7367F0]",
    label: "text-[#7367F0]",
  },
  emerald: {
    card: "border-emerald-500/20 bg-card shadow-card",
    icon: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
    label: "text-emerald-600 dark:text-emerald-400",
  },
  cyan: {
    card: "border-cyan-500/20 bg-card shadow-card",
    icon: "bg-cyan-500/12 text-cyan-600 dark:text-cyan-400",
    label: "text-cyan-600 dark:text-cyan-400",
  },
  amber: {
    card: "border-amber-500/20 bg-card shadow-card",
    icon: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
    label: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    card: "border-rose-500/20 bg-card shadow-card",
    icon: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
    label: "text-rose-600 dark:text-rose-400",
  },
  sky: {
    card: "border-sky-500/20 bg-card shadow-card",
    icon: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
    label: "text-sky-600 dark:text-sky-400",
  },
  violet: {
    card: "border-violet-500/20 bg-card shadow-card",
    icon: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
    label: "text-violet-600 dark:text-violet-400",
  },
  orange: {
    card: "border-orange-500/20 bg-card shadow-card",
    icon: "bg-orange-500/12 text-orange-600 dark:text-orange-400",
    label: "text-orange-600 dark:text-orange-400",
  },
} as const satisfies Record<DashboardStatThemeKey, DashboardInsightTheme>;
