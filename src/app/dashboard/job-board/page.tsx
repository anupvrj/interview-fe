"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  jobBoardApi,
  type JobBoardEmploymentFilter,
  type JobBoardStateEngagements,
  type JobBoardTabParam,
  type JobBoardWorkMode,
  type JobListing,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  instituteFilterBarClass,
  institutePanelClass,
  institutePrimaryClass,
} from "@/components/institute/InstituteChrome";
import {
  Bookmark,
  Ban,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Search,
  Sparkles,
  ChevronDown,
} from "lucide-react";

const ALL_WORK_MODES: JobBoardWorkMode[] = ["on_site", "hybrid", "remote"];

const workModeLabel: Record<JobBoardWorkMode, string> = {
  on_site: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

const employmentLabel: Record<JobBoardEmploymentFilter, string> = {
  full_time: "Full time",
  part_time: "Part time",
  any: "Any",
};

const jobEmploymentLabel: Record<"full_time" | "part_time", string> = {
  full_time: "Full time",
  part_time: "Part time",
};

const MAX_CTC_INR = 5_000_000;
const CTC_STEP = 100_000;
const FILTER_SEARCH_DEBOUNCE_MS = 400;

/** Lighter than default `secondary` so chips don’t look heavy. */
const jobBoardTagClassName =
  "border-0 bg-slate-100/50 font-medium text-slate-600 shadow-none hover:bg-slate-100/70 dark:bg-slate-800/30 dark:text-slate-200 dark:hover:bg-slate-800/45";

function sortWorkModesList(m: JobBoardWorkMode[]): JobBoardWorkMode[] {
  return [...m].sort(
    (a, b) => ALL_WORK_MODES.indexOf(a) - ALL_WORK_MODES.indexOf(b)
  );
}

function serializeJobFilters(
  loc: string,
  modes: JobBoardWorkMode[],
  minC: number,
  emp: JobBoardEmploymentFilter
): string {
  return JSON.stringify({
    location: loc.trim(),
    workModes: sortWorkModesList(modes),
    minCtcInr: minC,
    employmentType: emp,
  });
}

function formatInrCompact(n: number): string {
  if (n <= 0) return "INR 0+";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

const TABS: {
  id: JobBoardTabParam;
  label: (c: { bookmarked: number; applied: number; notInterested: number }) => string;
  showSparkle?: boolean;
}[] = [
  {
    id: "for_you",
    label: () => "For you",
    showSparkle: true,
  },
  { id: "search", label: () => "Search" },
  {
    id: "bookmarked",
    label: (c) => `Bookmarked (${c.bookmarked})`,
  },
  {
    id: "applied",
    label: (c) => `Applied jobs (${c.applied})`,
  },
  {
    id: "not_interested",
    label: (c) => `Not interested (${c.notInterested})`,
  },
];

export default function JobBoardPage() {
  const { user, isLoaded } = useUser();
  const [tab, setTab] = useState<JobBoardTabParam>("for_you");
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [counts, setCounts] = useState({
    bookmarked: 0,
    applied: 0,
    notInterested: 0,
  });
  const [engagements, setEngagements] = useState<JobBoardStateEngagements>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [location, setLocation] = useState("");
  const [workModes, setWorkModes] = useState<JobBoardWorkMode[]>([...ALL_WORK_MODES]);
  const [minCtcInr, setMinCtcInr] = useState(0);
  const [employmentType, setEmploymentType] =
    useState<JobBoardEmploymentFilter>("any");

  const [workModeOpen, setWorkModeOpen] = useState(false);
  const workModeRef = useRef<HTMLDivElement>(null);
  const [ctcOpen, setCtcOpen] = useState(false);
  const ctcRef = useRef<HTMLDivElement>(null);
  const [applyConfirmOpen, setApplyConfirmOpen] = useState(false);
  const [actionJobId, setActionJobId] = useState<string | null>(null);
  const stateLoaded = useRef(false);
  const initFiltersFromPrefs = useRef(false);
  const lastSavedFiltersKeyRef = useRef<string | null>(null);
  const filterSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterValuesRef = useRef({
    location: "",
    workModes: [] as JobBoardWorkMode[],
    minCtcInr: 0,
    employmentType: "any" as JobBoardEmploymentFilter,
    tab: "for_you" as JobBoardTabParam,
  });
  filterValuesRef.current = {
    location,
    workModes,
    minCtcInr,
    employmentType,
    tab,
  };

  const selected = jobs.find((j) => j.id === selectedId) ?? null;
  const eng = selectedId ? engagements[selectedId] : undefined;
  const showFilterBar = tab === "for_you" || tab === "search";

  useEffect(() => {
    setApplyConfirmOpen(false);
  }, [selectedId]);

  const applyStateFromResponse = useCallback(
    (s: { counts: typeof counts; engagements: JobBoardStateEngagements }) => {
      setCounts(s.counts);
      setEngagements(s.engagements);
    },
    []
  );

  useEffect(() => {
    if (!isLoaded || !user) return;
    let cancelled = false;
    (async () => {
      if (!stateLoaded.current) {
        setLoading(true);
        try {
          const st = await jobBoardApi.getMyState();
          if (!cancelled) {
            applyStateFromResponse(st);
            stateLoaded.current = true;
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
      if (cancelled) return;
      if (initFiltersFromPrefs.current) {
        const f = filterValuesRef.current;
        await jobBoardApi.putMyPreferences({
          location: f.location,
          workModes: f.workModes,
          minCtcInr: f.minCtcInr,
          employmentType: f.employmentType,
        });
        if (cancelled) return;
        lastSavedFiltersKeyRef.current = serializeJobFilters(
          f.location,
          f.workModes,
          f.minCtcInr,
          f.employmentType
        );
      }
      if (cancelled) return;
      setListLoading(true);
      try {
        const t = filterValuesRef.current.tab;
        const { jobs: list, preferences } = await jobBoardApi.getMyJobs(t);
        if (cancelled) return;
        setJobs(list);
        if (!initFiltersFromPrefs.current) {
          const loc = (preferences.location || "").trim();
          const wm = preferences.workModes?.length
            ? sortWorkModesList([...preferences.workModes])
            : [...ALL_WORK_MODES];
          const minC =
            typeof preferences.minCtcInr === "number" ? preferences.minCtcInr : 0;
          const emp = preferences.employmentType ?? "any";
          setLocation(loc);
          setWorkModes([...wm]);
          setMinCtcInr(minC);
          setEmploymentType(emp);
          initFiltersFromPrefs.current = true;
          lastSavedFiltersKeyRef.current = serializeJobFilters(loc, wm, minC, emp);
        }
        setSelectedId((prev) => {
          if (prev && list.some((j) => j.id === prev)) return prev;
          return list[0]?.id ?? null;
        });
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, tab, applyStateFromResponse]);

  useEffect(() => {
    if (!isLoaded || !user || !initFiltersFromPrefs.current) return;
    if (tab !== "for_you" && tab !== "search") return;

    const k = serializeJobFilters(location, workModes, minCtcInr, employmentType);
    if (k === lastSavedFiltersKeyRef.current) return;

    if (filterSearchTimerRef.current) {
      clearTimeout(filterSearchTimerRef.current);
    }
    filterSearchTimerRef.current = setTimeout(() => {
      filterSearchTimerRef.current = null;
      const f = filterValuesRef.current;
      if (f.tab !== "for_you" && f.tab !== "search") return;
      (async () => {
        setListLoading(true);
        try {
          await jobBoardApi.putMyPreferences({
            location: f.location,
            workModes: f.workModes,
            minCtcInr: f.minCtcInr,
            employmentType: f.employmentType,
          });
          const key = serializeJobFilters(
            f.location,
            f.workModes,
            f.minCtcInr,
            f.employmentType
          );
          lastSavedFiltersKeyRef.current = key;
          const { jobs: list } = await jobBoardApi.getMyJobs(f.tab);
          setJobs(list);
          setSelectedId((prev) => {
            if (prev && list.some((j) => j.id === prev)) return prev;
            return list[0]?.id ?? null;
          });
        } finally {
          setListLoading(false);
        }
      })();
    }, FILTER_SEARCH_DEBOUNCE_MS);
    return () => {
      if (filterSearchTimerRef.current) {
        clearTimeout(filterSearchTimerRef.current);
        filterSearchTimerRef.current = null;
      }
    };
  }, [
    location,
    workModes,
    minCtcInr,
    employmentType,
    tab,
    isLoaded,
    user,
  ]);

  useEffect(() => {
    if (!ctcOpen && !workModeOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target;
      if (!t || !(t instanceof Node)) return;
      if (workModeRef.current && !workModeRef.current.contains(t)) {
        setWorkModeOpen(false);
      }
      if (ctcRef.current && !ctcRef.current.contains(t)) {
        setCtcOpen(false);
      }
    };
    // Capture: runs before child handlers, so it still runs if something stops
    // propagation on the bubble phase (e.g. Radix / overlays).
    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, { capture: true });
  }, [ctcOpen, workModeOpen]);

  const flushFilterSearch = useCallback(async () => {
    if (!user || !initFiltersFromPrefs.current) return;
    if (tab !== "for_you" && tab !== "search") return;
    if (filterSearchTimerRef.current) {
      clearTimeout(filterSearchTimerRef.current);
      filterSearchTimerRef.current = null;
    }
    const f = filterValuesRef.current;
    setListLoading(true);
    try {
      await jobBoardApi.putMyPreferences({
        location: f.location,
        workModes: f.workModes,
        minCtcInr: f.minCtcInr,
        employmentType: f.employmentType,
      });
      lastSavedFiltersKeyRef.current = serializeJobFilters(
        f.location,
        f.workModes,
        f.minCtcInr,
        f.employmentType
      );
      const { jobs: list } = await jobBoardApi.getMyJobs(f.tab);
      setJobs(list);
      setSelectedId((prev) => {
        if (prev && list.some((j) => j.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } finally {
      setListLoading(false);
    }
  }, [user, tab]);

  const onEngage = async (
    jobId: string,
    action: "bookmark" | "dismiss" | "mark_applied",
    conflict?: boolean
  ) => {
    setActionJobId(jobId);
    try {
      const data = await jobBoardApi.postEngagement({
        jobId,
        action,
        conflictAcknowledged: conflict,
      });
      applyStateFromResponse(data);
      setListLoading(true);
      try {
        const { jobs: list } = await jobBoardApi.getMyJobs(tab);
        setJobs(list);
        setSelectedId((prev) => {
          if (prev && list.some((j) => j.id === prev)) return prev;
          return list[0]?.id ?? null;
        });
      } finally {
        setListLoading(false);
      }
    } finally {
      setActionJobId(null);
    }
  };

  const handleApplyOrJobPageClick = useCallback(() => {
    if (!selected) return;
    window.open(selected.applyUrl, "_blank", "noopener,noreferrer");
    if (!eng?.appliedSelfReported) {
      setApplyConfirmOpen(true);
    }
  }, [selected, eng?.appliedSelfReported]);

  const toggleWorkMode = (m: JobBoardWorkMode) => {
    setWorkModes((prev) => {
      const has = prev.includes(m);
      if (has) {
        const next = prev.filter((x) => x !== m);
        return next.length === 0 ? [m] : next;
      }
      return [...prev, m].sort(
        (a, b) => ALL_WORK_MODES.indexOf(a) - ALL_WORK_MODES.indexOf(b)
      );
    });
  };

  const workModeSummary =
    workModes.length === 0
      ? "Select modes"
      : workModes
          .map((m) => workModeLabel[m])
          .join(", ");

  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[rgb(37,99,235)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center text-sm text-slate-600">
        Sign in to use the job board.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[rgb(37,99,235)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 pb-4 pt-1 lg:space-y-5 lg:pt-0">
        <div className="min-w-0 space-y-2">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-[rgb(37,99,235)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Job matches
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Job board
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Discover roles matched to your preferences. Sample listings (phase 1).
          </p>
        </div>

        {/* Tab strip */}
        <div className="mb-1 flex flex-wrap items-end gap-1 border-b border-slate-200/90 pb-0 dark:border-border">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative -mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-[rgb(37,99,235)] text-[rgb(37,99,235)]"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-foreground/90"
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  {t.showSparkle && (
                    <Sparkles
                      className="h-3.5 w-3.5 text-[rgb(37,99,235)]"
                      aria-hidden
                    />
                  )}
                  {t.label(counts)}
                </span>
              </button>
            );
          })}
        </div>

        {showFilterBar && (
          <div
            className={cn(
              "mb-0 flex flex-col gap-3 p-4 sm:p-4",
              instituteFilterBarClass
            )}
          >
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-12 lg:items-end">
              <div className="relative lg:col-span-3">
                <span
                  className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-lg leading-none"
                  aria-hidden
                >
                  🇮🇳
                </span>
                <Input
                  className="h-10 border-slate-200 bg-white pl-9 dark:border-border"
                  placeholder="Location or zip code"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="relative lg:col-span-3" ref={workModeRef}>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full justify-between border-slate-200 bg-white font-normal dark:border-border"
                  onClick={() => {
                    setWorkModeOpen((o) => !o);
                    setCtcOpen(false);
                  }}
                >
                  <span className="truncate text-left text-sm">{workModeSummary}</span>
                </Button>
                {workModeOpen && (
                  <div className="absolute z-20 mt-1 w-full min-w-[220px] rounded-md border border-slate-200/90 bg-white p-2 shadow-md dark:border-border dark:bg-card">
                    {ALL_WORK_MODES.map((m) => (
                      <label
                        key={m}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-zinc-300"
                          checked={workModes.includes(m)}
                          onChange={() => toggleWorkMode(m)}
                        />
                        {workModeLabel[m]}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative lg:col-span-3" ref={ctcRef}>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full justify-between border-slate-200 bg-white font-normal dark:border-border"
                  onClick={() => {
                    setCtcOpen((o) => !o);
                    setWorkModeOpen(false);
                  }}
                  aria-expanded={ctcOpen}
                  aria-haspopup="dialog"
                >
                  <span className="truncate text-left text-sm">
                    {formatInrCompact(minCtcInr)}+
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
                </Button>
                {ctcOpen && (
                  <div
                    className="absolute z-20 mt-1 w-full min-w-[260px] rounded-md border border-slate-200/90 bg-white p-3 shadow-md dark:border-border dark:bg-card"
                    role="dialog"
                    aria-label="Minimum CTC filter"
                  >
                    <p className="mb-2 text-xs text-muted-foreground">Minimum CTC (INR)</p>
                    <p className="mb-2 text-sm font-medium text-foreground">
                      {formatInrCompact(minCtcInr)}+
                    </p>
                    <Slider
                      variant="primary"
                      min={0}
                      max={MAX_CTC_INR}
                      step={CTC_STEP}
                      value={[minCtcInr]}
                      onValueChange={(v) => setMinCtcInr(v[0] ?? 0)}
                      className="pt-0.5"
                    />
                  </div>
                )}
              </div>

              <div className="lg:col-span-2">
                <Label className="mb-1.5 block text-xs text-slate-600">
                  Employment
                </Label>
                <Select
                  value={employmentType}
                  onValueChange={(v) =>
                    setEmploymentType(v as JobBoardEmploymentFilter)
                  }
                >
                  <SelectTrigger className="h-10 border-slate-200 bg-white dark:border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any" className="focus:bg-zinc-100">
                      {employmentLabel.any}
                    </SelectItem>
                    <SelectItem value="full_time">{employmentLabel.full_time}</SelectItem>
                    <SelectItem value="part_time">{employmentLabel.part_time}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 lg:col-span-1">
                <Button
                  type="button"
                  className={cn("h-10 flex-1", institutePrimaryClass)}
                  onClick={() => void flushFilterSearch()}
                  disabled={listLoading}
                  title="Search now (filters also update as you type)"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 shrink-0 border-slate-200 bg-white shadow-sm dark:border-border"
                  aria-label="Saved search"
                >
                  <FileText className="h-4 w-4 text-[rgb(37,99,235)]" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-2 flex items-center gap-1.5 text-sm text-slate-600">
          <Clock className="h-4 w-4 text-[rgb(37,99,235)]" />
          {tab === "for_you" && <span>Top jobs for you</span>}
          {tab === "search" && <span>Search results</span>}
          {tab === "bookmarked" && <span>Your bookmarked roles</span>}
          {tab === "applied" && <span>Roles you applied to</span>}
          {tab === "not_interested" && <span>Roles you are not interested in</span>}
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {/* Master list */}
          <div className="lg:col-span-5">
            <div
              className="max-h-[min(70vh,720px)] space-y-3 overflow-y-auto pr-1"
              role="list"
            >
              {listLoading && (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-[rgb(37,99,235)]" />
                </div>
              )}
              {!listLoading && jobs.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-600">
                  No jobs in this view. Try another tab or adjust filters.
                </p>
              )}
              {!listLoading &&
                jobs.map((job) => {
                  const e = engagements[job.id];
                  const isSel = job.id === selectedId;
                  return (
                    <button
                      key={job.id}
                      type="button"
                      role="listitem"
                      onClick={() => setSelectedId(job.id)}
                      className={cn(
                        "w-full rounded-lg border bg-white p-4 text-left text-sm shadow-sm transition-shadow dark:bg-card",
                        isSel
                          ? "border-2 border-[rgb(37,99,235)] shadow-md ring-1 ring-blue-200/50 dark:border-blue-500"
                          : "border border-slate-200/90 shadow-sm shadow-blue-500/5 hover:border-blue-200/80 hover:bg-slate-50/80 dark:border-border"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">{job.title}</h3>
                          {job.isPremium && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              For Premium Members only
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              const busy = actionJobId === job.id;
                              if (!busy) void onEngage(job.id, "bookmark");
                            }}
                            onKeyDown={(ev) => {
                              if (ev.key === "Enter" || ev.key === " ") {
                                ev.stopPropagation();
                                if (actionJobId !== job.id) void onEngage(job.id, "bookmark");
                              }
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-border"
                            title="Bookmark"
                          >
                            <Bookmark
                              className={cn(
                                "h-4 w-4",
                                e?.bookmarked
                                  ? "fill-[rgb(37,99,235)] text-[rgb(37,99,235)]"
                                  : "text-slate-500"
                              )}
                            />
                          </span>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              if (actionJobId !== job.id) void onEngage(job.id, "dismiss");
                            }}
                            onKeyDown={(ev) => {
                              if (ev.key === "Enter" || ev.key === " ") {
                                ev.stopPropagation();
                                if (actionJobId !== job.id) void onEngage(job.id, "dismiss");
                              }
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-border"
                            title="Not interested"
                          >
                            <Ban
                              className={cn(
                                "h-4 w-4",
                                e?.dismissed
                                  ? "text-red-600"
                                  : "text-zinc-500"
                              )}
                            />
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge
                          variant="secondary"
                          className={jobBoardTagClassName}
                        >
                          {job.location}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={jobBoardTagClassName}
                        >
                          {workModeLabel[job.workMode]}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={jobBoardTagClassName}
                        >
                          {job.salaryRangeLabel}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={jobBoardTagClassName}
                        >
                          {jobEmploymentLabel[job.employmentType]}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {job.postedAgo}
                        {job.earlyApplicant && (
                          <span className="ml-2 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                            Be an early applicant
                          </span>
                        )}
                      </p>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Detail */}
          <div className="lg:col-span-7">
            {selected ? (
              <Card
                className={cn(
                  "overflow-hidden dark:border-blue-500/25 dark:bg-card",
                  institutePanelClass
                )}
              >
                <div className="border-b border-slate-100/90 p-5 dark:border-border">
                  <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3">
                    <div className="min-w-0 flex-1 pr-1">
                      <h2
                        className="truncate text-base font-semibold leading-tight text-slate-900 sm:text-lg"
                        title={selected.title}
                      >
                        {selected.title}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-xs text-slate-600">
                        {selected.isPremium && (
                          <span>For Premium Members only</span>
                        )}
                        {selected.isPremium && (
                          <span className="text-zinc-300" aria-hidden>
                            ·
                          </span>
                        )}
                        <span>{selected.postedAgo}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
                      <label
                        className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-xs text-slate-800"
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 shrink-0 rounded border-zinc-300"
                          checked={!!eng?.appliedSelfReported}
                          onChange={() => {
                            if (actionJobId === selected.id) return;
                            const turningOn = !eng?.appliedSelfReported;
                            void onEngage(
                              selected.id,
                              "mark_applied",
                              turningOn ? false : undefined
                            );
                          }}
                          disabled={actionJobId === selected.id}
                        />
                        <span>Applied</span>
                      </label>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 shrink-0 rounded-full border-slate-200 bg-white p-0"
                        onClick={() => onEngage(selected.id, "bookmark")}
                        disabled={actionJobId === selected.id}
                        title="Bookmark"
                      >
                        <Bookmark
                          className={cn(
                            "h-3.5 w-3.5",
                            eng?.bookmarked
                              ? "fill-[rgb(37,99,235)] text-[rgb(37,99,235)]"
                              : "text-slate-500"
                          )}
                        />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 shrink-0 rounded-full border-slate-200 bg-white p-0"
                        onClick={() => onEngage(selected.id, "dismiss")}
                        disabled={actionJobId === selected.id}
                        title="Not interested"
                      >
                        <Ban
                          className={cn(
                            "h-3.5 w-3.5",
                            eng?.dismissed ? "text-red-600" : "text-zinc-500"
                          )}
                        />
                      </Button>
                      <Button
                        type="button"
                        className={cn(
                          "h-8 shrink-0 gap-1 px-2.5 text-xs sm:gap-1.5 sm:px-3 sm:text-sm",
                          institutePrimaryClass
                        )}
                        onClick={handleApplyOrJobPageClick}
                        title={
                          eng?.appliedSelfReported
                            ? "Open job page in a new tab"
                            : "Apply in a new tab"
                        }
                      >
                        {eng?.appliedSelfReported ? "Go to Job Page" : "Apply now"}
                        <ChevronRight
                          className="h-3.5 w-3.5 text-white/90"
                          strokeWidth={2.5}
                        />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 rounded-md border border-blue-200/50 bg-gradient-to-r from-blue-50/90 to-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-blue-500/20 dark:from-blue-950/30 dark:to-slate-900/30">
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      Need a strong resume? Generate one tailored to this job in minutes.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        asChild
                        size="sm"
                        className="border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50"
                      >
                        <Link href="/dashboard/resumes/new">Generate a resume</Link>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-900">
                      Job summary
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {selected.summary}
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-900">
                      Qualifications
                    </h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                      {selected.qualifications.map((q) => (
                        <li key={q.slice(0, 40)}>{q}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-900">
                      Responsibilities
                    </h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                      {selected.responsibilities.map((r) => (
                        <li key={r.slice(0, 40)}>{r}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.skills.map((s) => (
                        <Badge
                          key={s}
                          variant="secondary"
                          className={jobBoardTagClassName}
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">
                      Tools
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.tools.map((t) => (
                        <Badge
                          key={t}
                          variant="secondary"
                          className={jobBoardTagClassName}
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200/90 bg-slate-50/50 text-sm text-slate-600">
                Select a job to see details
              </div>
            )}
          </div>
        </div>

      <Dialog open={applyConfirmOpen} onOpenChange={setApplyConfirmOpen}>
        <DialogContent className="max-w-sm border-slate-200 sm:max-w-md dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">
              Application status
            </DialogTitle>
            <DialogDescription className="text-left text-slate-600">
              Have you applied on the main job page?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2 sm:justify-end sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setApplyConfirmOpen(false)}
              disabled={actionJobId === selectedId}
            >
              No
            </Button>
            <Button
              type="button"
              className={cn("w-full sm:w-auto", institutePrimaryClass)}
              disabled={!selected || actionJobId === selectedId}
              onClick={async () => {
                if (!selected) return;
                setApplyConfirmOpen(false);
                await onEngage(selected.id, "mark_applied", false);
              }}
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
