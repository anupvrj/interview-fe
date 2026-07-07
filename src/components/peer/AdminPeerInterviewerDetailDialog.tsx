"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { InterviewerStatusBadge } from "@/components/peer/InterviewerStatusBadge";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import {
  CalendarClock,
  CheckCircle2,
  IndianRupee,
  Star,
  XCircle,
} from "lucide-react";

type AdminInterviewerDetail = {
  profile: {
    _id: string;
    name: string;
    jobRole: string;
    company: string;
    industry?: string;
    yearsOfExperience: number;
    workEmail: string;
    status: string;
    canTakeTypes?: string[];
    pricing?: Record<string, number>;
  };
  stats: {
    totalBookings: number;
    completed: number;
    pending: number;
    cancelled: number;
    totalEarnings: number;
    ratingAvg: number;
    ratingCount: number;
  };
  corporateIdFrontUrl?: string | null;
  corporateIdBackUrl?: string | null;
};

type AdminPeerInterviewerDetailDialogProps = {
  open: boolean;
  loading: boolean;
  detail: AdminInterviewerDetail | null;
  reason: string;
  onReasonChange: (value: string) => void;
  acting: boolean;
  onClose: () => void;
  onAction: (
    action: "approve" | "reject" | "suspend" | "block" | "unblock",
  ) => void;
};

function DetailRow({
  label,
  value,
}: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </>
  );
}

export function AdminPeerInterviewerDetailDialog({
  open,
  loading,
  detail,
  reason,
  onReasonChange,
  acting,
  onClose,
  onAction,
}: Readonly<AdminPeerInterviewerDetailDialogProps>) {
  const handleAction = (
    action: "approve" | "reject" | "suspend" | "block" | "unblock",
  ) => {
    if (["reject", "suspend", "block"].includes(action) && !reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    onAction(action);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Interviewer review</DialogTitle>
          <DialogDescription>
            Inspect profile details, verify corporate ID, and update account status.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
          </div>
        ) : detail ? (
          <div className="space-y-5">
            <div className={cn(appCard, "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between")}>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-foreground">
                  {detail.profile.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {detail.profile.jobRole} · {detail.profile.company}
                </p>
              </div>
              <InterviewerStatusBadge status={detail.profile.status} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DashboardStatCard
                theme="purple"
                label="Total bookings"
                value={detail.stats.totalBookings}
                icon={CalendarClock}
              />
              <DashboardStatCard
                theme="emerald"
                label="Completed"
                value={detail.stats.completed}
                icon={CheckCircle2}
              />
              <DashboardStatCard
                theme="amber"
                label="Pending"
                value={detail.stats.pending}
                icon={CalendarClock}
              />
              <DashboardStatCard
                theme="rose"
                label="Cancelled"
                value={detail.stats.cancelled}
                icon={XCircle}
              />
              <DashboardStatCard
                theme="violet"
                label="Earnings"
                value={`₹${detail.stats.totalEarnings}`}
                icon={IndianRupee}
              />
              <DashboardStatCard
                theme="sky"
                label="Rating"
                value={
                  detail.stats.ratingCount > 0
                    ? detail.stats.ratingAvg.toFixed(1)
                    : "New"
                }
                icon={Star}
              />
            </div>

            <div className={cn(appCard, "p-4")}>
              <h4 className="mb-3 text-sm font-semibold text-foreground">Profile</h4>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                <DetailRow label="Work email" value={detail.profile.workEmail} />
                <DetailRow
                  label="Experience"
                  value={`${detail.profile.yearsOfExperience}+ years`}
                />
                {detail.profile.industry ? (
                  <DetailRow label="Industry" value={detail.profile.industry} />
                ) : null}
              </dl>
            </div>

            <div className={cn(appCard, "grid grid-cols-1 gap-3 p-4 sm:grid-cols-2")}>
              {detail.corporateIdFrontUrl ? (
                <a
                  href={detail.corporateIdFrontUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-4 py-3 text-sm font-medium text-[#7367F0] transition-colors hover:bg-[#7367F0]/5"
                >
                  <ExternalLink className="h-4 w-4" />
                  View ID — Front
                </a>
              ) : (
                <span className="rounded-lg border border-dashed border-border px-4 py-3 text-center text-sm text-muted-foreground">
                  No front ID uploaded
                </span>
              )}
              {detail.corporateIdBackUrl ? (
                <a
                  href={detail.corporateIdBackUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-4 py-3 text-sm font-medium text-[#7367F0] transition-colors hover:bg-[#7367F0]/5"
                >
                  <ExternalLink className="h-4 w-4" />
                  View ID — Back
                </a>
              ) : (
                <span className="rounded-lg border border-dashed border-border px-4 py-3 text-center text-sm text-muted-foreground">
                  No back ID uploaded
                </span>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="interviewer-action-reason" className="text-xs font-medium text-muted-foreground">
                Reason for reject / suspend / block
              </label>
              <Textarea
                id="interviewer-action-reason"
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder="Required when rejecting, suspending, or blocking an interviewer"
                rows={3}
                className="bg-card"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 pt-4">
              {detail.profile.status !== "approved" ? (
                <Button
                  onClick={() => handleAction("approve")}
                  disabled={acting}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Approve
                </Button>
              ) : null}
              {detail.profile.status === "pending" ? (
                <Button
                  variant="destructive"
                  onClick={() => handleAction("reject")}
                  disabled={acting}
                >
                  Reject
                </Button>
              ) : null}
              {detail.profile.status === "approved" ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleAction("suspend")}
                    disabled={acting}
                  >
                    Suspend
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleAction("block")}
                    disabled={acting}
                  >
                    Block
                  </Button>
                </>
              ) : null}
              {["suspended", "blocked"].includes(detail.profile.status) ? (
                <Button
                  onClick={() => handleAction("unblock")}
                  disabled={acting}
                  className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
                >
                  Reinstate
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
