import { describe, expect, it } from "vitest";
import {
  listItemsFrom,
  sectionDesignOf,
  supportsListDesigns,
  withSectionDesign,
} from "../resume-section-designs";

describe("section designs", () => {
  it("stores a design per section and clears it back to the template's look", () => {
    const layout = { type: "single", fontSize: { body: 12 } };
    const withTable = withSectionDesign(layout, "skills", "columns-3");
    expect(sectionDesignOf(withTable, "skills")).toBe("columns-3");
    expect(withTable.fontSize).toEqual({ body: 12 }); // the rest of the layout is kept
    expect(sectionDesignOf(withSectionDesign(withTable, "skills", null), "skills")).toBeNull();
    expect(layout).not.toHaveProperty("sectionDesigns"); // not mutated
  });

  it("ignores unknown or missing designs", () => {
    expect(sectionDesignOf(undefined, "skills")).toBeNull();
    expect(sectionDesignOf({ sectionDesigns: { skills: "rainbow" } }, "skills")).toBeNull();
  });

  it("is offered for list sections only, and not where the template's block also shows other sections", () => {
    expect(supportsListDesigns("skills", "true-blue")).toBe(true);
    expect(supportsListDesigns("interests", "classic")).toBe(true);
    expect(supportsListDesigns("experience", "classic")).toBe(false);
    expect(supportsListDesigns("skills", "royal-indigo")).toBe(false);
    expect(supportsListDesigns("interests", "meridian")).toBe(false);
  });

  it("reads skills in every stored shape and keeps one entry whole even with commas in it", () => {
    expect(listItemsFrom(["React", "AWS (Lambda, SQS, SNS)", "react"])).toEqual(["React", "AWS (Lambda, SQS, SNS)"]);
    expect(listItemsFrom("<ul><li>Go</li><li>Rust &amp; C</li></ul>")).toEqual(["Go", "Rust & C"]);
    expect(listItemsFrom("SQL, AWS (S3, EC2) | Docker\nKubernetes")).toEqual(["SQL", "AWS (S3, EC2)", "Docker", "Kubernetes"]);
    expect(listItemsFrom({ Technical: ["Java", "Spring"], Soft: "Leadership, Mentoring" })).toEqual([
      "Java",
      "Spring",
      "Leadership",
      "Mentoring",
    ]);
    expect(listItemsFrom([{ name: "Python" }])).toEqual(["Python"]);
    expect(listItemsFrom(null)).toEqual([]);
  });
});
