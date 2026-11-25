/**
 * Unit-boundary pagination for the resume preview/PDF.
 *
 * The preview renders the *intact* ResumeRenderer once (hidden) for measurement,
 * then renders the whole renderer again per visible page inside an overflow:hidden
 * clip translated by -offsetY. Because the renderer is whole on every page,
 * container-spanning CSS (timeline rails, grids, sidebar backgrounds) is preserved
 * by construction. The only job of this module is to decide WHERE the cut falls:
 * on whole atomic-unit boundaries (section headers, items, item body blocks),
 * never mid-line.
 *
 * See ~/.cursor/plans/resume_pagination_revamp_eb5cfa71.plan.md for the approach
 * and why the previous renderer-decomposition attempt was abandoned.
 */

export type UnitKind = "header" | "item" | "body-block" | "atomic-if-fits";

export type UnitColumn = "left" | "right" | "single";

export interface MeasuredUnit {
  /** Stable id from the renderer's data-item-id / data-section-header / data-item-body-block marker. */
  id: string;
  kind: UnitKind;
  /** Nearest [data-section=...] ancestor id, or "" if none. */
  sectionId: string;
  column: UnitColumn;
  /** Render-document Y offsets (px) relative to the measure container. */
  top: number;
  bottom: number;
  height: number;
  /** Glue this unit to the next unit (section/item headers). */
  keepWithNext: boolean;
  /** Keep on one page when height <= page budget; else move to a fresh page. */
  atomicIfFits?: boolean;
  /** The resume header (personalInfo) rendered once on page 1; excluded from packing. */
  isPageHeader?: boolean;
}

export interface BuildMeasuredUnitsResult {
  units: MeasuredUnit[];
  /** Height (px) of the [data-section="personalInfo"] header region, 0 if absent. */
  headerHeight: number;
  /** Per-column packing budget (px, unscaled). The packer must keep each column's
   *  unit Y-span within this so the page doesn't overflow. Computed from the measure
   *  DOM as `pageHeightLimit - firstUnitTop - columnPadBottom`, which automatically
   *  accounts for the page padding, any full-width header above the columns (e.g.
   *  Saffron Line personalInfo), the header→column gap, and the column's own padding. */
  columnBudgets: Record<UnitColumn, number>;
  /** The same for pages after the first, where the page-1 header (name band) isn't shown:
   *  a full-width header above the columns no longer takes room there. */
  laterColumnBudgets: Record<UnitColumn, number>;
}

import {
  PATH_JOIN,
  blockUnitId,
  collectBlockGroups,
  itemAnchorKey,
  orphanGlue,
  parentAnchorKey,
  pathFrom,
  sectionAnchorKey,
} from "./splitBlocks";

const HEADER_SUFFIX = "-header";
const BODY_SUFFIX = "-body";

function nearestAncestor(node: HTMLElement, selector: string): HTMLElement | null {
  let cur: HTMLElement | null = node.parentElement;
  while (cur) {
    if (cur.matches(selector)) return cur;
    cur = cur.parentElement;
  }
  return null;
}

function resolveColumn(node: HTMLElement): UnitColumn {
  if (nearestAncestor(node, "[data-resume-left-column]")) return "left";
  if (nearestAncestor(node, "[data-resume-right-column]")) return "right";
  return "single";
}

function rectToContainerY(
  node: HTMLElement,
  containerTop: number,
  scale: number,
) {
  const r = node.getBoundingClientRect();
  // getBoundingClientRect() returns post-transform (screen) coords. The measure
  // container's ancestor applies a zoom transform: scale(z), so screen deltas are
  // scaled by z. pageLimit is in unscaled layout px, so divide deltas by z to put
  // unit top/bottom into the same (unscaled) coordinate system as the page budget.
  const top = Math.floor((r.top - containerTop) / scale);
  const bottom = Math.ceil((r.bottom - containerTop) / scale);
  return { top, bottom, height: Math.max(0, bottom - top) };
}

/**
 * Walk the hidden full ResumeRenderer render and emit a flat, non-overlapping
 * MeasuredUnit[] in document order, plus the page-1 header height.
 *
 * Granularity:
 *  - [data-section-header] -> header unit (keepWithNext)
 *  - [data-item-id="X-header"] + [data-item-id="X-body"] -> item header (keepWithNext) + body unit
 *    (the bare wrapper [data-item-id="X"] is dropped to avoid overlap)
 *  - [data-item-body-block] (additive, optional) -> splits an item body into paragraph/li blocks
 *  - [data-item-id] without -header/-body sub-markers -> leaf item unit (skills/languages/awards/...)
 *  - [data-pagination-atomic-if-fits] -> atomic-if-fits unit
 *  - [data-section="personalInfo"] -> page header region (measured, excluded from packing)
 */
export function buildMeasuredUnits(
  measureRoot: HTMLElement,
  pageHeightLimit: number,
): BuildMeasuredUnitsResult {
  const containerRect = measureRoot.getBoundingClientRect();
  const containerTop = containerRect.top;
  // Zoom scale applied by an ancestor transform. offsetHeight is unscaled layout px,
  // bounding-rect height is the scaled screen px; their ratio is the transform scale.
  // In test/jsdom there is no layout (offsetHeight is 0), so fall back to scale 1 and
  // measure with raw rects (the tests mock getBoundingClientRect directly).
  const offsetH = measureRoot.offsetHeight;
  const scale =
    containerRect.height > 0 && offsetH > 0 ? containerRect.height / offsetH : 1;

  const raw: MeasuredUnit[] = [];
  /** The element each unit was measured from (for splitting tall units into lines). */
  const elementOf = new Map<MeasuredUnit, HTMLElement>();
  /** Bodyless sections: header unit -> its section element (the body may split into lines). */
  const bodylessSection = new Map<MeasuredUnit, HTMLElement>();

  // Per-section bottom margin (px, unscaled) — added to the last unit of each section
  // so the packer accounts for the trailing section spacing and doesn't overflow.
  const sectionMarginBottom = new Map<string, number>();

  // The personalInfo section is the page-1 header. Represent it as ONE unit (the wrapper)
  // so it can be hidden on page 2+ via display:none. Skip its inner markers below to
  // avoid overlap. keepWithNext=false: it stays at the top of page 1 but does not glue
  // to the next section (the next section may flow onto page 1 or page 2 on its own).
  let headerHeight = 0;
  const headerNode = measureRoot.querySelector(
    '[data-section="personalInfo"]',
  ) as HTMLElement | null;
  if (headerNode) {
    const r = rectToContainerY(headerNode, containerTop, scale);
    headerHeight = r.height;
    if (r.height > 0) {
      raw.push({
        id: "personalInfo",
        kind: "header",
        sectionId: "personalInfo",
        column: resolveColumn(headerNode),
        top: r.top,
        bottom: r.bottom,
        height: r.height,
        keepWithNext: false,
      });
    }
  }

  const push = (node: HTMLElement, partial: Partial<MeasuredUnit> & { kind: UnitKind }) => {
    const sectionNode = nearestAncestor(node, "[data-section]");
    const sectionId = sectionNode?.getAttribute("data-section") ?? "";
    // personalInfo is represented by its wrapper unit above; skip inner markers.
    if (sectionId === "personalInfo") return;
    const { top, bottom, height } = rectToContainerY(node, containerTop, scale);
    if (height === 0) return;
    // Track each section's bottom margin so we can extend the LAST unit of a section
    // to include it — otherwise that margin overflows the page (the packer only sees
    // unit box bottoms, not the trailing section margin).
    if (sectionNode && sectionId) {
      const mb = parseFloat(getComputedStyle(sectionNode).marginBottom || "0") || 0;
      const prev = sectionMarginBottom.get(sectionId) ?? 0;
      if (mb > prev) sectionMarginBottom.set(sectionId, mb);
    }
    const unit: MeasuredUnit = {
      id: node.getAttribute("data-item-id") ?? node.getAttribute("id") ?? "",
      sectionId,
      column: resolveColumn(node),
      top,
      bottom,
      height,
      keepWithNext: false,
      ...partial,
    };
    raw.push(unit);
    elementOf.set(unit, node);
  };

  // Section headers. id = data-section-id so hiding can target [data-section-id="X"] in the page DOM.
  for (const node of measureRoot.querySelectorAll("[data-section-header]")) {
    const elNode = node as HTMLElement;
    const sectionNode = nearestAncestor(elNode, "[data-section]");
    // A section whose body has no item markers (e.g. a one-line skills list) has nothing
    // to glue its header to — gluing would chain it to the NEXT section's header and
    // first item, pushing a small section to the next page and leaving a gap. Treat the
    // whole section as one block instead.
    const bodyless = !!sectionNode && !sectionNode.querySelector("[data-item-id], [data-item-body-block]");
    const before = raw.length;
    push(elNode, {
      kind: "header",
      id: elNode.getAttribute("data-section-id") ?? `header-${raw.length}`,
      keepWithNext: !bodyless,
    });
    if (bodyless && raw.length > before) {
      const unit = raw[raw.length - 1];
      bodylessSection.set(unit, sectionNode!);
      // Border box: the body below the header (the bottom margin is added later).
      const section = rectToContainerY(sectionNode!, containerTop, scale);
      unit.bottom = Math.max(unit.bottom, section.bottom);
      unit.height = unit.bottom - unit.top;
    }
  }

  // Body blocks (additive, optional) — finest grain; recorded first so item bodies
  // that contain them can be replaced by their block children. We only need to know
  // which item bodies have block children (to drop the whole-body wrapper); the blocks
  // themselves are pushed as units here.
  const bodyBlockParents = new Set<string>();
  for (const node of measureRoot.querySelectorAll("[data-item-body-block]")) {
    const elNode = node as HTMLElement;
    const parentId = elNode.parentElement?.getAttribute("data-item-id") ?? "";
    const blockId = elNode.getAttribute("data-item-id") ?? parentId;
    push(elNode, { kind: "body-block", id: blockId });
    if (parentId) bodyBlockParents.add(parentId);
  }

  // Items: prefer -header/-body sub-markers; drop bare wrappers to avoid overlap.
  const seenIds = new Set<string>();
  const itemNodes = Array.from(measureRoot.querySelectorAll("[data-item-id]")) as HTMLElement[];
  for (const node of itemNodes) {
    const id = node.getAttribute("data-item-id") ?? "";
    if (!id) continue;
    // Atomic-if-fits nodes are handled by the atomic loop below; skip here to avoid dup.
    if (node.hasAttribute("data-pagination-atomic-if-fits")) continue;
    if (id.endsWith(HEADER_SUFFIX)) {
      push(node, { kind: "header", id, keepWithNext: true });
    } else if (id.endsWith(BODY_SUFFIX)) {
      // If body-block children exist for this body, the blocks already represent it;
      // skip the whole-body wrapper to avoid overlap.
      if (bodyBlockParents.has(id)) continue;
      push(node, { kind: "item", id, keepWithNext: false });
    } else {
      // Bare wrapper (e.g. exp-0) — drop if -header/-body sub-markers exist for it.
      const hasSubMarkers = itemNodes.some(
        (n) =>
          n.getAttribute("data-item-id") === id + HEADER_SUFFIX ||
          n.getAttribute("data-item-id") === id + BODY_SUFFIX,
      );
      if (hasSubMarkers) continue;
      push(node, { kind: "item", id });
    }
    seenIds.add(id);
  }

  // Atomic-if-fits (e.g. project cards).
  for (const node of measureRoot.querySelectorAll("[data-pagination-atomic-if-fits]")) {
    push(node as HTMLElement, { kind: "atomic-if-fits", atomicIfFits: true });
  }

  const split = splitTallUnits(
    entryHeadersWithoutBody(raw, elementOf, containerTop, scale),
    elementOf,
    bodylessSection,
    containerTop,
    scale,
    pageHeightLimit,
  );

  // Sort by document position (top, then DOM order). personalInfo is included as a
  // single unit (the page-1 header) so it can be hidden on page 2+.
  const units = split.sort((a, b) => {
    if (a.top !== b.top) return a.top - b.top;
    return 0;
  });

  // Extend the last unit of each section to include the section's bottom margin so the
  // packer's Y-span accounts for the trailing section spacing (prevents page overflow).
  const lastBySection = new Map<string, MeasuredUnit>();
  for (const u of units) {
    const prev = lastBySection.get(u.sectionId);
    if (!prev || u.bottom > prev.bottom) lastBySection.set(u.sectionId, u);
  }
  for (const [, u] of lastBySection) {
    const mb = sectionMarginBottom.get(u.sectionId) ?? 0;
    if (mb > 0) {
      u.bottom += mb;
      u.height = Math.max(0, u.bottom - u.top);
    }
  }

  // Per-column packing budget. For each column present, the available content height =
  // pageHeightLimit - firstUnitTop - columnPadBottom, where firstUnitTop is the first
  // unit's top in measure coords (it already includes any full-width header + gap +
  // column padding-top above it) and columnPadBottom is the column wrapper's bottom
  // padding. This keeps each column's unit Y-span within the page so nothing clips.
  const columnBudgets: Record<UnitColumn, number> = {
    left: pageHeightLimit,
    right: pageHeightLimit,
    single: pageHeightLimit,
  };
  const colNodes: Record<UnitColumn, HTMLElement | null> = {
    left: measureRoot.querySelector("[data-resume-left-column]") as HTMLElement | null,
    right: measureRoot.querySelector("[data-resume-right-column]") as HTMLElement | null,
    single: null,
  };
  for (const col of ["left", "right", "single"] as UnitColumn[]) {
    const colUnits = units.filter((u) => u.column === col);
    if (colUnits.length === 0) continue;
    const firstUnitTop = colUnits.reduce((m, u) => Math.min(m, u.top), Infinity);
    const colNode = colNodes[col];
    const colPadBottom = colNode ? parseFloat(getComputedStyle(colNode).paddingBottom || "0") || 0 : 0;
    columnBudgets[col] = Math.max(120, pageHeightLimit - firstUnitTop - colPadBottom);
  }

  // Later pages: measure where each column's content starts with the header hidden (it
  // is display:none on those pages), so a full-width header above the columns doesn't
  // shrink every page after the first. Read synchronously and restored at once.
  const laterColumnBudgets: Record<UnitColumn, number> = { ...columnBudgets };
  // Only a header ABOVE the columns frees room on later pages; in a single column the
  // header is part of the flow and page 1's budget already measures from the page top.
  const headerAboveColumns = !!headerNode && resolveColumn(headerNode) === "single" && (!!colNodes.left || !!colNodes.right);
  if (headerNode && headerHeight > 0 && headerAboveColumns) {
    const prev = headerNode.style.getPropertyValue("display");
    const prevPriority = headerNode.style.getPropertyPriority("display");
    headerNode.style.setProperty("display", "none", "important");
    try {
      const top = measureRoot.getBoundingClientRect().top;
      for (const col of ["left", "right"] as UnitColumn[]) {
        const colUnits = units.filter((u) => u.column === col && u.id !== "personalInfo");
        if (colUnits.length === 0) continue;
        let firstTop = Infinity;
        for (const node of Array.from(measureRoot.querySelectorAll<HTMLElement>("[data-section-header],[data-item-id]"))) {
          if (resolveColumn(node) !== col || node.closest('[data-section="personalInfo"]')) continue;
          const r = node.getBoundingClientRect();
          if (r.height > 0) firstTop = Math.min(firstTop, (r.top - top) / scale);
        }
        if (!Number.isFinite(firstTop) || firstTop <= 0) continue;
        const colNode = colNodes[col];
        const colPadBottom = colNode ? parseFloat(getComputedStyle(colNode).paddingBottom || "0") || 0 : 0;
        // Never less room than page 1 had (the header can't make later pages smaller).
        laterColumnBudgets[col] = Math.max(columnBudgets[col], Math.floor(pageHeightLimit - firstTop - colPadBottom));
      }
    } finally {
      if (prev) headerNode.style.setProperty("display", prev, prevPriority);
      else headerNode.style.removeProperty("display");
    }
  }

  return { units, headerHeight, columnBudgets, laterColumnBudgets };
}

/**
 * Replace units that may break across pages with the lines they're made of, so a long job
 * (or summary, custom section, project) fills the rest of the page instead of jumping to the
 * next one whole. Orphan glue keeps a title with at least two of its lines and never leaves
 * one line alone at the top of a page. Small entries stay in one piece.
 */
function splitTallUnits(
  raw: MeasuredUnit[],
  elementOf: Map<MeasuredUnit, HTMLElement>,
  bodylessSection: Map<MeasuredUnit, HTMLElement>,
  containerTop: number,
  scale: number,
  pageHeightLimit: number,
): MeasuredUnit[] {
  const out: MeasuredUnit[] = [];
  const toBlocks = (
    template: MeasuredUnit,
    anchor: HTMLElement,
    anchorKey: string,
    groups: Element[][],
    leadingGlue: number,
    span: { top: number; bottom: number },
  ): MeasuredUnit[] | null => {
    const paths = groups.map((g) => {
      const parts = g.map((e) => pathFrom(anchor, e));
      return parts.some((p) => p === null) ? null : parts.join(PATH_JOIN);
    });
    if (paths.some((p) => p === null)) return null;
    const blocks = groups.map((g) => g[0]);
    const glue = orphanGlue(blocks.length, leadingGlue);
    return blocks.map((b, i) => {
      // Measure the line itself; side columns (a stretched date column) would span the row.
      const r = rectToContainerY(b as HTMLElement, containerTop, scale);
      // The first and last lines carry the anchor's own padding, so the run of lines
      // spans exactly what the whole unit did.
      const top = i === 0 ? Math.min(r.top, span.top) : r.top;
      const bottom = i === blocks.length - 1 ? Math.max(r.bottom, span.bottom) : r.bottom;
      return {
        id: blockUnitId(anchorKey, paths[i]!),
        kind: "body-block" as const,
        sectionId: template.sectionId,
        column: template.column,
        top,
        bottom,
        height: Math.max(0, bottom - top),
        keepWithNext: glue[i],
      };
    });
  };

  for (const unit of raw) {
    const el = elementOf.get(unit);
    const section = bodylessSection.get(unit);
    if (el && section) {
      // Header + body with no item markers (summary, a free-text custom section): keep the
      // header as its own unit glued to the body's lines.
      const blocks = collectBlockGroups(section, el);
      const headerRect = rectToContainerY(el, containerTop, scale);
      const lines = blocks.length >= 2 && !blocks.some((g) => g.includes(section))
        ? toBlocks(unit, section, sectionAnchorKey(unit.sectionId), blocks, 1, { top: headerRect.bottom, bottom: unit.bottom })
        : null;
      if (lines) {
        out.push({ ...unit, bottom: headerRect.bottom, height: headerRect.height, keepWithNext: true }, ...lines);
        continue;
      }
    } else if (el && (unit.kind === "item" || unit.kind === "atomic-if-fits")) {
      const isBody = unit.id.endsWith(BODY_SUFFIX);
      const blocks = collectBlockGroups(el);
      const tall = unit.height > pageHeightLimit * 0.3;
      // Item bodies always may break (their header is a separate unit). A whole item (a card,
      // an entry with no header marker) breaks only when it's tall; a card that asks to stay
      // together breaks only when it can't fit on a page at all.
      const eligible =
        unit.kind === "atomic-if-fits" ? unit.height > pageHeightLimit * 0.9 : isBody ? true : tall || blocks.length >= 6;
      if (eligible && blocks.length >= 2 && !blocks.some((g) => g.includes(el))) {
        const lines = toBlocks(unit, el, itemAnchorKey(unit.id), blocks, isBody ? 1 : 2, unit);
        if (lines) {
          out.push(...lines);
          continue;
        }
      }
    }
    out.push(unit);
  }
  return out;
}

/**
 * An entry whose title is marked ("edu-0-header") but whose details aren't (no "-body"):
 * gluing the title to "the next unit" chained it to the NEXT entry's title, so a whole
 * section (and the heading after it) moved as one block. Use the entry's wrapper instead,
 * so the title and its unmarked details move (and hide) together.
 */
function entryHeadersWithoutBody(
  raw: MeasuredUnit[],
  elementOf: Map<MeasuredUnit, HTMLElement>,
  containerTop: number,
  scale: number,
): MeasuredUnit[] {
  const bodies = new Set(raw.filter((u) => u.id.endsWith(BODY_SUFFIX)).map((u) => u.id.slice(0, -BODY_SUFFIX.length)));
  return raw.map((u) => {
    if (u.kind !== "header" || !u.id.endsWith(HEADER_SUFFIX)) return u;
    const base = u.id.slice(0, -HEADER_SUFFIX.length);
    if (bodies.has(base)) return u;
    const wrapper = elementOf.get(u)?.parentElement;
    const ownsOnlyThisEntry =
      !!wrapper &&
      !wrapper.hasAttribute("data-section") &&
      Array.from(wrapper.querySelectorAll("[data-item-id]")).every((n) => (n.getAttribute("data-item-id") ?? "").startsWith(base));
    if (!wrapper || !ownsOnlyThisEntry) return { ...u, keepWithNext: false };
    const r = rectToContainerY(wrapper, containerTop, scale);
    const wrapperId = wrapper.getAttribute("data-item-id");
    const unit: MeasuredUnit = {
      ...u,
      // The wrapper is itself a marked item ("edu-0"): hide it by its id. Otherwise address it
      // through the title it holds.
      id: wrapperId === base ? base : blockUnitId(parentAnchorKey(u.id), ""),
      kind: wrapperId === base ? "item" : "body-block",
      top: Math.min(u.top, r.top),
      bottom: Math.max(u.bottom, r.bottom),
      height: Math.max(u.bottom, r.bottom) - Math.min(u.top, r.top),
      keepWithNext: false,
    };
    return unit;
  });
}
