import type { ExtendedResumeTemplate } from "@/configs/resume-templates/template-types";
import type { Resume } from "@/lib/api";
import { resumeApi, resumeDataExtractionApi } from "@/lib/api";
import { getExtendedTemplate } from "@/lib/templateConfigs";

export type ExtractedSectionPayload = {
  sectionType: string;
  content: string | unknown;
  format: "html" | "list" | "paragraph" | "structured";
};

export type ResumeSectionOrderItem = {
  id: string;
  type: string;
  title: string;
  visible: boolean;
  column?: "left" | "right";
};

export const RESUME_IMPORT_PROCESSING_MESSAGES = [
  "Extracting data from your resume and structuring it…",
  "Analyzing your work experience and achievements…",
  "Identifying key skills and strengths…",
  "Mapping your experience into clear resume sections…",
  "Refining wording for better recruiter impact…",
  "Organizing sections for better readability…",
  "Polishing details to make your resume stand out…",
  "Final checks in progress. Almost done…",
] as const;

export const RESUME_SECTION_TITLES: Record<string, string> = {
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

const FALLBACK_SECTION_ORDER: ResumeSectionOrderItem[] = [
  {
    id: "personalInfo",
    type: "personalInfo",
    title: RESUME_SECTION_TITLES.personalInfo,
    visible: true,
  },
  {
    id: "profileSummary",
    type: "profileSummary",
    title: RESUME_SECTION_TITLES.profileSummary,
    visible: true,
  },
  {
    id: "experience",
    type: "experience",
    title: RESUME_SECTION_TITLES.experience,
    visible: true,
  },
  {
    id: "education",
    type: "education",
    title: RESUME_SECTION_TITLES.education,
    visible: true,
  },
  {
    id: "skills",
    type: "skills",
    title: RESUME_SECTION_TITLES.skills,
    visible: true,
  },
  {
    id: "projects",
    type: "projects",
    title: RESUME_SECTION_TITLES.projects,
    visible: false,
  },
  {
    id: "languages",
    type: "languages",
    title: RESUME_SECTION_TITLES.languages,
    visible: false,
  },
  {
    id: "certificates",
    type: "certificates",
    title: RESUME_SECTION_TITLES.certificates,
    visible: false,
  },
  {
    id: "awards",
    type: "awards",
    title: RESUME_SECTION_TITLES.awards,
    visible: false,
  },
];

function createEntryId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function hasResumeSectionContent(
  content: Record<string, unknown>,
  key: string,
): boolean {
  const val = content[key];
  if (val == null) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "string") return val.trim().length > 0;
  if (typeof val === "object" && !Array.isArray(val)) {
    return Object.keys(val as object).length > 0;
  }
  return false;
}

/** Maps LLM extraction output to resume `content` — same rules as resume creation. */
export function mapExtractedSectionsToContent(
  sections: Record<string, ExtractedSectionPayload>,
): Record<string, unknown> {
  const content: Record<string, unknown> = {};

  for (const [sectionType, sectionData] of Object.entries(sections)) {
    if (sectionType === "personalInfo") {
      if (
        sectionData.format === "structured" &&
        typeof sectionData.content === "object" &&
        sectionData.content !== null &&
        !Array.isArray(sectionData.content)
      ) {
        content.personalInfo = sectionData.content;
      } else if (
        typeof sectionData.content === "object" &&
        sectionData.content !== null
      ) {
        content.personalInfo = sectionData.content;
      }
      continue;
    }

    if (sectionType === "technicalSkills" || sectionType === "skills") {
      content.skills = sectionData.content;
      continue;
    }

    if (
      sectionData.format === "structured" &&
      Array.isArray(sectionData.content)
    ) {
      content[sectionType] = sectionData.content.map((item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        "id" in item
          ? item
          : { ...(item as object), id: createEntryId() },
      );
      continue;
    }

    if (typeof sectionData.content === "string") {
      content[sectionType] = sectionData.content;
      continue;
    }

    content[sectionType] = sectionData.content;
  }

  if (!content.customSections) {
    content.customSections = [];
  }

  return content;
}

export function buildSectionOrderForExtractedContent(
  extended: Pick<
    ExtendedResumeTemplate,
    "defaultSectionOrder" | "rendering"
  >,
  content: Record<string, unknown>,
  layoutType: "single" | "double" = "single",
): ResumeSectionOrderItem[] {
  const renderingLayout = extended.rendering?.layout;
  let sectionOrder: ResumeSectionOrderItem[] = (
    extended.defaultSectionOrder?.length
      ? extended.defaultSectionOrder
      : FALLBACK_SECTION_ORDER
  ).map((section) => ({
    id: section.id,
    type: section.type,
    title: section.title,
    visible: section.visible ?? true,
    column: section.column,
  }));

  const sectionTypesInOrder = new Set(sectionOrder.map((s) => s.type));

  for (const key of Object.keys(content)) {
    if (!hasResumeSectionContent(content, key)) continue;
    if (key === "customSections") continue;

    const title =
      RESUME_SECTION_TITLES[key] ||
      key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

    if (sectionTypesInOrder.has(key)) {
      sectionOrder = sectionOrder.map((s) =>
        s.type === key ? { ...s, visible: true } : s,
      );
    } else {
      sectionOrder.push({
        id: key,
        type: key,
        title,
        visible: true,
      });
      sectionTypesInOrder.add(key);
    }
  }

  if (layoutType !== "double") {
    return sectionOrder;
  }

  const hasColumnAssignment =
    renderingLayout?.columnAssignment &&
    (renderingLayout.columnAssignment.left.length > 0 ||
      renderingLayout.columnAssignment.right.length > 0);

  if (hasColumnAssignment) {
    return sectionOrder.map((s) => ({
      ...s,
      column: renderingLayout!.columnAssignment!.left.includes(s.id)
        ? ("left" as const)
        : renderingLayout!.columnAssignment!.right.includes(s.id)
          ? ("right" as const)
          : ("left" as const),
    }));
  }

  let nonPersonalIndex = 0;
  return sectionOrder.map((s) => {
    if (s.id === "personalInfo") return s;
    const column =
      nonPersonalIndex % 2 === 0 ? ("left" as const) : ("right" as const);
    nonPersonalIndex++;
    return { ...s, column };
  });
}

export async function importResumeFromExtractedText(
  resumeId: string,
  templateId: string,
  resumeText: string,
  options?: {
    layout?: Resume["layout"];
  },
): Promise<Resume> {
  const template = await resumeApi.getTemplate(templateId);
  const extended = getExtendedTemplate(template);
  const extracted = await resumeDataExtractionApi.extractResumeData(
    templateId,
    resumeText,
  );
  const content = mapExtractedSectionsToContent(extracted.sections);
  const layoutType =
    options?.layout?.type ??
    (extended.rendering?.layout?.type === "header-plus-columns" ||
    extended.rendering?.layout?.type === "double"
      ? "double"
      : "single");

  const sectionOrder = buildSectionOrderForExtractedContent(
    extended,
    content,
    layoutType,
  );

  return resumeApi.update(resumeId, {
    content: content as Partial<Resume["content"]>,
    sectionOrder,
  });
}
