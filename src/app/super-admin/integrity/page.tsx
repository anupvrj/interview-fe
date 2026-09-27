"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { useRequirePlatformAdmin } from "@/components/blog-admin/useRequirePlatformAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { IntegritySwitch } from "@/components/integrity/IntegritySwitch";
import { adminApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import {
  DEFAULT_INTEGRITY_SETTINGS,
  normalizeIntegritySettings,
  type IntegritySettings,
} from "@/lib/integrity/settings";
import { INTEGRITY_SETTING_GROUPS } from "@/lib/integrity/settingGroups";
import { INTEGRITY_CONFIG_QUERY_KEY } from "@/hooks/useIntegrityConfig";

export default function SuperAdminIntegrityPage() {
  const { authorized, loading: authLoading } = useRequirePlatformAdmin();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<IntegritySettings>(
    DEFAULT_INTEGRITY_SETTINGS,
  );
  const [envForcedOff, setEnvForcedOff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof IntegritySettings | null>(
    null,
  );

  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    setLoading(true);
    adminApi
      .getIntegritySettings()
      .then((result) => {
        if (cancelled) return;
        setSettings(normalizeIntegritySettings(result.settings));
        setEnvForcedOff(result.envForcedOff);
      })
      .catch((error: unknown) => {
        toast.error(getApiErrorMessage(error, "Failed to load integrity settings"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authorized]);

  const toggle = async (key: keyof IntegritySettings) => {
    const previous = settings;
    const next = { ...previous, [key]: !previous[key] };
    setSettings(next);
    setSavingKey(key);
    try {
      const saved = await adminApi.updateIntegritySettings({ [key]: next[key] });
      setSettings(saved);
      await queryClient.invalidateQueries({ queryKey: INTEGRITY_CONFIG_QUERY_KEY });
      toast.success("Integrity setting updated");
    } catch (error: unknown) {
      setSettings(previous);
      toast.error(getApiErrorMessage(error, "Failed to update setting"));
    } finally {
      setSavingKey(null);
    }
  };

  if (authLoading || !authorized) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader
        title="Interview integrity"
        description="Control anti-cheat telemetry, interviewer pushback, and who sees the integrity report. Skill scores stay separate."
      />

      {envForcedOff ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Emergency env kill switch is on (
          <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">
            INTEGRITY_TELEMETRY_ENABLED=false
          </code>
          ). Collection stays off until that env var is removed. Report
          visibility can still be changed.
        </p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {INTEGRITY_SETTING_GROUPS.map((group) => (
            <Card
              key={group.title}
              className="overflow-hidden rounded-xl border border-border/60 shadow-card"
            >
              <CardContent className="space-y-3 p-4 sm:space-y-4 sm:p-6">
                <div>
                  <h2 className="text-base font-semibold sm:text-lg">{group.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {group.description}
                  </p>
                </div>
                <ul
                  className={
                    group.keys.length > 1
                      ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
                      : "grid grid-cols-1"
                  }
                >
                  {group.keys.map((item) => {
                    const on = settings[item.key];
                    const lockedByEnv =
                      envForcedOff &&
                      item.key !== "showReportToCandidate" &&
                      item.key !== "showReportToReviewers";
                    const disabled =
                      savingKey !== null ||
                      lockedByEnv ||
                      (Boolean(item.requiresMaster) && !settings.telemetryEnabled);
                    return (
                      <li
                        key={item.key}
                        className="flex h-full min-w-0 flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-3.5 sm:p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 text-sm font-medium leading-snug sm:text-[15px]">
                            {item.label}
                          </p>
                          <IntegritySwitch
                            on={on}
                            disabled={disabled}
                            label={item.label}
                            onToggle={() => void toggle(item.key)}
                          />
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
                          {item.help}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
