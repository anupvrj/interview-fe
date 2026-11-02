import { describe, expect, it } from "vitest";
import type { User } from "@/lib/api";
import {
  applyJobCaptureToInterviewForm,
  mergeInterviewFormDefaults,
} from "@/lib/interview-form-defaults";

const emptyForm = {
  role: "",
  targetCompany: "",
  experience: "0",
};

const profile = {
  targetJobRole: "Backend Engineer",
  targetCompany: "TCS",
  experience: 3,
} as User;

describe("interview-form-defaults", () => {
  it("prefers Chrome job capture over profile defaults for role and company", () => {
    const merged = mergeInterviewFormDefaults(emptyForm, profile);
    expect(merged.role).toBe("Backend Engineer");
    expect(merged.targetCompany).toBe("TCS");
    expect(merged.experience).toBe("3");

    const applied = applyJobCaptureToInterviewForm(merged, {
      title: "SDE II",
      company: "Google",
    });
    expect(applied.role).toBe("SDE II");
    expect(applied.targetCompany).toBe("Google");
    expect(applied.experience).toBe("3");
  });

  it("keeps a cleared role once the user has edited it", () => {
    const merged = mergeInterviewFormDefaults(
      { ...emptyForm, role: "" },
      profile,
      { role: true },
    );
    expect(merged.role).toBe("");
    expect(merged.targetCompany).toBe("TCS");
  });

  it("keeps profile values when capture title and company are empty", () => {
    const merged = mergeInterviewFormDefaults(emptyForm, profile);
    const applied = applyJobCaptureToInterviewForm(merged, {
      title: "  ",
      company: "",
    });
    expect(applied.role).toBe("Backend Engineer");
    expect(applied.targetCompany).toBe("TCS");
  });

  it("uses the last interview's choices before the profile, and the profile to fill gaps", () => {
    const last = { kind: "coding_round" as const, role: "Lead Software Engineer", experience: 5, at: "2026-11-01T10:00:00Z" };
    const merged = mergeInterviewFormDefaults(emptyForm, profile, undefined, last);
    expect(merged.role).toBe("Lead Software Engineer");
    expect(merged.targetCompany).toBe("TCS");
    expect(merged.experience).toBe("5");
    expect(mergeInterviewFormDefaults(emptyForm, profile, undefined, null).role).toBe("Backend Engineer");
  });
});
