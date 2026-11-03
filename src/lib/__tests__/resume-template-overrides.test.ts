import { describe, expect, it } from "vitest";
import {
  applyConfigOverrides,
  applyCssOverrides,
  applyScopedCssOverrides,
  extractTemplatePalette,
  normalizeHex,
  remapCssColors,
  remapCssFont,
  sameFontFamily,
  withListOverrides,
} from "../resume-template-overrides";

describe("colour swaps", () => {
  it("normalizes hex colours", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex(" #2563EB ")).toBe("#2563eb");
    expect(normalizeHex("blue")).toBeNull();
    expect(normalizeHex("#12345")).toBeNull();
  });

  it("swaps every spelling of a colour, keeps !important, and never chains", () => {
    const css = ".a{color:#2563EB !important;border:1px solid #2563eb}.b{color:#FFF;background:#ffffff}.c{color:#111827}";
    const out = remapCssColors(css, { "#2563eb": "#e11d48", "#ffffff": "#111827", "#111827": "#000000" });
    expect(out).toBe(".a{color:#e11d48 !important;border:1px solid #e11d48}.b{color:#111827;background:#111827}.c{color:#000000}");
  });

  it("leaves alpha colours and longer tokens alone", () => {
    expect(remapCssColors(".a{color:#ffffff80;x:#fffffff}", { "#ffffff": "#000000" })).toBe(".a{color:#ffffff80;x:#fffffff}");
  });
});

describe("font swap", () => {
  const css = ".a{font-family:'Zilla Slab','Roboto Slab',serif !important}.b{font-family: Arial, sans-serif}.c{font-family:\"Zilla Slab\", serif;}";

  it("replaces only declarations that start with the template's main font", () => {
    const out = remapCssFont(css, "'Zilla Slab', serif", "'Lato', sans-serif");
    expect(out).toBe(".a{font-family: 'Lato', sans-serif !important}.b{font-family: Arial, sans-serif}.c{font-family: 'Lato', sans-serif;}");
  });

  it("does nothing when the font doesn't change", () => {
    expect(remapCssFont(css, "'Zilla Slab', serif", "\"Zilla Slab\", Georgia")).toBe(css);
    expect(sameFontFamily("'Zilla Slab', serif", "Zilla Slab")).toBe(true);
  });

  it("applies colours and font together", () => {
    expect(applyCssOverrides(".a{color:#000;font-family:Arial}", { palette: { "#000000": "#123456" }, fontFamily: "Georgia, serif" }, "Arial, sans-serif"))
      .toBe(".a{color:#123456;font-family: Georgia, serif}");
  });

  it("edits only the rules of the edited template in a shared stylesheet", () => {
    const shared = ".royal-indigo-template h2{color:#5b3fa0}\n.saffron-line-template h2{color:#5b3fa0}\n@media print{.royal-indigo-template p{color:#5b3fa0}}";
    const out = applyScopedCssOverrides(shared, "royal-indigo", { palette: { "#5b3fa0": "#0f766e" } }, null);
    expect(out).toBe(".royal-indigo-template h2{color:#0f766e}\n.saffron-line-template h2{color:#5b3fa0}\n@media print{.royal-indigo-template p{color:#0f766e}}");
  });
});

describe("applyConfigOverrides", () => {
  const config = {
    template: {
      id: "classic",
      name: "Classic",
      category: "simple",
      description: "Old",
      colors: { primary: "#000000", accent: "#333333" },
      layout: { fontFamily: "'Zilla Slab', serif", fontSize: { heading: 30, subheading: 16, body: 14.5 } },
    },
    extended: {
      style: {
        fontFamily: "'Zilla Slab', serif",
        fontSize: { heading: 30, subheading: 16, body: 14.5, small: 12.5 },
        lineHeight: 1.4,
        colors: { primary: "#000000", text: "#000000" },
        padding: { top: 8, bottom: 8, left: 8, right: 8 },
        sectionHeader: { fontSize: 16, borderColor: "#000000" },
      },
      rendering: { layout: { type: "double", columnWidths: { left: 40, right: 60 } } },
    },
  };

  it("returns the same object when nothing is edited", () => {
    expect(applyConfigOverrides(config, null)).toBe(config);
    expect(applyConfigOverrides(config, {})).toBe(config);
  });

  it("applies every edit without touching the original", () => {
    const out = applyConfigOverrides(config, {
      name: "Classic Pro",
      category: "modern",
      description: "New",
      palette: { "#000000": "#1e3a8a" },
      fontFamily: "'Lato', sans-serif",
      fontSize: { heading: 28, small: 11, sectionHeader: 14 },
      lineHeight: 1.5,
      sectionSpacing: 0,
      padding: { top: 10 },
      columnWidths: { left: 35, right: 65 },
    });
    expect(out.template).toMatchObject({ name: "Classic Pro", category: "modern", description: "New", colors: { primary: "#1e3a8a", accent: "#333333" } });
    expect(out.template.layout).toMatchObject({ fontFamily: "'Lato', sans-serif", fontSize: { heading: 28, subheading: 16, body: 14.5 } });
    expect(out.extended.style).toMatchObject({
      fontFamily: "'Lato', sans-serif",
      lineHeight: 1.5,
      sectionSpacing: 0,
      fontSize: { heading: 28, subheading: 16, body: 14.5, small: 11 },
      colors: { primary: "#1e3a8a", text: "#1e3a8a" },
      padding: { top: 10, bottom: 8, left: 8, right: 8 },
      sectionHeader: { fontSize: 14, borderColor: "#1e3a8a" },
    });
    expect(out.extended.rendering).toEqual({ layout: { type: "double", columnWidths: { left: 35, right: 65 } } });
    expect((out.extended as Record<string, unknown>).appliedOverrides).toMatchObject({ name: "Classic Pro" });
    expect(config.template.name).toBe("Classic");
    expect(config.extended.style.colors.primary).toBe("#000000");
  });
});

describe("extractTemplatePalette", () => {
  it("lists brand colours first, with their config roles and use counts", () => {
    const palette = extractTemplatePalette(".a{color:#2563eb}.b{color:#2563EB}.c{color:#111827;background:#fff}.d{color:#ffffff80}", {
      accent: "#2563eb",
      text: "#111827",
    });
    expect(palette.map((p) => p.hex)).toEqual(["#2563eb", "#111827", "#ffffff"]);
    expect(palette[0]).toMatchObject({ uses: 3, roles: ["accent"], neutral: false });
    expect(palette[1]).toMatchObject({ roles: ["text"], neutral: true });
  });
});

describe("withListOverrides", () => {
  it("renames and recategorizes list items of any shape", () => {
    const overrides = { classic: { name: "Classic Pro", category: "modern" as const, description: "New" } };
    expect(withListOverrides({ id: "classic", name: "Classic", category: "simple", shortDescription: "Old" }, overrides)).toEqual({
      id: "classic",
      name: "Classic Pro",
      category: "modern",
      shortDescription: "New",
    });
    const item = { id: "harvard", name: "Harvard" };
    expect(withListOverrides(item, overrides)).toBe(item);
  });
});
