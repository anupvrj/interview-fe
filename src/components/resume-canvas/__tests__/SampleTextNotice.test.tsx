// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { SampleTextNotice } from "../SampleTextNotice";
import { button, cleanup, click, render, text } from "@/test-utils/render";

afterEach(cleanup);

describe("SampleTextNotice", () => {
  it("says how much sample text is left, what it costs, and offers Show me / Remove", () => {
    const h = { onShow: vi.fn(), onRemove: vi.fn() };
    render(<SampleTextNotice count={3} examples={["Tech Company Inc.", "Skill 1", "Sample Project"]} removing={false} {...h} />);
    expect(text()).toContain("3 sample items still on your resume");
    expect(text()).toContain("(“Tech Company Inc.”, “Skill 1”, …)");
    expect(text()).toContain("your ATS score stays below 60");
    click(button("Show me"));
    click(button("Remove samples"));
    expect(h.onShow).toHaveBeenCalled();
    expect(h.onRemove).toHaveBeenCalled();
  });

  it("phones get one short line; Remove is disabled while it works", () => {
    render(<SampleTextNotice count={1} examples={["Tech Company Inc."]} removing compact onShow={vi.fn()} onRemove={vi.fn()} />);
    expect(text()).toContain("1 sample item still on your resume");
    expect(text()).not.toContain("stays below 60");
    expect((button("Remove samples") as HTMLButtonElement).disabled).toBe(true);
  });
});
