"use client";

import type { PromptClassification } from "@/lib/labPromptCatalog";
import type { LabComposeLiveResult, PromptFixture } from "@/lib/runtimeApi";
import { LabCompositionPanel } from "@/components/lab/LabCompositionPanel";
import { LabVoicePanel } from "@/components/lab/LabVoicePanel";
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
import { ChevronDown, Loader2 } from "lucide-react";

type Props = {
  meta: PromptClassification;
  /** When set, show production-path composition flow (interviewer-system). */
  composition?: {
    interviewId: string | null;
    environment: string;
    onEnvironmentChange: (env: string) => void;
    useDraft: boolean;
    onUseDraftChange: (v: boolean) => void;
    composeResult: LabComposeLiveResult | null;
    onCompose: () => void;
    onLiveTest: () => void;
    onCreateInterview: () => void;
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
  profileLabel?: string;
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
  profileLabel,
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
    <details className="group rounded-lg border border-border/50">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
        <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180" />
        More options
      </summary>
      <div className="space-y-4 border-t border-border/40 px-3 py-3">
        {!productionPath ? (
          <div>
            <Label className="text-xs font-medium">Test data (JSON)</Label>
            <Textarea
              className="mt-1.5 min-h-[10rem] font-mono text-xs"
              value={fixtureInput}
              onChange={(e) => onFixtureInputChange(e.target.value)}
              spellCheck={false}
            />
          </div>
        ) : (
          <div>
            <Label className="text-xs font-medium">Fixture JSON</Label>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Optional override — Live Test uses the production builder by default.
            </p>
            <Textarea
              className="mt-1.5 min-h-[7rem] font-mono text-xs"
              value={fixtureInput}
              onChange={(e) => onFixtureInputChange(e.target.value)}
              spellCheck={false}
            />
          </div>
        )}

        <div>
          <Label className="text-xs font-medium">Saved scenarios</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <Input
              className="h-8 min-w-[6rem] flex-1 text-xs"
              placeholder="Scenario name"
              value={fixtureName}
              onChange={(e) => onFixtureNameChange(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={loading}
              onClick={onSaveFixture}
            >
              Save
            </Button>
            {fixtures.length > 0 ? (
              <Select
                onValueChange={(v) => {
                  if (v) onLoadFixture(v);
                }}
              >
                <SelectTrigger className="h-8 w-[7.5rem] text-xs">
                  <SelectValue placeholder="Load…" />
                </SelectTrigger>
                <SelectContent>
                  {fixtures.map((f) => (
                    <SelectItem key={f.name} value={f.name}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
          {fixtures.length > 0 ? (
            <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
              {fixtures.map((f) => (
                <li key={f.name} className="flex items-center justify-between gap-2">
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    className="shrink-0 text-destructive hover:underline"
                    onClick={() => onDeleteFixture(f.name)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {showCapture ? (
          <div>
            <Label className="text-xs font-medium">Checkpoint inject</Label>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Load input from a past interview into the fixture JSON.
            </p>
            <div className="mt-1.5 flex gap-2">
              <Input
                className="h-8 flex-1 font-mono text-xs"
                placeholder="Interview ID"
                value={captureInterviewId}
                onChange={(e) => onCaptureInterviewIdChange(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 shrink-0 text-xs"
                disabled={loading || !captureInterviewId.trim()}
                onClick={onCaptureInput}
              >
                Inject
              </Button>
            </div>
          </div>
        ) : null}

        {meta.supportsExecuteTest ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={onExecuteTest}
          >
            Run execute{meta.executeReturnsJson ? " (JSON)" : ""}
          </Button>
        ) : null}

        {!productionPath && (resolvedPrompt || executeOutput) ? (
          <div className="space-y-2">
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
      <div className="shrink-0 border-b border-border/60 px-4 py-3">
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
        {profileLabel ? (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Profile:{" "}
            <span className="font-medium text-foreground">{profileLabel}</span>
          </p>
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
            loading={loading}
            composeResult={composition.composeResult}
            onCompose={composition.onCompose}
            onLiveTest={composition.onLiveTest}
            onCreateInterview={composition.onCreateInterview}
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
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={onExecuteTest}
                >
                  Run{meta.executeReturnsJson ? " (JSON)" : ""}
                </Button>
              ) : null}
            </div>

            {!meta.previewViaLiveWrapper ? (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={useEditorDraft}
                  onChange={(e) => onUseEditorDraftChange(e.target.checked)}
                />
                Use unsaved prompt draft
              </label>
            ) : null}

            {voiceBlock}
          </>
        )}

        {advancedBlock}
      </div>
    </div>
  );
}
