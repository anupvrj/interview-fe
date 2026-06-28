import { cn } from "@/lib/utils";
import type { PeerSlot } from "@/lib/api";

const MAP: Record<PeerSlot["status"], { label: string; className: string }> = {
  open: {
    label: "Open",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  booked: {
    label: "Booked",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  blocked: {
    label: "Blocked",
    className: "bg-muted text-muted-foreground",
  },
  expired: {
    label: "Expired",
    className: "bg-muted text-muted-foreground",
  },
};

export function SlotStatusBadge({ status }: { status: PeerSlot["status"] }) {
  const cfg = MAP[status] ?? MAP.open;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}
