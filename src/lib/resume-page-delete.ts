import type { PackedPage } from "@/lib/resume-pagination/packUnitsIntoPages";
import type { RearrangePageLayout } from "@/lib/rearrange-sections";
import { canDeleteSection } from "@/lib/rearrange-sections";

export interface PageDeleteTargets {
  sectionIds: string[];
  itemIds: string[];
}

export function canDeleteResumePage(
  pageNumber: number,
  totalPages: number,
): boolean {
  return totalPages > 1 && pageNumber > 1;
}

/** True when a preview page band has no section headers or resume items. */
export function isEmptyResumePageBand(
  measureContainer: HTMLElement | null,
  page: Pick<PackedPage, "offsetY" | "height">,
): boolean {
  if (!measureContainer) return false;
  return !pageBandHasVisibleContent(measureContainer, page);
}

/** Page delete is only for trailing blank pages — never pages with resume content. */
export function canDeleteEmptyResumePage(
  measureContainer: HTMLElement | null,
  pageNumber: number,
  pages: Pick<PackedPage, "pageNumber" | "offsetY" | "height">[],
): boolean {
  if (!canDeleteResumePage(pageNumber, pages.length)) return false;
  const page = pages.find((entry) => entry.pageNumber === pageNumber);
  if (!page) return false;
  return isEmptyResumePageBand(measureContainer, page);
}

/** Apply user-dismissed blank trailing pages (persisted in layout). */
export function applyDismissedEmptyTrailingPages<
  T extends Pick<PackedPage, "pageNumber" | "offsetY" | "height">,
>(
  pages: T[],
  measureContainer: HTMLElement | null,
  dismissedCount: number,
): T[] {
  if (dismissedCount <= 0 || pages.length <= 1) return pages;
  // Never trim without live DOM — avoids hiding real pages during remeasure/rearrange.
  if (!measureContainer) return pages;

  let result = pages;
  let remaining = dismissedCount;

  while (remaining > 0 && result.length > 1) {
    const last = result[result.length - 1];
    if (last.pageNumber <= 1) break;
    if (pageBandHasVisibleContent(measureContainer, last)) {
      break;
    }
    result = result.slice(0, -1);
    remaining -= 1;
  }

  if (result.length === pages.length) return pages;

  return result.map((page, index) => ({
    ...page,
    pageNumber: index + 1,
  }));
}

export function getDeletableSectionIdsForRearrangePage(
  page: RearrangePageLayout,
): string[] {
  return [...page.leftColumn, ...page.rightColumn, ...page.singleColumn]
    .filter((section) => canDeleteSection(section))
    .map((section) => section.id);
}

/** Find sections / items whose block starts within a paginated preview band. */
export function collectPageDeleteTargets(
  measureContainer: HTMLElement,
  page: Pick<PackedPage, "offsetY" | "height">,
): PageDeleteTargets {
  const containerRect = measureContainer.getBoundingClientRect();
  const bandTop = page.offsetY;
  const bandBottom = page.offsetY + page.height;
  const sectionIds = new Set<string>();
  const itemIds = new Set<string>();

  measureContainer
    .querySelectorAll("[data-section-header][data-section-id]")
    .forEach((header) => {
      const sectionId = header.getAttribute("data-section-id");
      if (!sectionId || sectionId === "personalInfo") return;

      const rect = header.getBoundingClientRect();
      const top = rect.top - containerRect.top;
      const bottom = top + rect.height;

      if (top < bandBottom && bottom > bandTop) {
        sectionIds.add(sectionId);
      }
    });

  measureContainer.querySelectorAll("[data-section]").forEach((sectionEl) => {
    const sectionId = sectionEl.getAttribute("data-section");
    if (!sectionId || sectionId === "personalInfo" || sectionIds.has(sectionId)) {
      return;
    }

    const header = sectionEl.querySelector("[data-section-header]");
    const anchor = header ?? sectionEl;
    const anchorRect = anchor.getBoundingClientRect();
    const anchorTop = anchorRect.top - containerRect.top;
    const anchorBottom = anchorTop + anchorRect.height;

    if (anchorTop < bandBottom && anchorBottom > bandTop) {
      sectionIds.add(sectionId);
    }
  });

  measureContainer.querySelectorAll("[data-item-id]").forEach((itemEl) => {
    const itemId = itemEl.getAttribute("data-item-id");
    if (!itemId) return;

    const rect = itemEl.getBoundingClientRect();
    const top = rect.top - containerRect.top;
    const bottom = top + rect.height;
    const startsOnPage = top >= bandTop && top < bandBottom;
    const continuesFromPreviousPage = top < bandTop && bottom > bandTop;

    if (!startsOnPage && !continuesFromPreviousPage) return;

    const sectionEl = itemEl.closest("[data-section]");
    const sectionId = sectionEl?.getAttribute("data-section");
    if (startsOnPage && sectionId && sectionIds.has(sectionId)) return;

    itemIds.add(itemId);
  });

  return {
    sectionIds: [...sectionIds],
    itemIds: [...itemIds],
  };
}

export function resolvePageDeleteTargets(
  measureContainer: HTMLElement | null,
  pages: Pick<PackedPage, "pageNumber" | "offsetY" | "height">[],
  pageNumber: number,
): PageDeleteTargets | null {
  if (!measureContainer || !canDeleteResumePage(pageNumber, pages.length)) {
    return null;
  }

  const page = pages.find((entry) => entry.pageNumber === pageNumber);
  if (!page) return null;

  return collectPageDeleteTargets(measureContainer, page);
}

/** A page is "empty" only if real content ends before this margin into the band. */
const EMPTY_PAGE_CONTENT_EPS_PX = 8;

/**
 * Bottom-most Y (px, relative to the measure root) reached by real resume content.
 * Uses semantic blocks (section headers + items) and ignores empty chrome, so it
 * reflects the actual filled height rather than padding/spacers.
 */
export function getMeasuredContentBottom(measureContainer: HTMLElement): number {
  const containerTop = measureContainer.getBoundingClientRect().top;
  let maxBottom = 0;

  const consider = (node: Element) => {
    const text = node.textContent?.trim() ?? "";
    const hasRenderable =
      node.querySelector("img,svg,canvas,table,hr") !== null;
    if (text.length === 0 && !hasRenderable) return;
    const rect = node.getBoundingClientRect();
    if (rect.height <= 2) return;
    const bottom = rect.bottom - containerTop;
    if (bottom > maxBottom) maxBottom = bottom;
  };

  measureContainer
    .querySelectorAll("[data-section-header], [data-item-id]")
    .forEach(consider);

  // Fallback: some templates may not emit item markers — scan section bodies.
  if (maxBottom === 0) {
    measureContainer.querySelectorAll("[data-section]").forEach(consider);
  }

  return maxBottom;
}

/**
 * True when real content reaches into this page band (i.e. content extends past
 * the page's top edge). Trailing pages that start after all content has ended are
 * reported empty, which both gates the delete button and lets content auto-grow
 * back into a previously-dismissed page.
 */
export function pageBandHasVisibleContent(
  measureContainer: HTMLElement,
  page: Pick<PackedPage, "offsetY" | "height">,
): boolean {
  const contentBottom = getMeasuredContentBottom(measureContainer);
  if (contentBottom <= 0) {
    // Could not measure content extent — fall back to marker intersection.
    const targets = collectPageDeleteTargets(measureContainer, page);
    return targets.sectionIds.length > 0 || targets.itemIds.length > 0;
  }
  return contentBottom > page.offsetY + EMPTY_PAGE_CONTENT_EPS_PX;
}

export function filterNonEmptyPreviewPages(
  measureContainer: HTMLElement | null,
  pages: Pick<PackedPage, "pageNumber" | "offsetY" | "height">[],
): Pick<PackedPage, "pageNumber" | "offsetY" | "height">[] {
  if (!measureContainer || pages.length === 0) return pages;
  return pages.filter((page) =>
    pageBandHasVisibleContent(measureContainer, page),
  );
}

/** Document Y (px) of an element inside the measure root. */
export function measureElementDocumentTop(
  measureContainer: HTMLElement,
  element: Element,
): number {
  const containerRect = measureContainer.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return rect.top - containerRect.top;
}

export function overlapWithPageBand(
  top: number,
  bottom: number,
  page: Pick<PackedPage, "offsetY" | "height">,
): number {
  const bandTop = page.offsetY;
  const bandBottom = page.offsetY + page.height;
  return Math.max(0, Math.min(bottom, bandBottom) - Math.max(top, bandTop));
}

export function pageNumberForDocumentOffset(
  offsetY: number,
  pages: Pick<PackedPage, "pageNumber" | "offsetY" | "height">[],
): number {
  for (const page of pages) {
    if (offsetY >= page.offsetY && offsetY < page.offsetY + page.height) {
      return page.pageNumber;
    }
  }
  return pages[pages.length - 1]?.pageNumber ?? pages[0]?.pageNumber ?? 1;
}

/** Page where a section should appear in rearrange (largest body overlap, else header). */
export function resolveSectionPrimaryPage(
  measureContainer: HTMLElement,
  sectionId: string,
  pages: Pick<PackedPage, "pageNumber" | "offsetY" | "height">[],
): number {
  if (pages.length === 0) return 1;

  const sectionEl = measureContainer.querySelector(
    `[data-section="${CSS.escape(sectionId)}"]`,
  );
  if (sectionEl) {
    const top = measureElementDocumentTop(measureContainer, sectionEl);
    const bottom = top + sectionEl.getBoundingClientRect().height;

    let bestPage = pages[0].pageNumber;
    let bestOverlap = -1;
    for (const page of pages) {
      const overlap = overlapWithPageBand(top, bottom, page);
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestPage = page.pageNumber;
      }
    }
    if (bestOverlap > 0) {
      return bestPage;
    }
  }

  const header = measureContainer.querySelector(
    `[data-section-header][data-section-id="${CSS.escape(sectionId)}"]`,
  );
  if (header) {
    const headerTop = measureElementDocumentTop(measureContainer, header);
    return pageNumberForDocumentOffset(headerTop, pages);
  }

  return pages[0].pageNumber;
}

/** Section ids with a header and/or body intersecting a preview page band. */
export function collectPageSectionPresence(
  measureContainer: HTMLElement,
  page: Pick<PackedPage, "offsetY" | "height">,
): string[] {
  const bandTop = page.offsetY;
  const bandBottom = page.offsetY + page.height;
  const sectionIds = new Set<string>();

  for (const sectionId of collectPageDeleteTargets(measureContainer, page)
    .sectionIds) {
    sectionIds.add(sectionId);
  }

  measureContainer.querySelectorAll("[data-item-id]").forEach((itemEl) => {
    const top = measureElementDocumentTop(measureContainer, itemEl);
    const bottom = top + itemEl.getBoundingClientRect().height;
    const startsOnPage = top >= bandTop && top < bandBottom;
    const continuesFromPreviousPage = top < bandTop && bottom > bandTop;

    if (!startsOnPage && !continuesFromPreviousPage) return;

    const sectionEl = itemEl.closest("[data-section]");
    const sectionId = sectionEl?.getAttribute("data-section");
    if (sectionId && sectionId !== "personalInfo") {
      sectionIds.add(sectionId);
    }
  });

  measureContainer.querySelectorAll("[data-section]").forEach((sectionEl) => {
    const sectionId = sectionEl.getAttribute("data-section");
    if (!sectionId || sectionId === "personalInfo") return;

    const top = measureElementDocumentTop(measureContainer, sectionEl);
    const bottom = top + sectionEl.getBoundingClientRect().height;
    if (top < bandBottom && bottom > bandTop) {
      sectionIds.add(sectionId);
    }
  });

  return [...sectionIds];
}

/** Map each section id to every preview page where its header or items appear. */
export function buildSectionPagesMap(
  measureContainer: HTMLElement,
  pages: Pick<PackedPage, "pageNumber" | "offsetY" | "height">[],
): Map<string, number[]> {
  const map = new Map<string, Set<number>>();

  for (const page of pages) {
    for (const sectionId of collectPageSectionPresence(measureContainer, page)) {
      if (!map.has(sectionId)) {
        map.set(sectionId, new Set());
      }
      map.get(sectionId)!.add(page.pageNumber);
    }
  }

  return new Map(
    [...map.entries()].map(([sectionId, pageSet]) => [
      sectionId,
      [...pageSet].sort((a, b) => a - b),
    ]),
  );
}

/** Map each section id to the page where its header starts. */
export function buildSectionHeaderPageMap(
  measureContainer: HTMLElement,
  pages: Pick<PackedPage, "pageNumber" | "offsetY" | "height">[],
): Map<string, number> {
  const map = new Map<string, number>();
  const containerRect = measureContainer.getBoundingClientRect();

  measureContainer
    .querySelectorAll("[data-section-header][data-section-id]")
    .forEach((header) => {
      const sectionId = header.getAttribute("data-section-id");
      if (!sectionId || map.has(sectionId)) return;

      const rect = header.getBoundingClientRect();
      const top = rect.top - containerRect.top;
      const bottom = top + rect.height;

      for (const page of pages) {
        const bandTop = page.offsetY;
        const bandBottom = page.offsetY + page.height;
        if (top < bandBottom && bottom > bandTop) {
          map.set(sectionId, page.pageNumber);
          break;
        }
      }
    });

  return map;
}

/** @deprecated Prefer buildSectionPagesMap for multi-page section placement. */
export function buildSectionPageMap(
  measureContainer: HTMLElement,
  pages: Pick<PackedPage, "pageNumber" | "offsetY" | "height">[],
): Map<string, number> {
  const headerMap = buildSectionHeaderPageMap(measureContainer, pages);
  const pagesMap = buildSectionPagesMap(measureContainer, pages);
  const map = new Map<string, number>();

  for (const [sectionId, pageNumbers] of pagesMap.entries()) {
    map.set(sectionId, headerMap.get(sectionId) ?? pageNumbers[0] ?? 1);
  }

  for (const [sectionId, pageNumber] of headerMap.entries()) {
    if (!map.has(sectionId)) {
      map.set(sectionId, pageNumber);
    }
  }

  return map;
}

const ARRAY_CONTENT_KEYS = [
  "experience",
  "education",
  "projects",
  "skills",
  "languages",
  "certificates",
  "awards",
  "achievements",
  "courses",
  "publications",
  "organisations",
  "references",
] as const;

/** Remove paginated items from resume content arrays by id. Returns only changed keys. */
export function removeItemsFromResumeContent(
  content: Record<string, unknown>,
  itemIds: string[],
): Partial<Record<(typeof ARRAY_CONTENT_KEYS)[number], unknown>> {
  if (itemIds.length === 0) return {};

  const idSet = new Set(itemIds);
  const updates: Partial<Record<(typeof ARRAY_CONTENT_KEYS)[number], unknown>> =
    {};

  for (const key of ARRAY_CONTENT_KEYS) {
    const value = content[key];
    if (!Array.isArray(value)) continue;

    const filtered = value.filter((entry) => {
      if (!entry || typeof entry !== "object") return true;
      const id = (entry as { id?: string }).id;
      if (!id) return true;
      return !idSet.has(id);
    });

    if (filtered.length !== value.length) {
      updates[key] = filtered;
    }
  }

  return updates;
}
