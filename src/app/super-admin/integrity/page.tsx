"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { useRequirePlatformAdmin } from "@/components/blog-admin/useRequirePlatformAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { adminApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import {
  DEFAULT_INTEGRITY_SETTINGS,
  type IntegritySettings,
} from "@/lib/integrity/settings";
import { INTEGRITY_CONFIG_QUERY_KEY } from "@/hooks/useIntegrityConfig";
import { cn } from "@/lib/utils";

const GROUPS: Array<{
  title: string;
  description: string;
  keys: Array<{
    key: keyof IntegritySettings;
    label: string;
    help: string;
    requiresMaster?: boolean;
  }>;
}> = [
  {
    title: "Master switch",
    description:
      "Turns collection on or off for coding, AI voice, and system design. Existing reports stay in the database.",
    keys: [
      {
        key: "telemetryEnabled",
        label: "Integrity telemetry",
        help: "When off, no new clipboard, tab, face, or latency events are stored.",
      },
    ],
  },
  {
    title: "Detection modules",
    description: "Each module can be turned off independently while telemetry stays on.",
    keys: [
      {
        key: "clipboardLock",
        label: "Clipboard lock",
        help: "Block external paste in the coding editor and flag burst keystroke injection.",
        requiresMaster: true,
      },
      {
        key: "tabBlur",
        label: "Tab / window blur",
        help: "Flag when the candidate leaves the interview tab for more than a few seconds.",
        requiresMaster: true,
      },
      {
        key: "facePresence",
        label: "Face presence",
        help: "Face count and long absence. A second face must stay in frame for 2.5s and be a similar size — one noisy frame in low light is not enough. Nearby voice AI is handled by Voiceprint, not mouth-lag heuristics.",
        requiresMaster: true,
      },
      {
        key: "voiceprint",
        label: "Voiceprint (WavLM)",
        help: "Microsoft WavLM speaker verification. Candidate reads a screen-only sentence; later mic audio is matched on the server. This is what catches a nearby voice AI even if the candidate lip-syncs.",
        requiresMaster: true,
      },
      {
        key: "turnLatency",
        label: "Turn latency",
        help: "Flag unusually long delays between interviewer finish and candidate speech.",
        requiresMaster: true,
      },
    ],
  },
  {
    title: "Interviewer behavior",
    description: "How the AI interviewer reacts during a live session.",
    keys: [
      {
        key: "socraticPushback",
        label: "Socratic pushback",
        help: "Ask a short clarifying question when live integrity signals fire.",
        requiresMaster: true,
      },
      {
        key: "antiCopilotPrompts",
        label: "Anti-copilot prompts",
        help: "Tell the interviewer to probe for original reasoning instead of recited answers.",
        requiresMaster: true,
      },
    ],
  },
  {
    title: "Report visibility",
    description:
      "Integrity is never mixed into skill scores. These toggles only control who can see the card.",
    keys: [
      {
        key: "showReportToCandidate",
        label: "Show to candidates",
        help: "Candidates see the integrity card on their interview and system-design reports.",
      },
      {
        key: "showReportToReviewers",
        label: "Show to reviewers",
        help: "Recruiters and institution admins see the integrity card. Super Admin always can.",
      },
    ],
  },
];

function IntegritySwitch({
  on,
  disabled,
  label,
  onToggle,
}: Readonly<{
  on: boolean;
  disabled?: boolean;
  label: string;
  onToggle: () => void;
}>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
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
        setSettings(result.settings);
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
          {GROUPS.map((group) => (
            <Card
              key={group.title}
              className="overflow-hidden rounded-xl border border-border/60 shadow-card"
            >
              <CardContent className="space-y-4 p-5 sm:p-6">
                <div>
                  <h2 className="text-base font-semibold">{group.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {group.description}
                  </p>
                </div>
                <ul className="divide-y divide-border/60 rounded-lg border border-border/50">
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
                        className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.help}
                          </p>
                        </div>
                        <IntegritySwitch
                          on={on}
                          disabled={disabled}
                          label={item.label}
                          onToggle={() => void toggle(item.key)}
                        />
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
