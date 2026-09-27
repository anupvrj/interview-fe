import { describe, expect, it } from "vitest";
import {
  biometricEnrollmentLabel,
  biometricEnrollmentState,
  canManagedCandidateSelfStart,
  defaultInstitutionProducts,
  isInstituteBiometricRequired,
  isInstitutionProductEnabled,
} from "../institution-flags";

describe("biometricEnrollmentState", () => {
  it("treats empty and failed as not done", () => {
    expect(biometricEnrollmentState(null)).toBe("missing");
    expect(biometricEnrollmentState(undefined)).toBe("missing");
    expect(biometricEnrollmentState("failed")).toBe("missing");
    expect(biometricEnrollmentState("failed_by_admin")).toBe("missing");
  });

  it("treats pending and in-review as processing", () => {
    expect(biometricEnrollmentState("pending")).toBe("pending");
    expect(biometricEnrollmentState("in-review")).toBe("pending");
  });

  it("treats approved and human_verified as ready", () => {
    expect(biometricEnrollmentState("approved")).toBe("ready");
    expect(biometricEnrollmentState("human_verified")).toBe("ready");
  });
});

describe("biometricEnrollmentLabel", () => {
  it("shows Not recorded when there is no credential", () => {
    expect(biometricEnrollmentLabel(null)).toBe("Not recorded");
  });
});

describe("isInstituteBiometricRequired", () => {
  it("requires both institution id and the SA flag", () => {
    expect(
      isInstituteBiometricRequired({
        institutionId: "inst_1",
        institutionFlags: { biometricVerification: true },
      }),
    ).toBe(true);
    expect(
      isInstituteBiometricRequired({
        institutionId: "inst_1",
        institutionFlags: { biometricVerification: false },
      }),
    ).toBe(false);
    expect(
      isInstituteBiometricRequired({
        institutionFlags: { biometricVerification: true },
      }),
    ).toBe(false);
  });

  it("always requires identity for institute-invited candidates", () => {
    expect(
      isInstituteBiometricRequired({
        institutionId: "inst_1",
        institutionInvited: true,
        accessRole: "user",
        institutionFlags: { biometricVerification: false },
      }),
    ).toBe(true);
  });
});

describe("canManagedCandidateSelfStart", () => {
  it("is true for self-serve users", () => {
    expect(canManagedCandidateSelfStart({ accessRole: "user" })).toBe(true);
  });

  it("defaults on for managed candidates unless the institute turned it off", () => {
    expect(
      canManagedCandidateSelfStart({
        institutionId: "inst_1",
        institutionInvited: true,
        accessRole: "user",
      }),
    ).toBe(true);
    expect(
      canManagedCandidateSelfStart({
        institutionId: "inst_1",
        institutionInvited: true,
        accessRole: "user",
        allowCandidateSelfStart: false,
      }),
    ).toBe(false);
  });
});

describe("AI connector institute product", () => {
  it("defaults off until a super admin enables it", () => {
    expect(defaultInstitutionProducts().api_connector).toBe(false);
    expect(isInstitutionProductEnabled(undefined, "api_connector")).toBe(false);
    expect(isInstitutionProductEnabled({ api_connector: true }, "api_connector")).toBe(
      true,
    );
  });
});
