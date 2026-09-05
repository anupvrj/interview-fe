import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  FROM_JOB_PATH,
  PENDING_JOB_STORAGE_KEY,
  clearPendingJobCapture,
} from "@/lib/extension-job-handoff";
import {
  POST_SIGN_IN_RETURN_URL_KEY,
  consumePostSignInReturnUrl,
  persistPostAuthReturnPath,
  safeAppRedirectPath,
  shouldRedirectUnauthorizedToSignIn,
} from "@/lib/post-sign-in-redirect";

describe("safeAppRedirectPath", () => {
  it("allows in-app OAuth consent paths", () => {
    expect(
      safeAppRedirectPath(
        "/connector/oauth/consent?request_id=oauthreq_abc",
      ),
    ).toBe("/connector/oauth/consent?request_id=oauthreq_abc");
  });

  it("rejects off-site redirects", () => {
    expect(safeAppRedirectPath("https://evil.example/phish")).toBeNull();
    expect(safeAppRedirectPath("//evil.example/phish")).toBeNull();
  });

  it("rejects wildcard placeholder paths", () => {
    expect(safeAppRedirectPath("/*")).toBeNull();
    expect(safeAppRedirectPath("/dashboard/*")).toBeNull();
  });
});

describe("shouldRedirectUnauthorizedToSignIn", () => {
  it("does not bounce ChatGPT OAuth consent or the sign-in page", () => {
    expect(
      shouldRedirectUnauthorizedToSignIn("/connector/oauth/consent"),
    ).toBe(false);
    expect(shouldRedirectUnauthorizedToSignIn("/sign-in")).toBe(false);
    expect(
      shouldRedirectUnauthorizedToSignIn(
        "/dashboard",
        "/connector/v1/oauth/requests/oauthreq_abc",
      ),
    ).toBe(false);
  });

  it("still sends other 401s to sign-in", () => {
    expect(shouldRedirectUnauthorizedToSignIn("/dashboard/resumes")).toBe(
      true,
    );
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

describe("persist and consume post-auth return", () => {
  beforeEach(() => {
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
  });

  afterEach(() => {
    localStorage.removeItem(POST_SIGN_IN_RETURN_URL_KEY);
    clearPendingJobCapture();
  });

  it("stores the sign-in redirect_url", () => {
    expect(persistPostAuthReturnPath("/dashboard/resumes/from-job")).toBe(
      FROM_JOB_PATH,
    );
    expect(consumePostSignInReturnUrl()).toBe(FROM_JOB_PATH);
  });

  it("falls back to a waiting extension capture", () => {
    localStorage.setItem(
      PENDING_JOB_STORAGE_KEY,
      JSON.stringify({
        v: 1,
        sourceUrl: "https://linkedin.com/jobs/view/1",
        title: "SDE",
        company: "Acme",
        location: "Bengaluru",
        jobDescription: "Build APIs and own delivery.",
        capturedAt: new Date().toISOString(),
        intent: "resume",
      }),
    );
    expect(persistPostAuthReturnPath(null)).toBe(FROM_JOB_PATH);
    expect(consumePostSignInReturnUrl()).toBe(FROM_JOB_PATH);
  });

  it("consume falls back to extension handoff when no return URL was stored", () => {
    localStorage.setItem(
      PENDING_JOB_STORAGE_KEY,
      JSON.stringify({
        v: 1,
        sourceUrl: "https://linkedin.com/jobs/view/1",
        title: "SDE",
        company: "Acme",
        location: "Bengaluru",
        jobDescription: "Build APIs and own delivery.",
        capturedAt: new Date().toISOString(),
        intent: "practice-interview",
      }),
    );
    expect(consumePostSignInReturnUrl()).toBe("/dashboard/interviews/new");
  });
});
