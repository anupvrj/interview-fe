import { describe, expect, it, vi } from "vitest";

// Template shapes like the real ones (sidebar header, column assignment, forced two columns).
const CONFIGS: Record<string, { style: Record<string, unknown>; rendering?: { layout?: Record<string, unknown> } }> = {
  plain: { style: { headerStyle: "left" } },
  photo: { style: { headerStyle: "left", headerLayout: { type: "with-profile-picture" } } },
  "clean-slate": {
    style: { headerStyle: "left" },
    rendering: { layout: { type: "double", columnAssignment: { left: ["experience", "education"], right: ["skills", "languages"] } } },
  },
  "atlantic-blue": {
    style: { headerStyle: "two-column" },
    rendering: { layout: { type: "double", columnAssignment: { left: ["personalInfo", "skills"], right: ["experience", "education"] } } },
  },
  "saffron-line": {
    style: { headerStyle: "left" },
    rendering: { layout: { type: "double", columnAssignment: { left: ["skills", "education"], right: ["experience"] } } },
  },
};
vi.mock("@/lib/templateConfigs", () => ({ getExtendedTemplate: (t: { id: string }) => ({ ...t, ...CONFIGS[t.id] }) }));
vi.mock("@/lib/templateRenderer", () => ({ getTemplateStyle: (t: { style: unknown }) => t.style }));

const { dropSection, moveSectionWithinColumn, organizeSectionColumns, sectionMoveBounds } = await import("../sectionLayout");

type S = { id: string; type: string; title: string; visible: boolean; column?: "left" | "right" };
const sec = (type: string, extra: Partial<S> = {}): S => ({ id: type, type, title: type, visible: true, ...extra });
const tpl = (id: string) => ({ id }) as never;
const ids = (list: S[]) => list.map((s) => s.id);
const BASE = [sec("personalInfo"), sec("experience"), sec("education"), sec("skills"), sec("languages"), sec("projects", { visible: false })];

describe("organizeSectionColumns (same as the page)", () => {
  it("one column: header stays in the flow; with a photo header it's pinned on top", () => {
    expect(ids(organizeSectionColumns(BASE, "single", tpl("plain")).single)).toEqual(["personalInfo", "experience", "education", "skills", "languages"]);
    const photo = organizeSectionColumns(BASE, "single", tpl("photo"));
    expect(photo.header?.id).toBe("personalInfo");
    expect(ids(photo.single)).toEqual(["experience", "education", "skills", "languages"]);
  });

  it("two columns: the template's assignment, the user's column choice wins", () => {
    const cols = organizeSectionColumns(BASE, "double", tpl("clean-slate"));
    expect(ids(cols.left)).toEqual(["experience", "education"]);
    expect(ids(cols.right)).toEqual(["skills", "languages"]);
    const moved = organizeSectionColumns(BASE.map((s) => (s.id === "skills" ? { ...s, column: "left" as const } : s)), "double", tpl("clean-slate"));
    expect(ids(moved.left)).toEqual(["experience", "education", "skills"]);
  });

  it("Saffron Line is two columns even when the resume says single, and respects a moved section", () => {
    const cols = organizeSectionColumns(BASE.map((s) => (s.id === "experience" ? { ...s, column: "left" as const } : s)), "single", tpl("saffron-line"));
    expect(cols.isDouble).toBe(true);
    expect(ids(cols.left)).toEqual(["experience", "education", "skills", "languages"]);
    expect(ids(cols.right)).toEqual([]);
  });

  it("a sidebar header stays at the top of its column", () => {
    const list = [sec("skills", { column: "left" }), sec("personalInfo", { column: "left" }), sec("experience")];
    expect(ids(organizeSectionColumns(list, "double", tpl("atlantic-blue")).left)).toEqual(["personalInfo", "skills"]);
  });
});

describe("↑ / ↓ move within the column", () => {
  it("down from the bottom of the left column is off (it used to swap into the right column)", () => {
    expect(sectionMoveBounds(BASE, "education", "double", tpl("clean-slate"))).toEqual({ up: true, down: false });
    expect(moveSectionWithinColumn(BASE, "education", 1, "double", tpl("clean-slate"))).toBeNull();
  });

  it("moves inside the column and keeps every section's column", () => {
    const next = moveSectionWithinColumn(BASE, "languages", -1, "double", tpl("clean-slate"))!;
    const cols = organizeSectionColumns(next, "double", tpl("clean-slate"));
    expect(ids(cols.left)).toEqual(["experience", "education"]);
    expect(ids(cols.right)).toEqual(["languages", "skills"]);
    // Hidden sections are kept, at the end.
    expect(next[next.length - 1]).toMatchObject({ id: "projects", visible: false });
  });

  it("alternating layouts (no saved columns) don't jump columns when moved", () => {
    const next = moveSectionWithinColumn(BASE, "skills", -1, "double", tpl("plain"))!;
    const cols = organizeSectionColumns(next, "double", tpl("plain"));
    // Before: left = experience, skills; right = education, languages.
    expect(ids(cols.left)).toEqual(["skills", "experience"]);
    expect(ids(cols.right)).toEqual(["education", "languages"]);
  });

  it("never moves above the header, and hidden sections at the end don't count as 'below'", () => {
    expect(sectionMoveBounds(BASE, "experience", "single", tpl("plain")).up).toBe(false);
    expect(sectionMoveBounds(BASE, "languages", "single", tpl("plain")).down).toBe(false);
    expect(sectionMoveBounds(BASE, "personalInfo", "single", tpl("plain"))).toEqual({ up: false, down: false });
  });
});

describe("dropping in the order dialog", () => {
  it("can put a section last (drop after the last one) — before, you could only get second-to-last", () => {
    const next = dropSection(BASE, "experience", "single", "languages", "after", "single", tpl("plain"))!;
    expect(ids(organizeSectionColumns(next, "single", tpl("plain")).single)).toEqual(["personalInfo", "education", "skills", "languages", "experience"]);
  });

  it("drops at the end of a column (empty space) and before / after a box", () => {
    const end = dropSection(BASE, "experience", "single", null, "after", "single", tpl("plain"))!;
    expect(ids(organizeSectionColumns(end, "single", tpl("plain")).single).at(-1)).toBe("experience");
    const before = dropSection(BASE, "languages", "single", "education", "before", "single", tpl("plain"))!;
    expect(ids(organizeSectionColumns(before, "single", tpl("plain")).single)).toEqual(["personalInfo", "experience", "languages", "education", "skills"]);
  });

  it("left → right and right → left land exactly where dropped", () => {
    const toRight = dropSection(BASE, "education", "right", "skills", "after", "double", tpl("clean-slate"))!;
    let cols = organizeSectionColumns(toRight, "double", tpl("clean-slate"));
    expect(ids(cols.left)).toEqual(["experience"]);
    expect(ids(cols.right)).toEqual(["skills", "education", "languages"]);
    const toLeft = dropSection(toRight, "languages", "left", "experience", "before", "double", tpl("clean-slate"))!;
    cols = organizeSectionColumns(toLeft, "double", tpl("clean-slate"));
    expect(ids(cols.left)).toEqual(["languages", "experience"]);
    expect(ids(cols.right)).toEqual(["skills", "education"]);
  });

  it("dropping above the header lands just below it; dropping on itself changes nothing", () => {
    const next = dropSection(BASE, "skills", "single", "personalInfo", "before", "single", tpl("plain"))!;
    expect(ids(organizeSectionColumns(next, "single", tpl("plain")).single).slice(0, 2)).toEqual(["personalInfo", "skills"]);
    expect(dropSection(BASE, "skills", "single", "skills", "after", "single", tpl("plain"))).toBeNull();
    expect(dropSection(BASE, "personalInfo", "single", "skills", "after", "single", tpl("plain"))).toBeNull();
  });
});
