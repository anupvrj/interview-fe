// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { buildResumeDocx, docxStyleFrom, resumeDocLines } from "../resume-docx";
import { getTemplateStyle } from "../templateRenderer";
import { atlanticblueTemplate, atlanticblueExtendedConfig } from "@/configs/resume-templates/atlantic-blue/config";
import { condensedruleTemplate, condensedruleExtendedConfig } from "@/configs/resume-templates/condensed-rule/config";

const resume = {
  templateId: "condensed-rule",
  sectionOrder: [
    { id: "s1", type: "profileSummary", visible: true, title: "Summary", column: "left" },
    { id: "s2", type: "experience", visible: true, title: "Experience", column: "left" },
    { id: "s3", type: "skills", visible: true, title: "Skills", column: "right" },
  ],
  content: {
    personalInfo: { fullName: "Meera Kapoor", email: "meera@example.org" },
    profileSummary: "<p>Marketing manager with 6 years of growth work.</p>",
    experience: [{ id: "e1", company: "Northwind", position: "Marketing Manager", startDate: "2023-04", current: true, description: ["<ul><li>Cut CAC 22% in 12 months</li></ul>"] }],
    skills: "SEO, Google Ads",
  },
} as never;

async function documentXml(blob: Blob) {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return zip.file("word/document.xml")!.async("string");
}

const CONFIGS = {
  "atlantic-blue": { ...atlanticblueTemplate, ...atlanticblueExtendedConfig },
  "condensed-rule": { ...condensedruleTemplate, ...condensedruleExtendedConfig },
} as const;
const styleOf = (id: keyof typeof CONFIGS) => getTemplateStyle(CONFIGS[id] as never);

describe("Word export follows the chosen design", () => {
  it("different templates give different Word looks", async () => {
    const blue = docxStyleFrom(styleOf("atlantic-blue"));
    const rule = docxStyleFrom(styleOf("condensed-rule"));
    expect(blue.font).toBe("Zilla Slab");
    expect(rule.font).toBe("Calibri");
    expect(blue.color.name).toBe("2C3E50");
    expect(blue.heading.rule).toBe("fill");
    expect(blue.margin.left).toBe(Math.round(8 * 56.7)); // full-bleed design → printable Word margin
    expect(rule.headerAlign).toBe("left");
    const [a, b] = await Promise.all([documentXml(await buildResumeDocx(resume, blue)), documentXml(await buildResumeDocx(resume, rule))]);
    expect(a).toContain('w:ascii="Zilla Slab"');
    expect(b).toContain('w:ascii="Calibri"');
    expect(a).toContain("w:shd");
  });

  it("uses the template's font and colour, and the user's own font/margin changes on top", async () => {
    const base = styleOf("condensed-rule");
    const look = docxStyleFrom({ ...base, fontFamily: "Georgia, serif", colors: { ...base.colors, primary: "#1F4E79" } }, { padding: { top: 10, bottom: 10, left: 12, right: 12 } });
    expect(look.font).toBe("Georgia");
    expect(look.color.name).toBe("1F4E79");
    expect(look.margin.left).toBe(Math.round(12 * 56.7));
    const xml = await documentXml(await buildResumeDocx(resume, look));
    expect(xml).toContain('w:ascii="Georgia"');
    expect(xml).toContain('w:val="1F4E79"');
    expect(xml).not.toContain("<w:tbl>");

    const changed = docxStyleFrom(base, { fontFamily: "'Lato', sans-serif" });
    expect(changed.font).toBe("Lato");
  });

  it("two-column designs become a two-column table, sections in their own column", async () => {
    const look = docxStyleFrom(styleOf("condensed-rule"), { type: "double", columnWidths: { left: 65, right: 35 } });
    expect(look.columns).toEqual({ left: 65, right: 35 });
    const lines = resumeDocLines(resume);
    expect(lines.filter((l) => (l as { column?: string }).column === "right").map((l) => l.kind)).toContain("heading");
    const xml = await documentXml(await buildResumeDocx(resume, look));
    expect(xml).toContain("<w:tbl>");
    expect(xml.indexOf("SKILLS")).toBeGreaterThan(xml.indexOf("<w:tc>"));
  });
});
