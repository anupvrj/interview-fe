"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  captureLabInput,
  composeLabLive,
  createLabInterview,
  createSession,
  deleteFixture,
  executePrompt,
  getDefaultVoiceProvider,
  getRuntimeApiUrl,
  listFixtures,
  listPrompts,
  promotePrompt,
  runLabAgent,
  saveFixture,
  savePrompt,
  type LabComposeLiveResult,
  type PromptFixture,
  type PromptRecord,
} from "@/lib/runtimeApi";
import {
  classifyPrompt,
  defaultFixtureForPrompt,
  latestPromptsPerName,
  supportsFullLabRun,
  type PromptClassification,
} from "@/lib/labPromptCatalog";
import {
  DEFAULT_LAB_INTERVIEW_SETUP,
  labProfileNameFromSetup,
  type LabInterviewSetup,
} from "@/lib/labInterviewSetup";
import { LabAgentDetail } from "@/components/lab/LabAgentDetail";
import { LabAgentSidebar } from "@/components/lab/LabAgentSidebar";
import { LabPlayground } from "@/components/lab/LabPlayground";
import { LabResizablePanels } from "@/components/lab/LabResizablePanels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bot, Loader2, Plus, RefreshCw } from "lucide-react";

const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || "development";

/** Only mount one Lab layout — CSS `hidden` still mounts both and duplicated Live Test WS. */
function subscribeLg(onChange: () => void) {
  const mq = window.matchMedia("(min-width: 1024px)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
function getLgSnapshot() {
  return window.matchMedia("(min-width: 1024px)").matches;
}
function getLgServerSnapshot() {
  return true;
}
function useIsLgLayout() {
  return useSyncExternalStore(subscribeLg, getLgSnapshot, getLgServerSnapshot);
}

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
  const isLg = useIsLgLayout();
  const { userId: clerkUserId } = useAuth();
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
  const [testPromptEnv, setTestPromptEnv] = useState("development");
  const [labInterviewSetup, setLabInterviewSetup] = useState<LabInterviewSetup>(
    DEFAULT_LAB_INTERVIEW_SETUP,
  );
  const [labInterviewId, setLabInterviewId] = useState<string | null>(null);
  const [composeResult, setComposeResult] = useState<LabComposeLiveResult | null>(
    null,
  );
  const [fixtureInput, setFixtureInput] = useState("{}");
  const [fixtureName, setFixtureName] = useState("golden-live");
  const [captureInterviewId, setCaptureInterviewId] = useState("");
  const [useEditorDraft, setUseEditorDraft] = useState(true);
  const [resolvedPrompt, setResolvedPrompt] = useState("");
  const [executeOutput, setExecuteOutput] = useState("");
  const [voiceSessionId, setVoiceSessionId] = useState<string | null>(null);
  const [voiceAutoStart, setVoiceAutoStart] = useState(false);
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
    setVoiceAutoStart(false);
    setComposeResult(null);
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
        inputVariables: editorInputVariables.map((s) => s.trim()).filter(Boolean),
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
    setVoiceAutoStart(false);
    try {
      const input = parseFixtureInput();
      if (supportsFullLabRun(selectedName) && meta?.supportsVoiceTest) {
        const provider = getDefaultVoiceProvider();
        const { promptRef, profileRef } = composeRefs();
        const result = await runLabAgent({
          promptName: promptRef.name,
          input,
          environment: "development",
          profileRef,
          provider,
          passthrough: provider === "openai",
          ...(useEditorDraft && !meta.previewViaLiveWrapper
            ? { promptDraft: editorContent }
            : {}),
          ...(captureInterviewId.trim()
            ? { interviewId: captureInterviewId.trim() }
            : {}),
        });
        if (result.mode !== "voice") {
          throw new Error(`Expected voice mode, got ${result.mode}`);
        }
        setResolvedPrompt(result.systemPrompt);
        setVoiceSessionId(result.sessionId);
        toast.success("Prompt rendered (full run-agent)");
        return;
      }
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

      if (supportsFullLabRun(promptRef.name)) {
        const result = await runLabAgent({
          promptName: promptRef.name,
          input,
          environment: "development",
          profileRef,
          ...(useEditorDraft && !meta?.previewViaLiveWrapper
            ? { promptDraft: editorContent }
            : {}),
          ...(typeof mc?.model === "string" ? { model: mc.model } : {}),
          ...(typeof mc?.temperature === "number"
            ? { temperature: mc.temperature }
            : {}),
        });
        if (result.mode !== "execute") {
          throw new Error(`Expected execute mode, got ${result.mode}`);
        }
        setResolvedPrompt(result.systemPrompt);
        setExecuteOutput(result.output);
        toast.success("Execute complete (full run-agent)");
        return;
      }

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

  const hasUsableInput = (): boolean => {
    const raw = fixtureInput.trim();
    if (!raw || raw === "{}") {
      if (!captureInterviewId.trim()) return false;
    }
    try {
      JSON.parse(fixtureInput);
      return true;
    } catch {
      return false;
    }
  };

  const ensureLabInterview = async (forceNew = false): Promise<string> => {
    if (!forceNew && labInterviewId) return labInterviewId;
    if (!clerkUserId) {
      throw new Error("Sign in as super-admin to create a Lab interview");
    }
    const created = await createLabInterview({
      userId: clerkUserId,
      role: labInterviewSetup.role.trim() || "Backend Engineer",
      experience: labInterviewSetup.experience,
      language: labInterviewSetup.language,
      department: labInterviewSetup.department,
      discipline: labInterviewSetup.discipline,
      targetCompany: labInterviewSetup.targetCompany.trim() || "Acme Corp",
      interviewDuration: labInterviewSetup.interviewDuration,
      ...(labInterviewSetup.jobDescription.trim()
        ? { jobDescription: labInterviewSetup.jobDescription.trim() }
        : {}),
    });
    setLabInterviewId(created.interviewId);
    toast.success(
      `Lab interview ${created.interviewId} · ${labProfileNameFromSetup(labInterviewSetup)}`,
    );
    return created.interviewId;
  };

  const onCreateLabInterview = async () => {
    setLoading(true);
    try {
      setComposeResult(null);
      await ensureLabInterview(true);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  const onResetLabInterview = () => {
    setLabInterviewId(null);
    setComposeResult(null);
    setVoiceSessionId(null);
    setVoiceAutoStart(false);
    setVoiceStatus("idle");
    setResolvedPrompt("");
  };

  const onComposePreview = async () => {
    setLoading(true);
    try {
      const id = await ensureLabInterview();
      const result = await composeLabLive({
        interviewId: id,
        environment: testPromptEnv,
        useDraft: useEditorDraft,
        promptDraft: useEditorDraft ? editorContent : undefined,
        promptName: "interviewer-system",
        startVoice: false,
      });
      setComposeResult(result);
      setResolvedPrompt(result.systemPrompt);
      toast.success("Composition preview ready");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  const onCompositionLiveTest = async () => {
    setLoading(true);
    setVoiceStatus("preparing production-path Live Test…");
    setVoiceAutoStart(false);
    try {
      const id = await ensureLabInterview();
      const provider = getDefaultVoiceProvider();
      const result = await composeLabLive({
        interviewId: id,
        environment: testPromptEnv,
        useDraft: useEditorDraft,
        promptDraft: useEditorDraft ? editorContent : undefined,
        promptName: "interviewer-system",
        startVoice: true,
        provider,
        passthrough: provider === "openai",
      });
      setComposeResult(result);
      setResolvedPrompt(result.systemPrompt);
      if (!result.sessionId) {
        throw new Error("compose-live did not return sessionId");
      }
      setVoiceSessionId(result.sessionId);
      setVoiceAutoStart(true);
      setVoiceStatus("Live Test starting…");
      toast.success(
        useEditorDraft
          ? `Live Test (${testPromptEnv} + draft overlay)`
          : `Live Test (${testPromptEnv})`,
      );
    } catch (e) {
      setVoiceStatus("error");
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  const onLiveTest = async () => {
    if (!meta?.supportsVoiceTest) return;

    // interviewer-system uses production-path composition panel
    if (selectedName === "interviewer-system") {
      await onCompositionLiveTest();
      return;
    }

    if (!hasUsableInput()) {
      toast.error(
        "Add fixture JSON or Capture-from-interview before Live Test",
      );
      return;
    }
    setLoading(true);
    setVoiceStatus("preparing Live Test…");
    setVoiceAutoStart(false);
    setUseEditorDraft(true);
    try {
      const input = parseFixtureInput();
      const provider = getDefaultVoiceProvider();
      const draftOn = !meta.previewViaLiveWrapper;

      if (supportsFullLabRun(selectedName)) {
        const { promptRef, profileRef } = composeRefs();
        const result = await runLabAgent({
          promptName: promptRef.name,
          input,
          environment: testPromptEnv,
          profileRef,
          provider,
          passthrough: provider === "openai",
          ...(draftOn ? { promptDraft: editorContent } : {}),
          ...(captureInterviewId.trim()
            ? { interviewId: captureInterviewId.trim() }
            : {}),
        });
        if (result.mode !== "voice") {
          throw new Error(`Expected voice mode, got ${result.mode}`);
        }
        setResolvedPrompt(result.systemPrompt);
        setVoiceSessionId(result.sessionId);
        setVoiceAutoStart(true);
        setVoiceStatus("Live Test starting…");
        toast.success(
          draftOn
            ? "Live Test on unsaved draft"
            : "Live Test session ready",
        );
        return;
      }

      const session = await createSession({
        ...sessionPayload(input),
        promptDraft: draftOn ? editorContent : undefined,
        passthrough: provider === "openai",
      });
      setResolvedPrompt(session.systemPrompt);
      setVoiceSessionId(session.sessionId);
      setVoiceAutoStart(true);
      setVoiceStatus("Live Test starting…");
      toast.success("Live Test session ready");
    } catch (e) {
      setVoiceStatus("error");
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  const testSourceLabel = useEditorDraft
    ? `testing ${testPromptEnv} + draft`
    : `testing ${testPromptEnv} v${editorVersion}`;

  const playgroundProps = meta
    ? {
        meta,
        composition:
          selectedName === "interviewer-system"
            ? {
                interviewId: labInterviewId,
                environment: testPromptEnv,
                onEnvironmentChange: setTestPromptEnv,
                useDraft: useEditorDraft,
                onUseDraftChange: setUseEditorDraft,
                setup: labInterviewSetup,
                onSetupChange: (patch) =>
                  setLabInterviewSetup((prev) => ({ ...prev, ...patch })),
                composeResult,
                onCompose: () => void onComposePreview(),
                onLiveTest: () => void onCompositionLiveTest(),
                onCreateInterview: () => void onCreateLabInterview(),
                onResetInterview: onResetLabInterview,
              }
            : undefined,
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
        testSourceLabel,
        profileLabel:
          selectedName === "interviewer-system"
            ? labProfileNameFromSetup(labInterviewSetup)
            : selectedProfile || undefined,
        loading,
        onRenderTest,
        onExecuteTest,
        onLiveTest,
        voiceSessionId,
        voiceAutoStart,
        voiceStatus,
        onVoiceStatus: setVoiceStatus,
        onVoiceEnded: () => {
          setVoiceAutoStart(false);
          setVoiceSessionId(null);
          setVoiceStatus("live test ended");
        },
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
            Runtime:{" "}
            <code className="rounded bg-muted px-1">{getRuntimeApiUrl()}</code>
            . Set{" "}
            <code className="rounded bg-muted px-1">
              NEXT_PUBLIC_RUNTIME_API_URL
            </code>{" "}
            on the FE deploy if this looks wrong. Seed only if prompts are empty:{" "}
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

      <div className="min-h-0 flex-1 overflow-hidden">
        {isLg ? (
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
        ) : (
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
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
        )}
      </div>
    </div>
  );
}
