import { describe, expect, it } from "vitest";
import { rewriteChanges } from "../atsRewriteDiff";
import type { ATSReportV3 } from "@/types/atsReport";

const check = (id: string, issues: { title: string; excerpt?: string }[], extra = {}) => ({
  id, label: id, description: "", status: "fail", score: 40, issueCount: issues.length || 1, issues: issues.map((i) => ({ description: "", ...i })), ...extra,
});
const report = {
  categories: {
    content: {
      checks: [
        check("repetition", [{ title: "Repeated", excerpt: "Led the team that led the launch" }]),
        check("quantifyingImpact", [{ title: "No number", excerpt: "Managed vendor relationships" }, { title: "No number", excerpt: "Ran weekly reporting for leadership" }]),
        check("sectionCompleteness", [{ title: "Add a summary" }]),
        check("interviewRisks", [], { locked: true, issueCount: 2 }),
      ],
    },
  },
} as unknown as ATSReportV3;

const original = { experience: [{ description: "<ul><li>Led the team that led the launch.</li><li>Managed vendor relationships</li><li>Ran weekly reporting for leadership</li></ul>" }] };
const rewritten = { experience: [{ description: "<ul><li>Headed the launch team.</li><li>Managed 12 vendor relationships</li><li>Ran weekly reporting for leadership</li></ul>" }] };

describe("rewriteChanges", () => {
  it("counts a finding as fixed only when the rewrite changed its line", () => {
    const rows = Object.fromEntries(rewriteChanges(report, original, rewritten).map((r) => [r.id, r]));
    expect(rows.repetition.status).toBe("fixed");
    expect(rows.quantifyingImpact).toMatchObject({ status: "partly", changed: 1, total: 2 });
    expect(rows.sectionCompleteness.status).toBe("editor");
    expect(rows.interviewRisks.status).toBe("locked");
  });

  it("lists what's fixed first", () => {
    expect(rewriteChanges(report, original, rewritten).map((r) => r.status)).toEqual(["fixed", "partly", "editor", "locked"]);
  });

  it("fixes nothing when the rewrite didn't change their words", () => {
    expect(rewriteChanges(report, original, original).filter((r) => r.status === "fixed")).toHaveLength(0);
  });
});
