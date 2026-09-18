import { describe, expect, it } from "vitest";
import {
  MAX_RESUME_PDF_BYTES,
  blobToBase64,
  jobPageButtonLabel,
  parseActiveResumePayload,
  parseLastScanResult,
  returnToExtensionJobTab,
} from "@/lib/extension-resume-sync";

describe("extension-resume-sync", () => {
  it("accepts a valid compiled payload", () => {
    const parsed = parseActiveResumePayload({
      v: 1,
      resumeId: "r1",
      title: "SDE",
      fileName: "SDE.pdf",
      mimeType: "application/pdf",
      fileBlobBase64: "JVBERg==",
      byteLength: 4,
      lastCompiledAt: "2026-09-13T00:00:00.000Z",
      readyToAttach: true,
    });
    expect(parsed?.resumeId).toBe("r1");
  });

  it("rejects oversized PDFs", () => {
    expect(
      parseActiveResumePayload({
        v: 1,
        resumeId: "r1",
        title: "SDE",
        fileName: "SDE.pdf",
        mimeType: "application/pdf",
        fileBlobBase64: "AA",
        byteLength: MAX_RESUME_PDF_BYTES + 1,
        lastCompiledAt: "2026-09-13T00:00:00.000Z",
        readyToAttach: true,
      }),
    ).toBeNull();
  });

  it("labels a job page button with title and host", () => {
    expect(
      jobPageButtonLabel({
        sourceUrl: "https://www.linkedin.com/jobs/view/1",
        title: "Senior Engineer",
        company: "Acme",
      }),
    ).toBe("Senior Engineer · linkedin.com");
    expect(jobPageButtonLabel(null)).toBe("Open job page");
  });

  it("encodes a blob as base64", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const encoded = await blobToBase64(blob);
    expect(atob(encoded).charCodeAt(0)).toBe(1);
  });

  it("does not leave InterviewTrix when the extension is missing", async () => {
    await expect(returnToExtensionJobTab(20)).resolves.toEqual({ ok: false });
  });

  it("parses a last-scan result with job description even without a URL", () => {
    expect(
      parseLastScanResult({
        title: "SDE",
        company: "Acme",
        jobDescription: "Build APIs and own delivery.",
      }),
    ).toEqual({
      sourceUrl: "",
      title: "SDE",
      company: "Acme",
      jobDescription: "Build APIs and own delivery.",
    });
  });

  it("ignores empty last-scan payloads", () => {
    expect(parseLastScanResult({ title: "SDE", company: "Acme" })).toBeNull();
  });
});
