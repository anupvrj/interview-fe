// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { editorBackLink, exportButton, hackathonSubmitButton, studioButton, tourSteps } from "../guideTargets";

// jsdom has no layout: treat everything as visible unless marked data-hidden.
const original = Element.prototype.getClientRects;
beforeEach(() => {
  Element.prototype.getClientRects = function (this: Element) {
    return (this.closest("[data-hidden]") ? [] : [{}]) as unknown as DOMRectList;
  };
});
afterEach(() => {
  Element.prototype.getClientRects = original;
  document.body.innerHTML = "";
});

describe("finding the editor's buttons", () => {
  it("studio buttons by label, skipping the hidden (desktop/phone) copy", () => {
    document.body.innerHTML = `
      <nav aria-label="Resume studio" data-hidden><button>ATS score</button></nav>
      <nav aria-label="Resume studio"><button id="ats"><span>66%</span> ATS score</button><button aria-label="Insert section" id="add"></button></nav>`;
    expect(studioButton("ATS score")?.id).toBe("ats");
    expect(studioButton("Insert section")?.id).toBe("add");
    expect(studioButton("Nope")).toBeNull();
  });

  it("export, Submit to Hackathon and the back link — never inside a dialog", () => {
    document.body.innerHTML = `
      <div role="dialog"><button><svg class="lucide-download"></svg></button><button>Submit to Hackathon</button></div>
      <button id="exp"><svg class="lucide-download"></svg>Export</button>
      <button id="sub">Submit to Hackathon</button>
      <a href="/x" data-editor-back id="back">←</a>`;
    expect(exportButton()?.id).toBe("exp");
    expect(hackathonSubmitButton()?.id).toBe("sub");
    expect(editorBackLink()?.id).toBe("back");
  });
});

describe("tour steps", () => {
  it("normal resumes: six steps ending in Download", () => {
    expect(tourSteps(false, false).map((s) => s.id)).toEqual(["page", "section", "fix", "ai", "templates", "export"]);
    expect(tourSteps(true, false)[0].body).toMatch(/^Tap /);
  });

  it("hackathon resumes: edit, how to get back, score, submit", () => {
    const steps = tourSteps(true, true, { atsTarget: 75 });
    expect(steps.map((s) => s.id)).toEqual(["page", "back", "fix", "submit"]);
    expect(steps[2].title).toBe("Aim for an ATS score of 75+");
    expect(steps[3].body).toMatch(/Complete Challenge/);
  });

  it("hackathon: sample text changes the score step to 'replace the sample text first'", () => {
    expect(tourSteps(false, true, { hasSample: true })[2].body).toMatch(/First replace the sample text/);
    expect(tourSteps(false, true, {})[2].title).toBe("Check your ATS score");
  });
});
