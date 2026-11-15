import { openPdfDocument } from "@/lib/pdf-utils";

export type PdfLineBox = { top: number; left: number; width: number; height: number };

/** The first page of an uploaded PDF as an image, and where its lines of text sit on it. */
export type PdfSnapshot = {
  dataUrl: string;
  /** Page width / height. */
  aspect: number;
  /** Boxes as fractions of the page, top to bottom. */
  lines: PdfLineBox[];
};

const RENDER_SCALE = 1.5;

type TextItem = { str?: string; width?: number; height?: number; transform?: number[] };

/** Null when the browser can't draw it: the scan screen then shows its generic page. */
export async function snapshotPdfFirstPage(file: File): Promise<PdfSnapshot | null> {
  try {
    const pdf = await openPdfDocument(file);
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const canvasContext = canvas.getContext("2d");
    if (!canvasContext) return null;
    // "print": painted in one go, not frame by frame, so a background tab doesn't stall it.
      await page.render({ canvas, canvasContext, viewport, intent: "print" }).promise;

    const unscaled = page.getViewport({ scale: 1 });
    const { items } = await page.getTextContent();
    return {
      dataUrl: canvas.toDataURL("image/jpeg", 0.82),
      aspect: unscaled.width / unscaled.height,
      lines: lineBoxes(items as TextItem[], unscaled.width, unscaled.height),
    };
  } catch {
    return null;
  }
}

export function lineBoxes(items: TextItem[], pageWidth: number, pageHeight: number): PdfLineBox[] {
  const rows = new Map<number, { left: number; right: number; height: number; y: number }>();
  for (const item of items) {
    if (!item.str?.trim() || !item.transform) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    const height = item.height || 10;
    const key = Math.round(y / 3);
    const row = rows.get(key);
    if (row) {
      row.left = Math.min(row.left, x);
      row.right = Math.max(row.right, x + (item.width ?? 0));
      row.height = Math.max(row.height, height);
    } else {
      rows.set(key, { left: x, right: x + (item.width ?? 0), height, y });
    }
  }
  return [...rows.values()]
    .sort((a, b) => b.y - a.y)
    .map((row) => ({
      top: 1 - (row.y + row.height) / pageHeight,
      left: row.left / pageWidth,
      width: (row.right - row.left) / pageWidth,
      height: (row.height * 1.25) / pageHeight,
    }));
}

/** Null where the browser doesn't offer it: the file is then simply checked as new. */
export async function sha256OfFile(file: File): Promise<string | undefined> {
  try {
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return undefined;
  }
}

/** A piece of text on a page and where it sits, as fractions of the page. */
export type PdfTextBox = PdfLineBox & { text: string };

/** One page of their original PDF, drawn, with its text positions for marking findings. */
export type PdfPage = { dataUrl: string; aspect: number; items: PdfTextBox[] };

/** Pages beyond this are rare on a resume and only cost memory. */
const MAX_PAGES = 4;

/** Every page of the PDF as they made it. Null when the browser can't draw it. */
export async function renderPdfPages(file: File, maxPages = MAX_PAGES): Promise<PdfPage[] | null> {
  try {
    const pdf = await openPdfDocument(file);
    const pages: PdfPage[] = [];
    for (let n = 1; n <= Math.min(pdf.numPages, maxPages); n++) {
      const page = await pdf.getPage(n);
      // Phones show the page narrow; a smaller image looks the same and saves memory.
      const viewport = page.getViewport({ scale: typeof window !== "undefined" && window.innerWidth < 768 ? 1.25 : 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const canvasContext = canvas.getContext("2d");
      if (!canvasContext) return null;
      // "print": painted in one go, not frame by frame, so a background tab doesn't stall it.
      await page.render({ canvas, canvasContext, viewport, intent: "print" }).promise;
      const unscaled = page.getViewport({ scale: 1 });
      const { items } = await page.getTextContent();
      pages.push({
        dataUrl: canvas.toDataURL("image/jpeg", 0.88),
        aspect: unscaled.width / unscaled.height,
        items: textBoxes(items as TextItem[], unscaled.width, unscaled.height),
      });
    }
    return pages.length ? pages : null;
  } catch {
    return null;
  }
}

export function textBoxes(items: TextItem[], pageWidth: number, pageHeight: number): PdfTextBox[] {
  const boxes: PdfTextBox[] = [];
  for (const item of items) {
    if (!item.str?.trim() || !item.transform) continue;
    const height = item.height || Math.abs(item.transform[3]) || 10;
    const y = item.transform[5];
    boxes.push({
      text: item.str,
      left: item.transform[4] / pageWidth,
      width: (item.width ?? 0) / pageWidth,
      // The baseline is at y; leave room for descenders below it.
      top: 1 - (y + height) / pageHeight,
      height: (height * 1.3) / pageHeight,
    });
  }
  return boxes;
}

export type PdfHit = PdfLineBox & { page: number };

const wordsOf = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}%+#]+/gu) ?? [];

/**
 * Where some text (a finding's quote) sits in the PDF: one box per line it spans. Matched
 * word by word, so spacing, punctuation and line breaks in the PDF don't matter. When the
 * whole quote isn't there (an AI quote that drifts at the end), its first words are tried.
 */
export function locateTextInPdf(pages: PdfPage[], text: string): PdfHit[] {
  type Token = { word: string; page: number; item: number; start: number; end: number };
  const tokens: Token[] = [];
  pages.forEach((page, p) => {
    page.items.forEach((box, i) => {
      const lower = box.text.toLowerCase();
      for (const m of lower.matchAll(/[\p{L}\p{N}%+#]+/gu)) {
        tokens.push({ word: m[0], page: p, item: i, start: m.index ?? 0, end: (m.index ?? 0) + m[0].length });
      }
    });
  });
  const query = wordsOf(text);
  if (!query.length) return [];

  const find = (q: string[]) => {
    outer: for (let i = 0; i + q.length <= tokens.length; i++) {
      for (let j = 0; j < q.length; j++) if (tokens[i + j].word !== q[j]) continue outer;
      return tokens.slice(i, i + q.length);
    }
    return null;
  };
  // A word or two that appears more than once ("Description" on a template) can't be placed
  // on the right line: no box beats a box on the wrong one.
  if (query.length < 3) {
    let seen = 0;
    outer: for (let i = 0; i + query.length <= tokens.length; i++) {
      for (let j = 0; j < query.length; j++) if (tokens[i + j].word !== query[j]) continue outer;
      if (++seen > 1) return [];
    }
  }
  const hit = find(query) ?? (query.length > 6 ? find(query.slice(0, 6)) : null);
  if (!hit) return [];

  // The matched part of each piece of text, then one box per line.
  const pieces = new Map<string, { page: number; item: number; start: number; end: number }>();
  for (const t of hit) {
    const key = `${t.page}:${t.item}`;
    const piece = pieces.get(key);
    if (piece) piece.end = t.end;
    else pieces.set(key, { page: t.page, item: t.item, start: t.start, end: t.end });
  }
  const lines: PdfHit[] = [];
  for (const piece of pieces.values()) {
    const box = pages[piece.page].items[piece.item];
    const length = box.text.length || 1;
    const left = box.left + box.width * (piece.start / length);
    const width = box.width * ((piece.end - piece.start) / length);
    const line = lines.find((l) => l.page === piece.page && Math.abs(l.top - box.top) < box.height * 0.5);
    if (line) {
      const right = Math.max(line.left + line.width, left + width);
      line.left = Math.min(line.left, left);
      line.width = right - line.left;
      line.height = Math.max(line.height, box.height);
    } else {
      lines.push({ page: piece.page, top: box.top, left, width, height: box.height });
    }
  }
  return lines;
}
