// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { ResumeRenderer } from "../ResumeRenderer";
import { TemplateLoader } from "@/lib/templateLoader";
import { buildSectionOrderForExtractedContent } from "@/lib/resume-data-import";
import { getExtendedTemplate } from "@/lib/templateConfigs";
import { cleanup, render } from "@/test-utils/render";
import type { Resume, ResumeTemplate } from "@/lib/api";

afterEach(cleanup);

const content = {
  personalInfo: { fullName: "Nisha Verma", email: "n@x.co" },
  experience: [{ id: "e1", company: "Acme", position: "Lead", description: "<ul><li>Shipped it</li></ul>", startDate: "2020-01" }],
  projects: [{ id: "p1", name: "OpenHinglish", description: "Speech recogniser" }],
  publications: [{ id: "pub1", title: "Sparse Attention for Speech", publisher: "ACL 2024" }],
  awards: [{ id: "a1", title: "Best Paper Mention" }],
  customSections: [
    { id: "custom_1", title: "RESEARCH EXPERIENCE", content: "<p>Carnegie Mellon visit</p>" },
    { id: "custom_2", title: "PATENTS", content: "<p>US 11,482,201</p>" },
  ],
};

describe("an uploaded resume in Condensed Rule", () => {
  beforeAll(() => TemplateLoader.loadCodeTemplate("condensed-rule"));

  it("shows every parsed section, including ones the template doesn't list by default", async () => {
    const config = await TemplateLoader.loadCodeTemplate("condensed-rule");
    const template = { ...config.template, id: "condensed-rule", previewOverrides: null } as unknown as ResumeTemplate;
    const sectionOrder = buildSectionOrderForExtractedContent(getExtendedTemplate(template), content, "single");
    const resume = { resumeId: "r", userId: "u", title: "t", templateId: "condensed-rule", content, sectionOrder } as unknown as Resume;

    const view = render(<ResumeRenderer resume={resume} template={template} sections={sectionOrder} />);
    const text = view.container.textContent ?? "";
    for (const expected of ["OpenHinglish", "Sparse Attention for Speech", "Best Paper Mention", "RESEARCH EXPERIENCE", "Carnegie Mellon visit", "PATENTS", "US 11,482,201"]) {
      expect(text.toUpperCase()).toContain(expected.toUpperCase());
    }
  });
});
