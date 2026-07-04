"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PeerBookingCardShell({
  title,
  description,
  icon: Icon,
  children,
  action,
  className,
  bodyClassName,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/40 bg-gradient-to-r from-[#7367F0]/[0.05] via-transparent to-transparent px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#7367F0]/10 text-[#7367F0]">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">
              {title}
            </h3>
            {description ? (
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </div>
  );
}

export function PeerBookingMetric({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-[7rem] flex-1 rounded-xl border border-border/50 bg-muted/20 px-3.5 py-2.5",
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate text-sm font-semibold text-foreground",
          mono && "font-mono text-xs tracking-wide",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function PeerBookingStatusPill({
  done,
  label,
  pendingLabel,
}: {
  done: boolean;
  label: string;
  pendingLabel?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-3 py-2.5",
        done
          ? "border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
          : "border-border/50 bg-muted/15",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
          done
            ? "bg-emerald-500 text-white"
            : "bg-muted text-muted-foreground",
        )}
      >
        {done ? "✓" : "·"}
      </span>
      <div className="min-w-0">
        <p className={cn("truncate text-xs font-semibold", done ? "text-foreground" : "text-muted-foreground")}>
          {label}
        </p>
        {!done && pendingLabel ? (
          <p className="truncate text-[10px] text-muted-foreground">{pendingLabel}</p>
        ) : null}
      </div>
    </div>
  );
}

export function PeerBookingInlineNote({
  icon: Icon,
  children,
  tone = "default",
}: {
  icon?: LucideIcon;
  children: ReactNode;
  tone?: "default" | "amber" | "emerald";
}) {
  const toneClass = {
    default: "border-border/50 bg-muted/20 text-muted-foreground",
    amber:
      "border-amber-200/60 bg-amber-50/50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200",
    emerald:
      "border-emerald-200/60 bg-emerald-50/50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200",
  }[tone];

  return (
    <div className={cn("flex gap-2.5 rounded-xl border px-3.5 py-3 text-xs leading-relaxed", toneClass)}>
      {Icon ? <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" /> : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function PeerBookingPrepareItem({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border/40 bg-muted/15 px-3 py-3.5 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7367F0]/10 text-[#7367F0]">
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-xs font-medium leading-snug text-foreground">{title}</p>
    </div>
  );
}
