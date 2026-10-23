// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditorTour } from "../EditorTour";
import { tourSteps, resumePage } from "../guideTargets";
import { act, button, cleanup, click, flush, key, render, text } from "@/test-utils/render";
import { fakeLayout, mountEditorFixture } from "./editorFixture";

let restore: () => void;
beforeEach(() => {
  restore = fakeLayout();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  restore();
  vi.useRealTimers();
});

function tour(props: Partial<Parameters<typeof EditorTour>[0]> = {}) {
  const onEnd = vi.fn();
  const onStep = vi.fn();
  render(
    <EditorTour
      steps={tourSteps(false, false)}
      isMobile={false}
      firstName="Priya"
      welcome
      flyTo={() => null}
      onStep={onStep}
      onEnd={onEnd}
      {...props}
    />,
  );
  return { onEnd, onStep };
}

describe("EditorTour", () => {
  it("welcome → steps with Next / arrow keys → Back", async () => {
    mountEditorFixture();
    const { onStep } = tour();
    expect(text()).toContain("Hi Priya! Let’s make your resume shine");
    click(button("Start the tour"));
    await flush();
    expect(text()).toContain("This is your resume");
    expect(text()).toContain("Next · 1/6");
    key("ArrowRight");
    await flush();
    expect(text()).toContain("Add sections");
    click(button("Next · 2/6"));
    await flush();
    expect(text()).toContain("Check your ATS score");
    click(button("Back"));
    await flush();
    expect(text()).toContain("Add sections");
    expect(onStep).toHaveBeenCalledWith(0, expect.objectContaining({ id: "page" }));
  });

  it("skips steps whose button isn't on the page", async () => {
    mountEditorFixture({ withoutCoach: true });
    tour({ welcome: false });
    await flush();
    expect(text()).toContain("Next · 1/5");
    expect(text()).not.toContain("Stuck on a line?");
  });

  it("Esc, Skip and ✕ end it as skipped", async () => {
    mountEditorFixture();
    const a = tour({ welcome: false });
    await flush();
    key("Escape");
    expect(a.onEnd).toHaveBeenCalledWith("skipped");
    cleanup();
    restore = fakeLayout();
    mountEditorFixture();
    const b = tour({ welcome: false });
    await flush();
    click(button("Close tour"));
    expect(b.onEnd).toHaveBeenCalledWith("skipped");
  });

  it("the last step celebrates, then ends as done", async () => {
    mountEditorFixture();
    vi.useFakeTimers();
    const { onEnd } = tour({ welcome: false, steps: tourSteps(false, false).slice(-1) });
    act(() => vi.advanceTimersByTime(50));
    click(button("Finish"));
    expect(text()).toContain("You're all set!");
    expect(onEnd).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(2700));
    expect(onEnd).toHaveBeenCalledWith("done");
  });

  it("a checklist 'Show me' is one step with Got it — no celebration", async () => {
    mountEditorFixture();
    const { onEnd } = tour({
      welcome: false,
      mini: true,
      steps: [{ id: "contact", emoji: "👤", title: "Your name & contact", body: "Tap your name", find: resumePage }],
    });
    await flush();
    expect(text()).not.toContain("Skip");
    click(button("Got it"));
    expect(onEnd).toHaveBeenCalledWith("done");
    expect(text()).not.toContain("You're all set!");
  });

  it("hackathon welcome and steps", async () => {
    mountEditorFixture({ hackathon: true });
    tour({
      steps: tourSteps(false, true, { atsTarget: 75 }),
      welcomeTitle: "Let’s get your Hiring Games resume submitted",
    });
    expect(text()).toContain("Hi Priya! Let’s get your Hiring Games resume submitted");
    click(button("Start the tour"));
    await flush();
    expect(text()).toContain("This is your hackathon resume");
    key("ArrowRight");
    await flush();
    expect(text()).toContain("Not ready yet?");
    key("ArrowRight");
    await flush();
    expect(text()).toContain("Aim for an ATS score of 75+");
    key("ArrowRight");
    await flush();
    expect(text()).toContain("Submit when ready");
  });

  it("the cursor and click circles follow the highlighted button", async () => {
    mountEditorFixture();
    tour({ welcome: false });
    await flush();
    expect(document.querySelector(".eg-cursor.eg-on svg")).not.toBeNull();
    expect(document.querySelectorAll(".eg-click.eg-on i")).toHaveLength(2);
    expect(button("Turn click sound off")).toBeTruthy();
  });
});
