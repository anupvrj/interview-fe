const RESEARCH_API_URL =
  process.env.NEXT_PUBLIC_RESEARCH_API_URL || "http://localhost:8001";

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

export type AgentInfo = {
  id: string;
  name: string;
  description: string;
  type: string;
};

export type AgentSpecRecord = {
  id: string;
  name: string;
  version: string;
  description?: string;
  environment: string;
  stateSchema?: Record<string, unknown>;
  steps?: unknown[];
  edges?: unknown[];
  entryPoint?: string;
};

async function researchFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${RESEARCH_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Research API error ${res.status}`);
  }
  return res.json();
}

export async function listPrompts(environment?: string): Promise<PromptRecord[]> {
  const q = environment ? `?environment=${encodeURIComponent(environment)}` : "";
  return researchFetch(`/prompts${q}`);
}

export async function getPrompt(
  name: string,
  environment?: string,
): Promise<PromptRecord> {
  const q = environment ? `?environment=${encodeURIComponent(environment)}` : "";
  return researchFetch(`/prompts/${encodeURIComponent(name)}${q}`);
}

export async function savePrompt(prompt: PromptRecord): Promise<{ status: string }> {
  return researchFetch("/prompts", {
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
  return researchFetch(`/prompts/${encodeURIComponent(name)}/promote?${params}`, {
    method: "POST",
  });
}

export async function listAgents(): Promise<AgentInfo[]> {
  return researchFetch("/agents");
}

export async function invokeAgent(body: {
  agent_id: string;
  input: string;
  prompt_id?: string;
  provider?: string;
}): Promise<{ output: string; status: string }> {
  return researchFetch("/invoke-agent", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function listAgentSpecs(
  environment?: string,
): Promise<AgentSpecRecord[]> {
  const q = environment ? `?environment=${encodeURIComponent(environment)}` : "";
  return researchFetch(`/agent-specs${q}`);
}

export async function saveAgentSpec(
  spec: AgentSpecRecord,
): Promise<{ status: string }> {
  return researchFetch("/agent-specs", {
    method: "POST",
    body: JSON.stringify(spec),
  });
}

export function streamAgent(
  body: {
    agent_id: string;
    input: string;
    prompt_id?: string;
    provider?: string;
  },
  onEvent: (data: unknown) => void,
  onDone?: () => void,
  onError?: (err: Error) => void,
): () => void {
  const controller = new AbortController();

  fetch(`${RESEARCH_API_URL}/stream-agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok || !res.body) {
        throw new Error(`Stream failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const payload = part.slice(6).trim();
          if (payload === "[DONE]") {
            onDone?.();
            return;
          }
          try {
            onEvent(JSON.parse(payload));
          } catch {
            /* ignore partial */
          }
        }
      }
      onDone?.();
    })
    .catch((err) => onError?.(err as Error));

  return () => controller.abort();
}
