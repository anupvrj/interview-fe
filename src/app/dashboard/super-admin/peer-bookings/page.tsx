"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ChevronRight, Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/peer/BookingStatusBadge";
import { appFilterBar } from "@/lib/app-theme";
import { isPlatformAdmin } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";
import { userApi, peerApi, type PeerBooking } from "@/lib/api";

export default function AdminPeerBookingsPage() {
  const { isLoaded } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const [interviewer, setInterviewer] = useState("");
  const [candidate, setCandidate] = useState("");
  const [ref, setRef] = useState("");
  const [items, setItems] = useState<PeerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const p = await userApi.getMyProfile();
        if (!isPlatformAdmin(p.accessRole ?? null)) {
          router.replace("/dashboard");
          return;
        }
        setAuthorized(true);
      } catch {
        router.replace("/dashboard");
      }
    })();
  }, [isLoaded, router]);

  const load = async (targetPage = 1) => {
    setLoading(true);
    try {
      const res = await peerApi.admin.listBookings({
        interviewer: interviewer || undefined,
        candidate: candidate || undefined,
        ref: ref || undefined,
        page: targetPage,
        pageSize: 20,
      });
      setItems(res.items);
      setTotalPages(res.totalPages || 1);
      setPage(res.page);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  if (!authorized) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Peer Bookings"
        badge="Oversight"
        description="Review all bookings, approve payouts, issue refunds and reassign interviewers."
      />

      <div className={cn(appFilterBar, "grid grid-cols-1 gap-3 sm:grid-cols-4")}>
        <Input
          value={interviewer}
          onChange={(e) => setInterviewer(e.target.value)}
          placeholder="Interviewer name"
        />
        <Input
          value={candidate}
          onChange={(e) => setCandidate(e.target.value)}
          placeholder="Candidate name"
        />
        <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Booking ref" />
        <Button onClick={() => void load(1)} className="bg-[#7367F0] text-white hover:bg-[#6e62e5]">
          <Search className="mr-2 h-4 w-4" /> Search
        </Button>
      </div>

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <CardTitle className="text-lg font-semibold text-foreground">All bookings</CardTitle>
          <CardDescription className="text-sm">
            Open a booking to review details, manage payout, or reassign the interviewer.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">No bookings found.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {items.map((b) => (
                <Link
                  key={b.id}
                  href={`/dashboard/super-admin/peer-bookings/${b.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{b.bookingRef}</span>
                      <BookingStatusBadge status={b.status} />
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {b.interviewerName || "—"} ← {b.candidateName || "—"} · ₹{b.amount} ·{" "}
                      {new Date(b.start).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
          {!loading && totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 border-t border-border/60 px-5 py-4">
              <Button variant="outline" disabled={page <= 1} onClick={() => void load(page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => void load(page + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
