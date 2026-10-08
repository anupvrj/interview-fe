import { describe, expect, it } from "vitest";
import {
  hackathonSlugFromDashboardPath,
  isHackathonDashboardReturn,
  resolveHackathonInterviewHome,
  shouldAutoDiscardUnstartedInterview,
} from "../interview-return-to";

describe("hackathonSlugFromDashboardPath", () => {
  it("reads the slug from a dashboard returnTo", () => {
    expect(hackathonSlugFromDashboardPath("/hackathon/hackathon-2026/dashboard")).toBe("hackathon-2026");
    expect(
      hackathonSlugFromDashboardPath("/hackathon/hackathon-2026/dashboard?fromInterview=1"),
    ).toBe("hackathon-2026");
    expect(isHackathonDashboardReturn("/hackathon/hackathon-2026/dashboard")).toBe(true);
  });

  it("rejects non-dashboard paths", () => {
    expect(hackathonSlugFromDashboardPath("/hackathon/hackathon-2026")).toBeNull();
    expect(hackathonSlugFromDashboardPath("/dashboard/resumes")).toBeNull();
    expect(isHackathonDashboardReturn(null)).toBe(false);
  });

  it("resolves a clean hackathon home from returnTo", () => {
    expect(
      resolveHackathonInterviewHome(
        "/hackathon/hackathon-2026/dashboard?fromInterview=1&submitted=1",
      ),
    ).toBe("/hackathon/hackathon-2026/dashboard");
  });
});

describe("shouldAutoDiscardUnstartedInterview", () => {
  it("discards a normal unstarted draft", () => {
    expect(shouldAutoDiscardUnstartedInterview({ status: "draft" })).toBe(true);
  });

  it("keeps hackathon drafts so Continue still works", () => {
    expect(
      shouldAutoDiscardUnstartedInterview({
        status: "draft",
        tags: ["hackathon", "hackathon-2026"],
      }),
    ).toBe(false);
    expect(
      shouldAutoDiscardUnstartedInterview({
        status: "draft",
        returnTo: "/hackathon/hackathon-2026/dashboard",
      }),
    ).toBe(false);
  });
});
