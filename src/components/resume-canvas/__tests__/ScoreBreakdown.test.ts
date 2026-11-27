import { describe, expect, it } from "vitest";
import { scoreParts } from "@/components/resume-canvas/ScoreBreakdown";
import type { ATSReportV3 } from "@/types/atsReport";

const check = (id: string, score: number, issueCount = 0) => ({ id, label: id, description: "", status: "pass", score, issueCount, issues: [] });

describe("scoreParts", () => {
  it("averages each part's own checks and leaves job keywords empty without a job", () => {
    const report = {
      version: 3,
      score: 80,
      issueCount: 3,
      mode: "standalone",
      categories: {
        atsEssentials: { id: "atsEssentials", label: "", score: 0, issueCount: 0, checks: [check("atsParseRate", 100), check("contactInformation", 80, 1)] },
        content: { id: "content", label: "", score: 0, issueCount: 0, checks: [check("quantifyingImpact", 60, 2), check("repetition", 100)] },
      },
      strengths: [],
      weaknesses: [],
      suggestions: [],
    } as unknown as ATSReportV3;
    const parts = Object.fromEntries(scoreParts(report).map((p) => [p.id, p]));
    expect(parts.parse).toMatchObject({ score: 90, issues: 1 });
    expect(parts.content).toMatchObject({ score: 80, issues: 2 });
    expect(parts.keywords.score).toBeNull();
  });
});
