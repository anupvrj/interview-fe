// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { SetupChecklist, type ChecklistItem } from "../SetupChecklist";
import { act, button, cleanup, click, render, text } from "@/test-utils/render";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const items = (doneIds: string[]): ChecklistItem[] =>
  ["contact", "content", "ats", "fix", "export"].map((id) => ({ id, label: `Item ${id}`, done: doneIds.includes(id) }));

function checklist(props: Partial<Parameters<typeof SetupChecklist>[0]> = {}) {
  const handlers = { onShowMe: vi.fn(), onReplayTour: vi.fn(), onDismiss: vi.fn(), onAllDone: vi.fn() };
  const view = render(<SetupChecklist items={items(["contact", "content"])} isMobile={false} hidden={false} {...handlers} {...props} />);
  return { ...handlers, view };
}

describe("SetupChecklist", () => {
  it("pill shows progress; opening lists items with Show me on the next one", () => {
    const { onShowMe } = checklist();
    expect(button("Resume setup: 2 of 5 done")).toBeTruthy();
    click(button("Resume setup"));
    expect(text()).toContain("2 of 5 done");
    expect(text()).toContain("Show me →");
    click(button("Item ats"));
    expect(onShowMe).toHaveBeenCalledWith("ats");
    // Choosing closes the card back to the pill.
    expect(button("Resume setup: 2 of 5 done")).toBeTruthy();
  });

  it("a newly ticked item gets a +1 sparkle", () => {
    const { view, onShowMe, onReplayTour, onDismiss, onAllDone } = checklist();
    expect(text()).not.toContain("+1");
    view.rerender(
      <SetupChecklist items={items(["contact", "content", "ats"])} isMobile={false} hidden={false} {...{ onShowMe, onReplayTour, onDismiss, onAllDone }} />,
    );
    expect(text()).toContain("+1");
    expect(button("Resume setup: 3 of 5 done")).toBeTruthy();
  });

  it("everything done: celebrates, then closes itself", () => {
    vi.useFakeTimers();
    const { onAllDone } = checklist({ items: items(["contact", "content", "ats", "fix", "export"]) });
    expect(text()).toContain("All done! 🎉");
    expect(onAllDone).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(4100));
    expect(onAllDone).toHaveBeenCalled();
  });

  it("Replay and Hide work; hidden renders nothing", () => {
    const a = checklist();
    click(button("Resume setup"));
    click(button("Replay the tour"));
    expect(a.onReplayTour).toHaveBeenCalled();
    click(button("Resume setup"));
    click(button("Hide checklist"));
    expect(a.onDismiss).toHaveBeenCalled();
    cleanup();
    checklist({ hidden: true });
    expect(text()).not.toContain("Resume setup");
  });
});
