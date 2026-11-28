import { describe, expect, it } from "vitest";
import { selectionInLine, spliceSelection } from "../aiSelection";

const LINE = "Led 12 product launches, growing qualified leads by 38% in a year.";

describe("selectionInLine", () => {
  it("finds the selected span in the normalised line", () => {
    expect(selectionInLine(`  ${LINE}`, "  Led 12 product launches, ", "growing qualified leads")).toEqual({
      text: "growing qualified leads",
      start: 25,
    });
  });
  it("treats no selection or the whole line as the whole line", () => {
    expect(selectionInLine(LINE, "", "")).toBeNull();
    expect(selectionInLine(LINE, "", ` ${LINE} `)).toBeNull();
  });
  it("picks the copy nearest the caret when the words repeat", () => {
    const line = "Built tools and built teams";
    expect(selectionInLine(line, "Built tools and ", "built")).toEqual({ text: "built", start: 16 });
  });
});

describe("spliceSelection", () => {
  it("puts the new words in place of the span only", () => {
    const sel = { text: "growing qualified leads", start: 25 };
    expect(spliceSelection(LINE, sel, "Doubling sales-qualified pipeline.")).toEqual({
      text: "Led 12 product launches, doubling sales-qualified pipeline by 38% in a year.",
      selection: { text: "doubling sales-qualified pipeline", start: 25 },
    });
  });
  it("keeps acronyms and leading capitals", () => {
    const sel = { text: "Led 12 product launches", start: 0 };
    expect(spliceSelection(LINE, sel, "Shipped 12 SaaS launches.")?.text).toBe(
      "Shipped 12 SaaS launches, growing qualified leads by 38% in a year.",
    );
    const mid = { text: "product launches", start: 7 };
    expect(spliceSelection(LINE, mid, "SaaS releases")?.text).toContain("Led 12 SaaS releases,");
  });
  it("returns null when the span has gone", () => {
    expect(spliceSelection("Something else", { text: "growing", start: 3 }, "x")).toBeNull();
    expect(spliceSelection(LINE, { text: "growing", start: 25 }, "   ")).toBeNull();
  });
});
