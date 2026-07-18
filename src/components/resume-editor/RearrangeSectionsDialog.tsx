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

interface DropTarget {
  column: ColumnKey;
  targetId: string | null;
}

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
  onPointerDragStart: (sectionId: string, event: React.PointerEvent) => void;
  onDelete?: (sectionId: string) => void;
  isDragOver?: boolean;
}

function findDropTarget(clientX: number, clientY: number): DropTarget | null {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;

  const sectionEl = el.closest(
    "[data-rearrange-section-id]",
  ) as HTMLElement | null;
  if (sectionEl) {
    const columnEl = sectionEl.closest(
      "[data-rearrange-column]",
    ) as HTMLElement | null;
    const column = columnEl?.dataset.rearrangeColumn as ColumnKey | undefined;
    if (!column) return null;
    return {
      column,
      targetId: sectionEl.dataset.rearrangeSectionId ?? null,
    };
  }

  const columnEl = el.closest("[data-rearrange-column]") as HTMLElement | null;
  if (columnEl?.dataset.rearrangeColumn) {
    return {
      column: columnEl.dataset.rearrangeColumn as ColumnKey,
      targetId: null,
    };
  }

  return null;
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
  onPointerDragStart,
  onDelete,
  isDragOver = false,
}: SectionBoxProps) {
  const canDrag = draggable && !locked;

  return (
    <div
      data-rearrange-section-id={section.id}
      draggable={canDrag}
      onDragStart={(event) => {
        if (!canDrag) {
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
        "relative flex min-h-[40px] items-center justify-center rounded-md border px-2 py-1.5 text-center text-xs font-semibold text-foreground transition-all sm:min-h-[52px] sm:px-3 sm:py-2 sm:text-sm",
        locked
          ? "cursor-not-allowed border-slate-300 bg-slate-100"
          : "border-sky-200 bg-sky-100 hover:border-sky-300 hover:bg-sky-50",
        isDragOver && !locked && "ring-2 ring-primary/40",
        isDragging && "opacity-50",
        deletable && "pr-8 sm:pr-10",
        canDrag && "pl-7 sm:pl-8",
      )}
    >
      <span className="absolute left-1 top-1/2 -translate-y-1/2 text-muted-foreground/80 sm:left-2">
        {locked ? (
          <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
        ) : (
          <button
            type="button"
            aria-label={`Drag ${getSectionBoxLabel(section)}`}
            className="touch-none rounded p-0.5 active:cursor-grabbing"
            onPointerDown={(event) => {
              if (!canDrag) return;
              event.preventDefault();
              event.stopPropagation();
              onPointerDragStart(section.id, event);
            }}
          >
            <GripVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
          </button>
        )}
      </span>
      <span className="px-1 leading-tight">{getSectionBoxLabel(section)}</span>
      {deletable && onDelete ? (
        <button
          type="button"
          aria-label={`Remove ${getSectionBoxLabel(section)} section`}
          title="Remove section from resume"
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground/80 transition-colors hover:bg-red-950/30 hover:text-red-600 sm:right-2 sm:p-1"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDelete(section.id);
          }}
        >
          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

interface ColumnDropZoneProps {
  column: ColumnKey;
  label?: string;
  sections: SectionWithColumn[];
  draggedId: string | null;
  pointerDropTarget: DropTarget | null;
  onDragStart: (sectionId: string) => void;
  onDragEnd: () => void;
  onDropOnSection: (column: ColumnKey, targetSectionId: string | null) => void;
  onPointerDragStart: (sectionId: string, event: React.PointerEvent) => void;
  onSectionDelete?: (sectionId: string) => void;
}

function ColumnDropZone({
  column,
  label,
  sections,
  draggedId,
  pointerDropTarget,
  onDragStart,
  onDragEnd,
  onDropOnSection,
  onPointerDragStart,
  onSectionDelete,
}: ColumnDropZoneProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const isColumnDropTarget =
    pointerDropTarget?.column === column && pointerDropTarget.targetId === null;

  return (
    <div className="min-w-0 flex-1">
      {label ? (
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
          {label}
        </p>
      ) : null}
      <div
        data-rearrange-column={column}
        className={cn(
          "flex min-h-[96px] flex-col gap-1.5 sm:min-h-[120px] sm:gap-2",
          isColumnDropTarget && "rounded-md ring-2 ring-primary/30",
        )}
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
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border bg-muted/25 px-2 py-4 text-[10px] text-muted-foreground sm:py-6 sm:text-xs">
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
              onPointerDragStart={onPointerDragStart}
              onDragOver={() => setDragOverId(section.id)}
              onDrop={() => {
                setDragOverId(null);
                onDropOnSection(column, section.id);
              }}
              onDelete={onSectionDelete}
              isDragOver={
                (dragOverId === section.id && draggedId !== section.id) ||
                (pointerDropTarget?.column === column &&
                  pointerDropTarget.targetId === section.id &&
                  draggedId !== section.id)
              }
            />
          ))
        )}
      </div>
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
  const [pointerDropTarget, setPointerDropTarget] =
    useState<DropTarget | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  const pointerDropTargetRef = useRef<DropTarget | null>(null);
  const pointerDragActiveRef = useRef(false);

  useEffect(() => {
    if (!open) {
      draggedIdRef.current = null;
      pointerDragActiveRef.current = false;
      pointerDropTargetRef.current = null;
      setDraggedId(null);
      setPointerDropTarget(null);
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
    pointerDragActiveRef.current = false;
    pointerDropTargetRef.current = null;
    setDraggedId(null);
    setPointerDropTarget(null);
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
      pointerDragActiveRef.current = false;
      pointerDropTargetRef.current = null;
      setDraggedId(null);
      setPointerDropTarget(null);
      commitPartition(next);
    },
    [commitPartition, partition],
  );

  const handleDelete = useCallback(
    (sectionId: string) => {
      if (!partition) return;

      if (onSectionDelete?.(sectionId)) {
        draggedIdRef.current = null;
        pointerDragActiveRef.current = false;
        setDraggedId(null);
        return;
      }

      const next = applySectionDelete(partition, sectionId);
      draggedIdRef.current = null;
      pointerDragActiveRef.current = false;
      setDraggedId(null);
      commitPartition(next);
    },
    [commitPartition, onSectionDelete, partition],
  );

  const handlePointerDragStart = useCallback(
    (sectionId: string, event: React.PointerEvent) => {
      const handle = event.currentTarget as HTMLElement;
      handle.setPointerCapture(event.pointerId);
      pointerDragActiveRef.current = true;
      handleDragStart(sectionId);
    },
    [handleDragStart],
  );

  useEffect(() => {
    if (!draggedId || !pointerDragActiveRef.current) return;

    const onPointerMove = (event: PointerEvent) => {
      if (!pointerDragActiveRef.current) return;
      const target = findDropTarget(event.clientX, event.clientY);
      pointerDropTargetRef.current = target;
      setPointerDropTarget(target);
    };

    const finishPointerDrag = () => {
      if (!pointerDragActiveRef.current) return;

      const target = pointerDropTargetRef.current;
      const activeDraggedId = draggedIdRef.current;

      pointerDragActiveRef.current = false;

      if (target && activeDraggedId && target.targetId !== activeDraggedId) {
        handleDrop(target.column, target.targetId);
        return;
      }

      handleDragEnd();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finishPointerDrag);
    window.addEventListener("pointercancel", finishPointerDrag);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finishPointerDrag);
      window.removeEventListener("pointercancel", finishPointerDrag);
    };
  }, [draggedId, handleDragEnd, handleDrop]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="z-[80]"
        className="z-[80] flex max-h-[min(92dvh,720px)] w-[calc(100%-2rem)] max-w-3xl flex-col overflow-hidden border-border/80 bg-background p-0 shadow-header sm:rounded-2xl [&>button]:hidden"
      >
        <div className="sticky top-0 z-10 shrink-0 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-semibold sm:text-lg">
              Hold &amp; Drag the boxes to rearrange the sections
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Drag to reorder sections or remove optional ones with the trash
              icon. Changes apply instantly to your live preview.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-6 sm:py-5">
          {!partition ? (
            <p className="text-center text-xs text-muted-foreground sm:text-sm">
              No visible sections to rearrange.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-card">
              <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
                {partition.lockedHeader ? (
                  <SectionBox
                    section={partition.lockedHeader}
                    locked
                    draggable={false}
                    onDragStart={() => undefined}
                    onDragEnd={() => undefined}
                    onDragOver={() => undefined}
                    onDrop={() => undefined}
                    onPointerDragStart={() => undefined}
                  />
                ) : null}

                {partition.isDoubleColumn ? (
                  <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-3">
                    <ColumnDropZone
                      column="left"
                      label="Left column"
                      sections={partition.leftColumn}
                      draggedId={draggedId}
                      pointerDropTarget={pointerDropTarget}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDropOnSection={handleDrop}
                      onPointerDragStart={handlePointerDragStart}
                      onSectionDelete={handleDelete}
                    />
                    <ColumnDropZone
                      column="right"
                      label="Right column"
                      sections={partition.rightColumn}
                      draggedId={draggedId}
                      pointerDropTarget={pointerDropTarget}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDropOnSection={handleDrop}
                      onPointerDragStart={handlePointerDragStart}
                      onSectionDelete={handleDelete}
                    />
                  </div>
                ) : (
                  <ColumnDropZone
                    column="single"
                    sections={partition.singleColumn}
                    draggedId={draggedId}
                    pointerDropTarget={pointerDropTarget}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDropOnSection={handleDrop}
                    onPointerDragStart={handlePointerDragStart}
                    onSectionDelete={handleDelete}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 shrink-0 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4">
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
