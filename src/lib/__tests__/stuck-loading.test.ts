import { afterEach, describe, expect, it } from "vitest";
import { STUCK_AFTER_MS, resetStuckLoading, stuckLoadingLabels } from "../stuck-loading";

describe("stuck loading", () => {
  afterEach(() => resetStuckLoading());

  it("waits 65 s (60 s + time for the request's own timeout error)", () => {
    expect(STUCK_AFTER_MS).toBe(65_000);
  });

  it("nothing is stuck when nothing is loading", () => {
    expect(stuckLoadingLabels()).toEqual([]);
  });
});
