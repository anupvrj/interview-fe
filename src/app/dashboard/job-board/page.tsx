"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  jobBoardApi,
  type JobBoardEmploymentFilter,
  type JobBoardJSearchJobRequirement,
  type JobBoardListMeta,
  type JobBoardPostedWithin,
  type JobBoardStateEngagements,
  type JobBoardTabParam,
  type JobBoardWorkMode,
  type JobListing,
} from "@/lib/api";
import { sanitizeJobBoardLocation } from "@/lib/sanitizeJobBoardLocation";
import {
  deriveExploreJobsForTab,
  mergeExploreCatalogById,
} from "@/lib/jobBoardExplore";
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
  Loader2,
  Search,
  SlidersHorizontal,
  Sparkles,
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

type JobBoardExperienceFilter = "any" | JobBoardJSearchJobRequirement;

const experienceRequirementLabel: Record<JobBoardExperienceFilter, string> =
  {
    any: "Any experience level",
    no_experience: "No experience required",
    under_3_years_experience: "Under 3 years",
    more_than_3_years_experience: "3+ years",
  };

const jobEmploymentLabel: Record<"full_time" | "part_time", string> = {
  full_time: "Full time",
  part_time: "Part time",
};

const MAX_CTC_INR = 5_000_000;
const CTC_STEP = 100_000;
/** Matches server `results_wanted` / JSearch page size (~10 per page). */
const JOB_LIST_PAGE_SIZE = 10;

function sortWorkModesList(m: JobBoardWorkMode[]): JobBoardWorkMode[] {
  return [...m].sort(
    (a, b) => ALL_WORK_MODES.indexOf(a) - ALL_WORK_MODES.indexOf(b),
  );
}

/** Last filters synced to the server + used for job list fetches (updated on Search / Apply only). */
type AppliedJobBoardFilters = {
  location: string;
  workModes: JobBoardWorkMode[];
  minCtcInr: number;
  employmentType: JobBoardEmploymentFilter;
  searchKeywords: string;
  postedWithin: JobBoardPostedWithin;
  jobRequirement: JobBoardExperienceFilter;
};

function buildAppliedSnapshot(f: {
  location: string;
  workModes: JobBoardWorkMode[];
  minCtcInr: number;
  employmentType: JobBoardEmploymentFilter;
  searchKeywords: string;
  postedWithin: JobBoardPostedWithin;
  jobRequirement: JobBoardExperienceFilter;
}): AppliedJobBoardFilters {
  return {
    location: f.location.trim(),
    workModes: sortWorkModesList([...f.workModes]),
    minCtcInr: f.minCtcInr,
    employmentType: f.employmentType,
    searchKeywords: f.searchKeywords.trim(),
    postedWithin: f.postedWithin,
    jobRequirement: f.jobRequirement,
  };
}

function serializeExploreFilterKey(a: AppliedJobBoardFilters): string {
  return JSON.stringify({
    location: a.location,
    workModes: a.workModes,
    minCtcInr: a.minCtcInr,
    employmentType: a.employmentType,
    searchKeywords: a.searchKeywords,
    postedWithin: a.postedWithin,
    jobRequirement: a.jobRequirement,
  });
}

const postedWithinLabel: Record<JobBoardPostedWithin, string> = {
  any: "Any time",
  today: "Posted today",
  "2d": "Last 2 days",
  week: "This week",
  "10d": "Last 10 days",
  "30d": "Last 30 days",
};

/** Lighter than default `secondary` so chips don’t look heavy. */
const jobBoardTagClassName =
  "border-0 bg-slate-100/50 font-medium text-slate-600 shadow-none hover:bg-slate-100/70 dark:bg-slate-800/30 dark:text-slate-200 dark:hover:bg-slate-800/45";

function jobListingSnapshot(job: JobListing): Record<string, unknown> {
  return { ...job };
}

/** Renders JSearch `job_description` with `**bold**` segments (common in scraped postings). */
function formatJSearchInlineBold(text: string): ReactNode {
  const parts = text.split(/(\*\*[\s\S]*?\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([\s\S]*?)\*\*$/);
    if (m) {
      return (
        <strong
          key={i}
          className="font-semibold text-slate-900 dark:text-slate-100"
        >
          {m[1]}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function JSearchDescriptionBody({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").trim().split(/\n\n+/);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
      {blocks.map((block, i) => (
        <div key={i} className="whitespace-pre-wrap break-words">
          {formatJSearchInlineBold(block.trim())}
        </div>
      ))}
    </div>
  );
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
  label: (c: {
    bookmarked: number;
    applied: number;
    notInterested: number;
  }) => string;
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
  /** True only while fetching the next page (not a full list replace). */
  const [isAppendingJobs, setIsAppendingJobs] = useState(false);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [listMeta, setListMeta] = useState<JobBoardListMeta | null>(null);
  const [counts, setCounts] = useState({
    bookmarked: 0,
    applied: 0,
    notInterested: 0,
  });
  const [engagements, setEngagements] = useState<JobBoardStateEngagements>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [location, setLocation] = useState("");
  const [workModes, setWorkModes] = useState<JobBoardWorkMode[]>([
    ...ALL_WORK_MODES,
  ]);
  const [minCtcInr, setMinCtcInr] = useState(0);
  const [employmentType, setEmploymentType] =
    useState<JobBoardEmploymentFilter>("any");
  const [searchKeywords, setSearchKeywords] = useState("");
  const [postedWithin, setPostedWithin] =
    useState<JobBoardPostedWithin>("week");
  const [jobRequirement, setJobRequirement] =
    useState<JobBoardExperienceFilter>("any");

  const [filtersDialogOpen, setFiltersDialogOpen] = useState(false);
  const [applyConfirmOpen, setApplyConfirmOpen] = useState(false);
  const [actionJobId, setActionJobId] = useState<string | null>(null);
  const stateLoaded = useRef(false);
  const initFiltersFromPrefs = useRef(false);
  const appliedFiltersRef = useRef<AppliedJobBoardFilters | null>(null);
  /** Shared JSearch pages (always fetched with tab=search order); For you / Search are derived locally. */
  const exploreMergedCatalogRef = useRef<JobListing[]>([]);
  const exploreFilterKeyRef = useRef<string | null>(null);
  const exploreListMetaRef = useRef<JobBoardListMeta | null>(null);
  const filterValuesRef = useRef<{
    location: string;
    workModes: JobBoardWorkMode[];
    minCtcInr: number;
    employmentType: JobBoardEmploymentFilter;
    tab: JobBoardTabParam;
    searchKeywords: string;
    postedWithin: JobBoardPostedWithin;
    jobRequirement: JobBoardExperienceFilter;
  }>({
    location: "",
    workModes: [] as JobBoardWorkMode[],
    minCtcInr: 0,
    employmentType: "any",
    tab: "for_you",
    searchKeywords: "",
    postedWithin: "week",
    jobRequirement: "any",
  });
  filterValuesRef.current = {
    location,
    workModes,
    minCtcInr,
    employmentType,
    tab,
    searchKeywords,
    postedWithin,
    jobRequirement,
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
    [],
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

      const t = filterValuesRef.current.tab;

      if (t === "for_you" || t === "search") {
        const appliedNow = appliedFiltersRef.current;
        const fk = appliedNow ? serializeExploreFilterKey(appliedNow) : "";
        if (
          appliedNow &&
          exploreMergedCatalogRef.current.length > 0 &&
          exploreFilterKeyRef.current === fk
        ) {
          const derived = deriveExploreJobsForTab(
            exploreMergedCatalogRef.current,
            t,
            appliedNow,
            engagements,
          );
          if (!cancelled) {
            setJobs(derived);
            setListMeta(exploreListMetaRef.current);
            setSelectedId((prev) => {
              if (prev && derived.some((j) => j.id === prev)) return prev;
              return derived[0]?.id ?? null;
            });
            setListLoading(false);
            setIsAppendingJobs(false);
          }
          return;
        }
      }

      setIsAppendingJobs(false);
      setListLoading(true);
      try {
        const f0 = filterValuesRef.current;
        const applied = appliedFiltersRef.current;
        const listOpts = {
          page: 1 as const,
          resultsWanted: JOB_LIST_PAGE_SIZE,
          ...(applied
            ? {
                searchTerm: applied.searchKeywords
                  ? applied.searchKeywords
                  : undefined,
                postedWithin: applied.postedWithin,
                ...(applied.jobRequirement !== "any"
                  ? { jobRequirements: applied.jobRequirement }
                  : {}),
              }
            : {
                searchTerm: f0.searchKeywords.trim() || undefined,
                postedWithin: f0.postedWithin,
                ...(f0.jobRequirement !== "any"
                  ? { jobRequirements: f0.jobRequirement }
                  : {}),
              }),
        };
        const apiTab = t === "for_you" || t === "search" ? "search" : t;
        const {
          jobs: list,
          preferences,
          listMeta: lm,
        } = await jobBoardApi.getMyJobs(apiTab, listOpts);
        if (cancelled) return;

        if (!initFiltersFromPrefs.current) {
          const loc = sanitizeJobBoardLocation(preferences.location || "");
          const wm = preferences.workModes?.length
            ? sortWorkModesList([...preferences.workModes])
            : [...ALL_WORK_MODES];
          const minC =
            typeof preferences.minCtcInr === "number"
              ? preferences.minCtcInr
              : 0;
          const emp = preferences.employmentType ?? "any";
          setLocation(loc);
          setWorkModes([...wm]);
          setMinCtcInr(minC);
          setEmploymentType(emp);
          initFiltersFromPrefs.current = true;
          appliedFiltersRef.current = buildAppliedSnapshot({
            location: loc,
            workModes: wm,
            minCtcInr: minC,
            employmentType: emp,
            searchKeywords: f0.searchKeywords,
            postedWithin: f0.postedWithin,
            jobRequirement: f0.jobRequirement,
          });
        }

        if (t === "for_you" || t === "search") {
          exploreMergedCatalogRef.current = list;
          exploreListMetaRef.current = lm ?? null;
          if (appliedFiltersRef.current) {
            exploreFilterKeyRef.current = serializeExploreFilterKey(
              appliedFiltersRef.current,
            );
          }
          const displayList = appliedFiltersRef.current
            ? deriveExploreJobsForTab(
                exploreMergedCatalogRef.current,
                t,
                appliedFiltersRef.current,
                engagements,
              )
            : list;
          setJobs(displayList);
          setListMeta(lm ?? null);
          setSelectedId((prev) => {
            if (prev && displayList.some((j) => j.id === prev)) return prev;
            return displayList[0]?.id ?? null;
          });
        } else {
          setJobs(list);
          setListMeta(lm ?? null);
          setSelectedId((prev) => {
            if (prev && list.some((j) => j.id === prev)) return prev;
            return list[0]?.id ?? null;
          });
        }
      } finally {
        if (!cancelled) {
          setListLoading(false);
          setIsAppendingJobs(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, tab, applyStateFromResponse, engagements]);

  const flushFilterSearch = useCallback(async () => {
    if (!user || !initFiltersFromPrefs.current) return;
    if (tab !== "for_you" && tab !== "search") return;
    const f = filterValuesRef.current;
    setIsAppendingJobs(false);
    setListLoading(true);
    try {
      await jobBoardApi.putMyPreferences({
        location: f.location,
        workModes: f.workModes,
        minCtcInr: f.minCtcInr,
        employmentType: f.employmentType,
      });
      appliedFiltersRef.current = buildAppliedSnapshot(f);
      const { jobs: list, listMeta: lm } = await jobBoardApi.getMyJobs(
        "search",
        {
          searchTerm: f.searchKeywords.trim() || undefined,
          postedWithin: f.postedWithin,
          ...(f.jobRequirement !== "any"
            ? { jobRequirements: f.jobRequirement }
            : {}),
          page: 1,
          resultsWanted: JOB_LIST_PAGE_SIZE,
        },
      );
      exploreMergedCatalogRef.current = list;
      exploreListMetaRef.current = lm ?? null;
      exploreFilterKeyRef.current = serializeExploreFilterKey(
        appliedFiltersRef.current,
      );
      const displayList = deriveExploreJobsForTab(
        exploreMergedCatalogRef.current,
        tab,
        appliedFiltersRef.current,
        engagements,
      );
      setJobs(displayList);
      setListMeta(lm ?? null);
      setSelectedId((prev) => {
        if (prev && displayList.some((j) => j.id === prev)) return prev;
        return displayList[0]?.id ?? null;
      });
    } finally {
      setListLoading(false);
      setIsAppendingJobs(false);
    }
  }, [user, tab, engagements]);

  const applyFiltersAndClose = useCallback(async () => {
    setFiltersDialogOpen(false);
    await flushFilterSearch();
  }, [flushFilterSearch]);

  const loadMoreJobs = useCallback(async () => {
    if (!user || !initFiltersFromPrefs.current || !listMeta?.hasMore) return;
    if (tab !== "for_you" && tab !== "search") return;
    const applied = appliedFiltersRef.current;
    if (!applied) return;
    const nextPage = listMeta.page + 1;
    setIsAppendingJobs(true);
    setListLoading(true);
    try {
      const { jobs: more, listMeta: lm } = await jobBoardApi.getMyJobs(
        "search",
        {
          searchTerm: applied.searchKeywords || undefined,
          postedWithin: applied.postedWithin,
          ...(applied.jobRequirement !== "any"
            ? { jobRequirements: applied.jobRequirement }
            : {}),
          page: nextPage,
          resultsWanted: JOB_LIST_PAGE_SIZE,
        },
      );
      exploreMergedCatalogRef.current = mergeExploreCatalogById(
        exploreMergedCatalogRef.current,
        more,
      );
      exploreListMetaRef.current = lm ?? null;
      const displayList = deriveExploreJobsForTab(
        exploreMergedCatalogRef.current,
        tab,
        applied,
        engagements,
      );
      setJobs(displayList);
      setListMeta(lm ?? null);
      setSelectedId((prev) => {
        if (prev && displayList.some((j) => j.id === prev)) return prev;
        return displayList[0]?.id ?? null;
      });
    } finally {
      setListLoading(false);
      setIsAppendingJobs(false);
    }
  }, [user, tab, listMeta, engagements]);

  const onEngage = async (
    jobId: string,
    action: "bookmark" | "dismiss" | "mark_applied",
    conflict?: boolean,
  ) => {
    setActionJobId(jobId);
    const jobCard = jobs.find((j) => j.id === jobId);
    try {
      const data = await jobBoardApi.postEngagement({
        jobId,
        action,
        conflictAcknowledged: conflict,
        jobSnapshot: jobCard ? jobListingSnapshot(jobCard) : undefined,
      });
      applyStateFromResponse(data);
      if (action === "bookmark") {
        return;
      }
      setIsAppendingJobs(false);
      setListLoading(true);
      try {
        if (tab !== "for_you" && tab !== "search") {
          const { jobs: list, listMeta: lm } = await jobBoardApi.getMyJobs(
            tab,
            {
              page: 1,
              resultsWanted: JOB_LIST_PAGE_SIZE,
            },
          );
          setJobs(list);
          setListMeta(lm ?? null);
          setSelectedId((prev) => {
            if (prev && list.some((j) => j.id === prev)) return prev;
            return list[0]?.id ?? null;
          });
        } else {
          const applied = appliedFiltersRef.current;
          if (!applied) return;
          const { jobs: list, listMeta: lm } = await jobBoardApi.getMyJobs(
            "search",
            {
              searchTerm: applied.searchKeywords || undefined,
              postedWithin: applied.postedWithin,
              ...(applied.jobRequirement !== "any"
                ? { jobRequirements: applied.jobRequirement }
                : {}),
              page: 1,
              resultsWanted: JOB_LIST_PAGE_SIZE,
            },
          );
          exploreMergedCatalogRef.current = list;
          exploreListMetaRef.current = lm ?? null;
          exploreFilterKeyRef.current = serializeExploreFilterKey(applied);
          const displayList = deriveExploreJobsForTab(
            exploreMergedCatalogRef.current,
            tab,
            applied,
            data.engagements,
          );
          setJobs(displayList);
          setListMeta(lm ?? null);
          setSelectedId((prev) => {
            if (prev && displayList.some((j) => j.id === prev)) return prev;
            return displayList[0]?.id ?? null;
          });
        }
      } finally {
        setListLoading(false);
        setIsAppendingJobs(false);
      }
    } finally {
      setActionJobId(null);
    }
  };

  const jobApplyHref = useMemo(() => {
    const u = selected?.applyUrl?.trim() ?? "";
    if (!u || u === "#") return null;
    if (!/^https?:\/\//i.test(u)) return null;
    return u;
  }, [selected?.applyUrl]);

  const notifyApplyFollowup = useCallback(() => {
    if (!eng?.appliedSelfReported) {
      setApplyConfirmOpen(true);
    }
  }, [eng?.appliedSelfReported]);

  const toggleWorkMode = (m: JobBoardWorkMode) => {
    setWorkModes((prev) => {
      const has = prev.includes(m);
      if (has) {
        const next = prev.filter((x) => x !== m);
        return next.length === 0 ? [m] : next;
      }
      return [...prev, m].sort(
        (a, b) => ALL_WORK_MODES.indexOf(a) - ALL_WORK_MODES.indexOf(b),
      );
    });
  };

  const workModeSummary =
    workModes.length === 0
      ? "Select modes"
      : workModes.map((m) => workModeLabel[m]).join(", ");

  /** Badge on filter icon: advanced (dialog-only) filters only. */
  const activeFilterCount = useMemo(() => {
    let n = 0;
    const allModes =
      workModes.length === ALL_WORK_MODES.length &&
      ALL_WORK_MODES.every((m) => workModes.includes(m));
    if (!allModes) n += 1;
    if (minCtcInr > 0) n += 1;
    if (employmentType !== "any") n += 1;
    return n;
  }, [workModes, minCtcInr, employmentType]);

  const resetFiltersToDefaults = useCallback(() => {
    setLocation("");
    setWorkModes([...ALL_WORK_MODES]);
    setMinCtcInr(0);
    setEmploymentType("any");
    setSearchKeywords("");
    setPostedWithin("week");
    setJobRequirement("any");
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
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
        <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 pb-4 pt-1 lg:space-y-5 lg:pt-0">
      <section
        className={cn(
          "relative min-w-0 overflow-hidden rounded-xl border border-[#7367F0]/15 bg-[#7367F0]/[0.04] px-4 py-4 shadow-sm sm:px-5 sm:py-4",
          "dark:border-[#7367F0]/25 dark:bg-[#7367F0]/[0.06]",
        )}
        aria-labelledby="job-board-heading"
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#7367F0]/10 blur-2xl"
          aria-hidden
        />
        <div className="relative min-w-0 space-y-1.5">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#7367F0]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#7367F0]">
            <Sparkles className="h-3 w-3" aria-hidden />
            Job matches
          </span>
          <h1
            id="job-board-heading"
            className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
          >
            Job board
          </h1>
          <p className="max-w-xl text-sm font-medium leading-snug text-slate-700 dark:text-slate-300">
            Your next big role is one search away—dial in what you want and go
            get it.
          </p>
        </div>
      </section>

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
                  ? "border-[#7367F0] text-[#7367F0]"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-foreground/90",
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                {t.showSparkle && (
                  <Sparkles
                    className="h-3.5 w-3.5 text-[#7367F0]"
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
        <>
          <div
            className={cn(
              "mb-0 rounded-xl border border-slate-200/90 bg-white px-2 py-2 shadow-sm dark:border-border dark:bg-card sm:px-3",
              instituteFilterBarClass,
            )}
          >
            <div className="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-2 overflow-visible sm:flex-nowrap">
              <div className="min-w-0 w-full flex-1 basis-[10rem] sm:w-auto sm:basis-0 sm:min-w-[6rem]">
                <Label htmlFor="jb-keywords-bar" className="sr-only">
                  Role, keywords, or company
                </Label>
                <Input
                  id="jb-keywords-bar"
                  className="h-9 w-full min-w-0 border-slate-200 bg-white text-sm dark:border-border"
                  placeholder="Role, keywords, or company (e.g. SDE 2 at Amazon)"
                  value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
                  autoComplete="off"
                  aria-label="Role, keywords, or company"
                />
              </div>
              <div className="w-full min-w-[11rem] shrink-0 sm:w-[15rem]">
                <Label htmlFor="jb-experience-bar" className="sr-only">
                  Experience level
                </Label>
                <Select
                  value={jobRequirement}
                  onValueChange={(v) =>
                    setJobRequirement(v as JobBoardExperienceFilter)
                  }
                >
                  <SelectTrigger
                    id="jb-experience-bar"
                    className="h-9 w-full border-slate-200 bg-white text-sm dark:border-border"
                  >
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(
                        experienceRequirementLabel,
                      ) as JobBoardExperienceFilter[]
                    ).map((key) => (
                      <SelectItem key={key} value={key}>
                        {experienceRequirementLabel[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative min-w-0 w-full flex-1 basis-[8rem] sm:w-auto sm:max-w-[200px] sm:basis-0">
                <span
                  className="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-base leading-none"
                  aria-hidden
                >
                  🇮🇳
                </span>
                <Input
                  className="h-9 w-full min-w-0 border-slate-200 bg-white pl-8 text-sm dark:border-border"
                  placeholder="City or region"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onBlur={() => setLocation((v) => sanitizeJobBoardLocation(v))}
                  aria-label="Location"
                />
              </div>
              <div className="w-full min-w-[8.5rem] shrink-0 sm:w-[10.5rem]">
                <Label htmlFor="jb-posted-bar" className="sr-only">
                  Posted date
                </Label>
                <Select
                  value={postedWithin}
                  onValueChange={(v) =>
                    setPostedWithin(v as JobBoardPostedWithin)
                  }
                >
                  <SelectTrigger
                    id="jb-posted-bar"
                    className="h-9 w-full border-slate-200 bg-white text-sm dark:border-border"
                  >
                    <SelectValue placeholder="Posted" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(postedWithinLabel) as JobBoardPostedWithin[]
                    ).map((key) => (
                      <SelectItem key={key} value={key}>
                        {postedWithinLabel[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-2 overflow-visible pl-1 pt-0.5">
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    "h-9 gap-1.5 px-3 sm:px-4",
                    institutePrimaryClass,
                  )}
                  onClick={() => void flushFilterSearch()}
                  disabled={listLoading}
                >
                  <Search className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="sm:hidden">Search jobs</span>
                  <span className="hidden sm:inline">Search</span>
                </Button>
                <span className="relative inline-flex shrink-0 overflow-visible pr-0.5 pt-0.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="relative h-9 w-9 shrink-0 overflow-visible border-slate-200 bg-white dark:border-border"
                    onClick={() => setFiltersDialogOpen(true)}
                    aria-label={`Filters${activeFilterCount ? `, ${activeFilterCount} active` : ""}`}
                    aria-expanded={filtersDialogOpen}
                  >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden />
                    {activeFilterCount > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 z-10 flex h-4 min-w-[1rem] items-center justify-center rounded-full border-2 border-white bg-[#7367F0] px-1 text-[10px] font-semibold leading-none text-white dark:border-card">
                        {activeFilterCount > 9 ? "9+" : activeFilterCount}
                      </span>
                    ) : null}
                  </Button>
                </span>
              </div>
            </div>
          </div>

          <Dialog open={filtersDialogOpen} onOpenChange={setFiltersDialogOpen}>
            <DialogContent
              className={cn(
                "flex max-h-[min(92dvh,720px)] w-[min(calc(100vw-1.5rem),28rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:left-[50%] sm:top-[50%] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%]",
                "max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-auto max-sm:max-h-[88dvh] max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:border-x-0 max-sm:border-b-0",
              )}
            >
              <DialogHeader className="space-y-1 border-b border-slate-100 px-4 pb-3 pt-4 text-left dark:border-border sm:px-5">
                <DialogTitle className="text-base sm:text-lg">
                  Advanced filters
                </DialogTitle>
                <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                  Work arrangement, salary floor, and employment type. These
                  apply when you tap Apply & search or the main Search button
                  (no automatic API calls while editing).
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-600">
                    Work arrangement
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    {workModeSummary}
                  </p>
                  <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-border dark:bg-muted/20">
                    {ALL_WORK_MODES.map((m) => (
                      <label
                        key={m}
                        className="flex cursor-pointer items-center gap-2.5 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-zinc-300 text-[#7367F0]"
                          checked={workModes.includes(m)}
                          onChange={() => toggleWorkMode(m)}
                        />
                        {workModeLabel[m]}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-600">
                    Minimum CTC (INR)
                  </Label>
                  <p className="text-sm font-medium tabular-nums">
                    {formatInrCompact(minCtcInr)}+
                  </p>
                  <Slider
                    variant="primary"
                    min={0}
                    max={MAX_CTC_INR}
                    step={CTC_STEP}
                    value={[minCtcInr]}
                    onValueChange={(v) => setMinCtcInr(v[0] ?? 0)}
                    className="pt-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="jb-employment"
                    className="text-xs text-slate-600"
                  >
                    Employment
                  </Label>
                  <Select
                    value={employmentType}
                    onValueChange={(v) =>
                      setEmploymentType(v as JobBoardEmploymentFilter)
                    }
                  >
                    <SelectTrigger
                      id="jb-employment"
                      className="h-9 border-slate-200 bg-white text-sm dark:border-border"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{employmentLabel.any}</SelectItem>
                      <SelectItem value="full_time">
                        {employmentLabel.full_time}
                      </SelectItem>
                      <SelectItem value="part_time">
                        {employmentLabel.part_time}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="flex-shrink-0 flex-col gap-2 border-t border-slate-100 bg-slate-50/90 px-4 py-3 dark:border-border dark:bg-muted/25 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-slate-600 sm:w-auto"
                  onClick={resetFiltersToDefaults}
                >
                  Reset all
                </Button>
                <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-initial"
                    onClick={() => setFiltersDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className={cn(
                      "flex-1 sm:flex-initial",
                      institutePrimaryClass,
                    )}
                    onClick={() => void applyFiltersAndClose()}
                    disabled={listLoading}
                  >
                    Apply & search
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      <div className="mb-2 flex items-center gap-1.5 text-sm text-slate-600">
        <Clock className="h-4 w-4 text-[#7367F0]" />
        {tab === "for_you" && <span>Top jobs for you</span>}
        {tab === "search" && <span>Search results</span>}
        {tab === "bookmarked" && <span>Your bookmarked roles</span>}
        {tab === "applied" && <span>Roles you applied to</span>}
        {tab === "not_interested" && (
          <span>Roles you are not interested in</span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Master list */}
        <div className="lg:col-span-5">
          <div
            className="max-h-[min(70vh,720px)] space-y-3 overflow-y-auto pr-1"
            role="list"
          >
            {listLoading && !isAppendingJobs && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-600">
                <Loader2 className="h-6 w-6 shrink-0 animate-spin text-[#7367F0]" />
                <span>Loading…</span>
              </div>
            )}
            {!listLoading && jobs.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-600">
                No jobs in this view. Try another tab or adjust filters.
              </p>
            )}
            {(isAppendingJobs || !listLoading) &&
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
                        ? "border-2 border-[#7367F0] shadow-md ring-1 ring-[#7367F0]/20 dark:border-[#7367F0]"
                        : "border border-slate-200/90 shadow-sm hover:border-[#7367F0]/30 hover:bg-muted/30 dark:border-border",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {job.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {job.company}
                        </p>
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
                              if (actionJobId !== job.id)
                                void onEngage(job.id, "bookmark");
                            }
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-border"
                          title="Bookmark"
                        >
                          <Bookmark
                            className={cn(
                              "h-4 w-4",
                              e?.bookmarked
                                ? "fill-[#7367F0] text-[#7367F0]"
                                : "text-slate-500",
                            )}
                          />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            if (actionJobId !== job.id)
                              void onEngage(job.id, "dismiss");
                          }}
                          onKeyDown={(ev) => {
                            if (ev.key === "Enter" || ev.key === " ") {
                              ev.stopPropagation();
                              if (actionJobId !== job.id)
                                void onEngage(job.id, "dismiss");
                            }
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-border"
                          title="Not interested"
                        >
                          <Ban
                            className={cn(
                              "h-4 w-4",
                              e?.dismissed ? "text-red-600" : "text-zinc-500",
                            )}
                          />
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {job.jobSite && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            jobBoardTagClassName,
                            "uppercase tracking-wide",
                          )}
                        >
                          {job.jobSite}
                        </Badge>
                      )}
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
            {(tab === "for_you" || tab === "search") &&
              listMeta?.hasMore &&
              !(listLoading && !isAppendingJobs) && (
                <div className="flex justify-center pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full max-w-xs border-slate-200 bg-white dark:border-border"
                    disabled={listLoading}
                    onClick={() => void loadMoreJobs()}
                  >
                    {listLoading && isAppendingJobs ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      "Load more jobs"
                    )}
                  </Button>
                </div>
              )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-7">
          {selected ? (
            <Card
              className={cn(
                "overflow-hidden dark:border-blue-500/25 dark:bg-card",
                institutePanelClass,
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
                    <p className="mt-0.5 truncate text-sm text-slate-700">
                      {selected.company}
                    </p>
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
                    <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-xs text-slate-800">
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
                            turningOn ? false : undefined,
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
                            ? "fill-[#7367F0] text-[#7367F0]"
                            : "text-slate-500",
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
                          eng?.dismissed ? "text-red-600" : "text-zinc-500",
                        )}
                      />
                    </Button>
                    {jobApplyHref ? (
                      <Button
                        asChild
                        className={cn(
                          "h-8 shrink-0 gap-1 px-2.5 text-xs sm:gap-1.5 sm:px-3 sm:text-sm",
                          institutePrimaryClass,
                        )}
                        title={
                          eng?.appliedSelfReported
                            ? "Open the job page in a new tab"
                            : "Open the apply link (employer site when available, otherwise the job board) in a new tab"
                        }
                      >
                        <a
                          href={jobApplyHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => notifyApplyFollowup()}
                        >
                          {eng?.appliedSelfReported
                            ? "Go to Job Page"
                            : "Apply now"}
                          <ChevronRight
                            className="h-3.5 w-3.5 text-white/90"
                            strokeWidth={2.5}
                          />
                        </a>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled
                        className={cn(
                          "h-8 shrink-0 gap-1 px-2.5 text-xs sm:gap-1.5 sm:px-3 sm:text-sm",
                          institutePrimaryClass,
                        )}
                        title="No apply link is available for this listing"
                      >
                        Apply now
                        <ChevronRight
                          className="h-3.5 w-3.5 text-white/90"
                          strokeWidth={2.5}
                        />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 rounded-xl border border-[#7367F0]/15 bg-[#7367F0]/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    Need a strong resume? Generate one tailored to this job in
                    minutes.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      asChild
                      size="sm"
                      className="border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50"
                    >
                      <Link href="/dashboard/resumes/new">
                        Generate a resume
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-5">
                {selected.fullDescription ? (
                  <>
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Job description
                      </h3>
                      <JSearchDescriptionBody text={selected.fullDescription} />
                    </div>
                    {selected.jsearchHighlightSections &&
                      selected.jsearchHighlightSections.length > 0 && (
                        <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-border">
                          {selected.jsearchHighlightSections.map((sec) => (
                            <div key={sec.heading}>
                              <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {sec.heading}
                              </h3>
                              <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                {sec.items.map((item, i) => (
                                  <li
                                    key={`${sec.heading}-${i}-${item.slice(0, 40)}`}
                                  >
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                  </>
                ) : (
                  <>
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
                        {selected.qualifications.map((q, i) => (
                          <li key={`q-${i}-${q.slice(0, 48)}`}>{q}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-slate-900">
                        Responsibilities
                      </h3>
                      <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                        {selected.responsibilities.map((r, i) => (
                          <li key={`r-${i}-${r.slice(0, 48)}`}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
                {selected.skills.length > 0 && (
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
                )}
                {selected.tools.length > 0 && (
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
                )}
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
