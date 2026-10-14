import { describe, expect, it } from "vitest";
import { formatIst } from "../copy";

describe("formatIst", () => {
  it("formats a valid ISO instant", () => {
    expect(formatIst("2026-10-16T00:00:00.000Z")).toMatch(/IST$/);
  });

  it("returns em dash for invalid or partial datetimes", () => {
    expect(formatIst("2026-10-16T")).toBe("—");
    expect(formatIst("not-a-date")).toBe("—");
    expect(formatIst(null)).toBe("—");
  });
});
