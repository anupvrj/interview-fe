// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@/test-utils/render";
import { ATSProcessingView, ATS_IMPROVE_STEPS, ATS_PROCESSING_STEPS, timeLeftLabel } from "../ATSProcessingView";
import { scanFactsFromContent } from "@/lib/atsScanFacts";

vi.mock("@/components/marketing-2026/fonts", () => ({ geist: { variable: "" }, geistMono: { variable: "" }, caveat: { variable: "" } }));
afterEach(cleanup);

const content = {
  experience: [
    { startDate: "2021-04", current: true, description: ["<ul><li>Cut storage costs 38%</li><li>Mentored the data team</li></ul>"] },
    { startDate: "2018-07", endDate: "2021-03", description: "<ul><li>Built 140 dbt models</li></ul>" },
  ],
  skills: "Apache Spark | Airflow | Python | AWS | Kafka",
  profileSummary: "<p>Data engineer</p>",
  education: [{ degree: "M.Tech" }],
  projects: [],
  customSections: [{ title: "TALKS", content: "Kafka Summit" }],
};

describe("scan facts", () => {
  it("reads roles, years, skills, sections and numbers from their own resume", () => {
    const facts = scanFactsFromContent(content);
    expect(facts.roles).toBe(2);
    expect(facts.projects).toBe(0);
    expect(facts.years).toEqual({ from: 2018, to: "now" });
    expect(facts.skills).toEqual(["Apache Spark", "Airflow", "Python", "AWS", "Kafka"]);
    expect(facts.sections).toEqual(["Summary", "Experience", "Education", "Skills", "Talks"]);
    expect(facts.bullets).toBe(3);
    expect(facts.bulletsWithNumbers).toBe(2);
  });
});

describe("a student's resume", () => {
  it("shows projects in place of roles, and counts their bullets", () => {
    const facts = scanFactsFromContent({ projects: [{ name: "Chat app", description: "<ul><li>Served 1,000 students</li><li>Built with Socket.io</li></ul>" }], skills: ["Java"] });
    expect(facts.projects).toBe(1);
    expect(facts.bulletsWithNumbers).toBe(1);
    const view = render(<ATSProcessingView currentStep={2} facts={facts} />);
    expect(view.container.textContent).toContain("1 project");
    expect(view.container.textContent).toContain("1 of 2 bullets have numbers");
  });
});

describe("time left", () => {
  it("counts down from typical step lengths, never promising zero", () => {
    expect(timeLeftLabel(ATS_PROCESSING_STEPS, 0, 0)).toBe("About 35s left");
    expect(timeLeftLabel(ATS_PROCESSING_STEPS, 3, 2000)).toBe("About 4s left");
    expect(timeLeftLabel(ATS_PROCESSING_STEPS, 3, 60000)).toBe("Almost done");
  });
});

describe("ATSProcessingView", () => {
  it("shows what was found in their resume as it's read", () => {
    const view = render(<ATSProcessingView currentStep={2} fileName="cv.pdf" facts={scanFactsFromContent(content)} />);
    const text = view.container.textContent ?? "";
    expect(text).toContain("STEP 3 OF 4");
    expect(text).toContain("FOUND SO FAR");
    expect(text).toContain("2 roles");
    expect(text).toContain("5 skills");
    expect(text).toContain("including Talks");
    expect(text).toContain("2 of 3 bullets have numbers");
    expect(text).toContain("Running 20+ checks");
  });

  it("lists the steps when there's nothing read yet (or while improving)", () => {
    const view = render(<ATSProcessingView currentStep={1} steps={ATS_IMPROVE_STEPS} headerLabel="Improving your resume" />);
    const text = view.container.textContent ?? "";
    expect(text).toContain("WHAT'S HAPPENING");
    expect(text).toContain("Rewriting weak lines");
    expect(text).toContain("Finalizing improvements");
  });
});
