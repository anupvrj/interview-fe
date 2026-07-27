import { describe, expect, it } from "vitest";
import { packUnitsIntoPages } from "../resume-pagination/packUnitsIntoPages";
import type { MeasuredUnit } from "../resume-pagination/buildMeasuredUnits";

function unit(
  partial: Partial<MeasuredUnit> & Pick<MeasuredUnit, "id" | "top" | "bottom" | "height" | "kind">,
): MeasuredUnit {
  return { sectionId: "s", column: "single", keepWithNext: false, ...partial };
}

const ids = (pages: { unitIds: string[] }[]) => pages.map((p) => p.unitIds);

describe("packUnitsIntoPages", () => {
  it("packs whole units into a single page when they fit", () => {
    const units: MeasuredUnit[] = [
      unit({ id: "h", kind: "header", top: 0, bottom: 40, height: 40, keepWithNext: true }),
      unit({ id: "i1", kind: "item", top: 40, bottom: 240, height: 200 }),
      unit({ id: "i2", kind: "item", top: 240, bottom: 440, height: 200 }),
    ];
    expect(ids(packUnitsIntoPages(units, 1000))).toEqual([["h", "i1", "i2"]]);
  });

  it("starts a new page at a unit boundary when the next unit would overflow", () => {
    const units: MeasuredUnit[] = [
      unit({ id: "i1", kind: "item", top: 0, bottom: 600, height: 600 }),
      unit({ id: "i2", kind: "item", top: 600, bottom: 1200, height: 600 }),
      unit({ id: "i3", kind: "item", top: 1200, bottom: 1400, height: 200 }),
    ];
    expect(ids(packUnitsIntoPages(units, 1000))).toEqual([["i1"], ["i2", "i3"]]);
  });

  it("keeps a keepWithNext header glued to its first body unit", () => {
    const units: MeasuredUnit[] = [
      unit({ id: "i1", kind: "item", top: 0, bottom: 950, height: 950 }),
      unit({ id: "sec", kind: "header", top: 950, bottom: 990, height: 40, keepWithNext: true }),
      unit({ id: "i2h", kind: "header", top: 990, bottom: 1030, height: 40, keepWithNext: true }),
      unit({ id: "i2b", kind: "item", top: 1030, bottom: 1200, height: 170 }),
    ];
    expect(ids(packUnitsIntoPages(units, 1000))).toEqual([["i1"], ["sec", "i2h", "i2b"]]);
  });

  it("places an oversized unit alone on a page via isOnEmptyPage", () => {
    const units: MeasuredUnit[] = [
      unit({ id: "i1", kind: "item", top: 0, bottom: 300, height: 300 }),
      unit({ id: "big", kind: "item", top: 300, bottom: 1600, height: 1300 }),
      unit({ id: "i3", kind: "item", top: 1600, bottom: 1800, height: 200 }),
    ];
    expect(ids(packUnitsIntoPages(units, 1000))).toEqual([["i1"], ["big"], ["i3"]]);
  });

  it("packs by Y-span (including inter-unit gaps), not sum of heights — prevents bottom clipping", () => {
    const units: MeasuredUnit[] = [
      unit({ id: "i1", kind: "item", top: 0, bottom: 400, height: 400 }),
      unit({ id: "i2", kind: "item", top: 600, bottom: 1100, height: 500 }),
    ];
    expect(ids(packUnitsIntoPages(units, 1000))).toEqual([["i1"], ["i2"]]);
  });

  it("does not split when units span exactly the budget", () => {
    const units: MeasuredUnit[] = [
      unit({ id: "i1", kind: "item", top: 0, bottom: 500, height: 500 }),
      unit({ id: "i2", kind: "item", top: 500, bottom: 1000, height: 500 }),
    ];
    expect(ids(packUnitsIntoPages(units, 1000))).toEqual([["i1", "i2"]]);
  });

  it("returns one blank page when there are no units", () => {
    expect(packUnitsIntoPages([], 1000)).toEqual([
      { pageNumber: 1, unitIds: [], offsetY: 0, height: 0 },
    ]);
  });
});
