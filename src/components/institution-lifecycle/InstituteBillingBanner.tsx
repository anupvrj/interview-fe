"use client";

import Link from "next/link";
import { AlertTriangle, CalendarClock, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatLifecycleDate,
  SUPPORT_EMAIL,
  type InstitutionLifecycle,
} from "@/lib/institution-lifecycle";

/**
 * Institute admin renewal banner: demo mode, renewal due soon, and overdue (grace).
 * Renders nothing while billing is current.
 */
export function InstituteBillingBanner({
  lifecycle,
  institutionId,
  showBillingLink = true,
  className,
}: Readonly<{
  lifecycle?: InstitutionLifecycle | null;
  institutionId: string;
  showBillingLink?: boolean;
  className?: string;
}>) {
  if (!lifecycle) return null;
  const { billingState, mode } = lifecycle;

  let tone: "info" | "warning" | "danger";
  let Icon = CalendarClock;
  let title: string;
  let body: string;

  if (mode === "demo") {
    tone = "info";
    Icon = FlaskConical;
    title = "Your institute is in demo mode";
    body =
      "Add candidates, create batches, and set up schedules now. Candidates can start interviews once InterviewTrix marks your institute live.";
  } else if (billingState === "due_soon") {
    tone = "warning";
    const days = lifecycle.daysUntilRenewal ?? 0;
    title =
      days <= 0 ? "Your plan renews today" : `Your plan renews in ${days} day${days === 1 ? "" : "s"}`;
    body = `Renewal is due on ${formatLifecycleDate(lifecycle.renewalDate)}. Please complete the payment to keep candidate access uninterrupted.`;
  } else if (billingState === "overdue") {
    tone = "danger";
    Icon = AlertTriangle;
    const days = lifecycle.daysLeftInGrace ?? 0;
    title = "Renewal payment overdue";
    body = `Payment was due on ${formatLifecycleDate(lifecycle.renewalDate)}. Access stays open until ${formatLifecycleDate(lifecycle.graceEndsAt)} (${days} day${days === 1 ? "" : "s"} left), then your institute and all candidates are suspended.`;
  } else {
    return null;
  }

  const toneClass = {
    info: "border-[#00BAD1]/30 bg-[#00BAD1]/10",
    warning: "border-amber-300/70 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950/30",
    danger: "border-red-300/70 bg-red-50 dark:border-red-500/30 dark:bg-red-950/30",
  }[tone];
  const iconClass = {
    info: "text-[#00BAD1]",
    warning: "text-amber-600",
    danger: "text-[#EA5455]",
  }[tone];

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between", toneClass, className)}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconClass)} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{body}</p>
        </div>
      </div>
      {mode !== "demo" ? (
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          {showBillingLink ? (
            <Button variant="outline" size="sm" className="h-9 bg-card" asChild>
              <Link href={`/dashboard/institute/${institutionId}/billing`}>View billing</Link>
            </Button>
          ) : null}
          <Button size="sm" className="h-9" asChild>
            <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Institute renewal payment")}`}>
              Contact billing
            </a>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
