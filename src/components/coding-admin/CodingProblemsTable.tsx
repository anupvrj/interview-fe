"use client";

import Link from "next/link";
import { Eye, Loader2, Pencil, Play, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppSelect } from "@/components/ui/app-select";
import { appTableShell } from "@/lib/app-theme";
import type { AdminCodingProblemListItem } from "@/lib/api";
import { cn } from "@/lib/utils";

export type CodingDifficultyFilter = "all" | "easy" | "medium" | "hard";
export type CodingActiveFilter = "all" | "active" | "inactive";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-500/12 text-emerald-700",
  medium: "bg-amber-500/12 text-amber-700",
  hard: "bg-rose-500/12 text-rose-700",
};

interface CodingProblemsTableProps {
  readonly items: AdminCodingProblemListItem[];
  readonly loading?: boolean;
  readonly search: string;
  readonly onSearchChange: (v: string) => void;
  readonly category: string;
  readonly onCategoryChange: (v: string) => void;
  readonly categories: string[];
  readonly difficulty: CodingDifficultyFilter;
  readonly onDifficultyChange: (v: CodingDifficultyFilter) => void;
  readonly activeFilter: CodingActiveFilter;
  readonly onActiveFilterChange: (v: CodingActiveFilter) => void;
  readonly onView: (problemId: string) => void;
  readonly onDelete: (item: AdminCodingProblemListItem) => void;
  readonly selectedIds: Set<string>;
  readonly onSelectedIdsChange: (ids: Set<string>) => void;
  readonly bulkDeleting?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
  readonly total?: number;
  readonly onPageChange?: (page: number) => void;
}

export function CodingProblemsBulkBar({
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
        "mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25",
        "bg-gradient-to-r from-primary/8 to-transparent px-4 py-3",
      )}
    >
      <p className="text-sm font-medium text-foreground">
        <span className="font-semibold text-primary">{count}</span> problem
        {count === 1 ? "" : "s"} selected for bulk delete
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={deleting} onClick={onClear}>
          Clear selection
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={deleting}
          onClick={onDelete}
        >
          {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Delete selected
        </Button>
      </div>
    </div>
  );
}

export function CodingProblemsTable({
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
  selectedIds,
  onSelectedIdsChange,
  bulkDeleting,
  page = 1,
  pageSize = 50,
  total = 0,
  onPageChange,
}: CodingProblemsTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const allPageSelected =
    items.length > 0 && items.every((item) => selectedIds.has(item.problemId));

  const toggleAllOnPage = () => {
    if (allPageSelected) {
      const next = new Set(selectedIds);
      for (const item of items) next.delete(item.problemId);
      onSelectedIdsChange(next);
    } else {
      const next = new Set(selectedIds);
      for (const item of items) next.add(item.problemId);
      onSelectedIdsChange(next);
    }
  };

  const toggleOne = (problemId: string) => {
    const next = new Set(selectedIds);
    if (next.has(problemId)) next.delete(problemId);
    else next.add(problemId);
    onSelectedIdsChange(next);
  };

  return (
    <div className={appTableShell}>
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <div className="flex h-11 min-w-[min(100%,280px)] flex-1 basis-[240px] overflow-hidden rounded-[0.625rem] border border-input bg-card shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Input
            className="h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent px-4 shadow-none focus-visible:border-transparent focus-visible:ring-0"
            placeholder="Search title or ID…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search coding problems"
          />
          <span className="flex w-11 shrink-0 items-center justify-center border-l border-input bg-muted/30 text-muted-foreground">
            <Search className="h-4 w-4" aria-hidden />
          </span>
        </div>
        <AppSelect
          className="h-11 w-full shrink-0 sm:w-[180px]"
          value={category || "all"}
          onChange={(v) => onCategoryChange(v === "all" ? "" : v)}
          options={[
            { value: "all", label: "All categories" },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
        />
        <AppSelect
          className="h-11 w-full shrink-0 sm:w-[160px]"
          value={difficulty}
          onChange={(v) =>
            onDifficultyChange(v as CodingDifficultyFilter)
          }
          options={[
            { value: "all", label: "All difficulties" },
            { value: "easy", label: "Easy" },
            { value: "medium", label: "Medium" },
            { value: "hard", label: "Hard" },
          ]}
        />
        <AppSelect
          className="h-11 w-full shrink-0 sm:w-[140px]"
          value={activeFilter}
          onChange={(v) => onActiveFilterChange(v as CodingActiveFilter)}
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
            { value: "all", label: "All" },
          ]}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="w-10 p-3 font-medium">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  disabled={loading || items.length === 0 || bulkDeleting}
                  onChange={toggleAllOnPage}
                  aria-label="Select all problems on this page"
                  className="h-4 w-4 accent-primary"
                />
              </th>
              <th className="p-3 font-medium">Problem</th>
              <th className="p-3 font-medium">Difficulty</th>
              <th className="p-3 font-medium">Tests</th>
              <th className="p-3 font-medium">Attempts</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No problems found
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.problemId} className="border-b">
                  <td className="w-10 p-3 align-top">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.problemId)}
                      disabled={bulkDeleting}
                      onChange={() => toggleOne(item.problemId)}
                      aria-label={`Select ${item.title}`}
                      className="mt-0.5 h-4 w-4 accent-primary"
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{item.title}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {item.problemId}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "font-normal",
                        DIFFICULTY_COLORS[item.difficulty],
                      )}
                    >
                      {item.difficulty}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    public: {item.publicTestCount} · hidden:{" "}
                    {item.hiddenTestCount}
                  </td>
                  <td className="p-3 text-xs">
                    {item.attemptCount}
                    {item.averageSubmitScore != null
                      ? ` · avg ${item.averageSubmitScore}`
                      : ""}
                  </td>
                  <td className="p-3">
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Try problem"
                        asChild
                      >
                        <Link
                          href={`/dashboard/super-admin/coding-problems/${encodeURIComponent(item.problemId)}/playground`}
                        >
                          <Play className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(item.problemId)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" asChild>
                        <Link
                          href={`/dashboard/super-admin/coding-problems/${encodeURIComponent(item.problemId)}/edit`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
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

      {total > 0 && onPageChange ? (
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {rangeStart}–{rangeEnd} of {total} problems
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
