import { describe, expect, it } from "vitest";
import {
  biometricEnrollmentLabel,
  biometricEnrollmentState,
  isInstituteBiometricRequired,
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
});
