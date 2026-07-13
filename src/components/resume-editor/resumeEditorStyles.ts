/**
 * Resume editor UI tokens — aligned with dashboard Vuexy theme (purple glow, tinted cards).
 */
import { cn } from "@/lib/utils";
import { appPrimaryButton } from "@/lib/app-theme";

export const resumeEditorPage =
  "flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground";

export const resumeEditorToolbar =
  "sticky top-0 z-20 mx-4 mt-4 mb-4 overflow-hidden rounded-xl border border-border/60 bg-header/95 shadow-header backdrop-blur-md sm:mx-5 sm:mt-5 sm:mb-5 lg:mx-6";

export const resumeEditorToolbarInner =
  "mx-auto w-full max-w-full px-4 py-3";

export const resumeEditorPanel =
  "resume-editor-fields order-2 flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-y-auto overscroll-y-contain bg-card md:order-none md:w-1/2 md:border-r md:border-border/80";

export const resumeEditorPanelMobileSheet =
  "fixed left-1/2 top-1/2 z-[55] flex max-h-[min(85dvh,640px)] min-h-0 w-[min(calc(100%-2rem),440px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl md:relative md:inset-auto md:z-auto md:max-h-none md:w-1/2 md:max-w-none md:translate-x-0 md:translate-y-0 md:rounded-none md:border-0 md:border-r md:shadow-none";

export const resumeEditorMobileOverlay =
  "pointer-events-none fixed inset-0 z-[50] bg-black/45 backdrop-blur-[1px] md:hidden";

export const resumeEditorToolbarMobile = "py-2 sm:py-3";

export const resumeEditorTabsRow =
  "border-b border-border/60 bg-gradient-to-r from-[#7367F0]/[0.05] via-card to-[#7367F0]/[0.08]";

export const resumeEditorTabBase =
  "flex-1 px-4 py-3 text-sm font-medium transition-all";

export const resumeEditorTabActive =
  "relative bg-card font-semibold text-primary after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:rounded-full after:bg-[#7367F0] after:shadow-[0_0_10px_rgba(115,103,240,0.45)]";

export const resumeEditorTabInactive =
  "text-muted-foreground hover:bg-muted/40 hover:text-foreground";

export const resumeEditorFormArea = "space-y-4 p-4 sm:p-6";

export const resumeSectionCard =
  "overflow-hidden rounded-xl border border-border/80 bg-card shadow-card transition-all hover:shadow-header";

export const resumeSectionCardDragOver =
  "border-primary/40 shadow-[0_0_0_1px_rgba(115,103,240,0.35),0_8px_24px_rgba(115,103,240,0.16)]";

export const resumeSectionHeader =
  "flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-[#7367F0]/[0.06] via-muted/25 to-transparent px-4 py-3.5";

export const resumeSectionContent = "space-y-4 p-4";

export const resumeEntryCard =
  "space-y-3 rounded-lg border border-border/60 bg-muted/15 p-3 transition-colors hover:border-primary/15 hover:bg-muted/25";

export const resumePrimaryCta = cn(appPrimaryButton, "w-full shadow-sm hover:shadow-[0_2px_10px_rgba(115,103,240,0.35)]");

export const resumeSaveButton = cn(
  appPrimaryButton,
  "shadow-sm hover:shadow-[0_2px_10px_rgba(115,103,240,0.35)]",
);

export const resumeAddSectionsCard =
  "overflow-hidden rounded-xl border border-dashed border-[#7367F0]/30 bg-gradient-to-br from-[#7367F0]/[0.05] via-card to-[#7367F0]/[0.1] shadow-sm";

export const resumeAddSectionButton =
  "justify-start text-xs hover:border-primary/30 hover:bg-primary/[0.06] hover:text-primary";

export const resumePreviewPanel =
  "order-1 flex min-h-0 w-full flex-1 flex-col overflow-auto overscroll-y-contain border-b border-border/60 bg-muted/20 md:order-none md:w-1/2 md:border-b-0";

export const resumePreviewPanelMobile =
  "order-1 flex min-h-0 w-full flex-1 flex-col overflow-auto overscroll-y-contain bg-muted/15 md:border-b-0";

export const resumePreviewHeader =
  "sticky top-0 z-10 hidden items-center justify-between border-b border-border/60 bg-header/95 p-4 backdrop-blur-md md:flex";

export const resumePreviewZoomHeader =
  "sticky top-0 z-20 flex items-center justify-between gap-2 bg-header/95 py-2 shadow-sm backdrop-blur-md";

export const resumePreviewZoomHeaderDesktop =
  "border-b border-border/60 px-3 sm:px-4";

export const resumePreviewZoomHeaderMobile =
  "mx-4 mb-4 overflow-hidden rounded-xl border border-border/60 px-3 shadow-header";

export const resumeGripIcon =
  "h-4 w-4 shrink-0 text-muted-foreground/70";

/** Drag-only handle — keeps section cards from hijacking text selection in editors. */
export const resumeSectionDragHandle =
  "flex shrink-0 cursor-grab touch-none items-center justify-center rounded-md p-0.5 text-muted-foreground/70 transition-colors hover:bg-primary/10 hover:text-primary active:cursor-grabbing";

export const resumeSectionTitle = "flex-1 text-sm font-semibold text-foreground";

export const resumeAtsScoreShell =
  "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm sm:gap-2 sm:px-4";

export function resumeAtsScoreTone(score: number | null): string {
  if (score === null) {
    return "border-border/80 bg-muted/40 text-muted-foreground";
  }
  if (score >= 80) {
    return "border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-emerald-500/5 text-emerald-700 dark:text-emerald-300";
  }
  if (score >= 60) {
    return "border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-card to-amber-500/5 text-amber-700 dark:text-amber-300";
  }
  return "border-red-500/25 bg-gradient-to-br from-red-500/10 via-card to-red-500/5 text-red-700 dark:text-red-300";
}

export function resumeSectionCardClass(
  isDragOver: boolean,
  isDragging: boolean,
): string {
  return cn(
    resumeSectionCard,
    isDragOver && resumeSectionCardDragOver,
    isDragging && "opacity-50",
  );
}
