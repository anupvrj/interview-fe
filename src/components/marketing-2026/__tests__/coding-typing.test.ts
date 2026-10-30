import { describe, expect, it } from "vitest";
import { CODING_DEMO_CODE, typedAt } from "../coding-typing";

describe("typedAt", () => {
  it("returns 0 at start and full length at t=1", () => {
    expect(typedAt(0)).toBe(0);
    expect(typedAt(1)).toBe(CODING_DEMO_CODE.length);
  });

  it("is monotonic in t", () => {
    let prev = 0;
    for (let t = 0; t <= 1; t += 0.05) {
      const n = typedAt(t);
      expect(n).toBeGreaterThanOrEqual(prev);
      prev = n;
    }
  });
});
