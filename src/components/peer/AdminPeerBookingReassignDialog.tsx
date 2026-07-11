"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Loader2, Minus, Plus, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { JobRoleSelect } from "@/components/career/JobRoleSelect";
import { cn } from "@/lib/utils";
import { toPeerIndustryList } from "@/lib/career-catalog";
import {
  peerApi,
  type PeerInterviewType,
  type PeerReassignInterviewerFilters,
  type PeerReassignInterviewerList,
  type PeerReassignInterviewerOption,
  type PeerSlot,
} from "@/lib/api";

function filterByNameOrEmail(interviewers: PeerReassignInterviewerOption[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return interviewers;
  return interviewers.filter(
    (i) => i.name.toLowerCase().includes(q) || i.workEmail.toLowerCase().includes(q),
  );
}

function filterSummary(filters: PeerReassignInterviewerFilters) {
  const parts = [
    filters.industry || "All industries",
    filters.jobRole || "All roles",
    filters.interviewTypeName || filters.interviewType,
  ].filter(Boolean);
  return parts.join(" · ");
}

type AdminPeerBookingReassignDialogProps = {
  open: boolean;
  bookingId: string;
  onOpenChange: (open: boolean) => void;
  onReassigned: () => void | Promise<void>;
};

const EMPTY_FILTERS: PeerReassignInterviewerFilters = {
  industry: "",
  jobRole: "",
  interviewType: "",
  interviewTypeName: "",
  availability: "available_away",
  requireOpenSlot: false,
};

function FilterField({
  id,
  label,
  children,
}: Readonly<{ id: string; label: string; children: ReactNode }>) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function AdminPeerBookingReassignDialog({
  open,
  bookingId,
  onOpenChange,
  onReassigned,
}: Readonly<AdminPeerBookingReassignDialogProps>) {
  const [acting, setActing] = useState(false);
  const [reassignData, setReassignData] = useState<PeerReassignInterviewerList | null>(null);
  const [filters, setFilters] = useState<PeerReassignInterviewerFilters>(EMPTY_FILTERS);
  const [defaults, setDefaults] = useState<PeerReassignInterviewerFilters | null>(null);
  const industries = useMemo(() => toPeerIndustryList(), []);
  const [interviewTypes, setInterviewTypes] = useState<PeerInterviewType[]>([]);
  const [targetInterviewer, setTargetInterviewer] = useState("");
  const [targetSlots, setTargetSlots] = useState<PeerSlot[]>([]);
  const [targetSlotId, setTargetSlotId] = useState("");
  const [search, setSearch] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [loadingInterviewers, setLoadingInterviewers] = useState(false);

  const filteredInterviewers = useMemo(
    () => filterByNameOrEmail(reassignData?.interviewers ?? [], search),
    [reassignData?.interviewers, search],
  );

  const filtersDirty = useMemo(() => {
    if (!defaults) return false;
    return (
      filters.industry !== defaults.industry ||
      filters.jobRole !== defaults.jobRole ||
      filters.interviewType !== defaults.interviewType ||
      filters.availability !== defaults.availability ||
      filters.requireOpenSlot !== defaults.requireOpenSlot
    );
  }, [defaults, filters]);

  const resetForm = () => {
    setReassignData(null);
    setDefaults(null);
    setFilters(EMPTY_FILTERS);
    setTargetInterviewer("");
    setTargetSlots([]);
    setTargetSlotId("");
    setSearch("");
    setFiltersExpanded(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const loadInterviewers = async (nextFilters?: PeerReassignInterviewerFilters) => {
    setLoadingInterviewers(true);
    setTargetInterviewer("");
    setTargetSlots([]);
    setTargetSlotId("");
    try {
      const active = nextFilters ?? filters;
      const data = await peerApi.admin.listReassignInterviewers(bookingId, {
        industry: active.industry,
        jobRole: active.jobRole,
        interviewType: active.interviewType,
        availability: active.availability,
        requireOpenSlot: active.requireOpenSlot,
      });
      setReassignData(data);
      setDefaults(data.defaults);
      setFilters(data.filters);
    } catch {
      toast.error("Could not load interviewers for reassignment");
      setReassignData(null);
    } finally {
      setLoadingInterviewers(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const types = await peerApi.listInterviewTypes();
        setInterviewTypes(types);
      } catch {
        /* optional metadata */
      }
      await loadInterviewers();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bookingId]);

  const loadTargetSlots = async (id: string, interviewType: string) => {
    setTargetInterviewer(id);
    setTargetSlotId("");
    if (!id || !interviewType) {
      setTargetSlots([]);
      return;
    }
    try {
      const res = await peerApi.getInterviewer(id);
      setTargetSlots(
        res.slots.filter(
          (s) =>
            s.status === "open" &&
            s.availableForTypes.includes(interviewType) &&
            new Date(s.start) >= new Date(),
        ),
      );
    } catch {
      setTargetSlots([]);
    }
  };

  const doReassign = async () => {
    if (!targetSlotId) {
      toast.error("Pick a slot");
      return;
    }
    setActing(true);
    try {
      await peerApi.admin.reassign(bookingId, targetSlotId);
      toast.success("Interviewer reassigned");
      handleOpenChange(false);
      await onReassigned();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Reassign failed");
    } finally {
      setActing(false);
    }
  };

  const resetFilters = () => {
    if (!defaults) return;
    setSearch("");
    void loadInterviewers(defaults);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Reassign interviewer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
            <button
              type="button"
              onClick={() => setFiltersExpanded((prev) => !prev)}
              aria-expanded={filtersExpanded}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card text-[#7367F0]">
                {filtersExpanded ? (
                  <Minus className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">Search interviewers</span>
                {!filtersExpanded ? (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {filterSummary(filters)}
                    {reassignData
                      ? ` · ${reassignData.interviewers.length} matched`
                      : ""}
                  </span>
                ) : null}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  filtersExpanded && "rotate-180",
                )}
              />
            </button>

            {filtersExpanded ? (
              <div className="space-y-4 border-t border-border/60 px-4 pb-4 pt-3">
                <FilterField id="reassign-search" label="Name or email">
                  <div className="relative w-full">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reassign-search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter results by name or email…"
                      className="h-11 w-full bg-card !pl-10 pr-4"
                    />
                  </div>
                </FilterField>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FilterField id="reassign-industry" label="Industry">
                    <AppSelect
                      id="reassign-industry"
                      value={filters.industry}
                      onChange={(v) =>
                        setFilters((prev) => ({ ...prev, industry: v, jobRole: "" }))
                      }
                      allowEmpty
                      emptyLabel="All industries"
                      options={industries.map((i) => ({ value: i.name, label: i.name }))}
                    />
                  </FilterField>

                  <FilterField id="reassign-role" label="Role">
                    <JobRoleSelect
                      id="reassign-role"
                      value={filters.jobRole}
                      onChange={(v) => setFilters((prev) => ({ ...prev, jobRole: v }))}
                      industry={filters.industry || undefined}
                      disabled={!filters.industry}
                      placeholder="All roles"
                      inputClassName="h-11 bg-card"
                    />
                  </FilterField>

                  <FilterField id="reassign-round" label="Interview round">
                    <AppSelect
                      id="reassign-round"
                      value={filters.interviewType}
                      onChange={(v) => {
                        const next = interviewTypes.find((t) => t.key === v);
                        setFilters((prev) => ({
                          ...prev,
                          interviewType: v,
                          interviewTypeName: next?.name || v,
                        }));
                      }}
                      options={interviewTypes.map((t) => ({ value: t.key, label: t.name }))}
                    />
                  </FilterField>

                  <FilterField id="reassign-availability" label="Availability">
                    <AppSelect
                      id="reassign-availability"
                      value={filters.availability}
                      onChange={(v) =>
                        setFilters((prev) => ({
                          ...prev,
                          availability: v as PeerReassignInterviewerFilters["availability"],
                        }))
                      }
                      options={[
                        { value: "available_away", label: "Available or away" },
                        { value: "available", label: "Available only" },
                        { value: "away", label: "Away only" },
                        { value: "any", label: "Any status" },
                      ]}
                    />
                  </FilterField>
                </div>

                <label className="flex items-start gap-2.5 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={filters.requireOpenSlot}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, requireOpenSlot: e.target.checked }))
                    }
                    className="mt-0.5 rounded border-border"
                  />
                  <span>Only show interviewers with open slots</span>
                </label>

                <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
                  {filtersDirty ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetFilters}
                      disabled={loadingInterviewers}
                      className="h-11 w-full sm:w-auto"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset filters
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    onClick={() => void loadInterviewers(filters)}
                    disabled={loadingInterviewers}
                    className="h-11 w-full bg-[#7367F0] text-white hover:bg-[#6e62e5] sm:min-w-[180px] sm:w-auto"
                  >
                    {loadingInterviewers ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Search interviewers
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {loadingInterviewers ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
            </div>
          ) : (
            <div className="space-y-4">
              {reassignData ? (
                <p className="text-xs text-muted-foreground">
                  {reassignData.interviewers.length} interviewer
                  {reassignData.interviewers.length === 1 ? "" : "s"} matched
                  {search.trim() ? ` · ${filteredInterviewers.length} after name/email filter` : ""}
                </p>
              ) : null}

              <FilterField id="reassign-interviewer" label="New interviewer">
                <AppSelect
                  id="reassign-interviewer"
                  value={targetInterviewer}
                  onChange={(v) => void loadTargetSlots(v, filters.interviewType)}
                  allowEmpty
                  emptyLabel="Select interviewer"
                  options={filteredInterviewers.map((i) => ({
                    value: i._id,
                    label: `${i.name} — ${i.company} (${i.workEmail})${
                      i.hasOpenSlot === false ? " · no open slots" : ""
                    }`,
                  }))}
                />
                {reassignData && reassignData.interviewers.length === 0 ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    No interviewers match the selected filters. Expand search and try again.
                  </p>
                ) : null}
                {reassignData &&
                reassignData.interviewers.length > 0 &&
                filteredInterviewers.length === 0 ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    No interviewers match your name/email filter. Clear the search field to see all
                    matches.
                  </p>
                ) : null}
              </FilterField>

              <FilterField id="reassign-slot" label="Open slot">
                <AppSelect
                  id="reassign-slot"
                  value={targetSlotId}
                  onChange={setTargetSlotId}
                  disabled={!targetInterviewer}
                  allowEmpty
                  emptyLabel="Select slot"
                  options={targetSlots.map((s) => ({
                    value: s.id,
                    label: new Date(s.start).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }),
                  }))}
                />
                {targetInterviewer && targetSlots.length === 0 ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    This interviewer has no open slots for the selected interview round.
                  </p>
                ) : null}
              </FilterField>

              <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                The previous interviewer loses access to this booking. The candidate is notified of
                the new interviewer and link.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={acting}
            className="h-11 w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void doReassign()}
            disabled={acting || !targetSlotId || loadingInterviewers}
            className="h-11 w-full bg-[#7367F0] text-white hover:bg-[#6e62e5] sm:w-auto"
          >
            {acting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Reassign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
