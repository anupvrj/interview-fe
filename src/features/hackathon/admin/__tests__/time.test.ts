import { describe, expect, it } from "vitest";
import { combineIstInput, istDateAndTimeToIso, isoToIstInput, splitIstInput } from "../time";

describe("hackathon IST time helpers", () => {
  it("round-trips Oct 16 2026 midnight IST", () => {
    const iso = istDateAndTimeToIso("2026-10-16", "00:00");
    expect(iso).toBeTruthy();
    expect(isoToIstInput(iso!)).toBe("2026-10-16T00:00");
  });

  it("combines and splits input", () => {
    expect(combineIstInput("2026-10-16", "12:30")).toBe("2026-10-16T12:30");
    expect(splitIstInput("2026-10-16T12:30")).toEqual({ date: "2026-10-16", time: "12:30" });
  });

  it("keeps partial date-only state while time is empty", () => {
    expect(combineIstInput("2026-10-16", "")).toBe("2026-10-16T");
    expect(splitIstInput("2026-10-16T")).toEqual({ date: "2026-10-16", time: "" });
    expect(istDateAndTimeToIso("2026-10-16", "")).toBeNull();
  });
});
