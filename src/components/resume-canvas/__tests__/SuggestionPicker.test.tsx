// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { SuggestionPicker } from "../SuggestionPicker";
import { act, button, cleanup, click, flush, render, text } from "@/test-utils/render";

afterEach(cleanup);

const A = "Led a 6-person team that shipped weekly releases.";
const B = "Partnered with design to cut onboarding time by 30%.";

const box = () => document.querySelector("textarea");
function type(value: string) {
  const el = box()!;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
  act(() => {
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const optionButtons = () => [...document.querySelectorAll("button")].filter((b) => /Use & edit/.test(b.textContent ?? ""));

describe("SuggestionPicker", () => {
  it("picking an option shows only that one, editable; the edited text goes in and the card turns green", async () => {
    const onApply = vi.fn(() => true);
    render(<SuggestionPicker options={[A, B]} onApply={onApply} />);
    expect(box()).toBeNull();
    expect(optionButtons()).toHaveLength(2);
    click(button(A));
    await flush();
    expect(optionButtons()).toHaveLength(0); // the others are hidden
    expect(box()!.value).toBe(A);
    expect(text()).toContain("Option 1 of 2");
    type("Led a 7-person team that shipped weekly releases.");
    click(button("Put this in"));
    expect(onApply).toHaveBeenCalledWith("Led a 7-person team that shipped weekly releases.");
    expect(text()).toContain("In your resume");
    expect(box()).toBeNull(); // the chosen text isn't repeated
  });

  it("Back returns to all the options, keeping the edit", async () => {
    render(<SuggestionPicker options={[A, B]} onApply={() => true} />);
    click(button(A));
    await flush();
    type("Led a 9-person team.");
    click(button("Back to options"));
    expect(optionButtons()).toHaveLength(2);
    expect(text()).toContain("Led a 9-person team.");
  });

  it("after one goes in, Other options → another one offers Replace", async () => {
    const onApply = vi.fn(() => true);
    render(<SuggestionPicker options={[A, B]} onApply={onApply} />);
    click(button(A));
    click(button("Put this in"));
    click(button("Other options"));
    expect(text()).toContain("Picking one replaces the line you put in");
    click(button(B));
    await flush();
    click(button(/Replace/));
    expect(onApply).toHaveBeenLastCalledWith(B);
  });

  it("Rewrite asks for new options and shows them when they arrive", async () => {
    const onRewrite = vi.fn();
    const C = "Ran weekly releases with a 6-person team.";
    const ui = render(<SuggestionPicker options={[A, B]} onApply={() => true} onRewrite={onRewrite} />);
    click(button(A));
    click(button("Put this in"));
    click(button("Rewrite"));
    expect(onRewrite).toHaveBeenCalledTimes(1);
    ui.rerender(<SuggestionPicker options={[A, B]} onApply={() => true} onRewrite={onRewrite} rewriting />);
    expect(text()).not.toContain(A);
    ui.rerender(<SuggestionPicker options={[C]} onApply={() => true} onRewrite={onRewrite} />);
    await flush();
    expect(text()).toContain(C);
    expect(text()).not.toContain("In your resume");
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
    expect(box()!.value).toBe(A);
  });

  it("Undo takes it out and goes back to editing that text", async () => {
    const onUndo = vi.fn();
    render(<SuggestionPicker options={[A, B]} onApply={() => true} onUndo={onUndo} />);
    click(button(A));
    click(button("Put this in"));
    click(button("Undo"));
    expect(onUndo).toHaveBeenCalledTimes(1);
    await flush();
    expect(box()!.value).toBe(A);
    expect((button("Put this in") as HTMLButtonElement).disabled).toBe(false);
  });

  it("more options arriving while editing keep the pick and the edit", async () => {
    const onApply = vi.fn(() => true);
    const ui = render(<SuggestionPicker options={[A]} onApply={onApply} />);
    click(button(A));
    await flush();
    type("Led a 9-person team.");
    ui.rerender(<SuggestionPicker options={[A, B]} onApply={onApply} />);
    await flush();
    expect(box()!.value).toBe("Led a 9-person team.");
    click(button("Put this in"));
    expect(onApply).toHaveBeenLastCalledWith("Led a 9-person team.");
  });
});
