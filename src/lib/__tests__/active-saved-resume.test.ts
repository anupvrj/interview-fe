import { describe, expect, it } from "vitest";
import type { Resume, User } from "@/lib/api";
import {
  getActiveSavedResumeDisplay,
  hasActiveSavedResume,
} from "@/lib/active-saved-resume";

const profileWithUpload = {
  resume: {
    s3Key: "resumes/a.pdf",
    filename: "anup.pdf",
    uploadedAt: "2026-08-01T00:00:00.000Z",
    size: 1200,
  },
} as User;

const designedDefault = {
  resumeId: "res_1",
  title: "SDE II · Intuit",
  isDefault: true,
  pdfS3Key: "pdfs/res_1.pdf",
  updatedAt: "2026-08-20T00:00:00.000Z",
} as Resume;

describe("active-saved-resume", () => {
  it("treats a profile default designed resume as the saved interview resume", () => {
    expect(hasActiveSavedResume(null, designedDefault)).toBe(true);
    expect(getActiveSavedResumeDisplay(null, designedDefault)?.title).toBe(
      "SDE II · Intuit",
    );
  });

  it("prefers an uploaded profile PDF over the designed default", () => {
    const display = getActiveSavedResumeDisplay(
      profileWithUpload,
      designedDefault,
    );
    expect(display?.title).toBe("anup.pdf");
  });

  it("treats a profile default designed resume as saved even without a PDF key", () => {
    const withoutPdf = { ...designedDefault, pdfS3Key: undefined };
    expect(hasActiveSavedResume(null, withoutPdf)).toBe(true);
  });

  it("does not treat a non-default designed resume as saved", () => {
    const other = { ...designedDefault, isDefault: false };
    expect(hasActiveSavedResume(null, other)).toBe(false);
    expect(getActiveSavedResumeDisplay(null, other)).toBeNull();
  });
});
