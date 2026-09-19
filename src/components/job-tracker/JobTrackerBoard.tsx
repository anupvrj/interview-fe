"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import { Heart, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { jobTrackerApi } from "@/lib/api";
import { appCard, appSectionLabel } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import {
  JOB_TRACKER_ACTIVE_STATUSES,
  JOB_TRACKER_STATUS_LABELS,
  JOB_TRACKER_TYPE_LABELS,
  formatJobTrackerDate,
  type JobTrackerActiveStatus,
  type JobTrackerBoardResponse,
  type JobTrackerCard,
} from "@/lib/job-tracker";

function BoardCard({
  card,
  onOpen,
  onToggleFavorite,
  isDragging,
}: {
  card: JobTrackerCard;
  onOpen: (id: string) => void;
  onToggleFavorite: (card: JobTrackerCard) => void;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card.applicationId,
    data: { card },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        appCard,
        "cursor-pointer space-y-3 p-4 transition-shadow hover:shadow-header",
        isDragging && "opacity-40",
      )}
      onClick={() => onOpen(card.applicationId)}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
          {...listeners}
          {...attributes}
          aria-label="Drag card"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{card.title}</p>
          <p className="truncate text-xs text-muted-foreground">{card.company}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(card);
          }}
          aria-label={card.isFavorite ? "Remove favorite" : "Mark favorite"}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              card.isFavorite ? "fill-[#7367F0] text-[#7367F0]" : "text-muted-foreground",
            )}
          />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{JOB_TRACKER_TYPE_LABELS[card.jobType]}</Badge>
        {card.matchScore != null ? (
          <Badge variant="info">{card.matchScore}% match</Badge>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {card.locationText || "Location N/A"} · Applied{" "}
        {formatJobTrackerDate(card.appliedAt)}
      </p>
    </div>
  );
}

function BoardColumn({
  status,
  count,
  items,
  onOpen,
  onToggleFavorite,
}: {
  status: JobTrackerActiveStatus;
  count: number;
  items: JobTrackerCard[];
  onOpen: (id: string) => void;
  onToggleFavorite: (card: JobTrackerCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-[17rem] shrink-0 flex-col gap-3 sm:w-[18rem]">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className={cn(appSectionLabel, "pt-0")}>
          {JOB_TRACKER_STATUS_LABELS[status]}
        </p>
        <Badge variant="secondary">{count}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[12rem] flex-col gap-3 rounded-xl border border-dashed border-border/70 bg-muted/10 p-2",
          isOver && "border-primary/40 bg-primary/5",
        )}
      >
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Drop applications here
          </p>
        ) : (
          items.map((card) => (
            <BoardCard
              key={card.applicationId}
              card={card}
              onOpen={onOpen}
              onToggleFavorite={onToggleFavorite}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function JobTrackerBoard({
  board,
  onBoardChange,
  onOpen,
}: {
  board: JobTrackerBoardResponse;
  onBoardChange: (next: JobTrackerBoardResponse) => void;
  onOpen: (id: string) => void;
}) {
  const [activeCard, setActiveCard] = useState<JobTrackerCard | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const columns = useMemo(
    () =>
      JOB_TRACKER_ACTIVE_STATUSES.map((status) => ({
        status,
        count: board.columns[status]?.count ?? 0,
        items: board.columns[status]?.items ?? [],
      })),
    [board],
  );

  const findCard = (id: string): JobTrackerCard | undefined => {
    for (const status of JOB_TRACKER_ACTIVE_STATUSES) {
      const found = board.columns[status]?.items.find(
        (item) => item.applicationId === id,
      );
      if (found) return found;
    }
    return undefined;
  };

  const moveCardOptimistic = (
    card: JobTrackerCard,
    from: JobTrackerActiveStatus,
    to: JobTrackerActiveStatus,
  ) => {
    const next: JobTrackerBoardResponse = {
      ...board,
      columns: { ...board.columns },
    };
    next.columns[from] = {
      ...next.columns[from],
      items: next.columns[from].items.filter(
        (item) => item.applicationId !== card.applicationId,
      ),
      count: Math.max(0, next.columns[from].count - 1),
    };
    const updated = { ...card, status: to };
    next.columns[to] = {
      ...next.columns[to],
      items: [updated, ...next.columns[to].items],
      count: next.columns[to].count + 1,
    };
    onBoardChange(next);
    return updated;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = findCard(String(event.active.id));
    setActiveCard(card ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const card = findCard(String(event.active.id));
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!card || !overId) return;

    const isActiveStatus = (
      value: string,
    ): value is JobTrackerActiveStatus =>
      (JOB_TRACKER_ACTIVE_STATUSES as readonly string[]).includes(value);

    const targetStatus: JobTrackerActiveStatus | undefined = isActiveStatus(
      overId,
    )
      ? overId
      : (() => {
          const overCard = findCard(overId);
          return overCard && isActiveStatus(overCard.status)
            ? overCard.status
            : undefined;
        })();

    if (
      !targetStatus ||
      targetStatus === card.status ||
      !isActiveStatus(card.status)
    ) {
      return;
    }

    const previous = board;
    moveCardOptimistic(card, card.status, targetStatus);
    try {
      await jobTrackerApi.updateStatus(card.applicationId, targetStatus);
    } catch (error: unknown) {
      onBoardChange(previous);
      toast.error(
        error instanceof Error ? error.message : "Failed to move application",
      );
    }
  };

  const toggleFavorite = async (card: JobTrackerCard) => {
    try {
      await jobTrackerApi.patch(card.applicationId, {
        isFavorite: !card.isFavorite,
      });
      const refreshed = await jobTrackerApi.board({});
      onBoardChange(refreshed);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update favorite",
      );
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
          {columns.map((column) => (
            <BoardColumn
              key={column.status}
              status={column.status}
              count={column.count}
              items={column.items}
              onOpen={onOpen}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeCard ? (
          <div className={cn(appCard, "w-[17rem] space-y-2 p-4 shadow-header")}>
            <p className="truncate text-sm font-semibold">{activeCard.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {activeCard.company}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
