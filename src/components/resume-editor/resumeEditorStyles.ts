/**
 * Resume editor UI tokens — aligned with dashboard Vuexy theme (purple glow, tinted cards).
 */
import { cn } from "@/lib/utils";
import { appPrimaryButton } from "@/lib/app-theme";

export const resumeEditorPage =
  "flex h-[calc(100dvh-4.5rem)] min-h-0 flex-col bg-background text-foreground sm:h-[calc(100dvh-5rem)]";

export const resumeEditorToolbar =
  "sticky top-0 z-20 border-b border-border/60 bg-header/95 shadow-header backdrop-blur-md";

export const resumeEditorToolbarInner = "mx-auto max-w-full px-4 py-3";

export const resumeEditorPanel =
  "resume-editor-fields order-2 flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-y-auto bg-card md:order-none md:w-1/2 md:border-r md:border-border/80";

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
  "order-1 flex min-h-0 w-full flex-1 flex-col overflow-auto border-b border-border/60 bg-muted/20 md:order-none md:w-1/2 md:border-b-0";

export const resumePreviewHeader =
  "sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-header/95 p-4 backdrop-blur-md";

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
    return "border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-emerald-500/5 text-emerald-700";
  }
  if (score >= 60) {
    return "border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-card to-amber-500/5 text-amber-700";
  }
  return "border-red-500/25 bg-gradient-to-br from-red-500/10 via-card to-red-500/5 text-red-700";
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
