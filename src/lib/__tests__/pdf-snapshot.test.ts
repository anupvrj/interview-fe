import { describe, expect, it } from "vitest";
import { lineBoxes } from "../pdf-snapshot";

const item = (str: string, x: number, y: number, width = 100) => ({ str, width, height: 10, transform: [1, 0, 0, 1, x, y] });

describe("lineBoxes", () => {
  it("joins text on the same line, top of the page first", () => {
    const boxes = lineBoxes([item("Below", 50, 500), item("Name", 50, 700, 50), item("Title", 120, 700, 50)], 600, 800);
    expect(boxes).toHaveLength(2);
    expect(boxes[0].top).toBeLessThan(boxes[1].top);
    expect(boxes[0].left).toBeCloseTo(50 / 600);
    expect(boxes[0].width).toBeCloseTo(120 / 600);
  });

  it("ignores blank text", () => {
    expect(lineBoxes([item("   ", 50, 500)], 600, 800)).toEqual([]);
  });
});
