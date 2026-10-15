import type { ResumeTemplate } from "@/lib/api";
import { getExtendedTemplate } from "@/lib/templateConfigs";
import { getTemplateStyle } from "@/lib/templateRenderer";
import {
  CORPORATE_LAYOUT_PADDING_MM,
  resolveLayoutPaddingMm,
} from "@/lib/resume-page-dimensions";

export type ResumeEditorLayout = {
  type: "single" | "double";
  columnWidths: { left: number; right: number };
  padding?: { top: number; bottom: number; left: number; right: number };
  fontSize?: {
    heading?: number;
    subheading?: number;
    body?: number;
    small?: number;
    sectionHeader?: number;
  };
  fontFamily?: string;
};

export type ResumeSectionType =
  | "personalInfo"
  | "profileSummary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "achievements"
  | "languages"
  | "certificates"
  | "interests"
  | "courses"
  | "awards"
  | "organisations"
  | "publications"
  | "references"
  | "declaration"
  | "spacer"
  | "custom";

export type ResumeEditorSection = {
  id: string;
  type: ResumeSectionType;
  title: string;
  visible: boolean;
  expanded: boolean;
};

function asResumeSectionType(type: string): ResumeSectionType {
  return type as ResumeSectionType;
}

/** Fresh layout from the target template — same rules as creating a new resume. */
export function buildLayoutForTemplateSwitch(
  newTemplate: ResumeTemplate,
): ResumeEditorLayout {
  const extended = getExtendedTemplate(newTemplate);
  const style = getTemplateStyle(extended);
  const renderingLayout = extended.rendering?.layout;

  const renderingType = renderingLayout?.type;
  const type: "single" | "double" =
    renderingType === "double" || renderingType === "header-plus-columns"
      ? "double"
      : "single";

  const columnWidths = renderingLayout?.columnWidths ?? {
    left: 60,
    right: 40,
  };

  let padding = resolveLayoutPaddingMm(style.padding);

  if (newTemplate.id === "mercury") {
    padding = { top: 0, bottom: padding.bottom ?? 20, left: 0, right: 0 };
  }

  if (newTemplate.id === "corporate") {
    padding = {
      top: padding.top ?? CORPORATE_LAYOUT_PADDING_MM.top,
      bottom: padding.bottom ?? CORPORATE_LAYOUT_PADDING_MM.bottom,
      left: padding.left ?? CORPORATE_LAYOUT_PADDING_MM.left,
      right: padding.right ?? CORPORATE_LAYOUT_PADDING_MM.right,
    };
  }

  return {
    type,
    columnWidths: {
      left: columnWidths.left,
      right: columnWidths.right,
    },
    padding,
  };
}

/** Rebuild section order/titles from the new template while keeping user visibility and custom sections. */
export function buildSectionsForTemplateSwitch(
  newTemplate: ResumeTemplate,
  currentSections: ResumeEditorSection[],
): ResumeEditorSection[] {
  const extended = getExtendedTemplate(newTemplate);
  const defaultOrder = extended.defaultSectionOrder ?? [];

  if (defaultOrder.length === 0) {
    return currentSections.map((section) => ({
      ...section,
      expanded: section.expanded ?? section.visible,
    }));
  }

  const byId = new Map(currentSections.map((section) => [section.id, section]));
  const byType = new Map<string, ResumeEditorSection>();
  for (const section of currentSections) {
    if (!byType.has(section.type)) {
      byType.set(section.type, section);
    }
  }

  const defaultTypes = new Set(defaultOrder.map((section) => section.type));
  const usedIds = new Set<string>();
  const result: ResumeEditorSection[] = [];

  for (const templateSection of defaultOrder) {
    const match =
      byId.get(templateSection.id) ?? byType.get(templateSection.type);

    result.push({
      id: templateSection.id,
      type: asResumeSectionType(templateSection.type),
      title: templateSection.title,
      visible: match?.visible ?? templateSection.visible,
      expanded: match?.expanded ?? templateSection.visible,
    });

    usedIds.add(templateSection.id);
    if (match) {
      usedIds.add(match.id);
    }
  }

  for (const section of currentSections) {
    if (usedIds.has(section.id)) {
      continue;
    }

    if (section.type === "custom" || !defaultTypes.has(section.type)) {
      result.push({
        ...section,
        expanded: section.expanded ?? section.visible,
      });
      usedIds.add(section.id);
    }
  }

  return result;
}

