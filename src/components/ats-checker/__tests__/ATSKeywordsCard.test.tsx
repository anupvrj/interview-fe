// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, button, cleanup, click, flush, render, text } from "@/test-utils/render";
import { ATSKeywordsCard } from "../ATSKeywordsCard";
import type { ATSReportV3 } from "@/types/atsReport";

vi.mock("@/components/marketing-2026/fonts", () => ({ geist: { variable: "" }, geistMono: { variable: "" }, caveat: { variable: "" } }));
vi.mock("@/lib/analytics/productEvents", () => ({ track: vi.fn() }));
afterEach(cleanup);

const tailored = {
  categories: {
    jobMatch: {
      checks: [
        { id: "mustHaveSkillsMatch", status: "warn", meta: { matched: ["Python"], missing: ["Kafka"], partial: ["Kubernetes"] } },
        { id: "preferredSkillsMatch", status: "pass", meta: { matched: ["GraphQL"], missing: [], partial: [] } },
      ],
    },
  },
} as unknown as ATSReportV3;
const plain = { categories: {} } as unknown as ATSReportV3;

/** Types into the job description box the way React sees it. */
function typeJd(value: string) {
  const box = document.querySelector<HTMLTextAreaElement>("#ats-jd")!;
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(box, value);
    box.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("ATSKeywordsCard", () => {
  it("lists missing and partly-shown keywords first and links to the editor", () => {
    render(<ATSKeywordsCard report={tailored} editorHref="/dashboard/resumes/r1/edit?view=job" />);
    expect(text()).toContain("2 of 4 skills from the job aren't clear on your resume.");
    expect(text()).toContain("Kafka");
    expect(text()).toContain("Kubernetes");
    expect(text()).toContain("All on your resume."); // nice-to-have group is complete
    expect(text()).not.toContain("Python"); // found keywords stay folded
    expect(button(/add in editor/i).getAttribute("href")).toBe("/dashboard/resumes/r1/edit?view=job");
  });

  it("shows found keywords on request", () => {
    render(<ATSKeywordsCard report={tailored} />);
    click(button(/show 1 found/i));
    expect(text()).toContain("Python");
  });

  it("without a job, asks for one and refuses one that's too short", async () => {
    const run = vi.fn();
    render(<ATSKeywordsCard report={plain} onRunJobMatch={run} />);
    typeJd("too short");
    click(button(/check against this job/i));
    expect(text()).toContain("at least 50 characters");
    expect(run).not.toHaveBeenCalled();
    const jd = "We are hiring a backend engineer with Kafka, Kubernetes and Python experience for our team.";
    typeJd(jd);
    click(button(/check against this job/i));
    await flush();
    expect(run).toHaveBeenCalledWith(jd);
  });
});
