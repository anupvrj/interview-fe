"use client";

import type { ReactNode } from "react";
import {
  Pencil,
  Undo2,
  Redo2,
  Upload,
  LayoutGrid,
  Palette,
  Plus,
  Save,
  Download,
  Loader2,
  Check,
  FileText,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { resumeSaveButton } from "@/components/resume-editor/resumeEditorStyles";

type SectionItem = {
  id: string;
  title: string;
  type: string;
};

type RailAction = {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  primary?: boolean;
};

type ResumeEditorMobileChromeProps = {
  sectionPickerOpen: boolean;
  onSectionPickerOpenChange: (open: boolean) => void;
  sections: SectionItem[];
  onPickSection: (sectionId: string) => void;
  onPickLayout: () => void;
  onPickAddSections: () => void;
  onOpenSections: () => void;
  onPickerDone: () => void;
  viewMode: "edit" | "ats";
  onViewModeChange: (mode: "edit" | "ats") => void;
  canUndo: boolean;
  onUndo: () => void;
  canRedo: boolean;
  onRedo: () => void;
  onImport: () => void;
  onRearrange: () => void;
  rearrangeDisabled?: boolean;
  onChangeTemplate: () => void;
  changingTemplate?: boolean;
  onSave: () => void;
  saving?: boolean;
  hasChanges?: boolean;
  autoSaving?: boolean;
  onDownload: () => void;
  downloading?: boolean;
  refreshingATS?: boolean;
  actionsDisabled?: boolean;
};

function RailButton({ action }: { action: RailAction }) {
  return (
    <button
      type="button"
      title={action.label}
      aria-label={action.label}
      disabled={action.disabled}
      onClick={action.onClick}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm transition-all",
        action.primary
          ? "border-[#7367F0]/40 bg-[#7367F0] text-white hover:bg-[#6358d8]"
          : action.active
            ? "border-[#7367F0]/35 bg-[#7367F0]/10 text-[#7367F0]"
            : "border-border/70 bg-card/95 text-foreground hover:border-[#7367F0]/30 hover:bg-[#7367F0]/5",
        action.disabled && "pointer-events-none opacity-45",
      )}
    >
      {action.icon}
    </button>
  );
}

export function ResumeEditorMobileChrome({
  sectionPickerOpen,
  onSectionPickerOpenChange,
  sections,
  onPickSection,
  onPickLayout,
  onPickAddSections,
  onOpenSections,
  onPickerDone,
  viewMode,
  onViewModeChange,
  canUndo,
  onUndo,
  canRedo,
  onRedo,
  onImport,
  onRearrange,
  rearrangeDisabled,
  onChangeTemplate,
  changingTemplate,
  onSave,
  saving,
  hasChanges,
  autoSaving,
  onDownload,
  downloading,
  refreshingATS,
  actionsDisabled,
}: ResumeEditorMobileChromeProps) {
  const disabled = actionsDisabled || refreshingATS;

  const railActions: RailAction[] = [
    {
      id: "sections",
      label: "Edit sections",
      icon: <Pencil className="h-4 w-4" />,
      onClick: onOpenSections,
      active: sectionPickerOpen,
      disabled,
    },
    {
      id: "undo",
      label: "Undo",
      icon: <Undo2 className="h-4 w-4" />,
      onClick: onUndo,
      disabled: disabled || !canUndo,
    },
    {
      id: "redo",
      label: "Redo",
      icon: <Redo2 className="h-4 w-4" />,
      onClick: onRedo,
      disabled: disabled || !canRedo,
    },
    {
      id: "import",
      label: "Import resume",
      icon: <Upload className="h-4 w-4" />,
      onClick: onImport,
      disabled,
    },
    {
      id: "rearrange",
      label: "Rearrange sections",
      icon: <LayoutGrid className="h-4 w-4" />,
      onClick: onRearrange,
      disabled: disabled || rearrangeDisabled,
    },
    {
      id: "template",
      label: "Change template",
      icon: changingTemplate ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Palette className="h-4 w-4" />
      ),
      onClick: onChangeTemplate,
      disabled: disabled || changingTemplate,
    },
    {
      id: "save",
      label: saving ? "Saving…" : hasChanges ? "Save" : "Saved",
      icon: saving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : hasChanges ? (
        <Save className="h-4 w-4" />
      ) : (
        <Check className="h-4 w-4" />
      ),
      onClick: onSave,
      disabled: saving || !hasChanges || autoSaving,
      primary: true,
    },
    {
      id: "download",
      label: "Download PDF",
      icon: downloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      ),
      onClick: onDownload,
      disabled: downloading,
    },
    {
      id: "ats",
      label: "ATS report",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => onViewModeChange(viewMode === "ats" ? "edit" : "ats"),
      active: viewMode === "ats",
      disabled,
    },
  ];

  return (
    <>
      <div
        className="pointer-events-none fixed left-2 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2 md:hidden"
        aria-hidden={false}
      >
        <div className="pointer-events-auto flex flex-col gap-1.5 rounded-2xl border border-border/60 bg-card/90 p-1.5 shadow-lg backdrop-blur-md">
          {railActions.map((action) => (
            <RailButton key={action.id} action={action} />
          ))}
        </div>
      </div>

      <Dialog open={sectionPickerOpen} onOpenChange={onSectionPickerOpenChange}>
        <DialogContent className="z-[70] flex max-h-[min(82dvh,600px)] w-[calc(100%-2rem)] max-w-[440px] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[440px] [&>button]:hidden">
          <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-3 border-b border-border/60 px-4 py-4 text-left">
            <DialogTitle className="min-w-0 flex-1">Edit resume</DialogTitle>
            <Button
              type="button"
              size="sm"
              className={cn(resumeSaveButton, "shrink-0 px-4")}
              onClick={onPickerDone}
            >
              Done
            </Button>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
            <button
              type="button"
              onClick={onPickLayout}
              className="mb-2 flex w-full items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-left transition-colors hover:border-[#7367F0]/30 hover:bg-[#7367F0]/5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
                <Settings2 className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  Layout &amp; typography
                </span>
                <span className="text-xs text-muted-foreground">
                  Margins, fonts, and column settings
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={onPickAddSections}
              className="mb-3 flex w-full items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-left transition-colors hover:border-[#7367F0]/30 hover:bg-[#7367F0]/5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
                <Plus className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  Add more sections
                </span>
                <span className="text-xs text-muted-foreground">
                  Projects, languages, certificates, and more
                </span>
              </span>
            </button>

            <ul className="space-y-1.5">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => onPickSection(section.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 text-left transition-colors hover:border-[#7367F0]/30 hover:bg-[#7367F0]/5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {section.title}
                      </span>
                      <span className="text-xs capitalize text-muted-foreground">
                        {section.type.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#7367F0]/25 bg-[#7367F0]/10 text-[#7367F0]">
                      <Pencil className="h-4 w-4" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ResumeEditorMobileEditBar({
  title,
  onDone,
}: {
  title: string;
  onDone: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-card/95 px-4 py-3 backdrop-blur-md md:hidden">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
      </div>
      <Button
        type="button"
        size="sm"
        className={cn(resumeSaveButton, "shrink-0 px-4")}
        onClick={onDone}
      >
        Done
      </Button>
    </div>
  );
}
