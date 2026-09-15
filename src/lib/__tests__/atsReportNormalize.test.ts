import { describe, expect, it } from "vitest";
import type { ATSReportV3 } from "@/types/atsReport";
import {
  applyPersistedJobMatchScore,
  normalizeATSReportV3,
  reportHasJobMatch,
} from "@/lib/atsReportNormalize";

function tailoredReport(): ATSReportV3 {
  return {
    version: 3,
    score: 77,
    issueCount: 1,
    mode: "tailored",
    categories: {
      jobMatch: {
        id: "jobMatch",
        label: "Job Match",
        score: 41,
        issueCount: 0,
        checks: [],
      },
    } as unknown as ATSReportV3["categories"],
    strengths: [],
    weaknesses: [],
    suggestions: [],
    jobMatch: {
      overallMatch: 41,
      verdict: "weak",
      jobTitle: "Backend Engineer",
    },
  };
}

describe("applyPersistedJobMatchScore", () => {
  it("overlays the persisted sibling Job Match % onto the report", () => {
    const next = applyPersistedJobMatchScore(tailoredReport(), 68);
    expect(next.score).toBe(77);
    expect(next.jobMatch?.overallMatch).toBe(68);
    expect(next.categories.jobMatch.score).toBe(68);
  });

  it("leaves the report unchanged without a persisted score", () => {
    const report = tailoredReport();
    expect(applyPersistedJobMatchScore(report, undefined)).toBe(report);
  });
});

describe("normalizeATSReportV3", () => {
  it("keeps Job Match only in tailored reports that already have the category", () => {
    const report = normalizeATSReportV3(tailoredReport());
    expect(reportHasJobMatch(report)).toBe(true);
    expect(report.jobMatch?.overallMatch).toBe(41);
  });
});
