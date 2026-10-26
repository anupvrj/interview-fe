import { describe, expect, it } from "vitest";
import { isHackathonRegistered, isHackathonSignupClosedForNewParticipants } from "../hackathonRegistration";
import { HACKATHON_SLUG } from "../config";
import type { HackathonMe } from "../api";

const base = {
  registered: true,
  participant: {
    participantId: "hkp_1",
    status: "registered" as const,
    registeredAt: "2026-01-01T00:00:00.000Z",
    completedAt: null,
  },
} as Pick<HackathonMe, "registered" | "participant">;

describe("isHackathonRegistered", () => {
  it("is false when registered flag is true but participant is missing", () => {
    expect(isHackathonRegistered({ ...base, participant: null } as HackathonMe)).toBe(false);
  });

  it("is false for withdrawn status", () => {
    expect(
      isHackathonRegistered({
        ...base,
        participant: { ...base.participant!, status: "withdrawn" },
      } as HackathonMe),
    ).toBe(false);
  });

  it("is true for active registered participant", () => {
    expect(isHackathonRegistered(base as HackathonMe)).toBe(true);
  });
});

describe("isHackathonSignupClosedForNewParticipants", () => {
  const pub = {
    slug: HACKATHON_SLUG,
    phase: "live" as const,
    registrationOpen: true,
  };

  it("is false for existing participants", () => {
    expect(isHackathonSignupClosedForNewParticipants(pub, true)).toBe(false);
  });

  it("is false while registration is open and the event is live", () => {
    expect(isHackathonSignupClosedForNewParticipants(pub, false)).toBe(false);
  });

  it("is true when registrationOpen is false", () => {
    expect(
      isHackathonSignupClosedForNewParticipants({ ...pub, registrationOpen: false }, false),
    ).toBe(true);
  });

  it("is true when the hackathon phase is ended", () => {
    expect(
      isHackathonSignupClosedForNewParticipants({ ...pub, phase: "ended" }, false),
    ).toBe(true);
  });

  it("is false while public hackathon data is still loading", () => {
    expect(isHackathonSignupClosedForNewParticipants(undefined, false)).toBe(false);
  });
});
