"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { FormField } from "@/components/app/FormField";
import { ClientCacheAdminCard } from "@/components/admin/ClientCacheAdminCard";
import { useRequirePlatformAdmin } from "@/components/blog-admin/useRequirePlatformAdmin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  parseFeaturePathText,
  slugifyFeatureKey,
  splitFeatureControlPaths,
  uniqueFeaturePaths,
} from "@/lib/platform-features";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { PLATFORM_FEATURES_QUERY_KEY } from "@/hooks/usePlatformFeatures";

const PRODUCT_STATUSES: { value: PlatformFeatureStatus; label: string }[] = [
  { value: "disabled", label: "Disabled (Super Admin only)" },
  { value: "enabled", label: "Enabled (admins only)" },
  { value: "live", label: "Live (everyone)" },
];

type FeatureFormState = {
  name: string;
  key: string;
  description: string;
  status: PlatformFeatureStatus;
  pathText: string;
  unavailableTitle: string;
  unavailableMessage: string;
};

const EMPTY_CREATE: FeatureFormState = {
  name: "",
  key: "",
  description: "",
  status: "disabled",
  pathText: "",
  unavailableTitle: "",
  unavailableMessage: "",
};

function statusBadge(status: PlatformFeatureStatus) {
  if (status === "live") return <Badge variant="success">Live</Badge>;
  if (status === "enabled") return <Badge variant="info">Enabled</Badge>;
  if (status === "beta") return <Badge variant="warning">Beta</Badge>;
  return <Badge variant="neutral">Disabled</Badge>;
}

function toForm(feature: PlatformFeature): FeatureFormState {
  return {
    name: feature.name,
    key: feature.key,
    description: feature.description,
    status: feature.status,
    pathText: uniqueFeaturePaths(feature).join("\n"),
    unavailableTitle: feature.unavailableTitle,
    unavailableMessage: feature.unavailableMessage,
  };
}

function controlPathsFromText(pathText: string) {
  return splitFeatureControlPaths(parseFeaturePathText(pathText));
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
      aria-label={on ? "Disable feature" : "Enable feature"}
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

function FeatureFields({
  form,
  onChange,
  keyLocked,
  syncKeyFromName,
  idPrefix,
}: Readonly<{
  form: FeatureFormState;
  onChange: (next: FeatureFormState) => void;
  keyLocked?: boolean;
  syncKeyFromName?: boolean;
  idPrefix: string;
}>) {
  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" htmlFor={`${idPrefix}-name`} required>
          <Input
            id={`${idPrefix}-name`}
            className="w-full"
            value={form.name}
            onChange={(event) => {
              const name = event.target.value;
              onChange({
                ...form,
                name,
                key:
                  keyLocked || !syncKeyFromName
                    ? form.key
                    : slugifyFeatureKey(name),
              });
            }}
            placeholder="Job Board"
          />
        </FormField>
        <FormField
          label="Key"
          htmlFor={`${idPrefix}-key`}
          hint={
            keyLocked
              ? "Key cannot be changed after create."
              : "Stable slug used in the API. Auto-filled from the name."
          }
        >
          <Input
            id={`${idPrefix}-key`}
            className="w-full"
            value={form.key}
            disabled={keyLocked}
            onChange={(event) =>
              onChange({
                ...form,
                key: slugifyFeatureKey(event.target.value),
              })
            }
            placeholder="job_board"
          />
        </FormField>
      </div>

      <FormField label="Description" htmlFor={`${idPrefix}-description`}>
        <Input
          id={`${idPrefix}-description`}
          className="w-full"
          value={form.description}
          onChange={(event) =>
            onChange({ ...form, description: event.target.value })
          }
          placeholder="What this surface is"
        />
      </FormField>

      <FormField label="Status" htmlFor={`${idPrefix}-status`}>
        <AppSelect
          id={`${idPrefix}-status`}
          value={form.status}
          onChange={(value) =>
            onChange({ ...form, status: value as PlatformFeatureStatus })
          }
          options={PRODUCT_STATUSES}
        />
      </FormField>

      <FormField
        label="Pages to control"
        htmlFor={`${idPrefix}-paths`}
        required
        hint="One path per line, starting with /. Dashboard paths hide sidebar links; other paths hide marketing nav. Do not use / or /dashboard alone."
      >
        <Textarea
          id={`${idPrefix}-paths`}
          value={form.pathText}
          onChange={(event) =>
            onChange({ ...form, pathText: event.target.value })
          }
          rows={4}
          placeholder={"/dashboard/job-board\n/ai-job-search"}
        />
      </FormField>

      <FormField
        label="Unavailable title"
        htmlFor={`${idPrefix}-unavailable-title`}
      >
        <Input
          id={`${idPrefix}-unavailable-title`}
          className="w-full"
          value={form.unavailableTitle}
          onChange={(event) =>
            onChange({ ...form, unavailableTitle: event.target.value })
          }
          placeholder="Job Board is not available"
        />
      </FormField>

      <FormField
        label="Unavailable message"
        htmlFor={`${idPrefix}-unavailable-message`}
        hint="Shown when someone opens a blocked URL."
      >
        <Textarea
          id={`${idPrefix}-unavailable-message`}
          value={form.unavailableMessage}
          onChange={(event) =>
            onChange({ ...form, unavailableMessage: event.target.value })
          }
          rows={3}
          placeholder="This feature is currently turned off on InterviewTrix."
        />
      </FormField>
    </div>
  );
}

export default function SuperAdminFeaturesPage() {
  const { authorized, loading } = useRequirePlatformAdmin();
  const queryClient = useQueryClient();
  const [features, setFeatures] = useState<PlatformFeature[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [keyEdited, setKeyEdited] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [editFeature, setEditFeature] = useState<PlatformFeature | null>(null);
  const [editForm, setEditForm] = useState<FeatureFormState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshPublicCache = () =>
    queryClient.invalidateQueries({ queryKey: PLATFORM_FEATURES_QUERY_KEY });

  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    adminApi
      .listPlatformFeatures()
      .then((list) => {
        if (cancelled) return;
        setFeatures(list.filter((item) => item.category === "product"));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(getApiErrorMessage(error, "Failed to load features"));
      });
    return () => {
      cancelled = true;
    };
  }, [authorized]);

  const applyUpdated = (updated: PlatformFeature) => {
    setFeatures((prev) =>
      prev.map((item) =>
        item.key === updated.key ? { ...item, ...updated } : item,
      ),
    );
    setEditFeature((current) =>
      current?.key === updated.key ? { ...current, ...updated } : current,
    );
  };

  const create = async () => {
    const name = createForm.name.trim();
    if (!name) {
      toast.error("Feature name is required");
      return;
    }
    const paths = controlPathsFromText(createForm.pathText);
    if (paths.routePrefixes.length === 0) {
      toast.error(
        "Add at least one page URL so this feature can hide nav links and block the route.",
      );
      return;
    }
    setCreating(true);
    try {
      const created = await adminApi.createPlatformFeature({
        name,
        key: createForm.key.trim() || undefined,
        description: createForm.description.trim(),
        status: createForm.status,
        unavailableTitle: createForm.unavailableTitle.trim() || undefined,
        unavailableMessage: createForm.unavailableMessage.trim() || undefined,
        ...paths,
      });
      const product: PlatformFeature = {
        ...created,
        category: "product",
        visible: created.visible !== false,
        accessible: created.accessible !== false,
      };
      setFeatures((prev) => [...prev, product]);
      setCreateForm(EMPTY_CREATE);
      setKeyEdited(false);
      setCreateOpen(false);
      await refreshPublicCache();
      toast.success(`${product.name} added. It is Disabled until you go Live.`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to create feature"));
    } finally {
      setCreating(false);
    }
  };

  const saveEdit = async () => {
    if (!editFeature || !editForm) return;
    const paths = controlPathsFromText(editForm.pathText);
    setSavingEdit(true);
    try {
      const updated = await adminApi.updatePlatformFeature(editFeature.key, {
        status: editForm.status,
        name: editForm.name,
        description: editForm.description,
        unavailableTitle: editForm.unavailableTitle,
        unavailableMessage: editForm.unavailableMessage,
        ...paths,
      });
      applyUpdated(updated);
      setEditFeature(null);
      setEditForm(null);
      await refreshPublicCache();
      toast.success(`${updated.name || editForm.name} updated`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update feature"));
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleEnabled = async (feature: PlatformFeature) => {
    const nextStatus: PlatformFeatureStatus =
      feature.status === "disabled" ? "live" : "disabled";
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
      toast.error(getApiErrorMessage(error, "Failed to update feature"));
    } finally {
      setSavingKey(null);
    }
  };

  const remove = async (feature: PlatformFeature) => {
    if (feature.builtIn) return;
    const ok = window.confirm(
      `Delete ${feature.name}? This only removes the flag. The page itself stays in the product until you take it out of the code.`,
    );
    if (!ok) return;
    setDeletingKey(feature.key);
    try {
      await adminApi.deletePlatformFeature(feature.key);
      setFeatures((prev) => prev.filter((item) => item.key !== feature.key));
      setEditFeature(null);
      setEditForm(null);
      await refreshPublicCache();
      toast.success(`${feature.name} deleted`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to delete feature"));
    } finally {
      setDeletingKey(null);
    }
  };

  const openEdit = (feature: PlatformFeature) => {
    setEditFeature(feature);
    setEditForm(toForm(feature));
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
          <Button
            className="w-full sm:w-auto"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add A Feature
          </Button>
        }
      />

      <ClientCacheAdminCard />

      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}

      <Card>
        <CardContent className="px-0 py-0 sm:px-0">
          {features.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No product features yet. Click Add A Feature to create one.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Feature</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Live</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features.map((feature) => (
                    <TableRow key={feature.key}>
                      <TableCell className="min-w-0 max-w-sm">
                        <p className="font-medium text-foreground">
                          {feature.name}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {feature.description || "No description"}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {feature.key}
                        </p>
                      </TableCell>
                      <TableCell>
                        {feature.builtIn ? (
                          <Badge variant="neutral">Built-in</Badge>
                        ) : (
                          <Badge variant="info">Custom</Badge>
                        )}
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
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(feature)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open && !creating) {
            setCreateForm(EMPTY_CREATE);
            setKeyEdited(false);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add a feature</DialogTitle>
            <DialogDescription>
              Name it, paste the dashboard or marketing URLs it should control,
              and save. New features start Disabled so you can prepare them first.
            </DialogDescription>
          </DialogHeader>
          <FeatureFields
            form={createForm}
            syncKeyFromName={!keyEdited}
            idPrefix="create-feature"
            onChange={(next) => {
              if (
                next.name === createForm.name &&
                next.key !== createForm.key
              ) {
                setKeyEdited(true);
              }
              setCreateForm(next);
            }}
          />
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void create()}
              disabled={creating}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Add feature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editFeature && editForm)}
        onOpenChange={(open) => {
          if (!open && !savingEdit && !deletingKey) {
            setEditFeature(null);
            setEditForm(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit feature</DialogTitle>
            <DialogDescription>
              Update name, status, pages, and the message shown when this
              surface is turned off.
            </DialogDescription>
          </DialogHeader>
          {editForm ? (
            <FeatureFields
              form={editForm}
              keyLocked
              idPrefix="edit-feature"
              onChange={setEditForm}
            />
          ) : null}
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {editFeature && !editFeature.builtIn ? (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => void remove(editFeature)}
                disabled={Boolean(deletingKey) || savingEdit}
              >
                {deletingKey === editFeature.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditFeature(null);
                  setEditForm(null);
                }}
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
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
