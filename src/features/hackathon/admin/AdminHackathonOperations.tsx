"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Download, Eye, Link2, Loader2, Pencil, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { appPrimaryButton, appSurfaceMuted } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import { hackathonAdminApi, toHackathonError, type AdminHackathonOverview } from "../api";
import { hackathonPublicPath } from "../config";
import { formatIst } from "../copy";
import { phaseBadge } from "./AdminHackathonsPage";
import { adminStatusValue } from "./hackathonAdminStatus";
import { hackathonAdminTabHref } from "./hackathonAdminNav";

const HISTORY_LABELS: Record<string, string> = {
  create: "Created",
  publish: "Published",
  unpublish: "Unpublished",
  update_copy: "Copy updated",
  start: "Started",
  end: "Ended",
  reopen: "Reopened",
  update_start_time: "Start time changed",
  update_end_time: "End time changed",
  update_limit: "Participant limit changed",
  update_grace: "Interview grace changed",
  update_reminders: "Reminder schedule changed",
  participant_suspend: "Participant suspended",
  participant_unsuspend: "Participant unsuspended",
  participant_delete: "Participant removed",
};

function fmtHistoryValue(value?: string) {
  if (!value) return "—";
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return value;
  const formatted = formatIst(value);
  return formatted === "—" ? value : formatted;
}

function scheduleSummary(hackathon: AdminHackathonOverview) {
  const parts: string[] = [];
  if (hackathon.startsAt) parts.push(`Start ${formatIst(hackathon.startsAt)}`);
  if (hackathon.endsAt) parts.push(`End ${formatIst(hackathon.endsAt)}`);
  if (hackathon.maxCompletions != null) parts.push(`Cap ${hackathon.maxCompletions}`);
  else parts.push("Unlimited cap");
  parts.push(`${hackathon.interviewGraceMinutes}m grace`);
  return parts.join(" · ");
}

export function AdminHackathonOperations({
  hackathon,
  variant = "card",
}: Readonly<{ hackathon: AdminHackathonOverview; variant?: "card" | "plain" }>) {
  const [confirmNotify, setConfirmNotify] = useState(false);

  const runNotifications = useMutation({
    mutationFn: () => hackathonAdminApi.runNotifications(hackathon.hackathonId),
    onSuccess: (result) => {
      setConfirmNotify(false);
      toast.success(
        `Checked ${result.scanned} participants. Sent ${result.reminders} reminder${result.reminders === 1 ? "" : "s"}.`,
      );
    },
    onError: (err) => toast.error(toHackathonError(err).message),
  });
  const reconcile = useMutation({
    mutationFn: () => hackathonAdminApi.reconcile(hackathon.hackathonId),
    onSuccess: (r) =>
      toast.success(
        `Reconciled ${r.reconciled} interviews, backfilled ${r.atsBackfilled} ATS scores, refreshed ${r.summariesRefreshed} summaries.`,
      ),
    onError: (err) => toast.error(toHackathonError(err).message),
  });
  const exportCsv = useMutation({
    mutationFn: () => hackathonAdminApi.exportCsv(hackathon.hackathonId),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${hackathon.slug}-participants.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (err) => toast.error(toHackathonError(err).message),
  });

  const { counts, capacity } = hackathon;
  const status = adminStatusValue(hackathon);
  const id = hackathon.hackathonId;

  const statsAndActions = (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ["Registered", counts.total],
          ["Not started", counts.registered],
          ["In progress", counts.in_progress],
          ["Completed", counts.completed],
          ["Spots left", capacity.spotsLeft === null ? "Unlimited" : capacity.spotsLeft],
        ].map(([label, value]) => (
          <div key={label} className={cn(appSurfaceMuted, "px-3 py-2.5")}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border/60 pt-5">
        <Button asChild className={appPrimaryButton}>
          <Link href={hackathonAdminTabHref(id, "edit")}>
            <Pencil className="mr-1.5 h-4 w-4" /> Edit hackathon
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={hackathonAdminTabHref(id, "submissions")}>
            <Users className="mr-1.5 h-4 w-4" /> Submissions
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            window.open(
              `${hackathonPublicPath(hackathon.slug)}${hackathon.visibility === "draft" ? "?preview=1" : ""}`,
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          <Eye className="mr-1.5 h-4 w-4" /> Preview
        </Button>
        <Button
          variant="outline"
          disabled={hackathon.visibility !== "published"}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(`${window.location.origin}${hackathonPublicPath(hackathon.slug)}`);
              toast.success("Public link copied");
            } catch {
              toast.error("Couldn't copy the link");
            }
          }}
        >
          <Link2 className="mr-1.5 h-4 w-4" /> Copy link
        </Button>
        <Button type="button" variant="outline" onClick={() => setConfirmNotify(true)} disabled={runNotifications.isPending}>
          {runNotifications.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
          Send due emails
        </Button>
        <Button variant="ghost" onClick={() => reconcile.mutate()} disabled={reconcile.isPending}>
          {reconcile.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
          Reconcile
        </Button>
      </div>

      {hackathon.statusHistory.length > 0 ? (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-foreground">Change log</summary>
          <ul className="mt-2 divide-y divide-border/60 rounded-lg border border-border/60">
            {hackathon.statusHistory.slice(0, 10).map((entry, i) => (
              <li key={`${entry.at}-${i}`} className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <span className="font-medium text-foreground">{HISTORY_LABELS[entry.action] ?? entry.action}</span>
                  {entry.from !== undefined || entry.to !== undefined ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {fmtHistoryValue(entry.from)} → {fmtHistoryValue(entry.to)}
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-muted-foreground">{formatIst(entry.at)}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );

  const body = (
    <>
      {variant === "card" ? (
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
              {hackathon.title}{" "}
              {status === "draft" ? <Badge variant="neutral">Draft</Badge> : phaseBadge(hackathon.phase)}
              {capacity.isFull ? <Badge variant="danger">Full</Badge> : null}
            </CardTitle>
            <CardDescription>
              <span className="font-mono text-[11px] text-muted-foreground/90">/{hackathon.slug}</span>
              {" · "}
              {capacity.maxCompletions !== null
                ? `${capacity.completedCount} / ${capacity.maxCompletions} completed, ${counts.in_progress} in progress.`
                : `${capacity.completedCount} completed, ${counts.in_progress} in progress. Unlimited spots.`}{" "}
              {status === "draft"
                ? "Public page hidden."
                : hackathon.phase === "upcoming"
                  ? hackathon.startsAt
                    ? `Opens ${formatIst(hackathon.startsAt)}.`
                    : "Not scheduled yet."
                  : hackathon.phase === "live"
                    ? `Open until ${formatIst(hackathon.endsAt)}.`
                    : `Closed ${formatIst(hackathon.endedAt ?? hackathon.endsAt)}.`}
            </CardDescription>
            <p className="text-xs text-muted-foreground">{scheduleSummary(hackathon)}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportCsv.mutate()} disabled={exportCsv.isPending}>
            {exportCsv.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
            Export CSV
          </Button>
        </CardHeader>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-sm text-muted-foreground">{scheduleSummary(hackathon)}</p>
          <Button variant="outline" size="sm" onClick={() => exportCsv.mutate()} disabled={exportCsv.isPending}>
            {exportCsv.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
            Export CSV
          </Button>
        </div>
      )}

      {variant === "plain" ? (
        <div className="space-y-5">{statsAndActions}</div>
      ) : (
        <CardContent className="space-y-5">{statsAndActions}</CardContent>
      )}

      <ConfirmationDialog
        open={confirmNotify}
        onOpenChange={(open) => !open && setConfirmNotify(false)}
        title="Send due hackathon emails now?"
        description="Uses live templates for participants who are due. Reminders still respect the daily window."
        confirmText="Send due emails"
        onConfirm={() => runNotifications.mutate()}
        isLoading={runNotifications.isPending}
      />
    </>
  );

  if (variant === "plain") return <div className="space-y-5">{body}</div>;
  return <Card>{body}</Card>;
}

/** Compact card for the all-hackathons list. */
export function HackathonManageCard({ hackathon }: Readonly<{ hackathon: AdminHackathonOverview }>) {
  return <AdminHackathonOperations hackathon={hackathon} variant="card" />;
}
