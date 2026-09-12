"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { SuperAdminPeriodFilter } from "@/components/super-admin/SuperAdminPeriodFilter";
import { SuperAdminScheduledInterviewsCard } from "@/components/super-admin/SuperAdminScheduledInterviewsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="space-y-6">
      <SuperAdminPageHeader />

      <SuperAdminScheduledInterviewsCard />

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="space-y-3 border-b border-border/60 px-4 py-4 sm:px-5">
          <CardTitle className="text-base sm:text-lg">Interview report</CardTitle>
          <SuperAdminPeriodFilter
            period={period}
            from={from}
            to={to}
            type={type}
            showType
            onPeriodChange={(next) => setFilters({ period: next })}
            onTypeChange={(next) => setFilters({ type: next })}
            onRangeChange={(nextFrom, nextTo) =>
              setFilters({ period: "custom", from: nextFrom, to: nextTo })
            }
          />
          <div className="relative min-w-0 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, email, or interview id..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="px-4 py-4 sm:px-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No completed interviews in this range.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[960px]">
                <TableHeader>
                  <TableRow className="border-b border-border/70 hover:bg-transparent">
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Interview
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      ID
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      User
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Type
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Time
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Score
                    </TableHead>
                    <TableHead className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={`${row.type}-${row.id}`}>
                      <TableCell className="max-w-[220px]">
                        <p className="truncate font-medium">{row.name}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.id}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[10rem] max-w-[16rem]">
                          <p className="truncate font-medium">
                            {row.user.name || "—"}
                          </p>
                          <p className="truncate break-all text-sm text-muted-foreground">
                            {row.user.email || "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">
                          {INTERVIEW_TYPE_LABEL[row.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(row.occurredAt)}
                      </TableCell>
                      <TableCell>
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
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {total > limit && (
            <div className="mt-4 flex justify-between gap-2">
              <Button
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
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
