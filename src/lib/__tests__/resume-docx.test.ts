// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { buildResumeDocx, htmlToLines, resumeDocLines } from "../resume-docx";

const resume = {
  templateId: "condensed-rule",
  sectionOrder: [
    { id: "s1", type: "profileSummary", visible: true, title: "Summary" },
    { id: "s2", type: "experience", visible: true, title: "Work Experience" },
    { id: "s3", type: "skills", visible: true, title: "Skills" },
    { id: "s4", type: "projects", visible: false, title: "Projects" },
    { id: "c1", type: "custom", visible: true, title: "Talks" },
  ],
  content: {
    personalInfo: { fullName: "Meera Kapoor", email: "meera@example.org", phone: "+91 90000 11111", location: "Bengaluru" },
    profileSummary: "<p>Marketing manager with <strong>6 years</strong> of growth work.</p>",
    experience: [{ id: "e1", company: "Northwind", position: "Marketing Manager", startDate: "2023-04", current: true, description: ["<ul><li>Cut CAC 22% in 12 months</li><li>Grew organic sessions 68%</li></ul>"] }],
    education: [],
    skills: "SEO, Google Ads, Meta Ads",
    projects: [{ id: "p1", name: "Hidden project", description: "should not appear", technologies: "" }],
    customSections: [{ id: "c1", title: "Talks", content: "<p>Spoke at a growth meetup</p>" }],
  },
} as never;

describe("resume → Word", () => {
  it("keeps paragraphs, bullets and bold from the editor's HTML", () => {
    const lines = htmlToLines("<p>Led <strong>3</strong> launches</p><ul><li>One</li><li>Two</li></ul>");
    expect(lines.map((l) => l.kind)).toEqual(["para", "bullet", "bullet"]);
    expect(lines[0]).toEqual({ kind: "para", runs: [{ text: "Led ", bold: false, italics: false }, { text: "3", bold: true, italics: false }, { text: " launches", bold: false, italics: false }] });
  });

  it("follows the section order and titles, and leaves switched-off sections out", () => {
    const lines = resumeDocLines(resume);
    const headings = lines.filter((l) => l.kind === "heading").map((l) => (l as { text: string }).text);
    expect(headings).toEqual(["Summary", "Work Experience", "Skills", "Talks"]);
    expect(JSON.stringify(lines)).not.toContain("Hidden project");
    expect(lines).toContainEqual({ kind: "entry", left: "Marketing Manager — Northwind", right: "2023-04 – Present" });
  });

  it("produces a real .docx containing the resume text", async () => {
    const blob = await buildResumeDocx(resume);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain("Meera Kapoor");
    expect(xml).toContain("Cut CAC 22% in 12 months");
    expect(xml).not.toContain("should not appear");
  });
});
