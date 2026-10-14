"use client";

import { useMemo } from "react";
import type { LabInterviewSetup } from "@/lib/labInterviewSetup";
import {
  AGENT_TYPE_GROUPS,
  classifyPrompt,
  getAgentDisplayName,
  groupAgentsByKind,
  type PromptClassification,
} from "@/lib/labPromptCatalog";
import type {
  LabComposeLiveResult,
  PromptFixture,
  PromptRecord,
} from "@/lib/runtimeApi";
import { LabCompositionPanel } from "@/components/lab/LabCompositionPanel";
import { LabVoicePanel } from "@/components/lab/LabVoicePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Loader2 } from "lucide-react";

type Props = {
  meta: PromptClassification;
  /** Full catalog — agent switcher on the Test pane (left sidebar stays). */
  catalogPrompts: PromptRecord[];
  selectedPromptName: string;
  onSelectPrompt: (prompt: PromptRecord) => void;
  /** Department profiles — compose Live Test + fixture profileRef. */
  profilePrompts: PromptRecord[];
  selectedProfile: string;
  onProfileChange: (name: string) => void;
  /** When set, show production-path composition flow (interviewer-system). */
  composition?: {
    interviewId: string | null;
    environment: string;
    onEnvironmentChange: (env: string) => void;
    useDraft: boolean;
    onUseDraftChange: (v: boolean) => void;
    setup: LabInterviewSetup;
    onSetupChange: (patch: Partial<LabInterviewSetup>) => void;
    composeResult: LabComposeLiveResult | null;
    onCompose: () => void;
    onLiveTest: () => void;
    onCreateInterview: () => void;
    onResetInterview: () => void;
  };
  fixtureName: string;
  onFixtureNameChange: (name: string) => void;
  fixtureInput: string;
  onFixtureInputChange: (value: string) => void;
  fixtures: PromptFixture[];
  onSaveFixture: () => void;
  onLoadFixture: (name: string) => void;
  onDeleteFixture: (name: string) => void;
  captureInterviewId: string;
  onCaptureInterviewIdChange: (value: string) => void;
  onCaptureInput: () => void;
  useEditorDraft: boolean;
  onUseEditorDraftChange: (value: boolean) => void;
  testSourceLabel: string;
  loading: boolean;
  onRenderTest: () => void;
  onExecuteTest: () => void;
  onLiveTest: () => void;
  voiceSessionId: string | null;
  voiceAutoStart: boolean;
  voiceStatus: string;
  onVoiceStatus: (status: string) => void;
  onVoiceEnded?: () => void;
  resolvedPrompt: string;
  executeOutput: string;
};

export function LabPlayground({
  meta,
  catalogPrompts,
  selectedPromptName,
  onSelectPrompt,
  profilePrompts,
  selectedProfile,
  onProfileChange,
  composition,
  fixtureName,
  onFixtureNameChange,
  fixtureInput,
  onFixtureInputChange,
  fixtures,
  onSaveFixture,
  onLoadFixture,
  onDeleteFixture,
  captureInterviewId,
  onCaptureInterviewIdChange,
  onCaptureInput,
  useEditorDraft,
  onUseEditorDraftChange,
  testSourceLabel,
  loading,
  onRenderTest,
  onExecuteTest,
  onLiveTest,
  voiceSessionId,
  voiceAutoStart,
  voiceStatus,
  onVoiceStatus,
  onVoiceEnded,
  resolvedPrompt,
  executeOutput,
}: Props) {
  const showCapture =
    (meta.supportsVoiceTest || meta.needsProfileRef) && !meta.previewViaLiveWrapper;
  const productionPath = Boolean(composition);
  const voiceActive =
    Boolean(voiceSessionId) &&
    voiceStatus !== "idle" &&
    voiceStatus !== "live test ended" &&
    voiceStatus !== "error";

  const agentGroups = useMemo(
    () => groupAgentsByKind(catalogPrompts),
    [catalogPrompts],
  );

  const showFixtureProfileSelect =
    !productionPath &&
    (meta.needsProfileRef || meta.previewViaLiveWrapper) &&
    profilePrompts.length > 0;

  const voiceBlock = meta.supportsVoiceTest ? (
    <div className="space-y-1.5">
      <LabVoicePanel
        sessionId={voiceSessionId}
        onStatus={onVoiceStatus}
        autoStart={voiceAutoStart}
        onEnded={onVoiceEnded}
      />
      {voiceStatus !== "idle" ? (
        <p className="text-[11px] text-muted-foreground">{voiceStatus}</p>
      ) : null}
    </div>
  ) : null;

  const advancedBlock = (
    <details className="rounded-lg border border-border/50">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
        More options
        <span className="font-normal opacity-70">
          · scenarios, capture, draft toggle
        </span>
      </summary>
      <div className="space-y-3 border-t border-border/40 px-3 py-3">
        <p className="text-[11px] text-muted-foreground">
          {productionPath
            ? "Live Test uses the production builder by default. These are for fixture JSON / capture."
            : "Scenario JSON and capture helpers for this agent."}
        </p>
        <div className="grid gap-2">
          <div>
            <Label className="text-[11px] text-muted-foreground">Scenario name</Label>
            <Input
              className="mt-1 h-8 text-xs"
              value={fixtureName}
              onChange={(e) => onFixtureNameChange(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Scenario input (JSON)</Label>
            <Textarea
              className="mt-1 min-h-[100px] font-mono text-[11px]"
              value={fixtureInput}
              onChange={(e) => onFixtureInputChange(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={loading} onClick={onSaveFixture}>
              Save scenario
            </Button>
            {fixtures
              .filter((f) => f.promptName === selectedPromptName || f.promptName === "interviewer-system")
              .slice(0, 6)
              .map((f) => (
                <Button
                  key={f.name}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[11px]"
                  onClick={() => onLoadFixture(f.name)}
                >
                  {f.name}
                </Button>
              ))}
          </div>
          {showCapture ? (
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[140px] flex-1">
                <Label className="text-[11px] text-muted-foreground">
                  Capture from interviewId
                </Label>
                <Input
                  className="mt-1 h-8 text-xs"
                  value={captureInterviewId}
                  onChange={(e) => onCaptureInterviewIdChange(e.target.value)}
                  placeholder="intv_…"
                />
              </div>
              <Button type="button" size="sm" variant="outline" disabled={loading} onClick={onCaptureInput}>
                Capture
              </Button>
            </div>
          ) : null}
          {!productionPath ? (
            <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={useEditorDraft}
                onChange={(e) => onUseEditorDraftChange(e.target.checked)}
              />
              Overlay Lab draft when testing
            </label>
          ) : null}
          {fixtures.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {fixtures.slice(0, 8).map((f) => (
                <Button
                  key={`del-${f.name}`}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[10px] text-destructive"
                  onClick={() => onDeleteFixture(f.name)}
                >
                  Delete {f.name}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
        {resolvedPrompt || executeOutput ? (
          <div className="space-y-2 border-t border-border/40 pt-3">
            {resolvedPrompt ? (
              <div>
                <Label className="text-[11px] text-muted-foreground">Composed prompt</Label>
                <pre className="mt-1 max-h-36 overflow-auto rounded-md bg-muted/20 p-2 text-[11px] leading-relaxed whitespace-pre-wrap">
                  {resolvedPrompt}
                </pre>
              </div>
            ) : null}
            {executeOutput ? (
              <div>
                <Label className="text-[11px] text-muted-foreground">Model output</Label>
                <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-muted/20 p-2 text-[11px] leading-relaxed whitespace-pre-wrap">
                  {executeOutput}
                </pre>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </details>
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 space-y-2.5 border-b border-border/60 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">
              {productionPath ? "Test flow" : "Test"}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {productionPath
                ? "Follow the steps — same path as a customer interview."
                : "Run this agent, then deploy from the center panel."}
            </p>
          </div>
          <Badge variant="secondary" className="text-[10px] font-normal">
            {testSourceLabel}
          </Badge>
        </div>

        <div>
          <Label className="text-[10px] text-muted-foreground">Agent</Label>
          <Select
            value={selectedPromptName}
            onValueChange={(name) => {
              const p = catalogPrompts.find((x) => x.name === name);
              if (p) onSelectPrompt(p);
            }}
          >
            <SelectTrigger className="mt-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {AGENT_TYPE_GROUPS.map((group) => {
                const items = agentGroups.get(group.kind) ?? [];
                if (items.length === 0) return null;
                return (
                  <SelectGroup key={group.kind}>
                    <SelectLabel className="text-[10px]">{group.label}</SelectLabel>
                    {items.map((p) => (
                      <SelectItem key={p.name} value={p.name} className="text-xs">
                        {getAgentDisplayName(p.name, classifyPrompt(p))}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {showFixtureProfileSelect ? (
          <div>
            <Label className="text-[10px] text-muted-foreground">
              Department profile
            </Label>
            <Select
              value={selectedProfile || "__none__"}
              onValueChange={(v) => onProfileChange(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="mt-1 h-8 text-xs">
                <SelectValue placeholder="Select profile…" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="__none__">— none —</SelectItem>
                {profilePrompts.map((p) => (
                  <SelectItem key={p.name} value={p.name} className="text-xs">
                    {getAgentDisplayName(p.name, classifyPrompt(p))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {composition ? (
          <LabCompositionPanel
            interviewId={composition.interviewId}
            environment={composition.environment}
            onEnvironmentChange={composition.onEnvironmentChange}
            useDraft={composition.useDraft}
            onUseDraftChange={composition.onUseDraftChange}
            setup={composition.setup}
            onSetupChange={composition.onSetupChange}
            profilePrompts={profilePrompts}
            loading={loading}
            composeResult={composition.composeResult}
            onCompose={composition.onCompose}
            onLiveTest={composition.onLiveTest}
            onCreateInterview={composition.onCreateInterview}
            onResetInterview={composition.onResetInterview}
            voiceSlot={voiceBlock}
            voiceActive={voiceActive}
          />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {meta.supportsVoiceTest ? (
                <Button type="button" size="sm" disabled={loading} onClick={onLiveTest}>
                  {loading ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Live Test
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={onRenderTest}
              >
                Render
              </Button>
              {meta.supportsExecuteTest ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  onClick={onExecuteTest}
                >
                  Execute
                </Button>
              ) : null}
            </div>
            {voiceBlock}
            {advancedBlock}
          </>
        )}
        {composition ? advancedBlock : null}
      </div>
    </div>
  );
}
