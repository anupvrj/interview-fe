import { Resume, ResumeTemplate } from "@/lib/api";
import { getExtendedTemplate } from "@/lib/templateConfigs";

export type SectionColumn = "left" | "right";

export interface SectionWithColumn {
  id: string;
  type: string;
  title: string;
  visible: boolean;
  column?: SectionColumn;
}

function isListedInColumn(
  list: string[] | undefined,
  section: Pick<SectionWithColumn, "id" | "type">,
): boolean {
  if (!list?.length) return false;
  return list.includes(section.id) || list.includes(section.type);
}

/**
 * Resolve which column a section belongs to for double-column layouts.
 */
export function resolveSectionColumn(
  section: SectionWithColumn,
  options: {
    layoutType?: "single" | "double";
    template?: ResumeTemplate | null;
    visibleSections?: SectionWithColumn[];
  } = {},
): SectionColumn | undefined {
  if (options.layoutType !== "double" || section.type === "personalInfo") {
    return undefined;
  }

  if (section.column === "left" || section.column === "right") {
    return section.column;
  }

  if (options.template) {
    const extended = getExtendedTemplate(options.template);
    const columnAssignment = extended?.rendering?.layout?.columnAssignment;

    if (
      columnAssignment &&
      (columnAssignment.left?.length || columnAssignment.right?.length)
    ) {
      if (isListedInColumn(columnAssignment.left, section)) return "left";
      if (isListedInColumn(columnAssignment.right, section)) return "right";
      return "left";
    }
  }

  const visibleBody = (options.visibleSections || []).filter(
    (item) => item.visible && item.type !== "personalInfo",
  );
  const index = visibleBody.findIndex((item) => item.id === section.id);
  if (index >= 0) {
    return index % 2 === 0 ? "left" : "right";
  }

  return "left";
}

export function assignSectionColumnOnReorder<T extends SectionWithColumn>(
  sections: T[],
  draggedId: string,
  targetId: string,
  options: {
    layoutType?: "single" | "double";
    template?: ResumeTemplate | null;
  },
): T[] {
  const draggedIndex = sections.findIndex((section) => section.id === draggedId);
  const targetIndex = sections.findIndex((section) => section.id === targetId);
  if (draggedIndex === -1 || targetIndex === -1) return sections;

  const targetSection = sections[targetIndex];
  const newSections = sections.map((section) => ({ ...section }));
  const [removed] = newSections.splice(draggedIndex, 1);

  const insertIndex =
    draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;

  if (
    options.layoutType === "double" &&
    targetSection.type !== "personalInfo"
  ) {
    const targetColumn = resolveSectionColumn(targetSection, {
      layoutType: options.layoutType,
      template: options.template,
      visibleSections: sections.filter((section) => section.visible),
    });
    if (targetColumn) {
      removed.column = targetColumn;
    }
  }

  newSections.splice(insertIndex, 0, removed);
  return newSections;
}

export function toSectionOrderPayload(
  sections: SectionWithColumn[],
): NonNullable<Resume["sectionOrder"]> {
  return sections.map((section) => ({
    id: section.id,
    type: section.type,
    title: section.title,
    visible: section.visible,
    ...(section.column ? { column: section.column } : {}),
  }));
}

export function isListedInTemplateColumnAssignment(
  list: string[] | undefined,
  section: Pick<SectionWithColumn, "id" | "type">,
): boolean {
  return isListedInColumn(list, section);
}
