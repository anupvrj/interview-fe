"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { CalendarCheck, Loader2, Search, SlidersHorizontal, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
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

export default function PeerInterviewsDirectoryPage() {
  const { isLoaded, user } = useUser();
  const [types, setTypes] = useState<PeerInterviewType[]>([]);
  const [industries, setIndustries] = useState<PeerIndustry[]>([]);
  const [items, setItems] = useState<PeerInterviewerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // filters
  const [searchName, setSearchName] = useState("");
  const [searchCompany, setSearchCompany] = useState("");
  const [appliedName, setAppliedName] = useState("");
  const [appliedCompany, setAppliedCompany] = useState("");
  const [type, setType] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [industry, setIndustry] = useState("");
  const [role, setRole] = useState("");
  const [sort, setSort] = useState<SortOption>("rating_desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const hasActiveSearch = Boolean(appliedName || appliedCompany);

  const hasActiveFilters = Boolean(
    appliedName ||
      appliedCompany ||
      searchName.trim() ||
      searchCompany.trim() ||
      type ||
      minExperience ||
      industry.trim() ||
      role.trim() ||
      sort !== "rating_desc",
  );

  const typeNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of types) m[t.key] = t.name;
    return m;
  }, [types]);

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

  const fetchInterviewers = useCallback(
    async (targetPage: number) => {
      const { sortBy, sortOrder } = parseSort(sort);
      if (sortBy === "price" && !type) {
        toast.error("Select an interview type to sort by price");
        return;
      }

      setLoading(true);
      try {
        const res = await peerApi.listInterviewers({
          name: appliedName || undefined,
          company: appliedCompany || undefined,
          type: type || undefined,
          minExperience: minExperience || undefined,
          industry: industry || undefined,
          role: role || undefined,
          sortBy,
          sortOrder,
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
    [appliedName, appliedCompany, type, minExperience, industry, role, sort],
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

  const clearSearch = () => {
    setSearchName("");
    setSearchCompany("");
    setAppliedName("");
    setAppliedCompany("");
  };

  const toggleSearch = () => setSearchOpen((open) => !open);

  const clearFilters = () => {
    setSearchName("");
    setSearchCompany("");
    setAppliedName("");
    setAppliedCompany("");
    setType("");
    setMinExperience("");
    setIndustry("");
    setRole("");
    setSort("rating_desc");
  };

  const onIndustryChange = (value: string) => {
    setIndustry(value);
    if (value && role && !industries.find((item) => item.name === value)?.roles.includes(role)) {
      setRole("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Peer Interviews"
        badge="Mock interviews with real engineers"
        description="Book a live mock interview with verified engineers from top companies. Filter by round, experience, industry and role."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={toggleSearch}
              aria-expanded={searchOpen}
              className={cn(
                "relative",
                searchOpen && "border-[#7367F0]/40 bg-[#7367F0]/5 text-[#7367F0]",
              )}
            >
              <Search className="mr-2 h-4 w-4" />
              Search Interviewer
              {hasActiveSearch ? (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#7367F0]" />
              ) : null}
            </Button>
            <Link href="/dashboard/peer-interviews/bookings">
              <Button variant="outline">
                <CalendarCheck className="mr-2 h-4 w-4" /> My bookings
              </Button>
            </Link>
          </div>
        }
      />

      {searchOpen ? (
        <div className={cn(appFilterBar, "space-y-3")}>
          <p className="text-sm text-muted-foreground">
            Search by name, company, or both. Leave name blank to see all interviewers from a company.
          </p>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-1.5">
                <Label htmlFor="peer-search-name" className="block text-xs font-medium text-muted-foreground">
                  Interviewer name <span className="font-normal text-muted-foreground/80">(optional)</span>
                </Label>
                <Input
                  id="peer-search-name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch();
                  }}
                  placeholder="Search by name"
                  className="h-11 bg-card"
                  autoFocus
                />
              </div>

              <div className="flex min-w-0 flex-col gap-1.5">
                <Label htmlFor="peer-search-company" className="block text-xs font-medium text-muted-foreground">
                  Company
                </Label>
                <Input
                  id="peer-search-company"
                  value={searchCompany}
                  onChange={(e) => setSearchCompany(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch();
                  }}
                  placeholder="e.g. Google — all interviewers from that company"
                  className="h-11 bg-card"
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-end">
              <Button
                type="button"
                onClick={runSearch}
                className="h-11 bg-[#7367F0] text-white hover:bg-[#6e62e5]"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              {searchName.trim() || searchCompany.trim() || hasActiveSearch ? (
                <Button type="button" variant="ghost" onClick={clearSearch} className="h-11">
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className={cn(appFilterBar, "space-y-4")}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="peer-filter-type" className="block text-xs font-medium text-muted-foreground">
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
              <Label htmlFor="peer-filter-role" className="block text-xs font-medium text-muted-foreground">
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
              <Label htmlFor="peer-filter-experience" className="block text-xs font-medium text-muted-foreground">
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
              <Label htmlFor="peer-filter-industry" className="block text-xs font-medium text-muted-foreground">
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

          <div className="flex shrink-0 items-center gap-2 self-end">
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-label={filtersOpen ? "Hide sort options" : "Show sort options"}
              aria-expanded={filtersOpen}
              className={cn(
                "relative h-11 w-11",
                filtersOpen && "border-[#7367F0]/40 bg-[#7367F0]/5 text-[#7367F0]",
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {sort !== "rating_desc" ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#7367F0]" />
              ) : null}
            </Button>
          </div>
        </div>

        {filtersOpen ? (
          <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex min-w-0 w-full flex-col gap-1.5 sm:max-w-xs">
              <Label htmlFor="peer-filter-sort" className="block text-xs font-medium text-muted-foreground">
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
                    label: `Price: low to high${!type ? " (select interview type)" : ""}`,
                    disabled: !type,
                  },
                  {
                    value: "price_desc",
                    label: `Price: high to low${!type ? " (select interview type)" : ""}`,
                    disabled: !type,
                  },
                ]}
              />
            </div>
            {type && (sort === "price_asc" || sort === "price_desc") ? (
              <p className="pb-3 text-xs text-muted-foreground sm:pb-0">
                Sorting by price for{" "}
                <span className="font-medium text-foreground">{typeNames[type] || type}</span>
              </p>
            ) : null}
            {hasActiveFilters ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="h-11 px-3">
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
        </div>
      ) : items.length === 0 ? (
        <div className={cn(appCard, "flex flex-col items-center gap-3 px-6 py-16 text-center")}>
          <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-muted text-primary">
            <UsersRound className="h-8 w-8" />
          </span>
          <p className="text-lg font-semibold">No interviewers match your filters</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Try widening your filters. New interviewers are onboarding regularly.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{total} interviewer{total === 1 ? "" : "s"} available</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((i) => (
              <InterviewerCard key={i.id} interviewer={i} typeNames={typeNames} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => void fetchInterviewers(page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => void fetchInterviewers(page + 1)}>
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
