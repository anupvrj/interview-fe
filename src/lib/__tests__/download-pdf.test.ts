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

  it("falls back to name and role when the title is empty", () => {
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
    ).toBe("Anup_Kumar_Sr._Software_Development_Engineer_(SDE_4).pdf");
  });
});

describe("sanitizePdfFilename", () => {
  it("strips bullets and spaces", () => {
    expect(sanitizePdfFilename("• Staff Engineer • Acme")).toBe(
      "Staff_Engineer_Acme.pdf",
    );
  });
});
