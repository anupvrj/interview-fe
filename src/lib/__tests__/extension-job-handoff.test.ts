import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  FROM_JOB_PATH,
  PENDING_JOB_STORAGE_KEY,
  PRACTICE_INTERVIEW_PATH,
  clearPendingJobCapture,
  handoffPathForCapture,
  isExtensionHandoffPath,
  isPracticeInterviewCapture,
  isResumeHandoffCapture,
  loadPendingJobCapture,
  loadPendingJobHandoffPath,
  parsePendingJobCapture,
  savePendingJobCapture,
  tailoredResumeTitle,
} from "@/lib/extension-job-handoff";

const basePayload = {
  v: 1 as const,
  sourceUrl: "https://linkedin.com/jobs/view/1",
  title: "SDE",
  company: "Acme",
  location: "Bengaluru",
  jobDescription: "Build APIs and own delivery.",
  details: { Role: "SDE", "Key Skills": "Node.js" },
  capturedAt: "2026-08-30T00:00:00.000Z",
};

describe("extension-job-handoff", () => {
  it("parses a v1 capture payload", () => {
    const parsed = parsePendingJobCapture(JSON.stringify(basePayload));
    expect(parsed?.title).toBe("SDE");
    expect(parsed?.company).toBe("Acme");
    expect(parsed?.details?.Role).toBe("SDE");
    expect(parsed?.intent).toBeUndefined();
  });

  it("parses practice-interview intent", () => {
    const parsed = parsePendingJobCapture(
      JSON.stringify({ ...basePayload, intent: "practice-interview" }),
    );
    expect(parsed?.intent).toBe("practice-interview");
    expect(isPracticeInterviewCapture(parsed!)).toBe(true);
    expect(isResumeHandoffCapture(parsed!)).toBe(false);
  });

  it("parses resume intent", () => {
    const parsed = parsePendingJobCapture(
      JSON.stringify({ ...basePayload, intent: "resume" }),
    );
    expect(parsed?.intent).toBe("resume");
    expect(isPracticeInterviewCapture(parsed!)).toBe(false);
    expect(isResumeHandoffCapture(parsed!)).toBe(true);
  });

  it("treats legacy payloads without intent as resume handoff", () => {
    const parsed = parsePendingJobCapture(JSON.stringify(basePayload));
    expect(isResumeHandoffCapture(parsed!)).toBe(true);
    expect(isPracticeInterviewCapture(parsed!)).toBe(false);
  });

  it("strips unknown intent values", () => {
    const parsed = parsePendingJobCapture(
      JSON.stringify({ ...basePayload, intent: "unknown" }),
    );
    expect(parsed?.intent).toBeUndefined();
    expect(isResumeHandoffCapture(parsed!)).toBe(true);
  });

  it("rejects invalid payloads", () => {
    expect(parsePendingJobCapture(null)).toBeNull();
    expect(parsePendingJobCapture("{")).toBeNull();
    expect(parsePendingJobCapture(JSON.stringify({ v: 2 }))).toBeNull();
  });

  it("builds a tailored resume title", () => {
    expect(tailoredResumeTitle("SDE II", "Google")).toBe("SDE II · Google");
    expect(tailoredResumeTitle("", "")).toBe("Resume");
  });

  it("maps capture intent to the extension destination", () => {
    expect(handoffPathForCapture(basePayload)).toBe(FROM_JOB_PATH);
    expect(
      handoffPathForCapture({ ...basePayload, intent: "resume" }),
    ).toBe(FROM_JOB_PATH);
    expect(
      handoffPathForCapture({ ...basePayload, intent: "practice-interview" }),
    ).toBe(PRACTICE_INTERVIEW_PATH);
    expect(isExtensionHandoffPath(FROM_JOB_PATH)).toBe(true);
    expect(isExtensionHandoffPath(`${PRACTICE_INTERVIEW_PATH}?x=1`)).toBe(true);
    expect(isExtensionHandoffPath("/dashboard")).toBe(false);
  });
});

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key) {
      return map.get(key) ?? null;
    },
    key(index) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key) {
      map.delete(key);
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
  };
}

function installBrowserStorage() {
  const session = createMemoryStorage();
  const local = createMemoryStorage();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { sessionStorage: session, localStorage: local },
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: session,
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: local,
  });
}

describe("pending job capture storage", () => {
  const freshPayload = {
    ...basePayload,
    capturedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    installBrowserStorage();
  });

  afterEach(() => {
    clearPendingJobCapture();
  });

  it("reads from localStorage when sessionStorage is empty", () => {
    localStorage.setItem(PENDING_JOB_STORAGE_KEY, JSON.stringify(freshPayload));
    const loaded = loadPendingJobCapture();
    expect(loaded?.company).toBe("Acme");
    expect(loadPendingJobHandoffPath()).toBe(FROM_JOB_PATH);
  });

  it("prefers sessionStorage over localStorage", () => {
    sessionStorage.setItem(
      PENDING_JOB_STORAGE_KEY,
      JSON.stringify({ ...freshPayload, company: "FromSession" }),
    );
    localStorage.setItem(
      PENDING_JOB_STORAGE_KEY,
      JSON.stringify({ ...freshPayload, company: "FromLocal" }),
    );
    expect(loadPendingJobCapture()?.company).toBe("FromSession");
  });

  it("writes and clears both storages", () => {
    savePendingJobCapture({ ...freshPayload, intent: "practice-interview" });
    expect(sessionStorage.getItem(PENDING_JOB_STORAGE_KEY)).toContain(
      "practice-interview",
    );
    expect(localStorage.getItem(PENDING_JOB_STORAGE_KEY)).toContain(
      "practice-interview",
    );
    expect(loadPendingJobHandoffPath()).toBe(PRACTICE_INTERVIEW_PATH);
    clearPendingJobCapture();
    expect(loadPendingJobCapture()).toBeNull();
    expect(sessionStorage.getItem(PENDING_JOB_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(PENDING_JOB_STORAGE_KEY)).toBeNull();
  });

  it("drops stale captures", () => {
    savePendingJobCapture({
      ...basePayload,
      capturedAt: "2020-01-01T00:00:00.000Z",
    });
    expect(loadPendingJobCapture()).toBeNull();
  });
});
