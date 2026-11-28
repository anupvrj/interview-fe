import { describe, expect, it } from "vitest";
import { describeLayout, findResumeParts } from "../resumeFindings";

describe("findResumeParts", () => {
  it("finds contact details and section headings, ignoring body lines that mention them", () => {
    const text = [
      "Riya Test",
      "riya.test@northwind.invalid · +91 98201 47356",
      "PROFESSIONAL SUMMARY",
      "Product manager with seven years of experience in payments.",
      "Work Experience",
      "Product Manager, Northwind Labs",
      "Education:",
      "MBA, Pune University",
      "Technical Skills",
      "SQL, Roadmaps",
    ].join("\n");
    expect(findResumeParts(text)).toEqual(["Contact details", "Summary", "Experience", "Education", "Skills"]);
  });

  it("nothing found in plain prose", () => {
    expect(findResumeParts("I have a lot of experience and great skills in many projects that I led for years.")).toEqual([]);
  });
});

describe("describeLayout", () => {
  it("puts the look into words", () => {
    expect(
      describeLayout({ columns: 2, sidebar: "left", sidebarDark: true, headerBand: false, photo: true, serif: false, accent: "#2c5f9e" }).map((x) => x.label),
    ).toEqual(["2 columns", "Dark left sidebar", "Sans-serif font", "Photo", "Colour accent"]);
    expect(describeLayout({ columns: 1, sidebar: "none", sidebarDark: false, headerBand: true, photo: null, serif: null, accent: null }).map((x) => x.label)).toEqual([
      "1 column",
      "Coloured header",
    ]);
  });
});
