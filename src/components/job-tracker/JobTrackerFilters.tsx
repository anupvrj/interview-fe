"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Heart, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { appFilterBar, appOutlineButton, appPrimaryButton } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import {
  EMPTY_JOB_TRACKER_FILTERS,
  JOB_TRACKER_ACTIVE_STATUSES,
  JOB_TRACKER_STATUS_LABELS,
  JOB_TRACKER_TYPES,
  JOB_TRACKER_TYPE_LABELS,
  JOB_TRACKER_WORK_MODE_LABELS,
  JOB_TRACKER_WORK_MODES,
  hasActiveJobTrackerFilters,
  jobTrackerFilterChips,
  type JobTrackerListFilters,
} from "@/lib/job-tracker";

function ToolbarIconButton({
  label,
  active,
  badge,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  badge?: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "relative h-11 w-11 shrink-0 px-0",
        active && "border-[#7367F0]/40 text-[#7367F0]",
      )}
    >
      {children}
      {badge ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#7367F0] px-1 text-[10px] font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </Button>
  );
}

function FilterFields({
  value,
  onChange,
}: {
  value: JobTrackerListFilters;
  onChange: (next: JobTrackerListFilters) => void;
}) {
  return (
    <>
      <div className="flex min-w-[9rem] flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Status</Label>
        <AppSelect
          value={value.status ?? ""}
          onChange={(status) =>
            onChange({
              ...value,
              status: status as JobTrackerListFilters["status"],
            })
          }
          allowEmpty
          emptyLabel="All statuses"
          options={JOB_TRACKER_ACTIVE_STATUSES.map((status) => ({
            value: status,
            label: JOB_TRACKER_STATUS_LABELS[status],
          }))}
          className="h-11"
        />
      </div>
      <div className="flex min-w-[8rem] flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Job type</Label>
        <AppSelect
          value={value.jobType ?? ""}
          onChange={(jobType) =>
            onChange({
              ...value,
              jobType: jobType as JobTrackerListFilters["jobType"],
            })
          }
          allowEmpty
          emptyLabel="All types"
          options={JOB_TRACKER_TYPES.map((type) => ({
            value: type,
            label: JOB_TRACKER_TYPE_LABELS[type],
          }))}
          className="h-11"
        />
      </div>
      <div className="flex min-w-[8rem] flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Work mode</Label>
        <AppSelect
          value={value.workMode ?? ""}
          onChange={(workMode) =>
            onChange({
              ...value,
              workMode: workMode as JobTrackerListFilters["workMode"],
            })
          }
          allowEmpty
          emptyLabel="Any"
          options={JOB_TRACKER_WORK_MODES.map((mode) => ({
            value: mode,
            label: JOB_TRACKER_WORK_MODE_LABELS[mode],
          }))}
          className="h-11"
        />
      </div>
      <div className="flex min-w-[9rem] flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Applied from</Label>
        <Input
          type="date"
          value={value.appliedFrom ?? ""}
          onChange={(e) => onChange({ ...value, appliedFrom: e.target.value })}
          className="h-11 bg-card"
        />
      </div>
      <div className="flex min-w-[9rem] flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Applied until</Label>
        <Input
          type="date"
          value={value.appliedUntil ?? ""}
          onChange={(e) => onChange({ ...value, appliedUntil: e.target.value })}
          className="h-11 bg-card"
        />
      </div>
    </>
  );
}

export function JobTrackerFilters({
  applied,
  onApply,
}: {
  applied: JobTrackerListFilters;
  onApply: (next: JobTrackerListFilters) => void;
}) {
  const [draft, setDraft] = useState(applied);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const chips = useMemo(() => jobTrackerFilterChips(applied), [applied]);
  const extraCount = chips.filter((chip) => chip.key !== "q").length;

  const runSearch = () => onApply({ ...applied, q: draft.q?.trim() ?? "" });
  const applyDraft = () => {
    onApply({ ...draft, q: draft.q?.trim() ?? "" });
    setFiltersOpen(false);
    setSearchOpen(false);
  };
  const clear = () => {
    const next = { ...EMPTY_JOB_TRACKER_FILTERS, archived: applied.archived };
    setDraft(next);
    onApply(next);
  };
  const removeChip = (key: keyof JobTrackerListFilters) => {
    const next = { ...applied, [key]: key === "favorite" ? false : "" };
    setDraft(next);
    onApply(next);
  };

  return (
    <div className={cn(appFilterBar, "min-w-0 overflow-hidden p-3 sm:p-4")}>
      <div className="hidden min-w-0 lg:block">
        <div className="flex min-w-0 items-end gap-3 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
          <div className="flex min-w-[14rem] flex-1 flex-col gap-1.5">
            <Label className="whitespace-nowrap text-xs font-medium text-muted-foreground">
              Search for role or company
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={draft.q ?? ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, q: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runSearch();
                }}
                placeholder="Search by role or company"
                className="h-11 bg-card !pl-10"
              />
            </div>
          </div>
          <FilterFields value={draft} onChange={setDraft} />
          <Button
            type="button"
            variant={applied.favorite ? "default" : "outline"}
            className={cn("h-11 shrink-0", applied.favorite ? appPrimaryButton : appOutlineButton)}
            onClick={() => onApply({ ...applied, favorite: !applied.favorite })}
          >
            <Heart className={cn("mr-2 h-4 w-4", applied.favorite && "fill-current")} />
            Favorites
          </Button>
          <Button type="button" className={cn("h-11 shrink-0", appPrimaryButton)} onClick={runSearch}>
            Search
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 lg:hidden">
        <ToolbarIconButton
          label="Search"
          active={Boolean(applied.q)}
          onClick={() => {
            setDraft(applied);
            setSearchOpen(true);
          }}
        >
          <Search className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="More filters"
          active={extraCount > 0}
          badge={extraCount || undefined}
          onClick={() => {
            setDraft(applied);
            setFiltersOpen(true);
          }}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </ToolbarIconButton>
        <Button
          type="button"
          variant={applied.favorite ? "default" : "outline"}
          className={cn("h-11", applied.favorite && appPrimaryButton)}
          onClick={() => onApply({ ...applied, favorite: !applied.favorite })}
        >
          <Heart className={cn("h-4 w-4", applied.favorite && "fill-current")} />
        </Button>
      </div>

      {hasActiveJobTrackerFilters(applied) ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => removeChip(chip.key)}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#7367F0]/25 bg-[#7367F0]/8 px-2.5 py-1 text-xs font-medium text-[#7367F0] hover:bg-[#7367F0]/15"
            >
              <span className="max-w-[12rem] truncate">{chip.label}</span>
              <X className="h-3 w-3 shrink-0 opacity-70" />
            </button>
          ))}
          <Button type="button" variant="ghost" className="h-8 px-2 text-xs" onClick={clear}>
            Clear all
          </Button>
        </div>
      ) : null}

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search jobs</DialogTitle>
          </DialogHeader>
          <Input
            value={draft.q ?? ""}
            onChange={(e) => setDraft((prev) => ({ ...prev, q: e.target.value }))}
            placeholder="Role or company"
            className="h-11"
          />
          <DialogFooter>
            <Button type="button" className={appPrimaryButton} onClick={applyDraft}>
              Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <FilterFields value={draft} onChange={setDraft} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={clear}>
              Clear
            </Button>
            <Button type="button" className={appPrimaryButton} onClick={applyDraft}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
