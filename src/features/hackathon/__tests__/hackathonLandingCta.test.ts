import { describe, expect, it } from "vitest";
import { resolveHackathonLandingCta } from "../hackathonLandingCta";
import type { HackathonPublic } from "../api";

const basePub = {
  phase: "upcoming",
  isFull: false,
  spotsLeft: 50,
} as Pick<HackathonPublic, "phase" | "isFull" | "spotsLeft">;

describe("resolveHackathonLandingCta", () => {
  it("signed out: Register for new browsers, Go to Challenge for returning ones", () => {
    const pub = basePub as HackathonPublic;
    expect(resolveHackathonLandingCta(pub, false, false).labelKey).toBe("register");
    expect(resolveHackathonLandingCta(pub, false, false, true).labelKey).toBe("goToChallenges");
    expect(resolveHackathonLandingCta(undefined, false, false, true).labelKey).toBe("goToChallenges");
    // A full event doesn't lock out someone who already joined.
    expect(resolveHackathonLandingCta({ ...basePub, isFull: true } as HackathonPublic, false, false, true)).toMatchObject({ labelKey: "goToChallenges", disabled: false });
  });

  it("signed in: the real registration wins over the browser key", () => {
    expect(resolveHackathonLandingCta(basePub as HackathonPublic, true, false, true).labelKey).toBe("register");
  });

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
