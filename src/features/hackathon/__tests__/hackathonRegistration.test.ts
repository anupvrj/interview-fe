import { describe, expect, it } from "vitest";
import { isHackathonRegistered } from "../hackathonRegistration";
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
