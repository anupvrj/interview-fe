/**
 * Super Admin edits to a resume template, laid over the template code.
 *
 * - name / category / description: what every template list shows.
 * - palette: each of the template's own colours (as written in its CSS and config) → a new
 *   colour. Swapped everywhere the colour appears, so `!important` CSS follows too.
 * - fontFamily: replaces the template's main font in its CSS and config.
 * - fontSize / lineHeight / padding / columnWidths: the starting typography and spacing a
 *   resume gets when it's created on (or switched to) this template.
 *
 * Mirrors interview-core/src/services/resumeTemplates/resumeTemplateOverrides.ts.
 */

export type TemplateCategory = "simple" | "modern" | "creative";

export interface ResumeTemplateOverrides {
  name?: string;
  category?: TemplateCategory;
  description?: string;
  palette?: Record<string, string>;
  fontFamily?: string;
  fontSize?: { heading?: number; subheading?: number; body?: number; small?: number; sectionHeader?: number };
  lineHeight?: number;
  /** Space between sections (px). Resumes don't keep their own, so every resume follows it. */
  sectionSpacing?: number;
  padding?: { top?: number; right?: number; bottom?: number; left?: number };
  columnWidths?: { left: number; right: number };
}

/**
 * Settings the resume editor forces for a template every time a resume opens, so the admin
 * editor shows them as fixed (mirrors FIXED_TEMPLATE_SETTINGS in interview-core).
 */
export const FIXED_TEMPLATE_SETTINGS: Readonly<Record<string, { columnWidths?: true; sideMarginsMm?: number }>> = {
  "saffron-line": { columnWidths: true },
  "confident-grid": { columnWidths: true },
  mercury: { sideMarginsMm: 20 },
};

/** Published edits carry the revision they were saved as. */
export type PublishedTemplateOverrides = ResumeTemplateOverrides & { revision: number };

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  simple: "Popular",
  modern: "Modern",
  creative: "Creative",
};

/** Fonts a template can use: the same list resume owners pick from in the editor. */
export const RESUME_FONT_OPTIONS: { value: string; label: string }[] = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "'Zilla Slab', serif", label: "Zilla Slab" },
  { value: "'Open Sans', sans-serif", label: "Open Sans" },
  { value: "'Lato', sans-serif", label: "Lato" },
  { value: "'Roboto', sans-serif", label: "Roboto" },
  { value: "'Source Sans 3', sans-serif", label: "Source Sans 3" },
  { value: "'Merriweather', serif", label: "Merriweather" },
  { value: "'PT Sans', sans-serif", label: "PT Sans" },
];

/** "#ABC" / "#aabbcc" → "#aabbcc"; anything else → null. */
export function normalizeHex(value: string | null | undefined): string | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(value ?? "").trim());
  if (!m) return null;
  const hex = m[1].toLowerCase();
  return `#${hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex}`;
}

/** First family of a font stack, unquoted and lower-cased: "'Zilla Slab', serif" → "zilla slab". */
export function primaryFontFamily(stack: string | null | undefined): string {
  return String(stack ?? "").split(",")[0]?.trim().replace(/^['"]|['"]$/g, "").toLowerCase() ?? "";
}

export function sameFontFamily(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = primaryFontFamily(a);
  return x.length > 0 && x === primaryFontFamily(b);
}

const HEX_TOKEN = /#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})(?![0-9a-f])/gi;

/** Swap colours in one pass (so A→B and B→C never chain). 8-digit (alpha) colours are left alone. */
export function remapCssColors(css: string, palette: Record<string, string> | undefined): string {
  if (!palette || Object.keys(palette).length === 0) return css;
  return css.replace(HEX_TOKEN, (token, digits: string) => {
    if (digits.length === 8) return token;
    const key = normalizeHex(token);
    const next = key ? palette[key] : undefined;
    return next ?? token;
  });
}

export function remapColor(value: string, palette: Record<string, string> | undefined): string {
  const key = normalizeHex(value);
  return (key && palette?.[key]) || value;
}

/** Every `font-family:` whose first family is the template's main font gets the new stack. */
export function remapCssFont(css: string, fromStack: string | null | undefined, toStack: string | undefined): string {
  if (!toStack || !fromStack || sameFontFamily(fromStack, toStack)) return css;
  const from = primaryFontFamily(fromStack);
  if (!from) return css;
  return css.replace(/font-family\s*:\s*([^;}]+)/gi, (decl, value: string) => {
    const important = /!important/i.test(value);
    const stack = value.replace(/!important/i, "").trim();
    if (primaryFontFamily(stack) !== from) return decl;
    return `font-family: ${toStack}${important ? " !important" : ""}`;
  });
}

/** The template's stylesheet with the colour and font edits applied. */
export function applyCssOverrides(
  css: string,
  overrides: ResumeTemplateOverrides | null | undefined,
  baseFontFamily: string | null | undefined,
): string {
  if (!overrides) return css;
  return remapCssFont(remapCssColors(css, overrides.palette), baseFontFamily, overrides.fontFamily);
}

/**
 * Only the rules of a shared stylesheet that belong to `templateId` (their selector names the
 * template, e.g. `.royal-indigo-template …`) get the edits; other templates' rules stay as written.
 */
export function applyScopedCssOverrides(
  css: string,
  templateId: string,
  overrides: ResumeTemplateOverrides | null | undefined,
  baseFontFamily: string | null | undefined,
): string {
  if (!overrides || (!overrides.palette && !overrides.fontFamily)) return css;
  return css.replace(/([^{}]+)\{([^{}]*)\}/g, (rule, selector: string, body: string) =>
    selector.includes(templateId) ? `${selector}{${applyCssOverrides(body, overrides, baseFontFamily)}}` : rule,
  );
}

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => Boolean(v) && typeof v === "object" && !Array.isArray(v);

function remapColorMap<T extends Rec | undefined>(colors: T, palette: Record<string, string> | undefined): T {
  if (!colors || !palette) return colors;
  return Object.fromEntries(
    Object.entries(colors).map(([k, v]) => [k, typeof v === "string" ? remapColor(v, palette) : v]),
  ) as T;
}

/**
 * A template config (`{ template, extended }`, as the template code exports it) with the edits
 * applied. Pure: the input is not changed. `overrides` is kept on `extended.appliedOverrides`
 * so the renderer can apply the same edits to its own template CSS.
 */
export function applyConfigOverrides<C extends { template: object; extended: object }>(
  config: C,
  overrides: ResumeTemplateOverrides | null | undefined,
): C {
  if (!overrides || Object.keys(overrides).length === 0) return config;
  const palette = overrides.palette;
  const template: Rec = { ...config.template };
  const extended: Rec = { ...config.extended };

  if (overrides.name) template.name = overrides.name;
  if (overrides.category) template.category = overrides.category;
  if (overrides.description) template.description = overrides.description;
  if (isRec(template.colors)) template.colors = remapColorMap(template.colors, palette);
  if (isRec(template.layout)) {
    const layout = { ...template.layout };
    if (overrides.fontFamily) layout.fontFamily = overrides.fontFamily;
    if (overrides.sectionSpacing !== undefined) layout.sectionSpacing = overrides.sectionSpacing;
    if (overrides.fontSize && isRec(layout.fontSize)) {
      layout.fontSize = {
        ...layout.fontSize,
        ...pick(overrides.fontSize, ["heading", "subheading", "body"]),
      };
    }
    template.layout = layout;
  }

  if (isRec(extended.style)) {
    const style = { ...extended.style };
    if (isRec(style.colors)) style.colors = remapColorMap(style.colors, palette);
    if (overrides.fontFamily) style.fontFamily = overrides.fontFamily;
    if (overrides.lineHeight) style.lineHeight = overrides.lineHeight;
    if (overrides.sectionSpacing !== undefined) style.sectionSpacing = overrides.sectionSpacing;
    if (overrides.fontSize) {
      style.fontSize = { ...(isRec(style.fontSize) ? style.fontSize : {}), ...pick(overrides.fontSize, ["heading", "subheading", "body", "small"]) };
      if (overrides.fontSize.sectionHeader && isRec(style.sectionHeader)) {
        style.sectionHeader = { ...style.sectionHeader, fontSize: overrides.fontSize.sectionHeader };
      }
    }
    if (overrides.padding) style.padding = { ...(isRec(style.padding) ? style.padding : {}), ...overrides.padding };
    if (palette && isRec(style.sectionHeader)) {
      style.sectionHeader = remapColorMap(style.sectionHeader, palette);
    }
    extended.style = style;
  }

  if (overrides.columnWidths && isRec(extended.rendering) && isRec(extended.rendering.layout)) {
    extended.rendering = {
      ...extended.rendering,
      layout: { ...extended.rendering.layout, columnWidths: { ...overrides.columnWidths } },
    };
  }

  extended.appliedOverrides = overrides;
  return { ...config, template, extended };
}

function pick<T extends Rec>(source: T, keys: string[]): Partial<T> {
  return Object.fromEntries(Object.entries(source).filter(([k, v]) => keys.includes(k) && typeof v === "number")) as Partial<T>;
}

export type PaletteColor = {
  hex: string;
  /** How many times the colour appears in the CSS and config. */
  uses: number;
  /** Config names that hold this colour ("primary", "sidebarBackground"…). */
  roles: string[];
  /** Greys, black and white. */
  neutral: boolean;
};

function isNeutral(hex: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return Math.max(r, g, b) - Math.min(r, g, b) < 24;
}

/** The template's colours: every 3/6-digit hex in its CSS plus its config colours, most used first. */
export function extractTemplatePalette(css: string, configColors: Rec | null | undefined): PaletteColor[] {
  const found = new Map<string, PaletteColor>();
  const add = (hex: string, role?: string) => {
    const entry = found.get(hex) ?? { hex, uses: 0, roles: [], neutral: isNeutral(hex) };
    entry.uses += 1;
    if (role && !entry.roles.includes(role)) entry.roles.push(role);
    found.set(hex, entry);
  };
  for (const m of css.matchAll(HEX_TOKEN)) {
    if (m[1].length === 8) continue;
    const hex = normalizeHex(m[0]);
    if (hex) add(hex);
  }
  for (const [role, value] of Object.entries(configColors ?? {})) {
    const hex = typeof value === "string" ? normalizeHex(value) : null;
    if (hex) add(hex, role);
  }
  return [...found.values()].sort(
    (a, b) => Number(a.neutral) - Number(b.neutral) || b.roles.length - a.roles.length || b.uses - a.uses,
  );
}

/** Name / category / description edits for a list item, whatever shape the list uses. */
export function withListOverrides<T extends { id: string }>(
  item: T,
  overrides: Record<string, ResumeTemplateOverrides> | null | undefined,
): T {
  const o = overrides?.[item.id];
  if (!o || (!o.name && !o.category && !o.description)) return item;
  const next: Rec = { ...item };
  if (o.name && "name" in next) next.name = o.name;
  if (o.category && "category" in next) next.category = o.category;
  if (o.description) {
    if ("description" in next) next.description = o.description;
    if ("shortDescription" in next) next.shortDescription = o.description;
  }
  return next as T;
}
