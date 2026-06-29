"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  getKindLabel,
  latestPromptsPerName,
  type PromptClassification,
} from "@/lib/labPromptCatalog";
import { LabVoicePanel } from "@/components/lab/LabVoicePanel";
import { LabKindLegend } from "@/components/lab/LabKindLegend";
import { LabPromptSidebar } from "@/components/lab/LabPromptSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FlaskConical, Loader2, RefreshCw } from "lucide-react";

const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || "development";

const KIND_HEADER: Record<string, string> = {
  voice: "border-sky-500/30 bg-sky-500/5",
  execute: "border-violet-500/30 bg-violet-500/5",
  profile: "border-amber-500/30 bg-amber-500/5",
};

export default function LabPage() {
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [fixtures, setFixtures] = useState<PromptFixture[]>([]);
  const [selectedName, setSelectedName] = useState("interviewer-system");
  const [selectedProfile, setSelectedProfile] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorVersion, setEditorVersion] = useState("1.0.0");
  const [targetEnv, setTargetEnv] = useState("staging");
  const [fixtureInput, setFixtureInput] = useState("{}");
  const [fixtureName, setFixtureName] = useState("golden-live");
  const [captureInterviewId, setCaptureInterviewId] = useState("");
  const [useEditorDraft, setUseEditorDraft] = useState(false);
  const [resolvedPrompt, setResolvedPrompt] = useState("");
  const [executeOutput, setExecuteOutput] = useState("");
  const [voiceSessionId, setVoiceSessionId] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [status, setStatus] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const catalog = useMemo(() => latestPromptsPerName(prompts), [prompts]);
  const selectedPrompt = catalog.find((p) => p.name === selectedName);
  const meta: PromptClassification | null = selectedPrompt
    ? classifyPrompt(selectedPrompt)
    : null;
  const profilePrompts = catalog.filter((p) => p.name.startsWith("profile-"));

  const selectPrompt = useCallback((p: PromptRecord) => {
    const m = classifyPrompt(p);
    setSelectedName(p.name);
    setEditorContent(p.content);
    setEditorVersion(p.version);
    setFixtureInput(
      JSON.stringify(defaultFixtureForPrompt(p.name, m.kind), null, 2),
    );
    setResolvedPrompt("");
    setExecuteOutput("");
    setVoiceSessionId(null);
    setStatus(null);
  }, []);

  const refresh = useCallback(async () => {
    setLoadError(null);
    const [p, f] = await Promise.all([
      listPrompts("development"),
      listFixtures(),
    ]);
    setPrompts(p);
    setFixtures(f);
    const current = latestPromptsPerName(p).find((x) => x.name === selectedName);
    if (current) {
      setEditorContent(current.content);
      setEditorVersion(current.version);
    }
  }, [selectedName]);

  useEffect(() => {
    refresh().catch((e) => setLoadError(String(e)));
  }, [refresh]);

  useEffect(() => {
    if (catalog.length && !selectedPrompt) {
      const first = catalog.find((p) => p.name === "interviewer-system") ?? catalog[0];
      if (first) selectPrompt(first);
    }
  }, [catalog, selectedPrompt, selectPrompt]);

  const parseFixtureInput = (): Record<string, unknown> => {
    try {
      return JSON.parse(fixtureInput) as Record<string, unknown>;
    } catch {
      throw new Error("Fixture input must be valid JSON");
    }
  };

  /** Voice wrapper ref + optional profile for render/voice tests */
  const composeRefs = () => {
    if (meta?.previewViaLiveWrapper && selectedName.startsWith("profile-")) {
      return {
        promptRef: { name: "interviewer-system", environment: "development" as const },
        profileRef: { name: selectedName, environment: "development" as const },
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
    setStatus(null);
    try {
      await savePrompt({
        name: selectedName,
        version: editorVersion,
        content: editorContent,
        environment: "development",
        inputVariables: selectedPrompt?.inputVariables ?? [],
        description: selectedPrompt?.description ?? `Lab edit ${new Date().toISOString()}`,
        tags: selectedPrompt?.tags,
      });
      setStatus("Saved to development");
      await refresh();
    } catch (e) {
      setStatus(String(e));
    } finally {
      setLoading(false);
    }
  };

  const onPromote = async () => {
    setLoading(true);
    setStatus(null);
    try {
      await promotePrompt(selectedName, targetEnv, "development");
      setStatus(`Promoted ${selectedName} → ${targetEnv}`);
    } catch (e) {
      setStatus(String(e));
    } finally {
      setLoading(false);
    }
  };

  const onSaveFixture = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const input = parseFixtureInput();
      const { promptRef, profileRef } = composeRefs();
      await saveFixture({
        name: fixtureName,
        promptName: promptRef.name,
        profileName: profileRef?.name ?? (selectedProfile || undefined),
        input,
        description: `Lab fixture ${selectedName}`,
      });
      setStatus(`Saved fixture "${fixtureName}"`);
      await refresh();
    } catch (e) {
      setStatus(String(e));
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
    if (p) {
      setEditorContent(p.content);
      setEditorVersion(p.version);
    }
    setStatus(`Loaded fixture "${name}"`);
  };

  const onDeleteFixture = async (name: string) => {
    setLoading(true);
    try {
      await deleteFixture(name);
      setStatus(`Deleted fixture "${name}"`);
      await refresh();
    } catch (e) {
      setStatus(String(e));
    } finally {
      setLoading(false);
    }
  };

  const onCaptureInput = async () => {
    if (!captureInterviewId.trim()) {
      setStatus("Enter an interviewId to capture");
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
      setStatus(
        `Captured input for ${captured.interviewId} (${captured.promptRef.name})`,
      );
    } catch (e) {
      setStatus(String(e));
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
      setStatus(`Rendered — session ${session.sessionId.slice(0, 8)}…`);
    } catch (e) {
      setStatus(String(e));
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
      const result = await executePrompt({
        promptRef,
        profileRef,
        input,
        responseFormat: meta?.executeReturnsJson ? "json_object" : "text",
      });
      setResolvedPrompt(result.systemPrompt);
      setExecuteOutput(result.output);
      setStatus(`Execute OK`);
    } catch (e) {
      setStatus(String(e));
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
      setStatus(`Voice session ready (${provider})`);
    } catch (e) {
      setVoiceStatus("error");
      setStatus(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FlaskConical className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Agent Lab</h1>
            <p className="text-sm text-muted-foreground">
              Prompt CMS on runtime · {catalog.length} templates ·{" "}
              <span className="font-medium">{APP_ENV}</span>
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => refresh().catch((e) => setLoadError(String(e)))}
        >
          <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </header>

      <LabKindLegend />

      {loadError ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Could not load prompts</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Runtime must share <code className="rounded bg-muted px-1">MONGODB_URI</code> with
            core. Seed:{" "}
            <code className="rounded bg-muted px-1">
              cd interview-core && npm run seed:prompts development
            </code>
          </CardContent>
        </Card>
      ) : null}

      {!loadError && catalog.length === 0 ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">No prompts in Mongo</CardTitle>
            <CardDescription>
              Run the seed script, then restart runtime.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {status ? (
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          {status}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(220px,260px)_1fr]">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Catalog</CardTitle>
              <CardDescription className="text-xs">
                Grouped by product surface
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto pt-0">
              <LabPromptSidebar
                prompts={prompts}
                selectedName={selectedName}
                onSelect={selectPrompt}
              />
            </CardContent>
          </Card>
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          {selectedPrompt && meta ? (
            <div
              className={cn(
                "rounded-xl border px-4 py-3",
                KIND_HEADER[meta.kind],
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-mono text-sm font-semibold">{selectedName}</h2>
                <Badge variant="outline" className="text-[10px]">
                  {getKindLabel(meta.kind)}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  v{editorVersion}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {meta.categoryLabel}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
              {meta.previewViaLiveWrapper ? (
                <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
                  Profiles compose into{" "}
                  <code className="rounded bg-background/60 px-1">interviewer-system</code> via{" "}
                  <code className="rounded bg-background/60 px-1">profileRef</code>. Use{" "}
                  <strong>Render</strong> below to preview the full system prompt.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Template editor</CardTitle>
                <CardDescription>
                  Changes save to <strong>development</strong> only until promoted.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {meta?.needsProfileRef ? (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Compose with profile (profileRef)
                    </Label>
                    <select
                      className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      value={selectedProfile}
                      onChange={(e) => setSelectedProfile(e.target.value)}
                    >
                      <option value="">— none —</option>
                      {profilePrompts.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div>
                  <Label className="text-xs text-muted-foreground">Version</Label>
                  <input
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    value={editorVersion}
                    onChange={(e) => setEditorVersion(e.target.value)}
                  />
                </div>

                <textarea
                  className="h-64 w-full rounded-md border border-border bg-background p-3 font-mono text-xs leading-relaxed"
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  spellCheck={false}
                />

                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={loading} onClick={onSave}>
                    {loading ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : null}
                    Save
                  </Button>
                  <select
                    className="rounded-md border border-border bg-background px-2 py-2 text-sm"
                    value={targetEnv}
                    onChange={(e) => setTargetEnv(e.target.value)}
                  >
                    <option value="staging">→ staging</option>
                    <option value="production">→ production</option>
                    <option value="experiment">→ experiment</option>
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={onPromote}
                  >
                    Promote
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Test bench</CardTitle>
                <CardDescription>
                  {meta?.supportsVoiceTest
                    ? "Render composes the prompt; voice test uses Gemini mic path."
                    : meta?.supportsExecuteTest
                      ? "Render shows composed prompt; Execute runs one LLM call."
                      : "Render previews how this profile composes into a live session."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <input
                    className="min-w-[8rem] flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    placeholder="Fixture name"
                    value={fixtureName}
                    onChange={(e) => setFixtureName(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={onSaveFixture}
                  >
                    Save fixture
                  </Button>
                  {fixtures.length > 0 ? (
                    <select
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) onLoadFixture(e.target.value);
                        e.target.value = "";
                      }}
                    >
                      <option value="">Load…</option>
                      {fixtures.map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>

                {(meta?.supportsVoiceTest || meta?.needsProfileRef) &&
                !meta.previewViaLiveWrapper ? (
                  <div className="flex flex-wrap gap-2">
                    <input
                      className="min-w-[10rem] flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      placeholder="Interview ID — capture real input from core"
                      value={captureInterviewId}
                      onChange={(e) => setCaptureInterviewId(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      onClick={onCaptureInput}
                    >
                      Capture
                    </Button>
                  </div>
                ) : null}

                <textarea
                  className="h-36 w-full rounded-md border border-border bg-background p-2 font-mono text-xs"
                  value={fixtureInput}
                  onChange={(e) => setFixtureInput(e.target.value)}
                />

                {!meta?.previewViaLiveWrapper ? (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={useEditorDraft}
                      onChange={(e) => setUseEditorDraft(e.target.checked)}
                    />
                    Use unsaved editor draft when rendering
                  </label>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={loading} onClick={onRenderTest}>
                    Render prompt
                  </Button>
                  {meta?.supportsExecuteTest ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loading}
                      onClick={onExecuteTest}
                    >
                      Execute LLM
                      {meta.executeReturnsJson ? " (JSON)" : ""}
                    </Button>
                  ) : null}
                  {meta?.supportsVoiceTest ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loading}
                      onClick={onPrepareVoice}
                    >
                      Prepare voice
                    </Button>
                  ) : null}
                </div>

                {meta?.supportsVoiceTest ? (
                  <LabVoicePanel
                    sessionId={voiceSessionId}
                    onStatus={setVoiceStatus}
                  />
                ) : null}

                {meta?.supportsVoiceTest ? (
                  <p className="text-xs text-muted-foreground">Voice: {voiceStatus}</p>
                ) : null}

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Composed system prompt
                  </Label>
                  <pre className="mt-1 max-h-40 overflow-auto rounded-md border border-border bg-muted/30 p-2 text-xs whitespace-pre-wrap">
                    {resolvedPrompt || "Run Render to preview…"}
                  </pre>
                </div>

                {executeOutput ? (
                  <div>
                    <Label className="text-xs text-muted-foreground">LLM output</Label>
                    <pre className="mt-1 max-h-40 overflow-auto rounded-md border border-border bg-muted/30 p-2 text-xs whitespace-pre-wrap">
                      {executeOutput}
                    </pre>
                  </div>
                ) : null}

                {fixtures.length > 0 ? (
                  <ul className="space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
