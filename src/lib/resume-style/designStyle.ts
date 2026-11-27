/**
 * "Closest design": the look of someone's old resume, compared with each of our designs, so the
 * new-resume flow can put the nearest one first (and keep every other design on offer).
 *
 * Both sides are measured the same way: `analyzePagePixels` reads a small picture of a page
 * (the old resume's first page in the browser; each design's preview image once, offline, into
 * template-fingerprints.json). Pure functions, no AI here.
 */

export type DesignStyle = {
  columns: 1 | 2;
  sidebar: "none" | "left" | "right";
  /** Light text on a dark sidebar. */
  sidebarDark: boolean;
  /** Name/contact on a coloured full-width band. */
  headerBand: boolean;
  /** A portrait photo (null when unknown). */
  photo: boolean | null;
  /** Serif body font (null when unknown). */
  serif: boolean | null;
  /** Main colour besides black/grey, "#rrggbb"; null for a black-and-grey page. */
  accent: string | null;
};

export type PixelStyle = Pick<DesignStyle, "columns" | "sidebar" | "sidebarDark" | "headerBand" | "accent"> & {
  /** A clear empty strip down the middle of the body (two text columns without a coloured sidebar). */
  gutter: boolean;
};

const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;
const hex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");

/** RGBA pixels (any size; ~200–300 px wide is plenty) → layout and colour. */
export function analyzePagePixels(rgba: Uint8ClampedArray | Uint8Array, width: number, height: number): PixelStyle {
  const at = (x: number, y: number) => (y * width + x) * 4;
  const tinted = (i: number) => Math.min(rgba[i], rgba[i + 1], rgba[i + 2]) < 246;
  const inky = (i: number) => lum(rgba[i], rgba[i + 1], rgba[i + 2]) < 160;

  // Coloured column from an edge (full height, mostly filled): a sidebar.
  const colFill = new Float32Array(width);
  for (let x = 0; x < width; x++) {
    let n = 0;
    for (let y = 0; y < height; y++) if (tinted(at(x, y))) n++;
    colFill[x] = n / height;
  }
  const edgeRun = (from: number, step: 1 | -1) => {
    let x = from;
    const slack = Math.round(width * 0.04);
    while (Math.abs(x - from) < slack && colFill[x] <= 0.55) x += step; // a thin page border
    const start = x;
    while (x >= 0 && x < width && colFill[x] > 0.55) x += step;
    return { start, length: Math.abs(x - start) };
  };
  const left = edgeRun(0, 1);
  const right = edgeRun(width - 1, -1);
  const isSidebar = (len: number) => len >= width * 0.15 && len <= width * 0.5;
  let sidebar: PixelStyle["sidebar"] = "none";
  let sbFrom = 0;
  let sbTo = 0;
  if (isSidebar(left.length) && (!isSidebar(right.length) || left.length >= right.length)) {
    sidebar = "left";
    sbFrom = left.start;
    sbTo = left.start + left.length;
  } else if (isSidebar(right.length)) {
    sidebar = "right";
    sbFrom = right.start - right.length + 1;
    sbTo = right.start + 1;
  }
  let sidebarDark = false;
  if (sidebar !== "none") {
    let sum = 0;
    let n = 0;
    for (let y = 0; y < height; y += 2) {
      for (let x = sbFrom; x < sbTo; x += 2) {
        const i = at(x, y);
        if (!tinted(i)) continue;
        sum += lum(rgba[i], rgba[i + 1], rgba[i + 2]);
        n++;
      }
    }
    sidebarDark = n > 0 && sum / n < 120;
  }
  const bodyX0 = sidebar === "left" ? sbTo : 0;
  const bodyX1 = sidebar === "right" ? sbFrom : width;

  // Coloured band across the top: a header band.
  const rowFilled = (y: number) => {
    let n = 0;
    for (let x = bodyX0; x < bodyX1; x++) if (tinted(at(x, y))) n++;
    return n / Math.max(1, bodyX1 - bodyX0) > 0.55;
  };
  let y = 0;
  while (y < height * 0.04 && !rowFilled(y)) y++;
  const bandStart = y;
  while (y < height && rowFilled(y)) y++;
  const headerBand = y - bandStart >= height * 0.05 && y - bandStart <= height * 0.4;
  const headerEnd = headerBand ? y : 0;

  // Two text columns: an empty strip down the middle of the body with text on both sides.
  let gutter = false;
  if (sidebar === "none") {
    const y0 = Math.max(headerEnd, Math.round(height * 0.18));
    const y1 = Math.round(height * 0.92);
    const ink = new Float32Array(width);
    let total = 0;
    for (let x = bodyX0; x < bodyX1; x++) {
      let n = 0;
      for (let yy = y0; yy < y1; yy++) if (inky(at(x, yy))) n++;
      ink[x] = n / Math.max(1, y1 - y0);
      total += n;
    }
    const w = bodyX1 - bodyX0;
    const minGap = Math.max(2, Math.round(w * 0.02));
    let run = 0;
    for (let x = bodyX0 + Math.round(w * 0.3); x < bodyX0 + Math.round(w * 0.7); x++) {
      run = ink[x] < 0.002 ? run + 1 : 0;
      if (run >= minGap) {
        let leftInk = 0;
        for (let xx = bodyX0; xx < x - run; xx++) leftInk += ink[xx];
        let rightInk = 0;
        for (let xx = x + 1; xx < bodyX1; xx++) rightInk += ink[xx];
        const sum = leftInk + rightInk;
        if (total > 0 && sum > 0 && leftInk / sum > 0.25 && rightInk / sum > 0.25) {
          gutter = true;
          break;
        }
      }
    }
  }

  // Accent: the most common clearly coloured hue (not black, grey or white).
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  let marked = 0;
  for (let yy = 0; yy < height; yy += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = at(x, yy);
      if (tinted(i)) marked++;
      const r = rgba[i];
      const g = rgba[i + 1];
      const b = rgba[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max - min < 40 || max < 40 || min > 225) continue;
      let h = 0;
      if (max === r) h = ((g - b) / (max - min)) % 6;
      else if (max === g) h = (b - r) / (max - min) + 2;
      else h = (r - g) / (max - min) + 4;
      const key = Math.floor((((h * 60) + 360) % 360) / 30);
      const cur = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
      cur.n++;
      cur.r += r;
      cur.g += g;
      cur.b += b;
      buckets.set(key, cur);
    }
  }
  let best: { n: number; r: number; g: number; b: number } | null = null;
  for (const v of buckets.values()) if (!best || v.n > best.n) best = v;
  // a colour that's a real part of the page (headings, rules, blocks), not a stray link
  const accent = best && best.n / Math.max(1, marked) > 0.012 ? `#${hex(best.r / best.n)}${hex(best.g / best.n)}${hex(best.b / best.n)}` : null;

  return { columns: sidebar !== "none" || gutter ? 2 : 1, sidebar, sidebarDark, headerBand, accent, gutter };
}

/** "Garamond, 'Times New Roman', serif" → true; "Arial, sans-serif" → false; unknown → null. */
export function serifFromFontFamily(fontFamily: string | null | undefined): boolean | null {
  if (!fontFamily) return null;
  // The first family is the one that shows; the generic at the end is the fallback.
  const families = fontFamily.toLowerCase().split(",").map((f) => f.trim().replace(/^['"]|['"]$/g, ""));
  const SERIF = /times|georgia|garamond|cambria|book antiqua|palatino|merriweather|zilla|slab|baskerville|playfair|lora|^serif$/;
  const SANS = /helvetica|arial|calibri|segoe|roboto|lato|open sans|^inter$|verdana|trebuchet|source sans|^sans-serif$/;
  for (const f of families) {
    if (SERIF.test(f)) return true;
    if (SANS.test(f)) return false;
  }
  return null;
}

function hue(hexColor: string): number {
  const n = parseInt(hexColor.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  let h = 0;
  if (max === r) h = ((g - b) / (max - min)) % 6;
  else if (max === g) h = (b - r) / (max - min) + 2;
  else h = (r - g) / (max - min) + 4;
  return ((h * 60) + 360) % 360;
}

/** How alike two looks are (higher is closer). Layout weighs most, then colour, then font. */
export function designSimilarity(a: DesignStyle, b: DesignStyle): number {
  let s = 0;
  if (a.columns === b.columns) s += 3;
  if (a.sidebar === b.sidebar) s += 3;
  else if (a.sidebar !== "none" && b.sidebar !== "none") s += 1.5;
  if (a.sidebar !== "none" && b.sidebar !== "none" && a.sidebarDark === b.sidebarDark) s += 1;
  if (a.headerBand === b.headerBand) s += 1.5;
  if (a.photo !== null && b.photo !== null && a.photo === b.photo) s += 1;
  if (a.serif !== null && b.serif !== null && a.serif === b.serif) s += 1.5;
  if (!a.accent && !b.accent) s += 1.5;
  else if (a.accent && b.accent) {
    const d = Math.abs(hue(a.accent) - hue(b.accent));
    s += 2 * (1 - Math.min(d, 360 - d) / 180);
  }
  return s;
}

export type DesignMatch = { templateId: string; score: number };

/**
 * Designs ordered by closeness to the resume's look. Designs without a fingerprint keep their
 * place after the scored ones. Ties keep the incoming (popularity) order.
 */
export function rankDesigns(style: DesignStyle, templateIds: string[], fingerprints: Record<string, DesignStyle>): DesignMatch[] {
  return templateIds
    .map((templateId, index) => ({ templateId, index, score: fingerprints[templateId] ? designSimilarity(style, fingerprints[templateId]) : -1 }))
    .sort((x, y) => y.score - x.score || x.index - y.index)
    .map(({ templateId, score }) => ({ templateId, score }));
}

/**
 * The free reading, with the column count settled by the AI when it was asked (the only thing
 * the free reading can be unsure of). A coloured sidebar always means two columns.
 */
export function mergeDesignStyles(free: DesignStyle, ai: { columns?: 1 | 2 } | null): DesignStyle {
  if (!ai?.columns || free.sidebar !== "none") return free;
  return { ...free, columns: ai.columns };
}
