import { describe, expect, it } from "vitest";
import { buildFixItems, placeholderIssues, typoWord } from "../FixMistakesPanel";
import type { ATSReportV3 } from "@/types/atsReport";

describe("placeholderIssues", () => {
  it("lists {XX%} blanks and sample text from new entries", () => {
    const text = "Grew revenue by {XX%} in a year\nSample Project\nSample — describe what you built and its impact.\nSample Language";
    expect(placeholderIssues(text).map((i) => i.excerpt)).toEqual([
      "Grew revenue by {XX%}",
      "Sample Project",
      "Sample — describe what you built and its impact.",
      "Sample Language",
    ]);
  });

  it("leaves real sentences that start with 'Sample' alone", () => {
    expect(placeholderIssues("Sample size of 500 users analysed\nSampled 2M events a day")).toEqual([]);
  });
});

describe("buildFixItems", () => {
  it("shows sample text once, under Fill in, not as a short bullet too", () => {
    const short = { title: "Bullet too short", excerpt: "Sample — describe what you built and its impact.", kind: "negative" };
    const real = { title: "Bullet too short", excerpt: "Built a thing.", kind: "negative" };
    const report = {
      categories: {
        content: { checks: [{ id: "bulletsConsistency", status: "fail", score: 70, issues: [short, real] }] },
      },
    } as unknown as ATSReportV3;
    const groups = buildFixItems(report, "Sample — describe what you built and its impact.\nBuilt a thing.");
    const byTitle = Object.fromEntries(groups.map((g) => [g.title, g.items.map((i) => i.issue.excerpt)]));
    expect(byTitle["Fill in"]).toEqual(["Sample — describe what you built and its impact."]);
    expect(byTitle["Clarity"]).toEqual(["Built a thing."]);
  });
});

describe("job-fit findings", () => {
  it("keep cards whose excerpt quotes the job ad, without marking resume text", () => {
    const report = {
      categories: {
        tailoring: {
          checks: [{ id: "hardSkillsMatch", status: "warn", score: 60, issues: [{ title: "Missing Key Technologies", excerpt: "Kafka, Docker, REST and gRPC APIs", kind: "skill_gap" }] }],
        },
      },
    } as unknown as ATSReportV3;
    const fit = buildFixItems(report, "Built APIs in Go").find((g) => g.title === "Fit for the job")!;
    expect(fit.items).toHaveLength(1);
    expect(fit.items[0].quote).toBe("");
  });
});

describe("skill evidence findings", () => {
  it("still mark the listed skill on the resume", () => {
    const report = {
      categories: { seniority: { checks: [{ id: "skillEvidence", status: "warn", score: 70, issues: [{ title: "No evidence", excerpt: "Rag", kind: "skill_gap" }] }] } },
    } as unknown as ATSReportV3;
    const items = buildFixItems(report, "Python, Rag").flatMap((g) => g.items);
    expect(items.map((i) => i.quote)).toEqual(["Rag"]);
  });
});

describe("typos quoted inside a phrase", () => {
  const issue = {
    title: "Typo",
    excerpt: "over 7 years of experiance",
    rewriteSuggestion: "over 7 years of experience",
    alternatives: ["experience"],
    kind: "spelling",
  };

  it("finds the one changed word", () => {
    expect(typoWord(issue as never)).toEqual({ word: "experiance", fix: "experience" });
    expect(typoWord({ excerpt: "led a team", rewriteSuggestion: "managed the group" } as never)).toBeNull();
  });

  it("are marked and fixed as that word, and drop once the phrase is fixed", () => {
    const report = {
      categories: { content: { checks: [{ id: "spellingGrammar", status: "warn", score: 80, issues: [issue] }] } },
    } as unknown as ATSReportV3;
    const [item] = buildFixItems(report, "with over 7 years of experiance in AI").flatMap((g) => g.items);
    expect(item).toMatchObject({ quote: "experiance", wordFix: true, chips: ["experience"] });
    expect(buildFixItems(report, "with over 7 years of experience in AI").flatMap((g) => g.items)).toEqual([]);
  });
});

describe("quotes copied with a layout label", () => {
  it("match the list on the page", () => {
    const report = {
      categories: { seniority: { checks: [{ id: "skillEvidence", status: "warn", score: 80, issues: [{ title: "Orphan Skills", excerpt: "Skills: Python, Go, Rag", kind: "skill_gap" }] }] } },
    } as unknown as ATSReportV3;
    const items = buildFixItems(report, "Python, Go, Rag").flatMap((g) => g.items);
    expect(items.map((i) => i.quote)).toEqual(["Python, Go, Rag"]);
  });
});

describe("Fill in matches what the score counts", () => {
  it("adds the server's placeholder headings/contact details to the live blanks, once each", () => {
    const report = {
      categories: {
        content: {
          checks: [
            {
              id: "placeholderValues",
              status: "fail",
              score: 0,
              issues: [
                { title: "Replace the placeholder", excerpt: "anup@example.com" },
                { title: "Replace the sample text", excerpt: "Sample Project" },
              ],
            },
          ],
        },
      },
    } as unknown as ATSReportV3;
    const fill = buildFixItems(report, "anup@example.com\nSample Project").find((g) => g.title === "Fill in")!;
    expect(fill.items.map((i) => i.issue.excerpt)).toEqual(["Sample Project", "anup@example.com"]);
    // Fixed on the page: gone right away, before any re-score.
    expect(buildFixItems(report, "anup@gmail.com\nLedger app").find((g) => g.title === "Fill in")!.items).toEqual([]);
  });
});
