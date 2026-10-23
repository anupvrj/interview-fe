// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { SuggestionPicker } from "../SuggestionPicker";
import { act, button, cleanup, click, flush, render, text } from "@/test-utils/render";

afterEach(cleanup);

const A = "Led a 6-person team that shipped weekly releases.";
const B = "Partnered with design to cut onboarding time by 30%.";

function type(value: string) {
  const box = document.querySelector("textarea")!;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
  act(() => {
    setter.call(box, value);
    box.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("SuggestionPicker", () => {
  it("picking an option opens it for editing; the edited text is what goes in", async () => {
    const onApply = vi.fn(() => true);
    render(<SuggestionPicker options={[A, B]} onApply={onApply} />);
    expect(document.querySelector("textarea")).toBeNull();
    click(button(A));
    await flush();
    expect(document.querySelector("textarea")!.value).toBe(A);
    type("Led a 7-person team that shipped weekly releases.");
    click(button("Put this in"));
    expect(onApply).toHaveBeenCalledWith("Led a 7-person team that shipped weekly releases.");
    expect(text()).toContain("In your resume");
    expect((button("Put this in") as HTMLButtonElement).disabled).toBe(true);
  });

  it("after one goes in, picking another offers Replace", async () => {
    const onApply = vi.fn(() => true);
    render(<SuggestionPicker options={[A, B]} onApply={onApply} />);
    click(button(A));
    click(button("Put this in"));
    click(button(B));
    await flush();
    expect(document.querySelector("textarea")!.value).toBe(B);
    click(button(/^Replace$/));
    expect(onApply).toHaveBeenLastCalledWith(B);
  });

  it("a {X} left for a number blocks applying until it's filled in", async () => {
    const onApply = vi.fn(() => true);
    render(<SuggestionPicker options={["Cut costs by {X}%."]} onApply={onApply} />);
    click(button("Cut costs"));
    await flush();
    expect(text()).toContain("Replace {X} with your real number first");
    expect((button("Put this in") as HTMLButtonElement).disabled).toBe(true);
    type("Cut costs by 18%.");
    click(button("Put this in"));
    expect(onApply).toHaveBeenCalledWith("Cut costs by 18%.");
  });

  it("a failed apply leaves the box as it was", async () => {
    render(<SuggestionPicker options={[A]} onApply={() => false} />);
    click(button(A));
    click(button("Put this in"));
    expect(text()).not.toContain("In your resume");
  });

  it("Undo steps back one apply at a time", async () => {
    const onUndo = vi.fn();
    render(<SuggestionPicker options={[A, B]} onApply={() => true} onUndo={onUndo} />);
    click(button(A));
    click(button("Put this in"));
    click(button(B));
    click(button(/^Replace$/));
    click(button("Undo"));
    expect(onUndo).toHaveBeenCalledTimes(1);
    // A is still the last thing that went in: picking B again offers Replace, A shows as in.
    expect(text()).toContain("Replace");
    click(button(A));
    await flush();
    expect(text()).toContain("In your resume");
    click(button("Undo"));
    expect(text()).not.toContain("Undo");
  });

  it("more options arriving keep the pick, the edits and what went in", async () => {
    const onApply = vi.fn(() => true);
    const ui = render(<SuggestionPicker options={[A]} onApply={onApply} />);
    click(button(A));
    await flush();
    type("Led a 9-person team.");
    click(button("Put this in"));
    ui.rerender(<SuggestionPicker options={[A, B]} onApply={onApply} />);
    await flush();
    expect(document.querySelector("textarea")!.value).toBe("Led a 9-person team.");
    expect(text()).toContain("In your resume");
    click(button(B));
    await flush();
    click(button(/^Replace$/));
    expect(onApply).toHaveBeenLastCalledWith(B);
  });
});
