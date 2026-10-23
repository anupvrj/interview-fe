import { describe, expect, it } from "vitest";
import { buildChecklist, guideHasContact, guideHasContent, type ChecklistInput } from "../guideChecklist";

const base: ChecklistInput = {
  hackathon: false, hasContact: false, hasContent: false, atsChecked: false,
  hasSample: false, hadSample: false, atsTarget: null, explored: [], milestones: [],
};
const ids = (input: Partial<ChecklistInput>) => buildChecklist({ ...base, ...input }).map((i) => i.id);
const done = (input: Partial<ChecklistInput>) => buildChecklist({ ...base, ...input }).filter((i) => i.done).map((i) => i.id);

describe("guide checklist", () => {
  it("normal resumes: five setup steps ending in Download", () => {
    expect(ids({})).toEqual(["contact", "content", "ats", "fix", "export"]);
    expect(buildChecklist(base).at(-1)?.label).toBe("Download your resume");
  });

  it("ticks from the resume and from editor events", () => {
    expect(done({ hasContact: true, hasContent: true, explored: ["fix"], milestones: ["fixed", "exported"] })).toEqual([
      "contact", "content", "ats", "fix", "export",
    ]);
    expect(done({ atsChecked: true })).toEqual(["ats"]);
  });

  it("hackathon resumes: the short path, ending in Submit to Hackathon", () => {
    const items = buildChecklist({ ...base, hackathon: true, atsTarget: 75 });
    expect(items.map((i) => i.id)).toEqual(["contact", "ats", "export"]);
    expect(items[1].label).toBe("Check your ATS score (aim for 75+)");
    expect(items[2].label).toBe("Submit to Hackathon");
  });

  it("hackathon: 'Replace the sample text' appears with sample text and ticks once it's gone", () => {
    expect(buildChecklist({ ...base, hackathon: true, hasSample: true, hadSample: true })[0]).toEqual({
      id: "sample", label: "Replace the sample text", done: false,
    });
    expect(buildChecklist({ ...base, hackathon: true, hasSample: false, hadSample: true })[0].done).toBe(true);
    expect(ids({ hackathon: true, hadSample: false })).not.toContain("sample");
  });
});

describe("contact / content detection", () => {
  it("needs a real name plus email or phone", () => {
    expect(guideHasContact({ personalInfo: { fullName: "Priya R", email: "p@x.com" } } as never)).toBe(true);
    expect(guideHasContact({ personalInfo: { fullName: "Priya R" } } as never)).toBe(false);
    expect(guideHasContact({ personalInfo: { fullName: "Your Name", phone: "98450 12873" } } as never)).toBe(false);
    expect(guideHasContact(undefined)).toBe(false);
  });

  it("needs one job or project with a heading", () => {
    expect(guideHasContent({ experience: [{ company: "Razorpay" }] } as never)).toBe(true);
    expect(guideHasContent({ projects: [{ name: "CLI" }] } as never)).toBe(true);
    expect(guideHasContent({ experience: [{ company: "  " }], projects: [] } as never)).toBe(false);
    expect(guideHasContent({} as never)).toBe(false);
  });
});
