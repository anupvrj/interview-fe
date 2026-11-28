// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { button, cleanup, click, render, text } from "@/test-utils/render";
import { ATSScoreExplainer } from "../ATSScoreExplainer";
import type { ATSReportV3 } from "@/types/atsReport";

vi.mock("@/components/marketing-2026/fonts", () => ({ geist: { variable: "" }, geistMono: { variable: "" }, caveat: { variable: "" } }));
afterEach(cleanup);

const cat = (id: string, label: string, score: number) => ({ id, label, score, issueCount: 0, checks: [] });
const report = {
  score: 25,
  mode: "standalone",
  scoreCap: 25,
  scoreCapReasons: ["3 bits of sample text or blanks left in (see Sample Text & Blanks)"],
  scoreWeights: { content: 40, sections: 22, hrRedFlags: 22, seniority: 16 },
  categories: {
    content: cat("content", "Content", 77),
    sections: cat("sections", "Sections", 90),
    hrRedFlags: cat("hrRedFlags", "HR Red Flags", 60),
    seniority: cat("seniority", "Seniority", 55),
    discrimination: cat("discrimination", "Discrimination", 100),
  },
} as unknown as ATSReportV3;

describe("ATSScoreExplainer", () => {
  it("is folded until opened", () => {
    render(<ATSScoreExplainer report={report} />);
    expect(text()).toContain("How this score works");
    expect(text()).not.toContain("estimate");
  });

  it("shows the weights that counted, the honest framing and why it's capped", () => {
    render(<ATSScoreExplainer report={report} />);
    click(button(/how this score works/i));
    expect(text()).toContain("InterviewTrix's estimate");
    expect(text()).toContain("isn't the score any employer's system gives");
    expect(text()).toMatch(/Content\s*40%/);
    expect(text()).toMatch(/Seniority\s*16%/);
    expect(text()).not.toContain("Discrimination"); // 0 weight: a tip, not listed
    expect(text()).toContain("Why it's held at 25");
    expect(text()).toContain("sample text or blanks");
  });

  it("older reports without weights still get the framing", () => {
    render(<ATSScoreExplainer report={{ ...report, scoreWeights: undefined, scoreCap: undefined }} />);
    click(button(/how this score works/i));
    expect(text()).toContain("InterviewTrix's estimate");
    expect(text()).not.toContain("WHAT COUNTS");
  });
});
