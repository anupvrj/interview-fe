"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { useRequirePlatformAdmin } from "@/components/blog-admin/useRequirePlatformAdmin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { formatIst } from "@/features/hackathon/copy";
import { sitePopupsAdminApi, SITE_POPUPS_QUERY_KEY } from "../api";
import type { SitePopup } from "../types";
import { SITE_POPUPS_ADMIN_PATH } from "./AdminSitePopupEditor";
import { PopupSwitch } from "./PopupFormBits";
import { DESIGN_OPTIONS, PAGE_PRESETS } from "./presets";

function designLabel(design: SitePopup["design"]) {
  return DESIGN_OPTIONS.find((d) => d.value === design)?.label ?? design;
}

function pagesSummary(pages: string[]) {
  if (pages.length === 0) return "No pages";
  const names = pages.map((p) => PAGE_PRESETS.find((preset) => preset.pattern === p)?.label ?? p);
  return names.length > 3 ? `${names.slice(0, 3).join(", ")} +${names.length - 3}` : names.join(", ");
}

function scheduleBadge(popup: SitePopup) {
  const now = Date.now();
  const start = popup.schedule?.startsAt ? new Date(popup.schedule.startsAt).getTime() : null;
  const end = popup.schedule?.endsAt ? new Date(popup.schedule.endsAt).getTime() : null;
  if (!popup.enabled) return <Badge variant="neutral">Off</Badge>;
  if (end && end <= now) return <Badge variant="warning">Ended</Badge>;
  if (start && start > now) return <Badge variant="info">Scheduled</Badge>;
  return <Badge variant="success">Live</Badge>;
}

export function AdminSitePopupsPage() {
  const { authorized, loading } = useRequirePlatformAdmin();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [popups, setPopups] = useState<SitePopup[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    sitePopupsAdminApi
      .list()
      .then((rows) => !cancelled && setPopups(rows))
      .catch((error: unknown) => !cancelled && setLoadError(getApiErrorMessage(error, "Couldn't load popups")));
    return () => {
      cancelled = true;
    };
  }, [authorized]);

  const refreshPublic = () => queryClient.invalidateQueries({ queryKey: SITE_POPUPS_QUERY_KEY });
  const replace = (updated: SitePopup) => setPopups((prev) => (prev ?? []).map((p) => (p._id === updated._id ? updated : p)));

  const toggle = async (popup: SitePopup) => {
    setBusyId(popup._id);
    try {
      replace(await sitePopupsAdminApi.setEnabled(popup._id, !popup.enabled));
      await refreshPublic();
      toast.success(popup.enabled ? `${popup.name} is off` : `${popup.name} is live`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Couldn't update the popup"));
    } finally {
      setBusyId(null);
    }
  };

  const duplicate = async (popup: SitePopup) => {
    setBusyId(popup._id);
    try {
      const copy = await sitePopupsAdminApi.duplicate(popup._id);
      router.push(`${SITE_POPUPS_ADMIN_PATH}/${copy._id}`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Couldn't duplicate the popup"));
      setBusyId(null);
    }
  };

  const remove = async (popup: SitePopup) => {
    if (!window.confirm(`Delete “${popup.name}”? This can't be undone.`)) return;
    setBusyId(popup._id);
    try {
      await sitePopupsAdminApi.remove(popup._id);
      setPopups((prev) => (prev ?? []).filter((p) => p._id !== popup._id));
      await refreshPublic();
      toast.success("Popup deleted");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Couldn't delete the popup"));
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
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link href={`${SITE_POPUPS_ADMIN_PATH}/new`}>
              <Plus className="h-4 w-4" />
              Add a popup
            </Link>
          </Button>
        }
      />

      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      <Card>
        <CardContent className="px-0 py-0 sm:px-0">
          {popups === null && !loadError ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (popups ?? []).length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No popups yet. Click Add a popup to create one.</p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Popup</TableHead>
                    <TableHead>Design</TableHead>
                    <TableHead>Shows on</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Live</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(popups ?? []).map((popup) => (
                    <TableRow key={popup._id}>
                      <TableCell className="min-w-0 max-w-sm">
                        <Link href={`${SITE_POPUPS_ADMIN_PATH}/${popup._id}`} className="font-medium text-foreground hover:text-[#7367F0]">
                          {popup.name}
                        </Link>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {[popup.content.title, popup.content.titleAccent].filter(Boolean).join(" ") || "No title"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {popup.trigger.delaySeconds > 0 ? `${popup.trigger.delaySeconds}s` : null}
                          {popup.trigger.scrollPercent > 0 ? `${popup.trigger.delaySeconds > 0 ? " · " : ""}${popup.trigger.scrollPercent}% scroll` : null}
                          {popup.trigger.exitIntent ? " · exit intent" : null}
                          {` · hides ${popup.frequency.dismissCooldownHours}h after close`}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">{designLabel(popup.design)}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px] text-sm text-muted-foreground">{pagesSummary(popup.targeting.pages)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {scheduleBadge(popup)}
                          {popup.schedule?.endsAt ? <p className="text-xs text-muted-foreground">Until {formatIst(popup.schedule.endsAt)}</p> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <PopupSwitch on={popup.enabled} disabled={busyId === popup._id} onChange={() => void toggle(popup)} label={popup.enabled ? "Turn popup off" : "Turn popup on"} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`${SITE_POPUPS_ADMIN_PATH}/${popup._id}`}>Edit</Link>
                          </Button>
                          <Button size="sm" variant="ghost" aria-label="Duplicate" title="Duplicate" disabled={busyId === popup._id} onClick={() => void duplicate(popup)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label="Delete"
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                            disabled={busyId === popup._id}
                            onClick={() => void remove(popup)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
