import { describe, expect, it } from "vitest";
import {
  computePageBands,
  fixOrphanSemanticBoxes,
  runResumePagination,
  type PaginationElementInput,
} from "../resume-pagination-engine";

function el(
  partial: Partial<PaginationElementInput> &
    Pick<PaginationElementInput, "top" | "bottom" | "height" | "kind">,
): PaginationElementInput {
  return {
    hasMeaningfulContent: true,
    useForStraddlingRules: true,
    ...partial,
  };
}

describe("computePageBands", () => {
  it("does not set safeEndY to el.top when el.top < currentY (continuation)", () => {
    const fullHeight = 4000;
    const elements: PaginationElementInput[] = [
      el({
        kind: "item",
        top: 100,
        bottom: 3500,
        height: 3400,
      }),
    ];
    const pages = computePageBands(fullHeight, elements, 1000);
    const first = pages[0];
    expect(first.offsetY).toBe(0);
    expect(first.height).toBe(1000);
    expect(pages[1]?.offsetY).toBe(1000);
  });

  it("breaks before header when only a sliver would be visible at cut", () => {
    const fullHeight = 2000;
    const elements: PaginationElementInput[] = [
      el({
        kind: "header",
        top: 930,
        bottom: 1020,
        height: 90,
      }),
    ];
    const pages = computePageBands(fullHeight, elements, 1000);
    expect(pages[0].height).toBe(930);
    expect(pages[1].offsetY).toBe(930);
  });

  it("breaks before item when visible slice is below minimum (starts on page)", () => {
    const fullHeight = 2000;
    const elements: PaginationElementInput[] = [
      el({
        kind: "item",
        top: 900,
        bottom: 2000,
        height: 200,
      }),
    ];
    const pages = computePageBands(fullHeight, elements, 1000);
    expect(pages[0].height).toBe(900);
  });
});

describe("fixOrphanSemanticBoxes", () => {
  it("pulls page start back when a box sits in a gap between bands", () => {
    const pages = [
      { pageNumber: 1, offsetY: 0, height: 2400 },
      { pageNumber: 2, offsetY: 2500, height: 500 },
    ];
    const box = { top: 2450, bottom: 2480 };
    const fixed = fixOrphanSemanticBoxes(pages, [box]);
    expect(fixed[1].offsetY).toBe(2450);
    expect(fixed[0].height).toBe(2450);
  });
});

describe("two-column straddling (useForStraddlingRules)", () => {
  it("ignores right-column elements so they do not shorten the page band", () => {
    const fullHeight = 2000;
    const elements: PaginationElementInput[] = [
      el({
        kind: "item",
        top: 400,
        bottom: 1200,
        height: 800,
        useForStraddlingRules: false,
      }),
    ];
    const pages = computePageBands(fullHeight, elements, 1000);
    expect(pages[0].height).toBe(1000);
  });
});

describe("atomic-if-fits (project cards)", () => {
  it("moves the whole block to the next page when it fits on one page but would straddle the cut", () => {
    const fullHeight = 3000;
    const elements: PaginationElementInput[] = [
      el({ kind: "header", top: 0, bottom: 30, height: 30 }),
      el({
        kind: "item",
        top: 50,
        bottom: 750,
        height: 700,
      }),
    ];
    const atomic = [{ top: 800, bottom: 1500 }];
    const pages = computePageBands(fullHeight, elements, 1000, atomic);
    expect(pages[0].height).toBe(800);
    expect(pages[1].offsetY).toBe(800);
  });
});

describe("runResumePagination", () => {
  it("produces contiguous bands that cover full document height", () => {
    const fullHeight = 2500;
    const elements: PaginationElementInput[] = [
      el({ kind: "header", top: 0, bottom: 40, height: 40 }),
      el({ kind: "item", top: 50, bottom: 2400, height: 2350 }),
    ];
    const pages = runResumePagination(fullHeight, elements, 900);
    let y = 0;
    for (const p of pages) {
      expect(p.offsetY).toBe(y);
      y += p.height;
    }
    expect(y).toBeGreaterThanOrEqual(fullHeight - 5);
  });
});
