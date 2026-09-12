"use client";

import { Suspense, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { SuperAdminPeriodFilter } from "@/components/super-admin/SuperAdminPeriodFilter";
import { AdminResumePreviewDialog } from "@/components/super-admin/AdminResumePreviewDialog";
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
import { formatDate } from "@/lib/utils";
import { useInsightFilters } from "@/hooks/useInsightFilters";
import type { InsightResumeRow } from "@/lib/super-admin-insights";

export default function SuperAdminResumesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResumesPageBody />
    </Suspense>
  );
}

function ResumesPageBody() {
  const { period, from, to, setFilters } = useInsightFilters();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;
  const [rows, setRows] = useState<InsightResumeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [period, from, to, search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi
      .listInsightResumes({
        limit,
        skip: page * limit,
        search: search || undefined,
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
  }, [page, search, period, from, to]);

  const openResume = async (resumeId: string) => {
    setPreviewLoading(true);
    setPreview(null);
    try {
      const data = await adminApi.getResumeForAdmin(resumeId);
      setPreview(data);
    } catch (err) {
      console.error(err);
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader />

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="space-y-3 border-b border-border/60 px-4 py-4 sm:px-5">
          <CardTitle className="text-base sm:text-lg">Designed resumes</CardTitle>
          <SuperAdminPeriodFilter
            period={period}
            from={from}
            to={to}
            onPeriodChange={(next) => setFilters({ period: next })}
            onRangeChange={(nextFrom, nextTo) =>
              setFilters({ period: "custom", from: nextFrom, to: nextTo })
            }
          />
          <div className="relative min-w-0 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, email, or title..."
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
            <p className="text-sm text-muted-foreground">No resumes in this range.</p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow className="border-b border-border/70 hover:bg-transparent">
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Designer
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Email
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Resume
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Created
                    </TableHead>
                    <TableHead className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.resumeId}>
                      <TableCell className="font-medium">
                        {row.user.name || "—"}
                      </TableCell>
                      <TableCell className="break-all text-muted-foreground">
                        {row.user.email || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{row.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.templateId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(row.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void openResume(row.resumeId)}
                        >
                          View resume
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

      <AdminResumePreviewDialog
        open={!!preview || previewLoading}
        loading={previewLoading}
        resume={preview}
        onOpenChange={(open) => {
          if (!open) {
            setPreview(null);
            setPreviewLoading(false);
          }
        }}
      />
    </div>
  );
}
