import type { ResumeTemplate } from "@/lib/api";
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

export function rebuildSectionsFromRearrange(
  allSections: SectionWithColumn[],
  partition: Omit<RearrangePartition, "hiddenSections">,
): SectionWithColumn[] {
  const hiddenSections = allSections.filter((s) => !s.visible);

  if (!partition.isDoubleColumn) {
    const visible = partition.lockedHeader
      ? [partition.lockedHeader, ...partition.singleColumn]
      : [...partition.singleColumn];
    return [...visible, ...hiddenSections];
  }

  const leftColumn = partition.leftColumn.map((section) => ({
    ...section,
    column: "left" as const,
  }));
  const rightColumn = partition.rightColumn.map((section) => ({
    ...section,
    column: "right" as const,
  }));

  const visible = partition.lockedHeader
    ? [partition.lockedHeader, ...leftColumn, ...rightColumn]
    : [...leftColumn, ...rightColumn];

  return [...visible, ...hiddenSections];
}

export function reorderWithinList<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return list;
  const next = [...list];
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next;
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
export function groupSectionsIntoPages(
  partition: Omit<RearrangePartition, "hiddenSections">,
): RearrangePageLayout[] {
  if (!partition.isDoubleColumn) {
    const items = partition.singleColumn;
    const totalPages = items.length > 4 ? 2 : 1;
    if (totalPages === 1) {
      return [
        {
          pageNumber: 1,
          totalPages: 1,
          lockedHeader: partition.lockedHeader,
          leftColumn: [],
          rightColumn: [],
          singleColumn: items,
          isDoubleColumn: false,
        },
      ];
    }

    const split = Math.ceil(items.length / 2);
    return [
      {
        pageNumber: 1,
        totalPages: 2,
        lockedHeader: partition.lockedHeader,
        leftColumn: [],
        rightColumn: [],
        singleColumn: items.slice(0, split),
        isDoubleColumn: false,
      },
      {
        pageNumber: 2,
        totalPages: 2,
        lockedHeader: null,
        leftColumn: [],
        rightColumn: [],
        singleColumn: items.slice(split),
        isDoubleColumn: false,
      },
    ];
  }

  const left = partition.leftColumn;
  const right = partition.rightColumn;
  const totalBody = left.length + right.length;
  const totalPages = totalBody > 4 ? 2 : 1;

  if (totalPages === 1) {
    return [
      {
        pageNumber: 1,
        totalPages: 1,
        lockedHeader: partition.lockedHeader,
        leftColumn: left,
        rightColumn: right,
        singleColumn: [],
        isDoubleColumn: true,
      },
    ];
  }

  const leftSplit = Math.ceil(left.length / 2);
  const rightSplit = Math.ceil(right.length / 2);

  return [
    {
      pageNumber: 1,
      totalPages: 2,
      lockedHeader: partition.lockedHeader,
      leftColumn: left.slice(0, leftSplit),
      rightColumn: right.slice(0, rightSplit),
      singleColumn: [],
      isDoubleColumn: true,
    },
    {
      pageNumber: 2,
      totalPages: 2,
      lockedHeader: null,
      leftColumn: left.slice(leftSplit),
      rightColumn: right.slice(rightSplit),
      singleColumn: [],
      isDoubleColumn: true,
    },
  ];
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
