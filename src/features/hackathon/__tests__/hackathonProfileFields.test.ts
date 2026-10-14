import { describe, expect, it } from "vitest";
import {
  isHackathonStep1Ready,
  resolveHackathonOnboardingStep,
} from "../hackathonProfileFields";

describe("resolveHackathonOnboardingStep", () => {
  it("starts at step 1 when type or phone is missing", () => {
    expect(resolveHackathonOnboardingStep({ userType: "student" })).toBe(1);
    expect(
      resolveHackathonOnboardingStep({ userType: "fresher", phone: "+91 9876543210" }),
    ).toBe(2);
  });

  it("jumps to step 3 when role fields are already complete", () => {
    expect(
      resolveHackathonOnboardingStep({
        userType: "experienced",
        phone: "+91 9876543210",
        industry: "Technology",
        targetJobRole: "Software Engineer",
      }),
    ).toBe(3);
  });
});

describe("isHackathonStep1Ready", () => {
  it("requires a valid stored phone", () => {
    expect(
      isHackathonStep1Ready({ userType: "student", phone: "+91 9876543210" }),
    ).toBe(true);
    expect(isHackathonStep1Ready({ userType: "student", phone: "123" })).toBe(false);
  });
});
