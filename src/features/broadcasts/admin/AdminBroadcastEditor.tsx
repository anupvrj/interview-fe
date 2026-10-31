"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Copy, Loader2, MailCheck, Send, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { useRequirePlatformAdmin } from "@/components/blog-admin/useRequirePlatformAdmin";
import { FormField } from "@/components/app/FormField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AppSelect } from "@/components/ui/app-select";
import { usePublishedHackathons } from "@/features/hackathon/hooks";
import { formatIst } from "@/features/hackathon/copy";
import { FormSection, ToggleRow } from "@/features/site-popups/admin/PopupFormBits";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import { broadcastsAdminApi } from "../api";
import {
  AUDIENCE_OPTIONS,
  BADGE_TONE_OPTIONS,
  BROADCAST_PRESETS,
  BROADCASTS_ADMIN_PATH,
  EVENT_DURATION_OPTIONS,
  EXCLUSION_LABELS,
  LINK_VARIABLES,
  STATUS_LABEL,
  STATUS_VARIANT,
  VARIABLES,
  audienceLabel,
  blankBroadcast,
  toInput,
  usesEventVariables,
} from "../presets";
import type { AudiencePreview, BroadcastContent, BroadcastEvent, BroadcastInput, EmailBroadcast } from "../types";
import { BroadcastRecipientsCard } from "./BroadcastRecipientsCard";
import { BroadcastSendDialog } from "./BroadcastSendDialog";

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

/** ISO time ⇄ the "YYYY-MM-DDTHH:mm" value of a datetime-local input, always in IST. */
function isoToIstInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + 330 * 60_000).toISOString().slice(0, 16);
}
function istInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}:00+05:30`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function EmailPreview({ form }: Readonly<{ form: BroadcastInput }>) {
  const payload = useMemo(
    () => JSON.stringify({ subject: form.subject, preheader: form.preheader, content: form.content, audience: form.audience, event: form.event }),
    [form.audience, form.content, form.event, form.preheader, form.subject],
  );
  const debounced = useDebounced(payload, 700);
  const [out, setOut] = useState<{ subject: string; html: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    const body = JSON.parse(debounced) as Pick<BroadcastInput, "subject" | "preheader" | "content" | "audience" | "event">;
    if (!body.content.title && !body.content.body) {
      setOut(null);
      return;
    }
    let cancelled = false;
    broadcastsAdminApi
      .preview(body)
      .then((res) => {
        if (cancelled) return;
        setOut(res);
        setError(null);
      })
      .catch((err: unknown) => !cancelled && setError(getApiErrorMessage(err, "Preview unavailable")));
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <CardTitle className="text-base">Preview</CardTitle>
        <div className="flex rounded-lg border border-border p-0.5 text-xs">
          {(["desktop", "mobile"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={cn("rounded-md px-2.5 py-1 font-medium capitalize", device === d ? "bg-[#7367F0] text-white" : "text-muted-foreground")}
            >
              {d}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-border px-3 py-2 text-sm">
          <span className="text-xs text-muted-foreground">Subject: </span>
          <span className="font-medium text-foreground">{out?.subject || form.subject || "—"}</span>
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <div className="flex justify-center overflow-hidden rounded-lg border border-border bg-[#040b17]">
          {out ? (
            <iframe
              title="Email preview"
              sandbox=""
              srcDoc={out.html}
              className="h-[640px] border-0 bg-[#040b17]"
              style={{ width: device === "mobile" ? 375 : "100%" }}
            />
          ) : (
            <p className="p-10 text-center text-sm text-[#9eb2ca]">Add a heading and message to see the email.</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Shown with your name. Each person sees their own name and unsubscribe link.</p>
      </CardContent>
    </Card>
  );
}

function AudienceSummary({ preview, loading, error }: Readonly<{ preview: AudiencePreview | null; loading: boolean; error: string | null }>) {
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!preview) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Counting…
      </p>
    );
  }
  const excluded = (Object.keys(EXCLUSION_LABELS) as Array<keyof typeof EXCLUSION_LABELS>).filter((k) => preview.exclusions[k] > 0);
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-baseline gap-2">
        <Users className="h-4 w-4 self-center text-[#7367F0]" />
        <span className={cn("text-2xl font-semibold tabular-nums text-foreground", loading && "opacity-50")}>
          {preview.count.toLocaleString("en-IN")}
        </span>
        <span className="text-sm text-muted-foreground">people will get this email</span>
      </div>
      {excluded.length > 0 ? (
        <div className="mt-3 space-y-1 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">Left out automatically</p>
          {excluded.map((k) => (
            <div key={k} className="flex justify-between text-xs text-muted-foreground">
              <span>{EXCLUSION_LABELS[k]}</span>
              <span className="tabular-nums">{preview.exclusions[k]}</span>
            </div>
          ))}
        </div>
      ) : null}
      {preview.sample.length > 0 ? (
        <p className="mt-3 truncate text-xs text-muted-foreground">e.g. {preview.sample.join(", ")}</p>
      ) : null}
    </div>
  );
}

function ProgressCard({ doc }: Readonly<{ doc: EmailBroadcast }>) {
  const { total, sent, skipped, failed } = doc.stats;
  const done = sent + skipped + failed;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Delivery</CardTitle>
        <CardDescription>
          {doc.status === "scheduled" && doc.scheduledAt ? `Scheduled for ${formatIst(doc.scheduledAt)}.` : null}
          {doc.status === "sending" ? "Sending now, a few emails per second. You can leave this page." : null}
          {doc.status === "sent" && doc.finishedAt ? `Finished ${formatIst(doc.finishedAt)}.` : null}
          {doc.status === "cancelled" ? "Stopped. Nobody else will get it." : null}
          {doc.status === "failed" ? "Stopped because of an error. Resume to continue with the people not emailed yet." : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {total > 0 ? (
          <>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-[#7367F0] transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[
                ["Recipients", total],
                ["Sent", sent],
                ["Skipped", skipped],
                ["Failed", failed],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-lg border border-border px-3 py-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}
        {doc.lastError ? (
          <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {doc.lastError}
          </p>
        ) : null}
        {doc.exclusions ? (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Left out when the send started</p>
            {(Object.keys(EXCLUSION_LABELS) as Array<keyof typeof EXCLUSION_LABELS>)
              .filter((k) => (doc.exclusions?.[k] ?? 0) > 0)
              .map((k) => (
                <div key={k} className="flex justify-between text-xs text-muted-foreground">
                  <span>{EXCLUSION_LABELS[k]}</span>
                  <span className="tabular-nums">{doc.exclusions?.[k]}</span>
                </div>
              ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function AdminBroadcastEditor({ broadcastId }: Readonly<{ broadcastId: string }>) {
  const isNew = broadcastId === "new";
  const router = useRouter();
  const { authorized, loading } = useRequirePlatformAdmin();
  const hackathons = usePublishedHackathons();
  const [doc, setDoc] = useState<EmailBroadcast | null>(null);
  const [form, setForm] = useState<BroadcastInput | null>(isNew ? blankBroadcast() : null);
  const [saved, setSaved] = useState("");
  const [presetKey, setPresetKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [audience, setAudience] = useState<AudiencePreview | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [audienceError, setAudienceError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const adopt = useCallback((next: EmailBroadcast) => {
    setDoc(next);
    const f = toInput(next);
    setForm(f);
    setSaved(JSON.stringify(f));
  }, []);

  useEffect(() => {
    if (!authorized || isNew) return;
    let cancelled = false;
    broadcastsAdminApi
      .get(broadcastId)
      .then((b) => !cancelled && adopt(b))
      .catch((error: unknown) => !cancelled && setLoadError(getApiErrorMessage(error, "Couldn't load this broadcast")));
    return () => {
      cancelled = true;
    };
  }, [adopt, authorized, broadcastId, isNew]);

  // Live progress while scheduled / sending.
  const liveStatus = doc?.status === "scheduled" || doc?.status === "sending";
  useEffect(() => {
    if (!liveStatus || isNew) return;
    const id = window.setInterval(() => {
      broadcastsAdminApi.get(broadcastId).then(setDoc).catch(() => undefined);
    }, 3_000);
    return () => window.clearInterval(id);
  }, [broadcastId, isNew, liveStatus]);

  const readOnly = !isNew && doc !== null && doc.status !== "draft";
  const eventNeeded = form ? usesEventVariables(form) : false;
  const dirty = form ? JSON.stringify(form) !== saved : false;

  // Audience count (debounced).
  const audienceKey = useDebounced(form ? JSON.stringify([form.audience, form.cooldownHours]) : "", 500);
  useEffect(() => {
    if (!form || readOnly || !authorized) return;
    const [aud, cooldownHours] = JSON.parse(audienceKey || "[null,0]") as [BroadcastInput["audience"] | null, number];
    if (!aud) return;
    if (aud.type !== "all_users" && !aud.hackathonSlug) {
      setAudienceError("Pick the hackathon.");
      return;
    }
    let cancelled = false;
    setAudienceLoading(true);
    broadcastsAdminApi
      .audience({ audience: aud, cooldownHours, broadcastId: isNew ? undefined : broadcastId })
      .then((res) => {
        if (cancelled) return;
        setAudience(res);
        setAudienceError(null);
      })
      .catch((error: unknown) => !cancelled && setAudienceError(getApiErrorMessage(error, "Couldn't count the audience")))
      .finally(() => !cancelled && setAudienceLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounced key carries the inputs
  }, [audienceKey, authorized, readOnly]);

  const hackathonOptions = useMemo(() => {
    const rows = (hackathons.data ?? []).map((h) => ({ value: h.slug, label: h.title }));
    if (form?.audience.hackathonSlug && !rows.some((r) => r.value === form.audience.hackathonSlug)) {
      rows.unshift({ value: form.audience.hackathonSlug, label: form.audience.hackathonSlug });
    }
    return rows;
  }, [form?.audience.hackathonSlug, hackathons.data]);

  const patch = <K extends keyof BroadcastInput>(key: K, value: BroadcastInput[K]) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  const patchContent = (value: Partial<BroadcastContent>) => setForm((prev) => (prev ? { ...prev, content: { ...prev.content, ...value } } : prev));
  const patchEvent = (value: Partial<BroadcastEvent>) => setForm((prev) => (prev ? { ...prev, event: { ...prev.event, ...value } } : prev));

  const insertVariable = (key: string) => {
    if (!form) return;
    const token = `{{${key}}}`;
    const el = bodyRef.current;
    const text = form.content.body;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    patchContent({ body: `${text.slice(0, start)}${token}${text.slice(end)}` });
    window.requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const save = async (): Promise<EmailBroadcast | null> => {
    if (!form) return null;
    setSaving(true);
    try {
      const result = isNew ? await broadcastsAdminApi.create(form) : await broadcastsAdminApi.update(broadcastId, form);
      adopt(result);
      if (isNew) {
        toast.success("Draft saved");
        router.replace(`${BROADCASTS_ADMIN_PATH}/${result._id}`);
      } else {
        toast.success("Saved");
      }
      return result;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Couldn't save"));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    const to = testTo
      .split(/[\s,;]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    let current = doc;
    if (isNew || dirty) {
      current = await save();
      if (!current) return;
    }
    if (!current) return;
    setTesting(true);
    try {
      const updated = await broadcastsAdminApi.test(current._id, to);
      adopt(updated);
      toast.success(`Test sent to ${updated.testSentTo.join(", ")}. Check the inbox (and spam folder).`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Couldn't send the test"));
    } finally {
      setTesting(false);
    }
  };

  const confirmSend = async (scheduledAtIso: string | null) => {
    if (!doc || !audience) return;
    setSending(true);
    try {
      const updated = await broadcastsAdminApi.send(doc._id, { expectedCount: audience.count, scheduledAt: scheduledAtIso });
      setDoc(updated);
      setSendOpen(false);
      toast.success(scheduledAtIso ? "Scheduled" : "Sending started");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Couldn't start the send"));
      // Audience changed underneath: refresh the count so the dialog shows the new number.
      broadcastsAdminApi
        .audience({ audience: doc.audience, cooldownHours: doc.cooldownHours, broadcastId: doc._id })
        .then(setAudience)
        .catch(() => undefined);
    } finally {
      setSending(false);
    }
  };

  const act = async (fn: () => Promise<EmailBroadcast>, ok: string) => {
    setBusy(true);
    try {
      adopt(await fn());
      toast.success(ok);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Something went wrong"));
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async () => {
    if (!doc) return;
    setBusy(true);
    try {
      const copy = await broadcastsAdminApi.duplicate(doc._id);
      router.push(`${BROADCASTS_ADMIN_PATH}/${copy._id}`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Couldn't duplicate"));
      setBusy(false);
    }
  };

  if (loading || !authorized || (!form && !loadError)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!form) {
    return (
      <div className="space-y-6">
        <SuperAdminPageHeader backHref={BROADCASTS_ADMIN_PATH} backLabel="All broadcasts" />
        <p className="text-sm text-destructive">{loadError}</p>
      </div>
    );
  }

  const c = form.content;
  const tested = Boolean(doc?.testedCurrent) && !dirty;
  const canSend = !readOnly && !isNew && tested && !!audience && audience.count > 0 && !audienceLoading;
  const audienceHint = AUDIENCE_OPTIONS.find((o) => o.value === form.audience.type)?.hint;

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader
        title={isNew ? "New broadcast" : form.name || "Broadcast"}
        description={
          readOnly
            ? `${audienceLabel(form.audience.type)} · ${STATUS_LABEL[doc!.status]}`
            : "Write the email, check who gets it, send yourself a test, then send."
        }
        backHref={BROADCASTS_ADMIN_PATH}
        backLabel="All broadcasts"
        unsavedChanges={!readOnly && dirty}
        actions={
          readOnly && doc ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANT[doc.status]}>{STATUS_LABEL[doc.status]}</Badge>
              {doc.status === "scheduled" || doc.status === "sending" ? (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(doc.status === "sending" ? "Stop sending? People not emailed yet won't get it." : "Cancel the schedule? It goes back to draft.")) {
                      void act(() => broadcastsAdminApi.cancel(doc._id), doc.status === "sending" ? "Stopped" : "Back to draft");
                    }
                  }}
                >
                  {doc.status === "sending" ? "Stop sending" : "Cancel schedule"}
                </Button>
              ) : null}
              {doc.status === "failed" ? (
                <Button variant="outline" disabled={busy} onClick={() => void act(() => broadcastsAdminApi.resume(doc._id), "Resumed")}>
                  Resume
                </Button>
              ) : null}
              <Button variant="outline" disabled={busy} onClick={() => void duplicate()}>
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
            </div>
          ) : (
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
              <Button asChild variant="outline">
                <Link href={BROADCASTS_ADMIN_PATH}>Cancel</Link>
              </Button>
              <Button variant="outline" onClick={() => void save()} disabled={saving || (!dirty && !isNew)}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isNew ? "Save draft" : "Save"}
              </Button>
            </div>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_480px]">
        <div className="min-w-0 space-y-6">
          {readOnly && doc ? <ProgressCard doc={doc} /> : null}

          {!readOnly ? (
            <FormSection title="Start from a template" description="Fills in the email and a suggested audience. Everything stays editable.">
              <div className="grid gap-2 sm:grid-cols-2">
                {BROADCAST_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      if (form.content.body && !window.confirm("Replace the current email with this template?")) return;
                      setPresetKey(p.key);
                      setForm({ ...p.input, name: form.name && !isNew ? form.name : p.input.name });
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left transition-colors",
                      presetKey === p.key ? "border-[#7367F0] bg-[#7367F0]/10" : "border-border hover:border-[#7367F0]/50",
                    )}
                  >
                    <p className="text-sm font-medium text-foreground">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.when}</p>
                  </button>
                ))}
              </div>
            </FormSection>
          ) : null}

          <fieldset disabled={readOnly} className="min-w-0 space-y-6 disabled:opacity-90">
            <FormSection title="Basics" description="The name is only for you. Keep the subject short and specific; avoid ALL CAPS and lots of ! — spam filters notice.">
              <FormField label="Broadcast name" htmlFor="bc-name" required>
                <Input id="bc-name" value={form.name} maxLength={120} onChange={(e) => patch("name", e.target.value)} placeholder="Day 1 — hackathon is live" />
              </FormField>
              <FormField label="Subject line" htmlFor="bc-subject" required hint={`${form.subject.length}/150 · variables like {{first_name}} work here`}>
                <Input id="bc-subject" value={form.subject} maxLength={150} onChange={(e) => patch("subject", e.target.value)} placeholder="{{hackathon_title}} is live — join free" />
              </FormField>
              <FormField label="Preview text" htmlFor="bc-preheader" hint="The grey line inboxes show after the subject.">
                <Input id="bc-preheader" value={form.preheader} maxLength={160} onChange={(e) => patch("preheader", e.target.value)} />
              </FormField>
            </FormSection>

            <FormSection
              title="Event details"
              description={
                eventNeeded
                  ? "This email uses event placeholders, so fill these in. The Google Calendar link is made from the title, start and length."
                  : "Only for live event emails. Insert {{event_title}}, {{event_date}}, {{event_time}}, {{event_join_url}} or {{event_calendar_url}} and they're filled from here."
              }
            >
              <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                <FormField label="Event title" htmlFor="bc-event-title" required={eventNeeded} hint="{{event_title}} · also the calendar entry name.">
                  <Input id="bc-event-title" value={form.event.title} maxLength={120} onChange={(e) => patchEvent({ title: e.target.value })} placeholder="InterviewTrix Live Launch & Hiring Games" />
                </FormField>
                <FormField label="Join link" htmlFor="bc-event-join" required={eventNeeded} hint="{{event_join_url}} · the Google Meet (or Zoom) link.">
                  <Input id="bc-event-join" type="url" value={form.event.joinUrl} maxLength={500} onChange={(e) => patchEvent({ joinUrl: e.target.value.trim() })} placeholder="https://meet.google.com/abc-defg-hij" />
                </FormField>
              </div>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px] [&>*]:min-w-0">
                <FormField label="Starts (IST)" htmlFor="bc-event-start" required={eventNeeded} hint="{{event_date}} and {{event_time}}, e.g. 31 October 2026 · 7 PM IST.">
                  <Input id="bc-event-start" type="datetime-local" value={isoToIstInput(form.event.startsAt)} onChange={(e) => patchEvent({ startsAt: istInputToIso(e.target.value) })} />
                </FormField>
                <FormField label="Length" htmlFor="bc-event-duration" hint="{{event_duration}}">
                  <AppSelect id="bc-event-duration" value={String(form.event.durationMinutes)} onChange={(v) => patchEvent({ durationMinutes: Number(v) })} options={EVENT_DURATION_OPTIONS} />
                </FormField>
              </div>
            </FormSection>

            <FormSection title="Message">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px] [&>*]:min-w-0">
                <FormField label="Small label" htmlFor="bc-eyebrow" hint="Top-left pill.">
                  <Input id="bc-eyebrow" value={c.eyebrow} maxLength={60} onChange={(e) => patchContent({ eyebrow: e.target.value })} placeholder="Day 1" />
                </FormField>
                <FormField label="Status badge" htmlFor="bc-badge" hint="Top-right. Optional.">
                  <Input id="bc-badge" value={c.badgeLabel} maxLength={30} onChange={(e) => patchContent({ badgeLabel: e.target.value })} placeholder="Live now" />
                </FormField>
                <FormField label="Badge colour" htmlFor="bc-tone">
                  <AppSelect id="bc-tone" value={c.badgeTone} onChange={(v) => patchContent({ badgeTone: v as BroadcastContent["badgeTone"] })} options={BADGE_TONE_OPTIONS} />
                </FormField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                <FormField label="Heading" htmlFor="bc-title" required>
                  <Input id="bc-title" value={c.title} maxLength={120} onChange={(e) => patchContent({ title: e.target.value })} placeholder="{{hackathon_title}} is" />
                </FormField>
                <FormField label="Highlighted end of heading" htmlFor="bc-accent" hint="Shown in blue.">
                  <Input id="bc-accent" value={c.titleAccent} maxLength={80} onChange={(e) => patchContent({ titleAccent: e.target.value })} placeholder="live" />
                </FormField>
              </div>
              <FormField
                label="Message"
                htmlFor="bc-body"
                required
                hint="Blank line = new paragraph. “- ” starts a list item, “## ” a small section label. **bold** and [link text](https://…) work. On a line of its own: [[steps]], [[prizes]] or [[guests]] add the picture blocks from the hackathon page, and [[askwin]] the “ask a question, win Claude Pro or an Amazon voucher” box."
              >
                <Textarea id="bc-body" ref={bodyRef} rows={9} value={c.body} maxLength={5000} onChange={(e) => patchContent({ body: e.target.value })} />
              </FormField>
              {!readOnly ? (
                <div className="flex flex-wrap gap-1.5">
                  <span className="mr-1 self-center text-xs text-muted-foreground">Insert:</span>
                  {VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground hover:border-[#7367F0]/60"
                      title={`{{${v.key}}}`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              ) : null}
              <FormField label="Highlight box" htmlFor="bc-highlight" hint="One key line, e.g. the deadline. Optional.">
                <Input id="bc-highlight" value={c.highlight} maxLength={600} onChange={(e) => patchContent({ highlight: e.target.value })} placeholder="Submissions close **{{ends_at}}**." />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                <FormField label="Button text" htmlFor="bc-cta-label" hint="Leave empty for no button.">
                  <Input id="bc-cta-label" value={c.ctaLabel} maxLength={40} onChange={(e) => patchContent({ ctaLabel: e.target.value })} placeholder="Start your challenge" />
                </FormField>
                <FormField label="Button link" htmlFor="bc-cta-url" hint={`Full https:// link or ${LINK_VARIABLES.join(", ")}`}>
                  <Input id="bc-cta-url" value={c.ctaUrl} maxLength={500} onChange={(e) => patchContent({ ctaUrl: e.target.value })} placeholder="{{dashboard_url}}" />
                </FormField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                <FormField label="Second button text" htmlFor="bc-cta2-label" hint="Optional (e.g. Add to calendar).">
                  <Input
                    id="bc-cta2-label"
                    value={c.secondaryCtaLabel ?? ""}
                    maxLength={40}
                    onChange={(e) => patchContent({ secondaryCtaLabel: e.target.value })}
                    placeholder="Add to calendar"
                  />
                </FormField>
                <FormField label="Second button link" htmlFor="bc-cta2-url" hint="Optional second CTA URL.">
                  <Input
                    id="bc-cta2-url"
                    value={c.secondaryCtaUrl ?? ""}
                    maxLength={500}
                    onChange={(e) => patchContent({ secondaryCtaUrl: e.target.value })}
                    placeholder="{{event_calendar_url}}"
                  />
                </FormField>
              </div>
              <ToggleRow
                label="Show the WhatsApp community box"
                hint="QR code + Join button. Set the link and QR on the Email Broadcasts page."
                on={c.showWhatsapp}
                onChange={(showWhatsapp) => patchContent({ showWhatsapp })}
                disabled={readOnly}
              />
              <FormField label="Small print" htmlFor="bc-foot" hint="Under the button. Optional.">
                <Input id="bc-foot" value={c.footnote} maxLength={400} onChange={(e) => patchContent({ footnote: e.target.value })} />
              </FormField>
            </FormSection>

            <FormSection title="Who gets it" description="Bounced, spam-reported and unsubscribed addresses are always left out.">
              <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                <FormField label="Audience" htmlFor="bc-audience" hint={audienceHint}>
                  <AppSelect
                    id="bc-audience"
                    value={form.audience.type}
                    onChange={(v) => patch("audience", { ...form.audience, type: v as BroadcastInput["audience"]["type"] })}
                    options={AUDIENCE_OPTIONS.map(({ value, label }) => ({ value, label }))}
                  />
                </FormField>
                <FormField
                  label="Hackathon"
                  htmlFor="bc-hackathon"
                  hint={form.audience.type === "all_users" ? "Used for {{hackathon_title}}, dates and links." : undefined}
                >
                  {hackathonOptions.length > 0 ? (
                    <AppSelect id="bc-hackathon" value={form.audience.hackathonSlug} onChange={(v) => patch("audience", { ...form.audience, hackathonSlug: v })} options={hackathonOptions} />
                  ) : (
                    <Input id="bc-hackathon" value={form.audience.hackathonSlug} onChange={(e) => patch("audience", { ...form.audience, hackathonSlug: e.target.value.trim() })} />
                  )}
                </FormField>
              </div>
              <FormField
                label="Skip people emailed in the last (hours)"
                htmlFor="bc-cooldown"
                hint="Anyone who got another broadcast or a hackathon reminder in this window is left out. 20 hours keeps it to about one email a day. 0 turns it off."
              >
                <Input
                  id="bc-cooldown"
                  type="number"
                  min={0}
                  max={168}
                  value={form.cooldownHours}
                  onChange={(e) => patch("cooldownHours", Math.min(168, Math.max(0, Math.round(Number(e.target.value) || 0))))}
                  className="max-w-[160px]"
                />
              </FormField>
              {!readOnly ? <AudienceSummary preview={audience} loading={audienceLoading} error={audienceError} /> : null}
            </FormSection>
          </fieldset>

          {readOnly && doc ? <BroadcastRecipientsCard broadcastId={doc._id} live={liveStatus} /> : null}
        </div>

        <div className="min-w-0 space-y-6 xl:sticky xl:top-6 xl:self-start">
          {!readOnly ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Send</CardTitle>
                <CardDescription>Two steps, so nothing goes out by accident.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {tested ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <MailCheck className="h-4 w-4 text-[#7367F0]" />}
                    1. Send yourself a test
                  </p>
                  <Input
                    value={testTo}
                    onChange={(e) => setTestTo(e.target.value)}
                    placeholder="Your admin email (or up to 5, comma separated)"
                    aria-label="Test recipients"
                    className="w-full"
                  />
                  <Button variant="outline" className="w-full" onClick={() => void sendTest()} disabled={testing || saving}>
                    {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
                    {dirty || isNew ? "Save and send test" : "Send test"}
                  </Button>
                  {doc?.testSentAt ? (
                    <p className="text-xs text-muted-foreground">
                      {tested ? "Latest version tested" : "Edited since the last test — send another"} · {formatIst(doc.testSentAt)}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2 border-t border-border pt-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Send className="h-4 w-4 text-[#7367F0]" />
                    2. Send or schedule
                  </p>
                  <Button className="w-full" onClick={() => setSendOpen(true)} disabled={!canSend}>
                    <Send className="h-4 w-4" />
                    {audience ? `Send to ${audience.count.toLocaleString("en-IN")} people…` : "Send…"}
                  </Button>
                  {!tested ? <p className="text-xs text-muted-foreground">Unlocks after a test of the latest version.</p> : null}
                </div>
                <p className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  Every email has a one-click unsubscribe. People who got a hackathon email from us don’t get the daily
                  reminder for the next 12 hours.
                </p>
              </CardContent>
            </Card>
          ) : null}
          <EmailPreview form={form} />
        </div>
      </div>

      {audience && doc ? (
        <BroadcastSendDialog
          open={sendOpen}
          onOpenChange={setSendOpen}
          count={audience.count}
          audience={audienceLabel(form.audience.type)}
          subject={form.subject}
          sending={sending}
          onConfirm={(iso) => void confirmSend(iso)}
        />
      ) : null}
    </div>
  );
}
