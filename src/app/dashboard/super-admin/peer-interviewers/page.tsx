"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  ShieldX,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AdminPeerInterviewersTable,
  type AdminInterviewerStatusTab,
} from "@/components/peer/AdminPeerInterviewersTable";
import { AdminPeerInterviewerDetailDialog } from "@/components/peer/AdminPeerInterviewerDetailDialog";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { appCard } from "@/lib/app-theme";
import { isPlatformAdmin } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";
import { userApi, peerApi, type PeerInterviewerProfile } from "@/lib/api";

function computeStatusCounts(items: PeerInterviewerProfile[]) {
  const counts: Record<AdminInterviewerStatusTab, number> = {
    all: items.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
    blocked: 0,
  };
  for (const item of items) {
    const key = item.status as Exclude<AdminInterviewerStatusTab, "all">;
    if (key in counts && key !== "all") {
      counts[key] += 1;
    }
  }
  return counts;
}

export default function AdminPeerInterviewersPage() {
  const { isLoaded } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState<AdminInterviewerStatusTab>("pending");
  const [list, setList] = useState<PeerInterviewerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState<Awaited<
    ReturnType<typeof peerApi.admin.getInterviewer>
  > | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);

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

  const load = async () => {
    setLoading(true);
    try {
      const items = await peerApi.admin.listInterviewers();
      setList(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) void load();
  }, [authorized]);

  const statusCounts = useMemo(() => computeStatusCounts(list), [list]);

  const openDetail = async (id: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    setReason("");
    try {
      const d = await peerApi.admin.getInterviewer(id);
      setDetail(d);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load interviewer");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const act = async (
    action: "approve" | "reject" | "suspend" | "block" | "unblock",
  ) => {
    const id = detail?.profile?._id;
    if (!id) return;
    if (["reject", "suspend", "block"].includes(action) && !reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setActing(true);
    try {
      await peerApi.admin.setInterviewerStatus(id, action, reason.trim() || undefined);
      toast.success(`Interviewer ${action}${action === "block" ? "ed" : "d"}`);
      setDetailOpen(false);
      setDetail(null);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Action failed");
    } finally {
      setActing(false);
    }
  };

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
        title="Peer interviewers"
        badge="Verification"
        description="Review interviewer applications, inspect corporate IDs, and approve, reject, suspend, or block accounts."
      />

      {loading ? (
        <div className={cn(appCard, "flex h-64 items-center justify-center")}>
          <Loader2 className="h-7 w-7 animate-spin text-[#7367F0]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <DashboardStatCard
              theme="purple"
              label="Total interviewers"
              value={statusCounts.all}
              icon={Users}
              hint={
                <>
                  <Users className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span>All peer interviewer accounts</span>
                </>
              }
            />
            <DashboardStatCard
              theme="amber"
              label="Pending review"
              value={statusCounts.pending}
              icon={Clock}
              hint={
                <>
                  <Clock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span>Awaiting verification</span>
                </>
              }
            />
            <DashboardStatCard
              theme="emerald"
              label="Approved"
              value={statusCounts.approved}
              icon={CheckCircle2}
              hint={
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span>Active on marketplace</span>
                </>
              }
            />
            <DashboardStatCard
              theme="rose"
              label="Restricted"
              value={statusCounts.rejected + statusCounts.suspended + statusCounts.blocked}
              icon={ShieldX}
              hint={
                <>
                  <ShieldX className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span>Rejected, suspended, or blocked</span>
                </>
              }
            />
          </div>

          {statusCounts.pending > 0 ? (
            <div
              className={cn(
                appCard,
                "flex items-start gap-3 border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20",
              )}
            >
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {statusCounts.pending} application{statusCounts.pending === 1 ? "" : "s"} pending review
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Open a row to verify corporate ID and approve or reject the application.
                </p>
              </div>
            </div>
          ) : null}

          <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Interviewer applications
                </CardTitle>
                <CardDescription className="mt-1 text-sm">
                  Filter by status or search by name, company, or email.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 pb-4">
              <AdminPeerInterviewersTable
                interviewers={list}
                loading={loading}
                statusTab={tab}
                onStatusTabChange={setTab}
                onView={(id) => void openDetail(id)}
                statusCounts={statusCounts}
              />
            </CardContent>
          </Card>
        </>
      )}

      <AdminPeerInterviewerDetailDialog
        open={detailOpen}
        loading={detailLoading}
        detail={detail}
        reason={reason}
        onReasonChange={setReason}
        acting={acting}
        onClose={() => {
          setDetailOpen(false);
          setDetail(null);
        }}
        onAction={(action) => void act(action)}
      />
    </div>
  );
}
