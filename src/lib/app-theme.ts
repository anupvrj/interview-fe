/**
 * Semantic Tailwind class bundles for the Vuexy-inspired InterviewTrix theme.
 * Prefer these over hardcoded hsl(var(--primary)) across pages.
 */

export const appPrimaryButton =
  "bg-[#7367F0] text-white shadow-sm hover:bg-[#6e62e5] transition-colors";

export const appOutlineButton =
  "border border-border bg-card text-foreground shadow-sm hover:border-primary hover:text-primary transition-colors";

export const appGhostButton =
  "text-muted-foreground hover:bg-muted hover:text-foreground transition-colors";

export const appCard =
  "rounded-xl border border-border/80 bg-card text-card-foreground shadow-card";

export const appCardElevated =
  "rounded-xl border border-border/80 bg-card text-card-foreground shadow-header";

export const appPanel = "rounded-xl border border-border/80 bg-card p-4 shadow-card";

export const appTableShell =
  "overflow-hidden rounded-xl border border-border/80 bg-card shadow-card";

export const appFilterBar =
  "rounded-xl border border-border/80 bg-card p-4 shadow-sm";

export const appPageBackground = "bg-background text-foreground";

export const appSidebar =
  "border-r border-sidebar-border/80 bg-sidebar text-sidebar-foreground lg:shadow-[2px_0_8px_rgba(47,43,61,0.04)]";

export const appTopBar =
  "rounded-xl border border-border/60 bg-header px-4 py-2.5 shadow-header";

export const appNavItemActive =
  "bg-[#7367F0] text-white shadow-[0_2px_6px_rgba(115,103,240,0.45)] hover:bg-[#6e62e5]";

export const appNavItemInactive =
  "text-[#6e6b7b] hover:bg-[#7367F0]/[0.06] hover:text-[#7367F0] dark:text-sidebar-foreground dark:hover:text-primary";

export const appNavIconWrap =
  "flex h-[2.125rem] w-[2.125rem] shrink-0 items-center justify-center rounded-lg transition-colors";

export const appSectionLabel =
  "px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#a8aaae] first:pt-0";

export const appBadgeSuccess =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";

export const appBadgeWarning =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";

export const appBadgeInfo =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-muted text-primary dark:bg-muted/40 dark:text-primary/50";

export const appBadgeNeutral =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground";

export const appBadgeDanger =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300";

export const appStatCard =
  "flex min-h-0 min-w-0 items-start gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-card transition-shadow hover:shadow-header sm:gap-4 sm:p-5";

export const appStatIcon =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-[2.625rem] sm:w-[2.625rem]";

export const appStatIconSm =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary";

export const appPrimaryBanner =
  "relative overflow-hidden rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-card sm:px-5 sm:py-4";

export const appEmptyStateIcon =
  "mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-primary-muted text-primary shadow-card";

export const appHeroCard =
  "relative overflow-hidden rounded-xl border border-border/80 bg-card p-6 shadow-card sm:p-8";

export const appMarketingSection = "bg-background";

export const appMarketingSectionAlt = "bg-muted/40";

/** Medium purple marketing band — softer than full primary, still supports white text */
export const appMarketingSectionPurple =
  "relative overflow-hidden bg-gradient-to-br from-[#7268f0] via-[#867cf4] to-[#7a72f2]";

/** Light purple-tinted marketing band — floating icon backdrop on soft gradient */
export const appMarketingSectionLight =
  "relative overflow-hidden border-y border-[#7367F0]/10 bg-gradient-to-br from-[#7367F0]/[0.07] via-white to-[#7367F0]/[0.12]";

/** @deprecated use appPrimaryButton */
export const institutePrimaryClass = `${appPrimaryButton} !bg-[#7367F0] hover:!bg-[#6e62e5]`;

/** @deprecated use appOutlineButton */
export const instituteSecondaryClass = appOutlineButton;

/** @deprecated use appCard */
export const institutePanelClass = appCardElevated;

/** @deprecated use appPanel */
export const institutePanelMutedClass = appPanel;

/** @deprecated use appTableShell */
export const instituteTableShellClass = appTableShell;

/** @deprecated use appFilterBar */
export const instituteFilterBarClass = appFilterBar;
