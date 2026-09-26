"use client";

import type { PromptClassification } from "@/lib/labPromptCatalog";
import type { PromptFixture } from "@/lib/runtimeApi";
import { LabVoicePanel } from "@/components/lab/LabVoicePanel";
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
import { Loader2 } from "lucide-react";

type Props = {
  meta: PromptClassification;
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
  loading: boolean;
  onRenderTest: () => void;
  onExecuteTest: () => void;
  onPrepareVoice: () => void;
  voiceSessionId: string | null;
  voiceStatus: string;
  onVoiceStatus: (status: string) => void;
  resolvedPrompt: string;
  executeOutput: string;
};

export function LabPlayground({
  meta,
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
  loading,
  onRenderTest,
  onExecuteTest,
  onPrepareVoice,
  voiceSessionId,
  voiceStatus,
  onVoiceStatus,
  resolvedPrompt,
  executeOutput,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/60 px-4 py-3">
        <h3 className="text-sm font-semibold">Playground</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {meta.supportsVoiceTest
            ? "Render, then run voice or execute."
            : meta.supportsExecuteTest
              ? "Render composed prompt or run one-shot LLM."
              : "Render to preview composition."}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div>
          <Label className="text-xs text-muted-foreground">Scenario</Label>
          <div className="mt-1 flex flex-wrap gap-2">
            <Input
              className="h-8 min-w-[7rem] flex-1 text-xs"
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
                <SelectTrigger className="h-8 w-[7rem] text-xs">
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
        </div>

        {(meta.supportsVoiceTest || meta.needsProfileRef) && !meta.previewViaLiveWrapper ? (
          <div>
            <Label className="text-xs text-muted-foreground">Capture from interview</Label>
            <div className="mt-1 flex gap-2">
              <Input
                className="h-8 flex-1 text-xs"
                placeholder="Interview ID"
                value={captureInterviewId}
                onChange={(e) => onCaptureInterviewIdChange(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0 text-xs"
                disabled={loading}
                onClick={onCaptureInput}
              >
                Capture
              </Button>
            </div>
          </div>
        ) : null}

        <div>
          <Label className="text-xs text-muted-foreground">Input JSON</Label>
          <Textarea
            className="mt-1 min-h-[10rem] font-mono text-xs"
            value={fixtureInput}
            onChange={(e) => onFixtureInputChange(e.target.value)}
            spellCheck={false}
          />
        </div>

        {!meta.previewViaLiveWrapper ? (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={useEditorDraft}
              onChange={(e) => onUseEditorDraftChange(e.target.checked)}
            />
            Use unsaved draft when rendering
          </label>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={loading}
            onClick={onRenderTest}
          >
            {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
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
          {meta.supportsVoiceTest ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={onPrepareVoice}
            >
              Prepare voice
            </Button>
          ) : null}
        </div>

        {meta.supportsVoiceTest ? (
          <>
            <LabVoicePanel sessionId={voiceSessionId} onStatus={onVoiceStatus} />
            <p className="text-xs text-muted-foreground">Voice: {voiceStatus}</p>
          </>
        ) : null}

        <div>
          <Label className="text-xs text-muted-foreground">Composed prompt</Label>
          <pre className="mt-1 max-h-36 overflow-auto rounded-md border border-border/60 bg-muted/20 p-2.5 text-[11px] leading-relaxed whitespace-pre-wrap">
            {resolvedPrompt || "Run Render to preview…"}
          </pre>
        </div>

        {executeOutput ? (
          <div>
            <Label className="text-xs text-muted-foreground">Output</Label>
            <pre className="mt-1 max-h-48 overflow-auto rounded-md border border-border/60 bg-muted/20 p-2.5 text-[11px] leading-relaxed whitespace-pre-wrap">
              {executeOutput}
            </pre>
          </div>
        ) : null}

        {fixtures.length > 0 ? (
          <ul className="space-y-1 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            {fixtures.map((f) => (
              <li key={f.name} className="flex items-center justify-between gap-2">
                <span className="truncate">
                  {f.name} → {f.promptName}
                  {f.profileName ? ` + ${f.profileName}` : ""}
                </span>
                <button
                  type="button"
                  className="shrink-0 text-destructive hover:underline"
                  onClick={() => onDeleteFixture(f.name)}
                >
                  delete
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
