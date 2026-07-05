"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Eye, Loader2, SlidersHorizontal } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { InterviewTypeFilterBar } from "@/components/dashboard/InterviewTypeFilterBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { IxSessionRow } from "@/lib/api";
import { ixScoreApi } from "@/lib/api";
import { appFilterBar, appTableShell } from "@/lib/app-theme";
import type { DashboardSessionFilter } from "@/lib/dashboard-recent-sessions";
import { IX_CATEGORY_META } from "@/lib/ix-score-constants";
import { ixScoreColorClass } from "@/lib/ix-score-colors";
import { cn, formatDate } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { RecruiterSessionRowActions } from "@/components/recruiter/RecruiterSessionRowActions";
import { toast } from "sonner";

type CategoryFilter = DashboardSessionFilter;

const filterFieldClass = "flex min-w-0 flex-col gap-1.5";
const filterLabelClass = "text-xs font-medium text-muted-foreground";
const filterControlClass = "w-full min-w-0 bg-card";

const filterDialogShell =
  "flex max-h-[min(88dvh,640px)] w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden p-0 fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] rounded-xl border border-border bg-card shadow-header";

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

type SessionHistoryFilterFieldsProps = {
  idPrefix: string;
  category: CategoryFilter;
  onCategoryChange: (value: CategoryFilter) => void;
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  minScore: string;
  onMinScoreChange: (value: string) => void;
  maxScore: string;
  onMaxScoreChange: (value: string) => void;
  layout?: "grid" | "stack";
};

function SessionHistoryFilterFields({
  idPrefix,
  category,
  onCategoryChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  minScore,
  onMinScoreChange,
  maxScore,
  onMaxScoreChange,
  layout = "grid",
}: SessionHistoryFilterFieldsProps) {
  const fields = (
    <>
      <div
        className={cn(
          filterFieldClass,
          layout === "grid" && "col-span-2 sm:col-span-1",
        )}
      >
        <Label htmlFor={`${idPrefix}-type-filter`} className={filterLabelClass}>
          Interview
        </Label>
        <InterviewTypeFilterBar
          id={`${idPrefix}-type-filter`}
          value={category}
          onChange={onCategoryChange}
          showCounts={false}
          className={cn(filterControlClass, "h-10 w-full sm:h-10")}
        />
      </div>
      <div className={filterFieldClass}>
        <Label htmlFor={`${idPrefix}-from-date`} className={filterLabelClass}>
          From date
        </Label>
        <Input
          id={`${idPrefix}-from-date`}
          type="date"
          className={filterControlClass}
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
        />
      </div>
      <div className={filterFieldClass}>
        <Label htmlFor={`${idPrefix}-to-date`} className={filterLabelClass}>
          To date
        </Label>
        <Input
          id={`${idPrefix}-to-date`}
          type="date"
          className={filterControlClass}
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
        />
      </div>
      <div className={filterFieldClass}>
        <Label htmlFor={`${idPrefix}-min-score`} className={filterLabelClass}>
          Min score
        </Label>
        <Input
          id={`${idPrefix}-min-score`}
          type="number"
          min={0}
          max={100}
          placeholder="0"
          className={filterControlClass}
          value={minScore}
          onChange={(e) => onMinScoreChange(e.target.value)}
        />
      </div>
      <div className={filterFieldClass}>
        <Label htmlFor={`${idPrefix}-max-score`} className={filterLabelClass}>
          Max score
        </Label>
        <Input
          id={`${idPrefix}-max-score`}
          type="number"
          min={0}
          max={100}
          placeholder="100"
          className={filterControlClass}
          value={maxScore}
          onChange={(e) => onMaxScoreChange(e.target.value)}
        />
      </div>
    </>
  );

  if (layout === "stack") {
    return <div className="space-y-4">{fields}</div>;
  }

  return (
    <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5 xl:items-end">
      {fields}
    </div>
  );
}

export type IxSessionHistoryFetchParams = {
  category: CategoryFilter;
  from?: string;
  to?: string;
  minScore?: number;
  maxScore?: number;
  page: number;
  limit: number;
};

export type IxSessionHistoryTableProps = {
  title?: string;
  description?: string;
  idPrefix?: string;
  showReportLinks?: boolean;
  recruiterCandidateClerkId?: string;
  fetchSessions?: (
    params: IxSessionHistoryFetchParams,
  ) => Promise<{ rows: IxSessionRow[]; total: number }>;
};

export function IxSessionHistoryTable({
  title = "Session history",
  description = "All scored sessions included in your iX Report",
  idPrefix = "ix",
  showReportLinks = true,
  recruiterCandidateClerkId,
  fetchSessions,
}: IxSessionHistoryTableProps = {}) {
  const recruiterMode = Boolean(recruiterCandidateClerkId);
  const showActionsColumn = recruiterMode || showReportLinks;
  const [rows, setRows] = useState<IxSessionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState<CategoryFilter>("all");
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const [draftMinScore, setDraftMinScore] = useState("");
  const [draftMaxScore, setDraftMaxScore] = useState("");
  const limit = 10;

  const load = async () => {
    setLoading(true);
    try {
      const params: IxSessionHistoryFetchParams = {
        category,
        from: fromDate || undefined,
        to: toDate || undefined,
        minScore: minScore ? Number(minScore) : undefined,
        maxScore: maxScore ? Number(maxScore) : undefined,
        page,
        limit,
      };
      const data = fetchSessions
        ? await fetchSessions(params)
        : await ixScoreApi.listSessions(params);
      setRows(data.rows);
      setTotal(data.total);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to load sessions"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, fromDate, toDate, minScore, maxScore, page, fetchSessions]);

  const filterCount = [
    category !== "all",
    fromDate,
    toDate,
    minScore,
    maxScore,
  ].filter(Boolean).length;

  const hasFilters = filterCount > 0;

  const clearFilters = () => {
    setCategory("all");
    setFromDate("");
    setToDate("");
    setMinScore("");
    setMaxScore("");
    setDraftCategory("all");
    setDraftFromDate("");
    setDraftToDate("");
    setDraftMinScore("");
    setDraftMaxScore("");
    setPage(1);
    setFiltersOpen(false);
  };

  const openFiltersDialog = () => {
    setDraftCategory(category);
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    setDraftMinScore(minScore);
    setDraftMaxScore(maxScore);
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    setCategory(draftCategory);
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setMinScore(draftMinScore);
    setMaxScore(draftMaxScore);
    setPage(1);
    setFiltersOpen(false);
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit],
  );

  return (
    <div className={cn(appTableShell, "overflow-hidden")}>
      <div className="border-b border-border/60 bg-card px-4 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 xl:hidden">
            <ToolbarIconButton
              label={`Filters${filterCount ? `, ${filterCount} active` : ""}`}
              active={filterCount > 0}
              badge={filterCount || undefined}
              onClick={openFiltersDialog}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </ToolbarIconButton>
          </div>
        </div>
      </div>

      <div className={cn(appFilterBar, "mx-4 my-4 sm:mx-6 xl:hidden")}>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            Showing {rows.length} of {total}
          </span>
          {hasFilters && (
            <button
              type="button"
              className="shrink-0 font-medium text-[#7367F0] hover:underline"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className={cn(appFilterBar, "mx-4 my-4 hidden sm:mx-6 xl:block")}>
        <SessionHistoryFilterFields
          idPrefix={idPrefix}
          category={category}
          onCategoryChange={(next) => {
            setCategory(next);
            setPage(1);
          }}
          fromDate={fromDate}
          onFromDateChange={(next) => {
            setFromDate(next);
            setPage(1);
          }}
          toDate={toDate}
          onToDateChange={(next) => {
            setToDate(next);
            setPage(1);
          }}
          minScore={minScore}
          onMinScoreChange={(next) => {
            setMinScore(next);
            setPage(1);
          }}
          maxScore={maxScore}
          onMaxScoreChange={(next) => {
            setMaxScore(next);
            setPage(1);
          }}
        />
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {rows.length} of {total}
          </span>
          {hasFilters && (
            <button
              type="button"
              className="font-medium text-[#7367F0] hover:underline"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className={filterDialogShell}>
          <DialogHeader className="space-y-1 border-b border-border/60 px-4 pb-3 pt-4 text-center sm:px-5">
            <DialogTitle className="text-base sm:text-lg">
              Filter sessions
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Narrow by interview type, date range, and score. Tap Apply when
              ready.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
            <SessionHistoryFilterFields
              idPrefix={`${idPrefix}-mobile`}
              layout="stack"
              category={draftCategory}
              onCategoryChange={setDraftCategory}
              fromDate={draftFromDate}
              onFromDateChange={setDraftFromDate}
              toDate={draftToDate}
              onToDateChange={setDraftToDate}
              minScore={draftMinScore}
              onMinScoreChange={setDraftMinScore}
              maxScore={draftMaxScore}
              onMaxScoreChange={setDraftMaxScore}
            />
          </div>

          <DialogFooter className="flex-col-reverse items-stretch gap-2 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            {filterCount > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={clearFilters}
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
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
        </div>
      ) : rows.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No sessions match your filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-border/70">
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                  Session
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                  Interview type
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                  Score
                </th>
                {showActionsColumn ? (
                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                    {recruiterMode ? "Interview details" : "Report"}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.category}-${row.id}`}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {row.title}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {IX_CATEGORY_META[row.category].label}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {formatDate(row.completedAt)}
                  </td>
                  <td className="px-4 py-4">
                    {row.status === "processing" ? (
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 bg-amber-500/10 text-amber-700"
                      >
                        Processing
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                      >
                        Completed
                      </Badge>
                    )}
                  </td>
                  <td
                    className={`px-4 py-4 text-right text-sm font-semibold tabular-nums ${ixScoreColorClass(row.overallScore)}`}
                  >
                    {row.overallScore}/100
                  </td>
                  {showActionsColumn ? (
                    <td className="px-6 py-4 text-right">
                      {recruiterMode && recruiterCandidateClerkId ? (
                        <RecruiterSessionRowActions
                          candidateClerkId={recruiterCandidateClerkId}
                          row={row}
                        />
                      ) : row.status === "processing" ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        <Button asChild variant="ghost" size="sm">
                          <Link href={row.reportHref}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 border-t border-border/70 px-4 py-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
