"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Eye, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { SlotStatusBadge } from "@/components/peer/SlotStatusBadge";
import { formatPeerSchedule, formatPeerTimeInTimezone } from "@/components/peer/peerSlotTime";
import { instituteSecondaryClass } from "@/components/institute/InstituteChrome";
import { appFilterBar } from "@/lib/app-theme";
import type { PeerInterviewType, PeerSlot } from "@/lib/api";
import { cn } from "@/lib/utils";

export type SlotStatusFilter = "all" | "open" | "booked" | "past";

const STATUS_OPTIONS: { value: SlotStatusFilter; label: string }[] = [
  { value: "all", label: "All slots" },
  { value: "open", label: "Open" },
  { value: "booked", label: "Booked" },
  { value: "past", label: "Past / expired" },
];

export function isPastSlot(slot: PeerSlot) {
  return new Date(slot.end).getTime() < Date.now() || slot.status === "expired";
}

function matchesFilter(slot: PeerSlot, filter: SlotStatusFilter) {
  switch (filter) {
    case "open":
      return slot.status === "open" && !isPastSlot(slot);
    case "booked":
      return slot.status === "booked";
    case "past":
      return isPastSlot(slot);
    default:
      return true;
  }
}

function canDeleteSlot(slot: PeerSlot) {
  return slot.status === "open" && !isPastSlot(slot);
}

export function computeSlotStats(slots: PeerSlot[]) {
  let open = 0;
  let booked = 0;
  let past = 0;
  for (const slot of slots) {
    if (isPastSlot(slot)) past += 1;
    else if (slot.status === "open") open += 1;
    else if (slot.status === "booked") booked += 1;
  }
  return { total: slots.length, open, booked, past };
}

function EmptyState({ title, description }: Readonly<{ title: string; description: string }>) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#7367F0]/10">
        <CalendarClock className="h-7 w-7 text-[#7367F0]" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function RoundsCell({
  keys,
  typeNames,
}: Readonly<{ keys: string[]; typeNames: Record<string, string> }>) {
  if (keys.length === 0) return <span className="text-sm text-muted-foreground">—</span>;
  const primary = typeNames[keys[0]] ?? keys[0];
  const extra = keys.length - 1;
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-foreground" title={keys.map((k) => typeNames[k] ?? k).join(", ")}>
        {primary}
      </p>
      {extra > 0 ? (
        <p className="text-xs text-muted-foreground">+{extra} more round{extra === 1 ? "" : "s"}</p>
      ) : null}
    </div>
  );
}

export function InterviewerSlotsTable({
  slots,
  types,
  typeNames,
  timezone,
  selectedIds,
  onSelectedIdsChange,
  onView,
  onEdit,
  onDelete,
  bulkDeleting,
}: Readonly<{
  slots: PeerSlot[];
  types: PeerInterviewType[];
  typeNames: Record<string, string>;
  timezone: string;
  selectedIds: Set<string>;
  onSelectedIdsChange: (ids: Set<string>) => void;
  onView: (slot: PeerSlot) => void;
  onEdit: (slot: PeerSlot) => void;
  onDelete: (slot: PeerSlot) => void;
  bulkDeleting?: boolean;
}>) {
  const [statusFilter, setStatusFilter] = useState<SlotStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredSlots = useMemo(() => {
    return [...slots]
      .filter((s) => matchesFilter(s, statusFilter))
      .filter((s) => !typeFilter || s.availableForTypes.includes(typeFilter))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [slots, statusFilter, typeFilter]);

  const deletableFiltered = useMemo(
    () => filteredSlots.filter(canDeleteSlot),
    [filteredSlots],
  );

  const allDeletableSelected =
    deletableFiltered.length > 0 &&
    deletableFiltered.every((s) => selectedIds.has(s.id));

  const hasActiveFilters = statusFilter !== "all" || Boolean(typeFilter);

  const toggleOne = (id: string, slot: PeerSlot) => {
    if (!canDeleteSlot(slot) || bulkDeleting) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedIdsChange(next);
  };

  const toggleAll = () => {
    if (bulkDeleting) return;
    if (allDeletableSelected) {
      const next = new Set(selectedIds);
      for (const s of deletableFiltered) next.delete(s.id);
      onSelectedIdsChange(next);
    } else {
      const next = new Set(selectedIds);
      for (const s of deletableFiltered) next.add(s.id);
      onSelectedIdsChange(next);
    }
  };

  return (
    <>
      <div className={cn(appFilterBar, "mx-5 mt-4 space-y-3")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="slot-status-filter" className="text-xs font-medium text-muted-foreground">
              Status
            </Label>
            <AppSelect
              id="slot-status-filter"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as SlotStatusFilter)}
              options={STATUS_OPTIONS}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="slot-round-filter" className="text-xs font-medium text-muted-foreground">
              Interview round
            </Label>
            <AppSelect
              id="slot-round-filter"
              value={typeFilter}
              onChange={setTypeFilter}
              allowEmpty
              emptyLabel="All rounds"
              options={types.map((t) => ({ value: t.key, label: t.name }))}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Showing {filteredSlots.length} of {slots.length} slot
            {slots.length === 1 ? "" : "s"}
          </span>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setTypeFilter("");
              }}
              className="font-medium text-[#7367F0] hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {slots.length === 0 ? (
        <EmptyState
          title="No slots yet"
          description="Create availability on the calendar so candidates can book mock interviews with you."
        />
      ) : filteredSlots.length === 0 ? (
        <EmptyState
          title="No slots match your filters"
          description="Try a different status or interview round, or clear filters to see all slots."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border/70">
                <th scope="col" className="w-10 px-5 py-3">
                  <input
                    type="checkbox"
                    checked={allDeletableSelected}
                    disabled={deletableFiltered.length === 0 || bulkDeleting}
                    onChange={toggleAll}
                    aria-label="Select all deletable slots"
                    className="h-4 w-4 accent-[#7367F0]"
                  />
                </th>
                {["Schedule", "Duration", "Rounds", "Status", "Actions"].map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSlots.map((slot) => {
                const deletable = canDeleteSlot(slot);
                const editable = slot.status === "open" && !isPastSlot(slot);
                return (
                  <tr
                    key={slot.id}
                    className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="w-10 px-5 py-3.5 align-top">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(slot.id)}
                        disabled={!deletable || bulkDeleting}
                        onChange={() => toggleOne(slot.id, slot)}
                        aria-label={`Select slot ${formatPeerSchedule(slot.start, timezone)}`}
                        className="mt-0.5 h-4 w-4 accent-[#7367F0] disabled:opacity-40"
                      />
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <p className="text-sm font-semibold text-foreground">
                        {formatPeerSchedule(slot.start, timezone, { dateStyle: "medium", timeStyle: undefined })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPeerTimeInTimezone(slot.start, timezone)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <p className="text-sm tabular-nums text-foreground">{slot.durationMins} min</p>
                    </td>
                    <td className="max-w-[200px] px-5 py-3.5 align-top">
                      <RoundsCell keys={slot.availableForTypes} typeNames={typeNames} />
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <SlotStatusBadge status={slot.status} />
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onView(slot)}
                          className={cn(instituteSecondaryClass, "h-8 gap-1 px-3 text-xs")}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!editable}
                          onClick={() => onEdit(slot)}
                          className={cn(instituteSecondaryClass, "h-8 gap-1 px-3 text-xs")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!deletable}
                          onClick={() => onDelete(slot)}
                          className="h-8 gap-1 border-red-200 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function InterviewerSlotsBulkBar({
  count,
  deleting,
  onDelete,
  onClear,
}: Readonly<{
  count: number;
  deleting: boolean;
  onDelete: () => void;
  onClear: () => void;
}>) {
  if (count === 0) return null;

  return (
    <div
      className={cn(
        "mx-5 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#7367F0]/25",
        "bg-gradient-to-r from-[#7367F0]/8 to-transparent px-4 py-3",
      )}
    >
      <p className="text-sm font-medium text-foreground">
        <span className="font-semibold text-[#7367F0]">{count}</span> open slot
        {count === 1 ? "" : "s"} selected for bulk delete
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={deleting} onClick={onClear}>
          Clear selection
        </Button>
        <Button
          size="sm"
          disabled={deleting}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={onDelete}
        >
          {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Delete selected
        </Button>
      </div>
    </div>
  );
}

export function InterviewerSlotsTableSelectAll({
  slots,
  selectedIds,
  onSelectedIdsChange,
  bulkDeleting,
}: Readonly<{
  slots: PeerSlot[];
  selectedIds: Set<string>;
  onSelectedIdsChange: (ids: Set<string>) => void;
  bulkDeleting?: boolean;
}>) {
  const deletable = useMemo(() => slots.filter(canDeleteSlot), [slots]);
  const allSelected = deletable.length > 0 && deletable.every((s) => selectedIds.has(s.id));

  if (deletable.length === 0) return null;

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
      <input
        type="checkbox"
        checked={allSelected}
        disabled={bulkDeleting}
        onChange={() => {
          if (allSelected) {
            const next = new Set(selectedIds);
            for (const s of deletable) next.delete(s.id);
            onSelectedIdsChange(next);
          } else {
            const next = new Set(selectedIds);
            for (const s of deletable) next.add(s.id);
            onSelectedIdsChange(next);
          }
        }}
        className="h-4 w-4 accent-[#7367F0]"
      />
      Select all open slots ({deletable.length})
    </label>
  );
}
