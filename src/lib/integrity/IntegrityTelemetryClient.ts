import { API_URL, getAuthToken } from "@/lib/api";
import {
  HIGH_FLUSH_TYPES,
  type IntegrityEvent,
  type IntegritySessionKind,
} from "./types";

export type IntegrityWsSender = (
  payload: Record<string, unknown>,
) => boolean | void;

const DEDUP_MS = 2000;
const BATCH_MS = 2000;
const MAX_QUEUE = 30;

export class IntegrityTelemetryClient {
  private queue: IntegrityEvent[] = [];
  private lastByType = new Map<string, number>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private wsSend: IntegrityWsSender | null = null;
  private enabled = true;

  constructor(
    readonly kind: IntegritySessionKind,
    readonly sessionId: string,
  ) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  bindWs(send: IntegrityWsSender | null): void {
    this.wsSend = send;
  }

  emit(event: IntegrityEvent): void {
    if (!this.enabled) return;
    const last = this.lastByType.get(event.type) ?? 0;
    if (event.timestamp - last < DEDUP_MS) return;
    this.lastByType.set(event.type, event.timestamp);
    this.queue.push(event);
    if (this.queue.length > MAX_QUEUE) {
      this.queue.splice(0, this.queue.length - MAX_QUEUE);
    }
    if (HIGH_FLUSH_TYPES.has(event.type)) {
      void this.flush();
      return;
    }
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, BATCH_MS);
  }

  async flush(opts?: { keepalive?: boolean }): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.queue.length === 0) return;
    const events = this.queue.splice(0, this.queue.length);

    if (this.wsSend) {
      try {
        const delivered = this.wsSend({ type: "telemetry:anomaly", events });
        if (delivered !== false) return;
      } catch {
        /* fall through to REST */
      }
    }

    try {
      await postIntegrityEvents(this.kind, this.sessionId, events, opts?.keepalive);
    } catch {
      this.queue.unshift(...events);
      if (this.queue.length > MAX_QUEUE) {
        this.queue.splice(MAX_QUEUE);
      }
    }
  }

  dispose(): void {
    void this.flush({ keepalive: true });
    this.wsSend = null;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    const userId = localStorage.getItem("clerk-user-id");
    if (userId) headers["x-user-id"] = userId;
  }
  try {
    const token = await getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    /* ignore */
  }
  return headers;
}

export function integrityEventsUrl(
  kind: IntegritySessionKind,
  sessionId: string,
): string {
  return kind === "system_design"
    ? `${API_URL}/system-design/sessions/${encodeURIComponent(sessionId)}/integrity/events`
    : `${API_URL}/interviews/${encodeURIComponent(sessionId)}/integrity/events`;
}

export function integrityEvidenceUrl(
  kind: IntegritySessionKind,
  sessionId: string,
): string {
  return kind === "system_design"
    ? `${API_URL}/system-design/sessions/${encodeURIComponent(sessionId)}/integrity/evidence`
    : `${API_URL}/interviews/${encodeURIComponent(sessionId)}/integrity/evidence`;
}

export async function postIntegrityEvents(
  kind: IntegritySessionKind,
  sessionId: string,
  events: IntegrityEvent[],
  keepalive?: boolean,
): Promise<void> {
  if (events.length === 0) return;
  const headers = await authHeaders();
  await fetch(integrityEventsUrl(kind, sessionId), {
    method: "POST",
    headers,
    body: JSON.stringify({ events }),
    keepalive: Boolean(keepalive),
    credentials: "include",
  });
}

export async function postIntegrityEvidence(
  kind: IntegritySessionKind,
  sessionId: string,
  payload: {
    imageBase64: string;
    mimeType?: string;
    type: IntegrityEvent["type"];
    timestamp: number;
  },
): Promise<void> {
  const headers = await authHeaders();
  await fetch(integrityEvidenceUrl(kind, sessionId), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    credentials: "include",
  });
}

export function integrityVoiceprintUrl(
  kind: IntegritySessionKind,
  sessionId: string,
  action: "challenge" | "enroll" | "verify",
): string {
  const base =
    kind === "system_design"
      ? `${API_URL}/system-design/sessions/${encodeURIComponent(sessionId)}/integrity/voiceprint`
      : `${API_URL}/interviews/${encodeURIComponent(sessionId)}/integrity/voiceprint`;
  return `${base}/${action}`;
}

async function voiceprintJson<T>(
  kind: IntegritySessionKind,
  sessionId: string,
  action: "challenge" | "enroll" | "verify",
  body?: Record<string, unknown>,
): Promise<T> {
  const headers = await authHeaders();
  const response = await fetch(integrityVoiceprintUrl(kind, sessionId, action), {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : "{}",
    credentials: "include",
  });
  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
    data?: T;
  } | null;
  if (!response.ok || !json?.success || json.data === undefined) {
    throw new Error(json?.message || "Voice verification request failed");
  }
  return json.data;
}

export function requestVoiceprintChallenge(
  kind: IntegritySessionKind,
  sessionId: string,
) {
  return voiceprintJson<{
    challengeId: string;
    phrase: string;
    modelId: string;
  }>(kind, sessionId, "challenge");
}

export function enrollVoiceprint(
  kind: IntegritySessionKind,
  sessionId: string,
  payload: { challengeId: string; audioWavBase64: string },
) {
  return voiceprintJson<{ enrolled: true; durationMs: number }>(
    kind,
    sessionId,
    "enroll",
    payload,
  );
}

export function verifyVoiceprint(
  kind: IntegritySessionKind,
  sessionId: string,
  payload: { audioWavBase64: string; turnId?: string },
) {
  return voiceprintJson<
    | { matched: boolean; similarity: number; flagged: boolean }
    | { skipped: true; reason: string }
  >(kind, sessionId, "verify", payload);
}
