"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { useRequirePlatformAdmin } from "@/components/blog-admin/useRequirePlatformAdmin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi, type AdminResumeTemplateRow } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { TEMPLATES_CATALOG } from "@/configs/resume-templates/templates-catalog";
import {
  forgetResumeTemplateAvailability,
  RESUME_TEMPLATE_AVAILABILITY_QUERY_KEY,
} from "@/lib/resume-template-availability";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<string, string> = {
  simple: "Popular",
  modern: "Modern",
  creative: "Creative",
};

function TemplateSwitch({
  on,
  disabled,
  label,
  onToggle,
}: Readonly<{ on: boolean; disabled?: boolean; label: string; onToggle: () => void }>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? `Disable ${label}` : `Enable ${label}`}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        on ? "bg-[#7367F0]" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "pointer-events-none mt-0.5 block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          on ? "translate-x-[1.35rem]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export default function SuperAdminResumeTemplatesPage() {
  const { authorized, loading } = useRequirePlatformAdmin();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<AdminResumeTemplateRow[] | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    adminApi
      .listResumeTemplateSettings()
      .then((list) => {
        if (!cancelled) setRows(list);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(getApiErrorMessage(error, "Failed to load resume templates"));
      });
    return () => {
      cancelled = true;
    };
  }, [authorized]);

  const thumbnails = useMemo(
    () => new Map(TEMPLATES_CATALOG.map((item) => [item.id, item.thumbnail])),
    [],
  );
  const enabledCount = rows?.filter((row) => row.enabled).length ?? 0;

  const toggle = async (row: AdminResumeTemplateRow) => {
    const next = !row.enabled;
    if (!next && enabledCount <= 1) {
      toast.error("At least one resume template must stay enabled.");
      return;
    }
    setSavingId(row.id);
    try {
      const list = await adminApi.setResumeTemplateEnabled(row.id, next);
      setRows(list);
      forgetResumeTemplateAvailability();
      await queryClient.invalidateQueries({ queryKey: RESUME_TEMPLATE_AVAILABILITY_QUERY_KEY });
      toast.success(
        next
          ? `${row.name} is available to everyone`
          : `${row.name} is hidden from template lists`,
      );
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update template"));
    } finally {
      setSavingId(null);
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
      <SuperAdminPageHeader />

      <Card>
        <CardContent className="flex flex-col gap-1 py-4 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">
              {rows ? `${enabledCount} of ${rows.length} templates enabled.` : "Loading templates…"}
            </span>{" "}
            A disabled template is hidden from the resume builder, the editor&apos;s Change
            Template list, ATS Improve, the AI Resume Builder page and the Claude connector, and
            can&apos;t be picked for a new or switched resume.
          </p>
          <p>Resumes already using a disabled template keep working and still render with it.</p>
        </CardContent>
      </Card>

      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      <Card>
        <CardContent className="px-0 py-0 sm:px-0">
          {!rows ? (
            <div className="flex justify-center px-5 py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Template</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Resumes using it</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enabled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const thumb = thumbnails.get(row.id);
                    return (
                      <TableRow key={row.id} className={cn(!row.enabled && "opacity-70")}>
                        <TableCell className="min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded border border-border/60 bg-white">
                              {thumb ? (
                                <Image
                                  src={thumb}
                                  alt=""
                                  fill
                                  sizes="40px"
                                  className="object-cover object-top"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{row.name}</p>
                              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                {row.id}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="neutral">{CATEGORY_LABEL[row.category] ?? row.category}</Badge>
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {row.resumeCount.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          {row.enabled ? (
                            <Badge variant="success">Enabled</Badge>
                          ) : (
                            <Badge variant="neutral">Disabled</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <TemplateSwitch
                            on={row.enabled}
                            label={row.name}
                            disabled={savingId === row.id}
                            onToggle={() => void toggle(row)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
