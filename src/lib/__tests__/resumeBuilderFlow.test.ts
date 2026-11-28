// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { builderFlowSkipsOnboarding, inResumeBuilderFlow, markResumeBuilderFlowBuilt, startResumeBuilderFlow } from "../resumeBuilderFlow";

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("resume builder flow", () => {
  it("skips onboarding while building, then only on the resume pages", () => {
    expect(builderFlowSkipsOnboarding("/dashboard/resumes/new")).toBe(false);
    startResumeBuilderFlow();
    expect(inResumeBuilderFlow()).toBe(true);
    expect(builderFlowSkipsOnboarding("/dashboard/resumes/new")).toBe(true);
    expect(builderFlowSkipsOnboarding("/dashboard/interviews")).toBe(false);

    markResumeBuilderFlowBuilt();
    // built: onboarding no longer sends them back to the builder, but the editor stays theirs
    expect(inResumeBuilderFlow()).toBe(false);
    expect(builderFlowSkipsOnboarding("/dashboard/resumes/abc/edit")).toBe(true);
  });

  it("expires after a day", () => {
    vi.useFakeTimers();
    startResumeBuilderFlow();
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1000);
    expect(inResumeBuilderFlow()).toBe(false);
    expect(builderFlowSkipsOnboarding("/dashboard/resumes/new")).toBe(false);
  });

  it("ignores a broken entry", () => {
    localStorage.setItem("ix-resume-builder-flow", "{nope");
    expect(inResumeBuilderFlow()).toBe(false);
  });
});
