"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RecruiterStatusBadge } from "@/components/recruiter/RecruiterStatusBadges";
import type { RecruiterAdminView } from "@/lib/api";
import { appPrimaryButton } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

type Action = "approve" | "reject" | "suspend" | "block" | "unblock";

function InfoRow({
  label,
  value,
}: Readonly<{ label: string; value?: string }>) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function DocLink({ label, url }: Readonly<{ label: string; url?: string }>) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

export function AdminRecruiterDetailDialog({
  open,
  loading,
  detail,
  reason,
  onReasonChange,
  acting,
  onClose,
  onAction,
}: Readonly<{
  open: boolean;
  loading: boolean;
  detail: RecruiterAdminView | null;
  reason: string;
  onReasonChange: (v: string) => void;
  acting: boolean;
  onClose: () => void;
  onAction: (action: Action) => void;
}>) {
  const status = detail?.status;
  const docs = detail?.documentUrls;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Recruiter application</DialogTitle>
          <DialogDescription>
            Review the applicant details and documents before deciding.
          </DialogDescription>
        </DialogHeader>

        {loading || !detail ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">
                  {detail.firstName} {detail.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {detail.recruiterRole}
                </p>
              </div>
              <RecruiterStatusBadge status={detail.status} />
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <InfoRow
                label="Type"
                value={
                  detail.recruiterType === "company" ? "Company" : "Individual"
                }
              />
              <InfoRow label="Work email" value={detail.workEmail} />
              <InfoRow label="Company" value={detail.companyName} />
              <InfoRow
                label="Total shortlisted"
                value={String(detail.stats.totalShortlisted)}
              />
              <InfoRow
                label="Total hires"
                value={String(detail.stats.totalHires)}
              />
            </div>

            {docs?.registrationCertUrl ||
            docs?.panCardUrl ||
            docs?.tradeCertUrl ||
            docs?.workIdUrl ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Documents</p>
                <div className="flex flex-wrap gap-2">
                  <DocLink label="Work ID" url={docs?.workIdUrl} />
                  <DocLink
                    label="Registration cert"
                    url={docs?.registrationCertUrl}
                  />
                  <DocLink label="PAN card" url={docs?.panCardUrl} />
                  <DocLink label="Trade cert" url={docs?.tradeCertUrl} />
                </div>
              </div>
            ) : null}

            {detail.rejectionReason ? (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                <strong>Rejection reason:</strong> {detail.rejectionReason}
              </p>
            ) : null}
            {detail.suspensionReason ? (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                <strong>Reason:</strong> {detail.suspensionReason}
              </p>
            ) : null}

            {status !== "approved" ? (
              <div className="space-y-1.5">
                <Label htmlFor="rec-reason">
                  Reason (for reject / suspend / block)
                </Label>
                <Textarea
                  id="rec-reason"
                  value={reason}
                  onChange={(e) => onReasonChange(e.target.value)}
                  placeholder="Explain the decision..."
                  rows={2}
                />
              </div>
            ) : null}
          </div>
        )}

        {detail && !loading ? (
          <DialogFooter className="flex flex-wrap justify-end gap-2 border-t border-border/60 pt-4">
            {status !== "approved" ? (
              <Button
                type="button"
                disabled={acting}
                onClick={() => onAction("approve")}
                className={cn(appPrimaryButton, "h-9")}
              >
                Approve
              </Button>
            ) : null}
            {status === "pending" || status === "rejected" ? (
              <Button
                type="button"
                variant="outline"
                disabled={acting}
                onClick={() => onAction("reject")}
                className="h-9 border-red-200 text-red-700"
              >
                Reject
              </Button>
            ) : null}
            {status === "approved" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={acting}
                  onClick={() => onAction("suspend")}
                  className="h-9 border-amber-200 text-amber-700"
                >
                  Suspend
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={acting}
                  onClick={() => onAction("block")}
                  className="h-9 border-red-200 text-red-700"
                >
                  Block
                </Button>
              </>
            ) : null}
            {status === "suspended" || status === "blocked" ? (
              <Button
                type="button"
                variant="outline"
                disabled={acting}
                onClick={() => onAction("unblock")}
                className="h-9"
              >
                Reinstate
              </Button>
            ) : null}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
