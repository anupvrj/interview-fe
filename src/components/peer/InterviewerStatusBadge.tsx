import { cn } from "@/lib/utils";
import type { PeerInterviewerStatus } from "@/lib/api";

const MAP: Record<
  PeerInterviewerStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending review",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
  suspended: {
    label: "Suspended",
    className: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  },
  blocked: {
    label: "Blocked",
    className: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
  },
};

export function InterviewerStatusBadge({
  status,
}: Readonly<{ status: PeerInterviewerStatus | string }>) {
  const cfg = MAP[status as PeerInterviewerStatus] ?? MAP.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize",
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}
