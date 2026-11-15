// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { InterviewRisksPanel } from "../panels/InterviewRisksPanel";
import { ATSIssueMagicProvider } from "../ATSIssueMagicContext";
import { cleanup, render } from "@/test-utils/render";
import type { ATSCheckResult } from "@/types/atsReport";

vi.mock("@/components/marketing-2026/fonts", () => ({ geist: { variable: "" }, geistMono: { variable: "" }, caveat: { variable: "" } }));
afterEach(cleanup);

const check = (issues: ATSCheckResult["issues"], over: Partial<ATSCheckResult> = {}) =>
  ({ id: "interviewRisks", label: "Interview Risks", description: "", status: "fail", score: 46, issueCount: issues.length, issues, ...over }) as ATSCheckResult;

describe("InterviewRisksPanel", () => {
  it("splits red flags from warnings, and a finding with no severity is a warning", () => {
    const view = render(<InterviewRisksPanel check={check([
      { title: "Doubtful claim", description: "", severity: "fail" },
      { title: "Might be asked", description: "", severity: "warn" },
      { title: "Older report", description: "" },
    ])} />);
    expect(view.container.textContent).toContain("Red flags (1)");
    expect(view.container.textContent).toContain("Warnings (2)");
    expect(view.container.querySelectorAll("[aria-label='Red flag']")).toHaveLength(1);
    expect(view.container.querySelectorAll("[aria-label='Warning']")).toHaveLength(2);
  });

  it("isn't alarming when there are only warnings", () => {
    const view = render(<InterviewRisksPanel check={check([{ title: "Might be asked", description: "", severity: "warn" }])} />);
    expect(view.container.textContent).toContain("Be ready for these");
    expect(view.container.textContent).not.toContain("Careful!");
  });

  it("offers Mark as fixed and Ignore wherever findings can be set aside, without AI rewrites on the report", () => {
    const view = render(
      <ATSIssueMagicProvider resumeId="r1" rewriteEnabled={false} onIgnoreIssue={async () => {}}>
        <InterviewRisksPanel check={check([{ title: "Might be asked", description: "", severity: "warn" }])} />
      </ATSIssueMagicProvider>,
    );
    expect(view.container.textContent).toContain("Mark as fixed");
    expect(view.container.textContent).toContain("Ignore");
  });

  it("counts what's still open once findings have been set aside", () => {
    const view = render(<InterviewRisksPanel check={check([], { summary: { headline: "We found 3 areas" } as never, baseline: { status: "fail", score: 46, issueCount: 3, issues: [] } })} />);
    expect(view.container.textContent).toContain("No open interview risks.");
    expect(view.container.textContent).not.toContain("We found 3");
  });
});
