import { cn } from "@/lib/utils";
import {
  appCard,
  appOutlineButton,
  appPrimaryButton,
} from "@/lib/app-theme";

export const resumeBuilderPage = "mx-auto w-full max-w-7xl space-y-6";

export const resumeBuilderCard = cn(
  appCard,
  "overflow-hidden transition-all duration-200",
);

export const resumeBuilderHeroCard = cn(
  resumeBuilderCard,
  "border-[#7367F0]/15 bg-gradient-to-br from-[#7367F0]/[0.06] via-card to-[#7367F0]/[0.04]",
);

export const resumeBuilderInfoBanner = cn(
  resumeBuilderCard,
  "border-[#7367F0]/20 bg-gradient-to-r from-[#7367F0]/[0.06] via-muted/20 to-transparent p-5 sm:p-6",
);

export const resumeBuilderMethodCard = cn(
  resumeBuilderCard,
  "group cursor-pointer border-border/80 p-0 hover:border-primary/35 hover:shadow-[0_8px_28px_rgba(115,103,240,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
);

export const resumeBuilderMethodCardInner =
  "flex h-full flex-col p-6 sm:p-7";

export const resumeBuilderIconShell = cn(
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm",
);

export const resumeBuilderPrimaryIconShell = cn(
  resumeBuilderIconShell,
  "bg-gradient-to-br from-[#7367F0] to-[#8b7ff5] text-white shadow-[0_4px_14px_rgba(115,103,240,0.35)]",
);

export const resumeBuilderLinkedInIconShell = cn(
  resumeBuilderIconShell,
  "bg-[#0A66C2] text-white shadow-[0_4px_14px_rgba(10,102,194,0.35)]",
);

export const resumeBuilderDropzone = cn(
  "cursor-pointer rounded-xl border-2 border-dashed border-[#7367F0]/30 bg-gradient-to-br from-[#7367F0]/[0.04] via-card to-[#7367F0]/[0.08] p-8 text-center transition-all duration-200",
  "hover:border-primary/45 hover:shadow-[0_8px_28px_rgba(115,103,240,0.1)]",
);

export const resumeBuilderDropzoneActive =
  "border-primary/50 bg-primary/[0.06] shadow-[0_0_0_1px_rgba(115,103,240,0.2)]";

export const resumeBuilderFilterPill = cn(
  appOutlineButton,
  "rounded-full border-border/80 px-4 py-2 text-sm font-medium",
);

export const resumeBuilderFilterPillActive = cn(
  appPrimaryButton,
  "rounded-full border-transparent px-4 py-2 text-sm font-medium shadow-[0_2px_10px_rgba(115,103,240,0.35)]",
);

export const resumeBuilderTemplateCard = cn(
  resumeBuilderCard,
  "group relative flex h-full min-h-0 cursor-pointer flex-col border-2 border-border/80 p-0 hover:border-primary/30 hover:shadow-header",
);

export const resumeBuilderTemplateCardSelected = cn(
  "border-primary/50 shadow-[0_0_0_1px_rgba(115,103,240,0.35),0_12px_32px_rgba(115,103,240,0.14)] ring-2 ring-primary/15",
);

export const resumeBuilderSelectedBanner = cn(
  resumeBuilderCard,
  "sticky top-20 z-20 border-primary/25 bg-gradient-to-r from-[#7367F0]/[0.08] via-card to-[#7367F0]/[0.04] p-4 backdrop-blur-md",
);

export const resumeBuilderFooterActions =
  "flex flex-col-reverse gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between";

export const resumeBuilderPrimaryButton = cn(
  appPrimaryButton,
  "shadow-sm hover:shadow-[0_2px_10px_rgba(115,103,240,0.35)]",
);

export const resumeBuilderOutlineButton = appOutlineButton;

export const resumeBuilderMethodToggle = cn(
  "flex gap-1 rounded-xl border border-border/80 bg-muted/30 p-1",
);

export const resumeBuilderMethodToggleItem = (active: boolean) =>
  cn(
    "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
    active
      ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
      : "text-muted-foreground hover:text-foreground",
  );

export const resumeBuilderErrorBanner =
  "rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-700 dark:text-red-300";
