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
    await page.render({ canvas, canvasContext, viewport }).promise;

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
