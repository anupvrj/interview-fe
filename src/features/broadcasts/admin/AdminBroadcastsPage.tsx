"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { useRequirePlatformAdmin } from "@/components/blog-admin/useRequirePlatformAdmin";
import { FormField } from "@/components/app/FormField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { formatIst } from "@/features/hackathon/copy";
import { broadcastsAdminApi } from "../api";
import { audienceLabel, BROADCASTS_ADMIN_PATH, STATUS_LABEL, STATUS_VARIANT } from "../presets";
import type { BroadcastSettings, EmailBroadcast } from "../types";

function whenLabel(b: EmailBroadcast): string {
  if (b.status === "scheduled" && b.scheduledAt) return `Sends ${formatIst(b.scheduledAt)}`;
  if (b.finishedAt) return formatIst(b.finishedAt);
  if (b.startedAt) return `Started ${formatIst(b.startedAt)}`;
  return `Edited ${formatIst(b.updatedAt)}`;
}

function WhatsappSettingsCard() {
  const [settings, setSettings] = useState<BroadcastSettings | null>(null);
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    broadcastsAdminApi
      .getSettings()
      .then((s) => {
        if (cancelled) return;
        setSettings(s);
        setSaved(JSON.stringify(s));
      })
      .catch(() => !cancelled && setSettings({ whatsappUrl: "", whatsappQrUrl: "" }));
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const next = await broadcastsAdminApi.updateSettings(settings);
      setSettings(next);
      setSaved(JSON.stringify(next));
      toast.success("WhatsApp community saved");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Couldn't save"));
    } finally {
      setSaving(false);
    }
  };

  const dirty = settings ? JSON.stringify(settings) !== saved : false;
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">WhatsApp community</CardTitle>
        <CardDescription>
          Used by every email that has “Show the WhatsApp community box” switched on: a QR code and a Join button.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {settings ? (
          <>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
              <FormField label="Invite link" htmlFor="bc-wa-url" hint="https://chat.whatsapp.com/…">
                <Input id="bc-wa-url" value={settings.whatsappUrl} maxLength={300} onChange={(e) => setSettings({ ...settings, whatsappUrl: e.target.value })} placeholder="https://chat.whatsapp.com/…" />
              </FormField>
              <FormField label="QR code image link" htmlFor="bc-wa-qr" hint="A hosted PNG, e.g. https://www.interviewtrix.com/brand/whatsapp-qr.png">
                <Input id="bc-wa-qr" value={settings.whatsappQrUrl} maxLength={500} onChange={(e) => setSettings({ ...settings, whatsappQrUrl: e.target.value })} placeholder="https://…/whatsapp-qr.png" />
              </FormField>
              <Button onClick={() => void save()} disabled={!dirty || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </div>
            {/^https:\/\//.test(settings.whatsappQrUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-provided external image
              <img src={settings.whatsappQrUrl} alt="WhatsApp QR code preview" className="h-28 w-28 rounded-lg border border-border bg-white object-contain p-1" />
            ) : null}
          </>
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </CardContent>
    </Card>
  );
}

export function AdminBroadcastsPage() {
  const { authorized, loading } = useRequirePlatformAdmin();
  const router = useRouter();
  const [rows, setRows] = useState<EmailBroadcast[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    const load = () =>
      broadcastsAdminApi
        .list()
        .then((list) => !cancelled && setRows(list))
        .catch((error: unknown) => !cancelled && setLoadError(getApiErrorMessage(error, "Couldn't load broadcasts")));
    void load();
    const timer = window.setInterval(() => void load(), 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [authorized]);

  const duplicate = async (b: EmailBroadcast) => {
    setBusyId(b._id);
    try {
      const copy = await broadcastsAdminApi.duplicate(b._id);
      router.push(`${BROADCASTS_ADMIN_PATH}/${copy._id}`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Couldn't duplicate"));
      setBusyId(null);
    }
  };

  const remove = async (b: EmailBroadcast) => {
    if (!window.confirm(`Delete “${b.name}”?`)) return;
    setBusyId(b._id);
    try {
      await broadcastsAdminApi.remove(b._id);
      setRows((prev) => (prev ?? []).filter((r) => r._id !== b._id));
      toast.success("Broadcast deleted");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Couldn't delete"));
    } finally {
      setBusyId(null);
    }
  };

  if (loading || !authorized) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader
        title="Email Broadcasts"
        description="Send one-off updates (hackathon live, halfway, closing, results) to a chosen audience. Every send needs a test email first, skips anyone emailed recently, and carries a one-click unsubscribe."
        actions={
          <Button asChild>
            <Link href={`${BROADCASTS_ADMIN_PATH}/new`}>
              <Plus className="h-4 w-4" />
              New broadcast
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {loadError ? <p className="p-6 text-sm text-destructive">{loadError}</p> : null}
          {!rows && !loadError ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : null}
          {rows && rows.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-foreground">No broadcasts yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Start from a ready-made hackathon update like “Day 1 · Hackathon is live”.</p>
              <Button asChild className="mt-4">
                <Link href={`${BROADCASTS_ADMIN_PATH}/new`}>
                  <Plus className="h-4 w-4" />
                  New broadcast
                </Link>
              </Button>
            </div>
          ) : null}
          {rows && rows.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Broadcast</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Sent</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((b) => (
                    <TableRow key={b._id}>
                      <TableCell className="max-w-[280px]">
                        <Link href={`${BROADCASTS_ADMIN_PATH}/${b._id}`} className="font-medium text-foreground hover:underline">
                          {b.name}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">{b.subject}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{audienceLabel(b.audience.type)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[b.status]}>{STATUS_LABEL[b.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {b.stats.total > 0 ? `${b.stats.sent} / ${b.stats.total}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{whenLabel(b)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`${BROADCASTS_ADMIN_PATH}/${b._id}`}>{b.status === "draft" ? "Edit" : "View"}</Link>
                          </Button>
                          <Button size="sm" variant="ghost" aria-label="Duplicate" title="Duplicate" disabled={busyId === b._id} onClick={() => void duplicate(b)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          {["draft", "cancelled", "failed"].includes(b.status) && b.stats.sent === 0 ? (
                            <Button size="sm" variant="ghost" aria-label="Delete" title="Delete" disabled={busyId === b._id} onClick={() => void remove(b)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <WhatsappSettingsCard />
    </div>
  );
}
