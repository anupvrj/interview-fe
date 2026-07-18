import type { ExtendedResumeTemplate } from "@/configs/resume-templates/template-types";
import type { Resume } from "@/lib/api";
import { resumeApi, resumeDataExtractionApi } from "@/lib/api";
import { normalizeExperienceList } from "@/lib/resume-date-utils";
import { getExtendedTemplate } from "@/lib/templateConfigs";
import { isListedInTemplateColumnAssignment } from "@/lib/sectionColumnUtils";

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

const RESUME_STRING_CONTENT_FIELDS = new Set([
  "interests",
  "profileSummary",
  "declaration",
]);

const EMPTY_PERSONAL_INFO: Record<string, string> = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  portfolio: "",
};

export const RESUME_DISPLAY_PLACEHOLDERS = {
  fullName: "Your Name",
  portfolio: "Your Title",
  profileSummary:
    "Write a brief professional summary that highlights your experience, skills, and career goals.",
} as const;

/** Map LLM/LinkedIn field aliases onto the resume personalInfo schema. */
function unwrapPersonalInfoRecord(info: unknown): Record<string, unknown> {
  if (!info || typeof info !== "object" || Array.isArray(info)) {
    return {};
  }

  const record = info as Record<string, unknown>;
  const nested = record.content;
  if (
    nested &&
    typeof nested === "object" &&
    !Array.isArray(nested) &&
    (record.sectionType === "personalInfo" || record.format != null)
  ) {
    return nested as Record<string, unknown>;
  }

  return record;
}

function firstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    if (value == null) continue;
    const str = String(value).trim();
    if (str) return str;
  }
  return "";
}

/** Map LLM/LinkedIn field aliases onto the resume personalInfo schema. */
export function normalizePersonalInfoRecord(
  info: unknown,
): Record<string, string> {
  const record = unwrapPersonalInfoRecord(info);
  const asString = (value: unknown) =>
    value == null ? "" : String(value).trim();

  const normalized: Record<string, string> = {
    ...EMPTY_PERSONAL_INFO,
    fullName: firstNonEmpty(
      record.fullName,
      record.name,
      record.full_name,
      record.fullname,
    ),
    email: asString(record.email),
    phone: asString(record.phone),
    location: asString(record.location ?? record.city),
    linkedin: asString(record.linkedin ?? record.linkedIn),
    github: asString(record.github),
    portfolio: firstNonEmpty(
      record.portfolio,
      record.jobTitle,
      record.job_title,
      record.headline,
      record.role,
    ),
    yearsOfExperience: asString(record.yearsOfExperience),
    profilePicture: asString(
      record.profilePicture ??
        record.profile_picture ??
        record.photo ??
        record.avatar,
    ),
    website: asString(record.website),
  };

  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string" && !(key in normalized)) {
      normalized[key] = value.trim();
    }
  }

  return normalized;
}

/** Guarantee `content.personalInfo` exists so editor/renderer never crash on import. */
export function ensureResumePersonalInfo<
  T extends Record<string, unknown> & { personalInfo?: unknown },
>(content: T): T {
  content.personalInfo = normalizePersonalInfoRecord(content.personalInfo);
  return content;
}

/** Preview-only label when a personalInfo field is empty. */
export function personalInfoDisplayText(
  value: string | undefined,
  placeholder: string,
): string {
  return value?.trim() ? value.trim() : placeholder;
}

/** @deprecated Use normalizePersonalInfoRecord + personalInfoDisplayText instead. */
export function resolveResumePersonalInfoForDisplay(
  content: Partial<Resume["content"]> | undefined,
): NonNullable<Resume["content"]["personalInfo"]> {
  return normalizePersonalInfoRecord(content?.personalInfo);
}

/** Coerce LLM/import values into resume string fields (schema expects strings, not arrays). */
export function coerceToResumeString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") return [item.trim()];
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const record = item as Record<string, unknown>;
          const candidate =
            record.name ??
            record.title ??
            record.interest ??
            record.label ??
            record.text;
          if (typeof candidate === "string" && candidate.trim()) {
            return [candidate.trim()];
          }
        }
        return [];
      })
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);

    if (keys.length > 0 && keys.every((key) => /^\d+$/.test(key))) {
      return keys
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => String(record[key] ?? ""))
        .join("");
    }

    if (typeof record.content === "string") return record.content;
    if (Array.isArray(record.content)) {
      return coerceToResumeString(record.content);
    }
  }

  return String(value);
}

function coerceProjectsInput(items: unknown): unknown[] {
  if (Array.isArray(items)) return items;
  if (items == null) return [];

  if (typeof items === "object" && !Array.isArray(items)) {
    const record = items as Record<string, unknown>;
    if (Array.isArray(record.content)) return record.content;
    if (record.content != null) return [record.content];
    return [items];
  }

  if (typeof items === "string" && items.trim()) {
    return [{ name: "Project", description: items.trim() }];
  }

  return [];
}

/** Normalize imported/LLM project entries onto the resume schema. */
export function normalizeProjectsList(
  items: unknown,
): Array<Record<string, unknown>> {
  const list = coerceProjectsInput(items);
  if (list.length === 0) return [];

  return list
    .flatMap((item) => {
      if (typeof item === "string" && item.trim()) {
        return [{ name: "Project", description: item.trim() }];
      }
      if (item && typeof item === "object" && !Array.isArray(item)) {
        return [item];
      }
      return [];
    })
    .map((item) => {
      const record = item as Record<string, unknown>;
      const name = String(
        record.name ??
          record.title ??
          record.project ??
          record.projectName ??
          record.heading ??
          record.label ??
          "",
      ).trim();
      let description =
        record.description ?? record.summary ?? record.details ?? record.content;
      if (Array.isArray(description)) {
        description = `<ul>${description
          .map((line) => `<li>${String(line).trim()}</li>`)
          .join("")}</ul>`;
      } else if (description != null) {
        description = String(description);
      } else {
        description = "";
      }

      let technologies =
        record.technologies ?? record.tech ?? record.stack ?? record.tools;
      if (typeof technologies === "string") {
        technologies = technologies
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }

      const endRaw = String(record.endDate ?? record.end ?? "").trim();
      const endLower = endRaw.toLowerCase();
      const current =
        Boolean(record.current) ||
        endLower === "present" ||
        endLower === "current" ||
        endLower === "till date" ||
        endLower === "till present";

      return {
        ...record,
        id: record.id ?? createEntryId(),
        name,
        description,
        technologies,
        startDate: record.startDate ?? record.start ?? record.fromDate ?? "",
        endDate: current ? "" : endRaw,
        current,
      };
    })
    .filter((item) => item.name || item.description);
}

function sanitizeResumeStringFields(
  content: Record<string, unknown>,
): Record<string, unknown> {
  for (const field of RESUME_STRING_CONTENT_FIELDS) {
    if (field in content && content[field] != null) {
      content[field] = coerceToResumeString(content[field]);
    }
  }
  return content;
}

/** Maps LLM extraction output to resume `content` — same rules as resume creation. */
export function mapExtractedSectionsToContent(
  sections: Record<string, ExtractedSectionPayload>,
): Record<string, unknown> {
  const content: Record<string, unknown> = {};

  for (const [sectionType, sectionData] of Object.entries(sections)) {
    if (sectionType === "personalInfo") {
      const rawPersonal =
        sectionData.content &&
        typeof sectionData.content === "object" &&
        !Array.isArray(sectionData.content)
          ? sectionData.content
          : undefined;
      if (rawPersonal) {
        content.personalInfo = normalizePersonalInfoRecord(rawPersonal);
      }
      continue;
    }

    if (sectionType === "technicalSkills" || sectionType === "skills") {
      content.skills = sectionData.content;
      continue;
    }

    if (RESUME_STRING_CONTENT_FIELDS.has(sectionType)) {
      content[sectionType] = coerceToResumeString(sectionData.content);
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

  if (Array.isArray(content.experience)) {
    content.experience = normalizeExperienceList(content.experience);
  }

  if (Array.isArray(content.projects)) {
    content.projects = normalizeProjectsList(content.projects);
  } else if (content.projects != null) {
    content.projects = normalizeProjectsList([content.projects]);
  } else {
    content.projects = [];
  }

  ensureResumePersonalInfo(content);

  if (
    typeof content.profileSummary !== "string" ||
    !content.profileSummary.trim()
  ) {
    content.profileSummary = "";
  }

  if (!Array.isArray(content.experience)) {
    content.experience = [];
  }
  if (!Array.isArray(content.education)) {
    content.education = [];
  }

  return sanitizeResumeStringFields(content);
}

/** Normalize imported/dummy resume content before persisting to the API. */
export function normalizeResumeImportContent(
  content: Record<string, unknown>,
): Record<string, unknown> {
  const normalized = { ...content };

  if (Array.isArray(normalized.experience)) {
    normalized.experience = normalizeExperienceList(normalized.experience);
  } else if (!Array.isArray(normalized.experience)) {
    normalized.experience = [];
  }

  if (Array.isArray(normalized.projects)) {
    normalized.projects = normalizeProjectsList(normalized.projects);
  } else if (normalized.projects != null) {
    normalized.projects = normalizeProjectsList([normalized.projects]);
  } else {
    normalized.projects = [];
  }

  ensureResumePersonalInfo(normalized);
  return sanitizeResumeStringFields(normalized);
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
    const { left = [], right = [] } = renderingLayout!.columnAssignment!;
    return sectionOrder.map((s) => {
      const column = isListedInTemplateColumnAssignment(right, s)
        ? ("right" as const)
        : isListedInTemplateColumnAssignment(left, s)
          ? ("left" as const)
          : ("left" as const);
      return { ...s, column };
    });
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
    profileSummary:
      typeof content.profileSummary === "string"
        ? content.profileSummary
        : undefined,
    sectionOrder,
  });
}

/** Import LinkedIn profile into an existing resume — same replace logic as PDF import. */
export async function importResumeFromLinkedIn(
  resumeId: string,
  templateId: string,
  handle: string,
  options?: {
    layout?: Resume["layout"];
  },
): Promise<Resume> {
  const template = await resumeApi.getTemplate(templateId);
  const extended = getExtendedTemplate(template);
  const extracted = await resumeDataExtractionApi.importLinkedInProfile(
    handle.trim(),
    templateId,
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
    profileSummary:
      typeof content.profileSummary === "string"
        ? content.profileSummary
        : undefined,
    sectionOrder,
  });
}
