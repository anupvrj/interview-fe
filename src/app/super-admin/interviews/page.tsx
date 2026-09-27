"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { SuperAdminPeriodFilter } from "@/components/super-admin/SuperAdminPeriodFilter";
import { SuperAdminScheduledInterviewsCard } from "@/components/super-admin/SuperAdminScheduledInterviewsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/lib/api";
import { formatDate, getScoreColor } from "@/lib/utils";
import { useInsightFilters } from "@/hooks/useInsightFilters";
import {
  INTERVIEW_TYPE_LABEL,
  type InsightInterviewRow,
} from "@/lib/super-admin-insights";

export default function SuperAdminInterviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <InterviewsPageBody />
    </Suspense>
  );
}

function InterviewsPageBody() {
  const { period, type, from, to, setFilters } = useInsightFilters();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;
  const [rows, setRows] = useState<InsightInterviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(0);
  }, [period, type, from, to, search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi
      .listInsightInterviews({
        limit,
        skip: page * limit,
        search: search || undefined,
        type: type === "all" ? undefined : type,
        period: period === "all" ? undefined : period,
        from: period === "custom" ? from || undefined : undefined,
        to: period === "custom" ? to || undefined : undefined,
      })
      .then((result) => {
        if (cancelled) return;
        setRows(result.data);
        setTotal(result.total);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setRows([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, search, period, type, from, to]);

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <SuperAdminPageHeader />

      <SuperAdminScheduledInterviewsCard />

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="space-y-3 border-b border-border/60 px-4 py-4 sm:px-5">
          <CardTitle className="text-base sm:text-lg">Interview reports</CardTitle>
          <SuperAdminPeriodFilter
            period={period}
            from={from}
            to={to}
            type={type}
            showType
            className="w-full border-0 bg-transparent p-0 shadow-none"
            onPeriodChange={(next) => setFilters({ period: next })}
            onTypeChange={(next) => setFilters({ type: next })}
            onRangeChange={(nextFrom, nextTo) =>
              setFilters({ period: "custom", from: nextFrom, to: nextTo })
            }
            leading={
              <label className="flex h-11 w-full min-w-0 items-center gap-2 rounded-[0.625rem] border border-input bg-card px-3 shadow-sm transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <Search
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  aria-label="Search interviews"
                  placeholder="Search name, email, or id"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
                />
              </label>
            }
          />
        </CardHeader>
        <CardContent className="px-0 py-0">
          {loading ? (
            <div className="flex justify-center px-4 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground sm:px-5">
              No completed interviews in this range.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow className="h-auto border-b border-border/70 bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-[1%] min-w-[10rem] max-w-[18rem] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae] sm:px-5">
                      Interview
                    </TableHead>
                    <TableHead className="w-[12rem] max-w-[12rem] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae] sm:px-5">
                      ID
                    </TableHead>
                    <TableHead className="w-[14rem] max-w-[14rem] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae] sm:px-5">
                      User
                    </TableHead>
                    <TableHead className="w-[1%] whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae] sm:px-5">
                      Type
                    </TableHead>
                    <TableHead className="w-[1%] whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae] sm:px-5">
                      Time
                    </TableHead>
                    <TableHead className="w-[1%] whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae] sm:px-5">
                      Score
                    </TableHead>
                    <TableHead className="w-[1%] whitespace-nowrap px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae] sm:px-5">
                      Action
                    </TableHead>
                    <TableHead aria-hidden className="w-full p-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={`${row.type}-${row.id}`} className="h-auto">
                      <TableCell className="w-[1%] min-w-0 max-w-[18rem] px-4 py-3 align-top sm:px-5">
                        <p className="truncate font-medium" title={row.name}>
                          {row.name}
                        </p>
                      </TableCell>
                      <TableCell className="w-[12rem] max-w-[12rem] min-w-0 px-4 py-3 align-top font-mono text-xs text-muted-foreground sm:px-5">
                        <p className="truncate" title={row.id}>
                          {row.id}
                        </p>
                      </TableCell>
                      <TableCell className="w-[14rem] max-w-[14rem] min-w-0 px-4 py-3 align-top sm:px-5">
                        <p className="truncate font-medium" title={row.user.name || undefined}>
                          {row.user.name || "—"}
                        </p>
                        <p
                          className="truncate text-xs text-muted-foreground sm:text-sm"
                          title={row.user.email || undefined}
                        >
                          {row.user.email || "—"}
                        </p>
                      </TableCell>
                      <TableCell className="px-4 py-3 align-top sm:px-5">
                        <Badge variant="neutral" className="max-w-full truncate">
                          {INTERVIEW_TYPE_LABEL[row.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 align-top text-sm text-muted-foreground sm:px-5">
                        <span className="whitespace-nowrap">
                          {formatDate(row.occurredAt)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 align-top sm:px-5">
                        {row.score != null ? (
                          <span
                            className={`font-semibold tabular-nums ${getScoreColor(row.score)}`}
                          >
                            {row.score}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right align-top sm:px-5">
                        <Button variant="outline" size="sm" className="h-11" asChild>
                          <Link
                            href={(() => {
                              if (row.type !== "screening" && row.type !== "coding") {
                                return row.reportHref;
                              }
                              const q = new URLSearchParams({
                                ...(row.user.name ? { name: row.user.name } : {}),
                                ...(row.user.email ? { email: row.user.email } : {}),
                              });
                              const qs = q.toString();
                              return qs ? `${row.reportHref}?${qs}` : row.reportHref;
                            })()}
                          >
                            View report
                          </Link>
                        </Button>
                      </TableCell>
                      <TableCell aria-hidden className="w-full p-0" />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {total > limit && (
            <div className="flex flex-col-reverse gap-2 border-t border-border/60 px-4 py-3 sm:flex-row sm:justify-between sm:px-5">
              <Button
                variant="outline"
                className="h-11 w-full sm:w-auto"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full sm:w-auto"
                disabled={(page + 1) * limit >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
