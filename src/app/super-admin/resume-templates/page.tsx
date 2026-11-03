"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp, Eye, GripVertical, Loader2, Pencil, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { ResumeTemplateDesignDialog } from "@/components/super-admin/ResumeTemplateDesignDialog";
import { useRequirePlatformAdmin } from "@/components/blog-admin/useRequirePlatformAdmin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi, type AdminResumeTemplateList, type AdminResumeTemplateRow } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { TEMPLATES_CATALOG } from "@/configs/resume-templates/templates-catalog";
import {
  forgetResumeTemplateAvailability,
  RESUME_TEMPLATE_AVAILABILITY_QUERY_KEY,
} from "@/lib/resume-template-availability";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<string, string> = {
  simple: "Popular",
  modern: "Modern",
  creative: "Creative",
};

function TemplateSwitch({
  on,
  disabled,
  label,
  onToggle,
}: Readonly<{ on: boolean; disabled?: boolean; label: string; onToggle: () => void }>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? `Disable ${label}` : `Enable ${label}`}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        on ? "bg-[#7367F0]" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "pointer-events-none mt-0.5 block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          on ? "translate-x-[1.35rem]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function layoutLabel(row: AdminResumeTemplateRow): string {
  const d = row.design;
  if (!d) return "—";
  if (d.layoutType && d.layoutType !== "single" && d.columnWidths && d.columnWidths.right > 0) {
    return `Two columns · ${d.columnWidths.left}/${d.columnWidths.right}`;
  }
  return "Single column";
}

function fontLabel(row: AdminResumeTemplateRow): string {
  const family = row.design?.fontFamily;
  if (!family) return "—";
  return family.split(",")[0].replace(/['"]/g, "").trim();
}

function SortableTemplateRow({
  row,
  index,
  count,
  thumb,
  busy,
  orderLocked,
  onToggle,
  onMove,
  onView,
}: Readonly<{
  row: AdminResumeTemplateRow;
  index: number;
  count: number;
  thumb?: string;
  busy: boolean;
  orderLocked: boolean;
  onToggle: () => void;
  onMove: (delta: -1 | 1) => void;
  onView: () => void;
}>) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id, disabled: orderLocked });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card",
        !row.enabled && "opacity-70",
        isDragging && "relative z-10 opacity-100 shadow-[0_18px_40px_-20px_rgba(47,43,61,.45)]",
      )}
    >
      <TableCell className="w-[92px]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            disabled={orderLocked}
            aria-label={`Drag to reorder ${row.name}`}
            className="flex h-8 w-6 cursor-grab touch-none items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="w-6 text-center text-sm tabular-nums text-muted-foreground">{index + 1}</span>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={orderLocked || index === 0}
              aria-label={`Move ${row.name} up`}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={orderLocked || index === count - 1}
              aria-label={`Move ${row.name} down`}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </TableCell>
      <TableCell className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded border border-border/60 bg-white">
            {thumb ? <Image src={thumb} alt="" fill sizes="40px" className="object-cover object-top" /> : null}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium text-foreground">
              {row.name}
              {row.edited ? <Badge variant="neutral">Edited</Badge> : null}
            </p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {row.id}
              {row.codeName && row.codeName !== row.name ? <span className="font-sans"> · was {row.codeName}</span> : null}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="neutral">{CATEGORY_LABEL[row.category] ?? row.category}</Badge>
      </TableCell>
      <TableCell>
        <div className="min-w-[150px] space-y-1">
          <p className="text-sm text-foreground">{layoutLabel(row)}</p>
          <div className="flex items-center gap-1.5">
            {(row.design?.colors ?? []).map((c) => (
              <span key={c} title={c} className="h-3.5 w-3.5 rounded-full border border-border/80" style={{ background: c }} />
            ))}
            <span className="truncate text-xs text-muted-foreground">{fontLabel(row)}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="tabular-nums text-muted-foreground">
        {row.resumeCount.toLocaleString("en-IN")}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <TemplateSwitch on={row.enabled} label={row.name} disabled={busy} onToggle={onToggle} />
          <span className={cn("text-xs", row.enabled ? "text-foreground" : "text-muted-foreground")}>
            {row.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Button asChild size="sm">
            <Link href={`/super-admin/resume-templates/${encodeURIComponent(row.id)}`}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onView} aria-label={`View ${row.name}'s stored code`} title="View stored style, structure and CSS">
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function SuperAdminResumeTemplatesPage() {
  const { authorized, loading } = useRequirePlatformAdmin();
  const queryClient = useQueryClient();
  const [list, setList] = useState<AdminResumeTemplateList | null>(null);
  /** Unsaved order while the admin drags rows; null when the list matches the server. */
  const [draft, setDraft] = useState<string[] | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [designId, setDesignId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    adminApi
      .listResumeTemplateSettings()
      .then((next) => {
        if (!cancelled) setList(next);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(getApiErrorMessage(error, "Failed to load resume templates"));
      });
    return () => {
      cancelled = true;
    };
  }, [authorized]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const thumbnails = useMemo(
    () => new Map(TEMPLATES_CATALOG.map((item) => [item.id, item.thumbnail])),
    [],
  );
  const rows = useMemo(() => {
    if (!list) return null;
    if (!draft) return list.templates;
    const byId = new Map(list.templates.map((row) => [row.id, row]));
    return draft.flatMap((id) => byId.get(id) ?? []);
  }, [list, draft]);
  const enabledCount = rows?.filter((row) => row.enabled).length ?? 0;
  const orderDirty = draft !== null;

  /** Public pages and pickers pick up the change on their next lookup. */
  const refreshEverywhere = async () => {
    forgetResumeTemplateAvailability();
    await queryClient.invalidateQueries({ queryKey: RESUME_TEMPLATE_AVAILABILITY_QUERY_KEY });
  };

  const toggle = async (row: AdminResumeTemplateRow) => {
    const next = !row.enabled;
    if (!next && enabledCount <= 1) {
      toast.error("At least one resume template must stay enabled.");
      return;
    }
    setSavingId(row.id);
    try {
      setList(await adminApi.setResumeTemplateEnabled(row.id, next));
      await refreshEverywhere();
      toast.success(
        next
          ? `${row.name} is available to everyone`
          : `${row.name} is hidden from template lists`,
      );
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update template"));
    } finally {
      setSavingId(null);
    }
  };

  const reorder = (from: number, to: number) => {
    if (!rows || to < 0 || to >= rows.length || from === to) return;
    setDraft(arrayMove(rows.map((row) => row.id), from, to));
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!rows || !over || active.id === over.id) return;
    const ids = rows.map((row) => row.id);
    reorder(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  };

  const saveOrder = async () => {
    if (!draft) return;
    setSavingOrder(true);
    try {
      setList(await adminApi.setResumeTemplateOrder(draft));
      setDraft(null);
      await refreshEverywhere();
      toast.success("Template order saved. Every template list now uses it.");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to save the order"));
    } finally {
      setSavingOrder(false);
    }
  };

  const resetOrder = async () => {
    setSavingOrder(true);
    try {
      setList(await adminApi.resetResumeTemplateOrder());
      setDraft(null);
      setConfirmReset(false);
      await refreshEverywhere();
      toast.success("Order reset. Each page shows its built-in order again.");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to reset the order"));
    } finally {
      setSavingOrder(false);
    }
  };

  if (loading || !authorized) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader unsavedChanges={orderDirty} />

      <Card>
        <CardContent className="flex flex-col gap-3 py-4 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p>
              <span className="font-semibold text-foreground">
                {rows ? `${enabledCount} of ${rows.length} templates enabled.` : "Loading templates…"}
              </span>{" "}
              A disabled template is hidden from every template list (the resume builder, the
              editor&apos;s Change Template list, ATS Improve, the dashboard, the public Resume
              Builder page and the Claude connector) and can&apos;t be picked for a new or switched
              resume. Resumes already using it keep working.
            </p>
            <p>
              {list?.customOrder
                ? "Every template list shows templates in the order below."
                : "No order saved yet: each page shows its own built-in order. Drag rows, then save, to set one order everywhere."}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {orderDirty ? (
              <>
                <Button type="button" variant="outline" size="sm" disabled={savingOrder} onClick={() => setDraft(null)}>
                  Discard
                </Button>
                <Button type="button" size="sm" disabled={savingOrder} onClick={() => void saveOrder()}>
                  {savingOrder ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  Save order
                </Button>
              </>
            ) : list?.customOrder ? (
              <Button type="button" variant="outline" size="sm" disabled={savingOrder} onClick={() => setConfirmReset(true)}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset order
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      <Card>
        <CardContent className="px-0 py-0 sm:px-0">
          {!rows ? (
            <div className="flex justify-center px-5 py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <Table className="min-w-[880px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Order</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Design</TableHead>
                      <TableHead>Resumes using it</TableHead>
                      <TableHead>Enabled</TableHead>
                      <TableHead className="text-right">Design</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext items={rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
                      {rows.map((row, index) => (
                        <SortableTemplateRow
                          key={row.id}
                          row={row}
                          index={index}
                          count={rows.length}
                          thumb={thumbnails.get(row.id)}
                          busy={savingId === row.id}
                          orderLocked={savingOrder}
                          onToggle={() => void toggle(row)}
                          onMove={(delta) => reorder(index, index + delta)}
                          onView={() => setDesignId(row.id)}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </DndContext>
            </div>
          )}
        </CardContent>
      </Card>

      <ResumeTemplateDesignDialog templateId={designId} onOpenChange={(open) => !open && setDesignId(null)} />

      <ConfirmationDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset the template order?"
        description="Each page goes back to its own built-in order. Enabled and disabled templates stay as they are."
        confirmText="Reset order"
        onConfirm={resetOrder}
        isLoading={savingOrder}
      />
    </div>
  );
}
