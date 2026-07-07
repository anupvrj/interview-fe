"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical, Lock, Trash2 } from "lucide-react";
import type { ResumeTemplate } from "@/lib/api";
import type { SectionWithColumn } from "@/lib/sectionColumnUtils";
import {
  applySectionDelete,
  applySectionDrop,
  canDeleteSection,
  getSectionBoxLabel,
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
  onSectionDelete?: (sectionId: string) => boolean;
}

interface SectionBoxProps {
  section: SectionWithColumn;
  locked?: boolean;
  draggable?: boolean;
  deletable?: boolean;
  isDragging?: boolean;
  onDragStart: (sectionId: string) => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (sectionId: string) => void;
  onDelete?: (sectionId: string) => void;
  isDragOver?: boolean;
}

function SectionBox({
  section,
  locked = false,
  draggable = true,
  deletable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDelete,
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
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragOver(event);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDrop(section.id);
      }}
      className={cn(
        "relative flex min-h-[52px] items-center justify-center rounded-md border px-3 py-2 text-center text-sm font-semibold text-foreground transition-all",
        locked
          ? "cursor-not-allowed border-slate-300 bg-slate-100"
          : "cursor-grab border-sky-200 bg-sky-100 hover:border-sky-300 hover:bg-sky-50 active:cursor-grabbing",
        isDragOver && !locked && "ring-2 ring-primary/40",
        isDragging && "opacity-50",
        deletable && "pr-10",
      )}
    >
      <span className="absolute left-2 top-2 text-muted-foreground/80">
        {locked ? (
          <Lock className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <GripVertical className="h-3.5 w-3.5" aria-hidden />
        )}
      </span>
      {getSectionBoxLabel(section)}
      {deletable && onDelete ? (
        <button
          type="button"
          aria-label={`Remove ${getSectionBoxLabel(section)} section`}
          title="Remove section from resume"
          className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground/80 transition-colors hover:bg-red-950/30 hover:text-red-600"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDelete(section.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

interface ColumnDropZoneProps {
  column: ColumnKey;
  sections: SectionWithColumn[];
  draggedId: string | null;
  onDragStart: (sectionId: string) => void;
  onDragEnd: () => void;
  onDropOnSection: (column: ColumnKey, targetSectionId: string | null) => void;
  onSectionDelete?: (sectionId: string) => void;
}

function ColumnDropZone({
  column,
  sections,
  draggedId,
  onDragStart,
  onDragEnd,
  onDropOnSection,
  onSectionDelete,
}: ColumnDropZoneProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  return (
    <div
      className="flex min-h-[120px] flex-1 flex-col gap-2"
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragOverId(null);
        onDropOnSection(column, null);
      }}
    >
      {sections.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border bg-muted/25 px-2 py-6 text-xs text-muted-foreground">
          Drop sections here
        </div>
      ) : (
        sections.map((section) => (
          <SectionBox
            key={section.id}
            section={section}
            locked={isSectionLocked(section)}
            draggable={!isSectionLocked(section)}
            deletable={canDeleteSection(section)}
            isDragging={draggedId === section.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={() => setDragOverId(section.id)}
            onDrop={() => {
              setDragOverId(null);
              onDropOnSection(column, section.id);
            }}
            onDelete={onSectionDelete}
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
  onSectionDelete,
}: RearrangeSectionsDialogProps) {
  const [partition, setPartition] = useState<RearrangePartition | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const draggedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      draggedIdRef.current = null;
      setDraggedId(null);
      return;
    }
    if (draggedIdRef.current) return;
    setPartition(partitionSectionsForRearrange(sections, layoutType, template));
  }, [open, sections, layoutType, template]);

  const handleDragStart = useCallback((sectionId: string) => {
    draggedIdRef.current = sectionId;
    setDraggedId(sectionId);
  }, []);

  const commitPartition = useCallback(
    (nextPartition: RearrangePartition) => {
      setPartition(nextPartition);
      const rebuilt = rebuildSectionsFromRearrange(sections, nextPartition);
      onSectionsChange(rebuilt as SectionWithColumn[]);
    },
    [onSectionsChange, sections],
  );

  const handleDragEnd = useCallback(() => {
    draggedIdRef.current = null;
    setDraggedId(null);
  }, []);

  const handleDrop = useCallback(
    (column: ColumnKey, targetSectionId: string | null) => {
      const activeDraggedId = draggedIdRef.current;
      if (!partition || !activeDraggedId) return;

      const next = applySectionDrop(
        partition,
        activeDraggedId,
        column,
        targetSectionId,
      );
      draggedIdRef.current = null;
      setDraggedId(null);
      commitPartition(next);
    },
    [commitPartition, partition],
  );

  const handleDelete = useCallback(
    (sectionId: string) => {
      if (!partition) return;

      if (onSectionDelete?.(sectionId)) {
        draggedIdRef.current = null;
        setDraggedId(null);
        return;
      }

      const next = applySectionDelete(partition, sectionId);
      draggedIdRef.current = null;
      setDraggedId(null);
      commitPartition(next);
    },
    [commitPartition, onSectionDelete, partition],
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
              Drag to reorder sections or remove optional ones with the trash
              icon. Changes apply instantly to your live preview.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-3 px-6 py-5">
          {!partition ? (
            <p className="text-center text-sm text-muted-foreground">
              No visible sections to rearrange.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-card">
              <div className="space-y-3 p-4">
                {partition.lockedHeader ? (
                  <SectionBox
                    section={partition.lockedHeader}
                    locked
                    draggable={false}
                    onDragStart={() => undefined}
                    onDragEnd={() => undefined}
                    onDragOver={() => undefined}
                    onDrop={() => undefined}
                  />
                ) : null}

                {partition.isDoubleColumn ? (
                  <div className="grid grid-cols-2 gap-3">
                    <ColumnDropZone
                      column="left"
                      sections={partition.leftColumn}
                      draggedId={draggedId}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDropOnSection={handleDrop}
                      onSectionDelete={handleDelete}
                    />
                    <ColumnDropZone
                      column="right"
                      sections={partition.rightColumn}
                      draggedId={draggedId}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDropOnSection={handleDrop}
                      onSectionDelete={handleDelete}
                    />
                  </div>
                ) : (
                  <ColumnDropZone
                    column="single"
                    sections={partition.singleColumn}
                    draggedId={draggedId}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDropOnSection={handleDrop}
                    onSectionDelete={handleDelete}
                  />
                )}
              </div>
            </div>
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
