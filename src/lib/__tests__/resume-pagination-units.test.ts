// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { buildMeasuredUnits } from "../resume-pagination/buildMeasuredUnits";

interface Rect {
  top: number;
  bottom: number;
  height: number;
}

function makeEl(
  container: HTMLElement,
  attrs: Record<string, string>,
  rect: Rect,
  tag = "div",
): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.getBoundingClientRect = () => ({
    top: rect.top,
    bottom: rect.bottom,
    left: 0,
    right: 100,
    width: 100,
    height: rect.height,
    x: 0,
    y: rect.top,
    toJSON: () => ({}),
  });
  container.appendChild(el);
  return el;
}

function makeContainer(): HTMLElement {
  const c = document.createElement("div");
  c.getBoundingClientRect = () => ({
    top: 0, bottom: 5000, left: 0, right: 800, width: 800, height: 5000, x: 0, y: 0, toJSON: () => ({}),
  });
  return c;
}

describe("buildMeasuredUnits", () => {
  it("represents personalInfo as one unit (the page-1 header) and skips its inner markers", () => {
    const c = makeContainer();
    const header = makeEl(c, { "data-section": "personalInfo" }, { top: 0, bottom: 120, height: 120 });
    makeEl(header, { "data-section-header": "", "data-section": "personalInfo" }, { top: 10, bottom: 50, height: 40 });

    const { units, headerHeight } = buildMeasuredUnits(c, 1062);
    expect(headerHeight).toBe(120);
    const pInfo = units.find((u) => u.id === "personalInfo");
    expect(pInfo).toBeDefined();
    expect(pInfo!.kind).toBe("header");
    expect(pInfo!.keepWithNext).toBe(false);
    // Inner personalInfo markers are skipped (no overlap).
    expect(units.filter((u) => u.sectionId === "personalInfo")).toEqual([pInfo]);
  });

  it("emits header + body sub-markers and drops the bare item wrapper", () => {
    const c = makeContainer();
    const sec = makeEl(c, { "data-section": "experience" }, { top: 0, bottom: 500, height: 500 });
    makeEl(sec, { "data-section-header": "", "data-section": "experience" }, { top: 0, bottom: 40, height: 40 });
    makeEl(sec, { "data-item-id": "exp-0" }, { top: 40, bottom: 500, height: 460 });
    makeEl(sec, { "data-item-id": "exp-0-header" }, { top: 40, bottom: 90, height: 50 });
    makeEl(sec, { "data-item-id": "exp-0-body" }, { top: 90, bottom: 500, height: 410 });

    const { units } = buildMeasuredUnits(c, 1062);
    const ids = units.map((u) => u.id);
    expect(ids).not.toContain("exp-0"); // bare wrapper dropped
    expect(ids).toContain("exp-0-header");
    expect(ids).toContain("exp-0-body");
    const header = units.find((u) => u.id === "exp-0-header")!;
    expect(header.kind).toBe("header");
    expect(header.keepWithNext).toBe(true);
  });

  it("uses data-item-body-block children to split an item body and drops the whole-body wrapper", () => {
    const c = makeContainer();
    const sec = makeEl(c, { "data-section": "experience" }, { top: 0, bottom: 600, height: 600 });
    const body = makeEl(sec, { "data-item-id": "exp-0-body" }, { top: 90, bottom: 600, height: 510 });
    makeEl(body, { "data-item-body-block": "", "data-item-id": "exp-0-b0" }, { top: 90, bottom: 300, height: 210 });
    makeEl(body, { "data-item-body-block": "", "data-item-id": "exp-0-b1" }, { top: 300, bottom: 600, height: 300 });

    const { units } = buildMeasuredUnits(c, 1062);
    const ids = units.map((u) => u.id);
    expect(ids).not.toContain("exp-0-body"); // replaced by blocks
    expect(ids).toContain("exp-0-b0");
    expect(ids).toContain("exp-0-b1");
    expect(units.find((u) => u.id === "exp-0-b0")!.kind).toBe("body-block");
  });

  it("keeps a leaf data-item-id (no sub-markers) as one item unit", () => {
    const c = makeContainer();
    const sec = makeEl(c, { "data-section": "skills" }, { top: 0, bottom: 200, height: 200 });
    makeEl(sec, { "data-item-id": "skill-bullet-0-0" }, { top: 0, bottom: 50, height: 50 });
    makeEl(sec, { "data-item-id": "skill-bullet-0-1" }, { top: 50, bottom: 100, height: 50 });

    const { units } = buildMeasuredUnits(c, 1062);
    expect(units.map((u) => u.id)).toEqual(["skill-bullet-0-0", "skill-bullet-0-1"]);
    expect(units[0].kind).toBe("item");
  });

  it("records the column from [data-resume-left-column]/[data-resume-right-column] ancestors", () => {
    const c = makeContainer();
    const left = makeEl(c, { "data-resume-left-column": "" }, { top: 0, bottom: 1000, height: 1000 });
    const right = makeEl(c, { "data-resume-right-column": "" }, { top: 0, bottom: 1000, height: 1000 });
    const lSec = makeEl(left, { "data-section": "skills" }, { top: 0, bottom: 100, height: 100 });
    const rSec = makeEl(right, { "data-section": "experience" }, { top: 0, bottom: 100, height: 100 });
    makeEl(lSec, { "data-item-id": "l-item" }, { top: 0, bottom: 80, height: 80 });
    makeEl(rSec, { "data-item-id": "r-item" }, { top: 0, bottom: 80, height: 80 });

    const { units } = buildMeasuredUnits(c, 1062);
    expect(units.find((u) => u.id === "l-item")!.column).toBe("left");
    expect(units.find((u) => u.id === "r-item")!.column).toBe("right");
  });

  it("flags atomic-if-fits units", () => {
    const c = makeContainer();
    const sec = makeEl(c, { "data-section": "projects" }, { top: 0, bottom: 300, height: 300 });
    makeEl(sec, { "data-item-id": "proj-0", "data-pagination-atomic-if-fits": "" }, { top: 0, bottom: 300, height: 300 });

    const { units } = buildMeasuredUnits(c, 1062);
    expect(units[0].atomicIfFits).toBe(true);
  });
});
