/**
 * Text of a resume PDF, for the resume import, the hackathon "upload your resume" step and the
 * ATS checker.
 *
 * Read in the browser with pdf.js's legacy build (the modern build needs recent browser
 * features that in-app browsers such as Instagram's lack — uploads failed there with "Failed
 * to extract text from PDF"). If the browser still can't read it, the PDF is sent to the
 * server, which reads it and returns only the text (nothing is stored).
 */
import { userApi } from "@/lib/api";

/** No text at all: a scan or an image saved as PDF. */
export class PdfHasNoTextError extends Error {
  constructor() {
    super(
      "This PDF has no readable text — it looks like a scan or an image. Upload a PDF exported from Word or Google Docs, or build your resume by talking to AI or from LinkedIn.",
    );
    this.name = "PdfHasNoTextError";
  }
}

type PdfTextItem = { str?: string; hasEOL?: boolean; height?: number; width?: number; transform?: number[] };

/**
 * A page's text with its lines kept. Headings, sub-headings and bullets are only told apart
 * by where they sit on the page, so running them together loses what the resume says.
 * A bigger gap than normal line spacing (a new section or entry) becomes a blank line.
 */
export function linesFromPdfTextItems(items: PdfTextItem[]): string {
  let text = "";
  let lastY: number | undefined;
  let lastEndX: number | undefined;
  let lineGap = 0;
  for (const item of items) {
    const str = item.str ?? "";
    const y = item.transform?.[5];
    const x = item.transform?.[4];
    const height = item.height || 10;
    if (y !== undefined && lastY !== undefined && Math.abs(y - lastY) > height * 0.5) {
      const gap = Math.abs(y - lastY);
      text = text.trimEnd() + (lineGap && gap > lineGap * 1.4 ? "\n\n" : "\n");
      lineGap = lineGap ? Math.min(lineGap, gap) : gap;
      lastEndX = undefined;
    } else if (x !== undefined && lastEndX !== undefined && x - lastEndX > height * 0.15 && !/\s$/.test(text) && !/^\s/.test(str)) {
      text += " ";
    }
    text += str;
    if (y !== undefined) lastY = y;
    if (x !== undefined && item.width !== undefined) lastEndX = x + item.width;
    if (item.hasEOL && y === undefined) text = text.trimEnd() + "\n";
    if (y === undefined && !item.hasEOL && str.trim()) text += " ";
  }
  return text.trim();
}

/** Opens a PDF in the browser. */
export async function openPdfDocument(file: File) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (typeof window !== "undefined") {
    // Copied from pdfjs-dist/legacy by scripts/copy-pdf-worker.js, so it matches the library.
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
  return pdfjsLib.getDocument({
    data: await file.arrayBuffer(),
    useWorkerFetch: false,
    verbosity: 0,
  }).promise;
}

async function readInBrowser(file: File): Promise<string> {
  const pdf = await openPdfDocument(file);

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += linesFromPdfTextItems(textContent.items as PdfTextItem[]) + "\n";
  }
  return fullText.trim();
}

async function readOnServer(file: File): Promise<string> {
  try {
    return (await userApi.extractResumeText(file)).trim();
  } catch (error) {
    const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
    if (code === "NO_TEXT") return "";
    throw error;
  }
}

export async function extractTextFromPDF(file: File): Promise<string> {
  let browserError: unknown = null;
  try {
    const text = await readInBrowser(file);
    if (text) return text;
  } catch (error) {
    browserError = error;
    console.warn("Reading the PDF in the browser failed; trying the server.", error);
  }

  try {
    const text = await readOnServer(file);
    if (text) return text;
    throw new PdfHasNoTextError();
  } catch (error) {
    if (error instanceof PdfHasNoTextError) throw error;
    // Server unreachable or not signed in: the browser said there was no text, so say that.
    if (!browserError) throw new PdfHasNoTextError();
    console.error("Reading the PDF failed in the browser and on the server.", { browserError, error });
    throw new Error(
      "We couldn't read this PDF. Try again, or open this page in Chrome or Safari, or build your resume by talking to AI or from LinkedIn.",
    );
  }
}
