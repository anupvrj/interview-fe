import { describe, expect, it } from "vitest";
import { insightsFromAtsReport } from "@/lib/ats-insights";
import type { ATSCategoryId, ATSCategoryResult, ATSReportV3 } from "@/types/atsReport";

function emptyCategory(id: ATSCategoryId): ATSCategoryResult {
  return { id, label: id, score: 100, issueCount: 0, checks: [] };
}

describe("insightsFromAtsReport", () => {
  it("maps ATS job-match checks into the tailor handoff payload", () => {
    const report: ATSReportV3 = {
      version: 3,
      score: 72,
      issueCount: 2,
      mode: "tailored",
      strengths: ["Node.js"],
      weaknesses: ["React is missing"],
      suggestions: [],
      jobMatch: {
        overallMatch: 78,
        verdict: "partial",
        jobTitle: "Senior Full Stack",
      },
      categories: {
        content: emptyCategory("content"),
        sections: emptyCategory("sections"),
        atsEssentials: emptyCategory("atsEssentials"),
        hrRedFlags: emptyCategory("hrRedFlags"),
        discrimination: emptyCategory("discrimination"),
        seniority: emptyCategory("seniority"),
        tailoring: emptyCategory("tailoring"),
        jobMatch: {
          id: "jobMatch",
          label: "Job Match",
          score: 78,
          issueCount: 1,
          checks: [
            {
              id: "mustHaveSkillsMatch",
              label: "Must-Have Skills",
              description: "",
              status: "warn",
              score: 80,
              issueCount: 1,
              issues: [],
              meta: {
                matched: ["Node.js", "AWS"],
                missing: ["React"],
                partial: ["GCP", "Azure"],
              },
            },
          ],
        },
      },
    };

    const insights = insightsFromAtsReport(report);
    expect(insights?.matchScore).toBe(78);
    expect(insights?.missingSkills).toEqual(["React"]);
    expect(insights?.unlistedSkills).toEqual(["GCP", "Azure"]);
    expect(insights?.matrices[0]?.id).toBe("mustHaveSkillsMatch");
  });
});
