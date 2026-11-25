/**
 * Show on one page only the units (and split-unit lines) the packer put there. Every page
 * renders the whole resume; the rest is hidden with display:none so it collapses out of flow.
 */
import { PATH_JOIN, findAnchor, isSectionAnchor, parseBlockUnitId, resolvePath } from "./splitBlocks";

export const ALL_UNIT_SELECTOR =
  '[data-item-id],[data-section-id],[data-section="personalInfo"]';

function nodeUnitId(node: HTMLElement): string | null {
  if (node.getAttribute("data-section") === "personalInfo") return "personalInfo";
  return (
    node.getAttribute("data-section-id") ?? node.getAttribute("data-item-id") ?? null
  );
}

function nearestAncestorSectionId(node: HTMLElement): string | null {
  let cur: HTMLElement | null = node.parentElement;
  while (cur) {
    const sec = cur.getAttribute("data-section");
    if (sec) return sec;
    cur = cur.parentElement;
  }
  return null;
}

/** Hide every unit node whose id is a known unit but not visible on this page.
 *  Also hide entire section wrappers (`[data-section=X]`) that have no visible
 *  units on this page, so unmarked residual content (empty-state placeholders,
 *  body paragraphs not wrapped in a marker) cannot leak onto other pages.
 *  Uses !important because some template CSS (e.g. atlantic-blue section headers)
 *  declares `display: flex !important`, which would override a plain inline none. */
/** Marks what applyPageVisibility hid, so the next pass can show it again (pages are reused). */
const HIDDEN_ATTR = "data-rx-page-hidden";

function hideOnPage(el: HTMLElement) {
  el.style.setProperty("display", "none", "important");
  el.setAttribute(HIDDEN_ATTR, "");
}

/**
 * A side column (a timeline's date) stays in the layout but blank: removing it would let the
 * main column slide into its narrow grid track and wrap into a tall strip.
 */
function blankOnPage(el: HTMLElement) {
  el.style.setProperty("visibility", "hidden", "important");
  el.setAttribute(HIDDEN_ATTR, "");
}

/** Lines of split units, grouped by the element they live in. */
function blockGroups(all: Set<string>, visible: Set<string>) {
  const groups = new Map<string, { paths: string[]; visible: Set<string> }>();
  for (const id of all) {
    const parsed = parseBlockUnitId(id);
    if (!parsed) continue;
    let g = groups.get(parsed.anchorKey);
    if (!g) groups.set(parsed.anchorKey, (g = { paths: [], visible: new Set() }));
    g.paths.push(parsed.path);
    if (visible.has(id)) g.visible.add(parsed.path);
  }
  return groups;
}

export function applyPageVisibility(root: HTMLElement, all: Set<string>, visible: Set<string>) {
  // Start from what React rendered: undo the previous pass (the page DOM is kept between
  // layouts now, so edits don't replace the field being typed in).
  for (const el of Array.from(root.querySelectorAll<HTMLElement>(`[${HIDDEN_ATTR}]`))) {
    el.style.removeProperty("display");
    el.style.removeProperty("visibility");
    el.removeAttribute(HIDDEN_ATTR);
  }
  // Sections that have at least one known unit (so we may safely toggle the wrapper)
  // and sections that have at least one visible unit on this page (keep their wrapper).
  const knownSections = new Set<string>();
  const visibleSections = new Set<string>();
  for (const node of Array.from(root.querySelectorAll(ALL_UNIT_SELECTOR)) as HTMLElement[]) {
    const id = nodeUnitId(node);
    if (!id || !all.has(id)) continue;
    const sec = nearestAncestorSectionId(node);
    if (!sec) continue;
    knownSections.add(sec);
    if (visible.has(id)) visibleSections.add(sec);
  }

  // Lines of units split across pages (a long job's bullets, a long summary).
  const groups = blockGroups(all, visible);
  const anchors = new Map<string, HTMLElement>();
  for (const [anchorKey, g] of groups) {
    const anchor = findAnchor(root, anchorKey);
    if (!anchor) continue;
    anchors.set(anchorKey, anchor);
    const sec = isSectionAnchor(anchorKey) ? anchor.getAttribute("data-section") : nearestAncestorSectionId(anchor);
    if (!sec) continue;
    knownSections.add(sec);
    if (g.visible.size > 0) visibleSections.add(sec);
  }

  // Hide entire known section wrappers with no visible units on this page.
  for (const sec of Array.from(root.querySelectorAll("[data-section]")) as HTMLElement[]) {
    const sid = sec.getAttribute("data-section");
    if (!sid || !knownSections.has(sid)) continue;
    if (!visibleSections.has(sid)) hideOnPage(sec);
  }

  // Within visible sections, hide individual marked units not on this page.
  for (const node of Array.from(root.querySelectorAll(ALL_UNIT_SELECTOR)) as HTMLElement[]) {
    const id = nodeUnitId(node);
    if (!id || !all.has(id)) continue;
    if (!visible.has(id)) hideOnPage(node);
  }

  // Split units: none of its lines here -> hide the whole element (and its spacing);
  // some -> hide just the lines that belong to other pages.
  for (const [anchorKey, g] of groups) {
    const anchor = anchors.get(anchorKey);
    if (!anchor) continue;
    if (g.visible.size === 0) {
      if (!isSectionAnchor(anchorKey)) hideOnPage(anchor);
      continue;
    }
    for (const path of g.paths) {
      if (g.visible.has(path)) continue;
      path.split(PATH_JOIN).forEach((part, i) => {
        const el = resolvePath(anchor, part);
        if (!(el instanceof HTMLElement)) return;
        if (i === 0) hideOnPage(el);
        else blankOnPage(el);
      });
    }
  }
}

