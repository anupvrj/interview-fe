"use client";

import Link from "next/link";
import { Eye, Loader2, Pencil, Search, Trash2, X } from "lucide-react";
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
  readonly page?: number;
  readonly pageSize?: number;
  readonly total?: number;
  readonly onPageChange?: (page: number) => void;
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
  page = 1,
  pageSize = 50,
  total = 0,
  onPageChange,
}: CodingProblemsTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className={appTableShell}>
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 pl-9"
            placeholder="Search title or ID…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <AppSelect
          value={category || "all"}
          onChange={(v) => onCategoryChange(v === "all" ? "" : v)}
          options={[
            { value: "all", label: "All categories" },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
        />
        <AppSelect
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
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No problems found
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.problemId} className="border-b">
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
