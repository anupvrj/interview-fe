"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GripVertical, Lock } from "lucide-react";
import type { ResumeTemplate } from "@/lib/api";
import type { SectionWithColumn } from "@/lib/sectionColumnUtils";
import {
  applySectionDrop,
  getSectionBoxLabel,
  groupSectionsIntoPages,
  isSectionLocked,
  partitionSectionsForRearrange,
  rebuildSectionsFromRearrange,
  type RearrangeLayoutType,
  type RearrangePartition,
} from "@/lib/rearrange-sections";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ColumnKey = "left" | "right" | "single";

interface RearrangeSectionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: SectionWithColumn[];
  layoutType: RearrangeLayoutType;
  template: ResumeTemplate;
  onSectionsChange: (sections: SectionWithColumn[]) => void;
}

interface SectionBoxProps {
  section: SectionWithColumn;
  locked?: boolean;
  draggable?: boolean;
  onDragStart: (sectionId: string) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (sectionId: string) => void;
  isDragOver?: boolean;
}

function SectionBox({
  section,
  locked = false,
  draggable = true,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver = false,
}: SectionBoxProps) {
  return (
    <div
      draggable={draggable && !locked}
      onDragStart={(event) => {
        if (locked) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", section.id);
        onDragStart(section.id);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver(event);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDrop(section.id);
      }}
      className={cn(
        "relative flex min-h-[52px] items-center justify-center rounded-md border px-3 py-2 text-center text-sm font-semibold text-slate-700 transition-all",
        locked
          ? "cursor-not-allowed border-slate-300 bg-slate-100"
          : "cursor-grab border-sky-200 bg-sky-100 hover:border-sky-300 hover:bg-sky-50 active:cursor-grabbing",
        isDragOver && !locked && "ring-2 ring-primary/40",
      )}
    >
      <span className="absolute left-2 top-2 text-slate-400">
        {locked ? (
          <Lock className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <GripVertical className="h-3.5 w-3.5" aria-hidden />
        )}
      </span>
      {getSectionBoxLabel(section)}
    </div>
  );
}

interface ColumnDropZoneProps {
  column: ColumnKey;
  sections: SectionWithColumn[];
  draggedId: string | null;
  onDragStart: (sectionId: string) => void;
  onDropOnSection: (column: ColumnKey, targetSectionId: string | null) => void;
}

function ColumnDropZone({
  column,
  sections,
  draggedId,
  onDragStart,
  onDropOnSection,
}: ColumnDropZoneProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  return (
    <div
      className="flex min-h-[120px] flex-1 flex-col gap-2"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        setDragOverId(null);
        onDropOnSection(column, null);
      }}
    >
      {sections.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50/80 px-2 py-6 text-xs text-muted-foreground">
          Drop sections here
        </div>
      ) : (
        sections.map((section) => (
          <SectionBox
            key={section.id}
            section={section}
            locked={isSectionLocked(section)}
            draggable={!isSectionLocked(section)}
            onDragStart={onDragStart}
            onDragOver={() => setDragOverId(section.id)}
            onDrop={() => {
              setDragOverId(null);
              onDropOnSection(column, section.id);
            }}
            isDragOver={dragOverId === section.id && draggedId !== section.id}
          />
        ))
      )}
    </div>
  );
}

export function RearrangeSectionsDialog({
  open,
  onOpenChange,
  sections,
  layoutType,
  template,
  onSectionsChange,
}: RearrangeSectionsDialogProps) {
  const [partition, setPartition] = useState<RearrangePartition | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDraggedId(null);
      return;
    }
    setPartition(partitionSectionsForRearrange(sections, layoutType, template));
  }, [open, sections, layoutType, template]);

  const pages = useMemo(
    () => (partition ? groupSectionsIntoPages(partition) : []),
    [partition],
  );

  const commitPartition = useCallback(
    (nextPartition: RearrangePartition) => {
      setPartition(nextPartition);
      const rebuilt = rebuildSectionsFromRearrange(sections, nextPartition);
      onSectionsChange(rebuilt as SectionWithColumn[]);
    },
    [onSectionsChange, sections],
  );

  const handleDrop = useCallback(
    (column: ColumnKey, targetSectionId: string | null) => {
      if (!partition || !draggedId) return;

      const next = applySectionDrop(
        partition,
        draggedId,
        column,
        targetSectionId,
      );
      setDraggedId(null);
      commitPartition(next);
    },
    [commitPartition, draggedId, partition],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-border/80 bg-background p-0 shadow-header sm:rounded-2xl">
        <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 px-6 py-4 backdrop-blur-md">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-lg font-semibold">
              Hold &amp; Drag the boxes to rearrange the sections
            </DialogTitle>
            <DialogDescription>
              Changes apply instantly to your live preview and are saved
              automatically.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          {!partition ? null : pages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No visible sections to rearrange.
            </p>
          ) : (
            pages.map((page) => (
              <div
                key={`page-${page.pageNumber}`}
                className="overflow-hidden rounded-xl border border-border/80 bg-white shadow-card"
              >
                <div className="flex items-center justify-end border-b border-border/60 px-4 py-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Page {page.pageNumber} of {page.totalPages}
                  </span>
                </div>

                <div className="space-y-3 p-4">
                  {page.lockedHeader ? (
                    <SectionBox
                      section={page.lockedHeader}
                      locked
                      draggable={false}
                      onDragStart={() => undefined}
                      onDragOver={() => undefined}
                      onDrop={() => undefined}
                    />
                  ) : null}

                  {page.isDoubleColumn ? (
                    <div className="grid grid-cols-2 gap-3">
                      <ColumnDropZone
                        column="left"
                        sections={page.leftColumn}
                        draggedId={draggedId}
                        onDragStart={setDraggedId}
                        onDropOnSection={handleDrop}
                      />
                      <ColumnDropZone
                        column="right"
                        sections={page.rightColumn}
                        draggedId={draggedId}
                        onDragStart={setDraggedId}
                        onDropOnSection={handleDrop}
                      />
                    </div>
                  ) : (
                    <ColumnDropZone
                      column="single"
                      sections={page.singleColumn}
                      draggedId={draggedId}
                      onDragStart={setDraggedId}
                      onDropOnSection={handleDrop}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sticky bottom-0 border-t border-border/60 bg-background/95 px-6 py-4 backdrop-blur-md">
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
