"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  captureLabInput,
  createSession,
  deleteFixture,
  executePrompt,
  getDefaultVoiceProvider,
  listFixtures,
  listPrompts,
  promotePrompt,
  saveFixture,
  savePrompt,
  type PromptFixture,
  type PromptRecord,
} from "@/lib/runtimeApi";
import {
  classifyPrompt,
  defaultFixtureForPrompt,
  latestPromptsPerName,
  type PromptClassification,
} from "@/lib/labPromptCatalog";
import { LabAgentDetail } from "@/components/lab/LabAgentDetail";
import { LabAgentSidebar } from "@/components/lab/LabAgentSidebar";
import { LabPlayground } from "@/components/lab/LabPlayground";
import { LabResizablePanels } from "@/components/lab/LabResizablePanels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bot, Loader2, Plus, RefreshCw } from "lucide-react";

const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || "development";

type ModelConfigState = {
  model: string;
  temperature: string;
  maxTokens: string;
};

function modelConfigFromPrompt(p?: PromptRecord): ModelConfigState {
  const mc = p?.modelConfig;
  return {
    model: typeof mc?.model === "string" ? mc.model : "",
    temperature:
      typeof mc?.temperature === "number" ? String(mc.temperature) : "",
    maxTokens: typeof mc?.maxTokens === "number" ? String(mc.maxTokens) : "",
  };
}

function buildModelConfigPayload(state: ModelConfigState): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};
  if (state.model.trim()) out.model = state.model.trim();
  if (state.temperature.trim()) {
    const t = Number.parseFloat(state.temperature);
    if (!Number.isNaN(t)) out.temperature = t;
  }
  if (state.maxTokens.trim()) {
    const n = Number.parseInt(state.maxTokens, 10);
    if (!Number.isNaN(n)) out.maxTokens = n;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export default function LabPage() {
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [fixtures, setFixtures] = useState<PromptFixture[]>([]);
  const [selectedName, setSelectedName] = useState("interviewer-system");
  const [selectedProfile, setSelectedProfile] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorVersion, setEditorVersion] = useState("1.0.0");
  const [editorInputVariables, setEditorInputVariables] = useState<string[]>([]);
  const [modelConfig, setModelConfig] = useState<ModelConfigState>({
    model: "",
    temperature: "",
    maxTokens: "",
  });
  const [targetEnv, setTargetEnv] = useState("staging");
  const [fixtureInput, setFixtureInput] = useState("{}");
  const [fixtureName, setFixtureName] = useState("golden-live");
  const [captureInterviewId, setCaptureInterviewId] = useState("");
  const [useEditorDraft, setUseEditorDraft] = useState(false);
  const [resolvedPrompt, setResolvedPrompt] = useState("");
  const [executeOutput, setExecuteOutput] = useState("");
  const [voiceSessionId, setVoiceSessionId] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const catalog = useMemo(() => latestPromptsPerName(prompts), [prompts]);
  const selectedPrompt = catalog.find((p) => p.name === selectedName);
  const meta: PromptClassification | null = selectedPrompt
    ? classifyPrompt(selectedPrompt)
    : null;
  const profilePrompts = catalog.filter((p) => p.name.startsWith("profile-"));

  const applyPromptToEditor = useCallback((p: PromptRecord) => {
    const m = classifyPrompt(p);
    setEditorContent(p.content);
    setEditorVersion(p.version);
    setEditorInputVariables(p.inputVariables ?? []);
    setModelConfig(modelConfigFromPrompt(p));
    setFixtureInput(JSON.stringify(defaultFixtureForPrompt(p.name, m.kind), null, 2));
    setResolvedPrompt("");
    setExecuteOutput("");
    setVoiceSessionId(null);
  }, []);

  const selectPrompt = useCallback(
    (p: PromptRecord) => {
      setSelectedName(p.name);
      applyPromptToEditor(p);
    },
    [applyPromptToEditor],
  );

  const refresh = useCallback(async () => {
    setLoadError(null);
    const [p, f] = await Promise.all([
      listPrompts("development"),
      listFixtures(),
    ]);
    setPrompts(p);
    setFixtures(f);
    const current = latestPromptsPerName(p).find((x) => x.name === selectedName);
    if (current) applyPromptToEditor(current);
  }, [selectedName, applyPromptToEditor]);

  useEffect(() => {
    refresh().catch((e) => setLoadError(String(e)));
  }, [refresh]);

  useEffect(() => {
    if (catalog.length && !selectedPrompt) {
      const first =
        catalog.find((p) => p.name === "interviewer-system") ?? catalog[0];
      if (first) selectPrompt(first);
    }
  }, [catalog, selectedPrompt, selectPrompt]);

  const parseFixtureInput = (): Record<string, unknown> => {
    try {
      return JSON.parse(fixtureInput) as Record<string, unknown>;
    } catch {
      throw new Error("Scenario input must be valid JSON");
    }
  };

  const composeRefs = () => {
    if (meta?.previewViaLiveWrapper && selectedName.startsWith("profile-")) {
      return {
        promptRef: {
          name: "interviewer-system",
          environment: "development" as const,
        },
        profileRef: {
          name: selectedName,
          environment: "development" as const,
        },
      };
    }
    return {
      promptRef: { name: selectedName, environment: "development" as const },
      profileRef:
        meta?.needsProfileRef && selectedProfile
          ? { name: selectedProfile, environment: "development" as const }
          : undefined,
    };
  };

  const sessionPayload = (input: Record<string, unknown>) => {
    const { promptRef, profileRef } = composeRefs();
    return {
      mode: "voice" as const,
      provider: getDefaultVoiceProvider(),
      promptRef,
      profileRef,
      input,
      ...(useEditorDraft && !meta?.previewViaLiveWrapper
        ? { promptDraft: editorContent }
        : {}),
    };
  };

  const onSave = async () => {
    setLoading(true);
    try {
      await savePrompt({
        name: selectedName,
        version: editorVersion,
        content: editorContent,
        environment: "development",
        inputVariables: editorInputVariables,
        description:
          selectedPrompt?.description ?? `Lab edit ${new Date().toISOString()}`,
        tags: selectedPrompt?.tags,
        modelConfig: buildModelConfigPayload(modelConfig),
      });
      toast.success("Draft saved to development");
      await refresh();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  const onPromote = async () => {
    setLoading(true);
    try {
      await promotePrompt(selectedName, targetEnv, "development");
      toast.success(`Deployed ${selectedName} → ${targetEnv}`);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  const onSaveFixture = async () => {
    setLoading(true);
    try {
      const input = parseFixtureInput();
      const { promptRef, profileRef } = composeRefs();
      await saveFixture({
        name: fixtureName,
        promptName: promptRef.name,
        profileName: profileRef?.name ?? (selectedProfile || undefined),
        input,
        description: `Lab scenario ${selectedName}`,
      });
      toast.success(`Scenario "${fixtureName}" saved`);
      await refresh();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  const onLoadFixture = (name: string) => {
    const f = fixtures.find((x) => x.name === name);
    if (!f) return;
    setFixtureName(f.name);
    setSelectedName(f.promptName);
    if (f.profileName) setSelectedProfile(f.profileName);
    setFixtureInput(JSON.stringify(f.input, null, 2));
    const p = catalog.find((x) => x.name === f.promptName);
    if (p) applyPromptToEditor(p);
    toast.info(`Loaded scenario "${name}"`);
  };

  const onDeleteFixture = async (name: string) => {
    setLoading(true);
    try {
      await deleteFixture(name);
      toast.success(`Deleted scenario "${name}"`);
      await refresh();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  const onCaptureInput = async () => {
    if (!captureInterviewId.trim()) {
      toast.error("Enter an interview ID to capture");
      return;
    }
    setLoading(true);
    try {
      const surface =
        selectedName === "interviewer-coding-discussion" ? "coding" : "live";
      const captured = await captureLabInput(
        captureInterviewId.trim(),
        surface,
      );
      setSelectedName(captured.promptRef.name);
      if (captured.profileRef?.name) {
        setSelectedProfile(captured.profileRef.name);
      }
      setFixtureInput(JSON.stringify(captured.input, null, 2));
      toast.success(`Captured input for ${captured.interviewId}`);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  const onRenderTest = async () => {
    setLoading(true);
    setResolvedPrompt("");
    setExecuteOutput("");
    try {
      const input = parseFixtureInput();
      const session = await createSession(sessionPayload(input));
      setResolvedPrompt(session.systemPrompt);
      setVoiceSessionId(session.sessionId);
      toast.success("Prompt rendered");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  const onExecuteTest = async () => {
    setLoading(true);
    setExecuteOutput("");
    setResolvedPrompt("");
    try {
      const input = parseFixtureInput();
      const { promptRef, profileRef } = composeRefs();
      const mc = buildModelConfigPayload(modelConfig);
      const result = await executePrompt({
        promptRef,
        profileRef,
        input,
        responseFormat: meta?.executeReturnsJson ? "json_object" : "text",
        ...(mc?.model ? { model: String(mc.model) } : {}),
        ...(typeof mc?.temperature === "number"
          ? { temperature: mc.temperature }
          : {}),
      });
      setResolvedPrompt(result.systemPrompt);
      setExecuteOutput(result.output);
      toast.success("Execute complete");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  const onPrepareVoice = async () => {
    setLoading(true);
    setVoiceStatus("preparing");
    try {
      const input = parseFixtureInput();
      const provider = getDefaultVoiceProvider();
      const session = await createSession({
        ...sessionPayload(input),
        passthrough: provider === "openai",
      });
      setResolvedPrompt(session.systemPrompt);
      setVoiceSessionId(session.sessionId);
      setVoiceStatus("session ready");
      toast.success(`Voice session ready (${provider})`);
    } catch (e) {
      setVoiceStatus("error");
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  const playgroundProps = meta
    ? {
        meta,
        fixtureName,
        onFixtureNameChange: setFixtureName,
        fixtureInput,
        onFixtureInputChange: setFixtureInput,
        fixtures,
        onSaveFixture,
        onLoadFixture,
        onDeleteFixture,
        captureInterviewId,
        onCaptureInterviewIdChange: setCaptureInterviewId,
        onCaptureInput,
        useEditorDraft,
        onUseEditorDraftChange: setUseEditorDraft,
        loading,
        onRenderTest,
        onExecuteTest,
        onPrepareVoice,
        voiceSessionId,
        voiceStatus,
        onVoiceStatus: setVoiceStatus,
        resolvedPrompt,
        executeOutput,
      }
    : null;

  const agentDetail =
    selectedPrompt && meta ? (
      <LabAgentDetail
        selectedPrompt={selectedPrompt}
        meta={meta}
        profilePrompts={profilePrompts}
        selectedProfile={selectedProfile}
        onProfileChange={setSelectedProfile}
        editorContent={editorContent}
        onContentChange={setEditorContent}
        editorVersion={editorVersion}
        onVersionChange={setEditorVersion}
        inputVariables={editorInputVariables}
        onInputVariablesChange={setEditorInputVariables}
        modelConfig={modelConfig}
        onModelConfigChange={setModelConfig}
        targetEnv={targetEnv}
        onTargetEnvChange={setTargetEnv}
        loading={loading}
        onSave={onSave}
        onPromote={onPromote}
      />
    ) : (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          "Select an agent to edit"
        )}
      </div>
    );

  return (
    <div className="-mb-4 -mt-4 flex h-[calc(100dvh-5.5rem)] flex-col overflow-hidden sm:-mb-5 sm:-mt-5 lg:-mb-8 lg:-mt-5 lg:h-[calc(100dvh-9.25rem)]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Agent Lab</h1>
            <p className="text-xs text-muted-foreground">
              Build and test AI agents
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled
            title="Coming soon"
            className="h-8 text-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New agent
          </Button>
          <Badge variant="secondary" className="text-[10px] font-normal">
            {APP_ENV}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-normal">
            {catalog.length} agents
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={loading}
            onClick={() => refresh().catch((e) => setLoadError(String(e)))}
            aria-label="Refresh"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </header>

      {loadError ? (
        <div className="border-b border-destructive/30 bg-destructive/5 py-3 text-sm">
          <p className="font-medium text-destructive">Could not load agents</p>
          <p className="mt-1 text-xs text-muted-foreground">{loadError}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Seed:{" "}
            <code className="rounded bg-muted px-1">
              cd interview-core && npm run seed:prompts development
            </code>
          </p>
        </div>
      ) : null}

      {!loadError && catalog.length === 0 ? (
        <div className="border-b border-amber-500/30 bg-amber-500/5 py-3 text-sm">
          <p className="font-medium">No agents in Mongo</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Run the seed script, then restart runtime.
          </p>
        </div>
      ) : null}

      <div className="hidden min-h-0 flex-1 lg:flex">
        <LabResizablePanels
          left={
            <LabAgentSidebar
              prompts={prompts}
              selectedName={selectedName}
              onSelect={selectPrompt}
            />
          }
          center={agentDetail}
          right={playgroundProps ? <LabPlayground {...playgroundProps} /> : <div />}
        />
      </div>

      {/* Tablet / mobile: stacked panes with internal scroll */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:hidden">
        <details className="shrink-0 border-b border-border/60">
          <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium">
            Browse agents ({catalog.length})
          </summary>
          <div className="max-h-48 overflow-y-auto border-t border-border/60">
            <LabAgentSidebar
              prompts={prompts}
              selectedName={selectedName}
              onSelect={selectPrompt}
            />
          </div>
        </details>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-hidden border-b border-border/60">
            {agentDetail}
          </div>
          {playgroundProps ? (
            <div className="min-h-0 flex-1 overflow-hidden bg-muted/10">
              <LabPlayground {...playgroundProps} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
