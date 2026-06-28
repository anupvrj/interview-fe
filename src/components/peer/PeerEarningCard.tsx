"use client";

import { cn } from "@/lib/utils";
import type { PeerEarning } from "@/lib/api";

const STATUS_LABEL: Record<PeerEarning["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid out",
  rejected: "Rejected",
};

const STATUS_CLASS: Record<PeerEarning["status"], string> = {
  pending:
    "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/40",
  approved:
    "bg-blue-50 text-blue-800 border-blue-200/80 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/40",
  paid: "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/40",
  rejected:
    "bg-red-50 text-red-800 border-red-200/80 dark:bg-red-950/30 dark:text-red-200 dark:border-red-900/40",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function PeerEarningCard({
  earning,
  className,
  showBookingRef = true,
}: {
  earning: PeerEarning;
  className?: string;
  showBookingRef?: boolean;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Earning
          </p>
          {showBookingRef ? (
            <p className="text-sm font-semibold text-foreground">{earning.bookingRef}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
            STATUS_CLASS[earning.status],
          )}
        >
          {STATUS_LABEL[earning.status]}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DetailRow label="Gross (candidate paid)" value={`₹${earning.grossAmount}`} />
        <DetailRow
          label="Platform fee"
          value={`₹${earning.platformFee} (${earning.platformFeePercent}%)`}
        />
        <DetailRow label="Your net earning" value={`₹${earning.amount}`} />
        <DetailRow
          label="Earned at"
          value={
            earning.earnedAt
              ? new Date(earning.earnedAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "—"
          }
        />
      </div>

      {earning.paidAt ? (
        <p className="text-xs text-muted-foreground">
          Paid out on{" "}
          {new Date(earning.paidAt).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      ) : null}
    </div>
  );
}

export function PeerEarningStatusBadge({ status }: { status: PeerEarning["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
        STATUS_CLASS[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
