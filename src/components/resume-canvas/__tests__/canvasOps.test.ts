import { describe, expect, it } from "vitest";
import {
  addEntry,
  blankEntry,
  deleteEntry,
  duplicateEntry,
  getAtPath,
  moveEntry,
  plainFieldText,
  setAtPath,
} from "../canvasOps";

const content = {
  personalInfo: { fullName: "Priya Raghavan", email: "priya@gmail.com" },
  experience: [
    { id: "a", company: "Acme", position: "Engineer" },
    { id: "b", company: "Beta", position: "Intern" },
  ],
  skills: ["Go"],
};

describe("path helpers", () => {
  it("reads nested values and array indexes", () => {
    expect(getAtPath(content, "personalInfo.fullName")).toBe("Priya Raghavan");
    expect(getAtPath(content, "experience.1.company")).toBe("Beta");
    expect(getAtPath(content, "experience.9.company")).toBeUndefined();
  });

  it("sets immutably, copying only the touched branch", () => {
    const next = setAtPath(content, "experience.0.company", "Acme Corp");
    expect(next.experience[0].company).toBe("Acme Corp");
    expect(content.experience[0].company).toBe("Acme");
    expect(next.experience[1]).toBe(content.experience[1]);
    expect(next.personalInfo).toBe(content.personalInfo);
    expect(Array.isArray(next.experience)).toBe(true);
  });

  it("creates missing containers", () => {
    const next = setAtPath({} as Record<string, unknown>, "personalInfo.linkedin", "in/priya");
    expect(next).toEqual({ personalInfo: { linkedin: "in/priya" } });
  });
});

describe("entry operations", () => {
  it("adds a Sample entry after the focused one", () => {
    const { content: next, index } = addEntry(content, "experience", 0);
    expect(index).toBe(1);
    expect(next.experience.map((e) => (e as { company: string }).company)).toEqual(["Acme", "Sample Company", "Beta"]);
  });

  it("adds at the end and to sections that do not exist yet", () => {
    expect(addEntry(content, "experience").index).toBe(2);
    const { content: next } = addEntry(content, "projects");
    expect((next as unknown as { projects: unknown[] }).projects).toHaveLength(1);
  });

  it("moves within bounds only", () => {
    expect(moveEntry(content, "experience", 0, 1).experience.map((e) => e.id)).toEqual(["b", "a"]);
    expect(moveEntry(content, "experience", 0, -1)).toBe(content);
    expect(moveEntry(content, "experience", 1, 1)).toBe(content);
  });

  it("deletes and duplicates", () => {
    expect(deleteEntry(content, "experience", 0).experience.map((e) => e.id)).toEqual(["b"]);
    const dup = duplicateEntry(content, "experience", 0).experience;
    expect(dup).toHaveLength(3);
    expect(dup[1].company).toBe("Acme");
    expect(dup[1].id).not.toBe("a");
  });

  it("seeds new entries with Sample labels the placeholder check recognises", () => {
    expect(blankEntry("experience")).toMatchObject({ position: "Sample Job", company: "Sample Company", current: true });
    expect(blankEntry("education")).toMatchObject({ degree: "Sample Degree" });
    expect(blankEntry("projects")).toMatchObject({ name: "Sample Project" });
  });
});

describe("plainFieldText", () => {
  it("collapses whitespace and non-breaking spaces", () => {
    expect(plainFieldText("  Senior  Engineer \n")).toBe("Senior Engineer");
  });
});
