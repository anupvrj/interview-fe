// @vitest-environment jsdom
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@/test-utils/render";
import { SetAsideLink } from "../SetAsideLink";
import { countSetAsideIssues, type ATSReportV3 } from "@/types/atsReport";

afterEach(cleanup);

describe("set-aside findings", () => {
  it("counts what the baseline has and the list doesn't", () => {
    const issue = { title: "a", description: "" };
    const report = {
      categories: {
        content: { checks: [{ issues: [], baseline: { issues: [issue, issue], status: "fail", score: 40, issueCount: 2 } }, { issues: [issue] }] },
      },
    } as unknown as ATSReportV3;
    expect(countSetAsideIssues(report)).toBe(2);
    expect(countSetAsideIssues(null)).toBe(0);
  });

  it("brings them back on click, and says so if it fails", async () => {
    const onRestore = vi.fn().mockRejectedValue(new Error("offline"));
    const view = render(<SetAsideLink count={3} onRestore={onRestore} />);
    expect(view.container.textContent).toContain("3 findings set aside");
    await act(async () => { view.container.querySelector("button")!.click(); });
    expect(onRestore).toHaveBeenCalled();
    expect(view.container.textContent).toContain("Couldn't do that");
  });

  it("shows nothing when nothing was set aside", () => {
    const view = render(<SetAsideLink count={0} onRestore={async () => {}} />);
    expect(view.container.textContent).toBe("");
  });
});
