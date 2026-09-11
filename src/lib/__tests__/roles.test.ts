import { describe, expect, it } from "vitest";
import { deriveAvailableRoles, roleHome } from "../roles";
import type { User } from "@/lib/api";

function profile(
  partial: Partial<Pick<User, "accessRole" | "peer" | "recruiter" | "institutionId">>,
) {
  return {
    accessRole: "user" as const,
    ...partial,
  };
}

describe("deriveAvailableRoles", () => {
  it("lets a super admin switch to candidate", () => {
    expect(
      deriveAvailableRoles(profile({ accessRole: "super_admin" })),
    ).toEqual(["super_admin", "candidate"]);
  });

  it("adds institution admin when the super admin belongs to an institution", () => {
    expect(
      deriveAvailableRoles(
        profile({ accessRole: "super_admin", institutionId: "abc123" }),
      ),
    ).toEqual(["super_admin", "institution_admin", "candidate"]);
  });

  it("includes interviewer and recruiter when those profiles are approved", () => {
    expect(
      deriveAvailableRoles(
        profile({
          accessRole: "super_admin",
          peer: { interviewerStatus: "approved" } as User["peer"],
          recruiter: { recruiterStatus: "approved" } as User["recruiter"],
        }),
      ),
    ).toEqual(["super_admin", "interviewer", "recruiter", "candidate"]);
  });
});

describe("roleHome", () => {
  it("sends candidate to the practice dashboard", () => {
    expect(roleHome("candidate", null)).toBe("/dashboard");
  });

  it("sends super admin to the control panel", () => {
    expect(roleHome("super_admin", null)).toBe("/super-admin");
  });
});
