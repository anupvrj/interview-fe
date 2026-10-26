import { describe, expect, it } from "vitest";
import { resolveHackathonLandingCta } from "../hackathonLandingCta";
import type { HackathonPublic } from "../api";

const basePub = {
  phase: "upcoming",
  isFull: false,
  spotsLeft: 50,
  registrationOpen: true,
} as Pick<HackathonPublic, "phase" | "isFull" | "spotsLeft" | "registrationOpen">;

describe("resolveHackathonLandingCta", () => {
  it("signed out: Register for new browsers, Go to Challenge for returning ones", () => {
    const pub = basePub as HackathonPublic;
    expect(resolveHackathonLandingCta(pub, false, false).labelKey).toBe("register");
    expect(resolveHackathonLandingCta(pub, false, false, true).labelKey).toBe("goToChallenges");
    expect(resolveHackathonLandingCta(undefined, false, false, true).labelKey).toBe("goToChallenges");
    expect(resolveHackathonLandingCta({ ...basePub, isFull: true } as HackathonPublic, false, false, true)).toMatchObject({
      labelKey: "goToChallenges",
      disabled: false,
    });
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

  it("shows Register for Event when registration is off or the hackathon ended", () => {
    const open = { ...basePub, slug: "hiring-games-hackathon-2026" } as HackathonPublic;
    expect(resolveHackathonLandingCta(open, true, false).labelKey).toBe("register");

    const closed = { ...open, registrationOpen: false } as HackathonPublic;
    expect(resolveHackathonLandingCta(closed, true, false).labelKey).toBe("registerForEvent");
    expect(resolveHackathonLandingCta(closed, false, false).labelKey).toBe("registerForEvent");
    expect(resolveHackathonLandingCta(closed, true, true).labelKey).toBe("goToChallenges");

    const ended = { ...open, phase: "ended" as const } as HackathonPublic;
    expect(resolveHackathonLandingCta(ended, true, false).labelKey).toBe("registerForEvent");
    expect(resolveHackathonLandingCta(ended, true, true).labelKey).toBe("seeResults");
  });

  it("defaults to register while public data is loading", () => {
    expect(resolveHackathonLandingCta(undefined, true, false).labelKey).toBe("register");
    expect(resolveHackathonLandingCta(undefined, false, false).labelKey).toBe("register");
  });

  it("shows Register for Event for returning browsers when hackathon signup is closed", () => {
    const closed = {
      ...basePub,
      registrationOpen: false,
    } as HackathonPublic;
    expect(resolveHackathonLandingCta(closed, false, false, true).labelKey).toBe("registerForEvent");
  });
});
