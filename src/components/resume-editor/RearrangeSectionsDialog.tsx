"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeftRight, ArrowUp, GripVertical, Lock, Trash2 } from "lucide-react";
import type { ResumeTemplate } from "@/lib/api";
import type { SectionWithColumn } from "@/lib/sectionColumnUtils";
import { canDeleteSection, getSectionBoxLabel, isSectionLocked, type RearrangeLayoutType } from "@/lib/rearrange-sections";
import { dropSection, moveSectionWithinColumn, organizeSectionColumns, sectionMoveBounds } from "@/lib/sectionLayout";
import { Button } from "@/components/ui/button";
import { appPrimaryButton } from "@/lib/app-theme";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ColumnKey = "left" | "right" | "single";

/** Where a dragged section would land: before/after a box, or at the end of a column. */
export interface DropTarget {
  column: ColumnKey;
  targetId: string | null;
  place: "before" | "after";
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

/** The box (or column end) under the pointer; the upper half of a box means "above it". */
export function findDropTarget(clientX: number, clientY: number): DropTarget | null {
  const el = document.elementFromPoint(clientX, clientY);
  const columnEl = el?.closest<HTMLElement>("[data-rearrange-column]");
  const column = columnEl?.dataset.rearrangeColumn as ColumnKey | undefined;
  if (!el || !column) return null;
  const box = el.closest<HTMLElement>("[data-rearrange-section-id]");
  if (!box) return { column, targetId: null, place: "after" };
  const rect = box.getBoundingClientRect();
  return {
    column,
    targetId: box.dataset.rearrangeSectionId ?? null,
    place: clientY < rect.top + rect.height / 2 ? "before" : "after",
  };
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: Readonly<{ label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="rounded p-0.5 text-muted-foreground/80 transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-25 sm:p-1"
    >
      {children}
    </button>
  );
}

interface SectionBoxProps {
  section: SectionWithColumn;
  column: ColumnKey;
  isDouble: boolean;
  canUp: boolean;
  canDown: boolean;
  dragging: boolean;
  /** An insertion line above / below this box while dragging. */
  indicator: "before" | "after" | null;
  onNativeDragStart: (sectionId: string) => void;
  onNativeDragEnd: () => void;
  onNativeDragOver: (target: DropTarget) => void;
  onNativeDrop: () => void;
  onPointerDragStart: (sectionId: string, event: React.PointerEvent) => void;
  onMove: (sectionId: string, delta: -1 | 1) => void;
  onSwitchColumn: (sectionId: string) => void;
  onDelete?: (sectionId: string) => void;
}

function SectionBox({
  section,
  column,
  isDouble,
  canUp,
  canDown,
  dragging,
  indicator,
  onNativeDragStart,
  onNativeDragEnd,
  onNativeDragOver,
  onNativeDrop,
  onPointerDragStart,
  onMove,
  onSwitchColumn,
  onDelete,
}: SectionBoxProps) {
  const locked = isSectionLocked(section);
  const label = getSectionBoxLabel(section);

  return (
    <div
      data-rearrange-section-id={section.id}
      draggable={!locked}
      onDragStart={(event) => {
        if (locked) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", section.id);
        onNativeDragStart(section.id);
      }}
      onDragEnd={onNativeDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "move";
        const rect = event.currentTarget.getBoundingClientRect();
        onNativeDragOver({ column, targetId: section.id, place: event.clientY < rect.top + rect.height / 2 ? "before" : "after" });
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onNativeDrop();
      }}
      className={cn(
        "relative flex min-h-[40px] items-center gap-1 rounded-md border py-1.5 pl-1 pr-1 text-xs font-semibold text-foreground transition-all sm:min-h-[48px] sm:gap-1.5 sm:pl-2 sm:text-sm",
        locked
          ? "cursor-not-allowed border-dashed border-border bg-muted/40 text-muted-foreground"
          : "cursor-grab border-[#7367F0]/25 bg-[#7367F0]/[0.08] hover:border-[#7367F0]/45 hover:bg-[#7367F0]/[0.14] dark:border-[#7367F0]/35 dark:bg-[#7367F0]/[0.16] dark:hover:bg-[#7367F0]/[0.24]",
        dragging && "opacity-40",
      )}
    >
      {indicator ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 h-0.5 rounded-full bg-primary",
            indicator === "before" ? "-top-[5px]" : "-bottom-[5px]",
          )}
        />
      ) : null}
      <span className="shrink-0 text-muted-foreground/80">
        {locked ? (
          <Lock className="m-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
        ) : (
          <button
            type="button"
            aria-label={`Drag ${label}`}
            className="touch-none rounded p-0.5 active:cursor-grabbing"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onPointerDragStart(section.id, event);
            }}
          >
            <GripVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
          </button>
        )}
      </span>
      <span className="min-w-0 flex-1 truncate leading-tight">{label}</span>
      {locked ? null : (
        <span className="flex shrink-0 items-center">
          <IconButton label={`Move ${label} up`} disabled={!canUp} onClick={() => onMove(section.id, -1)}>
            <ArrowUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
          </IconButton>
          <IconButton label={`Move ${label} down`} disabled={!canDown} onClick={() => onMove(section.id, 1)}>
            <ArrowDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
          </IconButton>
          {isDouble ? (
            <IconButton
              label={`Move ${label} to the ${column === "left" ? "right" : "left"} column`}
              onClick={() => onSwitchColumn(section.id)}
            >
              <ArrowLeftRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
            </IconButton>
          ) : null}
          {onDelete && canDeleteSection(section) ? (
            <IconButton label={`Remove ${label} section`} onClick={() => onDelete(section.id)}>
              <Trash2 className="h-3 w-3 hover:text-red-600 sm:h-3.5 sm:w-3.5" aria-hidden />
            </IconButton>
          ) : null}
        </span>
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
  const columns = useMemo(() => organizeSectionColumns(sections, layoutType, template), [sections, layoutType, template]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  const dropTargetRef = useRef<DropTarget | null>(null);
  const pointerDragRef = useRef(false);

  const setTarget = useCallback((target: DropTarget | null) => {
    const prev = dropTargetRef.current;
    dropTargetRef.current = target;
    if (prev?.column !== target?.column || prev?.targetId !== target?.targetId || prev?.place !== target?.place) setDropTarget(target);
  }, []);

  const endDrag = useCallback(() => {
    draggedIdRef.current = null;
    pointerDragRef.current = false;
    setDraggedId(null);
    setTarget(null);
  }, [setTarget]);

  useEffect(() => {
    if (!open) endDrag();
  }, [open, endDrag]);

  const startDrag = useCallback((sectionId: string) => {
    draggedIdRef.current = sectionId;
    setDraggedId(sectionId);
  }, []);

  const commit = useCallback((next: SectionWithColumn[] | null) => {
    if (next) onSectionsChange(next);
  }, [onSectionsChange]);

  const dropNow = useCallback(() => {
    const id = draggedIdRef.current;
    const target = dropTargetRef.current;
    endDrag();
    if (!id || !target || target.targetId === id) return;
    commit(dropSection(sections, id, target.column, target.targetId, target.place, layoutType, template));
  }, [commit, endDrag, layoutType, sections, template]);

  const move = useCallback(
    (sectionId: string, delta: -1 | 1) => commit(moveSectionWithinColumn(sections, sectionId, delta, layoutType, template)),
    [commit, layoutType, sections, template],
  );

  const switchColumn = useCallback(
    (sectionId: string) => {
      const to: ColumnKey = columns.left.some((s) => s.id === sectionId) ? "right" : "left";
      commit(dropSection(sections, sectionId, to, null, "after", layoutType, template));
    },
    [columns.left, commit, layoutType, sections, template],
  );

  const remove = useCallback(
    (sectionId: string) => {
      if (onSectionDelete?.(sectionId)) return;
      commit(sections.map((s) => (s.id === sectionId ? { ...s, visible: false } : s)));
    },
    [commit, onSectionDelete, sections],
  );

  // Listeners go on at once (not in an effect after the re-render): a quick drag could
  // finish before the effect ran, and the drop was lost.
  const pointerCleanupRef = useRef<(() => void) | null>(null);
  const pointerDragStart = useCallback(
    (sectionId: string, event: React.PointerEvent) => {
      try {
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      } catch {
        /* capture is a nicety; window listeners still see the drag */
      }
      pointerCleanupRef.current?.();
      pointerDragRef.current = true;
      startDrag(sectionId);
      const onMove = (e: PointerEvent) => setTarget(findDropTarget(e.clientX, e.clientY));
      const onUp = (e: PointerEvent) => {
        cleanup();
        if (!pointerDragRef.current) return;
        setTarget(findDropTarget(e.clientX, e.clientY) ?? dropTargetRef.current);
        dropNow();
      };
      const onCancel = () => {
        cleanup();
        endDrag();
      };
      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        pointerCleanupRef.current = null;
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
      pointerCleanupRef.current = cleanup;
    },
    [dropNow, endDrag, setTarget, startDrag],
  );
  useEffect(() => () => pointerCleanupRef.current?.(), []);

  const renderColumn = (column: ColumnKey, list: SectionWithColumn[], label?: string) => {
    const endTarget = !!draggedId && dropTarget?.column === column && dropTarget.targetId === null;
    // Show the line where the section will land (not next to itself, where nothing changes).
    const indicatorFor = (section: SectionWithColumn, i: number): "before" | "after" | null => {
      if (!draggedId || dropTarget?.column !== column || dropTarget.targetId !== section.id || section.id === draggedId) return null;
      const neighbour = dropTarget.place === "before" ? list[i - 1] : list[i + 1];
      if (neighbour?.id === draggedId) return null;
      if (dropTarget.place === "before" && isSectionLocked(section) && i === 0) return "after";
      return dropTarget.place;
    };
    return (
      <div className="flex min-w-0 flex-1 flex-col">
        {label ? (
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</p>
        ) : null}
        <div
          data-rearrange-column={column}
          // Fills the column's full height: the blank space under a shorter column is a drop target too.
          className="flex flex-1 flex-col gap-2"
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setTarget({ column, targetId: null, place: "after" });
          }}
          onDrop={(event) => {
            event.preventDefault();
            dropNow();
          }}
        >
          {list.map((section, i) => {
            const bounds = isSectionLocked(section) ? { up: false, down: false } : sectionMoveBounds(sections, section.id, layoutType, template);
            return (
              <SectionBox
                key={section.id}
                section={section}
                column={column}
                isDouble={columns.isDouble}
                canUp={bounds.up}
                canDown={bounds.down}
                dragging={draggedId === section.id}
                indicator={indicatorFor(section, i)}
                onNativeDragStart={startDrag}
                onNativeDragEnd={endDrag}
                onNativeDragOver={setTarget}
                onNativeDrop={dropNow}
                onPointerDragStart={pointerDragStart}
                onMove={move}
                onSwitchColumn={switchColumn}
                onDelete={remove}
              />
            );
          })}
          {/* Always room to drop at the end of a column. */}
          <div
            className={cn(
              "flex flex-1 items-center justify-center rounded-md border border-dashed text-[10px] text-muted-foreground transition-colors sm:text-xs",
              list.length === 0 ? "min-h-[72px]" : "min-h-[36px]",
              draggedId ? "border-border bg-muted/25" : "border-transparent",
              endTarget && "border-primary bg-primary/10 text-primary",
            )}
          >
            {list.length === 0 ? "Drop sections here" : draggedId ? "Drop here to put it last" : ""}
          </div>
        </div>
      </div>
    );
  };

  const hasSections = columns.isDouble ? columns.left.length + columns.right.length > 0 : columns.single.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="z-[80]"
        className="z-[80] flex h-[min(92dvh,640px)] w-[calc(100%-2rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-xl border border-border/80 bg-card p-0 text-card-foreground shadow-header sm:rounded-2xl [&>button]:hidden"
      >
        <div className="sticky top-0 z-10 shrink-0 border-b border-border/60 bg-gradient-to-br from-[#7367F0]/10 via-card to-card px-4 py-4 sm:px-6 sm:py-5">
          <DialogHeader className="space-y-1 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7367F0] dark:text-[#a59cf7]">Page order</p>
            <DialogTitle className="text-lg font-semibold text-foreground sm:text-xl">Order your sections</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Drag a section by its handle, or use the arrows
              {columns.isDouble ? " (⇄ moves it to the other column)" : ""}. The page updates as you go.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-6 sm:py-5">
          {!hasSections && !columns.header ? (
            <p className="text-center text-xs text-muted-foreground sm:text-sm">No visible sections to rearrange.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
              <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
                {columns.header ? (
                  <SectionBox
                    section={columns.header}
                    column="single"
                    isDouble={false}
                    canUp={false}
                    canDown={false}
                    dragging={false}
                    indicator={null}
                    onNativeDragStart={() => undefined}
                    onNativeDragEnd={() => undefined}
                    onNativeDragOver={() => undefined}
                    onNativeDrop={() => undefined}
                    onPointerDragStart={() => undefined}
                    onMove={() => undefined}
                    onSwitchColumn={() => undefined}
                  />
                ) : null}
                {columns.isDouble ? (
                  <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-3">
                    {renderColumn("left", columns.left, "Left column")}
                    {renderColumn("right", columns.right, "Right column")}
                  </div>
                ) : (
                  renderColumn("single", columns.single)
                )}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex shrink-0 justify-end border-t border-border/60 bg-card px-4 py-3 sm:px-6 sm:py-4">
          <Button type="button" className={cn("h-11 w-full px-6 text-sm font-semibold sm:w-auto", appPrimaryButton)} onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
