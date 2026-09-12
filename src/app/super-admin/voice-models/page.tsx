"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { FormField } from "@/components/app/FormField";
import { useRequirePlatformAdmin } from "@/components/blog-admin/useRequirePlatformAdmin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/ui/app-select";
import { appCard } from "@/lib/app-theme";
import { adminApi } from "@/lib/api";
import type {
  PlatformFeature,
  PlatformFeatureStatus,
} from "@/lib/platform-features";
import type { VoiceModelUsageInsights } from "@/lib/super-admin-insights";
import { VoiceModelUsagePanel } from "@/components/super-admin/VoiceModelUsagePanel";
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

function statusBadge(status: PlatformFeatureStatus) {
  if (status === "live") return <Badge variant="success">Live</Badge>;
  if (status === "enabled") return <Badge variant="info">Enabled</Badge>;
  if (status === "beta") return <Badge variant="warning">Beta</Badge>;
  return <Badge variant="neutral">Disabled</Badge>;
}

export default function SuperAdminVoiceModelsPage() {
  const { authorized, loading } = useRequirePlatformAdmin();
  const queryClient = useQueryClient();
  const [features, setFeatures] = useState<PlatformFeature[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PlatformFeature>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [usage, setUsage] = useState<VoiceModelUsageInsights | null>(null);

  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    adminApi
      .listPlatformFeatures()
      .then((list) => {
        if (cancelled) return;
        const voices = list.filter((item) => item.category === "voice");
        setFeatures(voices);
        setDrafts(
          Object.fromEntries(
            voices.map((item) => [
              item.key,
              {
                ...item,
                creditsPerMinute:
                  item.creditsPerMinute ?? DEFAULT_VOICE_CREDITS_PER_MINUTE,
              },
            ]),
          ),
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        toast.error(
          error instanceof Error ? error.message : "Failed to load voice models",
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

  const rows = useMemo(
    () => features.map((item) => drafts[item.key] ?? item),
    [features, drafts],
  );

  const usageByKey = useMemo(() => {
    const map = new Map(
      (usage?.models ?? []).map((model) => [model.featureKey, model]),
    );
    return map;
  }, [usage]);

  const save = async (key: string) => {
    const draft = drafts[key];
    if (!draft) return;
    const creditsPerMinute = Number(draft.creditsPerMinute);
    if (
      !Number.isFinite(creditsPerMinute) ||
      creditsPerMinute < 1 ||
      creditsPerMinute > 1000
    ) {
      toast.error("Credits per minute must be between 1 and 1000");
      return;
    }
    setSavingKey(key);
    try {
      const updated = await adminApi.updatePlatformFeature(key, {
        status: draft.status,
        creditsPerMinute: Math.round(creditsPerMinute),
      });
      setFeatures((prev) =>
        prev.map((item) => (item.key === key ? { ...item, ...updated } : item)),
      );
      setDrafts((prev) => ({ ...prev, [key]: { ...draft, ...updated } }));
      await queryClient.invalidateQueries({ queryKey: PLATFORM_FEATURES_QUERY_KEY });
      toast.success(`${draft.name} updated`);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update voice model",
      );
    } finally {
      setSavingKey(null);
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

      <div className="grid gap-4 lg:grid-cols-3">
        {rows.map((feature) => (
          <section key={feature.key} className={cn(appCard, "space-y-4 p-5")}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {feature.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
              {statusBadge(feature.status)}
            </div>

            {feature.credentialReady === false ? (
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
              value={feature.status}
              onChange={(value) =>
                setDrafts((prev) => ({
                  ...prev,
                  [feature.key]: {
                    ...feature,
                    status: value as PlatformFeatureStatus,
                  },
                }))
              }
              options={VOICE_STATUSES.map((option) => ({
                ...option,
                disabled:
                  (option.value === "live" || option.value === "beta") &&
                  feature.credentialReady === false,
              }))}
            />

            <FormField
              label="Credits per minute"
              htmlFor={`${feature.key}-credits-per-minute`}
              hint="Charged per billed minute of a live interview using this voice."
            >
              <Input
                id={`${feature.key}-credits-per-minute`}
                type="number"
                min={1}
                max={1000}
                step={1}
                value={
                  feature.creditsPerMinute ?? DEFAULT_VOICE_CREDITS_PER_MINUTE
                }
                onChange={(event) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [feature.key]: {
                      ...feature,
                      creditsPerMinute: Number(event.target.value),
                    },
                  }))
                }
              />
            </FormField>

            <Button
              size="sm"
              onClick={() => void save(feature.key)}
              disabled={savingKey === feature.key}
            >
              {savingKey === feature.key ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Save
            </Button>
          </section>
        ))}
      </div>

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
          <div className="grid gap-4 lg:grid-cols-3">
            {rows.map((feature) => {
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
