/**
 * Splitting a tall unit (a job's bullet list, a long custom section, a project card) into
 * the lines it's made of, so a page can break between bullets instead of pushing the whole
 * entry to the next page and leaving the first page half empty.
 *
 * A block is addressed by its anchor (an element the renderer marks: `data-item-id`, or a
 * `[data-section]` wrapper) plus a child-index path from that anchor. Every page renders the
 * same ResumeRenderer, so the path finds the same line on every page. Bodies set with
 * innerHTML (rich-text descriptions) can't carry markers of their own; paths need none.
 */

const SEP = "::";
const SECTION_PREFIX = "section:";
const PARENT_SUFFIX = "^";

/** Never split inside these: each is one line (or one visual group). */
const LEAF_TAGS = new Set([
  "LI", "P", "H1", "H2", "H3", "H4", "H5", "H6", "TABLE", "TR", "IMG", "SVG", "BLOCKQUOTE", "PRE",
  "SPAN", "A", "STRONG", "EM", "B", "I", "U", "BR", "INPUT", "TEXTAREA", "BUTTON",
]);

function heightOf(el: Element): number {
  return el.getBoundingClientRect().height;
}

/** Text sitting directly in `el` (not inside a child element) would show on every page if we split it. */
function hasOwnText(el: Element): boolean {
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === 3 && (node.textContent ?? "").trim()) return true;
  }
  return false;
}

/** May we split between `el`'s children? Only when they stack top to bottom (a column, not a row or grid). */
function canOpen(el: Element, exclude?: Element | null): boolean {
  if (LEAF_TAGS.has(el.tagName) || hasOwnText(el)) return false;
  const kids = Array.from(el.children).filter((c) => heightOf(c) > 0);
  if (kids.length === 0) return false;
  let prevBottom = -Infinity;
  for (const kid of kids) {
    const r = kid.getBoundingClientRect();
    // 1px tolerance for sub-pixel rounding; side-by-side children overlap vertically.
    if (r.top < prevBottom - 1 && kid !== exclude) return false;
    prevBottom = Math.max(prevBottom, r.bottom);
  }
  return true;
}

/** How tall `el`'s content is (a stretched flex/grid column is taller than what it holds). */
function contentHeight(el: Element): number {
  const kids = Array.from(el.children).filter((c) => heightOf(c) > 0);
  if (kids.length === 0 || hasOwnText(el)) return heightOf(el);
  let top = Infinity;
  let bottom = -Infinity;
  for (const kid of kids) {
    const r = kid.getBoundingClientRect();
    top = Math.min(top, r.top);
    bottom = Math.max(bottom, r.bottom);
  }
  return Math.max(0, bottom - top);
}

/**
 * A row with one tall column and short side columns (a timeline entry: date | details).
 * The tall column may break across pages; the side columns go with its first line.
 */
function splitRow(el: Element): { main: Element; side: Element[] } | null {
  if (LEAF_TAGS.has(el.tagName) || hasOwnText(el)) return null;
  const kids = Array.from(el.children).filter((c) => heightOf(c) > 0);
  if (kids.length < 2) return null;
  const sized = kids.map((k) => ({ k, h: contentHeight(k) })).sort((x, y) => y.h - x.h);
  const [main, ...rest] = sized;
  if (rest.some((r) => r.h > Math.max(120, main.h * 0.35))) return null;
  return { main: main.k, side: rest.map((r) => r.k) };
}

/**
 * The lines inside `el`, top to bottom. Lists give their items; stacked wrappers are opened
 * up; a row with one tall column gives that column's lines; other rows, grids, paragraphs
 * and anything holding loose text stay whole. `exclude` (a section header inside its
 * section) is left out. Each entry is one line: its first element is the line itself, any
 * others are side columns that show and hide with it. Returns [[el]] when nothing splits.
 */
export function collectBlockGroups(el: Element, exclude?: Element | null): Element[][] {
  const out: Element[][] = [];
  let pendingSide: Element[] = [];
  const push = (line: Element) => {
    out.push([line, ...pendingSide]);
    pendingSide = [];
  };
  const visit = (node: Element) => {
    for (const kid of Array.from(node.children)) {
      if (kid === exclude || heightOf(kid) === 0) continue;
      if ((exclude && kid.contains(exclude)) || canOpen(kid, exclude)) {
        visit(kid);
        continue;
      }
      const row = splitRow(kid);
      if (row && canOpen(row.main)) {
        pendingSide.push(...row.side);
        visit(row.main);
      } else push(kid);
    }
  };
  if (canOpen(el, exclude)) visit(el);
  else {
    const row = splitRow(el);
    if (!row || !canOpen(row.main)) return [[el]];
    pendingSide.push(...row.side);
    visit(row.main);
  }
  if (pendingSide.length && out.length) out[out.length - 1].push(...pendingSide);
  return out.length ? out : [[el]];
}

/** Just the lines (no side columns). */
export function collectBlocks(el: Element, exclude?: Element | null): Element[] {
  return collectBlockGroups(el, exclude).map((g) => g[0]);
}

export function pathFrom(anchor: Element, el: Element): string | null {
  const parts: number[] = [];
  let cur: Element | null = el;
  while (cur && cur !== anchor) {
    const parent: Element | null = cur.parentElement;
    if (!parent) return null;
    parts.unshift(Array.prototype.indexOf.call(parent.children, cur));
    cur = parent;
  }
  return cur === anchor ? parts.join(".") : null;
}

export function resolvePath(anchor: Element, path: string): Element | null {
  if (path === "") return anchor;
  let cur: Element | null = anchor;
  for (const part of path.split(".")) {
    cur = cur?.children[Number(part)] ?? null;
    if (!cur) return null;
  }
  return cur;
}

export function itemAnchorKey(itemId: string): string {
  return itemId;
}

/** The (unmarked) wrapper around a marked element, e.g. an entry around its "-header". */
export function parentAnchorKey(itemId: string): string {
  return `${itemId}${PARENT_SUFFIX}`;
}

export function sectionAnchorKey(sectionId: string): string {
  return `${SECTION_PREFIX}${sectionId}`;
}

/** Several elements that show and hide together (a line plus its side columns). */
export const PATH_JOIN = "+";

export function blockUnitId(anchorKey: string, path: string): string {
  return `${anchorKey}${SEP}${path}`;
}

export function parseBlockUnitId(id: string): { anchorKey: string; path: string } | null {
  const at = id.lastIndexOf(SEP);
  if (at <= 0) return null;
  return { anchorKey: id.slice(0, at), path: id.slice(at + SEP.length) };
}

export function findAnchor(root: ParentNode, anchorKey: string): HTMLElement | null {
  const css = (v: string) => (typeof CSS !== "undefined" && CSS.escape ? CSS.escape(v) : v.replace(/["\\]/g, "\\$&"));
  if (anchorKey.startsWith(SECTION_PREFIX)) {
    // The wrapper nearest the section's header, as when measuring (some templates nest two
    // wrappers with the same data-section; the outer one would give the wrong lines).
    const id = css(anchorKey.slice(SECTION_PREFIX.length));
    const header = root.querySelector<HTMLElement>(`[data-section-header][data-section-id="${id}"]`);
    return (
      (header?.parentElement?.closest<HTMLElement>("[data-section]") ?? null) ||
      root.querySelector<HTMLElement>(`[data-section="${id}"]`)
    );
  }
  if (anchorKey.endsWith(PARENT_SUFFIX)) {
    const child = root.querySelector<HTMLElement>(`[data-item-id="${css(anchorKey.slice(0, -PARENT_SUFFIX.length))}"]`);
    return child?.parentElement ?? null;
  }
  return root.querySelector<HTMLElement>(`[data-item-id="${css(anchorKey)}"]`);
}

export function isSectionAnchor(anchorKey: string): boolean {
  return anchorKey.startsWith(SECTION_PREFIX);
}

/**
 * Which lines glue to the next one, so a break never leaves an orphan:
 * a title stays with at least two lines under it, and the last line never starts a page alone.
 * `leadingGlue` is how many leading lines glue forward (1 when a separate header unit
 * already glues to the first line, 2 when the first line *is* the title).
 */
export function orphanGlue(count: number, leadingGlue: number): boolean[] {
  const glue = new Array<boolean>(count).fill(false);
  for (let i = 0; i < Math.min(leadingGlue, count - 1); i++) glue[i] = true;
  if (count >= 4) glue[count - 2] = true;
  return glue;
}
