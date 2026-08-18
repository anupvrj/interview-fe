const RUNTIME_API_URL =
  process.env.NEXT_PUBLIC_RUNTIME_API_URL ||
  process.env.NEXT_PUBLIC_RESEARCH_API_URL?.replace(":8001", ":8002") ||
  "http://localhost:8002";

const RUNTIME_WS_URL =
  process.env.NEXT_PUBLIC_RUNTIME_WS_URL ||
  RUNTIME_API_URL.replace(/^http/, "ws");

/** Lab + voice sessions — gemini unless explicitly chatgpt/openai. */
export function getDefaultVoiceProvider(): "openai" | "gemini" {
  const raw = (process.env.NEXT_PUBLIC_VOICE_PROVIDER || "gemini").toLowerCase();
  if (raw === "openai" || raw === "chatgpt") return "openai";
  return "gemini";
}

export type PromptRecord = {
  name: string;
  version: string;
  content: string;
  inputVariables?: string[];
  environment: string;
  description?: string;
  tags?: string[];
  modelConfig?: Record<string, unknown>;
};

export type PromptFixture = {
  appId?: string;
  name: string;
  promptName: string;
  profileName?: string;
  input: Record<string, unknown>;
  description?: string;
};

export type SessionCreateResponse = {
  sessionId: string;
  systemPrompt: string;
  promptRef: { name: string; environment: string };
  profileRef?: { name: string; environment: string };
  provider: "openai" | "gemini";
  mode: "voice" | "execute";
};

async function runtimeFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const body = init?.body;
  if (body != null && body !== "") {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }
  const res = await fetch(`${RUNTIME_API_URL}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Runtime API error ${res.status}`);
  }
  return res.json();
}

export function getRuntimeWsUrl(): string {
  return RUNTIME_WS_URL;
}

export async function listPrompts(environment?: string): Promise<PromptRecord[]> {
  const q = environment ? `?environment=${encodeURIComponent(environment)}` : "";
  return runtimeFetch(`/prompts${q}`);
}

export async function getPrompt(
  name: string,
  environment?: string,
): Promise<PromptRecord> {
  const q = environment ? `?environment=${encodeURIComponent(environment)}` : "";
  return runtimeFetch(`/prompts/${encodeURIComponent(name)}${q}`);
}

export async function savePrompt(prompt: PromptRecord): Promise<{ status: string }> {
  return runtimeFetch("/prompts", {
    method: "POST",
    body: JSON.stringify(prompt),
  });
}

export async function promotePrompt(
  name: string,
  targetEnvironment: string,
  sourceEnvironment = "development",
): Promise<{ status: string; prompt: PromptRecord }> {
  const params = new URLSearchParams({
    source_environment: sourceEnvironment,
    target_environment: targetEnvironment,
  });
  return runtimeFetch(`/prompts/${encodeURIComponent(name)}/promote?${params}`, {
    method: "POST",
    body: "{}",
  });
}

export async function listFixtures(appId = "interviewtrix"): Promise<PromptFixture[]> {
  return runtimeFetch(`/prompt-fixtures?appId=${encodeURIComponent(appId)}`);
}

export async function saveFixture(fixture: PromptFixture): Promise<{ status: string }> {
  return runtimeFetch("/prompt-fixtures", {
    method: "POST",
    body: JSON.stringify(fixture),
  });
}

export async function deleteFixture(
  name: string,
  appId = "interviewtrix",
): Promise<{ status: string }> {
  return runtimeFetch(
    `/prompt-fixtures/${encodeURIComponent(name)}?appId=${encodeURIComponent(appId)}`,
    { method: "DELETE" },
  );
}

const CORE_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";

export async function captureLabInput(
  interviewId: string,
  surface = "live",
): Promise<{
  promptRef: { name: string; environment: string };
  profileRef?: { name: string; environment: string };
  input: Record<string, unknown>;
  surface: string;
  interviewId: string;
}> {
  const params = new URLSearchParams({ interviewId, surface });
  const res = await fetch(
    `${CORE_API_URL}/internal/lab/capture-input?${params}`,
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Capture failed ${res.status}`);
  }
  return res.json();
}

export async function createSession(body: {
  appId?: string;
  mode?: "voice" | "execute";
  provider?: "openai" | "gemini";
  promptRef: { name: string; environment?: string };
  profileRef?: { name: string; environment?: string };
  input?: Record<string, unknown>;
  promptDraft?: string;
  voice?: string;
  temperature?: number;
  passthrough?: boolean;
}): Promise<SessionCreateResponse> {
  return runtimeFetch("/v1/sessions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function connectVoiceSession(sessionId: string): WebSocket {
  const url = `${getRuntimeWsUrl()}/agent/realtime?sessionId=${encodeURIComponent(sessionId)}`;
  return new WebSocket(url);
}

export async function executePrompt(body: {
  promptRef: { name: string; environment?: string };
  profileRef?: { name: string; environment?: string };
  input?: Record<string, unknown>;
  provider?: "openai" | "gemini";
  model?: string;
  temperature?: number;
  responseFormat?: "text" | "json_object";
}): Promise<{
  status: string;
  output: string;
  systemPrompt: string;
}> {
  return runtimeFetch("/v1/execute", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function listAgentSpecs(
  environment?: string,
): Promise<unknown[]> {
  const q = environment ? `?environment=${encodeURIComponent(environment)}` : "";
  return runtimeFetch(`/agent-specs${q}`);
}

export async function saveAgentSpec(
  spec: Record<string, unknown>,
): Promise<{ status: string }> {
  return runtimeFetch("/agent-specs", {
    method: "POST",
    body: JSON.stringify(spec),
  });
}
