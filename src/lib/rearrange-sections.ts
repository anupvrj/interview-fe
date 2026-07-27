import type { ResumeTemplate } from "@/lib/api";
import type { PackedPage } from "@/lib/resume-pagination/packUnitsIntoPages";
import {
  collectPageSectionPresence,
  resolveSectionPrimaryPage,
} from "@/lib/resume-page-delete";
import { getExtendedTemplate } from "@/lib/templateConfigs";
import { getTemplateStyle } from "@/lib/templateRenderer";
import {
  isListedInTemplateColumnAssignment,
  resolveSectionColumn,
  type SectionWithColumn,
} from "@/lib/sectionColumnUtils";

export type RearrangeLayoutType = "single" | "double";

export interface RearrangePartition {
  lockedHeader: SectionWithColumn | null;
  leftColumn: SectionWithColumn[];
  rightColumn: SectionWithColumn[];
  singleColumn: SectionWithColumn[];
  isDoubleColumn: boolean;
  hiddenSections: SectionWithColumn[];
}

export interface RearrangePageLayout {
  pageNumber: number;
  totalPages: number;
  lockedHeader: SectionWithColumn | null;
  leftColumn: SectionWithColumn[];
  rightColumn: SectionWithColumn[];
  singleColumn: SectionWithColumn[];
  isDoubleColumn: boolean;
  /** Trailing blank page from live preview pagination (no sections). */
  isEmpty?: boolean;
  /** Sections shown on this page because content continues from an earlier page. */
  continuedSectionIds?: string[];
}

export function isEmptyRearrangePage(page: RearrangePageLayout): boolean {
  if (page.isEmpty) return true;
  const hasBodySections =
    page.leftColumn.length > 0 ||
    page.rightColumn.length > 0 ||
    page.singleColumn.length > 0;
  return !hasBodySections && !page.lockedHeader;
}

export function getLockedHeaderSection(
  visibleSections: SectionWithColumn[],
  layoutType: RearrangeLayoutType,
  template: ResumeTemplate,
): SectionWithColumn | null {
  const templateStyle = getTemplateStyle(getExtendedTemplate(template));

  if (
    layoutType === "double" &&
    templateStyle.headerStyle !== "two-column"
  ) {
    return visibleSections.find((s) => s.type === "personalInfo") ?? null;
  }

  if (
    layoutType === "single" &&
    (templateStyle.headerLayout?.type === "with-profile-picture" ||
      template.id === "mercury")
  ) {
    return visibleSections.find((s) => s.type === "personalInfo") ?? null;
  }

  return null;
}

/** Mirrors ResumeRenderer column bucketing for the rearrange canvas. */
export function partitionSectionsForRearrange(
  sections: SectionWithColumn[],
  layoutType: RearrangeLayoutType,
  template: ResumeTemplate,
): RearrangePartition {
  const hiddenSections = sections.filter((s) => !s.visible);
  const visibleSections = sections.filter((s) => s.visible);
  const lockedHeader = getLockedHeaderSection(
    visibleSections,
    layoutType,
    template,
  );

  if (layoutType === "single") {
    const singleColumn = lockedHeader
      ? visibleSections.filter((s) => s.id !== lockedHeader.id)
      : visibleSections;

    return {
      lockedHeader,
      leftColumn: [],
      rightColumn: [],
      singleColumn,
      isDoubleColumn: false,
      hiddenSections,
    };
  }

  const templateStyle = getTemplateStyle(getExtendedTemplate(template));
  const extendedTemplate = getExtendedTemplate(template);
  const columnAssignment =
    extendedTemplate?.rendering?.layout?.columnAssignment;

  const bodySections =
    templateStyle.headerStyle === "two-column"
      ? visibleSections
      : visibleSections.filter((s) => s.type !== "personalInfo");

  const leftColumn: SectionWithColumn[] = [];
  const rightColumn: SectionWithColumn[] = [];
  let nonPersonalInfoIndex = 0;

  bodySections.forEach((section, index) => {
    if (section.column === "left" || section.column === "right") {
      if (section.column === "left") leftColumn.push(section);
      else rightColumn.push(section);
      return;
    }

    if (
      columnAssignment &&
      (columnAssignment.left?.length || columnAssignment.right?.length)
    ) {
      if (isListedInTemplateColumnAssignment(columnAssignment.left, section)) {
        leftColumn.push(section);
        return;
      }
      if (isListedInTemplateColumnAssignment(columnAssignment.right, section)) {
        rightColumn.push(section);
        return;
      }
      leftColumn.push(section);
      return;
    }

    if (templateStyle.headerStyle === "two-column") {
      if (section.type === "personalInfo") {
        leftColumn.push(section);
      } else if (nonPersonalInfoIndex % 2 === 0) {
        rightColumn.push(section);
      } else {
        leftColumn.push(section);
      }
      nonPersonalInfoIndex++;
      return;
    }

    if (index % 2 === 0) leftColumn.push(section);
    else rightColumn.push(section);
  });

  return {
    lockedHeader,
    leftColumn,
    rightColumn,
    singleColumn: [],
    isDoubleColumn: true,
    hiddenSections,
  };
}

export function canDeleteSection(section: SectionWithColumn): boolean {
  return section.type !== "personalInfo";
}

export function isEssentialSection(section: SectionWithColumn): boolean {
  return (
    section.type === "personalInfo" ||
    section.type === "experience" ||
    section.type === "education"
  );
}

export function rebuildSectionsFromRearrange(
  allSections: SectionWithColumn[],
  partition: Omit<RearrangePartition, "hiddenSections">,
): SectionWithColumn[] {
  let visibleOrdered: SectionWithColumn[];

  if (!partition.isDoubleColumn) {
    visibleOrdered = partition.lockedHeader
      ? [partition.lockedHeader, ...partition.singleColumn]
      : [...partition.singleColumn];
  } else {
    const leftColumn = partition.leftColumn.map((section) => ({
      ...section,
      column: "left" as const,
    }));
    const rightColumn = partition.rightColumn.map((section) => ({
      ...section,
      column: "right" as const,
    }));

    visibleOrdered = partition.lockedHeader
      ? [partition.lockedHeader, ...leftColumn, ...rightColumn]
      : [...leftColumn, ...rightColumn];
  }

  const visibleIds = new Set(visibleOrdered.map((section) => section.id));
  const byId = new Map(allSections.map((section) => [section.id, section]));

  const mergedVisible = visibleOrdered.map((section) => {
    const existing = byId.get(section.id) ?? section;
    return {
      ...existing,
      visible: true,
      column: section.column,
    };
  });

  const hiddenSections = allSections
    .filter((section) => !visibleIds.has(section.id))
    .map((section) => ({
      ...section,
      visible: false,
      expanded: false,
    }));

  return [...mergedVisible, ...hiddenSections];
}

export function reorderWithinList<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return list;
  const next = [...list];
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next;
}

export function applySectionDelete(
  partition: RearrangePartition,
  sectionId: string,
): RearrangePartition {
  if (partition.lockedHeader?.id === sectionId) return partition;

  return {
    ...partition,
    leftColumn: partition.leftColumn.filter((section) => section.id !== sectionId),
    rightColumn: partition.rightColumn.filter((section) => section.id !== sectionId),
    singleColumn: partition.singleColumn.filter((section) => section.id !== sectionId),
  };
}

export function applySectionDrop(
  partition: RearrangePartition,
  draggedId: string,
  targetColumn: "left" | "right" | "single",
  targetSectionId: string | null,
): RearrangePartition {
  if (partition.lockedHeader?.id === draggedId) return partition;

  const draggedSection = [
    ...partition.leftColumn,
    ...partition.rightColumn,
    ...partition.singleColumn,
  ].find((s) => s.id === draggedId);

  if (!draggedSection || isSectionLocked(draggedSection)) {
    return partition;
  }

  if (targetSectionId === draggedId) {
    return partition;
  }

  const sourceColumn = findSectionColumnInPartition(partition, draggedId);
  const sourceList =
    sourceColumn === "left"
      ? partition.leftColumn
      : sourceColumn === "right"
        ? partition.rightColumn
        : sourceColumn === "single"
          ? partition.singleColumn
          : [];
  const fromIndex = sourceList.findIndex((s) => s.id === draggedId);

  let leftColumn = partition.leftColumn.filter((s) => s.id !== draggedId);
  let rightColumn = partition.rightColumn.filter((s) => s.id !== draggedId);
  let singleColumn = partition.singleColumn.filter((s) => s.id !== draggedId);

  const targetList =
    targetColumn === "left"
      ? leftColumn
      : targetColumn === "right"
        ? rightColumn
        : singleColumn;

  let insertAt = targetSectionId
    ? targetList.findIndex((s) => s.id === targetSectionId)
    : targetList.length;
  if (insertAt < 0) insertAt = targetList.length;

  // When moving down within the same column, "drop on" means insert after the target.
  if (
    targetSectionId &&
    sourceColumn === targetColumn &&
    fromIndex >= 0
  ) {
    const originalTargetIndex = sourceList.findIndex(
      (s) => s.id === targetSectionId,
    );
    if (originalTargetIndex >= 0 && fromIndex < originalTargetIndex) {
      insertAt += 1;
    }
  }

  targetList.splice(insertAt, 0, draggedSection);

  if (targetColumn === "left") leftColumn = targetList;
  else if (targetColumn === "right") rightColumn = targetList;
  else singleColumn = targetList;

  return {
    ...partition,
    leftColumn,
    rightColumn,
    singleColumn,
  };
}

type ColumnKey = "left" | "right" | "single";

function buildSingleRearrangePage(
  partition: Omit<RearrangePartition, "hiddenSections">,
): RearrangePageLayout[] {
  return [
    {
      pageNumber: 1,
      totalPages: 1,
      lockedHeader: partition.lockedHeader,
      leftColumn: [...partition.leftColumn],
      rightColumn: [...partition.rightColumn],
      singleColumn: [...partition.singleColumn],
      isDoubleColumn: partition.isDoubleColumn,
    },
  ];
}

/** Group rearrange boxes by where each section starts in live preview pagination. */
export function groupSectionsIntoPagesFromPagination(
  partition: Omit<RearrangePartition, "hiddenSections">,
  measureContainer: HTMLElement | null,
  pages: Pick<PackedPage, "pageNumber" | "offsetY" | "height">[],
): RearrangePageLayout[] {
  if (!measureContainer || pages.length === 0) {
    return [];
  }

  type PageBucket = {
    leftColumn: SectionWithColumn[];
    rightColumn: SectionWithColumn[];
    singleColumn: SectionWithColumn[];
  };

  const buckets = new Map<number, PageBucket>();
  for (const page of pages) {
    buckets.set(page.pageNumber, {
      leftColumn: [],
      rightColumn: [],
      singleColumn: [],
    });
  }

  const pushSection = (
    bucket: PageBucket,
    column: ColumnKey,
    section: SectionWithColumn,
  ) => {
    const target =
      column === "left"
        ? bucket.leftColumn
        : column === "right"
          ? bucket.rightColumn
          : bucket.singleColumn;

    if (target.some((entry) => entry.id === section.id)) return;
    target.push(section);
  };

  const assignSection = (section: SectionWithColumn, column: ColumnKey) => {
    const pageNumber = resolveSectionPrimaryPage(
      measureContainer,
      section.id,
      pages,
    );
    const bucket =
      buckets.get(pageNumber) ?? buckets.get(pages[0]?.pageNumber ?? 1);
    if (!bucket) return;
    pushSection(bucket, column, section);
  };

  if (!partition.isDoubleColumn) {
    partition.singleColumn.forEach((section) =>
      assignSection(section, "single"),
    );
  } else {
    partition.leftColumn.forEach((section) => assignSection(section, "left"));
    partition.rightColumn.forEach((section) => assignSection(section, "right"));
  }

  const layouts: RearrangePageLayout[] = [];

  for (const page of pages) {
    const bucket = buckets.get(page.pageNumber);
    if (!bucket) continue;

    const hasBodySections =
      bucket.leftColumn.length > 0 ||
      bucket.rightColumn.length > 0 ||
      bucket.singleColumn.length > 0;
    const includeLockedHeader = page.pageNumber === 1 && partition.lockedHeader;

    if (!hasBodySections && !includeLockedHeader) {
      const hasPreviewContent =
        collectPageSectionPresence(measureContainer, page).length > 0;
      if (page.pageNumber > 1 && !hasPreviewContent) {
        layouts.push({
          pageNumber: page.pageNumber,
          totalPages: pages.length,
          lockedHeader: null,
          leftColumn: [],
          rightColumn: [],
          singleColumn: [],
          isDoubleColumn: partition.isDoubleColumn,
          isEmpty: true,
        });
      }
      continue;
    }

    layouts.push({
      pageNumber: page.pageNumber,
      totalPages: pages.length,
      lockedHeader: includeLockedHeader ? partition.lockedHeader : null,
      leftColumn: bucket.leftColumn,
      rightColumn: bucket.rightColumn,
      singleColumn: bucket.singleColumn,
      isDoubleColumn: partition.isDoubleColumn,
    });
  }

  if (layouts.length === 0) {
    return buildSingleRearrangePage(partition);
  }

  return layouts.map((layout, index) => ({
    ...layout,
    pageNumber: index + 1,
    totalPages: layouts.length,
  }));
}

export function buildAllSectionsSingleRearrangePage(
  partition: Omit<RearrangePartition, "hiddenSections">,
): RearrangePageLayout[] {
  return buildSingleRearrangePage(partition);
}

/** @deprecated Use groupSectionsIntoPagesFromPagination with live preview pagination. */
export function groupSectionsIntoPages(
  partition: Omit<RearrangePartition, "hiddenSections">,
): RearrangePageLayout[] {
  return buildSingleRearrangePage(partition);
}

export function getSectionBoxLabel(section: SectionWithColumn): string {
  if (section.type === "personalInfo") return "Header";
  return section.title?.trim() || section.type;
}

export function isSectionLocked(section: SectionWithColumn): boolean {
  return section.type === "personalInfo";
}

export function findSectionColumnInPartition(
  partition: RearrangePartition,
  sectionId: string,
): "left" | "right" | "single" | null {
  if (partition.leftColumn.some((s) => s.id === sectionId)) return "left";
  if (partition.rightColumn.some((s) => s.id === sectionId)) return "right";
  if (partition.singleColumn.some((s) => s.id === sectionId)) return "single";
  return null;
}

export function ensureSectionColumns(
  sections: SectionWithColumn[],
  layoutType: RearrangeLayoutType,
  template: ResumeTemplate | null,
): SectionWithColumn[] {
  if (layoutType !== "double" || !template) return sections;

  return sections.map((section) => {
    if (!section.visible || section.type === "personalInfo") return section;
    if (section.column === "left" || section.column === "right") return section;
    const column = resolveSectionColumn(section, {
      layoutType,
      template,
      visibleSections: sections.filter((s) => s.visible),
    });
    return column ? { ...section, column } : section;
  });
}
