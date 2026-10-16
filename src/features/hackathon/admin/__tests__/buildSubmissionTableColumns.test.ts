import { describe, expect, it } from "vitest";
import { buildSubmissionTableColumns } from "../buildSubmissionTableColumns";
import type { AdminHackathonOverview } from "../../api";

describe("buildSubmissionTableColumns", () => {
  it("builds columns from challenge config", () => {
    const hackathon = {
      interviewConfig: { requiredCount: 2 },
      challenges: [
        { challengeId: "c1", kind: "resume", title: "Resume", order: 0, description: "" },
        { challengeId: "c2", kind: "screening", title: "Mock", order: 1, description: "", config: { requiredCount: 2 } },
        { challengeId: "c3", kind: "social", title: "Social", order: 2, description: "" },
      ],
    } as AdminHackathonOverview;

    const cols = buildSubmissionTableColumns(hackathon);
    expect(cols.filter((c) => c.kind === "resume")).toHaveLength(1);
    expect(cols.filter((c) => c.kind === "interview_slot")).toHaveLength(2);
    expect(cols.filter((c) => c.kind === "social")).toHaveLength(1);
  });
});
