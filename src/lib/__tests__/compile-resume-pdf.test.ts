// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const generate = vi.fn();
const fetchBlob = vi.fn();
const screenshotPdf = vi.fn();
vi.mock("@/lib/resume-pdf-export", () => ({ generateResumePdfViaServer: (...a: unknown[]) => generate(...a) }));
vi.mock("@/lib/download-pdf", () => ({ fetchPdfBlobFromUrl: (...a: unknown[]) => fetchBlob(...a) }));
vi.mock("@/lib/wait-for-resume-pagination", () => ({ waitForResumePaginationSettled: async () => undefined }));
vi.mock("@/lib/api", () => ({ resumeApi: {} }));
vi.mock("@/lib/pdf-generator", () => ({ generatePDFFromPages: (...a: unknown[]) => screenshotPdf(...a), uploadPDFToS3: vi.fn() }));

import { compileResumePdfFromPreviewContainer } from "../compile-resume-pdf-from-dom";

describe("Save and return: the server PDF is kept", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    document.body.innerHTML = '<div id="pv"><div class="flex flex-col items-center"><div class="resume-page">Page</div></div></div>';
    generate.mockReset().mockResolvedValue({ downloadUrl: "https://s3.example/r.pdf", s3Key: "k" });
    fetchBlob.mockReset();
    screenshotPdf.mockReset();
  });

  it("reading it back fails twice: returns its link, never makes a screenshot PDF", async () => {
    fetchBlob.mockRejectedValue(new Error("PDF fetch failed (404)"));
    const result = await compileResumePdfFromPreviewContainer({ resumeId: "r", templateId: "classic", previewContainerId: "pv", filename: "a.pdf" });
    expect(result).toEqual({ blob: null, downloadUrl: "https://s3.example/r.pdf" });
    expect(fetchBlob).toHaveBeenCalledTimes(2);
    expect(screenshotPdf).not.toHaveBeenCalled();
  });

  it("a second read-back succeeds: returns the PDF", async () => {
    const blob = new Blob(["%PDF"]);
    fetchBlob.mockRejectedValueOnce(new Error("404")).mockResolvedValueOnce(blob);
    const result = await compileResumePdfFromPreviewContainer({ resumeId: "r", templateId: "classic", previewContainerId: "pv", filename: "a.pdf" });
    expect(result.blob).toBe(blob);
    expect(screenshotPdf).not.toHaveBeenCalled();
  });

  it("server PDF required (hackathon): a server failure throws, no screenshot PDF", async () => {
    generate.mockRejectedValue(new Error("Puppeteer timed out"));
    await expect(
      compileResumePdfFromPreviewContainer({ resumeId: "r", templateId: "classic", previewContainerId: "pv", filename: "a.pdf", requireServerPdf: true }),
    ).rejects.toThrow("Puppeteer timed out");
    expect(screenshotPdf).not.toHaveBeenCalled();
  });
});
