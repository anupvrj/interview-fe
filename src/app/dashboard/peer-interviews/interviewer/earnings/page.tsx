"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, IndianRupee, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { PeerEarningStatusBadge } from "@/components/peer/PeerEarningCard";
import { formatPeerSchedule } from "@/components/peer/peerSlotTime";
import { usePeerTimezone } from "@/components/peer/usePeerTimezone";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import {
  peerApi,
  type PeerEarning,
  type PeerEarningsSummary,
  type PeerInterviewType,
} from "@/lib/api";

type StatusFilter = "all" | "pending" | "approved" | "paid" | "rejected";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid out" },
  { value: "rejected", label: "Rejected" },
];

export default function InterviewerEarningsPage() {
  const { isLoaded, user } = useUser();
  const { timezone } = usePeerTimezone();
  const [types, setTypes] = useState<PeerInterviewType[]>([]);
  const [summary, setSummary] = useState<PeerEarningsSummary | null>(null);
  const [items, setItems] = useState<PeerEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const typeNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of types) m[t.key] = t.name;
    return m;
  }, [types]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await peerApi.listEarnings({
        status: statusFilter === "all" ? undefined : statusFilter,
        page,
        pageSize: 20,
      });
      setItems(res.items);
      setSummary(res.summary);
      setTotalPages(res.totalPages);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not load earnings");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    peerApi.listInterviewTypes().then(setTypes).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) return;
    void load();
  }, [isLoaded, user, load]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="w-fit">
        <Link href="/dashboard/peer-interviews/interviewer">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to interviewer hub
        </Link>
      </Button>

      <PageHeader
        title="Earnings"
        badge="Peer interviews"
        description="Track pending, approved, and paid out earnings from completed peer interviews."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <DashboardStatCard
          theme="violet"
          label="Total earnings"
          value={`₹${summary?.totalEarnings ?? 0}`}
          icon={IndianRupee}
        />
        <DashboardStatCard
          theme="amber"
          label="Pending earning"
          value={`₹${summary?.pendingEarnings ?? 0}`}
          icon={IndianRupee}
        />
        <DashboardStatCard
          theme="cyan"
          label="Approved earning"
          value={`₹${summary?.approvedEarnings ?? 0}`}
          icon={IndianRupee}
        />
        <DashboardStatCard
          theme="emerald"
          label="Paid out"
          value={`₹${summary?.paidOutEarnings ?? 0}`}
          icon={IndianRupee}
        />
      </div>

      <div className={cn(appCard, "p-4")}>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={statusFilter === f.value ? "default" : "outline"}
              className={
                statusFilter === f.value ? "bg-[#7367F0] text-white hover:bg-[#6e62e5]" : undefined
              }
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={cn(appCard, "flex h-48 items-center justify-center")}>
          <Loader2 className="h-7 w-7 animate-spin text-[#7367F0]" />
        </div>
      ) : items.length === 0 ? (
        <div className={cn(appCard, "px-6 py-16 text-center")}>
          <p className="text-lg font-semibold">No earnings yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Mark interviews done after the scheduled end time to record your earning.
          </p>
        </div>
      ) : (
        <div className={cn(appCard, "overflow-hidden")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border/70">
                  {["Booking", "Interview", "Net earning", "Status", "Paid", ""].map((h) => (
                    <th
                      key={h || "actions"}
                      className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/60 last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold">{item.bookingRef}</p>
                      <p className="text-xs text-muted-foreground">
                        Gross ₹{item.grossAmount} · Fee ₹{item.platformFee}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      {typeNames[item.interviewType] || item.interviewType}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold tabular-nums">₹{item.amount}</td>
                    <td className="px-5 py-3.5">
                      <PeerEarningStatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {item.paidAt
                        ? formatPeerSchedule(item.paidAt, timezone, { dateStyle: "medium" })
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/peer-interviews/bookings/${item.bookingId}`}>
                          View booking
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 ? (
            <div className="flex items-center justify-end gap-2 border-t border-border/60 px-5 py-3">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
