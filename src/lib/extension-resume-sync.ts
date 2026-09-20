/**
 * Page → Chrome extension bridge. Must stay in sync with
 * interview-chrome-extension/src/shared.ts and src/bridge.ts.
 */

export const EXTENSION_PAGE_SOURCE = "interviewtrix";
export const EXTENSION_BRIDGE_SOURCE = "interviewtrix-extension";
export const EXTENSION_ATTACH_SESSION_KEY = "interviewtrix.extensionAttachSession";
export const MAX_RESUME_PDF_BYTES = 6 * 1024 * 1024;

export type ActiveResumePayload = {
  v: 1;
  resumeId: string;
  title: string;
  fileName: string;
  mimeType: "application/pdf";
  fileBlobBase64: string;
  byteLength: number;
  lastCompiledAt: string;
  sourceUrl?: string;
  jobFingerprint?: string;
  readyToAttach: true;
};

export type ExtensionAttachSession = {
  resumeId: string;
  sourceUrl?: string;
  markedAt: string;
};

export function parseActiveResumePayload(value: unknown): ActiveResumePayload | null {
  if (!value || typeof value !== "object") return null;
  const rec = value as Partial<ActiveResumePayload>;
  if (rec.v !== 1) return null;
  if (typeof rec.resumeId !== "string" || !rec.resumeId.trim()) return null;
  if (typeof rec.fileName !== "string" || !rec.fileName.trim()) return null;
  if (typeof rec.fileBlobBase64 !== "string" || rec.fileBlobBase64.length === 0) {
    return null;
  }
  if (rec.mimeType !== "application/pdf") return null;
  if (typeof rec.byteLength !== "number" || !Number.isFinite(rec.byteLength)) {
    return null;
  }
  if (rec.byteLength <= 0 || rec.byteLength > MAX_RESUME_PDF_BYTES) return null;
  if (typeof rec.lastCompiledAt !== "string" || !rec.lastCompiledAt) return null;
  if (rec.readyToAttach !== true) return null;
  return {
    v: 1,
    resumeId: rec.resumeId.trim(),
    title:
      typeof rec.title === "string" && rec.title.trim() ? rec.title.trim() : "Resume",
    fileName: rec.fileName.trim(),
    mimeType: "application/pdf",
    fileBlobBase64: rec.fileBlobBase64,
    byteLength: rec.byteLength,
    lastCompiledAt: rec.lastCompiledAt,
    sourceUrl: typeof rec.sourceUrl === "string" ? rec.sourceUrl : undefined,
    jobFingerprint:
      typeof rec.jobFingerprint === "string" ? rec.jobFingerprint : undefined,
    readyToAttach: true,
  };
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += chunk) {
    parts.push(String.fromCharCode(...bytes.subarray(i, i + chunk)));
  }
  return btoa(parts.join(""));
}

export function saveExtensionAttachSession(session: ExtensionAttachSession): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      EXTENSION_ATTACH_SESSION_KEY,
      JSON.stringify(session),
    );
  } catch {
    /* quota */
  }
}

export function loadExtensionAttachSession(
  resumeId: string,
): ExtensionAttachSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(EXTENSION_ATTACH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExtensionAttachSession;
    if (parsed?.resumeId !== resumeId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export type ExtensionPingResult = {
  installed: boolean;
  needsSession: boolean;
};

export function probeInterviewTrixExtension(
  timeoutMs = 400,
): Promise<ExtensionPingResult> {
  if (typeof window === "undefined") {
    return Promise.resolve({ installed: false, needsSession: false });
  }
  const requestId = `ping-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve({ installed: false, needsSession: false });
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data = event.data as {
        source?: string;
        type?: string;
        requestId?: string;
        needsSession?: boolean;
      } | null;
      if (
        data?.source !== EXTENSION_BRIDGE_SOURCE ||
        data.type !== "RESUME_SYNC_PONG" ||
        data.requestId !== requestId
      ) {
        return;
      }
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve({
        installed: true,
        needsSession: data.needsSession === true,
      });
    }

    window.addEventListener("message", onMessage);
    window.postMessage(
      { source: EXTENSION_PAGE_SOURCE, type: "RESUME_SYNC_PING", requestId },
      window.location.origin,
    );
  });
}

export function pingInterviewTrixExtension(timeoutMs = 400): Promise<boolean> {
  return probeInterviewTrixExtension(timeoutMs).then((result) => result.installed);
}

export async function sendExtensionSession(
  token: string,
  timeoutMs = 400,
): Promise<{ ok: boolean; error?: string; installed: boolean }> {
  if (typeof window === "undefined") {
    return { ok: false, error: "no_window", installed: false };
  }
  if (!token.trim()) {
    return { ok: false, error: "invalid_token", installed: false };
  }

  const installed = await pingInterviewTrixExtension(timeoutMs);
  if (!installed) return { ok: false, error: "no_extension", installed: false };

  const requestId = `session-${Date.now()}`;
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve({ ok: false, error: "timeout", installed: true });
    }, 4000);

    function onMessage(event: MessageEvent) {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data = event.data as {
        source?: string;
        type?: string;
        requestId?: string;
        ok?: boolean;
        error?: string;
      } | null;
      if (
        data?.source !== EXTENSION_BRIDGE_SOURCE ||
        data.type !== "EXTENSION_SESSION_ACK" ||
        data.requestId !== requestId
      ) {
        return;
      }
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve({
        ok: Boolean(data.ok),
        error: data.error,
        installed: true,
      });
    }

    window.addEventListener("message", onMessage);
    window.postMessage(
      {
        source: EXTENSION_PAGE_SOURCE,
        type: "EXTENSION_SESSION",
        requestId,
        token,
      },
      window.location.origin,
    );
  });
}

export async function ensureExtensionSession(options?: {
  timeoutMs?: number;
}): Promise<{
  ok: boolean;
  installed: boolean;
  error?: string;
}> {
  const timeoutMs = options?.timeoutMs ?? 400;
  const probe = await probeInterviewTrixExtension(timeoutMs);
  if (!probe.installed) {
    return { ok: false, installed: false, error: "no_extension" };
  }
  if (!probe.needsSession) {
    return { ok: true, installed: true };
  }

  try {
    const { extensionApi } = await import("@/lib/api");
    const session = await extensionApi.createSession();
    return sendExtensionSession(session.token, timeoutMs);
  } catch (error) {
    return {
      ok: false,
      installed: true,
      error: error instanceof Error ? error.message : "session_failed",
    };
  }
}

export type ExtensionJobLink = {
  sourceUrl: string;
  title: string;
  company: string;
  jobDescription?: string;
};

export function parseLastScanResult(data: {
  sourceUrl?: string;
  title?: string;
  company?: string;
  jobDescription?: string;
}): ExtensionJobLink | null {
  const sourceUrl = typeof data.sourceUrl === "string" ? data.sourceUrl.trim() : "";
  const jobDescription =
    typeof data.jobDescription === "string" ? data.jobDescription.trim() : "";
  if (!sourceUrl && !jobDescription) return null;
  return {
    sourceUrl,
    title: typeof data.title === "string" ? data.title : "",
    company: typeof data.company === "string" ? data.company : "",
    ...(jobDescription ? { jobDescription } : {}),
  };
}

export function requestLastScannedJob(
  timeoutMs = 400,
): Promise<ExtensionJobLink | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const requestId = `last-scan-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve(null);
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data = event.data as {
        source?: string;
        type?: string;
        requestId?: string;
        sourceUrl?: string;
        title?: string;
        company?: string;
        jobDescription?: string;
      } | null;
      if (
        data?.source !== EXTENSION_BRIDGE_SOURCE ||
        data.type !== "GET_LAST_SCAN_RESULT" ||
        data.requestId !== requestId
      ) {
        return;
      }
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve(parseLastScanResult(data));
    }

    window.addEventListener("message", onMessage);
    window.postMessage(
      { source: EXTENSION_PAGE_SOURCE, type: "GET_LAST_SCAN", requestId },
      window.location.origin,
    );
  });
}

export async function requestExtensionJobMatch(
  input: {
    resumeId: string;
    jobDescription: string;
    title?: string;
    company?: string;
  },
  timeoutMs = 100000,
): Promise<{ ok: boolean; matchScore?: number; error?: string }> {
  if (typeof window === "undefined") {
    return { ok: false, error: "no_window" };
  }
  const jobDescription = input.jobDescription.trim();
  if (jobDescription.length < 50) {
    return { ok: false, error: "short_jd" };
  }

  const installed = await pingInterviewTrixExtension();
  if (!installed) return { ok: false, error: "no_extension" };

  const requestId = `job-match-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve({ ok: false, error: "timeout" });
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data = event.data as {
        source?: string;
        type?: string;
        requestId?: string;
        ok?: boolean;
        matchScore?: number;
        error?: string;
      } | null;
      if (
        data?.source !== EXTENSION_BRIDGE_SOURCE ||
        data.type !== "JOB_MATCH_RESULT" ||
        data.requestId !== requestId
      ) {
        return;
      }
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve({
        ok: Boolean(data.ok),
        matchScore: typeof data.matchScore === "number" ? data.matchScore : undefined,
        error: typeof data.error === "string" ? data.error : undefined,
      });
    }

    window.addEventListener("message", onMessage);
    window.postMessage(
      {
        source: EXTENSION_PAGE_SOURCE,
        type: "JOB_MATCH",
        requestId,
        resumeId: input.resumeId,
        jobDescription,
        title: input.title,
        company: input.company,
      },
      window.location.origin,
    );
  });
}

export async function resolveExtensionJobLink(
  resumeId?: string,
): Promise<ExtensionJobLink | null> {
  if (resumeId) {
    const session = loadExtensionAttachSession(resumeId);
    if (session?.sourceUrl?.trim()) {
      return { sourceUrl: session.sourceUrl.trim(), title: "", company: "" };
    }
  }

  try {
    const { loadPendingJobCapture } = await import("@/lib/extension-job-handoff");
    const capture = loadPendingJobCapture();
    if (capture?.sourceUrl?.trim()) {
      return {
        sourceUrl: capture.sourceUrl.trim(),
        title: capture.title || "",
        company: capture.company || "",
      };
    }
  } catch {
    /* ignore */
  }

  return requestLastScannedJob();
}

export async function returnToExtensionJobTab(
  timeoutMs = 1500,
): Promise<{ ok: boolean }> {
  if (typeof window === "undefined") return { ok: false };
  const installed = await pingInterviewTrixExtension(timeoutMs);
  if (!installed) return { ok: false };

  const requestId = `return-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve({ ok: false });
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data = event.data as {
        source?: string;
        type?: string;
        requestId?: string;
        ok?: boolean;
      } | null;
      if (
        data?.source !== EXTENSION_BRIDGE_SOURCE ||
        data.type !== "RETURN_TO_JOB_TAB_RESULT" ||
        data.requestId !== requestId
      ) {
        return;
      }
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve({ ok: Boolean(data.ok) });
    }

    window.addEventListener("message", onMessage);
    window.postMessage(
      { source: EXTENSION_PAGE_SOURCE, type: "RETURN_TO_JOB_TAB", requestId },
      window.location.origin,
    );
  });
}

export function jobPageButtonLabel(link: ExtensionJobLink | null): string {
  if (!link?.sourceUrl) return "Open job page";
  let host = "";
  try {
    host = new URL(link.sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    host = "";
  }
  const title = link.title.trim();
  if (title && host) return `${title} · ${host}`;
  if (host) return host;
  return "Open job page";
}

export async function notifyExtensionResumeCompiled(input: {
  resumeId: string;
  title: string;
  fileName: string;
  blob: Blob;
  sourceUrl?: string;
  jobFingerprint?: string;
}): Promise<{ ok: boolean; error?: string; installed: boolean }> {
  if (typeof window === "undefined") {
    return { ok: false, error: "no_window", installed: false };
  }
  if (input.blob.size > MAX_RESUME_PDF_BYTES) {
    return { ok: false, error: "too_large", installed: true };
  }

  const installed = await pingInterviewTrixExtension();
  if (!installed) return { ok: false, error: "no_extension", installed: false };

  const fileBlobBase64 = await blobToBase64(input.blob);
  const payload: ActiveResumePayload = {
    v: 1,
    resumeId: input.resumeId,
    title: input.title,
    fileName: input.fileName,
    mimeType: "application/pdf",
    fileBlobBase64,
    byteLength: input.blob.size,
    lastCompiledAt: new Date().toISOString(),
    sourceUrl: input.sourceUrl,
    jobFingerprint: input.jobFingerprint,
    readyToAttach: true,
  };

  const parsed = parseActiveResumePayload(payload);
  if (!parsed) return { ok: false, error: "invalid_payload", installed: true };

  const requestId = `compiled-${Date.now()}`;
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve({ ok: false, error: "timeout", installed: true });
    }, 4000);

    function onMessage(event: MessageEvent) {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data = event.data as {
        source?: string;
        type?: string;
        requestId?: string;
        ok?: boolean;
        error?: string;
      } | null;
      if (
        data?.source !== EXTENSION_BRIDGE_SOURCE ||
        data.type !== "RESUME_COMPILED_ACK" ||
        data.requestId !== requestId
      ) {
        return;
      }
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve({
        ok: Boolean(data.ok),
        error: data.error,
        installed: true,
      });
    }

    window.addEventListener("message", onMessage);
    window.postMessage(
      {
        source: EXTENSION_PAGE_SOURCE,
        type: "RESUME_COMPILED",
        requestId,
        payload,
      },
      window.location.origin,
    );
  });
}
