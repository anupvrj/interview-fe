import { describe, expect, it } from "vitest";
import { resolveIntegrityStatus } from "../resolveIntegrityStatus";

describe("resolveIntegrityStatus", () => {
  it("treats a missing report as missing", () => {
    expect(resolveIntegrityStatus(undefined)).toBe("missing");
    expect(resolveIntegrityStatus(null)).toBe("missing");
  });

  it("keeps an explicit status", () => {
    expect(resolveIntegrityStatus({ integrityStatus: "scored" })).toBe("scored");
    expect(resolveIntegrityStatus({ integrityStatus: "processing" })).toBe(
      "processing",
    );
    expect(
      resolveIntegrityStatus({
        integrityStatus: "missing",
        eventCount: 4,
        deductedPoints: 25,
      }),
    ).toBe("missing");
  });

  it("does not treat a legacy empty 100 as verified", () => {
    expect(
      resolveIntegrityStatus({
        eventCount: 0,
        deductedPoints: 0,
        timeline: [],
      }),
    ).toBe("missing");
  });

  it("treats a legacy report with flags as scored", () => {
    expect(
      resolveIntegrityStatus({
        eventCount: 4,
        deductedPoints: 25,
        timeline: [{ type: "MULTIPLE_FACES_DETECTED" }],
      }),
    ).toBe("scored");
  });
});
