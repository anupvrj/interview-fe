import { describe, expect, it } from "vitest";
import { pickDashboardHackathon } from "../pickDashboardHackathon";

describe("pickDashboardHackathon", () => {
  it("prefers a live event over upcoming ones", () => {
    expect(
      pickDashboardHackathon([
        { phase: "upcoming", startsAt: "2026-01-01T00:00:00.000Z" },
        { phase: "live", startsAt: "2026-02-01T00:00:00.000Z" },
        { phase: "ended", startsAt: "2025-01-01T00:00:00.000Z" },
      ]),
    ).toMatchObject({ phase: "live" });
  });

  it("picks the soonest upcoming event when none are live", () => {
    expect(
      pickDashboardHackathon([
        { phase: "upcoming", startsAt: "2026-03-01T00:00:00.000Z" },
        { phase: "upcoming", startsAt: "2026-01-15T00:00:00.000Z" },
        { phase: "ended", startsAt: "2025-01-01T00:00:00.000Z" },
      ]),
    ).toMatchObject({ startsAt: "2026-01-15T00:00:00.000Z" });
  });

  it("hides the banner when only ended events exist", () => {
    expect(pickDashboardHackathon([{ phase: "ended", startsAt: "2025-01-01T00:00:00.000Z" }])).toBeNull();
  });
});
