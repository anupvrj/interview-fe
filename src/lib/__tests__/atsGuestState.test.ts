// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  forgetGuestCheck,
  hasUnclaimedGuestCheck,
  loadGuestCheckResult,
  loadGuestCheckToken,
  rememberGuestCheck,
} from "../atsGuestState";
import { resolvePostAuthRedirectPath } from "../post-sign-in-redirect";
import { clearPendingUpload, loadPendingUpload, savePendingUpload } from "../atsPendingFile";

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.useRealTimers();
});

describe("guest ATS check across sign-up", () => {
  it("keeps the token and what was on screen until it is forgotten", () => {
    rememberGuestCheck("tok", { score: 41 });
    expect(loadGuestCheckToken()).toBe("tok");
    expect(loadGuestCheckResult<{ score: number }>()).toEqual({ score: 41 });
    expect(hasUnclaimedGuestCheck()).toBe(true);
    forgetGuestCheck();
    expect(loadGuestCheckToken()).toBeNull();
    expect(loadGuestCheckResult()).toBeNull();
  });

  it("lets it go when the server would have (2 hours)", () => {
    vi.useFakeTimers();
    rememberGuestCheck("tok", { score: 41 });
    vi.advanceTimersByTime(2 * 60 * 60 * 1000 + 1);
    expect(loadGuestCheckToken()).toBeNull();
  });

  it("still reads a token saved by the older format", () => {
    localStorage.setItem("ats-checker-guest-token", JSON.stringify({ token: "old", expiresAt: Date.now() + 1000 }));
    expect(loadGuestCheckToken()).toBe("old");
  });

  it("sends a plain sign-in to the waiting report instead of onboarding", () => {
    expect(resolvePostAuthRedirectPath(null)).toBe("/onboarding");
    rememberGuestCheck("tok");
    expect(resolvePostAuthRedirectPath(null)).toBe("/dashboard/ats-checker");
    expect(resolvePostAuthRedirectPath("/dashboard/jobs")).toBe("/dashboard/jobs");
  });
});

describe("the uploaded PDF", () => {
  it("is kept until the check is done, so nobody uploads it twice", async () => {
    const file = new File(["%PDF-1.4"], "cv.pdf", { type: "application/pdf" });
    await savePendingUpload(file, "Senior PM");
    const pending = await loadPendingUpload();
    expect(pending?.file.name).toBe("cv.pdf");
    expect(pending?.jobDescription).toBe("Senior PM");
    await clearPendingUpload();
    expect(await loadPendingUpload()).toBeNull();
  });

  it("picks up an upload saved the old way (sessionStorage)", async () => {
    sessionStorage.setItem(
      "ats-checker-pending-upload",
      JSON.stringify({ fileDataUrl: `data:application/pdf;base64,${btoa("%PDF")}`, fileName: "old.pdf", fileType: "application/pdf", jobDescription: "" }),
    );
    const pending = await loadPendingUpload();
    expect(pending?.file.name).toBe("old.pdf");
    expect(await pending?.file.text()).toBe("%PDF");
  });
});
