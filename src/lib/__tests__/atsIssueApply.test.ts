import { describe, expect, it } from "vitest";
import { applyAtsIssueFixToResume } from "../atsIssueApply";

const resume = (content: Record<string, unknown>, profileSummary?: string) =>
  ({ resumeId: "r", content, profileSummary }) as never;

const hasDom = typeof DOMParser !== "undefined";

describe("applying an ATS fix", () => {
  it.runIf(hasDom)("keeps the bullet list and other bullets intact", () => {
    const html = "<ul><li>Built <strong>fast</strong> APIs for payments</li><li>Wrote docs</li></ul>";
    const next = applyAtsIssueFixToResume(resume({ experience: [{ description: html }] }), "Wrote docs", "Wrote API docs used by 40 teams");
    const out = (next as any).content.experience[0].description as string;
    expect(out).toContain("<ul>");
    expect(out).toContain("<strong>fast</strong>");
    expect(out).toContain("<li>Wrote API docs used by 40 teams</li>");
  });

  it.runIf(hasDom)("rewrites a bullet that spans inline formatting without touching other bullets", () => {
    const html = "<ul><li>Led <strong>team</strong> of five</li><li>Other</li></ul>";
    const next = applyAtsIssueFixToResume(resume({ experience: [{ description: html }] }), "Led team of five", "Led a team of five engineers");
    const out = (next as any).content.experience[0].description as string;
    expect(out).toContain("<li>Led a team of five engineers</li>");
    expect(out).toContain("<li>Other</li>");
  });

  it.runIf(hasDom)("fixes text in the profile summary", () => {
    const next = applyAtsIssueFixToResume(resume({}, "<p>Experienced enginer in AI</p>"), "enginer", "engineer");
    expect((next as any).profileSummary).toBe("<p>Experienced engineer in AI</p>");
  });

  it("replaces single words as whole words, first occurrence only", () => {
    const next = applyAtsIssueFixToResume(resume({ skills: ["Google", "Go", "Go"] }), "Go", "Golang");
    expect((next as any).content.skills).toEqual(["Google", "Golang", "Go"]);
  });

  it("never edits ids or dates", () => {
    expect(applyAtsIssueFixToResume(resume({ experience: [{ id: "abc", startDate: "2020" }] }), "2020", "2021")).toBeNull();
  });

  it("returns null when the text is gone", () => {
    expect(applyAtsIssueFixToResume(resume({ skills: ["Python"] }), "Rust", "Go")).toBeNull();
  });
});
