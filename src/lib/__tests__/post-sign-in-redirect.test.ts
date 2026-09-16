import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  FROM_JOB_PATH,
  PENDING_JOB_STORAGE_KEY,
  clearPendingJobCapture,
} from "@/lib/extension-job-handoff";
import {
  POST_SIGN_IN_ONE_SHOT_RETURN_KEY,
  POST_SIGN_IN_RETURN_URL_KEY,
  consumePostSignInReturnUrl,
  persistPostAuthReturnPath,
  resolvePostAuthRedirectPath,
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

  it("does not redirect public marketing pages on 401", () => {
    expect(shouldRedirectUnauthorizedToSignIn("/")).toBe(false);
    expect(shouldRedirectUnauthorizedToSignIn("/pricing")).toBe(false);
    expect(shouldRedirectUnauthorizedToSignIn("/ai-resume-builder")).toBe(
      false,
    );
  });
});

describe("resolvePostAuthRedirectPath", () => {
  it("maps home to onboarding", () => {
    expect(resolvePostAuthRedirectPath("/")).toBe("/onboarding");
    expect(resolvePostAuthRedirectPath(null)).toBe("/onboarding");
  });

  it("keeps explicit in-app destinations", () => {
    expect(resolvePostAuthRedirectPath("/dashboard")).toBe("/dashboard");
    expect(resolvePostAuthRedirectPath(FROM_JOB_PATH)).toBe(FROM_JOB_PATH);
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
    sessionStorage.removeItem(POST_SIGN_IN_ONE_SHOT_RETURN_KEY);
    clearPendingJobCapture();
  });

  it("stores the sign-in redirect_url", () => {
    expect(persistPostAuthReturnPath("/dashboard/resumes/from-job")).toBe(
      FROM_JOB_PATH,
    );
    expect(consumePostSignInReturnUrl()).toBe(FROM_JOB_PATH);
  });

  it("keeps extension connect in this tab only, not localStorage", () => {
    expect(persistPostAuthReturnPath("/dashboard/extension/connected")).toBe(
      "/dashboard/extension/connected",
    );
    expect(localStorage.getItem(POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
    expect(sessionStorage.getItem(POST_SIGN_IN_ONE_SHOT_RETURN_KEY)).toBe(
      "/dashboard/extension/connected",
    );
    expect(consumePostSignInReturnUrl()).toBe(
      "/dashboard/extension/connected",
    );
    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("does not send a later login to a leftover extension connect URL", () => {
    localStorage.setItem(
      POST_SIGN_IN_RETURN_URL_KEY,
      "/dashboard/extension/connected",
    );
    expect(persistPostAuthReturnPath(null)).toBe("/onboarding");
    expect(localStorage.getItem(POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("discards a leftover extension connect URL from older builds", () => {
    localStorage.setItem(
      POST_SIGN_IN_RETURN_URL_KEY,
      "/dashboard/extension/connected",
    );
    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("does not hijack a generic login with a leftover extension capture", () => {
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
    expect(persistPostAuthReturnPath(null)).toBe("/onboarding");
    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("does not consume a leftover capture when no return URL was stored", () => {
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
    expect(consumePostSignInReturnUrl()).toBeNull();
  });
});
