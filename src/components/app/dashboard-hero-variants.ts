export type DashboardHeroVariant =
  | "primary"
  | "violet"
  | "emerald"
  | "teal"
  | "indigo"
  | "coral"
  | "amber"
  | "purple"
  | "slate";

export const dashboardHeroVariants: Record<
  DashboardHeroVariant,
  {
    gradient: string;
    orbBase: string;
    orbLight: string;
    orbDark: string;
    orbHighlight: string;
    orbShadow: string;
    actionPrimary: string;
    actionOutline: string;
  }
> = {
  primary: {
    gradient:
      "bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 dark:from-blue-700 dark:via-indigo-800 dark:to-indigo-950",
    orbBase: "#4f46e5",
    orbLight: "#818cf8",
    orbDark: "#3730a3",
    orbHighlight: "#e0e7ff",
    orbShadow: "#312e81",
    actionPrimary:
      "bg-white text-blue-700 shadow-lg shadow-blue-900/20 hover:bg-white/95",
    actionOutline:
      "border-white/35 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm",
  },
  violet: {
    gradient:
      "bg-gradient-to-br from-violet-600 via-violet-600 to-purple-700 dark:from-violet-700 dark:via-purple-800 dark:to-purple-950",
    orbBase: "#7c3aed",
    orbLight: "#a78bfa",
    orbDark: "#5b21b6",
    orbHighlight: "#ede9fe",
    orbShadow: "#4c1d95",
    actionPrimary:
      "bg-white text-violet-700 shadow-lg shadow-violet-900/20 hover:bg-white/95",
    actionOutline:
      "border-white/35 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm",
  },
  emerald: {
    gradient:
      "bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 dark:from-emerald-700 dark:via-teal-800 dark:to-teal-950",
    orbBase: "#047857",
    orbLight: "#a7f3d0",
    orbDark: "#064e3b",
    orbHighlight: "#ecfdf5",
    orbShadow: "#022c22",
    actionPrimary:
      "bg-white text-emerald-700 shadow-lg shadow-emerald-900/20 hover:bg-white/95",
    actionOutline:
      "border-white/35 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm",
  },
  teal: {
    gradient:
      "bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700 dark:from-teal-700 dark:via-cyan-800 dark:to-blue-950",
    orbBase: "#0f766e",
    orbLight: "#99f6e4",
    orbDark: "#115e59",
    orbHighlight: "#f0fdfa",
    orbShadow: "#134e4a",
    actionPrimary:
      "bg-white text-teal-700 shadow-lg shadow-teal-900/20 hover:bg-white/95",
    actionOutline:
      "border-white/35 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm",
  },
  indigo: {
    gradient:
      "bg-gradient-to-br from-indigo-600 via-indigo-600 to-blue-800 dark:from-indigo-700 dark:via-indigo-800 dark:to-blue-950",
    orbBase: "#4338ca",
    orbLight: "#c7d2fe",
    orbDark: "#312e81",
    orbHighlight: "#eef2ff",
    orbShadow: "#1e1b4b",
    actionPrimary:
      "bg-white text-indigo-700 shadow-lg shadow-indigo-900/20 hover:bg-white/95",
    actionOutline:
      "border-white/35 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm",
  },
  coral: {
    gradient:
      "bg-gradient-to-br from-rose-500 via-pink-600 to-fuchsia-700 dark:from-rose-600 dark:via-pink-700 dark:to-fuchsia-900",
    orbBase: "#be185d",
    orbLight: "#fbcfe8",
    orbDark: "#831843",
    orbHighlight: "#fdf2f8",
    orbShadow: "#500724",
    actionPrimary:
      "bg-white text-rose-700 shadow-lg shadow-rose-900/20 hover:bg-white/95",
    actionOutline:
      "border-white/35 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm",
  },
  amber: {
    gradient:
      "bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 dark:from-amber-600 dark:via-orange-700 dark:to-rose-800",
    orbBase: "#c2410c",
    orbLight: "#fed7aa",
    orbDark: "#9a3412",
    orbHighlight: "#fff7ed",
    orbShadow: "#7c2d12",
    actionPrimary:
      "bg-white text-amber-800 shadow-lg shadow-amber-900/20 hover:bg-white/95",
    actionOutline:
      "border-white/35 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm",
  },
  purple: {
    gradient:
      "bg-gradient-to-br from-[#7367F0] via-violet-600 to-indigo-700 dark:from-[#6254e8] dark:via-violet-700 dark:to-indigo-900",
    orbBase: "#7367F0",
    orbLight: "#9d93f5",
    orbDark: "#5a4fcf",
    orbHighlight: "#ece9fe",
    orbShadow: "#4538b5",
    actionPrimary:
      "bg-white text-[#7367F0] shadow-lg shadow-violet-900/20 hover:bg-white/95",
    actionOutline:
      "border-white/35 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm",
  },
  slate: {
    gradient:
      "bg-gradient-to-br from-slate-700 via-slate-800 to-indigo-900 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-950",
    orbBase: "#475569",
    orbLight: "#cbd5e1",
    orbDark: "#334155",
    orbHighlight: "#f1f5f9",
    orbShadow: "#1e293b",
    actionPrimary:
      "bg-white text-foreground shadow-lg shadow-slate-900/25 hover:bg-white/95",
    actionOutline:
      "border-white/35 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm",
  },
};
