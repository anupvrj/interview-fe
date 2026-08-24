"use client";

import Link from "next/link";
import { Eye, Loader2, Pencil, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppSelect } from "@/components/ui/app-select";
import { appTableShell } from "@/lib/app-theme";
import type { AdminBlogListItem, BlogStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

export type BlogStatusFilter = "all" | BlogStatus;
export type BlogActiveFilter = "all" | "active" | "inactive";

const STATUS_COLORS: Record<BlogStatus, string> = {
  draft: "bg-slate-500/12 text-slate-700",
  published: "bg-emerald-500/12 text-emerald-700",
  archived: "bg-amber-500/12 text-amber-700",
};

interface BlogsTableProps {
  readonly items: AdminBlogListItem[];
  readonly loading?: boolean;
  readonly search: string;
  readonly onSearchChange: (v: string) => void;
  readonly category: string;
  readonly onCategoryChange: (v: string) => void;
  readonly categories: string[];
  readonly statusFilter: BlogStatusFilter;
  readonly onStatusFilterChange: (v: BlogStatusFilter) => void;
  readonly activeFilter: BlogActiveFilter;
  readonly onActiveFilterChange: (v: BlogActiveFilter) => void;
  readonly onView: (id: string) => void;
  readonly onDelete: (item: AdminBlogListItem) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly total?: number;
  readonly onPageChange?: (page: number) => void;
}

export function BlogsTable({
  items,
  loading,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  statusFilter,
  onStatusFilterChange,
  activeFilter,
  onActiveFilterChange,
  onView,
  onDelete,
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
}: BlogsTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className={appTableShell}>
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <div className="flex h-11 min-w-[min(100%,280px)] flex-1 basis-[240px] overflow-hidden rounded-[0.625rem] border border-input bg-card shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Input
            className="h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent px-4 shadow-none focus-visible:border-transparent focus-visible:ring-0"
            placeholder="Search title or slug…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search blog posts"
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
          value={statusFilter}
          onChange={(v) => onStatusFilterChange(v as BlogStatusFilter)}
          options={[
            { value: "all", label: "All statuses" },
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
            { value: "archived", label: "Archived" },
          ]}
        />
        <AppSelect
          className="h-11 w-full shrink-0 sm:w-[140px]"
          value={activeFilter}
          onChange={(v) => onActiveFilterChange(v as BlogActiveFilter)}
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Deleted" },
            { value: "all", label: "All" },
          ]}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="p-3 font-medium">Post</th>
              <th className="p-3 font-medium">Categories</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Published</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No blog posts found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b hover:bg-muted/20">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {item.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbnailUrl}
                          alt=""
                          className="h-10 w-16 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-16 shrink-0 rounded bg-muted" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.title || "Untitled draft"}</p>
                        <p className="truncate text-xs text-muted-foreground">/{item.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {item.categories.slice(0, 2).map((c) => (
                        <Badge key={c} variant="secondary" className="text-xs">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge className={cn("text-xs capitalize", STATUS_COLORS[item.status])}>
                      {item.status}
                    </Badge>
                    {!item.isActive ? (
                      <Badge variant="outline" className="ml-1 text-xs text-rose-600">
                        deleted
                      </Badge>
                    ) : null}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {item.publishedAt
                      ? new Date(item.publishedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(item.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/dashboard/super-admin/blogs/${encodeURIComponent(item.id)}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      {item.isActive ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-600"
                          onClick={() => onDelete(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {onPageChange && total > pageSize ? (
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
          <span>
            {rangeStart}–{rangeEnd} of {total}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
