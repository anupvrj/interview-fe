import { Resume } from "@/lib/api";
import { ExtendedResumeTemplate } from "@/configs/resume-templates/template-types";
import { TemplateLoader } from "@/lib/templateLoader";
import { getTemplateStyle } from "@/lib/templateRenderer";

const SECTION_TITLES: Record<string, string> = {
  personalInfo: "Personal Information",
  profileSummary: "Profile Summary",
  experience: "Professional Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  languages: "Languages",
  certificates: "Certificates",
  awards: "Awards",
  achievements: "Achievements",
  interests: "Interests",
  courses: "Courses",
  organisations: "Organisations",
  publications: "Publications",
  references: "References",
  declaration: "Declaration",
  technicalSkills: "Technical Skills",
};

const DEFAULT_SECTION_ORDER: NonNullable<Resume["sectionOrder"]> = [
  {
    id: "personalInfo",
    type: "personalInfo",
    title: SECTION_TITLES.personalInfo,
    visible: true,
  },
  {
    id: "profileSummary",
    type: "profileSummary",
    title: SECTION_TITLES.profileSummary,
    visible: true,
  },
  {
    id: "experience",
    type: "experience",
    title: SECTION_TITLES.experience,
    visible: true,
  },
  {
    id: "education",
    type: "education",
    title: SECTION_TITLES.education,
    visible: true,
  },
  {
    id: "skills",
    type: "skills",
    title: SECTION_TITLES.skills,
    visible: true,
  },
  {
    id: "projects",
    type: "projects",
    title: SECTION_TITLES.projects,
    visible: false,
  },
  {
    id: "languages",
    type: "languages",
    title: SECTION_TITLES.languages,
    visible: false,
  },
  {
    id: "certificates",
    type: "certificates",
    title: SECTION_TITLES.certificates,
    visible: false,
  },
  {
    id: "awards",
    type: "awards",
    title: SECTION_TITLES.awards,
    visible: false,
  },
];

export type ResumeLayoutConfig = NonNullable<Resume["layout"]> & {
  fontSize?: {
    heading?: number;
    subheading?: number;
    body?: number;
    small?: number;
    sectionHeader?: number;
  };
  fontFamily?: string;
};

function hasResumeSectionContent(
  content: Resume["content"],
  key: string,
): boolean {
  const val = content[key as keyof Resume["content"]];
  if (val == null) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "string") return val.trim().length > 0;
  if (typeof val === "object" && !Array.isArray(val)) {
    return Object.keys(val).length > 0;
  }
  return false;
}

function assignSectionColumns(
  sectionOrder: NonNullable<Resume["sectionOrder"]>,
  extended: ExtendedResumeTemplate,
  layoutType: "single" | "double",
): NonNullable<Resume["sectionOrder"]> {
  if (layoutType !== "double") {
    return sectionOrder.map(({ column: _column, ...section }) => section);
  }

  const renderingLayout = extended.rendering?.layout;
  const hasColumnAssignment =
    renderingLayout?.columnAssignment &&
    (renderingLayout.columnAssignment.left.length > 0 ||
      renderingLayout.columnAssignment.right.length > 0);

  if (hasColumnAssignment) {
    const { left = [], right = [] } = renderingLayout!.columnAssignment!;
    return sectionOrder.map((section) => {
      const inLeft =
        left.includes(section.id) || left.includes(section.type);
      const inRight =
        right.includes(section.id) || right.includes(section.type);
      let column: "left" | "right" = "left";
      if (inRight) column = "right";
      else if (inLeft) column = "left";
      return { ...section, column };
    });
  }

  let nonPersonalIndex = 0;
  return sectionOrder.map((section) => {
    if (section.id === "personalInfo") {
      const { column: _column, ...rest } = section;
      return rest;
    }
    const column =
      nonPersonalIndex % 2 === 0 ? ("left" as const) : ("right" as const);
    nonPersonalIndex++;
    return { ...section, column };
  });
}

function mergeSectionOrderWithContent(
  sectionOrder: NonNullable<Resume["sectionOrder"]>,
  content: Resume["content"],
  existingSectionOrder?: Resume["sectionOrder"],
): NonNullable<Resume["sectionOrder"]> {
  let merged = sectionOrder.map((section) => ({ ...section }));

  const sectionTypesInOrder = new Set(merged.map((section) => section.type));

  for (const key of Object.keys(content)) {
    if (key === "customSections" || !hasResumeSectionContent(content, key)) {
      continue;
    }

    const title =
      SECTION_TITLES[key] ||
      key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());

    if (sectionTypesInOrder.has(key)) {
      merged = merged.map((section) =>
        section.type === key ? { ...section, visible: true } : section,
      );
    } else {
      merged.push({
        id: key,
        type: key,
        title,
        visible: true,
      });
      sectionTypesInOrder.add(key);
    }
  }

  const customSections = content.customSections || [];
  const existingCustomById = new Map(
    (existingSectionOrder || [])
      .filter((section) => section.type === "custom")
      .map((section) => [section.id, section]),
  );

  for (const customSection of customSections) {
    if (sectionTypesInOrder.has(customSection.id)) continue;

    const existing = existingCustomById.get(customSection.id);
    merged.push({
      id: customSection.id,
      type: "custom",
      title: existing?.title || customSection.title,
      visible: existing?.visible ?? true,
    });
    sectionTypesInOrder.add(customSection.id);
  }

  return merged;
}

function buildLayoutFromTemplate(
  extended: ExtendedResumeTemplate,
): ResumeLayoutConfig {
  const renderingLayout = extended.rendering?.layout;
  const templateStyle = getTemplateStyle(extended);

  const layoutType = (
    renderingLayout?.type === "header-plus-columns"
      ? "double"
      : renderingLayout?.type || "single"
  ) as "single" | "double";

  return {
    type: layoutType,
    columnWidths: renderingLayout?.columnWidths || { left: 60, right: 40 },
    padding: templateStyle.padding || {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
    },
    fontSize: {
      heading: templateStyle.fontSize.heading,
      subheading: templateStyle.fontSize.subheading,
      body: templateStyle.fontSize.body,
      small: templateStyle.fontSize.small,
      sectionHeader: templateStyle.sectionHeader.fontSize,
    },
    fontFamily: templateStyle.fontFamily,
  };
}

export interface ApplyResumeTemplateResult {
  templateId: string;
  sectionOrder: NonNullable<Resume["sectionOrder"]>;
  layout: ResumeLayoutConfig;
}

/**
 * Build section order and layout from a template, merging in existing resume content.
 */
export async function buildResumeTemplateApplication(
  templateId: string,
  resume?: Pick<Resume, "content" | "sectionOrder">,
): Promise<ApplyResumeTemplateResult> {
  const templateConfig = await TemplateLoader.loadTemplate(templateId);
  const extended = {
    ...templateConfig.template,
    ...templateConfig.extended,
  } as ExtendedResumeTemplate;

  const layout = buildLayoutFromTemplate(extended);

  let sectionOrder =
    extended.defaultSectionOrder?.map((section) => ({ ...section })) ||
    DEFAULT_SECTION_ORDER.map((section) => ({ ...section }));

  if (resume?.content) {
    sectionOrder = mergeSectionOrderWithContent(
      sectionOrder,
      resume.content,
      resume.sectionOrder,
    );
  }

  sectionOrder = assignSectionColumns(sectionOrder, extended, layout.type);

  return {
    templateId,
    sectionOrder,
    layout,
  };
}
