import { describe, expect, it } from "vitest";
import { isHackathonTrialContextFromUrl } from "@/lib/hackathon-trial-suppress";

describe("isHackathonTrialContextFromUrl", () => {
  it("detects hackathon routes", () => {
    expect(isHackathonTrialContextFromUrl("/hackathon/hackathon-2026/dashboard", null)).toBe(
      true,
    );
  });

  it("detects resume builder returnTo hackathon dashboard", () => {
    const params = new URLSearchParams(
      "returnTo=%2Fhackathon%2Fhackathon-2026%2Fdashboard&returnLabel=Hackathon",
    );
    expect(isHackathonTrialContextFromUrl("/dashboard/resumes/abc/edit", params)).toBe(
      true,
    );
  });

  it("ignores normal dashboard paths", () => {
    expect(isHackathonTrialContextFromUrl("/dashboard/resumes", null)).toBe(false);
  });
});
