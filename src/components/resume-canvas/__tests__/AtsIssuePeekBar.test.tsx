// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { AtsIssuePeekBar } from "../AtsIssuePeekBar";
import { button, cleanup, click, render, text } from "@/test-utils/render";

afterEach(cleanup);

describe("AtsIssuePeekBar (phones)", () => {
  it("names the issue, steps through, and brings the list back", () => {
    const h = { onPrev: vi.fn(), onNext: vi.fn(), onShowList: vi.fn() };
    render(<AtsIssuePeekBar title="Fill in the real number" tone="error" index={1} total={22} {...h} />);
    expect(text()).toContain("Issue 2 of 22");
    expect(text()).toContain("Fill in the real number");
    click(button("Previous issue"));
    click(button("Next issue"));
    click(button("See fix"));
    expect(h.onPrev).toHaveBeenCalled();
    expect(h.onNext).toHaveBeenCalled();
    expect(h.onShowList).toHaveBeenCalled();
  });

  it("can't step past either end; it marks itself as a bottom bar for the checklist pill", () => {
    const { container } = render(<AtsIssuePeekBar title="t" tone="weak" index={0} total={1} onPrev={vi.fn()} onNext={vi.fn()} onShowList={vi.fn()} />);
    expect((button("Previous issue") as HTMLButtonElement).disabled).toBe(true);
    expect((button("Next issue") as HTMLButtonElement).disabled).toBe(true);
    expect(container.querySelector("[data-editor-bottom-bar]")).not.toBeNull();
  });
});
