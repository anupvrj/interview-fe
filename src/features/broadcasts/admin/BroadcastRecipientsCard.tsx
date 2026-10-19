"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatIst } from "@/features/hackathon/copy";
import { cn } from "@/lib/utils";
import { broadcastsAdminApi } from "../api";
import type { BroadcastRecipientRow, RecipientStatus } from "../types";

const FILTERS: { value: RecipientStatus | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "sent", label: "Sent" },
  { value: "queued", label: "Waiting" },
  { value: "skipped", label: "Skipped" },
  { value: "failed", label: "Failed" },
];

const VARIANT: Record<RecipientStatus, "success" | "neutral" | "warning" | "danger" | "info"> = {
  sent: "success",
  queued: "neutral",
  sending: "info",
  skipped: "warning",
  failed: "danger",
};

export function BroadcastRecipientsCard({ broadcastId, live }: Readonly<{ broadcastId: string; live: boolean }>) {
  const [status, setStatus] = useState<RecipientStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ rows: BroadcastRecipientRow[]; total: number; pageSize: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      broadcastsAdminApi
        .recipients(broadcastId, status, page)
        .then((res) => !cancelled && setData(res))
        .catch(() => undefined);
    void load();
    const id = live ? window.setInterval(() => void load(), 5_000) : undefined;
    return () => {
      cancelled = true;
      if (id) window.clearInterval(id);
    };
  }, [broadcastId, live, page, status]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-3">
        <CardTitle className="text-base">Recipients</CardTitle>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => {
                setStatus(f.value);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                status === f.value ? "border-[#7367F0] bg-[#7367F0] text-white" : "border-border text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!data ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : data.rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nobody here yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell>
                      <p className="text-sm text-foreground">{r.email}</p>
                      {r.name ? <p className="text-xs text-muted-foreground">{r.name}</p> : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={VARIANT[r.status]}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.sentAt ? formatIst(r.sentAt) : "—"}</TableCell>
                    <TableCell className="max-w-[260px] truncate text-xs text-muted-foreground" title={r.error ?? r.reason ?? ""}>
                      {r.unsubscribedAt ? "Unsubscribed" : r.error ?? r.reason ?? ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {data && data.total > data.pageSize ? (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Page {page} of {pages} · {data.total} people
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
