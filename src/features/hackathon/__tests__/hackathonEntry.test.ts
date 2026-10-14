import { describe, expect, it } from "vitest";
import { hackathonEntryPath } from "../hackathonEntry";

describe("hackathonEntryPath", () => {
  const profile = "/hackathon/x/profile";
  const dashboard = "/hackathon/x/dashboard";

  it("sends registered users to the dashboard", () => {
    expect(hackathonEntryPath({ registered: true, profilePath: profile, dashboardPath: dashboard })).toBe(dashboard);
  });

  it("sends users with a complete profile but no registration to onboarding", () => {
    expect(
      hackathonEntryPath({ profileComplete: true, profilePath: profile, dashboardPath: dashboard }),
    ).toBe(profile);
  });

  it("sends others to profile onboarding", () => {
    expect(hackathonEntryPath({ profilePath: profile, dashboardPath: dashboard })).toBe(profile);
  });
});
