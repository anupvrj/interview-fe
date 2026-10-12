"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import type {
  AccountStatusEventRow,
  InstitutionBillingRecordRow,
  InstitutionBillingStatus,
} from "@/lib/api";
import {
  ACCOUNT_STATUS_LABELS,
  BILLING_TERM_LABELS,
  formatLifecycleDate,
  seatPlanLabel,
  type AccountStatus,
} from "@/lib/institution-lifecycle";
import { AccountStatusBadge, BillingStateBadge, InstitutionModeBadge } from "./StatusBadges";

const headClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]";

export const lifecycleCardClass = "rounded-xl border border-border/60 bg-card shadow-card";

function SummaryItem({ label, value, hint }: Readonly<{ label: string; value: ReactNode; hint?: string }>) {
  return (
    <div className="min-w-0 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-foreground">{value}</dd>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Mode, status, renewal, grace, and last payment at a glance. */
export function BillingSummaryCard({
  status,
  actions,
}: Readonly<{ status: InstitutionBillingStatus; actions?: ReactNode }>) {
  const { billing, lifecycle, institution } = status;
  const isDemo = lifecycle.mode === "demo";
  let renewalHint: string | undefined;
  if (!isDemo && lifecycle.daysUntilRenewal != null) {
    renewalHint =
      lifecycle.daysUntilRenewal >= 0
        ? `${lifecycle.daysUntilRenewal} day(s) left`
        : `${-lifecycle.daysUntilRenewal} day(s) overdue`;
  }
  return (
    <Card className={lifecycleCardClass}>
      <CardHeader className="flex flex-col gap-3 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base sm:text-lg">Billing</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <InstitutionModeBadge mode={lifecycle.mode} />
            <AccountStatusBadge status={lifecycle.effectiveStatus} />
            {lifecycle.billingState !== "demo" ? (
              <BillingStateBadge state={lifecycle.billingState} />
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        {institution.suspension?.reason && lifecycle.effectiveStatus === "suspended" ? (
          <p className="rounded-lg border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-200">
            <strong>Suspended:</strong> {institution.suspension.reason}
          </p>
        ) : null}
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryItem label="Billing term" value={BILLING_TERM_LABELS[billing.term]} />
          {isDemo ? (
            <SummaryItem
              label="Planned go-live"
              value={formatLifecycleDate(billing.plannedGoLiveDate)}
              hint="Billing starts when the institute is marked live"
            />
          ) : (
            <SummaryItem label="Live since" value={formatLifecycleDate(billing.liveAt)} />
          )}
          <SummaryItem
            label="Next renewal"
            value={isDemo ? "After go-live" : formatLifecycleDate(lifecycle.renewalDate)}
            hint={renewalHint}
          />
          <SummaryItem
            label="Current period"
            value={
              billing.currentPeriodStart
                ? `${formatLifecycleDate(billing.currentPeriodStart)} – ${formatLifecycleDate(billing.currentPeriodEnd)}`
                : "—"
            }
          />
          <SummaryItem
            label="Grace period"
            value={`${billing.graceDays} days`}
            hint={
              billing.graceExtendedUntil
                ? `Extended until ${formatLifecycleDate(billing.graceExtendedUntil)}`
                : lifecycle.graceEndsAt
                  ? `Access ends ${formatLifecycleDate(lifecycle.graceEndsAt)} if unpaid`
                  : undefined
            }
          />
          <SummaryItem label="Last payment" value={formatLifecycleDate(billing.lastPaymentAt)} />
        </dl>
      </CardContent>
    </Card>
  );
}

const KIND_LABEL: Record<InstitutionBillingRecordRow["kind"], string> = {
  payment: "Payment",
  go_live: "Went live",
  grace_extension: "Grace extended",
};

export function BillingHistoryTable({ records }: Readonly<{ records: InstitutionBillingRecordRow[] }>) {
  return (
    <Card className={`overflow-hidden ${lifecycleCardClass}`}>
      <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
        <CardTitle className="text-base">Billing history</CardTitle>
        <CardDescription>Payments, go-live, and grace extensions recorded by InterviewTrix.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {records.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No billing records yet.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow className="border-b border-border/70 hover:bg-transparent">
                  <TableHead className={headClass}>Date</TableHead>
                  <TableHead className={headClass}>Type</TableHead>
                  <TableHead className={headClass}>Amount</TableHead>
                  <TableHead className={headClass}>Reference</TableHead>
                  <TableHead className={headClass}>Period</TableHead>
                  <TableHead className={headClass}>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r._id} className="border-b border-border/60 align-top hover:bg-muted/30">
                    <TableCell className="px-4 py-3 text-sm">
                      {formatLifecycleDate(r.paidAt ?? r.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      <span className="font-medium">{KIND_LABEL[r.kind]}</span>
                      {r.notes ? (
                        <p className="mt-0.5 max-w-[16rem] break-words text-xs text-muted-foreground">{r.notes}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm tabular-nums">
                      {r.amount != null ? `${r.currency} ${r.amount.toLocaleString("en-IN")}` : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm break-all">{r.reference || "—"}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {r.kind === "grace_extension"
                        ? `Until ${formatLifecycleDate(r.periodEnd)}`
                        : r.periodStart
                          ? `${formatLifecycleDate(r.periodStart)} – ${formatLifecycleDate(r.periodEnd)}`
                          : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                      {r.recordedByName || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SeatUsageCard({
  seats,
  actions,
}: Readonly<{ seats: InstitutionBillingStatus["seats"]; actions?: ReactNode }>) {
  const total = seats.totalSeats ?? seats.allocated;
  const pct = total > 0 ? Math.min(100, Math.round((seats.used / total) * 100)) : 0;
  const rows = seats.rows.filter((r) => r.planId !== "free" && (r.purchased > 0 || r.used > 0));
  return (
    <Card className={lifecycleCardClass}>
      <CardHeader className="flex flex-col gap-3 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div>
          <CardTitle className="text-base">Seats</CardTitle>
          <CardDescription>
            {seats.used} of {total} seats in use. Inactive candidates free their seat.
          </CardDescription>
        </div>
        {actions}
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <Progress value={pct} className="h-2" aria-label="Seat usage" />
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No seat plans configured.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <li key={row.planId} className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{seatPlanLabel(row.planId)}</p>
                <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                  <span className="font-semibold text-foreground">{row.used}</span> / {row.purchased} used
                </p>
                <p
                  className={
                    row.remaining <= 0
                      ? "mt-0.5 text-xs font-medium text-destructive"
                      : "mt-0.5 text-xs text-muted-foreground"
                  }
                >
                  {row.remaining <= 0 ? "No seats left" : `${row.remaining} available`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

const ACTION_LABEL: Record<string, string> = {
  status_change: "Status changed",
  go_live: "Marked live",
  mode_changed: "Demo / live switched",
  payment_recorded: "Payment recorded",
  grace_extended: "Grace extended",
  auto_suspended: "Auto-suspended for non-renewal",
  features_updated: "Products updated",
};

function statusText(s?: string) {
  return s && s in ACCOUNT_STATUS_LABELS ? ACCOUNT_STATUS_LABELS[s as AccountStatus] : s;
}

export function ActivityTimeline({ events }: Readonly<{ events: AccountStatusEventRow[] }>) {
  if (events.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>;
  }
  return (
    <ol className="relative space-y-4 border-l border-border/70 pl-5">
      {events.map((e) => (
        <li key={e._id} className="relative">
          <span
            aria-hidden
            className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-[#7367F0]"
          />
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold text-foreground">
              {ACTION_LABEL[e.action] ?? e.action}
              {e.action === "status_change" && e.toStatus
                ? `: ${statusText(e.fromStatus) ?? "—"} → ${statusText(e.toStatus)}`
                : e.action === "mode_changed" && e.toStatus
                  ? `: ${e.fromStatus ?? "—"} → ${e.toStatus}`
                  : ""}
            </p>
            <span className="text-xs text-muted-foreground">
              {new Date(e.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {e.targetType === "user" ? `${e.targetName || "Candidate"} · ` : ""}
            by {e.actorName || (e.actorRole === "system" ? "Automation" : e.actorRole) || "—"}
          </p>
          {e.reason ? <p className="mt-1 break-words text-sm text-foreground/90">{e.reason}</p> : null}
        </li>
      ))}
    </ol>
  );
}
