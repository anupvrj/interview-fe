"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, Flag, Link2, Loader2, Pencil, Play, Plus, RefreshCw, RotateCcw, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { appPrimaryButton, appSurfaceMuted } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import { hackathonAdminApi, toHackathonError, type AdminHackathonOverview, type HackathonPhase } from "../api";
import { HACKATHON_ADMIN_PATH, hackathonPublicPath } from "../config";
import { formatIst } from "../copy";
import { hackathonKeys } from "../hooks";
import { HackathonAdminField, hackathonAdminControlClass } from "./HackathonAdminField";
import { isoToIstInput, istInputToIso } from "./time";

const adminKeys = { list: hackathonKeys.adminList };

export function phaseBadge(phase: HackathonPhase) {
  if (phase === "live") return <Badge variant="success">Live</Badge>;
  if (phase === "ended") return <Badge variant="neutral">Ended</Badge>;
  return <Badge variant="warning">Upcoming</Badge>;
}

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
};

function fmtHistoryValue(value?: string) {
  if (!value) return "—";
  return /^\d{4}-\d{2}-\d{2}T/.test(value) ? formatIst(value) : value;
}

function HackathonManageCard({ hackathon }: Readonly<{ hackathon: AdminHackathonOverview }>) {
  const queryClient = useQueryClient();
  const [startsAt, setStartsAt] = useState(isoToIstInput(hackathon.startsAt));
  const [endsAt, setEndsAt] = useState(isoToIstInput(hackathon.endsAt));
  const [grace, setGrace] = useState(String(hackathon.interviewGraceMinutes));
  const [limit, setLimit] = useState(hackathon.maxCompletions === null ? "" : String(hackathon.maxCompletions));
  const [reminderEnabled, setReminderEnabled] = useState(hackathon.reminders?.enabled !== false);
  const [reminderHour, setReminderHour] = useState(String(hackathon.reminders?.hour ?? 9));
  const [reminderStart, setReminderStart] = useState(isoToIstInput(hackathon.reminders?.startAt));
  const [confirm, setConfirm] = useState<null | "start" | "end" | "limit" | "publish" | "unpublish" | "notify">(null);
  const [pendingSave, setPendingSave] = useState<Parameters<typeof hackathonAdminApi.update>[1] | null>(null);
  const [reopenEndsAt, setReopenEndsAt] = useState("");
  const [reopenNote, setReopenNote] = useState("");

  useEffect(() => {
    setStartsAt(isoToIstInput(hackathon.startsAt));
    setEndsAt(isoToIstInput(hackathon.endsAt));
    setGrace(String(hackathon.interviewGraceMinutes));
    setLimit(hackathon.maxCompletions === null ? "" : String(hackathon.maxCompletions));
    setReminderEnabled(hackathon.reminders?.enabled !== false);
    setReminderHour(String(hackathon.reminders?.hour ?? 9));
    setReminderStart(isoToIstInput(hackathon.reminders?.startAt));
  }, [hackathon.startsAt, hackathon.endsAt, hackathon.interviewGraceMinutes, hackathon.maxCompletions, hackathon.reminders]);

  const onUpdated = (data: AdminHackathonOverview) => {
    queryClient.setQueryData<AdminHackathonOverview[]>(adminKeys.list, (prev) =>
      prev?.map((h) => (h.hackathonId === data.hackathonId ? data : h)),
    );
  };
  const onError = (err: unknown) => toast.error(toHackathonError(err).message);

  const save = useMutation({
    mutationFn: (body: Parameters<typeof hackathonAdminApi.update>[1]) => hackathonAdminApi.update(hackathon.hackathonId, body),
    onSuccess: ({ data, warning }) => {
      onUpdated(data);
      setConfirm(null);
      setPendingSave(null);
      if (warning) toast.warning(warning);
      else toast.success("Hackathon settings saved");
    },
    onError,
  });
  const start = useMutation({
    mutationFn: () => hackathonAdminApi.start(hackathon.hackathonId),
    onSuccess: (data) => {
      onUpdated(data);
      toast.success("Hackathon is live");
      setConfirm(null);
    },
    onError,
  });
  const end = useMutation({
    mutationFn: () => hackathonAdminApi.end(hackathon.hackathonId),
    onSuccess: (data) => {
      onUpdated(data);
      toast.success("Hackathon ended");
      setConfirm(null);
    },
    onError,
  });
  const reopen = useMutation({
    mutationFn: ({ iso, note }: { iso: string; note: string }) => hackathonAdminApi.reopen(hackathon.hackathonId, iso, note),
    onSuccess: (data) => {
      onUpdated(data);
      setReopenEndsAt("");
      setReopenNote("");
      toast.success("Hackathon reopened");
    },
    onError,
  });
  const reconcile = useMutation({
    mutationFn: () => hackathonAdminApi.reconcile(hackathon.hackathonId),
    onSuccess: (r) => toast.success(`Checked ${r.reconciled} in-flight interviews, refreshed ${r.atsBackfilled} ATS scores`),
    onError,
  });
  const publish = useMutation({
    mutationFn: () => hackathonAdminApi.publish(hackathon.hackathonId),
    onSuccess: (data) => {
      onUpdated(data);
      toast.success("Hackathon is published. The public page is live.");
      setConfirm(null);
    },
    onError,
  });
  const unpublish = useMutation({
    mutationFn: () => hackathonAdminApi.unpublish(hackathon.hackathonId),
    onSuccess: (data) => {
      onUpdated(data);
      toast.success("Hackathon is a draft again");
      setConfirm(null);
    },
    onError,
  });
  const runNotifications = useMutation({
    mutationFn: () => hackathonAdminApi.runNotifications(hackathon.hackathonId),
    onSuccess: (result) => {
      setConfirm(null);
      toast.success(
        `Checked ${result.scanned} participants. Sent ${result.reminders} reminder${result.reminders === 1 ? "" : "s"}.`,
      );
    },
    onError,
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
    onError,
  });

  const onSave = () => {
    const body: Parameters<typeof hackathonAdminApi.update>[1] = {};
    if (hackathon.phase === "upcoming" && startsAt !== isoToIstInput(hackathon.startsAt)) {
      if (startsAt) {
        const iso = istInputToIso(startsAt);
        if (!iso) return toast.error("Enter a valid start date and time");
        body.startsAt = iso;
      } else {
        body.startsAt = null;
      }
    }
    if (hackathon.phase !== "ended" && endsAt && endsAt !== isoToIstInput(hackathon.endsAt)) {
      const iso = istInputToIso(endsAt);
      if (!iso) return toast.error("Enter a valid end date and time");
      body.endsAt = iso;
    }
    const graceNum = Number(grace);
    if (!Number.isInteger(graceNum) || graceNum < 0 || graceNum > 240) {
      return toast.error("Interview grace must be 0 to 240 minutes");
    }
    if (graceNum !== hackathon.interviewGraceMinutes) body.interviewGraceMinutes = graceNum;
    const trimmed = limit.trim();
    const limitNum = trimmed === "" ? null : Number(trimmed);
    if (limitNum !== null && (!Number.isInteger(limitNum) || limitNum < 1)) {
      return toast.error("Max participants must be a whole number, or empty for unlimited");
    }
    if (limitNum !== hackathon.maxCompletions) body.maxCompletions = limitNum;
    const hourNum = Number(reminderHour);
    if (!Number.isInteger(hourNum) || hourNum < 0 || hourNum > 23) {
      return toast.error("Reminder hour must be from 0 to 23 IST");
    }
    const startIso = reminderStart ? istInputToIso(reminderStart) : null;
    if (reminderStart && !startIso) return toast.error("Enter a valid reminder start date");
    const remindersChanged =
      reminderEnabled !== (hackathon.reminders?.enabled !== false) ||
      hourNum !== (hackathon.reminders?.hour ?? 9) ||
      (startIso ?? null) !== (hackathon.reminders?.startAt ?? null);
    if (remindersChanged) {
      body.reminders = { enabled: reminderEnabled, hour: hourNum, startAt: startIso };
    }
    if (Object.keys(body).length === 0) return toast.info("Nothing to save");
    if (
      body.maxCompletions !== undefined &&
      body.maxCompletions !== null &&
      body.maxCompletions <= hackathon.capacity.completedCount
    ) {
      setPendingSave(body);
      setConfirm("limit");
      return;
    }
    save.mutate(body);
  };

  const { counts, capacity } = hackathon;

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
            {hackathon.title} {phaseBadge(hackathon.phase)}
            {hackathon.visibility === "draft" ? <Badge variant="neutral">Draft</Badge> : <Badge variant="info">Published</Badge>}
            {capacity.isFull ? <Badge variant="danger">Full</Badge> : null}
          </CardTitle>
          <CardDescription>
            {capacity.maxCompletions !== null
              ? `${capacity.completedCount} / ${capacity.maxCompletions} completed, ${counts.in_progress} in progress.`
              : `${capacity.completedCount} completed, ${counts.in_progress} in progress. Unlimited spots.`}{" "}
            {hackathon.phase === "upcoming"
              ? hackathon.startsAt
                ? `Opens automatically on ${formatIst(hackathon.startsAt)}.`
                : "Not scheduled. Set a start time or click Start now."
              : hackathon.phase === "live"
                ? `Open for submissions until ${formatIst(hackathon.endsAt)}.`
                : `Closed ${formatIst(hackathon.endedAt ?? hackathon.endsAt)}.`}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`${HACKATHON_ADMIN_PATH}/${hackathon.hackathonId}/edit`}>
              <Pencil className="mr-1.5 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`${HACKATHON_ADMIN_PATH}/${hackathon.hackathonId}`}>
              <Users className="mr-1.5 h-4 w-4" /> View submissions
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportCsv.mutate()} disabled={exportCsv.isPending}>
            {exportCsv.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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

        <div className="grid gap-4 md:grid-cols-2">
          <HackathonAdminField
            id={`start-${hackathon.hackathonId}`}
            label="Start (IST)"
            hint={
              hackathon.phase === "upcoming"
                ? "Participants see “Hackathon will start soon. Stay tuned...” until this time."
                : `Started ${formatIst(hackathon.startedAt ?? hackathon.startsAt)}`
            }
          >
            <Input
              id={`start-${hackathon.hackathonId}`}
              type="datetime-local"
              className={hackathonAdminControlClass}
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              disabled={hackathon.phase !== "upcoming"}
            />
          </HackathonAdminField>
          <HackathonAdminField
            id={`end-${hackathon.hackathonId}`}
            label="End (IST)"
            hint="After this, nothing can be submitted and participants see “Hackathon is over”."
          >
            <Input
              id={`end-${hackathon.hackathonId}`}
              type="datetime-local"
              className={hackathonAdminControlClass}
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              disabled={hackathon.phase === "ended"}
            />
          </HackathonAdminField>
          <HackathonAdminField
            id={`remind-hour-${hackathon.hackathonId}`}
            label="Daily reminder hour (IST)"
            hint="One email per person inside a 6-hour window starting at this hour. Not in the first 24 hours after they register, unless the deadline is inside 48 hours."
          >
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                />
                Enabled
              </label>
              <Input
                id={`remind-hour-${hackathon.hackathonId}`}
                type="number"
                min={0}
                max={23}
                className={hackathonAdminControlClass}
                value={reminderHour}
                onChange={(e) => setReminderHour(e.target.value)}
                disabled={!reminderEnabled}
              />
            </div>
          </HackathonAdminField>
          <HackathonAdminField
            id={`remind-start-${hackathon.hackathonId}`}
            label="Start reminders (IST)"
            hint="Optional. Empty means as soon as the hackathon is live. Stops when submissions close."
          >
            <Input
              id={`remind-start-${hackathon.hackathonId}`}
              type="datetime-local"
              className={hackathonAdminControlClass}
              value={reminderStart}
              onChange={(e) => setReminderStart(e.target.value)}
              disabled={!reminderEnabled}
            />
          </HackathonAdminField>
          <HackathonAdminField
            id={`limit-${hackathon.hackathonId}`}
            label="Max participants"
            hint="Counted when a participant clicks Mark complete. When full, nobody new can start; people already in progress can finish. Leave empty for unlimited."
          >
            <Input
              id={`limit-${hackathon.hackathonId}`}
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="Unlimited"
              className={hackathonAdminControlClass}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </HackathonAdminField>
          <HackathonAdminField
            id={`grace-${hackathon.hackathonId}`}
            label="Interview grace (minutes)"
            hint="An interview started before the end still counts if it finishes within its length plus this grace."
          >
            <Input
              id={`grace-${hackathon.hackathonId}`}
              type="number"
              min={0}
              max={240}
              className={hackathonAdminControlClass}
              value={grace}
              onChange={(e) => setGrace(e.target.value)}
            />
          </HackathonAdminField>
        </div>

        <div className="flex flex-col gap-2 border-t border-border/60 pt-6 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" onClick={() => setConfirm("notify")} disabled={runNotifications.isPending}>
            {runNotifications.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
            Send due emails now
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">
            Runs the hourly check immediately. Welcome, challenge, and thank-you go only to people who have not received them. Reminders send only inside today’s window. Send a test from Notification Hub.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {hackathon.visibility === "draft" ? (
            <Button variant="outline" onClick={() => setConfirm("publish")}>
              Publish
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setConfirm("unpublish")}
              disabled={hackathon.phase !== "upcoming" || hackathon.participantCount > 0}
            >
              Unpublish
            </Button>
          )}
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
            <Link2 className="mr-1.5 h-4 w-4" /> Copy public link
          </Button>
          <Button onClick={onSave} disabled={save.isPending} className={appPrimaryButton}>
            {save.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Save settings
          </Button>
          {hackathon.phase === "upcoming" ? (
            <Button variant="outline" onClick={() => setConfirm("start")}>
              <Play className="mr-1.5 h-4 w-4" /> Start now
            </Button>
          ) : null}
          {hackathon.phase === "live" ? (
            <Button variant="outline" onClick={() => setConfirm("end")}>
              <Flag className="mr-1.5 h-4 w-4" /> End now
            </Button>
          ) : null}
          <Button variant="ghost" onClick={() => reconcile.mutate()} disabled={reconcile.isPending}>
            {reconcile.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
            Reconcile interviews
          </Button>
        </div>
        {hackathon.phase === "upcoming" && !hackathon.endsAt ? (
          <p className="text-xs text-muted-foreground">No end time set. It will stay open until you click End now.</p>
        ) : null}

        {hackathon.phase === "ended" ? (
          <div className={cn(appSurfaceMuted, "space-y-3 p-4")}>
            <p className="text-sm font-semibold text-foreground">Reopen submissions</p>
            <div className="grid gap-4 md:grid-cols-2">
              <HackathonAdminField id={`reopen-end-${hackathon.hackathonId}`} label="New end (IST)">
                <Input
                  id={`reopen-end-${hackathon.hackathonId}`}
                  type="datetime-local"
                  className={hackathonAdminControlClass}
                  value={reopenEndsAt}
                  onChange={(e) => setReopenEndsAt(e.target.value)}
                />
              </HackathonAdminField>
              <HackathonAdminField id={`reopen-note-${hackathon.hackathonId}`} label="Reason">
                <Textarea
                  id={`reopen-note-${hackathon.hackathonId}`}
                  rows={2}
                  className="w-full min-w-0"
                  value={reopenNote}
                  onChange={(e) => setReopenNote(e.target.value)}
                  placeholder="e.g. Extended after a platform outage"
                />
              </HackathonAdminField>
            </div>
            <Button
              variant="outline"
              disabled={reopen.isPending}
              onClick={() => {
                const iso = istInputToIso(reopenEndsAt);
                if (!iso) return toast.error("Enter a valid new end date and time");
                if (reopenNote.trim().length < 3) return toast.error("Add a short reason for reopening");
                reopen.mutate({ iso, note: reopenNote.trim() });
              }}
            >
              {reopen.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1.5 h-4 w-4" />}
              Reopen
            </Button>
          </div>
        ) : null}

        {hackathon.statusHistory.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">Change log</p>
            <ul className="divide-y divide-border/60 rounded-lg border border-border/60 text-sm">
              {hackathon.statusHistory.slice(0, 15).map((entry, i) => (
                <li key={`${entry.at}-${i}`} className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    <span className="font-medium text-foreground">{HISTORY_LABELS[entry.action] ?? entry.action}</span>
                    {entry.from !== undefined || entry.to !== undefined ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · {fmtHistoryValue(entry.from)} → {fmtHistoryValue(entry.to)}
                      </span>
                    ) : null}
                    {entry.note ? <span className="text-muted-foreground"> · “{entry.note}”</span> : null}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatIst(entry.at)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>

      <ConfirmationDialog
        open={confirm === "notify"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Send due hackathon emails now?"
        description="This uses the live templates and emails real participants who are due. It does not resend a welcome, challenge, or thank-you that already went out. Reminders still follow the daily window and skip anyone already reminded today."
        confirmText="Send due emails"
        onConfirm={() => runNotifications.mutate()}
        isLoading={runNotifications.isPending}
      />
      <ConfirmationDialog
        open={confirm === "start"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Start the hackathon now?"
        description={
          hackathon.endsAt
            ? `Participants can start submitting immediately. Submissions close on ${formatIst(hackathon.endsAt)}.`
            : "Participants can start submitting immediately. It stays open until you click End now."
        }
        confirmText="Start now"
        onConfirm={() => start.mutate()}
        isLoading={start.isPending}
      />
      <ConfirmationDialog
        open={confirm === "end"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="End the hackathon now?"
        description="Submissions close immediately and participants see “Hackathon is over”. Interviews already running can still finish within the grace window."
        confirmText="End now"
        variant="destructive"
        onConfirm={() => end.mutate()}
        isLoading={end.isPending}
      />
      <ConfirmationDialog
        open={confirm === "limit"}
        onOpenChange={(open) => {
          if (!open) {
            setConfirm(null);
            setPendingSave(null);
          }
        }}
        title="This will fill the hackathon immediately"
        description={`${hackathon.capacity.completedCount} participants have already marked complete. Setting the limit to ${pendingSave?.maxCompletions ?? "this number"} means nobody new can start Challenge 1. People already in progress can still finish.`}
        confirmText="Save and close new entries"
        onConfirm={() => {
          if (pendingSave) save.mutate(pendingSave);
        }}
        isLoading={save.isPending}
      />
      <ConfirmationDialog
        open={confirm === "publish"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Publish this hackathon?"
        description="Anyone with the public URL can see the event page. Registration still follows the start and end times."
        confirmText="Publish"
        onConfirm={() => publish.mutate()}
        isLoading={publish.isPending}
      />
      <ConfirmationDialog
        open={confirm === "unpublish"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Unpublish this hackathon?"
        description="The public page will 404 until you publish again. This is only allowed while upcoming and with zero registrations."
        confirmText="Unpublish"
        variant="destructive"
        onConfirm={() => unpublish.mutate()}
        isLoading={unpublish.isPending}
      />
    </Card>
  );
}

export function AdminHackathonsPage() {
  const list = useQuery({ queryKey: adminKeys.list, queryFn: hackathonAdminApi.list });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SuperAdminPageHeader />
        <Button asChild className={appPrimaryButton}>
          <Link href={`${HACKATHON_ADMIN_PATH}/new`}>
            <Plus className="mr-1.5 h-4 w-4" /> Create hackathon
          </Link>
        </Button>
      </div>
      {list.isLoading ? (
        <div className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading hackathons…
        </div>
      ) : list.isError ? (
        <Card>
          <CardContent className="py-8 text-sm text-destructive">
            {toHackathonError(list.error, "Couldn't load hackathons. Check that the Hackathon feature is enabled in Feature Controls.").message}
          </CardContent>
        </Card>
      ) : (list.data ?? []).length === 0 ? (
        <Card>
          <CardContent className="space-y-3 py-8 text-sm text-muted-foreground">
            <p>No hackathons yet. Create one to get a public page and participant dashboard.</p>
            <Button asChild className={appPrimaryButton}>
              <Link href={`${HACKATHON_ADMIN_PATH}/new`}>
                <Plus className="mr-1.5 h-4 w-4" /> Create hackathon
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        list.data!.map((h) => <HackathonManageCard key={h.hackathonId} hackathon={h} />)
      )}
    </div>
  );
}
