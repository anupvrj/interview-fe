import { beforeEach, describe, expect, it, vi } from "vitest";

const getDocument = vi.fn();
vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({ GlobalWorkerOptions: {}, getDocument: (...a: unknown[]) => getDocument(...a) }));
const extractResumeText = vi.fn();
vi.mock("@/lib/api", () => ({ userApi: { extractResumeText: (...a: unknown[]) => extractResumeText(...a) } }));

// eslint-disable-next-line import/first
import { extractTextFromPDF, linesFromPdfTextItems, PdfHasNoTextError } from "../pdf-utils";

const file = new File([new Uint8Array([37, 80, 68, 70])], "resume.pdf", { type: "application/pdf" });
const pdfWithText = (pages: string[]) => ({
  promise: Promise.resolve({
    numPages: pages.length,
    getPage: async (i: number) => ({ getTextContent: async () => ({ items: pages[i - 1] ? [{ str: pages[i - 1] }] : [] }) }),
  }),
});

describe("extractTextFromPDF", () => {
  beforeEach(() => {
    getDocument.mockReset();
    extractResumeText.mockReset();
  });

  it("reads text in the browser and doesn't call the server", async () => {
    getDocument.mockReturnValue(pdfWithText(["Anup Kumar", "Engineer"]));
    expect(await extractTextFromPDF(file)).toBe("Anup Kumar\nEngineer");
    expect(extractResumeText).not.toHaveBeenCalled();
  });

  it("browser can't read it (in-app browser): falls back to the server", async () => {
    getDocument.mockImplementation(() => {
      throw new TypeError("Promise.withResolvers is not a function");
    });
    extractResumeText.mockResolvedValue("  Text from the server  ");
    expect(await extractTextFromPDF(file)).toBe("Text from the server");
  });

  it("no text anywhere (a scan): says so clearly", async () => {
    getDocument.mockReturnValue(pdfWithText([""]));
    extractResumeText.mockRejectedValue({ response: { status: 422, data: { code: "NO_TEXT" } } });
    await expect(extractTextFromPDF(file)).rejects.toBeInstanceOf(PdfHasNoTextError);
  });

  it("browser found no text and the server is unreachable: still the scan message", async () => {
    getDocument.mockReturnValue(pdfWithText([""]));
    extractResumeText.mockRejectedValue(new Error("Network Error"));
    await expect(extractTextFromPDF(file)).rejects.toBeInstanceOf(PdfHasNoTextError);
  });

  it("both fail: a helpful message, not 'Failed to extract text'", async () => {
    getDocument.mockImplementation(() => {
      throw new Error("worker failed");
    });
    extractResumeText.mockRejectedValue({ response: { status: 401 } });
    await expect(extractTextFromPDF(file)).rejects.toThrow(/couldn't read this PDF/);
  });
});

describe("linesFromPdfTextItems", () => {
  const at = (str: string, x: number, y: number, width = str.length * 5) => ({ str, transform: [1, 0, 0, 1, x, y], width, height: 10 });

  it("keeps each line of the page on its own line", () => {
    expect(linesFromPdfTextItems([at("PUBLICATIONS", 50, 700), at("First paper", 50, 680), at("Second paper", 50, 660)])).toBe(
      "PUBLICATIONS\nFirst paper\nSecond paper",
    );
  });

  it("marks a section gap with a blank line", () => {
    expect(linesFromPdfTextItems([at("Line one", 50, 700), at("Line two", 50, 686), at("HEADING", 50, 650), at("Line three", 50, 636)])).toBe(
      "Line one\nLine two\n\nHEADING\nLine three",
    );
  });

  it("joins pieces of one line, with a space only where the page has a gap", () => {
    expect(linesFromPdfTextItems([at("Senior ", 50, 700, 35), at("Engineer", 85, 700, 40), at("2024", 300, 700, 20)])).toBe("Senior Engineer 2024");
    expect(linesFromPdfTextItems([at("Eng", 50, 700, 15), at("ineer", 65, 700, 25)])).toBe("Engineer");
  });
});
