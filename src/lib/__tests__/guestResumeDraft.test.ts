// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GUEST_DRAFT_SIGN_UP_HREF,
  GUEST_DRAFT_TTL_MS,
  forgetGuestResumeDraft,
  hasGuestResumeDraft,
  loadGuestResumeDraft,
  saveGuestResumeDraft,
} from "../guestResumeDraft";

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

const draft = { templateId: "condensed-rule", content: { personalInfo: { fullName: "Riya Test" } }, sectionOrder: [], source: "scratch" as const };

describe("guest resume draft", () => {
  it("saves, loads and forgets", () => {
    expect(hasGuestResumeDraft()).toBe(false);
    expect(saveGuestResumeDraft(draft)).toBe(true);
    expect(loadGuestResumeDraft()).toMatchObject(draft);
    forgetGuestResumeDraft();
    expect(loadGuestResumeDraft()).toBeNull();
  });

  it("expires after a week", () => {
    vi.useFakeTimers();
    saveGuestResumeDraft(draft);
    vi.advanceTimersByTime(GUEST_DRAFT_TTL_MS + 1000);
    expect(loadGuestResumeDraft()).toBeNull();
    expect(localStorage.getItem("ix-guest-resume-draft")).toBeNull();
  });

  it("ignores a broken or tampered entry", () => {
    localStorage.setItem("ix-guest-resume-draft", "{not json");
    expect(loadGuestResumeDraft()).toBeNull();
    localStorage.setItem("ix-guest-resume-draft", JSON.stringify({ data: { templateId: 5 }, expiresAt: Date.now() + 1000 }));
    expect(loadGuestResumeDraft()).toBeNull();
  });

  it("sign-up comes back to claim it", () => {
    expect(decodeURIComponent(GUEST_DRAFT_SIGN_UP_HREF)).toBe("/sign-up?redirect_url=/dashboard/resumes/new?draft=guest");
  });
});
