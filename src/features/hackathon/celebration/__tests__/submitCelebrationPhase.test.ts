import { describe, expect, it } from "vitest";
import type { SubmitCelebrationPhase } from "../useHackathonSubmitCelebration";

export function showSubmitOverlay(phase: SubmitCelebrationPhase): boolean {
  return phase === "submitting" || phase === "celebrating";
}

export function isCelebrationModalOpen(phase: SubmitCelebrationPhase): boolean {
  return phase === "modalOpen";
}

describe("submit celebration phase helpers", () => {
  it("shows overlay while submitting or celebrating", () => {
    expect(showSubmitOverlay("idle")).toBe(false);
    expect(showSubmitOverlay("submitting")).toBe(true);
    expect(showSubmitOverlay("celebrating")).toBe(true);
    expect(showSubmitOverlay("modalOpen")).toBe(false);
  });

  it("opens modal only in modalOpen phase", () => {
    expect(isCelebrationModalOpen("modalOpen")).toBe(true);
    expect(isCelebrationModalOpen("celebrating")).toBe(false);
  });
});
