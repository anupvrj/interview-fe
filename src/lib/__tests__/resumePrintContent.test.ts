import { describe, expect, it } from "vitest";
import { hasPrintableText, resumeForPrint } from "../resumePrintContent";

describe("what prints: no blank entries, no empty text", () => {
  it("drops blank entries (abandoned 'Add item' rows) and empty editors", () => {
    const out = resumeForPrint({
      profileSummary: "<p></p>",
      content: {
        personalInfo: { fullName: "A" },
        experience: [
          { id: "1", position: "", company: "", startDate: "2026", current: true, description: [""] },
          { id: "2", position: "Intern", company: "Tempus", description: "<ul><li>Built a simulation</li></ul>" },
        ],
        languages: [{ name: "", level: 3 }, { name: "Hindi" }],
        skills: ["", "Go"],
        declaration: "<p> </p>",
        customSections: [{ id: "c1", title: "Custom Section", content: "" }, { id: "c2", title: "Open Source", content: "<p>Maintainer</p>" }],
      },
    } as never) as unknown as { profileSummary: string; content: Record<string, unknown[]> & { declaration: string } };
    expect(out.profileSummary).toBe("");
    expect(out.content.experience).toHaveLength(1);
    expect(out.content.languages).toEqual([{ name: "Hindi" }]);
    expect(out.content.skills).toEqual(["Go"]);
    expect(out.content.declaration).toBe("");
    expect(out.content.customSections).toHaveLength(1);
  });

  it("keeps anything with real text, and grouped skills with content", () => {
    expect(hasPrintableText({ id: "x", title: "Best Software Award" })).toBe(true);
    expect(hasPrintableText({ id: "x", startDate: "2024", endDate: "2025" })).toBe(false);
    const out = resumeForPrint({ content: { skills: { technical: ["Go"], soft: [] } } } as never) as unknown as { content: { skills: unknown } };
    expect(out.content.skills).toEqual({ technical: ["Go"] });
  });
});
