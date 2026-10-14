import { describe, expect, it } from "vitest";
import { resolveHackathonLandingCta } from "../hackathonLandingCta";
import type { HackathonPublic } from "../api";

const basePub = {
  phase: "upcoming",
  isFull: false,
  spotsLeft: 50,
} as Pick<HackathonPublic, "phase" | "isFull" | "spotsLeft">;

describe("resolveHackathonLandingCta", () => {
  it("shows register for signed-in users who are not registered", () => {
    expect(resolveHackathonLandingCta(basePub as HackathonPublic, true, false).labelKey).toBe("register");
  });

  it("shows Go to Challenge for signed-in registered users before live", () => {
    expect(resolveHackathonLandingCta(basePub as HackathonPublic, true, true).labelKey).toBe("goToChallenges");
  });

  it("shows register after admin removal (signed in, not registered)", () => {
    const live = { ...basePub, phase: "live" as const };
    expect(resolveHackathonLandingCta(live as HackathonPublic, true, false).labelKey).toBe("register");
    expect(resolveHackathonLandingCta(live as HackathonPublic, true, true).labelKey).toBe("goToChallenges");
  });

  it("shows full when event is full and user is not registered", () => {
    const full = { ...basePub, isFull: true };
    const cta = resolveHackathonLandingCta(full as HackathonPublic, true, false);
    expect(cta.labelKey).toBe("full");
    expect(cta.disabled).toBe(true);
  });
});
