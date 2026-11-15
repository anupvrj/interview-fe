// @vitest-environment jsdom
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const trackEvent = vi.fn();
vi.mock("@/lib/analytics/gtag", () => ({ trackEvent: (...a: unknown[]) => trackEvent(...a) }));

import { EditorGuide, type EditorGuideHandle } from "../EditorGuide";
import { act, button, cleanup, click, render, text } from "@/test-utils/render";
import { fakeLayout, mountEditorFixture } from "./editorFixture";

let restore: () => void;
beforeEach(() => {
  restore = fakeLayout();
  Element.prototype.scrollIntoView = vi.fn();
  localStorage.clear();
  trackEvent.mockClear();
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  restore();
  vi.useRealTimers();
});

const saved = () => JSON.parse(localStorage.getItem("ix:editorGuide:v1:u1") ?? "null");

function guide(props: Partial<Parameters<typeof EditorGuide>[0]> = {}) {
  const ref = createRef<EditorGuideHandle>();
  const onOpenPanel = vi.fn();
  const all = {
    userId: "u1", firstName: "Priya", isMobile: false, active: true, resumeIsNew: true, hackathon: false,
    hasContact: true, hasContent: false, atsChecked: false, openPanel: null, onOpenPanel, ...props,
  };
  const view = render(<EditorGuide ref={ref} {...all} />);
  const tick = (ms = 700) => act(() => vi.advanceTimersByTime(ms));
  return { ref, onOpenPanel, view, tick, all };
}

describe("EditorGuide", () => {
  it("new resume: the welcome starts by itself once the page is there", () => {
    const { tick } = guide();
    tick();
    expect(text()).not.toContain("Let’s make your resume shine"); // no page yet → waits
    mountEditorFixture();
    tick();
    expect(text()).toContain("Hi Priya! Let’s make your resume shine");
    expect(trackEvent).toHaveBeenCalledWith("editor_guide_tour_start", expect.objectContaining({ welcome: true }));
  });

  it("waits while another dialog is open", () => {
    mountEditorFixture();
    document.body.insertAdjacentHTML("beforeend", '<div role="dialog" id="other">Upgrade</div>');
    const { tick } = guide();
    tick(2000);
    expect(text()).not.toContain("Let’s make your resume shine");
    document.getElementById("other")!.remove();
    tick();
    expect(text()).toContain("Let’s make your resume shine");
  });

  it("Later: the welcome comes back next visit, three times at most; Skip stops it for good", () => {
    mountEditorFixture();
    for (let visit = 1; visit <= 3; visit++) {
      const { tick } = guide();
      tick();
      expect(text()).toContain("Let’s make your resume shine");
      click(button("Later"));
      expect(saved()).toMatchObject({ laterCount: visit, tour: visit < 3 ? null : "skipped" });
      cleanup();
      restore = fakeLayout();
      mountEditorFixture();
    }
    const { tick } = guide();
    tick(2000);
    expect(text()).not.toContain("Let’s make your resume shine"); // asked three times — stops

    cleanup();
    restore = fakeLayout();
    localStorage.clear();
    mountEditorFixture();
    const g = guide();
    g.tick();
    click(button("Start the tour"));
    click(button("Skip"));
    expect(saved()).toMatchObject({ tour: "skipped", laterCount: 0 });
  });

  it("existing resume: one-time prompt; No thanks is remembered", () => {
    mountEditorFixture();
    const { tick } = guide({ resumeIsNew: false });
    tick();
    expect(text()).toContain("New: a 30-second tour");
    expect(text()).not.toContain("Resume setup"); // no checklist for existing users who haven't taken it
    click(button("No thanks"));
    expect(text()).not.toContain("New: a 30-second tour");
    expect(saved()).toMatchObject({ tour: "skipped", prompted: true });
  });

  it("tour already seen: nothing pops up; the checklist stays for new resumes", () => {
    localStorage.setItem("ix:editorGuide:v1:u1", JSON.stringify({ tour: "done", explored: [], milestones: [] }));
    mountEditorFixture();
    const { tick } = guide();
    tick();
    expect(text()).not.toContain("Let’s make your resume shine");
    expect(button("Resume setup: 1 of 5 done")).toBeTruthy();
  });

  it("editor events tick the checklist and are saved", () => {
    localStorage.setItem("ix:editorGuide:v1:u1", JSON.stringify({ tour: "done", explored: [], milestones: [] }));
    mountEditorFixture();
    const { ref, tick } = guide();
    tick();
    act(() => ref.current!.milestone("fixed"));
    act(() => ref.current!.milestone("exported"));
    expect(button("Resume setup: 3 of 5 done")).toBeTruthy();
    expect(saved().milestones).toEqual(["fixed", "exported"]);
  });

  it("opening a tool counts as explored (ticks the ATS step, stops its beacon)", () => {
    localStorage.setItem("ix:editorGuide:v1:u1", JSON.stringify({ tour: "done", explored: [], milestones: [] }));
    mountEditorFixture();
    const g = guide();
    g.tick();
    g.view.rerender(<EditorGuide {...g.all} openPanel="fix" />);
    g.tick();
    expect(saved().explored).toEqual(["fix"]);
  });

  it("Show me on the ATS item opens the panel", () => {
    localStorage.setItem("ix:editorGuide:v1:u1", JSON.stringify({ tour: "done", explored: [], milestones: [] }));
    mountEditorFixture();
    const { onOpenPanel, tick } = guide({ hasContent: true });
    tick();
    click(button("Resume setup"));
    click(button("Check your ATS score"));
    expect(onOpenPanel).toHaveBeenCalledWith("fix");
  });

  it("hackathon resume: hackathon welcome, and the checklist leads to Submit", () => {
    mountEditorFixture({ hackathon: true });
    const { tick } = guide({ hackathon: true, hasSample: true, atsTarget: 75 });
    tick();
    expect(text()).toContain("Let’s get your Hiring Games resume submitted");
    click(button("Later"));
    tick();
    click(button("Resume setup"));
    expect(text()).toContain("Replace the sample text");
    expect(text()).toContain("Check your ATS score (aim for 75+)");
    expect(text()).toContain("Submit to Hackathon");
  });

  it("does nothing when inactive (classic editor) or signed out", () => {
    mountEditorFixture();
    const a = guide({ active: false });
    a.tick(2000);
    expect(text()).not.toContain("Let’s make your resume shine");
    cleanup();
    restore = fakeLayout();
    mountEditorFixture();
    const b = guide({ userId: null });
    b.tick(2000);
    expect(text()).not.toContain("Let’s make your resume shine");
  });
});

describe("EditorGuide ATS tour", () => {
  const atsPanel = () =>
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="ats-panel"><div data-guide="ats-score"></div><div data-guide="ats-finding"></div></div>',
    );
  const nextUntilDone = () => {
    for (let i = 0; i < 6 && !saved()?.atsTour; i++) {
      const b = [...document.querySelectorAll("button")].find((x) => /Next|Got it/.test(x.textContent ?? ""));
      if (!b) break;
      click(b as HTMLElement);
      act(() => vi.advanceTimersByTime(50));
    }
  };

  it("starts instead of the general tour, the first time the panel shows a report", () => {
    mountEditorFixture();
    atsPanel();
    const { tick } = guide({ openPanel: "fix", atsPanelReady: true });
    tick(1000);
    expect(text()).toContain("Your ATS score");
    expect(text()).not.toContain("Let’s make your resume shine");
    expect(trackEvent).toHaveBeenCalledWith("editor_guide_ats_tour_start", {});
    document.getElementById("ats-panel")!.remove();
  });

  it("isn't shown again, and the general tour doesn't follow it", () => {
    mountEditorFixture();
    atsPanel();
    const { tick } = guide({ openPanel: "fix", atsPanelReady: true });
    tick(1000);
    nextUntilDone();
    expect(saved().atsTour).toBe(true);
    expect(saved().tour).toBe("done");
    tick(2000);
    expect(text()).not.toContain("Let’s make your resume shine");
    document.getElementById("ats-panel")!.remove();
  });

  it("stays off on phones and in the hackathon flow", () => {
    mountEditorFixture();
    atsPanel();
    const phone = guide({ isMobile: true, openPanel: "fix", atsPanelReady: true });
    phone.tick(1000);
    expect(trackEvent).not.toHaveBeenCalledWith("editor_guide_ats_tour_start", {});
    phone.view.unmount();
    localStorage.clear();
    const event = guide({ hackathon: true, openPanel: "fix", atsPanelReady: true });
    event.tick(1000);
    expect(trackEvent).not.toHaveBeenCalledWith("editor_guide_ats_tour_start", {});
    document.getElementById("ats-panel")!.remove();
  });

  it("can be replayed from the panel", () => {
    mountEditorFixture();
    atsPanel();
    localStorage.setItem("ix:editorGuide:v1:u1", JSON.stringify({ atsTour: true, tour: "done" }));
    const { ref } = guide({ openPanel: "fix", atsPanelReady: true });
    act(() => ref.current!.startAtsTour());
    expect(text()).toContain("Your ATS score");
    document.getElementById("ats-panel")!.remove();
  });
});
