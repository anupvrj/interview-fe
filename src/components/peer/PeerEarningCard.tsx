"use client";

import { IndianRupee } from "lucide-react";
import { PeerBookingCardShell, PeerBookingMetric } from "@/components/peer/PeerBookingCardShell";
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
    "bg-amber-500/10 text-amber-800 dark:text-amber-200",
  approved: "bg-blue-500/10 text-blue-800 dark:text-blue-200",
  paid: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  rejected: "bg-red-500/10 text-red-800 dark:text-red-200",
};

export function PeerEarningCard({
  earning,
  className,
  showBookingRef = true,
}: {
  earning: PeerEarning;
  className?: string;
  showBookingRef?: boolean;
}) {
  const content = (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Net earning
          </p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">
            ₹{earning.amount}
          </p>
          {showBookingRef ? (
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {earning.bookingRef}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
            STATUS_CLASS[earning.status],
          )}
        >
          {STATUS_LABEL[earning.status]}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <PeerBookingMetric label="Gross" value={`₹${earning.grossAmount}`} />
        <PeerBookingMetric
          label="Platform fee"
          value={`₹${earning.platformFee}`}
        />
        <PeerBookingMetric
          label="Earned"
          value={
            earning.earnedAt
              ? new Date(earning.earnedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })
              : "—"
          }
        />
      </div>

      {earning.paidAt ? (
        <p className="text-[10px] text-muted-foreground">
          Paid{" "}
          {new Date(earning.paidAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      ) : null}
    </div>
  );

  if (showBookingRef) {
    return content;
  }

  return (
    <PeerBookingCardShell title="Your earning" icon={IndianRupee}>
      {content}
    </PeerBookingCardShell>
  );
}

export function PeerEarningStatusBadge({ status }: { status: PeerEarning["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
        STATUS_CLASS[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
