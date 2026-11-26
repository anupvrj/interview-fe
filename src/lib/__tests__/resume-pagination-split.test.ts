// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { buildMeasuredUnits } from "../resume-pagination/buildMeasuredUnits";
import { packUnitsIntoPages } from "../resume-pagination/packUnitsIntoPages";
import { applyPageVisibility } from "../resume-pagination/applyPageVisibility";
import { collectBlocks, orphanGlue, parseBlockUnitId } from "../resume-pagination/splitBlocks";

type Box = { top: number; height: number; left?: number };

/** Element with a fixed layout box (jsdom has no layout). */
function el(parent: HTMLElement, tag: string, box: Box, attrs: Record<string, string> = {}, text?: string): HTMLElement {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text) node.textContent = text;
  const left = box.left ?? 0;
  node.getBoundingClientRect = () => ({
    top: box.top, bottom: box.top + box.height, height: box.height,
    left, right: left + 100, width: 100, x: left, y: box.top, toJSON: () => ({}),
  });
  parent.appendChild(node);
  return node;
}

function container(): HTMLElement {
  const c = document.createElement("div");
  c.getBoundingClientRect = () => ({ top: 0, bottom: 5000, height: 5000, left: 0, right: 800, width: 800, x: 0, y: 0, toJSON: () => ({}) });
  return c;
}

/** An experience entry: header + a body whose list has `n` bullets of `lineH` px each. */
function experience(c: HTMLElement, top: number, n: number, lineH = 40) {
  const sec = el(c, "div", { top, height: 40 + 30 + n * lineH }, { "data-section": "experience" });
  el(sec, "div", { top, height: 40 }, { "data-section-header": "", "data-section-id": "experience" });
  const item = el(sec, "div", { top: top + 40, height: 30 + n * lineH }, { "data-item-id": "exp-0" });
  el(item, "div", { top: top + 40, height: 30 }, { "data-item-id": "exp-0-header" }, "Senior Engineer");
  const body = el(item, "div", { top: top + 70, height: n * lineH }, { "data-item-id": "exp-0-body" });
  const ul = el(body, "ul", { top: top + 70, height: n * lineH });
  for (let i = 0; i < n; i++) el(ul, "li", { top: top + 70 + i * lineH, height: lineH }, {}, `Bullet ${i + 1}`);
  return { sec, body };
}

describe("splitting tall units into lines", () => {
  it("splits a job's bullet list so a page can break between bullets", () => {
    const c = container();
    experience(c, 0, 5);
    const { units } = buildMeasuredUnits(c, 1000);
    const lines = units.filter((u) => u.kind === "body-block");
    expect(lines.map((u) => u.id)).toEqual([0, 1, 2, 3, 4].map((i) => `exp-0-body::0.${i}`));
    // title glues to bullet 1 (via the header unit), bullet 1 to bullet 2; the last two stay together
    expect(lines.map((u) => u.keepWithNext)).toEqual([true, false, false, true, false]);
    expect(units.some((u) => u.id === "exp-0-body")).toBe(false);
  });

  it("fills the first page instead of moving the whole job (the reported bug)", () => {
    const c = container();
    experience(c, 0, 20); // 40 + 30 + 800 = 870px of content
    const { units } = buildMeasuredUnits(c, 1000);
    // only 400px left on the page: before the fix the whole entry went to page 2
    const pages = packUnitsIntoPages(units, 400);
    expect(pages[0].unitIds).toContain("exp-0-header");
    expect(pages[0].unitIds.filter((id) => id.includes("::")).length).toBeGreaterThanOrEqual(7);
    const all = pages.flatMap((p) => p.unitIds).filter((id) => id.includes("::"));
    expect(new Set(all).size).toBe(20); // every bullet exactly once
  });

  it("never leaves the title alone or the last bullet alone on a page", () => {
    const c = container();
    const intro = el(c, "div", { top: 0, height: 100 }, { "data-section": "summary" });
    el(intro, "div", { top: 0, height: 100 }, { "data-item-id": "sum-0" }, "Summary");
    experience(c, 100, 6);
    const { units } = buildMeasuredUnits(c, 1000);
    // room for the section header + title + 1 bullet only: the title must move with two bullets
    const pages = packUnitsIntoPages(units, 100 + 40 + 30 + 40 + 10);
    expect(pages[0].unitIds).toEqual(["sum-0"]);
    const last = pages[pages.length - 1].unitIds;
    expect(last.length === 0 || last.length >= 2).toBe(true);
  });

  it("keeps rows and grids whole (children side by side)", () => {
    const c = container();
    const row = el(c, "div", { top: 0, height: 40 });
    el(row, "div", { top: 0, height: 40, left: 0 }, {}, "left");
    el(row, "div", { top: 0, height: 40, left: 200 }, {}, "right");
    expect(collectBlocks(row)).toEqual([row]);
  });

  it("splits a timeline row (date | details): the details break, the date goes with the first line", () => {
    const c = container();
    const sec = el(c, "div", { top: 0, height: 400 }, { "data-section": "experience" });
    const item = el(sec, "div", { top: 0, height: 400 }, { "data-item-id": "exp-0" });
    const date = el(item, "div", { top: 0, height: 400, left: 0 }); // stretched to the row
    el(date, "span", { top: 0, height: 14, left: 0 }, {}, "2020 – 2024");
    const details = el(item, "div", { top: 0, height: 400, left: 120 });
    el(details, "div", { top: 0, height: 20, left: 120 }, {}, "Engineer");
    const ul = el(details, "ul", { top: 20, height: 380, left: 120 });
    for (let i = 0; i < 10; i++) el(ul, "li", { top: 20 + i * 38, height: 38, left: 120 }, {}, `B${i}`);
    const { units } = buildMeasuredUnits(c, 1000);
    const lines = units.filter((u) => u.kind === "body-block");
    expect(lines).toHaveLength(11);
    expect(lines[0].id).toBe("exp-0::1.0+0"); // title line + the date column
    expect(lines[0].height).toBe(20); // measured by the line, not the stretched column

    const root = container();
    const r = el(root, "div", { top: 0, height: 400 }, { "data-section": "experience" });
    const rItem = el(r, "div", { top: 0, height: 400 }, { "data-item-id": "exp-0" });
    const rDate = el(rItem, "div", { top: 0, height: 400 });
    el(rDate, "span", { top: 0, height: 14 }, {}, "2020 – 2024");
    const rDetails = el(rItem, "div", { top: 0, height: 400, left: 120 });
    el(rDetails, "div", { top: 0, height: 20 }, {}, "Engineer");
    const rUl = el(rDetails, "ul", { top: 20, height: 380 });
    for (let i = 0; i < 10; i++) el(rUl, "li", { top: 20 + i * 38, height: 38 }, {}, `B${i}`);
    // continuation page: lines 6.. only -> the date column is hidden (no repeated date)
    applyPageVisibility(root, new Set(units.map((u) => u.id)), new Set(lines.slice(6).map((u) => u.id)));
    expect(rDate.style.visibility).toBe("hidden"); // blank, but keeps its grid track
    expect(rDate.style.display).toBe("");
  });

  it("an entry with a marked title but unmarked details moves as one, not chained to the next entry", () => {
    const c = container();
    const sec = el(c, "div", { top: 0, height: 230 }, { "data-section": "education" });
    el(sec, "div", { top: 0, height: 30 }, { "data-section-header": "", "data-section-id": "education" });
    for (let i = 0; i < 2; i++) {
      const top = 30 + i * 100;
      const wrap = el(sec, "div", { top, height: 90 }, { "data-item-index": String(i) });
      el(wrap, "div", { top, height: 40 }, { "data-item-id": `edu-${i}-header` }, `Degree ${i}`);
      el(wrap, "div", { top: top + 40, height: 50 }, {}, `School ${i}`);
    }
    const { units } = buildMeasuredUnits(c, 1000);
    const entries = units.filter((u) => u.sectionId === "education" && u.id !== "education");
    expect(entries.map((u) => u.id)).toEqual(["edu-0-header^::", "edu-1-header^::"]);
    expect(entries.every((u) => !u.keepWithNext)).toBe(true);
    expect(entries[0].height).toBe(90); // title + school

    const root = container();
    const rSec = el(root, "div", { top: 0, height: 230 }, { "data-section": "education" });
    el(rSec, "div", { top: 0, height: 30 }, { "data-section-header": "", "data-section-id": "education" });
    const wraps = [0, 1].map((i) => {
      const w = el(rSec, "div", { top: 30 + i * 100, height: 90 });
      el(w, "div", { top: 30 + i * 100, height: 40 }, { "data-item-id": `edu-${i}-header` }, `Degree ${i}`);
      el(w, "div", { top: 70 + i * 100, height: 50 }, {}, `School ${i}`);
      return w;
    });
    applyPageVisibility(root, new Set(units.map((u) => u.id)), new Set(["education", "edu-0-header^::"]));
    expect(wraps[0].style.display).toBe("");
    expect(wraps[1].style.display).toBe("none"); // school line hidden with its title
  });

  it("keeps a wrapper whole when it holds loose text (it would repeat on every page)", () => {
    const c = container();
    const box = el(c, "div", { top: 0, height: 80 });
    box.appendChild(document.createTextNode("Loose text "));
    el(box, "div", { top: 20, height: 30 }, {}, "a");
    el(box, "div", { top: 50, height: 30 }, {}, "b");
    expect(collectBlocks(box)).toEqual([box]);
  });

  it("leaves small whole entries (no header marker) in one piece", () => {
    const c = container();
    const sec = el(c, "div", { top: 0, height: 100 }, { "data-section": "education" });
    el(sec, "div", { top: 0, height: 30 }, { "data-section-header": "", "data-section-id": "education" });
    const item = el(sec, "div", { top: 30, height: 70 }, { "data-item-id": "edu-0" });
    el(item, "div", { top: 30, height: 30 }, {}, "Degree");
    el(item, "div", { top: 60, height: 40 }, {}, "School");
    const { units } = buildMeasuredUnits(c, 1000);
    expect(units.map((u) => u.id)).toContain("edu-0");
    expect(units.some((u) => u.kind === "body-block")).toBe(false);
  });

  it("splits a long free-text section (no item markers) after its header", () => {
    const c = container();
    const sec = el(c, "div", { top: 0, height: 40 + 4 * 50 }, { "data-section": "custom-1" });
    const header = el(sec, "div", { top: 0, height: 40 }, { "data-section-header": "", "data-section-id": "custom-1" });
    const body = el(sec, "div", { top: 40, height: 200 });
    for (let i = 0; i < 4; i++) el(body, "p", { top: 40 + i * 50, height: 50 }, {}, `Para ${i}`);
    const { units } = buildMeasuredUnits(c, 1000);
    const head = units.find((u) => u.id === "custom-1")!;
    expect(head.keepWithNext).toBe(true);
    expect(head.bottom).toBe(40); // not stretched over the body any more
    expect(units.filter((u) => u.kind === "body-block").map((u) => parseBlockUnitId(u.id)?.anchorKey)).toEqual(
      Array(4).fill("section:custom-1"),
    );
    expect(header).toBeTruthy();
  });

  it("orphan glue: title keeps two lines; the last line never sits alone", () => {
    expect(orphanGlue(2, 1)).toEqual([true, false]);
    expect(orphanGlue(3, 1)).toEqual([true, false, false]);
    expect(orphanGlue(5, 2)).toEqual([true, true, false, true, false]);
  });
});

describe("showing a split job on two pages", () => {
  it("finds a free-text section's lines inside nested wrappers with the same section id", () => {
    const build = (c: HTMLElement) => {
      const outer = el(c, "div", { top: 0, height: 240 }, { "data-section": "custom-1" });
      const inner = el(outer, "div", { top: 0, height: 240 }, { "data-section": "custom-1" });
      el(inner, "h2", { top: 0, height: 40 }, { "data-section-header": "", "data-section-id": "custom-1" }, "Notes");
      const body = el(inner, "div", { top: 40, height: 200 });
      return [0, 1, 2, 3].map((i) => el(body, "p", { top: 40 + i * 50, height: 50 }, {}, `Para ${i}`));
    };
    const measure = container();
    build(measure);
    const { units } = buildMeasuredUnits(measure, 1000);
    const lines = units.filter((u) => u.kind === "body-block");
    const root = container();
    const paras = build(root);
    applyPageVisibility(root, new Set(units.map((u) => u.id)), new Set(lines.slice(2).map((u) => u.id)));
    expect(paras.map((p) => p.style.display)).toEqual(["none", "none", "", ""]);
  });

  it("each page shows only its own bullets, and every bullet shows exactly once", () => {
    const measure = container();
    experience(measure, 0, 6);
    const { units } = buildMeasuredUnits(measure, 1000);
    const all = new Set(units.map((u) => u.id));
    const page1 = units.slice(0, 5).map((u) => u.id); // section header, title, bullets 1–3
    const page2 = units.slice(5).map((u) => u.id);

    const shown: string[] = [];
    for (const ids of [page1, page2]) {
      const root = container();
      experience(root, 0, 6);
      applyPageVisibility(root, all, new Set(ids));
      for (const li of Array.from(root.querySelectorAll("li"))) {
        if ((li as HTMLElement).style.display !== "none") shown.push(li.textContent ?? "");
      }
    }
    expect(shown).toEqual(["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4", "Bullet 5", "Bullet 6"]);
  });

  it("hides the whole body on a page that has none of its bullets", () => {
    const measure = container();
    experience(measure, 0, 4);
    const { units } = buildMeasuredUnits(measure, 1000);
    const root = container();
    const { body } = experience(root, 0, 4);
    applyPageVisibility(root, new Set(units.map((u) => u.id)), new Set(["experience", "exp-0-header"]));
    expect(body.style.display).toBe("none");
  });

  it("undoes the previous page pass before applying a new one (pages are reused)", () => {
    const measure = container();
    experience(measure, 0, 4);
    const { units } = buildMeasuredUnits(measure, 1000);
    const all = new Set(units.map((u) => u.id));
    const root = container();
    experience(root, 0, 4);
    applyPageVisibility(root, all, new Set(["experience", "exp-0-header", "exp-0-body::0.0", "exp-0-body::0.1"]));
    applyPageVisibility(root, all, all);
    expect(Array.from(root.querySelectorAll("li")).every((li) => (li as HTMLElement).style.display !== "none")).toBe(true);
  });
});
