"use client";

import type { PromptClassification } from "@/lib/labPromptCatalog";
import {
  classifyPrompt,
  extractVariablesFromPrompt,
  getAgentDisplayName,
  getKindLabel,
} from "@/lib/labPromptCatalog";
import type { PromptRecord, PromptVersionSummary } from "@/lib/runtimeApi";
import { listPromptVersions, redeployPrompt } from "@/lib/runtimeApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export type AgentDetailTab = "instructions" | "variables" | "model" | "deploy";

const TABS: {
  id: AgentDetailTab;
  label: string;
  description: string;
}[] = [
  {
    id: "instructions",
    label: "Prompt",
    description: "System instructions shown to the model",
  },
  {
    id: "variables",
    label: "Inputs",
    description: "Placeholder names — values come from Playground test data",
  },
  {
    id: "model",
    label: "Model",
    description: "Default LLM settings saved with this agent",
  },
  {
    id: "deploy",
    label: "Deploy",
    description: "Versions, promote, and rollback",
  },
];

const KIND_ACCENT: Record<string, string> = {
  voice: "border-l-sky-500",
  execute: "border-l-violet-500",
  profile: "border-l-amber-500",
};

const LIVE_ENVS = ["development", "staging", "production"] as const;

type ModelConfigState = {
  model: string;
  temperature: string;
  maxTokens: string;
};

type Props = {
  selectedPrompt: PromptRecord;
  meta: PromptClassification;
  profilePrompts: PromptRecord[];
  selectedProfile: string;
  onProfileChange: (name: string) => void;
  editorContent: string;
  onContentChange: (value: string) => void;
  editorVersion: string;
  onVersionChange: (value: string) => void;
  inputVariables: string[];
  onInputVariablesChange: (vars: string[]) => void;
  modelConfig: ModelConfigState;
  onModelConfigChange: (config: ModelConfigState) => void;
  targetEnv: string;
  onTargetEnvChange: (env: string) => void;
  loading: boolean;
  onSave: () => void;
  onPromote: () => void | Promise<void>;
};

function formatUpdatedAt(value?: string): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function LabAgentDetail({
  selectedPrompt,
  meta,
  profilePrompts,
  selectedProfile,
  onProfileChange,
  editorContent,
  onContentChange,
  editorVersion,
  onVersionChange,
  inputVariables,
  onInputVariablesChange,
  modelConfig,
  onModelConfigChange,
  targetEnv,
  onTargetEnvChange,
  loading,
  onSave,
  onPromote,
}: Props) {
  const [tab, setTab] = useState<AgentDetailTab>("instructions");
  const [liveVersions, setLiveVersions] = useState<
    Partial<Record<(typeof LIVE_ENVS)[number], string>>
  >({});
  const [versionHistory, setVersionHistory] = useState<PromptVersionSummary[]>(
    [],
  );
  const [deployMetaLoading, setDeployMetaLoading] = useState(false);
  const [redeploying, setRedeploying] = useState<string | null>(null);

  const displayName = getAgentDisplayName(selectedPrompt.name, meta);
  const activeTabMeta = TABS.find((t) => t.id === tab)!;

  const addVariable = () => {
    onInputVariablesChange([...inputVariables, ""]);
  };

  const updateVariable = (index: number, value: string) => {
    const next = [...inputVariables];
    next[index] = value.replace(/\s/g, "");
    onInputVariablesChange(next);
  };

  const removeVariable = (index: number) => {
    onInputVariablesChange(inputVariables.filter((_, i) => i !== index));
  };

  const syncVariablesFromPrompt = () => {
    const detected = extractVariablesFromPrompt(editorContent);
    if (detected.length === 0) {
      toast.message("No ${placeholders} found in the prompt");
      return;
    }
    const merged = [...new Set([...inputVariables.filter(Boolean), ...detected])].sort(
      (a, b) => a.localeCompare(b),
    );
    onInputVariablesChange(merged);
    toast.success(`Added ${detected.length} placeholder${detected.length === 1 ? "" : "s"} from prompt`);
  };

  const refreshDeployMeta = useCallback(async () => {
    setDeployMetaLoading(true);
    try {
      const versionsRes = await listPromptVersions(selectedPrompt.name);
      setVersionHistory(versionsRes.versions);
      // Latest per env by updatedAt (API already sorts newest first).
      const next: Partial<Record<(typeof LIVE_ENVS)[number], string>> = {};
      for (const row of versionsRes.versions) {
        const env = row.environment as (typeof LIVE_ENVS)[number];
        if (LIVE_ENVS.includes(env) && !next[env]) {
          next[env] = row.version;
        }
      }
      setLiveVersions(next);
    } catch (e) {
      toast.error(String(e));
      setVersionHistory([]);
      setLiveVersions({});
    } finally {
      setDeployMetaLoading(false);
    }
  }, [selectedPrompt.name]);

  useEffect(() => {
    if (tab !== "deploy") return;
    void refreshDeployMeta();
  }, [tab, refreshDeployMeta]);

  const onRedeploy = async (
    sourceVersion: string,
    targetEnvironment: "staging" | "production",
  ) => {
    const key = `${sourceVersion}→${targetEnvironment}`;
    setRedeploying(key);
    try {
      const result = await redeployPrompt(
        selectedPrompt.name,
        sourceVersion,
        targetEnvironment,
      );
      toast.success(
        `Redeployed v${sourceVersion} → ${targetEnvironment} as v${result.prompt.version}`,
      );
      await refreshDeployMeta();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setRedeploying(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div
        className={cn(
          "shrink-0 border-b border-border/60 border-l-[3px] px-5 py-4",
          KIND_ACCENT[meta.kind],
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">{displayName}</h2>
              <Badge variant="outline" className="text-[10px]">
                {getKindLabel(meta.kind)}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                v{editorVersion}
              </Badge>
            </div>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {selectedPrompt.name}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">{meta.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" size="sm" disabled={loading} onClick={onSave}>
              {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Save draft
            </Button>
          </div>
        </div>

        {meta.previewViaLiveWrapper ? (
          <p className="mt-3 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
            Profiles compose into{" "}
            <code className="rounded bg-background/60 px-1">interviewer-system</code> via{" "}
            <code className="rounded bg-background/60 px-1">profileRef</code>. Use{" "}
            <strong>Test panel → Render</strong> to preview the full system prompt.
          </p>
        ) : null}

        {meta.needsProfileRef ? (
          <div className="mt-3 max-w-xs">
            <Label className="text-xs text-muted-foreground">Composes with profile</Label>
            <Select
              value={selectedProfile || "__none__"}
              onValueChange={(v) => onProfileChange(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="mt-1 h-8 text-xs">
                <SelectValue placeholder="Select profile…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— none —</SelectItem>
                {profilePrompts.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {getAgentDisplayName(p.name, classifyPrompt(p))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col border-b border-border/60 px-5">
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative px-3 py-2.5 text-sm font-medium transition-colors",
                tab === t.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {tab === t.id ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
              ) : null}
            </button>
          ))}
        </div>
        <p className="pb-2.5 pt-1 text-xs text-muted-foreground">{activeTabMeta.description}</p>
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col px-5 py-4",
          tab === "instructions" ? "overflow-hidden" : "overflow-y-auto",
        )}
      >
        {tab === "instructions" ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <p className="shrink-0 text-xs text-muted-foreground">
              System instructions for this agent. Use{" "}
              <code className="rounded bg-muted px-1">${"{"}variable{"}"}</code> for
              runtime substitution.
            </p>
            <Textarea
              value={editorContent}
              onChange={(e) => onContentChange(e.target.value)}
              spellCheck={false}
              className="min-h-0 flex-1 resize-none font-mono text-xs leading-relaxed"
            />
          </div>
        ) : null}

        {tab === "variables" ? (
          <div className="max-w-lg space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={addVariable}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add input
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 text-xs"
                onClick={syncVariablesFromPrompt}
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Detect from prompt
              </Button>
            </div>

            {inputVariables.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">No inputs declared yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use <strong>Detect from prompt</strong> or add names that match{" "}
                  <code className="rounded bg-muted px-1">${"{"}name{"}"}</code> in the Prompt tab.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {inputVariables.map((v, index) => (
                  <li
                    key={`var-${index}`}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/10 px-2 py-1.5"
                  >
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      ${"{"}
                    </span>
                    <Input
                      className="h-8 flex-1 border-0 bg-transparent font-mono text-xs shadow-none focus-visible:ring-0"
                      value={v}
                      onChange={(e) => updateVariable(index, e.target.value)}
                      placeholder="variableName"
                      spellCheck={false}
                    />
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {"}"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${v || "variable"}`}
                      onClick={() => removeVariable(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <p className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              Sample values for these placeholders live in the Playground{" "}
              <strong>Test data</strong> JSON — not here.
            </p>
          </div>
        ) : null}

        {tab === "model" ? (
          <div className="max-w-md space-y-4">
            <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
              <div className="grid gap-4">
                <div>
                  <Label className="text-xs font-medium">Model ID</Label>
                  <Input
                    className="mt-1.5 font-mono text-xs"
                    value={modelConfig.model}
                    onChange={(e) =>
                      onModelConfigChange({ ...modelConfig, model: e.target.value })
                    }
                    placeholder="e.g. gemini-2.0-flash, gpt-4o"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Temperature</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      className="mt-1.5 text-xs"
                      value={modelConfig.temperature}
                      onChange={(e) =>
                        onModelConfigChange({ ...modelConfig, temperature: e.target.value })
                      }
                      placeholder="0.7"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Max tokens</Label>
                    <Input
                      type="number"
                      min="1"
                      className="mt-1.5 text-xs"
                      value={modelConfig.maxTokens}
                      onChange={(e) =>
                        onModelConfigChange({ ...modelConfig, maxTokens: e.target.value })
                      }
                      placeholder="4096"
                    />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Saved with the agent draft. Voice sessions may still use provider defaults at runtime.
            </p>
          </div>
        ) : null}

        {tab === "deploy" ? (
          <div className="max-w-2xl space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {LIVE_ENVS.map((env) => (
                <Badge
                  key={env}
                  variant={env === "production" ? "default" : "secondary"}
                  className="font-mono text-[10px]"
                >
                  {env === "development" ? "dev" : env}{" "}
                  {liveVersions[env] ? `v${liveVersions[env]}` : "—"}
                </Badge>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                disabled={deployMetaLoading}
                onClick={() => void refreshDeployMeta()}
              >
                {deployMetaLoading ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                Refresh
              </Button>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Draft version</Label>
              <Input
                className="mt-1 max-w-xs font-mono text-xs"
                value={editorVersion}
                onChange={(e) => onVersionChange(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Currently editing{" "}
                <Badge variant="secondary" className="text-[10px]">
                  development
                </Badge>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={targetEnv} onValueChange={onTargetEnvChange}>
                <SelectTrigger className="h-9 w-[10rem] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staging">staging</SelectItem>
                  <SelectItem value="production">production</SelectItem>
                  <SelectItem value="experiment">experiment</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                disabled={loading}
                onClick={() => {
                  void (async () => {
                    await onPromote();
                    await refreshDeployMeta();
                  })();
                }}
              >
                {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Deploy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>Test</strong> draft behavior in Playground first.{" "}
              <strong>Deploy</strong> copies the latest development version to the
              target environment as a new bumped version.{" "}
              <strong>Redeploy</strong> restores an older version the same way
              (rollback without mutating history).
            </p>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <Label className="text-xs text-muted-foreground">Version history</Label>
                {deployMetaLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : null}
              </div>
              {versionHistory.length === 0 && !deployMetaLoading ? (
                <p className="text-sm text-muted-foreground">No versions found.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-border/60">
                  <table className="w-full min-w-[28rem] text-left text-xs">
                    <thead className="border-b border-border/60 bg-muted/30 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Version</th>
                        <th className="px-3 py-2 font-medium">Env</th>
                        <th className="px-3 py-2 font-medium">Updated</th>
                        <th className="px-3 py-2 font-medium">Chars</th>
                        <th className="px-3 py-2 font-medium">Redeploy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {versionHistory.map((row) => {
                        const stagingKey = `${row.version}→staging`;
                        const prodKey = `${row.version}→production`;
                        return (
                          <tr
                            key={`${row.version}-${row.environment}-${row.updatedAt ?? ""}`}
                            className="border-b border-border/40 last:border-0"
                          >
                            <td className="px-3 py-2 font-mono">v{row.version}</td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" className="text-[10px]">
                                {row.environment}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {formatUpdatedAt(row.updatedAt)}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {row.contentLength}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px]"
                                  disabled={!!redeploying || loading}
                                  onClick={() =>
                                    void onRedeploy(row.version, "staging")
                                  }
                                >
                                  {redeploying === stagingKey ? (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  ) : null}
                                  → staging
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px]"
                                  disabled={!!redeploying || loading}
                                  onClick={() =>
                                    void onRedeploy(row.version, "production")
                                  }
                                >
                                  {redeploying === prodKey ? (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  ) : null}
                                  → production
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
