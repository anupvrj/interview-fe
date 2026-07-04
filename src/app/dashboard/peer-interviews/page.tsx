"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  ArrowUpDown,
  CalendarCheck,
  Loader2,
  Search,
  SlidersHorizontal,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
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
import { InterviewerCard } from "@/components/peer/InterviewerCard";
import { appCard, appFilterBar } from "@/lib/app-theme";
import {
  peerApi,
  type PeerIndustry,
  type PeerInterviewType,
  type PeerInterviewerCard,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  peerAvailabilityWindowBounds,
  type PeerAvailabilityWindow,
} from "@/lib/peer-availability-window";
import { useActiveRole } from "@/components/roles/ActiveRoleProvider";

const PAGE_SIZE = 15;

type SortOption = "rating_desc" | "rating_asc" | "price_asc" | "price_desc";

function parseSort(option: SortOption): { sortBy: "rating" | "price"; sortOrder: "asc" | "desc" } {
  switch (option) {
    case "rating_asc":
      return { sortBy: "rating", sortOrder: "asc" };
    case "price_asc":
      return { sortBy: "price", sortOrder: "asc" };
    case "price_desc":
      return { sortBy: "price", sortOrder: "desc" };
    default:
      return { sortBy: "rating", sortOrder: "desc" };
  }
}

const dialogShell =
  "flex max-h-[min(92dvh,720px)] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-lg sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-auto max-sm:w-full max-sm:max-w-none max-sm:max-h-[88dvh] max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:border-x-0 max-sm:border-b-0";

/** Centered modal on all breakpoints (search form). */
const searchDialogShell =
  "flex w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden p-0 fixed left-[50%] top-[50%] max-h-[min(85dvh,32rem)] translate-x-[-50%] translate-y-[-50%] rounded-xl border border-border bg-card shadow-header";

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
          "h-10 w-10 border-border/60 bg-card",
          active && "border-[#7367F0]/40 bg-[#7367F0]/5 text-[#7367F0]",
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
  const { isLoaded, user } = useUser();
  const [types, setTypes] = useState<PeerInterviewType[]>([]);
  const [industries, setIndustries] = useState<PeerIndustry[]>([]);
  const [items, setItems] = useState<PeerInterviewerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Applied filters (drive API)
  const [searchName, setSearchName] = useState("");
  const [searchCompany, setSearchCompany] = useState("");
  const [appliedName, setAppliedName] = useState("");
  const [appliedCompany, setAppliedCompany] = useState("");
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
  const [draftSearchCompany, setDraftSearchCompany] = useState("");
  const [draftType, setDraftType] = useState("");
  const [draftMinExperience, setDraftMinExperience] = useState("");
  const [draftIndustry, setDraftIndustry] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [draftAvailability, setDraftAvailability] = useState<PeerAvailabilityWindow>("any");
  const [draftSort, setDraftSort] = useState<SortOption>("rating_desc");

  const hasActiveSearch = Boolean(appliedName || appliedCompany);

  const filterCount = useMemo(() => {
    let n = 0;
    if (type) n += 1;
    if (minExperience) n += 1;
    if (industry) n += 1;
    if (role) n += 1;
    if (availabilityWindow !== "any") n += 1;
    if (sort !== "rating_desc") n += 1;
    return n;
  }, [type, minExperience, industry, role, availabilityWindow, sort]);

  const hasActiveFilters = hasActiveSearch || filterCount > 0;

  const typeNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of types) m[t.key] = t.name;
    return m;
  }, [types]);

  const draftRoleOptions = useMemo(() => {
    if (draftIndustry) {
      return industries.find((item) => item.name === draftIndustry)?.roles ?? [];
    }
    const all = new Set<string>();
    for (const item of industries) {
      for (const r of item.roles) all.add(r);
    }
    return [...all].sort((a, b) => a.localeCompare(b));
  }, [industries, draftIndustry]);

  const roleOptions = useMemo(() => {
    if (industry) {
      return industries.find((item) => item.name === industry)?.roles ?? [];
    }
    const all = new Set<string>();
    for (const item of industries) {
      for (const r of item.roles) all.add(r);
    }
    return [...all].sort((a, b) => a.localeCompare(b));
  }, [industries, industry]);

  useEffect(() => {
    if (!roleCtx?.ready || roleCtx.activeRole !== "interviewer") return;
    router.replace("/dashboard/peer-interviews/interviewer");
  }, [roleCtx?.ready, roleCtx?.activeRole, router]);

  useEffect(() => {
    peerApi.listInterviewTypes().then(setTypes).catch(() => undefined);
    peerApi.listIndustries().then(setIndustries).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (role && !roleOptions.includes(role)) {
      setRole("");
    }
  }, [role, roleOptions]);

  useEffect(() => {
    if (!type && (sort === "price_asc" || sort === "price_desc")) {
      setSort("rating_desc");
    }
  }, [type, sort]);

  useEffect(() => {
    if (draftRole && !draftRoleOptions.includes(draftRole)) {
      setDraftRole("");
    }
  }, [draftRole, draftRoleOptions]);

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
          company: appliedCompany || undefined,
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
    [appliedName, appliedCompany, type, minExperience, industry, role, availabilityWindow, sort],
  );

  useEffect(() => {
    if (!isLoaded || !user) return;
    void fetchInterviewers(1);
  }, [isLoaded, user, fetchInterviewers]);

  const runSearch = () => {
    const name = searchName.trim();
    const company = searchCompany.trim();
    if (!name && !company) {
      toast.error("Enter an interviewer name or company to search");
      return;
    }
    setAppliedName(name);
    setAppliedCompany(company);
  };

  const clearSearchOnly = () => {
    setSearchName("");
    setSearchCompany("");
    setAppliedName("");
    setAppliedCompany("");
    setDraftSearchName("");
    setDraftSearchCompany("");
    setSearchOpen(false);
  };

  const openSearchDialog = () => {
    setDraftSearchName(appliedName);
    setDraftSearchCompany(appliedCompany);
    setSearchOpen(true);
  };

  const openFiltersDialog = () => {
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
    const company = draftSearchCompany.trim();
    if (!name && !company) {
      toast.error("Enter an interviewer name or company to search");
      return;
    }
    setAppliedName(name);
    setAppliedCompany(company);
    setSearchName(name);
    setSearchCompany(company);
    setSearchOpen(false);
  };

  const clearSearch = () => {
    clearSearchOnly();
  };

  const applyFilters = () => {
    if (
      (draftSort === "price_asc" || draftSort === "price_desc") &&
      !draftType
    ) {
      toast.error("Select an interview type to sort by price");
      return;
    }
    setType(draftType);
    setMinExperience(draftMinExperience);
    setIndustry(draftIndustry);
    setRole(draftRole);
    setAvailabilityWindow(draftAvailability);
    setSort(draftSort);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setSearchName("");
    setSearchCompany("");
    setType("");
    setMinExperience("");
    setIndustry("");
    setRole("");
    setAvailabilityWindow("any");
    setSort("rating_desc");
    setAppliedName("");
    setAppliedCompany("");
    setDraftType("");
    setDraftMinExperience("");
    setDraftIndustry("");
    setDraftRole("");
    setDraftAvailability("any");
    setDraftSort("rating_desc");
    setDraftSearchName("");
    setDraftSearchCompany("");
    setFiltersOpen(false);
    setSearchOpen(false);
  };

  const onIndustryChange = (value: string) => {
    setIndustry(value);
    if (value && role && !industries.find((item) => item.name === value)?.roles.includes(role)) {
      setRole("");
    }
  };

  const onDraftIndustryChange = (value: string) => {
    setDraftIndustry(value);
    if (
      value &&
      draftRole &&
      !industries.find((item) => item.name === value)?.roles.includes(draftRole)
    ) {
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
    if (appliedCompany) {
      chips.push({
        key: "company",
        label: `Company: ${appliedCompany}`,
        onRemove: () => {
          setAppliedCompany("");
          setDraftSearchCompany("");
          setSearchCompany("");
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
      const sortLabels: Record<SortOption, string> = {
        rating_desc: "Rating ↓",
        rating_asc: "Rating ↑",
        price_asc: "Price ↑",
        price_desc: "Price ↓",
      };
      chips.push({
        key: "sort",
        label: sortLabels[sort],
        onRemove: () => setSort("rating_desc"),
      });
    }
    return chips;
  }, [
    appliedName,
    appliedCompany,
    type,
    role,
    minExperience,
    industry,
    availabilityWindow,
    sort,
    typeNames,
  ]);

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden space-y-4 sm:space-y-6">
      {roleCtx?.ready && roleCtx.activeRole === "interviewer" ? (
        <div className="flex h-48 items-center justify-center sm:h-64">
          <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
        </div>
      ) : (
        <>
      <PageHeader
        title="Peer Interviews"
        badge="Mock interviews with real engineers"
        description="Book a live mock interview with verified engineers from top companies."
        className="min-w-0"
        actions={
          <Button asChild variant="outline" className="h-9 shrink-0 px-2.5 text-xs sm:h-10 sm:px-4 sm:text-sm">
            <Link href="/dashboard/peer-interviews/bookings">
              <CalendarCheck className="mr-1.5 h-4 w-4 shrink-0 sm:mr-2" />
              My bookings
            </Link>
          </Button>
        }
      />

      <div className={cn(appFilterBar, "min-w-0 overflow-hidden p-3 sm:p-4")}>
        <div className="hidden space-y-4 lg:block">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-1.5">
                <Label htmlFor="peer-desktop-search-name" className="text-xs font-medium text-muted-foreground">
                  Interviewer name <span className="font-normal text-muted-foreground/80">(optional)</span>
                </Label>
                <Input
                  id="peer-desktop-search-name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch();
                  }}
                  placeholder="Search by name"
                  className="h-11 bg-card"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                <Label htmlFor="peer-desktop-search-company" className="text-xs font-medium text-muted-foreground">
                  Company
                </Label>
                <Input
                  id="peer-desktop-search-company"
                  value={searchCompany}
                  onChange={(e) => setSearchCompany(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch();
                  }}
                  placeholder="e.g. Google"
                  className="h-11 bg-card"
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                onClick={runSearch}
                className="h-11 bg-[#7367F0] text-white hover:bg-[#6e62e5]"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              {(searchName.trim() || searchCompany.trim() || hasActiveSearch) && (
                <Button type="button" variant="ghost" onClick={clearSearchOnly} className="h-11">
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 xl:grid-cols-5">
              <div className="col-span-2 flex min-w-0 flex-col gap-1.5 xl:col-span-1">
                <Label htmlFor="peer-filter-availability" className="text-xs font-medium text-muted-foreground">
                  Open slots
                </Label>
                <AppSelect
                  id="peer-filter-availability"
                  value={availabilityWindow}
                  onChange={(v) => setAvailabilityWindow(v as PeerAvailabilityWindow)}
                  options={[
                    { value: "any", label: "Any time" },
                    { value: "today", label: "Today" },
                    { value: "week", label: "This week" },
                    { value: "month", label: "This month" },
                  ]}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                <Label htmlFor="peer-filter-type" className="text-xs font-medium text-muted-foreground">
                  Interview type
                </Label>
                <AppSelect
                  id="peer-filter-type"
                  value={type}
                  onChange={setType}
                  allowEmpty
                  emptyLabel="All rounds"
                  options={types.map((t) => ({ value: t.key, label: t.name }))}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                <Label htmlFor="peer-filter-role" className="text-xs font-medium text-muted-foreground">
                  Role
                </Label>
                <AppSelect
                  id="peer-filter-role"
                  value={role}
                  onChange={setRole}
                  allowEmpty
                  emptyLabel="All roles"
                  options={roleOptions.map((item) => ({ value: item, label: item }))}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                <Label htmlFor="peer-filter-experience" className="text-xs font-medium text-muted-foreground">
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
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                <Label htmlFor="peer-filter-industry" className="text-xs font-medium text-muted-foreground">
                  Industry
                </Label>
                <AppSelect
                  id="peer-filter-industry"
                  value={industry}
                  onChange={onIndustryChange}
                  allowEmpty
                  emptyLabel="All industries"
                  options={industries.map((item) => ({ value: item.name, label: item.name }))}
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5 xl:w-52">
              <Label htmlFor="peer-filter-sort" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sort by
              </Label>
              <AppSelect
                id="peer-filter-sort"
                value={sort}
                onChange={(v) => setSort(v as SortOption)}
                options={[
                  { value: "rating_desc", label: "Rating: highest first" },
                  { value: "rating_asc", label: "Rating: lowest first" },
                  {
                    value: "price_asc",
                    label: `Price: low to high${!type ? " (select type)" : ""}`,
                    disabled: !type,
                  },
                  {
                    value: "price_desc",
                    label: `Price: high to low${!type ? " (select type)" : ""}`,
                    disabled: !type,
                  },
                ]}
              />
            </div>
          </div>

          {hasActiveFilters ? (
            <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
              {type && (sort === "price_asc" || sort === "price_desc") ? (
                <p className="text-xs text-muted-foreground">
                  Sorting by price for{" "}
                  <span className="font-medium text-foreground">{typeNames[type] || type}</span>
                </p>
              ) : (
                <span />
              )}
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="h-9 shrink-0">
                Clear all filters
              </Button>
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
              label={`Filters${filterCount ? `, ${filterCount} active` : ""}`}
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
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#7367F0]/25 bg-[#7367F0]/8 px-2.5 py-1 text-xs font-medium text-[#7367F0] transition-colors hover:bg-[#7367F0]/15"
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
              Search by name, company, or both. Leave name blank to list everyone from a company.
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
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="peer-search-company"
                className="text-xs font-medium text-muted-foreground"
              >
                Company
              </Label>
              <Input
                id="peer-search-company"
                value={draftSearchCompany}
                onChange={(e) => setDraftSearchCompany(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applySearch();
                }}
                placeholder="e.g. Google"
                className="h-11 w-full bg-card"
              />
            </div>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 border-t border-border/60 px-4 py-4 sm:flex-row sm:justify-end sm:px-5">
            {(draftSearchName.trim() || draftSearchCompany.trim() || hasActiveSearch) && (
              <Button type="button" variant="ghost" onClick={clearSearch} className="w-full sm:w-auto">
                Clear search
              </Button>
            )}
            <Button
              type="button"
              onClick={applySearch}
              className="w-full bg-[#7367F0] text-white hover:bg-[#6e62e5] sm:w-auto"
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
            <DialogTitle className="text-base sm:text-lg">Filter & sort</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Narrow by availability, round type, experience, and more. Tap Apply when ready.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
            <div className="space-y-1.5">
              <Label htmlFor="peer-mobile-filter-availability">Open slots</Label>
              <AppSelect
                id="peer-mobile-filter-availability"
                value={draftAvailability}
                onChange={(v) => setDraftAvailability(v as PeerAvailabilityWindow)}
                options={[
                  { value: "any", label: "Any time" },
                  { value: "today", label: "Today" },
                  { value: "week", label: "This week" },
                  { value: "month", label: "This month" },
                ]}
              />
            </div>

            <div className="space-y-1.5">
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

            <div className="space-y-1.5">
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

            <div className="space-y-1.5">
              <Label htmlFor="peer-mobile-filter-role">Role</Label>
              <AppSelect
                id="peer-mobile-filter-role"
                value={draftRole}
                onChange={setDraftRole}
                allowEmpty
                emptyLabel="All roles"
                options={draftRoleOptions.map((item) => ({ value: item, label: item }))}
              />
            </div>

            <div className="space-y-1.5">
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
                options={[
                  { value: "rating_desc", label: "Rating: highest first" },
                  { value: "rating_asc", label: "Rating: lowest first" },
                  {
                    value: "price_asc",
                    label: `Price: low to high${!draftType ? " (select interview type)" : ""}`,
                    disabled: !draftType,
                  },
                  {
                    value: "price_desc",
                    label: `Price: high to low${!draftType ? " (select interview type)" : ""}`,
                    disabled: !draftType,
                  },
                ]}
              />
              {draftType && (draftSort === "price_asc" || draftSort === "price_desc") ? (
                <p className="text-xs text-muted-foreground">
                  Sorting by price for{" "}
                  <span className="font-medium text-foreground">
                    {typeNames[draftType] || draftType}
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
                  setDraftType("");
                  setDraftMinExperience("");
                  setDraftIndustry("");
                  setDraftRole("");
                  setDraftAvailability("any");
                  setDraftSort("rating_desc");
                  setType("");
                  setMinExperience("");
                  setIndustry("");
                  setRole("");
                  setAvailabilityWindow("any");
                  setSort("rating_desc");
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
              className="w-full bg-[#7367F0] text-white hover:bg-[#6e62e5] sm:w-auto"
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
        <div className={cn(appCard, "flex flex-col items-center gap-3 px-4 py-12 text-center sm:px-6 sm:py-16")}>
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-muted text-primary sm:h-16 sm:w-16">
            <UsersRound className="h-7 w-7 sm:h-8 sm:w-8" />
          </span>
          <p className="text-base font-semibold sm:text-lg">No interviewers match your filters</p>
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
          <p className="px-0.5 text-sm text-muted-foreground">
            {total} interviewer{total === 1 ? "" : "s"}
            {availabilityWindow !== "any"
              ? ` with open slots ${
                  availabilityWindow === "today"
                    ? "today"
                    : availabilityWindow === "week"
                      ? "this week"
                      : "this month"
                }`
              : " available"}
          </p>
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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
                className="w-full sm:w-auto"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => void fetchInterviewers(page + 1)}
                className="w-full sm:w-auto"
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
