"use client";

import type { PromptClassification } from "@/lib/labPromptCatalog";
import {
  classifyPrompt,
  getAgentDisplayName,
  getKindLabel,
} from "@/lib/labPromptCatalog";
import type { PromptRecord } from "@/lib/runtimeApi";
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
import { Loader2 } from "lucide-react";
import { useState } from "react";

export type AgentDetailTab = "instructions" | "variables" | "model" | "deploy";

const TABS: { id: AgentDetailTab; label: string }[] = [
  { id: "instructions", label: "Instructions" },
  { id: "variables", label: "Variables" },
  { id: "model", label: "Model" },
  { id: "deploy", label: "Deploy" },
];

const KIND_ACCENT: Record<string, string> = {
  voice: "border-l-sky-500",
  execute: "border-l-violet-500",
  profile: "border-l-amber-500",
};

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
  onPromote: () => void;
};

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
  const displayName = getAgentDisplayName(selectedPrompt.name, meta);

  const variablesDraft = inputVariables.join(", ");

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
            <strong>Playground → Render</strong> to preview the full system prompt.
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

      <div className="flex shrink-0 border-b border-border/60 px-5">
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
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Declared variables</Label>
              <Input
                className="mt-1 font-mono text-xs"
                value={variablesDraft}
                onChange={(e) => {
                  const vars = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  onInputVariablesChange(vars);
                }}
                placeholder="candidateName, role, interviewerBody"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Comma-separated names matching placeholders in instructions.
              </p>
            </div>
            {inputVariables.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {inputVariables.map((v) => (
                  <Badge key={v} variant="secondary" className="font-mono text-[10px]">
                    ${"{"}
                    {v}
                    {"}"}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No variables declared yet.</p>
            )}
            <p className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              Test values live in the <strong>Playground</strong> scenario JSON on the right.
            </p>
          </div>
        ) : null}

        {tab === "model" ? (
          <div className="grid max-w-md gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Model</Label>
              <Input
                className="mt-1 font-mono text-xs"
                value={modelConfig.model}
                onChange={(e) =>
                  onModelConfigChange({ ...modelConfig, model: e.target.value })
                }
                placeholder="gemini-2.0-flash / gpt-4o"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Temperature</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="2"
                className="mt-1 text-xs"
                value={modelConfig.temperature}
                onChange={(e) =>
                  onModelConfigChange({ ...modelConfig, temperature: e.target.value })
                }
                placeholder="0.7"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Max tokens</Label>
              <Input
                type="number"
                min="1"
                className="mt-1 text-xs"
                value={modelConfig.maxTokens}
                onChange={(e) =>
                  onModelConfigChange({ ...modelConfig, maxTokens: e.target.value })
                }
                placeholder="4096"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Applied on save. Voice sessions may override via provider defaults.
            </p>
          </div>
        ) : null}

        {tab === "deploy" ? (
          <div className="max-w-md space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Version</Label>
              <Input
                className="mt-1 font-mono text-xs"
                value={editorVersion}
                onChange={(e) => onVersionChange(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Environment</Label>
              <p className="mt-1 text-sm">
                Currently editing{" "}
                <Badge variant="secondary" className="text-[10px]">
                  development
                </Badge>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2">
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
                onClick={onPromote}
              >
                {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Deploy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Save your draft first, then deploy to copy the latest development version
              to the target environment.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
