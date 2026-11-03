import { describe, expect, it } from "vitest";
import {
  resumePdfFilenameFromResume,
  sanitizeDownloadFilename,
  sanitizePdfFilename,
} from "../download-pdf";

describe("resumePdfFilenameFromResume", () => {
  const personalInfo = { fullName: "Anup Kumar", portfolio: "Sr. Software Development Engineer (SDE 4)" };

  it("is 'Name - Role' from the candidate's name and professional title", () => {
    expect(resumePdfFilenameFromResume({ title: "My Resume", content: { personalInfo } })).toBe(
      "Anup Kumar - Sr. Software Development Engineer (SDE 4).pdf",
    );
    // A title the user typed doesn't replace their name.
    expect(resumePdfFilenameFromResume({ title: "Backend Engineer Resume", content: { personalInfo } })).toBe(
      "Anup Kumar - Sr. Software Development Engineer (SDE 4).pdf",
    );
  });

  it("adds the company (and the job's role) when the resume was tailored to a job", () => {
    expect(
      resumePdfFilenameFromResume({
        title: "Staff Software Engineer (Typescript, Javascript, Nodejs) · Walmart Global Tech",
        content: { personalInfo },
      }),
    ).toBe("Anup Kumar - Staff Software Engineer (Typescript, Javascript, Nodejs) - Walmart Global Tech.pdf");
  });

  it("uses the job and company of the job description the resume was scored against", () => {
    expect(
      resumePdfFilenameFromResume({
        title: "My Resume",
        atsFeedback: { version: 3, jobMatch: { jobTitle: "Backend Engineer", companyName: "Razorpay" } },
        content: { personalInfo },
      }),
    ).toBe("Anup Kumar - Backend Engineer - Razorpay.pdf");
    // A job without a named company keeps the candidate's own title.
    expect(
      resumePdfFilenameFromResume({ title: "My Resume", atsFeedback: { jobMatch: { jobTitle: "Backend Engineer" } }, content: { personalInfo } }),
    ).toBe("Anup Kumar - Sr. Software Development Engineer (SDE 4).pdf");
  });

  it("is just the name when there is no role", () => {
    expect(resumePdfFilenameFromResume({ title: "My Resume", content: { personalInfo: { fullName: "Aditya V. Raman" } } })).toBe(
      "Aditya V. Raman.pdf",
    );
  });

  it("without a name: a real title, else the role, else 'resume'", () => {
    expect(resumePdfFilenameFromResume({ title: "Backend Engineer CV", content: { personalInfo: {} } })).toBe("Backend Engineer CV.pdf");
    expect(resumePdfFilenameFromResume({ title: "Resume (2)", content: { personalInfo: { portfolio: "Data Scientist" } } })).toBe(
      "Data Scientist.pdf",
    );
    expect(resumePdfFilenameFromResume({ title: "My Resume", content: { personalInfo: {} } })).toBe("resume.pdf");
  });
});

describe("sanitizeDownloadFilename", () => {
  it("keeps spaces and dashes, drops bullets and characters file systems reject", () => {
    expect(sanitizePdfFilename("• Staff  Engineer • Acme / India: 2026")).toBe("Staff Engineer Acme India 2026.pdf");
  });

  it("ends with exactly one extension (a typed '.pdf' isn't doubled)", () => {
    expect(sanitizePdfFilename("Priya Sharma - SDE.pdf")).toBe("Priya Sharma - SDE.pdf");
    expect(sanitizePdfFilename("Priya Sharma.pdf.pdf")).toBe("Priya Sharma.pdf");
    expect(sanitizeDownloadFilename("Priya Sharma.pdf", "txt")).toBe("Priya Sharma.txt");
  });

  it("falls back to 'resume' when nothing is left", () => {
    expect(sanitizePdfFilename("  /// ")).toBe("resume.pdf");
  });
});
