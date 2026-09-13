"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { FormField } from "@/components/app/FormField";
import { useRequirePlatformAdmin } from "@/components/blog-admin/useRequirePlatformAdmin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/ui/app-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import type {
  PlatformFeature,
  PlatformFeatureStatus,
} from "@/lib/platform-features";
import type { VoiceModelUsageInsights } from "@/lib/super-admin-insights";
import { VoiceHighlightTag } from "@/components/interview/VoiceHighlightTag";
import { VoiceModelUsagePanel } from "@/components/super-admin/VoiceModelUsagePanel";
import {
  formatVoiceAllowedDurations,
  inferVoiceHighlightStyle,
  normalizeVoiceAllowedDurations,
  VOICE_INTERVIEW_DURATIONS,
  type VoiceHighlightStyle,
} from "@/lib/voiceProviders";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { PLATFORM_FEATURES_QUERY_KEY } from "@/hooks/usePlatformFeatures";

const VOICE_STATUSES: { value: PlatformFeatureStatus; label: string }[] = [
  { value: "disabled", label: "Disabled (Super Admin only)" },
  { value: "enabled", label: "Enabled (admins only)" },
  { value: "beta", label: "Beta (everyone, labeled Beta)" },
  { value: "live", label: "Live (everyone)" },
];

const DEFAULT_VOICE_CREDITS_PER_MINUTE = 5;

const HIGHLIGHT_STYLE_OPTIONS: { value: VoiceHighlightStyle; label: string }[] =
  [
    { value: "popular", label: "Popular — gold pulse" },
    { value: "trending", label: "Trending — pink shimmer" },
    { value: "flash", label: "Flash — shine sweep" },
    { value: "new", label: "New — green pulse" },
    { value: "hot", label: "Hot — orange flicker" },
  ];

function statusBadge(status: PlatformFeatureStatus) {
  if (status === "live") return <Badge variant="success">Live</Badge>;
  if (status === "enabled") return <Badge variant="info">Enabled</Badge>;
  if (status === "beta") return <Badge variant="warning">Beta</Badge>;
  return <Badge variant="neutral">Disabled</Badge>;
}

function withVoiceDefaults(item: PlatformFeature): PlatformFeature {
  return {
    ...item,
    creditsPerMinute: item.creditsPerMinute ?? DEFAULT_VOICE_CREDITS_PER_MINUTE,
    highlightTag: item.highlightTag ?? "",
    decisionHint: item.decisionHint ?? "",
    allowedDurations: normalizeVoiceAllowedDurations(item.allowedDurations),
  };
}

function FeatureLiveSwitch({
  on,
  disabled,
  onToggle,
}: Readonly<{
  on: boolean;
  disabled?: boolean;
  onToggle: () => void;
}>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? "Disable voice model" : "Enable voice model"}
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

export default function SuperAdminVoiceModelsPage() {
  const { authorized, loading } = useRequirePlatformAdmin();
  const queryClient = useQueryClient();
  const [features, setFeatures] = useState<PlatformFeature[]>([]);
  const [editDraft, setEditDraft] = useState<PlatformFeature | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [usage, setUsage] = useState<VoiceModelUsageInsights | null>(null);

  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    adminApi
      .listPlatformFeatures()
      .then((list) => {
        if (cancelled) return;
        setFeatures(list.filter((item) => item.category === "voice"));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        toast.error(
          getApiErrorMessage(error, "Failed to load voice models"),
        );
      });
    adminApi
      .getVoiceModelUsage()
      .then((data) => {
        if (!cancelled) setUsage(data);
      })
      .catch((error: unknown) => {
        console.error(error);
      });
    return () => {
      cancelled = true;
    };
  }, [authorized]);

  const usageByKey = useMemo(() => {
    const map = new Map(
      (usage?.models ?? []).map((model) => [model.featureKey, model]),
    );
    return map;
  }, [usage]);

  const applyUpdated = (updated: PlatformFeature) => {
    setFeatures((prev) =>
      prev.map((item) => {
        if (item.key === updated.key) return { ...item, ...updated };
        if (updated.isDefaultVoice) {
          return { ...item, isDefaultVoice: false };
        }
        return item;
      }),
    );
    setEditDraft((prev) => {
      if (!prev) return prev;
      if (prev.key === updated.key) return { ...prev, ...updated };
      if (updated.isDefaultVoice) {
        return { ...prev, isDefaultVoice: false };
      }
      return prev;
    });
  };

  const refreshPublicCache = async () => {
    await queryClient.invalidateQueries({
      queryKey: PLATFORM_FEATURES_QUERY_KEY,
    });
  };

  const toggleEnabled = async (feature: PlatformFeature) => {
    const nextStatus: PlatformFeatureStatus =
      feature.status === "disabled" ? "live" : "disabled";
    if (
      nextStatus === "live" &&
      feature.credentialReady === false
    ) {
      toast.error(
        `${feature.name} cannot go live without API credentials and env enablement.`,
      );
      return;
    }
    setSavingKey(feature.key);
    try {
      const updated = await adminApi.updatePlatformFeature(feature.key, {
        status: nextStatus,
      });
      applyUpdated(updated);
      await refreshPublicCache();
      toast.success(
        nextStatus === "live"
          ? `${feature.name} is live for everyone`
          : `${feature.name} is disabled`,
      );
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update voice model"));
    } finally {
      setSavingKey(null);
    }
  };

  const saveEdit = async () => {
    if (!editDraft) return;
    const name = editDraft.name.trim();
    if (!name) {
      toast.error("Display label is required");
      return;
    }
    if (name.length > 80) {
      toast.error("Display label must be 80 characters or fewer");
      return;
    }
    const creditsPerMinute = Number(editDraft.creditsPerMinute);
    if (
      !Number.isFinite(creditsPerMinute) ||
      creditsPerMinute < 1 ||
      creditsPerMinute > 1000
    ) {
      toast.error("Credits per minute must be between 1 and 1000");
      return;
    }
    const highlightTag = editDraft.highlightTag?.trim() ?? "";
    if (highlightTag.length > 24) {
      toast.error("Highlight tag must be 24 characters or fewer");
      return;
    }
    const decisionHint = editDraft.decisionHint?.trim() ?? "";
    if (decisionHint.length > 120) {
      toast.error("Decision hint must be 120 characters or fewer");
      return;
    }
    const allowedDurations = normalizeVoiceAllowedDurations(
      editDraft.allowedDurations,
    );
    if (allowedDurations.length === 0) {
      toast.error("Select at least one interview duration");
      return;
    }
    setSavingEdit(true);
    try {
      const updated = await adminApi.updatePlatformFeature(editDraft.key, {
        name,
        status: editDraft.status,
        creditsPerMinute: Math.round(creditsPerMinute),
        isDefaultVoice: Boolean(editDraft.isDefaultVoice),
        highlightTag,
        highlightStyle: highlightTag
          ? editDraft.highlightStyle || inferVoiceHighlightStyle(highlightTag)
          : "",
        allowedDurations,
        decisionHint,
      });
      applyUpdated(updated);
      setEditDraft(null);
      await refreshPublicCache();
      toast.success(`${name} updated`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update voice model"));
    } finally {
      setSavingEdit(false);
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
        <CardContent className="px-0 py-0 sm:px-0">
          {features.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No voice models found.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Model</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Durations</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Live</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features.map((feature) => {
                    const tag = feature.highlightTag?.trim();
                    return (
                      <TableRow key={feature.key}>
                        <TableCell className="min-w-0 max-w-sm">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <p className="font-medium text-foreground">
                              {feature.name}
                            </p>
                            {feature.isDefaultVoice ? (
                              <Badge variant="info">Default</Badge>
                            ) : null}
                            {tag ? (
                              <VoiceHighlightTag
                                label={tag}
                                style={
                                  feature.highlightStyle ||
                                  inferVoiceHighlightStyle(tag)
                                }
                              />
                            ) : null}
                          </div>
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">
                            {feature.description || "No description"}
                          </p>
                          {feature.credentialReady === false ? (
                            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                              Credentials missing
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-foreground">
                          {feature.creditsPerMinute ??
                            DEFAULT_VOICE_CREDITS_PER_MINUTE}{" "}
                          / min
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-foreground">
                          {formatVoiceAllowedDurations(feature.allowedDurations)}
                        </TableCell>
                        <TableCell>{statusBadge(feature.status)}</TableCell>
                        <TableCell>
                          <FeatureLiveSwitch
                            on={feature.status !== "disabled"}
                            disabled={savingKey === feature.key}
                            onToggle={() => void toggleEnabled(feature)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="outline"
                            aria-label={`Edit ${feature.name}`}
                            onClick={() =>
                              setEditDraft(withVoiceDefaults(feature))
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
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

      <Dialog
        open={Boolean(editDraft)}
        onOpenChange={(open) => {
          if (!open && !savingEdit) setEditDraft(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit voice model</DialogTitle>
            <DialogDescription>
              Update the label, credits, durations, default, and highlight tag
              shown on the new-interview form.
            </DialogDescription>
          </DialogHeader>

          {editDraft ? (
            <div className="grid gap-4 py-2">
              {editDraft.credentialReady === false ? (
                <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                  API credentials are missing or this provider is env-disabled.
                  Live and Beta cannot be turned on until keys are configured.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Credentials look ready on this server.
                </p>
              )}

              <AppSelect
                value={editDraft.status}
                onChange={(value) =>
                  setEditDraft({
                    ...editDraft,
                    status: value as PlatformFeatureStatus,
                  })
                }
                options={VOICE_STATUSES.map((option) => ({
                  ...option,
                  disabled:
                    (option.value === "live" || option.value === "beta") &&
                    editDraft.credentialReady === false,
                }))}
              />

              <FormField
                label="Display label"
                htmlFor="voice-edit-display-label"
                required
                hint="Shown on the new-interview Voice AI dropdown."
              >
                <Input
                  id="voice-edit-display-label"
                  maxLength={80}
                  value={editDraft.name}
                  onChange={(event) =>
                    setEditDraft({ ...editDraft, name: event.target.value })
                  }
                  placeholder="e.g. InterviewTrix Voice"
                />
              </FormField>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Available durations
                </p>
                <p className="text-xs text-muted-foreground">
                  Users still see this model in the dropdown for other lengths,
                  but those options are disabled.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {VOICE_INTERVIEW_DURATIONS.map((minutes) => {
                    const checked = normalizeVoiceAllowedDurations(
                      editDraft.allowedDurations,
                    ).includes(minutes);
                    return (
                      <label
                        key={minutes}
                        htmlFor={`voice-edit-duration-${minutes}`}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5",
                          checked
                            ? "border-[#7367F0]/40 bg-[#7367F0]/[0.06]"
                            : "border-border/70",
                        )}
                      >
                        <input
                          id={`voice-edit-duration-${minutes}`}
                          type="checkbox"
                          aria-label={`${minutes} minute interviews`}
                          checked={checked}
                          onChange={(event) => {
                            const current = normalizeVoiceAllowedDurations(
                              editDraft.allowedDurations,
                            );
                            const next = event.target.checked
                              ? [...new Set([...current, minutes])].sort(
                                  (a, b) => a - b,
                                )
                              : current.filter((item) => item !== minutes);
                            setEditDraft({
                              ...editDraft,
                              allowedDurations:
                                next.length > 0
                                  ? next
                                  : current,
                            });
                            if (next.length === 0) {
                              toast.error(
                                "Select at least one interview duration",
                              );
                            }
                          }}
                          className="h-4 w-4 shrink-0 accent-[#7367F0]"
                        />
                        <span className="text-sm font-medium text-foreground">
                          {minutes} min
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <FormField
                label="Credits per minute"
                htmlFor="voice-edit-credits"
                hint="Charged per billed minute of a live interview using this voice."
              >
                <Input
                  id="voice-edit-credits"
                  type="number"
                  min={1}
                  max={1000}
                  step={1}
                  value={
                    editDraft.creditsPerMinute ??
                    DEFAULT_VOICE_CREDITS_PER_MINUTE
                  }
                  onChange={(event) =>
                    setEditDraft({
                      ...editDraft,
                      creditsPerMinute: Number(event.target.value),
                    })
                  }
                />
              </FormField>

              <label
                htmlFor="voice-edit-default"
                className={cn(
                  "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5",
                  editDraft.isDefaultVoice
                    ? "border-[#7367F0]/40 bg-[#7367F0]/[0.06]"
                    : "border-border/70",
                )}
              >
                <input
                  id="voice-edit-default"
                  type="checkbox"
                  aria-label="Default for new interviews"
                  checked={Boolean(editDraft.isDefaultVoice)}
                  onChange={(event) =>
                    setEditDraft({
                      ...editDraft,
                      isDefaultVoice: event.target.checked,
                    })
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#7367F0]"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    Default for new interviews
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Pre-selected on the interview form when this model is live.
                  </span>
                </span>
              </label>

              <FormField
                label="Decision hint"
                htmlFor="voice-edit-decision-hint"
                hint="One short line under the model name in the interview dropdown."
              >
                <Input
                  id="voice-edit-decision-hint"
                  maxLength={120}
                  value={editDraft.decisionHint ?? ""}
                  onChange={(event) =>
                    setEditDraft({
                      ...editDraft,
                      decisionHint: event.target.value,
                    })
                  }
                  placeholder="Best for Hindi and Indian accents"
                />
              </FormField>

              <FormField
                label="Highlight tag"
                htmlFor="voice-edit-highlight-tag"
                hint="Leave empty for no tag. Text like Popular or Trending appears next to the name."
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id="voice-edit-highlight-tag"
                    maxLength={24}
                    value={editDraft.highlightTag ?? ""}
                    onChange={(event) => {
                      const highlightTag = event.target.value;
                      setEditDraft({
                        ...editDraft,
                        highlightTag,
                        highlightStyle:
                          editDraft.highlightStyle ||
                          inferVoiceHighlightStyle(highlightTag),
                      });
                    }}
                    placeholder="Popular, Trending, New…"
                    className="min-w-0 flex-1"
                  />
                  {editDraft.highlightTag?.trim() ? (
                    <VoiceHighlightTag
                      label={editDraft.highlightTag}
                      style={
                        editDraft.highlightStyle ||
                        inferVoiceHighlightStyle(editDraft.highlightTag)
                      }
                    />
                  ) : null}
                </div>
              </FormField>

              <FormField
                label="Highlight animation"
                htmlFor="voice-edit-highlight-style"
                hint="Shown only when a highlight tag is set."
              >
                <AppSelect
                  id="voice-edit-highlight-style"
                  value={
                    editDraft.highlightStyle ||
                    inferVoiceHighlightStyle(editDraft.highlightTag ?? "flash")
                  }
                  onChange={(value) =>
                    setEditDraft({
                      ...editDraft,
                      highlightStyle: value as VoiceHighlightStyle,
                    })
                  }
                  options={HIGHLIGHT_STYLE_OPTIONS}
                  disabled={!editDraft.highlightTag?.trim()}
                />
              </FormField>
            </div>
          ) : null}

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDraft(null)}
              disabled={savingEdit}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void saveEdit()}
              disabled={savingEdit}
            >
              {savingEdit ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {usage ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              Usage by model
            </h2>
            <p className="text-sm text-muted-foreground">
              How often each voice is used and the credits it consumes
            </p>
          </div>
          <div className="grid gap-4">
            {features.map((feature) => {
              const usageRow = usageByKey.get(feature.key);
              if (!usageRow) return null;
              return (
                <VoiceModelUsagePanel
                  key={feature.key}
                  name={feature.name}
                  row={usageRow}
                  mix={usage.models}
                />
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
