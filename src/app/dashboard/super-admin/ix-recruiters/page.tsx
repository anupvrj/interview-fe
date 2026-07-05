"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Briefcase, CheckCircle2, Clock, Loader2, ShieldX } from "lucide-react";
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
  AdminRecruitersTable,
  type AdminRecruiterStatusTab,
} from "@/components/recruiter/AdminRecruitersTable";
import { AdminRecruiterDetailDialog } from "@/components/recruiter/AdminRecruiterDetailDialog";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { appCard } from "@/lib/app-theme";
import { isPlatformAdmin } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";
import {
  userApi,
  recruiterApi,
  type RecruiterProfile,
  type RecruiterAdminView,
} from "@/lib/api";

function computeStatusCounts(items: RecruiterProfile[]) {
  const counts: Record<AdminRecruiterStatusTab, number> = {
    all: items.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
    blocked: 0,
  };
  for (const item of items) {
    const key = item.status as Exclude<AdminRecruiterStatusTab, "all">;
    if (key in counts) counts[key] += 1;
  }
  return counts;
}

export default function AdminRecruitersPage() {
  const { isLoaded } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState<AdminRecruiterStatusTab>("pending");
  const [list, setList] = useState<RecruiterProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState<RecruiterAdminView | null>(null);
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
      const items = await recruiterApi.admin.listRecruiters();
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
      const d = await recruiterApi.admin.getRecruiter(id);
      setDetail(d);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load recruiter");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const act = async (
    action: "approve" | "reject" | "suspend" | "block" | "unblock",
  ) => {
    const id = detail?._id;
    if (!id) return;
    if (["reject", "suspend", "block"].includes(action) && !reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setActing(true);
    try {
      await recruiterApi.admin.setRecruiterStatus(
        id,
        action,
        reason.trim() || undefined,
      );
      toast.success(`Recruiter ${action}${action === "block" ? "ed" : "d"}`);
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
        title="iX Recruiters"
        badge="Verification"
        description="Review recruiter applications, inspect company documents, and approve, reject, suspend, or block accounts."
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
              label="Total recruiters"
              value={statusCounts.all}
              icon={Briefcase}
            />
            <DashboardStatCard
              theme="amber"
              label="Pending review"
              value={statusCounts.pending}
              icon={Clock}
            />
            <DashboardStatCard
              theme="emerald"
              label="Approved"
              value={statusCounts.approved}
              icon={CheckCircle2}
            />
            <DashboardStatCard
              theme="rose"
              label="Restricted"
              value={
                statusCounts.rejected +
                statusCounts.suspended +
                statusCounts.blocked
              }
              icon={ShieldX}
            />
          </div>

          <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <CardTitle className="text-lg font-semibold text-foreground">
                Recruiter applications
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                Filter by status or search by name, company, or email.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pb-4">
              <AdminRecruitersTable
                recruiters={list}
                statusTab={tab}
                onStatusTabChange={setTab}
                onView={(id) => void openDetail(id)}
                statusCounts={statusCounts}
              />
            </CardContent>
          </Card>
        </>
      )}

      <AdminRecruiterDetailDialog
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
