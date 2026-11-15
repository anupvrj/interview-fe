// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { atsDeviceId, clearScanMark, inAppBrowserName, interruptedScan, markScanStarted } from "../atsGuestState";

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("signed-out check on a phone", () => {
  it("keeps one anonymous id per browser, in the shape the server accepts", () => {
    const id = atsDeviceId()!;
    expect(id).toMatch(/^[A-Za-z0-9_-]{16,64}$/);
    expect(atsDeviceId()).toBe(id);
  });

  it("remembers a scan the phone interrupted, for 15 minutes", () => {
    vi.useFakeTimers();
    markScanStarted("cv.pdf");
    expect(interruptedScan()).toEqual({ fileName: "cv.pdf" });
    vi.advanceTimersByTime(16 * 60 * 1000);
    expect(interruptedScan()).toBeNull();
  });

  it("forgets the scan once it finished or failed", () => {
    markScanStarted("cv.pdf");
    clearScanMark();
    expect(interruptedScan()).toBeNull();
  });

  it("recognises in-app browsers where Google sign-in fails", () => {
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (iPhone) Instagram 300.0" });
    expect(inAppBrowserName()).toBe("Instagram");
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (Linux; Android 14) [FB_IAB/FB4A;FBAV/450.0]" });
    expect(inAppBrowserName()).toBe("Facebook");
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (iPhone) Version/17.0 Mobile Safari/604.1" });
    expect(inAppBrowserName()).toBeNull();
  });
});
