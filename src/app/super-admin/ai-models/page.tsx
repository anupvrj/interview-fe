"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { useRequirePlatformAdmin } from "@/components/blog-admin/useRequirePlatformAdmin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { adminApi, type AdminAiModelSettings, type AdminAiStageRow, type AiModelInfo } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";

const SOURCE_LABEL: Record<string, string> = { admin: "Set here", env: "From server env", default: "Default" };

function price(m: AiModelInfo | undefined) {
  if (!m) return "price unknown";
  return `$${m.price.input} / $${m.price.output} per 1M`;
}

function StageCard({ row, models, onSaved }: { row: AdminAiStageRow; models: AiModelInfo[]; onSaved: (s: AdminAiModelSettings) => void }) {
  const [model, setModel] = useState(row.current.model);
  const [effort, setEffort] = useState(row.current.effort ?? "");
  const [maxOut, setMaxOut] = useState(String(row.current.maxOutputTokens));
  const [timeout, setTimeoutMs] = useState(String(row.current.timeoutMs));
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setModel(row.current.model);
    setEffort(row.current.effort ?? "");
    setMaxOut(String(row.current.maxOutputTokens));
    setTimeoutMs(String(row.current.timeoutMs));
  }, [row]);

  const info = models.find((m) => m.id === model);
  const changed =
    model !== row.current.model ||
    (effort || "") !== (row.current.effort ?? "") ||
    maxOut !== String(row.current.maxOutputTokens) ||
    timeout !== String(row.current.timeoutMs);

  const save = async () => {
    setSaving(true);
    try {
      onSaved(
        await adminApi.setAiModelStage(row.id, {
          model,
          effort: info?.reasoning ? effort || undefined : undefined,
          maxOutputTokens: Number(maxOut),
          timeoutMs: Number(timeout),
        }),
      );
      toast.success(`${row.label}: saved`);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Couldn't save"));
    } finally {
      setSaving(false);
    }
  };
  const reset = async () => {
    setSaving(true);
    try {
      onSaved(await adminApi.resetAiModelStage(row.id));
      toast.success(`${row.label}: back to default`);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Couldn't reset"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card data-testid={`ai-stage-${row.id}`}>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-foreground">{row.label}</p>
            <p className="text-[13px] text-muted-foreground">{row.description}</p>
          </div>
          <Badge variant={row.current.source === "admin" ? "default" : "secondary"}>{SOURCE_LABEL[row.current.source]}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block text-[12.5px] text-muted-foreground">
            Model
            <input
              list={`models-${row.id}`}
              value={model}
              onChange={(e) => setModel(e.target.value.trim())}
              aria-label={`${row.label} model`}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-[14px] text-foreground"
            />
            <datalist id={`models-${row.id}`}>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {`${m.id}${m.deprecated ? " (deprecated)" : ""} · ${price(m)}`}
                </option>
              ))}
            </datalist>
          </label>
          <label className="block text-[12.5px] text-muted-foreground">
            Effort
            <select
              value={effort}
              onChange={(e) => setEffort(e.target.value)}
              disabled={!info?.reasoning && !!info}
              aria-label={`${row.label} effort`}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2 text-[14px] text-foreground disabled:opacity-50"
            >
              {info && !info.reasoning ? <option value="">n/a</option> : null}
              {(info?.efforts.length ? info.efforts : ["none", "minimal", "low", "medium", "high", "xhigh", "max"]).map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12.5px] text-muted-foreground">
            Output tokens
            <input type="number" value={maxOut} onChange={(e) => setMaxOut(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-[14px] text-foreground" />
          </label>
          <label className="block text-[12.5px] text-muted-foreground">
            Timeout (ms)
            <input type="number" value={timeout} onChange={(e) => setTimeoutMs(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-[14px] text-foreground" />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={cn("text-[12px]", info?.deprecated ? "text-amber-600" : "text-muted-foreground")}>
            {info ? `${price(info)}${info.deprecated ? " · deprecated by OpenAI" : ""}${info.note ? ` · ${info.note}` : ""}` : "Not in our catalog: it will still run, without a cost estimate."}
            {" · "}Default: {row.defaults.model}
            {row.defaults.effort ? ` (${row.defaults.effort})` : ""}
          </p>
          <div className="flex gap-2">
            {row.override ? (
              <Button variant="outline" size="sm" onClick={() => void reset()} disabled={saving}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Default
              </Button>
            ) : null}
            <Button size="sm" onClick={() => void save()} disabled={!changed || saving || !model}>
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />} Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AiModelsPage() {
  const { authorized, loading } = useRequirePlatformAdmin();
  const [data, setData] = useState<AdminAiModelSettings | null>(null);
  const [ceiling, setCeiling] = useState("");
  const [savingBuild, setSavingBuild] = useState(false);

  useEffect(() => {
    if (!authorized) return;
    adminApi
      .getAiModelSettings()
      .then((d) => {
        setData(d);
        setCeiling(String(d.build.costCeilingUsd));
      })
      .catch((e) => toast.error(getApiErrorMessage(e, "Couldn't load AI model settings")));
  }, [authorized]);

  const onSaved = (d: AdminAiModelSettings) => {
    setData(d);
    setCeiling(String(d.build.costCeilingUsd));
  };
  const models = useMemo(() => data?.models ?? [], [data]);

  const saveBuild = async (patch: Partial<AdminAiModelSettings["build"]>) => {
    setSavingBuild(true);
    try {
      onSaved(await adminApi.setAiBuildSettings(patch));
      toast.success("Saved");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Couldn't save"));
    } finally {
      setSavingBuild(false);
    }
  };

  if (loading || !authorized || !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader
        title="AI Models"
        description="Which OpenAI model each resume AI step uses. Changes apply within about 15 seconds, without a deploy. Default models were picked by measured quality, speed and cost."
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-5 p-5">
          <label className="block text-[12.5px] text-muted-foreground">
            Cost ceiling per resume build (USD)
            <div className="mt-1 flex gap-2">
              <input type="number" step="0.01" value={ceiling} onChange={(e) => setCeiling(e.target.value)} className="h-10 w-32 rounded-lg border border-border bg-background px-3 text-[14px] text-foreground" />
              <Button size="sm" className="h-10" disabled={savingBuild || ceiling === String(data.build.costCeilingUsd)} onClick={() => void saveBuild({ costCeilingUsd: Number(ceiling) })}>
                Save
              </Button>
            </div>
          </label>
          {(
            [
              ["verifierEnabled", "Check every line against the facts"],
              ["voicePassEnabled", "Polish wording and fit to page"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 pb-2 text-[13.5px] text-foreground">
              <input type="checkbox" checked={data.build[key]} disabled={savingBuild} onChange={(e) => void saveBuild({ [key]: e.target.checked })} />
              {label}
            </label>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {data.stages.map((row) => (
          <StageCard key={row.id} row={row} models={models} onSaved={onSaved} />
        ))}
      </div>
    </div>
  );
}
