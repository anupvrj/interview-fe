import { beforeEach, describe, expect, it, vi } from "vitest";
import { dismissReviewReminder, shouldShowReviewReminder } from "../resume-review-reminder";

describe("review reminder opt-out", () => {
  beforeEach(() => {
    const data = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    });
  });

  it("shows until dismissed, per resume", () => {
    expect(shouldShowReviewReminder("r1")).toBe(true);
    dismissReviewReminder("r1");
    expect(shouldShowReviewReminder("r1")).toBe(false);
    expect(shouldShowReviewReminder("r2")).toBe(true);
  });

  it("never shows without a resume id", () => {
    expect(shouldShowReviewReminder(undefined)).toBe(false);
  });
});
