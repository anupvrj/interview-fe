import { describe, expect, it } from "vitest";
import { resolvePaginationStraddleColumn } from "../resolve-pagination-straddle-column";

function mockColumn(width: number): HTMLElement {
  const el = {
    getBoundingClientRect: () => ({
      width,
      height: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  } as HTMLElement;
  return el;
}

describe("resolvePaginationStraddleColumn", () => {
  it("returns the wider column", () => {
    const left = mockColumn(400);
    const right = mockColumn(600);
    const container = {
      querySelector: (sel: string) => {
        if (sel === "[data-resume-left-column]") return left;
        if (sel === "[data-resume-right-column]") return right;
        return null;
      },
    } as unknown as HTMLElement;

    expect(resolvePaginationStraddleColumn(container)).toBe(right);
  });

  it("returns null when column widths are equal", () => {
    const left = mockColumn(500);
    const right = mockColumn(500);
    const container = {
      querySelector: (sel: string) => {
        if (sel === "[data-resume-left-column]") return left;
        if (sel === "[data-resume-right-column]") return right;
        return null;
      },
    } as unknown as HTMLElement;

    expect(resolvePaginationStraddleColumn(container)).toBeNull();
  });
});
