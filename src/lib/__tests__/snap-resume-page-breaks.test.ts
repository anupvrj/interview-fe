import { describe, expect, it } from "vitest";
import {
  cutSplitsTextLine,
  enforceLineSafePageBreaks,
  type TextLineBounds,
} from "../snap-resume-page-breaks";

const lines: TextLineBounds[] = [
  { top: 980, bottom: 996 },
  { top: 996, bottom: 1012 },
  { top: 1012, bottom: 1028 },
];

describe("cutSplitsTextLine", () => {
  it("detects a cut through the middle of a line", () => {
    expect(cutSplitsTextLine(1004, lines)).toBe(true);
  });

  it("allows cuts aligned with line edges", () => {
    expect(cutSplitsTextLine(996, lines)).toBe(false);
    expect(cutSplitsTextLine(1012, lines)).toBe(false);
  });
});

describe("enforceLineSafePageBreaks", () => {
  it("moves a mid-line cut to a line boundary", () => {
    const pages = [
      { pageNumber: 1, offsetY: 0, height: 1004 },
      { pageNumber: 2, offsetY: 1004, height: 500 },
    ];

    const fixed = enforceLineSafePageBreaks(pages, lines, 1504);

    for (const page of fixed.slice(0, -1)) {
      const cutY = page.offsetY + page.height;
      expect(cutSplitsTextLine(cutY, lines)).toBe(false);
    }
  });

  it("can change page count when a sliver page is merged away", () => {
    const pages = [
      { pageNumber: 1, offsetY: 0, height: 1000 },
      { pageNumber: 2, offsetY: 1000, height: 8 },
      { pageNumber: 3, offsetY: 1008, height: 492 },
    ];

    const fixed = enforceLineSafePageBreaks(pages, lines, 1500);
    expect(fixed.length).toBeGreaterThanOrEqual(2);

    for (const page of fixed.slice(0, -1)) {
      const cutY = page.offsetY + page.height;
      expect(cutSplitsTextLine(cutY, lines)).toBe(false);
    }
  });
});
