"use client";

import Link from "next/link";
import { Eye, Loader2, Pencil, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppSelect } from "@/components/ui/app-select";
import { StarRatingDisplay } from "@/components/system-design-admin/StarRatingInput";
import { appTableShell } from "@/lib/app-theme";
import type { AdminSystemDesignProblemListItem } from "@/lib/api";
import { cn } from "@/lib/utils";

export type SystemDesignDifficultyFilter = "all" | "easy" | "medium" | "hard";
export type SystemDesignActiveFilter = "all" | "active" | "inactive";

const FILTER_CONTROL =
  "h-10 w-full min-w-0 bg-card text-sm shadow-none sm:w-auto sm:min-w-[9.5rem]";

const DIFFICULTY_TABS: { value: SystemDesignDifficultyFilter; label: string }[] =
  [
    { value: "all", label: "All" },
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-500/12 text-emerald-700",
  medium: "bg-amber-500/12 text-amber-700",
  hard: "bg-rose-500/12 text-rose-700",
};

function CompanyChips({ companies }: { readonly companies: string[] }) {
  const visible = companies.slice(0, 3);
  const extra = companies.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((c) => (
        <Badge key={c} variant="outline" className="font-normal text-xs">
          {c}
        </Badge>
      ))}
      {extra > 0 ? (
        <Badge variant="secondary" className="font-normal text-xs">
          +{extra}
        </Badge>
      ) : null}
      {companies.length === 0 ? (
        <span className="text-muted-foreground text-sm">—</span>
      ) : null}
    </div>
  );
}

interface SystemDesignProblemsTableProps {
  readonly items: AdminSystemDesignProblemListItem[];
  readonly loading?: boolean;
  readonly search: string;
  readonly onSearchChange: (v: string) => void;
  readonly category: string;
  readonly onCategoryChange: (v: string) => void;
  readonly categories: string[];
  readonly difficulty: SystemDesignDifficultyFilter;
  readonly onDifficultyChange: (v: SystemDesignDifficultyFilter) => void;
  readonly activeFilter: SystemDesignActiveFilter;
  readonly onActiveFilterChange: (v: SystemDesignActiveFilter) => void;
  readonly onView: (problemId: string) => void;
  readonly onDelete: (item: AdminSystemDesignProblemListItem) => void;
}

export function SystemDesignProblemsTable({
  items,
  loading,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  difficulty,
  onDifficultyChange,
  activeFilter,
  onActiveFilterChange,
  onView,
  onDelete,
}: SystemDesignProblemsTableProps) {
  const categoryOptions = Array.isArray(categories) ? categories : [];
  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(category) ||
    activeFilter !== "active" ||
    difficulty !== "all";

  const clearFilters = () => {
    onSearchChange("");
    onCategoryChange("");
    onActiveFilterChange("active");
    onDifficultyChange("all");
  };

  return (
    <div className={cn(appTableShell, "overflow-hidden")}>
      <div className="border-b border-border/70 bg-muted/10 px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1 xl:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              placeholder="Search title or problem ID…"
              aria-label="Search problems"
              className="h-10 bg-card pl-9 pr-9 shadow-none"
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {search ? (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => onSearchChange("")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:shrink-0 xl:items-center xl:gap-2">
            <AppSelect
              value={category || "all"}
              onChange={(v) => onCategoryChange(v === "all" ? "" : v)}
              options={[
                { value: "all", label: "All categories" },
                ...categoryOptions.map((c) => ({ value: c, label: c })),
              ]}
              className={FILTER_CONTROL}
            />
            <AppSelect
              value={activeFilter}
              onChange={(v) =>
                onActiveFilterChange(v as SystemDesignActiveFilter)
              }
              options={[
                { value: "all", label: "All statuses" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              className={FILTER_CONTROL}
            />
          </div>

          <div className="flex min-w-0 items-center gap-2 xl:ml-auto xl:shrink-0">
            <span className="hidden shrink-0 text-xs font-medium text-muted-foreground sm:inline">
              Difficulty
            </span>
            <div className="inline-flex min-w-0 max-w-full overflow-x-auto rounded-lg border border-border/80 bg-card p-0.5 shadow-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {DIFFICULTY_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={cn(
                    "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                    difficulty === tab.value
                      ? "bg-[#7367F0] text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  onClick={() => onDifficultyChange(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Showing {items.length} problem{items.length === 1 ? "" : "s"}
          </span>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="font-medium text-[#7367F0] hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border/70">
              {[
                "Title",
                "Category",
                "Difficulty",
                "Companies",
                "Attempts",
                "Rating",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                  Loading problems…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                  No problems match your filters.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.problemId}
                  className={cn(
                    "border-b border-border/50 transition-colors hover:bg-muted/30",
                    !item.isActive && "opacity-60",
                  )}
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-foreground">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.shortTitle}</div>
                    <div className="font-mono text-[10px] text-muted-foreground/80">
                      {item.problemId}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="secondary">{item.category}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={DIFFICULTY_COLORS[item.difficulty] ?? ""}>
                      {item.difficulty}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 max-w-[180px]">
                    <CompanyChips companies={item.askedAt ?? []} />
                  </td>
                  <td className="px-5 py-3 tabular-nums">{item.attemptCount}</td>
                  <td className="px-5 py-3">
                    <StarRatingDisplay value={item.adminRating} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="View"
                        onClick={() => onView(item.problemId)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" asChild>
                        <Link
                          href={`/dashboard/super-admin/system-design-problems/${item.problemId}/edit`}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
