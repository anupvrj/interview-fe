import { describe, expect, it } from "vitest";
import { detectBurstInsertion, monacoSourceFromFlags } from "../burstDetector";

describe("detectBurstInsertion", () => {
  it("ignores IME, autocomplete, undo, and format", () => {
    for (const source of ["ime", "autocomplete", "undo", "redo", "format", "flush", "snippet"] as const) {
      expect(
        detectBurstInsertion({
          insertedText: "function hello() {",
          deltaMs: 1,
          matchingKeydowns: 0,
          source,
        }).isBurst,
      ).toBe(false);
    }
  });

  it("flags raw injection of >5 chars in <10ms with no keydowns", () => {
    expect(
      detectBurstInsertion({
        insertedText: "abcdef",
        deltaMs: 4,
        matchingKeydowns: 0,
        source: "unknown",
      }),
    ).toEqual({ isBurst: true, deltaMs: 4, charCount: 6 });
  });

  it("does not flag short inserts or keyed typing", () => {
    expect(
      detectBurstInsertion({
        insertedText: "abcd",
        deltaMs: 1,
        matchingKeydowns: 0,
        source: "keyboard",
      }).isBurst,
    ).toBe(false);
    expect(
      detectBurstInsertion({
        insertedText: "abcdef",
        deltaMs: 4,
        matchingKeydowns: 6,
        source: "keyboard",
      }).isBurst,
    ).toBe(false);
  });

  it("maps monaco flags", () => {
    expect(monacoSourceFromFlags({ composing: true })).toBe("ime");
    expect(monacoSourceFromFlags({ isUndoing: true })).toBe("undo");
    expect(monacoSourceFromFlags({ isFlushing: true })).toBe("flush");
  });
});
