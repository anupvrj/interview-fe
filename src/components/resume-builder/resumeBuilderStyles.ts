import { cn } from "@/lib/utils";

/*
 * The resume flow in the 2026 dashboard style: 18px cards on the card surface, Geist type, primary
 * buttons with the soft violet lift, outline buttons that stay quiet. Shared by /dashboard/resumes/new,
 * /from-job and the editor's import dialog, so they all read as one product.
 */

export const resumeBuilderPage = "mx-auto w-full max-w-7xl space-y-5 lg:space-y-6";

export const resumeBuilderCard = "overflow-hidden rounded-[18px] border border-border bg-card text-card-foreground transition-all duration-200";

export const resumeBuilderHeroCard = cn(resumeBuilderCard, "relative");

export const resumeBuilderInfoBanner = cn(resumeBuilderCard, "relative p-5 sm:p-6");

export const resumeBuilderMethodCard = cn(
  resumeBuilderCard,
  "group relative cursor-pointer p-0 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_24px_50px_-30px_rgba(115,103,240,.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
);

export const resumeBuilderMethodCardInner = "flex h-full flex-col p-6 sm:p-7";

export const resumeBuilderIconShell = "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl";

export const resumeBuilderPrimaryIconShell = cn(
  resumeBuilderIconShell,
  "border border-primary/15 bg-gradient-to-br from-[#F1EEFF] to-[#E3EEFF] text-primary shadow-[0_12px_26px_-16px_rgba(75,63,208,.6),inset_0_1px_0_#fff] dark:from-primary/20 dark:to-sky-500/10 dark:shadow-none",
);

export const resumeBuilderLinkedInIconShell = cn(
  resumeBuilderIconShell,
  "bg-[#0A66C2] text-white shadow-[0_12px_26px_-14px_rgba(10,102,194,.8)]",
);

export const resumeBuilderDropzone = cn(
  "cursor-pointer rounded-[18px] border-2 border-dashed border-primary/30 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(115,103,240,.08),transparent_70%)] px-6 py-12 text-center transition-all duration-200",
  "hover:border-primary/55 hover:bg-primary/[0.03]",
);

export const resumeBuilderDropzoneActive = "border-primary bg-primary/[0.06] shadow-[0_0_0_4px_rgba(115,103,240,0.12)]";

export const resumeBuilderFilterPill =
  "inline-flex h-9 items-center rounded-lg px-3.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground";

export const resumeBuilderFilterPillActive =
  "inline-flex h-9 items-center rounded-lg bg-primary px-3.5 text-[13.5px] font-medium text-white shadow-[0_6px_16px_-8px_rgba(115,103,240,.8)]";

export const resumeBuilderTemplateCard = cn(
  "group relative flex h-full min-h-0 cursor-pointer flex-col rounded-[18px] border border-border bg-card p-3 transition-all duration-300",
  "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_24px_50px_-30px_rgba(115,103,240,.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
);

export const resumeBuilderTemplateCardSelected = "border-primary shadow-[0_0_0_4px_rgba(115,103,240,0.14),0_24px_50px_-30px_rgba(115,103,240,.6)]";

export const resumeBuilderSelectedBanner = cn(resumeBuilderCard, "p-4");

export const resumeBuilderFooterActions =
  "flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between";

export const resumeBuilderPrimaryButton =
  "h-11 rounded-xl bg-primary px-5 text-[14.5px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(115,103,240,.75)] transition-colors hover:bg-primary/90";

export const resumeBuilderOutlineButton =
  "h-11 rounded-xl border border-border bg-card px-5 text-[14.5px] font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary";

export const resumeBuilderMethodToggle = "flex gap-1 rounded-xl border border-border bg-background p-1";

export const resumeBuilderMethodToggleItem = (active: boolean) =>
  cn(
    "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
    active ? "bg-primary text-white shadow-[0_6px_16px_-8px_rgba(115,103,240,.8)]" : "text-muted-foreground hover:text-foreground",
  );

export const resumeBuilderErrorBanner =
  "rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-700 dark:text-red-300";
