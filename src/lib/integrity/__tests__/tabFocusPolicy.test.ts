import { describe, expect, it } from "vitest";
import { shouldEmitTabBlur } from "../tabFocusPolicy";

describe("shouldEmitTabBlur", () => {
  it("ignores short blurs and picker/dialog windows", () => {
    expect(
      shouldEmitTabBlur(800, { displayPickerOpen: false, dialogOpen: false }),
    ).toBe(false);
    expect(
      shouldEmitTabBlur(4000, { displayPickerOpen: true, dialogOpen: false }),
    ).toBe(false);
    expect(
      shouldEmitTabBlur(4000, { displayPickerOpen: false, dialogOpen: true }),
    ).toBe(false);
  });

  it("emits after 1.5s when the candidate actually left", () => {
    expect(
      shouldEmitTabBlur(1600, { displayPickerOpen: false, dialogOpen: false }),
    ).toBe(true);
  });
});
