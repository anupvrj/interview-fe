"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  ArrowUpDown,
  CalendarCheck,
  Loader2,
  Search,
  SlidersHorizontal,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { dash2026Scope, Eyebrow } from "@/components/dashboard-2026/ui";
import { ConciergeNotice } from "@/components/dashboard-2026/ConciergeNotice";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { JobRoleSelect, shouldClearRoleOnIndustryChange } from "@/components/career/JobRoleSelect";
import { InterviewerCard } from "@/components/peer/InterviewerCard";
import { toPeerIndustryList } from "@/lib/career-catalog";
import {
  peerApi,
  type PeerInterviewType,
  type PeerInterviewerCard,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  peerAvailabilityWindowBounds,
  type PeerAvailabilityWindow,
} from "@/lib/peer-availability-window";
import { useActiveRole } from "@/components/roles/ActiveRoleProvider";
import { useEntitlements } from "@/hooks/useEntitlements";

const PAGE_SIZE = 15;

type SortOption =
  | "rating_desc"
  | "rating_asc"
  | "price_asc"
  | "price_desc"
  | "experience_desc"
  | "experience_asc";

function parseSort(option: SortOption): {
  sortBy: "rating" | "price" | "experience";
  sortOrder: "asc" | "desc";
} {
  switch (option) {
    case "rating_asc":
      return { sortBy: "rating", sortOrder: "asc" };
    case "price_asc":
      return { sortBy: "price", sortOrder: "asc" };
    case "price_desc":
      return { sortBy: "price", sortOrder: "desc" };
    case "experience_asc":
      return { sortBy: "experience", sortOrder: "asc" };
    case "experience_desc":
      return { sortBy: "experience", sortOrder: "desc" };
    default:
      return { sortBy: "rating", sortOrder: "desc" };
  }
}

const SORT_LABELS: Record<SortOption, string> = {
  rating_desc: "Rating ↓",
  rating_asc: "Rating ↑",
  price_asc: "Price ↑",
  price_desc: "Price ↓",
  experience_desc: "Experience ↓",
  experience_asc: "Experience ↑",
};

function sortSelectOptions(typeKey: string) {
  return [
    { value: "rating_desc", label: "Rating: highest first" },
    { value: "rating_asc", label: "Rating: lowest first" },
    { value: "experience_desc", label: "Experience: most years first" },
    { value: "experience_asc", label: "Experience: fewest years first" },
    {
      value: "price_asc",
      label: `Price: low to high${!typeKey ? " (select type)" : ""}`,
      disabled: !typeKey,
    },
    {
      value: "price_desc",
      label: `Price: high to low${!typeKey ? " (select type)" : ""}`,
      disabled: !typeKey,
    },
  ];
}

const AVAILABILITY_OPTIONS = [
  { value: "any", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
] as const;

const dialogShell =
  "flex max-h-[min(92dvh,720px)] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-lg sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-auto max-sm:w-full max-sm:max-w-none max-sm:max-h-[88dvh] max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:border-x-0 max-sm:border-b-0";

/** Centered modal on all breakpoints (search form). */
const searchDialogShell =
  "flex w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden p-0 fixed left-[50%] top-[50%] max-h-[min(85dvh,32rem)] translate-x-[-50%] translate-y-[-50%] rounded-[22px] border border-border bg-card shadow-header";

function ToolbarIconButton({
  label,
  active,
  badge,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  badge?: number | boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <span className="relative inline-flex shrink-0">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onClick}
        aria-label={label}
        className={cn(
          "h-11 w-11 rounded-xl border-border bg-background",
          active && "border-primary/40 bg-primary/5 text-primary",
        )}
      >
        {children}
      </Button>
      {badge ? (
        typeof badge === "number" ? (
          <span className="absolute -right-0.5 -top-0.5 z-10 flex h-4 min-w-[1rem] items-center justify-center rounded-full border-2 border-card bg-[#7367F0] px-1 text-[10px] font-semibold leading-none text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : (
          <span className="absolute -right-0.5 -top-0.5 z-10 h-2.5 w-2.5 rounded-full border-2 border-card bg-[#7367F0]" />
        )
      ) : null}
    </span>
  );
}

export default function PeerInterviewsDirectoryPage() {
  const router = useRouter();
  const roleCtx = useActiveRole();
  const { data: entitlements } = useEntitlements();
  const { isLoaded, user } = useUser();
  const [types, setTypes] = useState<PeerInterviewType[]>([]);
  const industries = useMemo(() => toPeerIndustryList(), []);
  const [items, setItems] = useState<PeerInterviewerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Applied filters (drive API)
  const [searchName, setSearchName] = useState("");
  const [appliedName, setAppliedName] = useState("");
  const [company, setCompany] = useState("");
  const [type, setType] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [industry, setIndustry] = useState("");
  const [role, setRole] = useState("");
  const [availabilityWindow, setAvailabilityWindow] = useState<PeerAvailabilityWindow>("any");
  const [sort, setSort] = useState<SortOption>("rating_desc");

  // Dialog drafts
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftSearchName, setDraftSearchName] = useState("");
  const [draftCompany, setDraftCompany] = useState("");
  const [draftType, setDraftType] = useState("");
  const [draftMinExperience, setDraftMinExperience] = useState("");
  const [draftIndustry, setDraftIndustry] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [draftAvailability, setDraftAvailability] = useState<PeerAvailabilityWindow>("any");
  const [draftSort, setDraftSort] = useState<SortOption>("rating_desc");

  const hasActiveSearch = Boolean(appliedName);

  const extraFilterCount = useMemo(() => {
    let n = 0;
    if (company) n += 1;
    if (availabilityWindow !== "any") n += 1;
    if (sort !== "rating_desc") n += 1;
    return n;
  }, [company, availabilityWindow, sort]);

  const filterCount = useMemo(() => {
    let n = extraFilterCount;
    if (type) n += 1;
    if (minExperience) n += 1;
    if (industry) n += 1;
    if (role) n += 1;
    return n;
  }, [extraFilterCount, type, minExperience, industry, role]);

  const hasActiveFilters = hasActiveSearch || filterCount > 0;

  const typeNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of types) m[t.key] = t.name;
    return m;
  }, [types]);

  useEffect(() => {
    if (!type && (sort === "price_asc" || sort === "price_desc")) {
      setSort("rating_desc");
    }
  }, [type, sort]);

  useEffect(() => {
    if (!roleCtx?.ready || roleCtx.activeRole !== "interviewer") return;
    router.replace("/dashboard/peer-interviews/interviewer");
  }, [roleCtx?.ready, roleCtx?.activeRole, router]);

  useEffect(() => {
    peerApi.listInterviewTypes().then(setTypes).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!draftType && (draftSort === "price_asc" || draftSort === "price_desc")) {
      setDraftSort("rating_desc");
    }
  }, [draftType, draftSort]);

  const fetchInterviewers = useCallback(
    async (targetPage: number) => {
      const { sortBy, sortOrder } = parseSort(sort);
      if (sortBy === "price" && !type) {
        toast.error("Select an interview type to sort by price");
        return;
      }

      setLoading(true);
      try {
        const slotWindow = peerAvailabilityWindowBounds(availabilityWindow);
        const res = await peerApi.listInterviewers({
          name: appliedName || undefined,
          company: company || undefined,
          type: type || undefined,
          minExperience: minExperience || undefined,
          industry: industry || undefined,
          role: role || undefined,
          sortBy,
          sortOrder,
          ...slotWindow,
          page: targetPage,
          pageSize: PAGE_SIZE,
        });
        setItems(res.items);
        setTotalPages(res.totalPages || 1);
        setTotal(res.total);
        setPage(res.page);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Could not load interviewers");
      } finally {
        setLoading(false);
      }
    },
    [appliedName, company, type, minExperience, industry, role, availabilityWindow, sort],
  );

  useEffect(() => {
    if (!isLoaded || !user) return;
    void fetchInterviewers(1);
  }, [isLoaded, user, fetchInterviewers]);

  const runSearch = () => {
    setAppliedName(searchName.trim());
  };

  const clearSearchOnly = () => {
    setSearchName("");
    setAppliedName("");
    setDraftSearchName("");
    setSearchOpen(false);
  };

  const openSearchDialog = () => {
    setDraftSearchName(appliedName);
    setSearchOpen(true);
  };

  const openFiltersDialog = () => {
    setDraftCompany(company);
    setDraftType(type);
    setDraftMinExperience(minExperience);
    setDraftIndustry(industry);
    setDraftRole(role);
    setDraftAvailability(availabilityWindow);
    setDraftSort(sort);
    setFiltersOpen(true);
  };

  const applySearch = () => {
    const name = draftSearchName.trim();
    setAppliedName(name);
    setSearchName(name);
    setSearchOpen(false);
  };

  const clearSearch = () => {
    clearSearchOnly();
  };

  const applyFilters = () => {
    const priceType = draftType || type;
    if (
      (draftSort === "price_asc" || draftSort === "price_desc") &&
      !priceType
    ) {
      toast.error("Select an interview type to sort by price");
      return;
    }

    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches;

    setCompany(draftCompany.trim());
    setAvailabilityWindow(draftAvailability);
    setSort(draftSort);

    if (!isDesktop) {
      setType(draftType);
      setMinExperience(draftMinExperience);
      setIndustry(draftIndustry);
      setRole(draftRole);
    }

    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setSearchName("");
    setCompany("");
    setType("");
    setMinExperience("");
    setIndustry("");
    setRole("");
    setAvailabilityWindow("any");
    setSort("rating_desc");
    setAppliedName("");
    setDraftCompany("");
    setDraftType("");
    setDraftMinExperience("");
    setDraftIndustry("");
    setDraftRole("");
    setDraftAvailability("any");
    setDraftSort("rating_desc");
    setDraftSearchName("");
    setFiltersOpen(false);
    setSearchOpen(false);
  };

  const onIndustryChange = (value: string) => {
    setIndustry(value);
    if (shouldClearRoleOnIndustryChange(role, value)) {
      setRole("");
    }
  };

  const onDraftIndustryChange = (value: string) => {
    setDraftIndustry(value);
    if (shouldClearRoleOnIndustryChange(draftRole, value)) {
      setDraftRole("");
    }
  };

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (appliedName) {
      chips.push({
        key: "name",
        label: `Name: ${appliedName}`,
        onRemove: () => {
          setAppliedName("");
          setDraftSearchName("");
          setSearchName("");
        },
      });
    }
    if (company) {
      chips.push({
        key: "company",
        label: `Company: ${company}`,
        onRemove: () => {
          setCompany("");
          setDraftCompany("");
        },
      });
    }
    if (type) {
      chips.push({
        key: "type",
        label: typeNames[type] || type,
        onRemove: () => setType(""),
      });
    }
    if (role) {
      chips.push({ key: "role", label: role, onRemove: () => setRole("") });
    }
    if (minExperience) {
      chips.push({
        key: "exp",
        label: `${minExperience}+ yrs`,
        onRemove: () => setMinExperience(""),
      });
    }
    if (industry) {
      chips.push({ key: "industry", label: industry, onRemove: () => setIndustry("") });
    }
    if (availabilityWindow !== "any") {
      const labels: Record<PeerAvailabilityWindow, string> = {
        any: "Any time",
        today: "Today",
        week: "This week",
        month: "This month",
      };
      chips.push({
        key: "availability",
        label: labels[availabilityWindow],
        onRemove: () => setAvailabilityWindow("any"),
      });
    }
    if (sort !== "rating_desc") {
      chips.push({
        key: "sort",
        label: SORT_LABELS[sort],
        onRemove: () => setSort("rating_desc"),
      });
    }
    return chips;
  }, [
    appliedName,
    company,
    type,
    role,
    minExperience,
    industry,
    availabilityWindow,
    sort,
    typeNames,
  ]);

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl min-w-0 space-y-5 overflow-x-hidden lg:space-y-6")}>
      {roleCtx?.ready && roleCtx.activeRole === "interviewer" ? (
        <div className="flex h-48 items-center justify-center sm:h-64">
          <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
        </div>
      ) : (
        <>
      <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_70%_at_8%_0%,rgba(115,103,240,.13),transparent_70%),radial-gradient(40%_70%_at_95%_20%,rgba(31,143,255,.09),transparent_70%)]" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard/peer-interviews" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Peer interviews
            </Link>
            {entitlements?.plan === "tech_pro" && entitlements.peerInterviewsRemaining > 0 ? (
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[10.5px] text-emerald-700 dark:text-emerald-300">
                {entitlements.peerInterviewsRemaining} FREE LEFT THIS PERIOD
              </span>
            ) : null}
          </div>
          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <Eyebrow>BOOK A PEER INTERVIEW</Eyebrow>
              <h1 className="text-balance mt-4 text-[30px] font-black leading-[1.04] tracking-[-0.045em] text-foreground md:text-[40px]">
                Find the interviewer you&apos;d want across the table.
              </h1>
              <p className="text-balance mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground md:text-[16px]">
                Filter verified engineers by round, role and open slots, then pick a time. You only pay once they accept.
              </p>
            </div>
            <Button asChild variant="outline" className="h-11 shrink-0 rounded-xl px-4 text-[14px]">
              <Link href="/dashboard/peer-interviews/bookings">
                <CalendarCheck className="h-4 w-4" />
                My bookings
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <ConciergeNotice kind="peer" />

      <div className="min-w-0 overflow-hidden rounded-[18px] border border-border bg-card p-4 sm:p-5">
        <div className="hidden min-w-0 lg:block">
          <div className="flex min-w-0 items-end gap-3 overflow-x-auto pb-0.5 scroll-smooth [scrollbar-width:thin]">
            <div className="flex min-w-[12rem] flex-1 flex-col gap-1.5">
              <Label htmlFor="peer-desktop-search-name" className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                Interviewer name <span className="font-normal text-muted-foreground/80">(optional)</span>
              </Label>
              <div className="relative min-w-[12rem]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="peer-desktop-search-name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch();
                  }}
                  placeholder="Search by name"
                  className="h-11 w-full rounded-xl bg-background !pl-10 pr-4"
                />
              </div>
            </div>

            <div className="flex w-[11rem] shrink-0 flex-col gap-1.5">
              <Label htmlFor="peer-filter-type" className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                Interview type
              </Label>
              <AppSelect
                id="peer-filter-type"
                value={type}
                onChange={setType}
                allowEmpty
                emptyLabel="All rounds"
                options={types.map((t) => ({ value: t.key, label: t.name }))}
                className="h-11"
              />
            </div>

            <div className="flex min-w-[10rem] shrink-0 flex-col gap-1.5">
              <Label htmlFor="peer-filter-role" className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                Role
              </Label>
              <JobRoleSelect
                id="peer-filter-role"
                value={role}
                onChange={setRole}
                industry={industry || undefined}
                placeholder="All roles"
                inputClassName="h-11 rounded-xl bg-background"
              />
            </div>

            <div className="flex w-[9rem] shrink-0 flex-col gap-1.5">
              <Label htmlFor="peer-filter-experience" className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                Total Exp.
              </Label>
              <AppSelect
                id="peer-filter-experience"
                value={minExperience}
                onChange={setMinExperience}
                allowEmpty
                emptyLabel="Any"
                options={[
                  { value: "2", label: "2+ yrs" },
                  { value: "5", label: "5+ yrs" },
                  { value: "8", label: "8+ yrs" },
                  { value: "12", label: "12+ yrs" },
                ]}
                className="h-11"
              />
            </div>

            <div className="flex w-[11rem] shrink-0 flex-col gap-1.5">
              <Label htmlFor="peer-filter-industry" className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                Industry
              </Label>
              <AppSelect
                id="peer-filter-industry"
                value={industry}
                onChange={onIndustryChange}
                allowEmpty
                emptyLabel="All industries"
                options={industries.map((item) => ({ value: item.name, label: item.name }))}
                className="h-11"
              />
            </div>

            <div className="flex shrink-0 items-center gap-2 pb-0.5">
              <Button
                type="button"
                onClick={runSearch}
                className="h-11 rounded-xl px-5 font-semibold shadow-[0_10px_24px_-12px_rgba(115,103,240,.8)] hover:bg-primary/90"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <ToolbarIconButton
                label={`More filters${extraFilterCount ? `, ${extraFilterCount} active` : ""}`}
                active={extraFilterCount > 0}
                badge={extraFilterCount || undefined}
                onClick={openFiltersDialog}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </ToolbarIconButton>
              {hasActiveFilters ? (
                <Button type="button" variant="ghost" onClick={clearFilters} className="h-11">
                  Clear
                </Button>
              ) : null}
            </div>
          </div>

          {hasActiveFilters ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onRemove}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[12.5px] font-medium text-primary transition-colors hover:bg-primary/15"
                >
                  <span className="max-w-[12rem] truncate">{chip.label}</span>
                  <X className="h-3 w-3 shrink-0 opacity-70" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-3 lg:hidden">
          <div className="flex min-w-0 items-center justify-end gap-2">
            <ToolbarIconButton
              label={`Search${hasActiveSearch ? " (active)" : ""}`}
              active={hasActiveSearch}
              badge={hasActiveSearch}
              onClick={openSearchDialog}
            >
              <Search className="h-4 w-4" />
            </ToolbarIconButton>
            <ToolbarIconButton
              label={`More filters${filterCount ? `, ${filterCount} active` : ""}`}
              active={filterCount > 0}
              badge={filterCount || undefined}
              onClick={openFiltersDialog}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </ToolbarIconButton>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 shrink-0 px-2 text-xs text-muted-foreground"
              >
                Clear all
              </Button>
            ) : null}
          </div>

          {activeChips.length > 0 ? (
            <div className="flex min-w-0 gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onRemove}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[12.5px] font-medium text-primary transition-colors hover:bg-primary/15"
                >
                  <span className="max-w-[8rem] truncate sm:max-w-[10rem]">{chip.label}</span>
                  <X className="h-3 w-3 shrink-0 opacity-70" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Search dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className={searchDialogShell}>
          <DialogHeader className="space-y-1.5 border-b border-border/60 px-4 pb-4 pt-5 text-left sm:px-5">
            <DialogTitle className="text-base font-semibold sm:text-lg">Search interviewers</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
              Search by interviewer name. Use More filters for company, open slots, and sort options.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="peer-search-name"
                className="text-xs font-medium text-muted-foreground"
              >
                Interviewer name <span className="font-normal">(optional)</span>
              </Label>
              <Input
                id="peer-search-name"
                value={draftSearchName}
                onChange={(e) => setDraftSearchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applySearch();
                }}
                placeholder="Search by name"
                className="h-11 w-full bg-card"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 border-t border-border/60 px-4 py-4 sm:flex-row sm:justify-end sm:px-5">
            {(draftSearchName.trim() || hasActiveSearch) && (
              <Button type="button" variant="ghost" onClick={clearSearch} className="w-full sm:w-auto">
                Clear search
              </Button>
            )}
            <Button
              type="button"
              onClick={applySearch}
              className="w-full rounded-xl font-semibold hover:bg-primary/90 sm:w-auto"
            >
              <Search className="mr-2 h-4 w-4" />
              Apply search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters dialog */}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className={dialogShell}>
          <DialogHeader className="space-y-1 border-b border-border/60 px-4 pb-3 pt-4 text-left sm:px-5">
            <DialogTitle className="text-base sm:text-lg">More filters</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Filter by company, open slots, and sort order. On mobile, round type, role, and experience are here too.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
            <div className="space-y-1.5">
              <Label htmlFor="peer-filter-company">Company</Label>
              <Input
                id="peer-filter-company"
                value={draftCompany}
                onChange={(e) => setDraftCompany(e.target.value)}
                placeholder="e.g. Google, Amazon"
                className="h-11 w-full bg-card"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="peer-mobile-filter-availability">Open slots</Label>
              <AppSelect
                id="peer-mobile-filter-availability"
                value={draftAvailability}
                onChange={(v) => setDraftAvailability(v as PeerAvailabilityWindow)}
                options={[...AVAILABILITY_OPTIONS]}
              />
            </div>

            <div className="space-y-1.5 lg:hidden">
              <Label htmlFor="peer-mobile-filter-type">Interview type</Label>
              <AppSelect
                id="peer-mobile-filter-type"
                value={draftType}
                onChange={setDraftType}
                allowEmpty
                emptyLabel="All rounds"
                options={types.map((t) => ({ value: t.key, label: t.name }))}
              />
            </div>

            <div className="space-y-1.5 lg:hidden">
              <Label htmlFor="peer-mobile-filter-industry">Industry</Label>
              <AppSelect
                id="peer-mobile-filter-industry"
                value={draftIndustry}
                onChange={onDraftIndustryChange}
                allowEmpty
                emptyLabel="All industries"
                options={industries.map((item) => ({ value: item.name, label: item.name }))}
              />
            </div>

            <div className="space-y-1.5 lg:hidden">
              <Label htmlFor="peer-mobile-filter-role">Role</Label>
              <JobRoleSelect
                id="peer-mobile-filter-role"
                value={draftRole}
                onChange={setDraftRole}
                industry={draftIndustry || undefined}
                placeholder="All roles"
                inputClassName="h-11 rounded-xl bg-background"
              />
            </div>

            <div className="space-y-1.5 lg:hidden">
              <Label htmlFor="peer-mobile-filter-experience">Total experience</Label>
              <AppSelect
                id="peer-mobile-filter-experience"
                value={draftMinExperience}
                onChange={setDraftMinExperience}
                allowEmpty
                emptyLabel="Any"
                options={[
                  { value: "2", label: "2+ yrs" },
                  { value: "5", label: "5+ yrs" },
                  { value: "8", label: "8+ yrs" },
                  { value: "12", label: "12+ yrs" },
                ]}
              />
            </div>

            <div className="space-y-1.5 border-t border-border/60 pt-4">
              <Label htmlFor="peer-mobile-filter-sort" className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sort by
              </Label>
              <AppSelect
                id="peer-mobile-filter-sort"
                value={draftSort}
                onChange={(v) => setDraftSort(v as SortOption)}
                options={sortSelectOptions(draftType || type)}
              />
              {(draftType || type) &&
              (draftSort === "price_asc" || draftSort === "price_desc") ? (
                <p className="text-xs text-muted-foreground">
                  Sorting by price for{" "}
                  <span className="font-medium text-foreground">
                    {typeNames[draftType || type] || draftType || type}
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 border-t border-border/60 px-4 py-3 sm:flex-row sm:justify-between sm:px-5">
            {filterCount > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  const isDesktop =
                    typeof window !== "undefined" &&
                    window.matchMedia("(min-width: 1024px)").matches;
                  if (isDesktop) {
                    setDraftCompany("");
                    setDraftAvailability("any");
                    setDraftSort("rating_desc");
                    setCompany("");
                    setAvailabilityWindow("any");
                    setSort("rating_desc");
                  } else {
                    setDraftCompany("");
                    setDraftType("");
                    setDraftMinExperience("");
                    setDraftIndustry("");
                    setDraftRole("");
                    setDraftAvailability("any");
                    setDraftSort("rating_desc");
                    setCompany("");
                    setType("");
                    setMinExperience("");
                    setIndustry("");
                    setRole("");
                    setAvailabilityWindow("any");
                    setSort("rating_desc");
                  }
                  setFiltersOpen(false);
                }}
                className="w-full sm:w-auto"
              >
                Reset filters
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}
            <Button
              type="button"
              onClick={applyFilters}
              className="w-full rounded-xl font-semibold hover:bg-primary/90 sm:w-auto"
            >
              Apply filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex h-48 items-center justify-center sm:h-64">
          <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[22px] border border-border bg-card px-4 py-14 text-center sm:px-6">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/15 bg-gradient-to-br from-[#F1EEFF] to-[#E3EEFF] text-primary dark:from-primary/20 dark:to-sky-500/10 sm:h-16 sm:w-16">
            <UsersRound className="h-7 w-7 sm:h-8 sm:w-8" />
          </span>
          <p className="text-[18px] font-bold tracking-tight">No interviewers match those filters.</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {availabilityWindow !== "any"
              ? "No interviewers have open slots in that period. Try a wider window or different filters."
              : "Try widening your filters. New interviewers are onboarding regularly."}
          </p>
          {hasActiveFilters ? (
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
              Clear all filters
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <p className="flex items-center gap-3 px-0.5 font-[family-name:var(--font-geist-mono)] text-[12px] tracking-wider text-primary">
            — {total} INTERVIEWER{total === 1 ? "" : "S"}
            {availabilityWindow !== "any"
              ? ` with open slots ${
                  availabilityWindow === "today"
                    ? "today"
                    : availabilityWindow === "week"
                      ? "this week"
                      : "this month"
                }`.toUpperCase()
              : " AVAILABLE"} —
            <span className="h-px w-20 border-t-2 border-dotted border-primary/40" />
          </p>
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((i) => (
              <InterviewerCard key={i.id} interviewer={i} typeNames={typeNames} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex flex-col items-center justify-center gap-2 pt-2 sm:flex-row sm:gap-3">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => void fetchInterviewers(page - 1)}
                className="h-10 w-full rounded-xl sm:w-auto"
              >
                Previous
              </Button>
              <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-muted-foreground">
                PAGE {page} OF {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => void fetchInterviewers(page + 1)}
                className="h-10 w-full rounded-xl sm:w-auto"
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </>
      )}
    </div>
  );
}
