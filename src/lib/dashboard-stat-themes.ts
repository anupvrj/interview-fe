/** Shared hero stat cards — uses theme `primary` (purple light, hackathon blue dark). */
export const dashboardHeroStatPalette = {
  shell:
    "border-primary/15 bg-gradient-to-br from-primary/[0.07] via-card to-primary/[0.12] shadow-card",
  label: "text-primary",
  value: "text-foreground",
  hint: "text-muted-foreground",
  iconShell: "border-primary/12 bg-primary/10 text-primary",
  progressTrack: "bg-primary/12",
  progressFill: "bg-primary",
  footerBars: [
    "bg-primary/35",
    "bg-primary/18",
    "bg-primary/18",
  ] as [string, string, string],
};

/** Kept for API compatibility — labels use unified primary */
export const dashboardStatAccents = {
  purple: "text-primary",
  emerald: "text-primary",
  cyan: "text-primary",
  amber: "text-primary",
  rose: "text-primary",
  sky: "text-primary",
  violet: "text-primary",
  orange: "text-primary",
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
    card: "border-primary/20 bg-card shadow-card",
    icon: "bg-primary/12 text-primary",
    label: "text-primary",
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

/** Recharts / SVG fills — match dashboard `primary` token per theme. */
export const dashboardChartPrimaryFill = {
  light: "#7367F0",
  dark: "#3aa6ff",
} as const;
