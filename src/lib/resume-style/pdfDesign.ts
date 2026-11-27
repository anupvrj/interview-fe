/**
 * The look of an uploaded resume (first page), read in the browser for free: a small render for
 * colours, sidebar and header band; the text layer for columns and serif; the drawing commands
 * for a photo. `confident` is false when the text and the picture disagree on the layout — only
 * then does the caller ask the AI (one small picture, see /resumes/design-features).
 */
import { openPdfDocument } from "@/lib/pdf-utils";
import { analyzePagePixels, type DesignStyle } from "./designStyle";

const ANALYSIS_WIDTH = 240;
const AI_IMAGE_WIDTH = 512;

type TextItem = { str?: string; width?: number; transform?: number[]; fontName?: string };

export type ResumeDesignReading = {
  style: DesignStyle;
  /** Text and picture agree on the layout (no need to ask the AI). */
  confident: boolean;
  /** Small JPEG of page 1 for the AI, made only when not confident. */
  image: string | null;
};

/** Lines whose text is split into two side-by-side blocks → two columns. */
export function textColumnsFromItems(items: TextItem[], pageWidth: number, pageHeight: number): 1 | 2 {
  const lines = new Map<number, { x: number; end: number }[]>();
  for (const item of items) {
    const t = item.transform;
    if (!t || !item.str?.trim()) continue;
    const y = t[5];
    if (y < pageHeight * 0.08 || y > pageHeight * 0.82) continue; // body only (PDF y grows upward)
    const key = Math.round(y / 3);
    const list = lines.get(key) ?? [];
    list.push({ x: t[4], end: t[4] + (item.width ?? 0) });
    lines.set(key, list);
  }
  let counted = 0;
  let split = 0;
  for (const list of lines.values()) {
    list.sort((a, b) => a.x - b.x);
    counted++;
    // blocks on the line, split where the gap is wide
    const blocks: { x: number; end: number }[] = [];
    for (const piece of list) {
      const last = blocks[blocks.length - 1];
      if (last && piece.x - last.end < pageWidth * 0.04) last.end = Math.max(last.end, piece.end);
      else blocks.push({ ...piece });
    }
    // a second block that starts mid-page and is wide (not a right-aligned date)
    if (blocks.some((b, i) => i > 0 && b.x > pageWidth * 0.33 && b.x < pageWidth * 0.72 && b.end - b.x > pageWidth * 0.15)) split++;
  }
  return counted >= 8 && split / counted > 0.3 ? 2 : 1;
}

/** Serif when most of the text (by characters) is set in a font pdf.js reads as serif. */
export function serifFromItems(items: TextItem[], styles: Record<string, { fontFamily?: string }>): boolean | null {
  let serif = 0;
  let sans = 0;
  for (const item of items) {
    const n = item.str?.trim().length ?? 0;
    if (!n || !item.fontName) continue;
    const family = styles[item.fontName]?.fontFamily ?? "";
    if (family === "serif") serif += n;
    else if (family === "sans-serif") sans += n;
  }
  if (serif + sans < 40) return null;
  return serif > sans;
}

export async function readResumeDesign(file: File): Promise<ResumeDesignReading> {
  const pdf = await openPdfDocument(file);
  try {
    const page = await pdf.getPage(1);
    const base = page.getViewport({ scale: 1 });

    const render = async (width: number) => {
      const viewport = page.getViewport({ scale: width / base.width });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("No canvas");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
      return { canvas, ctx };
    };

    const [{ canvas, ctx }, text, ops, pdfjs] = await Promise.all([
      render(ANALYSIS_WIDTH),
      page.getTextContent(),
      page.getOperatorList(),
      import("pdfjs-dist/legacy/build/pdf.mjs"),
    ]);
    const pixels = analyzePagePixels(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
    const items = text.items as TextItem[];
    const textColumns = textColumnsFromItems(items, base.width, base.height);
    const serif = serifFromItems(items, text.styles as Record<string, { fontFamily?: string }>);

    // a portrait-sized picture on the page → a photo (icons and logos are small or wide)
    let photo = false;
    const IMAGE_OPS = new Set([pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintInlineImageXObject]);
    ops.fnArray.forEach((fn, i) => {
      if (!IMAGE_OPS.has(fn)) return;
      const args = ops.argsArray[i] as unknown[];
      const w = Number(args?.[1] ?? (args?.[0] as { width?: number } | undefined)?.width);
      const h = Number(args?.[2] ?? (args?.[0] as { height?: number } | undefined)?.height);
      if (w >= 80 && h >= 80 && w / h > 0.6 && w / h < 1.7) photo = true;
    });

    const style: DesignStyle = {
      columns: pixels.columns === 2 || textColumns === 2 ? 2 : 1,
      sidebar: pixels.sidebar,
      sidebarDark: pixels.sidebarDark,
      headerBand: pixels.headerBand,
      photo,
      serif,
      accent: pixels.accent,
    };
    // A coloured sidebar is unmistakable; otherwise the text layer and the picture must agree.
    const confident = pixels.sidebar !== "none" || pixels.columns === textColumns;
    let image: string | null = null;
    if (!confident) {
      const big = await render(AI_IMAGE_WIDTH);
      image = big.canvas.toDataURL("image/jpeg", 0.6);
    }
    return { style, confident, image };
  } finally {
    void pdf.destroy();
  }
}
