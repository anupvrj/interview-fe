import { describe, expect, it } from "vitest";
import { analyzePagePixels, mergeDesignStyles, rankDesigns, serifFromFontFamily, type DesignStyle } from "../designStyle";
import { textColumnsFromItems, serifFromItems } from "../pdfDesign";
import fingerprints from "../template-fingerprints.json";

const W = 200;
const H = 280;

/** A white page; paint(x, y) returns a colour for that pixel or null for white. */
function page(paint: (x: number, y: number) => [number, number, number] | null) {
  const px = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = paint(x, y) ?? [255, 255, 255];
      const i = (y * W + x) * 4;
      px[i] = c[0];
      px[i + 1] = c[1];
      px[i + 2] = c[2];
      px[i + 3] = 255;
    }
  }
  return px;
}

/** Text lines: thin dark rows every 6 px between x0 and x1, from y0 down. */
const text = (x: number, y: number, x0: number, x1: number, y0 = 30) => x >= x0 && x < x1 && y >= y0 && y % 6 === 0;
const BLACK: [number, number, number] = [30, 30, 30];

describe("analyzePagePixels", () => {
  it("finds a dark left sidebar (two columns)", () => {
    const s = analyzePagePixels(page((x, y) => (x < 60 ? [44, 62, 80] : text(x, y, 75, 190) ? BLACK : null)), W, H);
    expect(s).toMatchObject({ sidebar: "left", sidebarDark: true, columns: 2 });
  });

  it("finds a light right sidebar", () => {
    const s = analyzePagePixels(page((x, y) => (x >= 140 ? [236, 240, 241] : text(x, y, 10, 130) ? BLACK : null)), W, H);
    expect(s).toMatchObject({ sidebar: "right", sidebarDark: false, columns: 2 });
  });

  it("finds a coloured header band", () => {
    const s = analyzePagePixels(page((x, y) => (y < 40 ? [31, 58, 95] : text(x, y, 10, 190, 50) ? BLACK : null)), W, H);
    expect(s.headerBand).toBe(true);
    expect(s.sidebar).toBe("none");
  });

  it("two text columns with an empty strip between them", () => {
    const s = analyzePagePixels(page((x, y) => (text(x, y, 10, 90) || text(x, y, 110, 190) ? BLACK : null)), W, H);
    expect(s).toMatchObject({ gutter: true, columns: 2, sidebar: "none" });
  });

  it("one column of full-width text", () => {
    const s = analyzePagePixels(page((x, y) => (text(x, y, 10, 190) ? BLACK : null)), W, H);
    expect(s).toMatchObject({ gutter: false, columns: 1, sidebar: "none", headerBand: false, accent: null });
  });

  it("picks up a coloured accent (headings, rules) but not black text", () => {
    const s = analyzePagePixels(page((x, y) => (y % 40 === 0 && x > 10 && x < 190 ? [44, 95, 200] : text(x, y, 10, 190) ? BLACK : null)), W, H);
    expect(s.accent).toMatch(/^#/);
    const n = parseInt(s.accent!.slice(1), 16);
    expect(n & 255).toBeGreaterThan((n >> 16) & 255); // blue-ish
  });
});

describe("serifFromFontFamily", () => {
  it("reads the family that shows, not the fallback", () => {
    expect(serifFromFontFamily("Garamond, 'Times New Roman', serif")).toBe(true);
    expect(serifFromFontFamily("'Zilla Slab', 'Roboto Slab', Rockwell, serif")).toBe(true);
    expect(serifFromFontFamily("Calibri, 'Segoe UI', Arial, sans-serif")).toBe(false);
    expect(serifFromFontFamily("Wingdings")).toBeNull();
    expect(serifFromFontFamily(undefined)).toBeNull();
  });
});

const ids = Object.keys(fingerprints);
const fp = fingerprints as Record<string, DesignStyle>;

describe("rankDesigns (with the real design fingerprints)", () => {
  it("a dark left sidebar resume → the dark-sidebar design first", () => {
    const style: DesignStyle = { columns: 2, sidebar: "left", sidebarDark: true, headerBand: false, photo: false, serif: true, accent: null };
    expect(rankDesigns(style, ids, fp)[0].templateId).toBe("atlantic-blue");
  });

  it("a plain black serif one-column resume → a classic serif design first", () => {
    const style: DesignStyle = { columns: 1, sidebar: "none", sidebarDark: false, headerBand: false, photo: false, serif: true, accent: null };
    expect(["classic", "corporate", "executive", "harvard"]).toContain(rankDesigns(style, ids, fp)[0].templateId);
  });

  it("a header band + two columns + photo → the tinted-header grid first", () => {
    const style: DesignStyle = { columns: 2, sidebar: "none", sidebarDark: false, headerBand: true, photo: true, serif: false, accent: null };
    expect(rankDesigns(style, ids, fp)[0].templateId).toBe("confident-grid");
  });

  it("keeps the given order for ties and puts designs without a fingerprint last", () => {
    const style: DesignStyle = { columns: 1, sidebar: "none", sidebarDark: false, headerBand: false, photo: false, serif: false, accent: null };
    const ranked = rankDesigns(style, ["unknown-design", "condensed-rule", "meridian"], fp);
    expect(ranked.map((r) => r.templateId)).toEqual(["condensed-rule", "meridian", "unknown-design"]);
  });

  it("every design on offer has a fingerprint", () => {
    expect(ids.length).toBeGreaterThanOrEqual(17);
  });
});

describe("mergeDesignStyles", () => {
  const free: DesignStyle = { columns: 1, sidebar: "none", sidebarDark: false, headerBand: false, photo: true, serif: true, accent: "#112233" };
  it("the AI settles only the column count", () => {
    expect(mergeDesignStyles(free, { columns: 2 })).toEqual({ ...free, columns: 2 });
    expect(mergeDesignStyles(free, null)).toBe(free);
  });
  it("a coloured sidebar always stays two columns", () => {
    const withSidebar: DesignStyle = { ...free, columns: 2, sidebar: "left" };
    expect(mergeDesignStyles(withSidebar, { columns: 1 })).toBe(withSidebar);
  });
});

describe("reading the PDF text layer", () => {
  const PW = 600;
  const PH = 800;
  const item = (x: number, y: number, width: number, str = "Some resume text here", fontName = "f1") => ({ str, width, transform: [10, 0, 0, 10, x, y], fontName });

  it("side-by-side text blocks → two columns", () => {
    const items = Array.from({ length: 20 }, (_, i) => [item(40, 600 - i * 20, 200), item(320, 600 - i * 20, 220)]).flat();
    expect(textColumnsFromItems(items, PW, PH)).toBe(2);
  });

  it("full-width lines with right-aligned dates → one column", () => {
    const items = Array.from({ length: 20 }, (_, i) => [item(40, 600 - i * 20, 380), item(500, 600 - i * 20, 60, "2021 – 2023")]).flat();
    expect(textColumnsFromItems(items, PW, PH)).toBe(1);
  });

  it("serif when most characters are in a serif font", () => {
    const items = [item(40, 600, 300, "A long line of body text in the serif font", "s"), item(40, 580, 50, "Name", "x")];
    expect(serifFromItems(items, { s: { fontFamily: "serif" }, x: { fontFamily: "sans-serif" } })).toBe(true);
    expect(serifFromItems([item(40, 600, 30, "Hi", "s")], { s: { fontFamily: "serif" } })).toBeNull();
  });
});
