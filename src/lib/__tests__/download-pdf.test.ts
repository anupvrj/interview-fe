import { describe, expect, it } from "vitest";
import {
  resumePdfFilenameFromResume,
  sanitizePdfFilename,
} from "../download-pdf";

describe("resumePdfFilenameFromResume", () => {
  it("uses the resume title instead of name + professional title", () => {
    expect(
      resumePdfFilenameFromResume({
        title:
          "• Staff Software Engineer (Typescript, Javascript, Nodejs) • Walmart Global",
        content: {
          personalInfo: {
            fullName: "Anup Kumar",
            portfolio: "Sr. Software Development Engineer (SDE 4)",
          },
        },
      }),
    ).toBe(
      "Staff_Software_Engineer_(Typescript,_Javascript,_Nodejs)_Walmart_Global.pdf",
    );
  });

  it("falls back to the person's name when the title is empty", () => {
    expect(
      resumePdfFilenameFromResume({
        title: "  ",
        content: {
          personalInfo: {
            fullName: "Anup Kumar",
            portfolio: "Sr. Software Development Engineer (SDE 4)",
          },
        },
      }),
    ).toBe("Anup_Kumar.pdf");
  });

  it("a default title ('My Resume', 'Resume (2)') is replaced by the name", () => {
    const content = { personalInfo: { fullName: "Aditya V. Raman", portfolio: "Data Scientist" } };
    expect(resumePdfFilenameFromResume({ title: "My Resume", content })).toBe("Aditya_V._Raman.pdf");
    expect(resumePdfFilenameFromResume({ title: "Resume (2)", content })).toBe("Aditya_V._Raman.pdf");
    expect(resumePdfFilenameFromResume({ title: "Backend Engineer Resume", content })).toBe("Backend_Engineer_Resume.pdf");
  });
});

describe("sanitizePdfFilename", () => {
  it("strips bullets and spaces", () => {
    expect(sanitizePdfFilename("• Staff Engineer • Acme")).toBe(
      "Staff_Engineer_Acme.pdf",
    );
  });
});
