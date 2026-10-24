/**
 * Configuration-Driven Resume Renderer
 * Renders resumes based purely on template configuration without hardcoded template logic
 */

"use client";

import { organizeSectionColumns } from "@/lib/sectionLayout";
import { ensureResumeSharedStyles } from "@/lib/resume-fonts";
import React, { useRef, useMemo } from "react";
import { Resume, ResumeTemplate } from "@/lib/api";
import { ATLANTIC_BLUE_INNER_PADDING_PX } from "@/configs/resume-templates/atlantic-blue/column-insets";
import { mergeLayoutPaddingWithTemplateStyle } from "@/lib/resume-page-dimensions";
import { getExtendedTemplate } from "@/lib/templateConfigs";
import { isListedInTemplateColumnAssignment } from "@/lib/sectionColumnUtils";
import { getTemplateStyle, TemplateStyleConfig } from "@/lib/templateRenderer";
import { shouldAppendEducationField } from "@/lib/educationDisplay";
import { useCanvasEdit } from "@/components/resume-canvas/CanvasEditContext";
import { EdText, pathRevealed, richEditProps, stableHtml } from "@/components/resume-canvas/Editable";
import {
  User,
  Briefcase,
  GraduationCap,
  Brain,
  Globe,
  Award,
  FileText,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  ExternalLink,
  Github,
} from "lucide-react";

interface Section {
  id: string;
  type: string;
  title: string;
  visible: boolean;
  column?: "left" | "right";
  isContinued?: boolean;
}

interface ResumeRendererProps {
  resume: Resume;
  template: ResumeTemplate;
  sections?: Section[];
  layout?: {
    type: "single" | "double";
    columnWidths?: { left: number; right: number };
    padding?: { top: number; bottom: number; left: number; right: number };
  };
  pageNumber?: number;
}

import {
  formatExperienceDateRange,
  formatExperienceDateRangeAbbreviated,
  formatProjectDateRange,
  formatResumeDateForDisplay,
  setResumeDateFormat,
} from "@/lib/resume-date-utils";
import {
  RESUME_DISPLAY_PLACEHOLDERS,
  normalizePersonalInfoRecord,
} from "@/lib/resume-data-import";

interface PageBreak {
  pageNumber: number;
  sections: string[];
}

/** Contact fields shown as empty placeholders while editing on the canvas. */
const CONTACT_PLACEHOLDERS: Record<string, string> = {
  phone: "Phone number",
  email: "Email address",
  linkedin: "Profile link",
  location: "City",
};

const ICON_MAP = {
  personalInfo: User,
  experience: Briefcase,
  education: GraduationCap,
  skills: Brain,
  languages: Globe,
  awards: Award,
  projects: FileText,
  achievements: Award,
  certificates: Award,
  interests: FileText,
  courses: GraduationCap,
  organisations: Briefcase,
  publications: FileText,
  references: User,
  declaration: FileText,
  profileSummary: User,
  quote: FileText,
};

/** Split "Core Strengths" lines into bold label + regular description (preview format). */
function parseConfidentGridSkillItem(
  item: string,
): { name: string; description?: string } {
  const trimmed = item.trim();
  if (!trimmed) return { name: "" };

  const match = trimmed.match(/^(.+?)\s*[—–]\s+(.+)$/);
  if (match) {
    return { name: match[1].trim(), description: match[2].trim() };
  }

  const hyphenMatch = trimmed.match(/^(.+?)\s+-\s+(.+)$/);
  if (hyphenMatch) {
    return { name: hyphenMatch[1].trim(), description: hyphenMatch[2].trim() };
  }

  return { name: trimmed };
}

function parseConfidentGridSkillsList(
  data: unknown,
): { name: string; description?: string }[] {
  if (!data) return [];

  const toParsed = (items: string[]) =>
    items
      .map((item) => item.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .map(parseConfidentGridSkillItem)
      .filter((item) => item.name);

  if (Array.isArray(data)) {
    return toParsed(data.map((item) => String(item)));
  }

  if (typeof data === "string") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, "text/html");
      const listElements = doc.querySelectorAll("ul > li, ol > li, p");
      if (listElements.length > 0) {
        return toParsed(
          Array.from(listElements)
            .map((el) => el.textContent?.trim() || "")
            .filter(Boolean),
        );
      }
    } catch {
      /* fall through */
    }

    return toParsed(
      data
        .split(/\n|<br\s*\/?>/i)
        .map((line) => line.replace(/<[^>]+>/g, "").trim())
        .filter(Boolean),
    );
  }

  if (typeof data === "object" && data !== null) {
    const values = Object.values(data as Record<string, unknown>).flatMap(
      (value) => {
        if (Array.isArray(value)) return value.map(String);
        if (value == null) return [];
        return [String(value)];
      },
    );
    return toParsed(values);
  }

  return [];
}

function formatCondensedRuleLanguageLevel(level?: number): string {
  if (!level) return "";
  if (level >= 5) return "Native";
  if (level >= 4) return "Fluent";
  return "Intermediate";
}

/**
 * A contact icon in a box exactly one text line tall, so it lines up with the first line
 * whatever the font (a wrapped "City, State, / Country" used to put it between the lines,
 * and fonts with tall line boxes made it sit high). A div, not a span: templates style
 * "contact-item span" text colours/fonts, which would recolour the icon.
 */
function ContactIcon({ icon: Icon, size, fontSize }: { icon: React.ComponentType<any>; size: number; fontSize?: string }) {
  return (
    <div
      className="rx-contact-icon"
      style={{ display: "inline-flex", alignItems: "center", height: "1.4em", flexShrink: 0, fontSize }}
    >
      <Icon size={size} style={{ flexShrink: 0, display: "block" }} />
    </div>
  );
}

/** A link for what people type: a full URL, "linkedin.com/in/x", or just the handle "x". */
function profileHref(kind: "linkedin" | "website", raw?: string): string | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (kind === "linkedin" && !/linkedin\.com/i.test(value)) return `https://www.linkedin.com/in/${value.replace(/^@/, "")}`;
  return `https://${value.replace(/^\/\//, "")}`;
}

/**
 * `edit` (on the editor canvas) turns each item's name into an inline field, so one-line
 * lists are editable in place like every other entry.
 */
type InlineEdit = (index: number, label: string) => React.ReactNode;

function renderCondensedRuleLabeledInlineList(
  items: { label: string; value: string }[],
  className: string,
  edit?: InlineEdit,
): React.ReactNode {
  const filtered = items.map((item, index) => ({ ...item, index })).filter((item) => item.label.trim());
  if (filtered.length === 0) return null;

  return (
    <div className={className}>
      {filtered.map((item, n) => (
        <span key={`${item.label}-${item.index}`} data-item-index={edit ? item.index : undefined}>
          {n > 0 && (
            <span className="condensed-rule-inline-separator"> | </span>
          )}
          {/* No level: just the name ("English", not "English:"). */}
          <span className="condensed-rule-inline-label">
            {edit ? edit(item.index, item.label) : item.label}
            {item.value?.trim() ? ":" : ""}
          </span>
          {item.value?.trim() ? <> {item.value}</> : null}
        </span>
      ))}
    </div>
  );
}

function renderCondensedRuleInlineList(
  items: string[],
  className: string,
  edit?: InlineEdit,
): React.ReactNode {
  const filtered = items.map((item, index) => ({ text: item.trim(), index })).filter((item) => item.text);
  if (filtered.length === 0) return null;

  return (
    <div className={className}>
      {filtered.map((item, n) => (
        <span key={`${item.text}-${item.index}`} data-item-index={edit ? item.index : undefined}>
          {n > 0 && (
            <span className="condensed-rule-inline-separator"> | </span>
          )}
          {edit ? edit(item.index, item.text) : item.text}
        </span>
      ))}
    </div>
  );
}

function formatRoyalIndigoLanguageLevel(level?: number): string {
  if (!level) return "";
  if (level >= 5) return "Fluent";
  if (level >= 4) return "intermediate";
  return "basic";
}

const SAFFRON_LINE_SKILL_CATEGORIES = [
  {
    key: "programmingLanguages",
    label: "Programming Languages",
    aliases: ["programming languages", "programming language"],
  },
  {
    key: "frameworksLibraries",
    label: "Frameworks & Libraries",
    aliases: ["frameworks & libraries", "frameworks and libraries"],
  },
  {
    key: "coreConcepts",
    label: "Core Concepts",
    aliases: ["core concepts", "core concept"],
  },
  {
    key: "developerTools",
    label: "Developer Tools",
    aliases: ["developer tools", "dev tools"],
  },
] as const;

function normalizeSaffronSkillValue(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "string") {
    return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  return String(value).trim();
}

function parseSaffronLineSkillGroups(
  data: unknown,
): { label: string; value: string }[] {
  if (!data) return [];

  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    const groups: { label: string; value: string }[] = [];

    for (const category of SAFFRON_LINE_SKILL_CATEGORIES) {
      const direct = normalizeSaffronSkillValue(record[category.key]);
      if (direct) {
        groups.push({ label: category.label, value: direct });
        continue;
      }

      for (const alias of category.aliases) {
        const aliasValue = Object.entries(record).find(
          ([key]) => key.trim().toLowerCase() === alias,
        )?.[1];
        const text = normalizeSaffronSkillValue(aliasValue);
        if (text) {
          groups.push({ label: category.label, value: text });
          break;
        }
      }
    }

    if (groups.length > 0) return groups;

    const genericGroups = Object.entries(record)
      .map(([label, value]) => ({
        label: label.trim(),
        value: normalizeSaffronSkillValue(value),
      }))
      .filter((group) => group.label && group.value);

    if (genericGroups.length > 0) return genericGroups;
  }

  if (typeof data === "string") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, "text/html");
      const groups: { label: string; value: string }[] = [];

      doc.querySelectorAll("p, li").forEach((el) => {
        const text = (el.textContent || "").replace(/\s+/g, " ").trim();
        const match = text.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          groups.push({
            label: match[1].trim(),
            value: match[2].trim(),
          });
        }
      });

      if (groups.length > 0) return groups;
    } catch {
      /* fall through */
    }

    const lines = data
      .split(/\n|<br\s*\/?>/i)
      .map((line) => line.replace(/<[^>]+>/g, "").trim())
      .filter(Boolean);

    const lineGroups = lines
      .map((line) => {
        const match = line.match(/^([^:]+):\s*(.+)$/);
        if (!match) return null;
        return { label: match[1].trim(), value: match[2].trim() };
      })
      .filter((group): group is { label: string; value: string } => Boolean(group));

    if (lineGroups.length > 0) return lineGroups;
  }

  if (Array.isArray(data)) {
    const items = data.map((item) => String(item).trim()).filter(Boolean);
    if (items.length === 0) return [];

    const labeled = items
      .map((item) => {
        const match = item.match(/^([^:]+):\s*(.+)$/);
        if (!match) return null;
        return { label: match[1].trim(), value: match[2].trim() };
      })
      .filter((group): group is { label: string; value: string } => Boolean(group));

    if (labeled.length > 0) return labeled;

    const chunkSize = Math.ceil(items.length / SAFFRON_LINE_SKILL_CATEGORIES.length);
    return SAFFRON_LINE_SKILL_CATEGORIES.map((category, index) => ({
      label: category.label,
      value: items
        .slice(index * chunkSize, (index + 1) * chunkSize)
        .join(", "),
    })).filter((group) => group.value);
  }

  return [];
}

function formatSaffronLineLanguageLevel(level?: number): string {
  if (!level) return "";
  if (level >= 5) return "Native";
  if (level >= 4) return "Professional Working Proficiency";
  if (level >= 3) return "Limited Working Proficiency";
  return "Elementary Proficiency";
}

function parseRoyalIndigoSkillItems(skillsData: unknown): string[] {
  if (!skillsData) return [];

  if (typeof skillsData === "string") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(skillsData, "text/html");
      const listElements = doc.querySelectorAll("ul > li, ol > li");
      if (listElements.length > 0) {
        return Array.from(listElements)
          .map((el) => el.textContent?.trim() || "")
          .filter(Boolean);
      }
      return skillsData
        .split(/[,|]/)
        .map((item) => item.trim())
        .filter(Boolean);
    } catch {
      return skillsData
        .split(/[,|]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  if (Array.isArray(skillsData)) {
    return skillsData
      .map((skill: unknown) =>
        typeof skill === "string" ? skill : String(skill),
      )
      .filter((text: string) => text.length > 0);
  }

  return [];
}

/** Real text in a field that may be HTML, an array of lines, or [""] from an empty editor. */
function hasText(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasText);
  if (typeof value === "string") return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;
  return !!value;
}

/** What an empty section offers on the canvas (never rendered in the PDF). */
const EMPTY_SECTION_ACTION: Record<string, string> = {
  experience: "Add a job",
  education: "Add education",
  projects: "Add a project",
  awards: "Add an award",
  certificates: "Add a certificate",
  courses: "Add a course",
  publications: "Add a publication",
  references: "Add a reference",
  organisations: "Add an organisation",
  languages: "Add a language",
  achievements: "Add an achievement",
};

export function ResumeRenderer({
  resume,
  template,
  sections,
  layout,
  pageNumber = 1,
}: ResumeRendererProps) {
  const extendedTemplate = getExtendedTemplate(template);

  // On-canvas editing (only inside the editor's CanvasEditProvider). Legacy executive
  // resumes keep their data in `content.sections`; those are edited from the side panel.
  const canvasApi = useCanvasEdit();
  const usesLegacySections =
    resume.templateId === "executive" && Array.isArray((resume.content as { sections?: unknown }).sections);
  const canvas = usesLegacySections ? null : canvasApi;
  const ed = (path: string, value: string | undefined | null, placeholder?: string) => (
    <EdText canvas={canvas} path={path} value={value} placeholder={placeholder} />
  );
  const rich = (path: string, placeholder?: string) => richEditProps(canvas, path, placeholder);
  // Empty optional slots (a missing date, description, contact) only appear for what is
  // selected — otherwise the page shows exactly what will be exported.
  const revealEntry = (sectionId: string, index: number) =>
    !!canvas?.focus && canvas.focus.sectionId === sectionId && (canvas.focus.index === null || canvas.focus.index === index);
  const revealPath = (entryPath: string) => {
    const [type, idx] = entryPath.split(".");
    return !!canvas?.focus && canvas.focus.sectionType === type && (canvas.focus.index === null || canvas.focus.index === Number(idx));
  };
  const revealContacts = canvas?.focus?.sectionType === "personalInfo";
  /** A single date (certificate issued, award, course, publication): opens a one-date picker. */
  const edDate1 = (fieldPath: string, content: string) =>
    canvas ? (
      <span
        className="rx-date"
        data-rx-date={fieldPath}
        data-placeholder={pathRevealed(canvas, fieldPath) ? "Add date" : undefined}
        role="button"
        tabIndex={0}
      >
        {content}
      </span>
    ) : (
      content
    );
  /** Dates open a Start/End editor on the canvas; `entryPath` is e.g. "experience.2". */
  const edDate = (entryPath: string, content: React.ReactNode) =>
    canvas ? (
      <span
        className="rx-date"
        data-rx-date={entryPath}
        data-placeholder={revealPath(entryPath) ? "Add dates" : undefined}
        role="button"
        tabIndex={0}
      >
        {content}
      </span>
    ) : (
      content
    );
  const edTitle = (sectionId: string | undefined, title: string, uppercase: boolean) =>
    sectionId ? (
      <EdText canvas={canvas} path={`@section:${sectionId}`} value={title} uppercase={uppercase} />
    ) : uppercase ? (
      title.toUpperCase()
    ) : (
      title
    );

  const baseTemplateStyle = getTemplateStyle(extendedTemplate);
  const resumeLayout = layout || resume.layout || { type: "single" };
  // Every date below (and the PDF printed from this page) uses the style picked in Style.
  setResumeDateFormat((resumeLayout as { dateFormat?: string }).dateFormat);
  const layoutTypo = resumeLayout as {
    fontSize?: {
      heading?: number;
      subheading?: number;
      body?: number;
      small?: number;
      sectionHeader?: number;
    };
    fontFamily?: string;
  };

  // Merge custom layout (padding, user font size, font family) into template style
  const templateStyle = {
    ...baseTemplateStyle,
    padding: mergeLayoutPaddingWithTemplateStyle(
      resumeLayout.padding,
      baseTemplateStyle.padding,
    ),
    fontSize: {
      ...baseTemplateStyle.fontSize,
      ...layoutTypo.fontSize,
    },
    fontFamily: layoutTypo.fontFamily ?? baseTemplateStyle.fontFamily,
    sectionHeader: {
      ...baseTemplateStyle.sectionHeader,
      ...(layoutTypo.fontSize?.sectionHeader != null && {
        fontSize: layoutTypo.fontSize.sectionHeader,
      }),
    },
  };

  /** When true, template style.css controls name/job-title/section-header typography. */
  const useCssHeaderClasses = templateStyle.useCSSClassesForHeader !== false;

  const isSaffronLine = template.id === "saffron-line";
  const isEmberTimeline = template.id === "ember-timeline";
  const isConfidentGrid = template.id === "confident-grid";
  const isCondensedRule = template.id === "condensed-rule";
  const isRoyalIndigo = template.id === "royal-indigo";
  const isCobaltStream = template.id === "cobalt-stream";
  const isAmberEdge = template.id === "amber-edge";
  const isMeridian = template.id === "meridian";
  const formatRoyalIndigoDateRange = formatExperienceDateRangeAbbreviated;
  const useCssExpTypography =
    isEmberTimeline || isConfidentGrid || isCondensedRule || isRoyalIndigo || isCobaltStream || isAmberEdge || isMeridian || isSaffronLine;
  const useCssBodyTypography =
    isConfidentGrid || isCondensedRule || isRoyalIndigo || isCobaltStream || isAmberEdge || isMeridian || isSaffronLine;
  const effectiveResumeLayout =
    isSaffronLine && extendedTemplate?.rendering?.layout?.type === "double"
      ? {
          ...resumeLayout,
          type: "double" as const,
          columnWidths: extendedTemplate.rendering.layout.columnWidths ??
            resumeLayout.columnWidths ?? { left: 36, right: 64 },
        }
      : isConfidentGrid && extendedTemplate?.rendering?.layout?.type === "double"
        ? {
            ...resumeLayout,
            type: "double" as const,
            columnWidths: extendedTemplate.rendering.layout.columnWidths ??
              resumeLayout.columnWidths ?? { left: 50, right: 50 },
          }
        : resumeLayout;

  const stripLeadingBullet = (text: string): string =>
    text
      .replace(/^[\s\u2022\u2023\u2043\u2219•●◦·\-*]+\s*/, "")
      .trim();

  const formatExperienceDescriptionHtml = (description: unknown) => {
    if (!description) return "";

    if (typeof description === "string") {
      const trimmed = description.trim();
      if (!trimmed) return "";
      // Rich-text editor already outputs list markup — do not wrap again
      if (/<ul[\s>]/i.test(trimmed) || /<ol[\s>]/i.test(trimmed)) {
        return trimmed.replace(
          /(<li[^>]*>)\s*[•●◦·\-*]\s*/gi,
          "$1",
        );
      }
      return trimmed;
    }

    if (Array.isArray(description)) {
      const items = description
        .map((item) => String(item).trim())
        .filter(Boolean);

      if (items.length === 0) return "";

      // Single item that is already full list HTML
      if (
        items.length === 1 &&
        (/<ul[\s>]/i.test(items[0]) || /<ol[\s>]/i.test(items[0]))
      ) {
        return items[0];
      }

      const cleanItems = items.map(stripLeadingBullet);
      if (isSaffronLine || isConfidentGrid || isCondensedRule || isRoyalIndigo || isAmberEdge || isMeridian) {
        return `<ul>${cleanItems.map((item) => `<li>${item}</li>`).join("")}</ul>`;
      }
      return cleanItems.map((item) => `<p>${item}</p>`).join("");
    }

    return String(description);
  };

  const mergeHeaderNameStyle = (
    layout: React.CSSProperties,
    color?: string,
  ): React.CSSProperties => {
    if (useCssHeaderClasses) {
      return layout;
    }
    return {
      fontSize: `${templateStyle.fontSize.heading}px`,
      fontWeight: "bold",
      ...(color ? { color } : {}),
      fontFamily: templateStyle.fontFamily,
      ...layout,
    };
  };

  const mergeHeaderJobTitleStyle = (
    layout: React.CSSProperties,
    color?: string,
  ): React.CSSProperties => {
    if (useCssHeaderClasses) {
      return layout;
    }
    return {
      fontSize: `${templateStyle.fontSize.subheading}px`,
      ...(color ? { color } : {}),
      fontFamily: templateStyle.fontFamily,
      fontStyle: "italic",
      ...layout,
    };
  };

  const personalInfo = useMemo(
    () => normalizePersonalInfoRecord(resume.content?.personalInfo),
    [resume.content?.personalInfo],
  );

  // Get template-specific default sections or use generic defaults
  const getDefaultSections = (): Section[] => {
    // Check if template has specific default section order
    if (extendedTemplate.defaultSectionOrder) {
      return extendedTemplate.defaultSectionOrder;
    }

    // Fallback to generic default sections
    return [
      {
        id: "personalInfo",
        type: "personalInfo",
        title: "Personal Information",
        visible: true,
      },
      {
        id: "profileSummary",
        type: "profileSummary",
        title: "Profile Summary",
        visible: true,
      },
      {
        id: "experience",
        type: "experience",
        title: "Professional Experience",
        visible: true,
      },
      { id: "education", type: "education", title: "Education", visible: true },
      {
        id: "skills",
        type: "skills",
        title: "Technical Skills",
        visible: true,
      },
      {
        id: "projects",
        type: "projects",
        title: "Key Technical Projects",
        visible: true,
      },
      { id: "languages", type: "languages", title: "Languages", visible: true },
      { id: "awards", type: "awards", title: "Awards", visible: true },
    ];
  };

  // Create order key from sections prop directly to detect reordering
  // This ensures we detect order changes even if React batches updates
  const sectionsOrderKey = useMemo(() => {
    const sectionsToUse =
      sections && sections.length > 0 ? sections : getDefaultSections();
    return sectionsToUse
      .map((s, idx) => `${idx}:${s.id}:${s.visible}`)
      .join("|");
  }, [sections]);

  const displaySections = useMemo(
    () => {
      return sections && sections.length > 0 ? sections : getDefaultSections();
    },
    // Depend on both sections array AND order key to ensure recalculation on reorder
    [sections, sectionsOrderKey],
  );

  // Font twins + no phone text boosting (see resume-fonts.ts), wherever a resume renders.
  React.useEffect(() => {
    ensureResumeSharedStyles();
  }, []);

  const visibleSections = useMemo(() => {
    return displaySections.filter((s) => s.visible);
  }, [displaySections, sectionsOrderKey]);

  // Page break state removed - using useMemo instead
  // organizIntoColumns logic remains same

  // Simple single page approach - let PDF handle page breaks naturally
  // organizIntoColumns logic remains same

  // Organize sections into columns based on template configuration
  // Memoize the result to ensure it recalculates when visibleSections changes
  const { headerSection, leftColumn, rightColumn } = useMemo(() => {
    // Shared with the section-order dialog and the ↑/↓ buttons (see sectionLayout.ts).
    const columns = organizeSectionColumns(visibleSections, effectiveResumeLayout.type, template);
    return {
      headerSection: columns.header ?? undefined,
      leftColumn: columns.isDouble ? columns.left : columns.single,
      rightColumn: columns.isDouble ? columns.right : [],
    };
  }, [
    // Use visibleSections array directly - React will detect reference changes
    // The key is that visibleSections is recalculated when displaySections order changes
    visibleSections,
    effectiveResumeLayout.type,
    effectiveResumeLayout.columnWidths,
    templateStyle.headerLayout,
    templateStyle.headerStyle,
    template.id,
  ]);

  // Get icon for section type
  const getSectionIcon = (sectionType: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      personalInfo: User,
      profileSummary: FileText,
      experience: Briefcase,
      education: GraduationCap,
      skills: Brain,
      projects: FileText,
      achievements: Award,
      languages: Globe,
      certificates: Award,
      interests: User,
      courses: GraduationCap,
      awards: Award,
      organisations: Briefcase,
      publications: FileText,
      references: User,
      declaration: FileText,
      custom: FileText,
      spacer: FileText,
    };
    return iconMap[sectionType] || FileText;
  };

  // Render section header based on template configuration
  const renderSectionHeader = (
    title: string,
    isInSidebar: boolean = false,
    sectionType?: string,
    sectionId?: string,
  ) => {
    const icon = ICON_MAP[sectionType as keyof typeof ICON_MAP];
    const headerTitle = title;
    const headerConfig = templateStyle.sectionHeader;
    const showSectionIcon =
      Boolean(sectionType) &&
      (templateStyle.headerStyle === "two-column" || isSaffronLine);
    const sectionIconSize = isSaffronLine ? 12 : 16;

    // Generate template-specific class name for CSS styling
    const templateClassName = `${template.id}-section-header`;

    const baseStyle: React.CSSProperties = useCssHeaderClasses
      ? {}
      : {
          fontSize: `${headerConfig.fontSize || 13}px`,
          fontWeight: headerConfig.fontWeight || "bold",
          textAlign: headerConfig.textAlign || "center",
          marginBottom: headerConfig.marginBottom || "6px",
          paddingBottom: headerConfig.paddingBottom || "2px",
          paddingTop: headerConfig.paddingTop || "2px",
          textTransform: (headerConfig.textTransform as any) || "none",
          fontFamily: templateStyle.fontFamily,
          color: isInSidebar
            ? templateStyle.colors.sidebarText || "#ffffff"
            : templateStyle.colors.text,
        };

    // Apply style based on configuration
    switch (headerConfig.style) {
      case "border-top-bottom":
        return (
          <h2
            data-section-header
            data-section-id={sectionId}
            className={templateClassName}
            style={{
              ...baseStyle,
              borderTop: `${headerConfig.borderWidth || 2}px solid ${headerConfig.borderColor || "#000000"
                }`,
              borderBottom: `${headerConfig.borderWidth || 2}px solid ${headerConfig.borderColor || "#000000"
                }`,
            }}
          >
            {showSectionIcon && (
              <>
                {React.createElement(getSectionIcon(sectionType!), {
                  size: sectionIconSize,
                  style: { marginRight: isSaffronLine ? "6px" : "8px", display: "inline" },
                })}
              </>
            )}
            {edTitle(sectionId, headerTitle, headerConfig.textTransform === "uppercase")}
          </h2>
        );

      case "border-bottom":
        return (
          <h2
            data-section-header
            data-section-id={sectionId}
            className={templateClassName}
            style={
              useCssHeaderClasses && (isCondensedRule || isRoyalIndigo || isCobaltStream || isAmberEdge || isMeridian || isSaffronLine || isConfidentGrid)
                ? { fontWeight: "bold" }
                : {
                    ...baseStyle,
                    borderBottom: `${headerConfig.borderWidth || 1}px solid ${headerConfig.borderColor || "#000000"
                      }`,
                  }
            }
          >
            {showSectionIcon && (
              <>
                {React.createElement(getSectionIcon(sectionType!), {
                  size: sectionIconSize,
                  style: { marginRight: isSaffronLine ? "6px" : "8px", display: "inline" },
                })}
              </>
            )}
            {edTitle(sectionId, headerTitle, headerConfig.textTransform === "uppercase")}
          </h2>
        );

      case "background":
        return (
          <h2
            data-section-header
            data-section-id={sectionId}
            className={templateClassName}
            style={{
              ...baseStyle,
              backgroundColor: isInSidebar
                ? template.id === "atlantic-blue"
                  ? "transparent"
                  : "rgba(255, 255, 255, 0.1)"
                : headerConfig.backgroundColor ||
                  templateStyle.colors.sectionHeaderBg ||
                  "#f0f0f0",
              padding: isInSidebar
                ? template.id === "atlantic-blue"
                  ? "0"
                  : "8px 12px"
                : `${headerConfig.paddingTop || "8px"} ${headerConfig.paddingRight || "12px"
                  } ${headerConfig.paddingBottom || "8px"} ${headerConfig.paddingLeft || "12px"
                  }`,
              borderRadius:
                headerConfig.borderRadius !== undefined
                  ? `${headerConfig.borderRadius}px`
                  : isInSidebar
                    ? template.id === "atlantic-blue"
                      ? "0px"
                      : "4px"
                    : "0px",
              boxShadow:
                isInSidebar && template.id === "atlantic-blue"
                  ? "none"
                  : isInSidebar
                    ? "0 2px 4px rgba(0, 0, 0, 0.2)"
                    : "none",
            }}
          >
            {showSectionIcon && (
              <>
                {React.createElement(getSectionIcon(sectionType!), {
                  size: sectionIconSize,
                  style: { marginRight: isSaffronLine ? "6px" : "8px", display: "inline" },
                })}
              </>
            )}
            {edTitle(sectionId, headerTitle, headerConfig.textTransform === "uppercase")}
          </h2>
        );

      case "underline":
        return (
          <h2
            data-section-header
            data-section-id={sectionId}
            className={templateClassName}
            style={{
              ...baseStyle,
              textDecoration: "underline",
            }}
          >
            {showSectionIcon && (
              <>
                {React.createElement(getSectionIcon(sectionType!), {
                  size: sectionIconSize,
                  style: { marginRight: isSaffronLine ? "6px" : "8px", display: "inline" },
                })}
              </>
            )}
            {edTitle(sectionId, headerTitle, headerConfig.textTransform === "uppercase")}
          </h2>
        );

      default:
        return (
          <h2
            data-section-header
            data-section-id={sectionId}
            className={templateClassName}
            style={baseStyle}
          >
            {showSectionIcon && (
              <>
                {React.createElement(getSectionIcon(sectionType!), {
                  size: sectionIconSize,
                  style: { marginRight: isSaffronLine ? "6px" : "8px", display: "inline" },
                })}
              </>
            )}
            {edTitle(sectionId, headerTitle, headerConfig.textTransform === "uppercase")}
          </h2>
        );
    }
  };

  // Render additional personal information fields
  const renderAdditionalPersonalInfo = (isInSidebar: boolean = false) => {
    const additionalFields: Array<{
      label: string;
      value: string | undefined;
    }> = [];

    if (personalInfo.dateOfBirth) {
      // Format date from YYYY-MM-DD to DD-MM-YYYY if needed
      let formattedDate = personalInfo.dateOfBirth;
      if (personalInfo.dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = personalInfo.dateOfBirth.split("-");
        formattedDate = `${day}-${month}-${year}`;
      }
      additionalFields.push({ label: "Date of Birth", value: formattedDate });
    }
    // Legacy passport field (for backward compatibility)
    if (personalInfo.passport && !personalInfo.passportNo) {
      additionalFields.push({
        label: "Passport Number",
        value: personalInfo.passport,
      });
    }
    if (personalInfo.maritalStatus) {
      additionalFields.push({
        label: "Marital Status",
        value: personalInfo.maritalStatus,
      });
    }
    if (personalInfo.gender) {
      additionalFields.push({ label: "Gender", value: personalInfo.gender });
    }
    if (personalInfo.visa) {
      additionalFields.push({ label: "Visa Status", value: personalInfo.visa });
    }
    if (personalInfo.nationality) {
      additionalFields.push({
        label: "Nationality",
        value: personalInfo.nationality,
      });
    }
    if (personalInfo.militaryService) {
      additionalFields.push({
        label: "Military Service",
        value: personalInfo.militaryService,
      });
    }
    if (personalInfo.drivingLicense) {
      additionalFields.push({
        label: "Driving License",
        value: personalInfo.drivingLicense,
      });
    }
    if (personalInfo.disability) {
      additionalFields.push({
        label: "Disability",
        value: personalInfo.disability,
      });
    }

    // Render passport details sub-section if available
    const renderPassportDetails = () => {
      if (!personalInfo.passportNo) {
        return null;
      }

      const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return "";
        // Format from YYYY-MM-DD to DD/MM/YYYY if needed
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateStr.split("-");
          return `${day}/${month}/${year}`;
        }
        return dateStr;
      };

      const passportFields: Array<{
        label: string;
        value: string | undefined;
      }> = [];

      if (personalInfo.passportNo) {
        passportFields.push({
          label: "Passport No.",
          value: personalInfo.passportNo,
        });
      }
      if (personalInfo.passportPlaceOfIssue) {
        passportFields.push({
          label: "Place of Issue",
          value: personalInfo.passportPlaceOfIssue,
        });
      }
      if (personalInfo.passportDateOfIssue) {
        passportFields.push({
          label: "Date of Issue",
          value: formatDate(personalInfo.passportDateOfIssue),
        });
      }
      if (personalInfo.passportDateOfExpiry) {
        passportFields.push({
          label: "Date of Expiry",
          value: formatDate(personalInfo.passportDateOfExpiry),
        });
      }

      if (passportFields.length === 0) {
        return null;
      }

      return (
        <div style={{ marginTop: "12px" }}>
          <div
            style={{
              fontSize: `${templateStyle.fontSize.small}px`,
              fontWeight: "bold",
              marginBottom: "8px",
              color: isInSidebar
                ? templateStyle.colors.sidebarText || "#ffffff"
                : templateStyle.colors.text,
              fontFamily: templateStyle.fontFamily,
            }}
          >
            Passport Details
          </div>
          {passportFields.map((field, index) => (
            <div
              key={index}
              style={{
                marginBottom: "3px",
                fontSize: `${templateStyle.fontSize.small}px`,
                lineHeight: "1.4",
                color: isInSidebar
                  ? templateStyle.colors.sidebarText || "#ffffff"
                  : templateStyle.colors.text,
                fontFamily: templateStyle.fontFamily,
              }}
            >
              <span style={{ fontWeight: "bold" }}>{field.label}</span> -{" "}
              {field.value}
            </div>
          ))}
        </div>
      );
    };

    if (additionalFields.length === 0 && !personalInfo.passportNo) {
      return null;
    }

    return (
      <div
        className={
          template.id === "atlantic-blue"
            ? "atlantic-blue-additional-personal"
            : undefined
        }
        style={{
          marginTop: "12px",
          fontSize: `${templateStyle.fontSize.small}px`,
          lineHeight: "1.4",
          textAlign: template.id === "atlantic-blue" ? "left" : undefined,
          color: isInSidebar
            ? templateStyle.colors.sidebarText || "#ffffff"
            : templateStyle.colors.text,
          fontFamily: templateStyle.fontFamily,
        }}
      >
        {additionalFields.map((field, index) => (
          <div key={index} style={{ marginBottom: "3px" }}>
            <span style={{ fontWeight: "bold" }}>{field.label}</span>
            {field.value && (
              <>
                {" - "}
                <span>{field.value}</span>
              </>
            )}
          </div>
        ))}
        {renderPassportDetails()}
      </div>
    );
  };

  // Render contact information based on template configuration
  const renderContactInfo = (isInSidebar: boolean = false) => {
    const contactConfig = templateStyle.contactDisplay;

    const contactItems = [
      {
        type: "email",
        value: personalInfo.email,
        icon: Mail,
        href: `mailto:${personalInfo.email}`,
      },
      {
        type: "phone",
        value: personalInfo.phone,
        icon: Phone,
        href: `tel:${personalInfo.phone}`,
      },
      { type: "location", value: personalInfo.location, icon: MapPin },
      {
        type: "linkedin",
        value: personalInfo.linkedin,
        icon: Linkedin,
        href: profileHref("linkedin", personalInfo.linkedin),
      },
      {
        type: "github",
        value: personalInfo.github,
        icon: Github,
        href: personalInfo.github?.startsWith("http")
          ? personalInfo.github
          : personalInfo.github?.startsWith("@")
            ? `https://github.com/${personalInfo.github.slice(1)}`
            : `https://github.com/${personalInfo.github}`,
      },
      {
        type: "website",
        value: personalInfo.website,
        icon: ExternalLink,
        href: profileHref("website", personalInfo.website),
      },
    ].filter((item) => (typeof item.value === "string" ? item.value.trim() : item.value) || (revealContacts && item.type in CONTACT_PLACEHOLDERS));

    // Sidebar text color
    const textColor = isInSidebar
      ? templateStyle.colors.sidebarText || "#ffffff"
      : templateStyle.colors.text;

    if (contactConfig.type === "icons") {
      if (contactConfig.layout === "grid") {
        const gridOrder = [
          "email",
          "phone",
          "location",
          "linkedin",
          "github",
          "website",
        ];
        const orderedItems = gridOrder
          .map((type) => contactItems.find((item) => item.type === type))
          .filter((item): item is (typeof contactItems)[number] => Boolean(item));

        return (
          <div
            className={`${template.id}-contact ${template.id}-contact-grid`}
          >
            {orderedItems.map((item, index) => {
              const IconComponent = item.icon;
              const content = (
                <div
                  key={index}
                  className={`${template.id}-contact-item`}
                  style={{ alignItems: "flex-start" }}
                >
                  <ContactIcon icon={IconComponent} size={13} />
                  <span style={{ lineHeight: 1.4 }}>{ed(`personalInfo.${item.type}`, item.value, CONTACT_PLACEHOLDERS[item.type])}</span>
                </div>
              );

              return item.href ? (
                <a
                  key={index}
                  href={item.href}
                  className="no-underline"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {content}
                </a>
              ) : (
                content
              );
            })}
          </div>
        );
      }

      return (
        <div
          className={`${template.id}-contact`}
          style={{
            display: "flex",
            flexDirection:
              contactConfig.layout === "horizontal" ? "row" : "column",
            gap: "8px",
            flexWrap: "wrap",
            justifyContent:
              templateStyle.headerStyle === "centered" ||
                resume.templateId === "classic"
                ? "center"
                : "flex-start",
            color: textColor,
          }}
        >
          {contactItems.map((item, index) => {
            const IconComponent = item.icon;
            const content = (
              <div
                key={index}
                className={`${template.id}-contact-item`}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "6px",
                  color: textColor,
                }}
              >
                <ContactIcon icon={IconComponent} size={16} fontSize={`${templateStyle.fontSize.small}px`} />
                <span
                  style={{
                    fontSize: `${templateStyle.fontSize.small}px`,
                    lineHeight: 1.4,
                    fontFamily: templateStyle.fontFamily,
                    color: textColor,
                  }}
                >
                  {ed(`personalInfo.${item.type}`, item.value, CONTACT_PLACEHOLDERS[item.type])}
                </span>
              </div>
            );

            return item.href ? (
              <a
                key={index}
                href={item.href}
                className="no-underline"
                style={{ textDecoration: "none", color: textColor, display: "flex", alignItems: "center" }}
              >
                {content}
              </a>
            ) : (
              content
            );
          })}
        </div>
      );
    }

    // Text-only contact display
    const contactSeparator = isCondensedRule || isAmberEdge || isMeridian
      ? " | "
      : isRoyalIndigo
        ? " • "
        : " • ";

    if (isRoyalIndigo) {
      const primaryOrder = ["location", "phone", "email"] as const;
      const secondaryOrder = ["linkedin", "website", "github"] as const;
      const primaryItems = primaryOrder
        .map((type) => contactItems.find((item) => item.type === type))
        .filter((item): item is (typeof contactItems)[number] => Boolean(item));
      const secondaryItems = secondaryOrder
        .map((type) => contactItems.find((item) => item.type === type))
        .filter((item): item is (typeof contactItems)[number] => Boolean(item));

      const renderLine = (items: typeof contactItems) =>
        items.map((item, index) => (
          <span key={`${item.type}-${index}`}>
            {index > 0 && contactSeparator}
            {item.href ? (
              <a href={item.href} className="no-underline">
                {ed(`personalInfo.${item.type}`, item.value, CONTACT_PLACEHOLDERS[item.type])}
              </a>
            ) : (
              ed(`personalInfo.${item.type}`, item.value, CONTACT_PLACEHOLDERS[item.type])
            )}
          </span>
        ));

      return (
        <div className={`${template.id}-contact`}>
          {primaryItems.length > 0 && (
            <div className={`${template.id}-contact-line`}>
              {renderLine(primaryItems)}
            </div>
          )}
          {secondaryItems.length > 0 && (
            <div className={`${template.id}-contact-line`}>
              {renderLine(secondaryItems)}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        className={`${template.id}-contact`}
        style={
          isCondensedRule || isAmberEdge || isMeridian
            ? undefined
            : {
                fontSize: `${templateStyle.fontSize.small}px`,
                textAlign:
                  templateStyle.headerStyle === "centered" ||
                  resume.templateId === "classic"
                    ? "center"
                    : "left",
                color: textColor,
              }
        }
      >
        {contactItems.map((item, index) => (
          <span key={index}>
            {item.href ? (
              <a
                href={item.href}
                className="no-underline"
                style={
                  isCondensedRule || isAmberEdge || isMeridian
                    ? undefined
                    : { textDecoration: "none", color: textColor }
                }
              >
                {ed(`personalInfo.${item.type}`, item.value, CONTACT_PLACEHOLDERS[item.type])}
              </a>
            ) : (
              ed(`personalInfo.${item.type}`, item.value, CONTACT_PLACEHOLDERS[item.type])
            )}
            {/* Its own element with even space both sides: a trailing " • " lost its space
                in flex rows ("India •   linkedin"). */}
            {index < contactItems.length - 1 && (
              <span className={`${template.id}-contact-separator`} style={{ margin: "0 0.45em" }}>
                {contactSeparator.trim()}
              </span>
            )}
          </span>
        ))}
      </div>
    );
  };

  // Render section content based on type and template configuration
  /** In the editor an empty section keeps its heading and an "Add …" slot, so it can be filled in place. */
  const renderSectionOrEmpty = (section: Section, column?: "left" | "right") => {
    const content = renderSectionContent(section, column);
    if (content != null || !canvas || !EMPTY_SECTION_ACTION[section.type]) return content;
    // Only truly empty sections (some templates leave a section out on purpose).
    const items = (resume.content as unknown as Record<string, unknown>)[section.type];
    if (Array.isArray(items) ? items.length > 0 : !!items) return content;
    const isInSidebar = templateStyle.headerStyle === "two-column" && column === "left";
    return (
      <div style={{ marginBottom: `${templateStyle.sectionSpacing}px` }}>
        {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
        <span data-rx-empty-section={section.id}>{EMPTY_SECTION_ACTION[section.type]}</span>
      </div>
    );
  };

  const renderSectionContent = (
    section: Section,
    column?: "left" | "right",
  ) => {
    const isInSidebar =
      templateStyle.headerStyle === "two-column" && column === "left";
    const sidebarStyle = isInSidebar
      ? {
        color: templateStyle.colors.sidebarText || "#ffffff",
        backgroundColor: templateStyle.colors.sidebarBackground,
      }
      : {};

    // Enhanced sidebar style for all text elements
    const sidebarTextStyle = isInSidebar
      ? {
        color: templateStyle.colors.sidebarText || "#ffffff",
      }
      : {
        color: templateStyle.colors.text,
      };

    switch (section.type) {
      case "personalInfo":
        if (templateStyle.headerStyle === "two-column" && isInSidebar) {
          // Two-column sidebar: stacked identity + photo (Atlantic Blue design reference)
          return (
            <div
              className={
                template.id === "atlantic-blue"
                  ? "atlantic-blue-sidebar-personal"
                  : undefined
              }
              style={{ ...sidebarStyle }}
            >
              <div
                className={
                  template.id === "atlantic-blue"
                    ? "atlantic-blue-identity-text"
                    : undefined
                }
                style={
                  template.id === "atlantic-blue"
                    ? undefined
                    : { textAlign: "left", marginBottom: "12px" }
                }
              >
                <h1
                    className={`${template.id}-name`}
                    style={mergeHeaderNameStyle(
                      {
                        margin: "0 0 4px 0",
                        ...(template.id === "atlantic-blue"
                          ? { fontFamily: "inherit" }
                          : {}),
                      },
                      templateStyle.colors.sidebarText || "#ffffff",
                    )}
                  >
                    {ed("personalInfo.fullName", personalInfo.fullName?.trim(), "Your name")}
                  </h1>
                <p
                    className={`${template.id}-job-title`}
                    style={mergeHeaderJobTitleStyle(
                      {
                        margin:
                          template.id === "atlantic-blue" ? "0" : "0 0 8px 0",
                        ...(template.id === "atlantic-blue"
                          ? { fontFamily: "inherit" }
                          : {}),
                      },
                      templateStyle.colors.sidebarText || "#ffffff",
                    )}
                  >
                    {ed("personalInfo.portfolio", personalInfo.portfolio?.trim(), "Professional title")}
                  </p>
                {personalInfo.yearsOfExperience && (
                  <p
                    style={{
                      fontSize: `${templateStyle.fontSize.subheading}px`,
                      color: templateStyle.colors.sidebarText || "#ffffff",
                      margin: "0 0 20px 0",
                    }}
                  >
                    Experience: {personalInfo.yearsOfExperience}
                  </p>
                )}
              </div>

              <div
                className={
                  template.id === "atlantic-blue"
                    ? "atlantic-blue-sidebar-photo-wrap"
                    : undefined
                }
                style={
                  template.id === "atlantic-blue"
                    ? undefined
                    : { textAlign: "center", marginBottom: "20px" }
                }
              >
                {personalInfo?.profilePicture ? (
                  <img
                    src={personalInfo.profilePicture}
                    alt="Profile"
                    data-rx-photo={canvas ? "" : undefined}
                    className={
                      template.id === "atlantic-blue"
                        ? "atlantic-blue-profile-photo"
                        : undefined
                    }
                    style={
                      template.id === "atlantic-blue"
                        ? { borderRadius: "50%", objectFit: "cover" as const }
                        : {
                            width: "120px",
                            height: "120px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "3px solid #ffffff",
                          }
                    }
                  />
                ) : (
                  <div
                    className={
                      template.id === "atlantic-blue"
                        ? "atlantic-blue-photo-placeholder"
                        : undefined
                    }
                    style={{
                      ...(template.id === "atlantic-blue"
                        ? {}
                        : { borderRadius: "50%", backgroundColor: "#e5e7eb" }),
                      // No photo: the grey placeholder is an editor prompt, not part of the
                      // resume. Keep its space (the header layout depends on it), never print it.
                      ...(canvas ? {} : { visibility: "hidden" as const }),
                    }}
                  >
                    <svg
                      width={template.id === "atlantic-blue" ? 132 : 120}
                      height={template.id === "atlantic-blue" ? 132 : 120}
                      viewBox="0 0 120 120"
                      style={
                        template.id === "atlantic-blue"
                          ? undefined
                          : {
                              borderRadius: "50%",
                              backgroundColor: "#e5e7eb",
                            }
                      }
                    >
                      <circle cx="60" cy="45" r="20" fill="#9ca3af" />
                      <ellipse cx="60" cy="95" rx="30" ry="25" fill="#9ca3af" />
                    </svg>
                  </div>
                )}
              </div>

              {renderContactInfo(true)}
              {renderAdditionalPersonalInfo(true)}
            </div>
          );
        }

        // Render contact info for profile picture header layout
        const renderProfileHeaderContactInfo = () => {
          if (
            templateStyle.headerLayout?.type !== "with-profile-picture" &&
            template.id !== "mercury"
          ) {
            return null;
          }

          /* Navy Frame: labeled contact rows (Address / Phone / Email / Website) */
          if (template.id === "navy-frame") {
            const labeledRows: {
              label: string;
              value?: string;
              href?: string;
              field?: string;
            }[] = [
              { label: "Address:", value: personalInfo.location, field: "location" },
              { label: "Phone:", value: personalInfo.phone, field: "phone" },
              {
                field: "email",
                label: "Email:",
                value: personalInfo.email,
                href: personalInfo.email
                  ? `mailto:${personalInfo.email}`
                  : undefined,
              },
              // Each under its own label (a LinkedIn handle used to show as "Website:").
              {
                field: "website",
                label: "Website:",
                value: personalInfo.website,
                href: profileHref("website", personalInfo.website),
              },
              {
                field: "linkedin",
                label: "LinkedIn:",
                value: personalInfo.linkedin,
                href: profileHref("linkedin", personalInfo.linkedin),
              },
            ].filter((row) => row.value?.trim() || (revealContacts && row.field));

            return (
              <div className={`${template.id}-contact`}>
                {labeledRows.map((row) => (
                  <div
                    key={row.label}
                    className={`${template.id}-contact-row`}
                  >
                    <span className={`${template.id}-contact-label`}>
                      {row.label}
                    </span>
                    {row.href ? (
                      <a
                        href={row.href}
                        className={`${template.id}-contact-value no-underline`}
                      >
                        {row.field ? ed(`personalInfo.${row.field}`, row.value) : row.value}
                      </a>
                    ) : (
                      <span className={`${template.id}-contact-value`}>
                        {row.field ? ed(`personalInfo.${row.field}`, row.value) : row.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          }

          const contactItems = [
            {
              type: "email",
              value: personalInfo.email,
              icon: Mail,
              href: `mailto:${personalInfo.email}`,
            },
            {
              type: "phone",
              value: personalInfo.phone,
              icon: Phone,
              href: `tel:${personalInfo.phone}`,
            },
            { type: "location", value: personalInfo.location, icon: MapPin },
            {
              type: "linkedin",
              value: personalInfo.linkedin,
              icon: Linkedin,
              href: personalInfo.linkedin?.startsWith("http")
                ? personalInfo.linkedin
                : `https://linkedin.com/in/${personalInfo.linkedin}`,
            },
            {
              type: "website",
              value: personalInfo.website,
              icon: ExternalLink,
              href: personalInfo.website?.startsWith("http")
                ? personalInfo.website
                : `https://${personalInfo.website}`,
            },
          ].filter((item) => (typeof item.value === "string" ? item.value.trim() : item.value) || (revealContacts && item.type in CONTACT_PLACEHOLDERS));

          // Group items into pairs for two-per-line display
          const pairs: (typeof contactItems)[] = [];
          for (let i = 0; i < contactItems.length; i += 2) {
            pairs.push(contactItems.slice(i, i + 2));
          }

          return (
            <div style={{ marginTop: "8px" }}>
              {pairs.map((pair, pairIndex) => (
                <div
                  key={pairIndex}
                  style={{
                    display: "flex",
                    gap: "16px",
                    marginBottom: "4px",
                    flexWrap: "wrap",
                  }}
                >
                  {pair.map((item, itemIndex) => {
                    const IconComponent = item.icon;
                    const content = (
                      <div
                        key={itemIndex}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "4px",
                        }}
                      >
                        <ContactIcon icon={IconComponent} size={12} fontSize={`${templateStyle.fontSize.small}px`} />
                        <span
                          style={{
                            fontSize: `${templateStyle.fontSize.small}px`,
                            lineHeight: 1.4,
                            fontFamily: templateStyle.fontFamily,
                          }}
                        >
                          {ed(`personalInfo.${item.type}`, item.value, CONTACT_PLACEHOLDERS[item.type])}
                        </span>
                      </div>
                    );

                    return item.href ? (
                      <a
                        key={itemIndex}
                        href={item.href}
                        className="no-underline"
                        style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center" }}
                      >
                        {content}
                      </a>
                    ) : (
                      content
                    );
                  })}
                </div>
              ))}
            </div>
          );
        };

        // Render additional personal info for profile picture header layout
        const renderProfileHeaderAdditionalInfo = () => {
          if (
            templateStyle.headerLayout?.type !== "with-profile-picture" &&
            template.id !== "mercury"
          ) {
            return null;
          }
          const additionalFields: Array<{
            label: string;
            value: string | undefined;
          }> = [];

          if (personalInfo.dateOfBirth) {
            let formattedDate = personalInfo.dateOfBirth;
            if (personalInfo.dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)) {
              const [year, month, day] = personalInfo.dateOfBirth.split("-");
              formattedDate = `${day}-${month}-${year}`;
            }
            additionalFields.push({
              label: "Date of Birth",
              value: formattedDate,
            });
          }
          if (personalInfo.maritalStatus) {
            additionalFields.push({
              label: "Marital Status",
              value: personalInfo.maritalStatus,
            });
          }
          if (personalInfo.gender) {
            additionalFields.push({
              label: "Gender",
              value: personalInfo.gender,
            });
          }
          if (personalInfo.visa) {
            additionalFields.push({
              label: "Visa Status",
              value: personalInfo.visa,
            });
          }
          if (personalInfo.nationality) {
            additionalFields.push({
              label: "Nationality",
              value: personalInfo.nationality,
            });
          }
          if (personalInfo.militaryService) {
            additionalFields.push({
              label: "Military Service",
              value: personalInfo.militaryService,
            });
          }
          if (personalInfo.drivingLicense) {
            additionalFields.push({
              label: "Driving License",
              value: personalInfo.drivingLicense,
            });
          }
          if (personalInfo.disability) {
            additionalFields.push({
              label: "Disability",
              value: personalInfo.disability,
            });
          }

          if (additionalFields.length === 0) {
            return null;
          }

          // Group into pairs
          const pairs: (typeof additionalFields)[] = [];
          for (let i = 0; i < additionalFields.length; i += 2) {
            pairs.push(additionalFields.slice(i, i + 2));
          }

          return (
            <div style={{ marginTop: "8px" }}>
              {pairs.map((pair, pairIndex) => (
                <div
                  key={pairIndex}
                  style={{
                    display: "flex",
                    gap: "16px",
                    marginBottom: "3px",
                    fontSize: `${templateStyle.fontSize.small}px`,
                    lineHeight: "1.4",
                    fontFamily: templateStyle.fontFamily,
                  }}
                >
                  {pair.map((field, fieldIndex) => (
                    <div key={fieldIndex}>
                      <span style={{ fontWeight: "bold" }}>{field.label}</span>
                      {field.value && (
                        <>
                          {" - "}
                          <span>{field.value}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        };

        // Render passport details for profile picture header layout
        const renderProfileHeaderPassportDetails = () => {
          if (
            templateStyle.headerLayout?.type !== "with-profile-picture" &&
            template.id !== "mercury"
          ) {
            return null;
          }
          if (!personalInfo.passportNo) {
            return null;
          }

          const formatDate = (dateStr: string | undefined) => {
            if (!dateStr) return "";
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              const [year, month, day] = dateStr.split("-");
              return `${day}/${month}/${year}`;
            }
            return dateStr;
          };

          const passportFields: Array<{
            label: string;
            value: string | undefined;
          }> = [];
          if (personalInfo.passportNo) {
            passportFields.push({
              label: "Passport No.",
              value: personalInfo.passportNo,
            });
          }
          if (personalInfo.passportPlaceOfIssue) {
            passportFields.push({
              label: "Place of Issue",
              value: personalInfo.passportPlaceOfIssue,
            });
          }
          if (personalInfo.passportDateOfIssue) {
            passportFields.push({
              label: "Date of Issue",
              value: formatDate(personalInfo.passportDateOfIssue),
            });
          }
          if (personalInfo.passportDateOfExpiry) {
            passportFields.push({
              label: "Date of Expiry",
              value: formatDate(personalInfo.passportDateOfExpiry),
            });
          }

          if (passportFields.length === 0) {
            return null;
          }

          // Group into pairs
          const pairs: (typeof passportFields)[] = [];
          for (let i = 0; i < passportFields.length; i += 2) {
            pairs.push(passportFields.slice(i, i + 2));
          }

          return (
            <div style={{ marginTop: "8px" }}>
              <div
                style={{
                  fontSize: `${templateStyle.fontSize.small}px`,
                  fontWeight: "bold",
                  marginBottom: "4px",
                  fontFamily: templateStyle.fontFamily,
                }}
              >
                Passport Details
              </div>
              {pairs.map((pair, pairIndex) => (
                <div
                  key={pairIndex}
                  style={{
                    display: "flex",
                    gap: "16px",
                    marginBottom: "3px",
                    fontSize: `${templateStyle.fontSize.small}px`,
                    lineHeight: "1.4",
                    fontFamily: templateStyle.fontFamily,
                  }}
                >
                  {pair.map((field, fieldIndex) => (
                    <div key={fieldIndex}>
                      <span style={{ fontWeight: "bold" }}>{field.label}</span>{" "}
                      - {field.value}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        };

        // Special header layout: name and title split (name left, title right)
        if (templateStyle.headerLayout?.type === "name-title-split") {
          if (isCondensedRule) {
            return (
              <div className={`${template.id}-header`}>
                <div className={`${template.id}-header-top`}>
                  <h1 className={`${template.id}-name`}>
                    {ed("personalInfo.fullName", personalInfo.fullName?.trim(), "Your name")}
                  </h1>
                  <span className={`${template.id}-job-title`}>
                    {ed("personalInfo.portfolio", personalInfo.portfolio?.trim(), "Professional title")}
                  </span>
                </div>
                <div className={`${template.id}-contact`}>
                  {renderContactInfo(isInSidebar)}
                </div>
              </div>
            );
          }

          return (
            <div
              className={`${template.id}-header`}
              style={{ marginBottom: `${templateStyle.sectionSpacing}px` }}
            >
              <div
                className={`${template.id}-header-top`}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <h1
                    className={`${template.id}-name`}
                    style={mergeHeaderNameStyle(
                      {
                        margin: "0",
                        flexShrink: 0,
                      },
                      templateStyle.colors.text,
                    )}
                  >
                    {ed("personalInfo.fullName", personalInfo.fullName?.trim(), "Your name")}
                  </h1>
                <p
                    className={`${template.id}-job-title`}
                    style={mergeHeaderJobTitleStyle(
                      {
                        margin: "0",
                        fontWeight: "normal",
                        textAlign:
                          templateStyle.headerLayout?.titlePosition === "right"
                            ? "right"
                            : "left",
                        flexGrow: 1,
                        marginLeft:
                          templateStyle.headerLayout?.titlePosition === "right"
                            ? "20px"
                            : "0",
                      },
                      templateStyle.colors.text,
                    )}
                  >
                    {ed("personalInfo.portfolio", personalInfo.portfolio?.trim(), "Professional title")}
                  </p>
              </div>
              <div className={`${template.id}-contact`}>
                {renderContactInfo(isInSidebar)}
              </div>
              {renderAdditionalPersonalInfo(isInSidebar)}
            </div>
          );
        }

        // Special header layout: with profile picture on left
        if (
          templateStyle.headerLayout?.type === "with-profile-picture" ||
          template.id === "mercury"
        ) {
          const headerBackground =
            templateStyle.colors.headerBackground ||
            (template.id === "mercury"
              ? "#f5f5f5"
              : template.id === "confident-grid"
                ? "#d8e5ec"
                : "transparent");
          const usesCssHeaderBand =
            template.id === "saffron-line" ||
            template.id === "navy-frame" ||
            template.id === "confident-grid";

          return (
            <div
              className={`${template.id}-header-section`}
              style={{
                // Mercury's grey band runs to the top edge (the page's top padding left a
                // white strip above it); later pages have no header and keep their margin.
                margin:
                  template.id === "mercury" && templateStyle.padding.top > 0
                    ? `-${templateStyle.padding.top}mm 0 0`
                    : 0,
                backgroundColor: headerBackground,
                ...(usesCssHeaderBand ? {} : { padding: "40px 55px" }),
                display: "flex",
                flexWrap: isConfidentGrid ? "nowrap" : "wrap",
                alignItems: isConfidentGrid ? "center" : "flex-start",
                gap: isConfidentGrid
                  ? "28px"
                  : template.id === "saffron-line"
                    ? "20px"
                    : "30px",
              }}
            >
              {/* Profile Picture on Left */}
              <div style={{ flexShrink: 0 }}>
                {personalInfo?.profilePicture ? (
                  <img
                    src={personalInfo.profilePicture}
                    alt="Profile"
                    data-rx-photo={canvas ? "" : undefined}
                    className={`${template.id}-profile-picture`}
                    style={
                      isSaffronLine || isConfidentGrid
                        ? { objectFit: "cover", border: "none" }
                        : {
                            width: "160px",
                            height: "160px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "none",
                          }
                    }
                  />
                ) : (
                  <div
                    className={`${template.id}-profile-placeholder`}
                    style={{
                      ...(isSaffronLine || isConfidentGrid
                        ? {}
                        : {
                            width: "160px",
                            height: "160px",
                            borderRadius: "50%",
                            backgroundColor: "#e0e0e0",
                          }),
                      // Editor prompt only (see the sidebar photo above): never printed.
                      ...(canvas ? {} : { visibility: "hidden" as const }),
                    }}
                  />
                )}
              </div>

              {/* Name, Title, Contact on Right */}
              <div
                className={`${template.id}-header-content`}
                style={
                  isSaffronLine || isConfidentGrid
                    ? { flex: 1 }
                    : { flex: 1, paddingTop: "10px" }
                }
              >
                {isSaffronLine ? (
                  <div className={`${template.id}-header-top`}>
                    <h1
                      className={`${template.id}-name`}
                      style={
                        useCssHeaderClasses
                          ? mergeHeaderNameStyle(
                              {
                                margin: 0,
                                letterSpacing: "-0.5px",
                              },
                              templateStyle.colors.text,
                            )
                          : {
                              fontSize: `${templateStyle.fontSize.heading}px`,
                              fontWeight: "bold",
                              color: templateStyle.colors.text,
                              margin: 0,
                              letterSpacing: "-0.5px",
                              fontFamily: templateStyle.fontFamily,
                            }
                      }
                    >
                      {ed("personalInfo.fullName", personalInfo.fullName?.trim(), "Your name")}
                    </h1>
                    <p
                      className={`${template.id}-job-title`}
                      style={
                        useCssHeaderClasses
                          ? mergeHeaderJobTitleStyle({ margin: 0 }, templateStyle.colors.text)
                          : {
                              fontSize: `${templateStyle.fontSize.subheading}px`,
                              color: templateStyle.colors.text,
                              margin: 0,
                              fontWeight: "normal",
                              fontFamily: templateStyle.fontFamily,
                            }
                      }
                    >
                      {ed("personalInfo.portfolio", personalInfo.portfolio?.trim(), "Professional title")}
                    </p>
                  </div>
                ) : (
                  <>
                <h1
                    className={`${template.id}-name`}
                    style={
                      useCssHeaderClasses
                        ? mergeHeaderNameStyle(
                            {
                              margin: "0 0 8px 0",
                              letterSpacing: "-0.5px",
                            },
                            templateStyle.colors.text,
                          )
                        : {
                            fontSize: `${templateStyle.fontSize.heading}px`,
                            fontWeight: "bold",
                            color: templateStyle.colors.text,
                            margin: "0 0 8px 0",
                            letterSpacing: "-0.5px",
                            fontFamily: templateStyle.fontFamily,
                          }
                    }
                  >
                    {ed("personalInfo.fullName", personalInfo.fullName?.trim(), "Your name")}
                  </h1>
                <p
                    className={`${template.id}-job-title`}
                    style={
                      useCssHeaderClasses
                        ? mergeHeaderJobTitleStyle(
                            { margin: "0 0 20px 0" },
                            templateStyle.colors.secondary,
                          )
                        : {
                            fontSize: `${templateStyle.fontSize.subheading}px`,
                            color: templateStyle.colors.secondary,
                            margin: "0 0 20px 0",
                            fontWeight: "normal",
                            fontFamily: templateStyle.fontFamily,
                          }
                    }
                  >
                    {ed("personalInfo.portfolio", personalInfo.portfolio?.trim(), "Professional title")}
                  </p>
                  </>
                )}
                {template.id === "saffron-line" || isConfidentGrid
                  ? renderContactInfo(false)
                  : renderProfileHeaderContactInfo()}
                {renderProfileHeaderAdditionalInfo()}
                {renderProfileHeaderPassportDetails()}
              </div>
            </div>
          );
        }

        // Standard header style
        if (isRoyalIndigo) {
          return (
            <div className={`${template.id}-header`}>
              <h1 className={`${template.id}-name`}>
                {ed("personalInfo.fullName", personalInfo.fullName?.trim(), "Your name")}
              </h1>
              {renderContactInfo(isInSidebar)}
            </div>
          );
        }

        return (
          <div
            className={`${template.id}-header`}
            style={{ marginBottom: `${templateStyle.sectionSpacing}px` }}
          >
            {isMeridian ? (
              <>
                <div className={`${template.id}-header-top`}>
                  <h1 className={`${template.id}-name`}>
                    {ed("personalInfo.fullName", personalInfo.fullName?.trim(), "Your name")}
                  </h1>
                  <p className={`${template.id}-job-title`}>
                    {ed("personalInfo.portfolio", personalInfo.portfolio?.trim(), "Professional title")}
                  </p>
                </div>
                {renderContactInfo(isInSidebar)}
              </>
            ) : (
            <div
              style={{
                textAlign:
                  templateStyle.headerLayout?.type === "standard" &&
                    templateStyle.headerStyle === "centered"
                    ? "center"
                    : "left",
                display: "flex",
                flexDirection:
                  templateStyle.headerStyle === "centered" ? "column" : "row",
                alignItems:
                  templateStyle.headerStyle === "centered"
                    ? "center"
                    : "flex-start",
                gap: "20px",
              }}
            >
              {/* Profile Picture Fallback for Standard Layout */}
              {personalInfo?.profilePicture && (
                <div style={{ flexShrink: 0, marginBottom: "10px" }}>
                  <img
                    src={personalInfo.profilePicture}
                    alt="Profile"
                    data-rx-photo={canvas ? "" : undefined}
                    style={{
                      width: template.id === "mercury" ? "120px" : "80px",
                      height: template.id === "mercury" ? "120px" : "80px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}
              <div
                style={{
                  flex: 1,
                  textAlign:
                    templateStyle.headerStyle === "centered" ||
                      resume.templateId === "classic"
                      ? "center"
                      : "left",
                }}
              >
                <h1
                    className={`${template.id}-name`}
                    style={mergeHeaderNameStyle(
                      {
                        margin: "0 0 4px 0",
                      },
                      isInSidebar
                        ? templateStyle.colors.sidebarText
                        : templateStyle.colors.text,
                    )}
                  >
                    {ed("personalInfo.fullName", personalInfo.fullName?.trim(), "Your name")}
                  </h1>
                <p
                    className={`${template.id}-job-title`}
                    style={mergeHeaderJobTitleStyle(
                      { margin: "0 0 6px 0" },
                      templateStyle.colors.secondary,
                    )}
                  >
                    {ed("personalInfo.portfolio", personalInfo.portfolio?.trim(), "Professional title")}
                  </p>
                {personalInfo.yearsOfExperience && (
                  <p
                    style={{
                      fontSize: `${templateStyle.fontSize.subheading}px`,
                      color: templateStyle.colors.secondary,
                      margin: "0 0 12px 0",
                      fontFamily: templateStyle.fontFamily,
                      fontStyle: "italic",
                    }}
                  >
                    Experience: {personalInfo.yearsOfExperience}
                  </p>
                )}
                {renderContactInfo(isInSidebar)}
                {renderAdditionalPersonalInfo(isInSidebar)}
              </div>
            </div>
            )}
          </div>
        );

      case "profileSummary":
        const profileContent =
          resume.profileSummary ||
          (resume.content as any).profileSummary ||
          (resume.content as any).sections?.find(
            (s: any) => s.type === "profileSummary",
          )?.content;

        if (!profileContent) {
          // Nothing to export; on the canvas keep an empty slot to write into.
          if (!canvas) return null;
          return (
            <div data-section={section.id}
              style={{
                marginBottom: `${templateStyle.sectionSpacing}px`,
                ...sidebarStyle,
              }}
            >
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              <div
                style={{
                  fontSize: `${templateStyle.fontSize.body}px`,
                  lineHeight: templateStyle.lineHeight,
                  color: isInSidebar
                    ? templateStyle.colors.sidebarText
                    : templateStyle.colors.secondary,
                  fontStyle: "italic",
                }}
                {...rich("@profileSummary", RESUME_DISPLAY_PLACEHOLDERS.profileSummary)}
              >
              </div>
            </div>
          );
        }

        return (
          <div
            data-section={section.id}
            style={{
              marginBottom: `${isInSidebar && templateStyle.headerStyle === "two-column"
                ? templateStyle.sectionSpacing * 2
                : templateStyle.sectionSpacing
                }px`,
              ...(isInSidebar &&
                templateStyle.headerStyle === "two-column" && {
                paddingTop: "15px",
                paddingBottom: "15px",
              }),
              ...sidebarStyle,
            }}
          >
            {!isMeridian &&
              renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
            <div
              data-item-id={`${section.id}-body`}
              className={`resume-content${
                isConfidentGrid || isCondensedRule || isRoyalIndigo || isAmberEdge || isMeridian
                  ? ` ${template.id}-summary`
                  : isSaffronLine
                    ? ` ${template.id}-summary`
                    : ""
              }`}
              style={
                useCssBodyTypography
                  ? undefined
                  : {
                      fontSize: `${templateStyle.fontSize.body}px`,
                      lineHeight: templateStyle.lineHeight,
                      color: isInSidebar
                        ? templateStyle.colors.sidebarText
                        : templateStyle.colors.text,
                      fontFamily: templateStyle.fontFamily,
                    }
              }
              {...rich("@profileSummary")} dangerouslySetInnerHTML={stableHtml({ __html: profileContent })}
            />
          </div>
        );

      case "experience":
        // Handle both executive (sections array) and other templates (direct experience array)
        let experienceData: any[] = [];

        if (resume.templateId === "executive") {
          const expSection = (resume.content as any).sections?.find(
            (s: any) => s.type === "workExperience",
          );
          experienceData = expSection?.items || resume.content.experience || [];
        } else {
          experienceData = resume.content.experience || [];
        }

        if (experienceData.length === 0) {
          return (
            <div data-section={section.id}
              style={{
                marginBottom: `${templateStyle.sectionSpacing}px`,
                ...sidebarStyle,
              }}
            >
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              <p
                style={{
                  fontSize: `${templateStyle.fontSize.body}px`,
                  color: templateStyle.colors.secondary,
                  fontStyle: "italic",
                }}
              >
                No experience data available.
              </p>
            </div>
          );
        }

        return (
          <div
            data-section={section.id}
            style={{
              position: "relative",
              marginBottom: `${isInSidebar && templateStyle.headerStyle === "two-column"
                ? templateStyle.sectionSpacing * 2
                : templateStyle.sectionSpacing
                }px`,
              ...(isInSidebar &&
                templateStyle.headerStyle === "two-column" && {
                paddingTop: "15px",
                paddingBottom: "15px",
              }),
              ...sidebarStyle,
            }}
          >
            {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
            <div
              className={
                isEmberTimeline ? `${template.id}-experience-list` : undefined
              }
            >
              {experienceData.map((exp, index) => (
                <div
                  key={index}
                  {...(isRoyalIndigo
                    ? {}
                    : {
                        "data-item-id": exp.id || `exp-${index}`,
                      })}
                  data-item-index={index}
                  className={`${template.id}-experience-item`}
                  style={{
                    marginBottom:
                      isEmberTimeline || isConfidentGrid || isAmberEdge || isMeridian || isSaffronLine
                        ? undefined
                        : "16px",
                    pageBreakInside: "auto", // Allow splitting for better pagination
                    // Only apply inline grid styles if NOT using table-cell layout via CSS
                    // Templates with table-cell layout should define it in their CSS files
                    ...(templateStyle.timelineLayout.type === "grid" && !isEmberTimeline
                      ? {
                        // Let CSS override if needed (table-cell templates will override via !important)
                        display: "grid",
                        gridTemplateColumns: `${templateStyle.timelineLayout.dateWidth || 140
                          }px 1fr`,
                        gap: "16px",
                      }
                      : !isEmberTimeline && templateStyle.timelineLayout.type !== "grid"
                        ? { display: "block" }
                        : {}),
                  }}
                >
                  {templateStyle.timelineLayout.type === "grid" ? (
                    <>
                      <div
                        className={`${template.id}-date-location-column`}
                        style={
                          isEmberTimeline
                            ? undefined
                            : {
                                fontSize: `${templateStyle.fontSize.small}px`,
                                color: templateStyle.colors.secondary,
                                fontFamily: templateStyle.fontFamily,
                              }
                        }
                      >
                        <span className={`${template.id}-date`}>
                          {edDate(`experience.${index}`, formatExperienceDateRange(exp))}
                        </span>
                        {(exp.location || pathRevealed(canvas, `experience.${index}.location`)) && (
                          <div className={`${template.id}-location`}>
                            {ed(`experience.${index}.location`, exp.location)}
                          </div>
                        )}
                      </div>
                      <div className={`${template.id}-job-content`}>
                        <div
                          className={
                            template.id === "executive"
                              ? "executive-experience-job-title"
                              : isEmberTimeline
                                ? `${template.id}-job-title-exp`
                                : isConfidentGrid
                                  ? `${template.id}-job-title-exp`
                                  : `${template.id}-job-title`
                          }
                          style={
                            useCssExpTypography
                              ? undefined
                              : {
                                  fontSize: `${templateStyle.fontSize.body + 1}px`,
                                  fontWeight: "bold",
                                  color: isInSidebar
                                    ? templateStyle.colors.sidebarText
                                    : templateStyle.colors.text,
                                  marginBottom: "2px",
                                }
                          }
                        >
                          {ed(`experience.${index}.position`, exp.position)}
                        </div>
                        {(exp.company || pathRevealed(canvas, `experience.${index}.company`)) && (
                          <div
                            className={`${template.id}-company`}
                            style={
                              useCssExpTypography
                                ? undefined
                                : {
                                    fontSize: `${templateStyle.fontSize.body}px`,
                                    color: templateStyle.colors.secondary,
                                    fontStyle: "italic",
                                    marginBottom: "6px",
                                  }
                            }
                          >
                            {ed(`experience.${index}.company`, exp.company)}
                          </div>
                        )}
                        {(hasText(exp.description) || revealEntry(section.id, index)) && (
                          <div
                            className={`resume-content ${template.id}-description`}
                            style={{
                              fontSize: `${templateStyle.fontSize.body}px`,
                              lineHeight: templateStyle.lineHeight,
                              color: isInSidebar
                                ? templateStyle.colors.sidebarText
                                : templateStyle.colors.text,
                              fontFamily: templateStyle.fontFamily, // Consistent font family
                            }}
                            {...rich(`experience.${index}.description`)} dangerouslySetInnerHTML={stableHtml({
                              __html: formatExperienceDescriptionHtml(exp.description),
                            })}
                          />
                        )}
                      </div>
                    </>
                  ) : isRoyalIndigo ? (
                    <>
                      <div
                        data-item-id={`${exp.id || `exp-${index}`}-header`}
                        className={`${template.id}-job-header`}
                      >
                        <div className={`${template.id}-job-title-line`}>
                          {(exp.position || pathRevealed(canvas, `experience.${index}.position`)) && (
                            <span className={`${template.id}-job-title-exp`}>
                              {ed(`experience.${index}.position`, exp.position)}
                            </span>
                          )}
                          {(exp.company || pathRevealed(canvas, `experience.${index}.company`)) && (
                            <>
                              {exp.position && (
                                <span className={`${template.id}-title-separator`}>
                                  ,{" "}
                                </span>
                              )}
                              <span className={`${template.id}-company`}>
                                {ed(`experience.${index}.company`, exp.company)}
                              </span>
                            </>
                          )}
                        </div>
                        <div className={`${template.id}-job-details-container`}>
                          <div className={`${template.id}-job-date`}>
                            {edDate(`experience.${index}`, formatRoyalIndigoDateRange(exp))}
                          </div>
                        </div>
                      </div>
                      {(hasText(exp.description) || revealEntry(section.id, index)) && (
                        <div
                          data-item-id={`${exp.id || `exp-${index}`}-body`}
                          className={`resume-content ${template.id}-description`}
                          {...rich(`experience.${index}.description`)} dangerouslySetInnerHTML={stableHtml({
                            __html: formatExperienceDescriptionHtml(
                              exp.description,
                            ),
                          })}
                        />
                      )}
                    </>
                  ) : isCondensedRule ? (
                    <>
                      <div className={`${template.id}-job-header`}>
                        <div className={`${template.id}-job-title-line`}>
                          {(exp.company || pathRevealed(canvas, `experience.${index}.company`)) && (
                            <span className={`${template.id}-company`}>
                              {ed(`experience.${index}.company`, exp.company)}
                            </span>
                          )}
                          {(exp.position || pathRevealed(canvas, `experience.${index}.position`)) && (
                            <>
                              {exp.company && (
                                <span className={`${template.id}-title-separator`}>
                                  ,{" "}
                                </span>
                              )}
                              <span className={`${template.id}-job-title-exp`}>
                                {ed(`experience.${index}.position`, exp.position)}
                              </span>
                            </>
                          )}
                        </div>
                        <div className={`${template.id}-job-details-container`}>
                          <div className={`${template.id}-job-date`}>
                            {edDate(`experience.${index}`, formatExperienceDateRange(exp))}
                          </div>
                          {(exp.location || pathRevealed(canvas, `experience.${index}.location`)) && (
                            <div className={`${template.id}-job-location`}>
                              {ed(`experience.${index}.location`, exp.location)}
                            </div>
                          )}
                        </div>
                      </div>
                      {(hasText(exp.description) || revealEntry(section.id, index)) && (
                        <div
                          className={`resume-content ${template.id}-description`}
                          {...rich(`experience.${index}.description`)} dangerouslySetInnerHTML={stableHtml({
                            __html: formatExperienceDescriptionHtml(
                              exp.description,
                            ),
                          })}
                        />
                      )}
                    </>
                  ) : isConfidentGrid ? (
                    <>
                      <div className={`${template.id}-job-title-line`}>
                        <span className={`${template.id}-job-title-exp`}>
                          {ed(`experience.${index}.position`, exp.position)}
                        </span>
                        {(exp.company || pathRevealed(canvas, `experience.${index}.company`)) && (
                          <>
                            <span className={`${template.id}-title-separator`}>
                              ,{" "}
                            </span>
                            <span className={`${template.id}-company`}>
                              {ed(`experience.${index}.company`, exp.company)}
                            </span>
                          </>
                        )}
                      </div>
                      {(formatExperienceDateRange(exp) || exp.location || revealEntry(section.id, index)) && (
                        <div className={`${template.id}-job-meta-line`}>
                          {edDate(
                            `experience.${index}`,
                            [formatExperienceDateRange(exp), exp.location].filter(Boolean).join(" | "),
                          )}
                        </div>
                      )}
                      {(hasText(exp.description) || revealEntry(section.id, index)) && (
                        <div
                          className={`resume-content ${template.id}-description`}
                          {...rich(`experience.${index}.description`)} dangerouslySetInnerHTML={stableHtml({
                            __html: formatExperienceDescriptionHtml(
                              exp.description,
                            ),
                          })}
                        />
                      )}
                    </>
                  ) : isMeridian ? (
                    <>
                      <div className={`${template.id}-job-header`}>
                        <div className={`${template.id}-job-title-container`}>
                          <div className={`${template.id}-job-title-line`}>
                            {(exp.position || pathRevealed(canvas, `experience.${index}.position`)) && (
                              <span className={`${template.id}-job-title-exp`}>
                                {ed(`experience.${index}.position`, exp.position)}
                              </span>
                            )}
                            {(exp.company || pathRevealed(canvas, `experience.${index}.company`)) && (
                              <>
                                {exp.position && (
                                  <span className={`${template.id}-title-separator`}>
                                    {" "}
                                    |{" "}
                                  </span>
                                )}
                                <span className={`${template.id}-company`}>
                                  {ed(`experience.${index}.company`, exp.company)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className={`${template.id}-job-details-container`}>
                          <div className={`${template.id}-job-date`}>
                            {edDate(`experience.${index}`, formatExperienceDateRange(exp))}
                          </div>
                        </div>
                      </div>
                      {(hasText(exp.description) || revealEntry(section.id, index)) && (
                        <div
                          className={`resume-content ${template.id}-description`}
                          {...rich(`experience.${index}.description`)} dangerouslySetInnerHTML={stableHtml({
                            __html: formatExperienceDescriptionHtml(
                              exp.description,
                            ),
                          })}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <div
                        className={`${template.id}-job-header`}
                        style={
                          isAmberEdge || isMeridian || isSaffronLine
                            ? undefined
                            : {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: "4px",
                              }
                        }
                      >
                        <div className={`${template.id}-job-title-container`}>
                          <div
                            className={`${template.id}-job-title-exp`}
                            style={
                              useCssExpTypography
                                ? undefined
                                : {
                                    fontSize: `${templateStyle.fontSize.body + 1}px`,
                                    fontWeight: "bold",
                                    color: isInSidebar
                                      ? templateStyle.colors.sidebarText
                                      : templateStyle.colors.text,
                                  }
                            }
                          >
                            {ed(`experience.${index}.position`, exp.position)}
                          </div>
                          {(exp.company || pathRevealed(canvas, `experience.${index}.company`)) && (
                            <div
                              className={`${template.id}-company`}
                              style={
                                useCssExpTypography
                                  ? undefined
                                  : {
                                      fontSize: `${templateStyle.fontSize.body}px`,
                                      color: templateStyle.colors.secondary,
                                      fontStyle: "italic",
                                    }
                              }
                            >
                              {ed(`experience.${index}.company`, exp.company)}
                            </div>
                          )}
                        </div>
                        <div
                          className={`${template.id}-job-details-container`}
                          style={
                            isAmberEdge || isSaffronLine
                              ? undefined
                              : {
                                  fontSize: `${templateStyle.fontSize.small}px`,
                                  color: templateStyle.colors.secondary,
                                  textAlign: "right",
                                  minWidth: "120px",
                                }
                          }
                        >
                          <div className={`${template.id}-job-date`}>
                            {edDate(`experience.${index}`, formatExperienceDateRange(exp))}
                          </div>
                          {(exp.location || pathRevealed(canvas, `experience.${index}.location`)) && (
                            <div className={`${template.id}-location`}>
                              {ed(`experience.${index}.location`, exp.location)}
                            </div>
                          )}
                        </div>
                      </div>
                      {(hasText(exp.description) || revealEntry(section.id, index)) && (
                        <div
                          className={`resume-content ${template.id}-description`}
                          style={
                            isAmberEdge || isMeridian || isSaffronLine
                              ? undefined
                              : {
                                  fontSize: `${templateStyle.fontSize.body}px`,
                                  lineHeight: templateStyle.lineHeight,
                                  color: isInSidebar
                                    ? templateStyle.colors.sidebarText
                                    : templateStyle.colors.text,
                                  marginTop: isSaffronLine ? "4px" : "8px",
                                }
                          }
                          {...rich(`experience.${index}.description`)} dangerouslySetInnerHTML={stableHtml({
                            __html: formatExperienceDescriptionHtml(exp.description),
                          })}
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "education": {
        // Handle both executive (sections array) and other templates (direct education array)
        let educationData: any[] = [];

        if (resume.templateId === "executive") {
          const eduSection = (resume.content as any).sections?.find(
            (s: any) => s.type === "education",
          );
          educationData = eduSection?.items || resume.content.education || [];
        } else {
          educationData = resume.content.education || [];
        }

        if (educationData.length === 0) return null;

        return (
          <div
            data-section={section.id}
            style={{
              marginBottom: `${isInSidebar && templateStyle.headerStyle === "two-column"
                ? templateStyle.sectionSpacing * 2
                : templateStyle.sectionSpacing
                }px`,
              ...(isInSidebar &&
                templateStyle.headerStyle === "two-column" && {
                paddingTop: "15px",
                paddingBottom: "15px",
              }),
              ...sidebarStyle,
            }}
          >
            {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
            <div
              className={
                isEmberTimeline ? `${template.id}-education-list` : undefined
              }
            >
              {educationData.map((edu, index) => (
                <div
                  key={index}
                  {...(isRoyalIndigo
                    ? {}
                    : {
                        "data-item-id": edu.id || `edu-${index}`,
                      })}
                  data-item-index={index}
                  className={`${template.id}-education-item`}
                  style={{
                    marginBottom: isEmberTimeline || isAmberEdge || isMeridian || isSaffronLine ? undefined : "16px",
                    pageBreakInside: "auto", // Allow splitting for better pagination
                    // Only apply inline grid styles if using grid layout
                    // Templates with table-cell layout should define it in their CSS files
                    ...(templateStyle.timelineLayout.type === "grid" && !isEmberTimeline
                      ? {
                        // Let CSS override if needed (table-cell templates will override via !important)
                        display: "grid",
                        gridTemplateColumns: `${templateStyle.timelineLayout.dateWidth || 140
                          }px 1fr`,
                        gap: "16px",
                      }
                      : !isEmberTimeline && templateStyle.timelineLayout.type !== "grid"
                        ? { display: "block" }
                        : {}),
                  }}
                >
                  {templateStyle.timelineLayout.type === "grid" ? (
                    <>
                      <div
                        className={`${template.id}-education-date-location`}
                        style={
                          isEmberTimeline
                            ? undefined
                            : {
                                fontSize: `${templateStyle.fontSize.small}px`,
                                color: templateStyle.colors.secondary,
                              }
                        }
                      >
                        <span className={`${template.id}-education-date`}>
                          {edDate(
                            `education.${index}`,
                            `${formatResumeDateForDisplay(String(edu.startDate ?? ""))}${edu.startDate || edu.endDate ? " - " : ""}${formatResumeDateForDisplay(String(edu.endDate ?? ""))}`,
                          )}
                        </span>
                        {(edu.location || pathRevealed(canvas, `education.${index}.location`)) && (
                          <div className={`${template.id}-education-location`}>
                            {ed(`education.${index}.location`, edu.location)}
                          </div>
                        )}
                      </div>
                      <div className={`${template.id}-education-content`}>
                        <div
                          className={`${template.id}-degree`}
                          style={
                            isEmberTimeline || isCobaltStream
                              ? undefined
                              : {
                                  fontSize: `${templateStyle.fontSize.body + 1}px`,
                                  fontWeight: "bold",
                                  color: isInSidebar
                                    ? templateStyle.colors.sidebarText
                                    : templateStyle.colors.text,
                                }
                          }
                        >
                          {ed(`education.${index}.degree`, edu.degree)}
                          {shouldAppendEducationField(edu.degree, edu.field) && (
                              <span style={{ fontWeight: "normal" }}>
                                {" "}
                                in {ed(`education.${index}.field`, edu.field)}
                              </span>
                            )}
                          {(edu.gpa || pathRevealed(canvas, `education.${index}.gpa`)) && (
                            <span style={{ fontWeight: "normal" }}>
                              {" "}
                              (CGPA: {ed(`education.${index}.gpa`, edu.gpa)})
                            </span>
                          )}
                          {edu.percentage && (
                            <span style={{ fontWeight: "normal" }}>
                              {" "}
                              (Percentage: {edu.percentage})
                            </span>
                          )}
                        </div>
                        {(edu.institution || pathRevealed(canvas, `education.${index}.institution`)) && (
                          <div
                            className={`${template.id}-institution`}
                            style={
                              isEmberTimeline || isCobaltStream
                                ? undefined
                                : {
                                    fontSize: `${templateStyle.fontSize.body}px`,
                                    color: templateStyle.colors.secondary,
                                    fontStyle: "italic",
                                  }
                            }
                          >
                            {ed(`education.${index}.institution`, edu.institution)}
                          </div>
                        )}
                        {edu.location && !isEmberTimeline && (
                          <div
                            className={`${template.id}-education-location`}
                            style={{
                              fontSize: `${templateStyle.fontSize.small}px`,
                              color: templateStyle.colors.secondary,
                            }}
                          >
                            {ed(`education.${index}.location`, edu.location)}
                          </div>
                        )}
                      </div>
                    </>
                  ) : isRoyalIndigo ? (
                    <>
                      <div
                        data-item-id={`${edu.id || `edu-${index}`}-header`}
                        className={`${template.id}-education-header`}
                      >
                        <div className={`${template.id}-education-title-line`}>
                          {(edu.degree || pathRevealed(canvas, `education.${index}.degree`)) && (
                            <span className={`${template.id}-degree`}>
                              {ed(`education.${index}.degree`, edu.degree)}
                            </span>
                          )}
                        </div>
                        <div className={`${template.id}-education-details-container`}>
                          {(formatRoyalIndigoDateRange(edu) || revealEntry(section.id, index)) && (
                            <div className={`${template.id}-education-date`}>
                              {edDate(`education.${index}`, formatRoyalIndigoDateRange(edu))}
                            </div>
                          )}
                        </div>
                      </div>
                      {(edu.institution || pathRevealed(canvas, `education.${index}.institution`)) && (
                        <div className={`${template.id}-institution`}>
                          {ed(`education.${index}.institution`, edu.institution)}
                        </div>
                      )}
                      {(hasText(edu.description) || revealEntry(section.id, index)) && (
                        <div
                          data-item-id={`${edu.id || `edu-${index}`}-body`}
                          className={`resume-content ${template.id}-description`}
                          {...rich(`education.${index}.description`)} dangerouslySetInnerHTML={stableHtml({
                            __html: formatExperienceDescriptionHtml(edu.description),
                          })}
                        />
                      )}
                    </>
                  ) : isCondensedRule ? (
                    <>
                      <div className={`${template.id}-education-header`}>
                        <div className={`${template.id}-education-title-line`}>
                          {(edu.degree || pathRevealed(canvas, `education.${index}.degree`)) && (
                            <span className={`${template.id}-degree`}>
                              {ed(`education.${index}.degree`, edu.degree)}
                            </span>
                          )}
                          {(edu.institution || pathRevealed(canvas, `education.${index}.institution`)) && (
                            <>
                              {edu.degree && (
                                <span className={`${template.id}-title-separator`}>
                                  ,{" "}
                                </span>
                              )}
                              <span className={`${template.id}-institution`}>
                                {ed(`education.${index}.institution`, edu.institution)}
                              </span>
                            </>
                          )}
                        </div>
                        <div className={`${template.id}-education-details-container`}>
                          {(edu.startDate || edu.endDate || revealEntry(section.id, index)) && (
                            <div className={`${template.id}-education-date`}>
                              {edDate(
                                `education.${index}`,
                                `${formatResumeDateForDisplay(String(edu.startDate ?? ""))}${edu.startDate || edu.endDate ? " – " : ""}${formatResumeDateForDisplay(String(edu.endDate ?? ""))}`,
                              )}
                            </div>
                          )}
                          {(edu.location || pathRevealed(canvas, `education.${index}.location`)) && (
                            <div className={`${template.id}-education-location`}>
                              {ed(`education.${index}.location`, edu.location)}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : isConfidentGrid ? (
                    <>
                      <div className={`${template.id}-education-title-line`}>
                        {(edu.institution || pathRevealed(canvas, `education.${index}.institution`)) && (
                          <span className={`${template.id}-degree`}>
                            {ed(`education.${index}.institution`, edu.institution)}
                          </span>
                        )}
                        {(edu.degree || pathRevealed(canvas, `education.${index}.degree`)) && (
                          <>
                            {edu.institution && (
                              <span className={`${template.id}-title-separator`}>
                                ,{" "}
                              </span>
                            )}
                            <span className={`${template.id}-institution`}>
                              {ed(`education.${index}.degree`, edu.degree)}
                            </span>
                          </>
                        )}
                      </div>
                      {(edu.startDate ||
                        edu.endDate ||
                        edu.location ||
                        canvas ||
                        shouldAppendEducationField(edu.degree, edu.field)) && (
                        <div className={`${template.id}-education-meta-line`}>
                          {edDate(`education.${index}`, [
                            edu.startDate || edu.endDate
                              ? `${formatResumeDateForDisplay(String(edu.startDate ?? ""))}${edu.startDate || edu.endDate ? " - " : ""}${formatResumeDateForDisplay(String(edu.endDate ?? ""))}`
                              : "",
                            edu.location,
                            shouldAppendEducationField(edu.degree, edu.field)
                              ? edu.field
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" | "))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div
                        className={`${template.id}-education-header`}
                        style={
                          isAmberEdge || isMeridian || isSaffronLine
                            ? undefined
                            : {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                              }
                        }
                      >
                        <div
                          className={`${template.id}-education-title-container`}
                        >
                          <div
                            className={`${template.id}-degree`}
                            style={
                              isCobaltStream || isAmberEdge || isMeridian || isSaffronLine
                                ? undefined
                                : {
                                    fontSize: `${templateStyle.fontSize.body + 1}px`,
                                    fontWeight: "bold",
                                    color: isInSidebar
                                      ? templateStyle.colors.sidebarText
                                      : templateStyle.colors.text,
                                  }
                            }
                          >
                            {ed(`education.${index}.degree`, edu.degree)}
                            {shouldAppendEducationField(edu.degree, edu.field) && (
                                <span style={{ fontWeight: "normal" }}>
                                  {" "}
                                  in {ed(`education.${index}.field`, edu.field)}
                                </span>
                              )}
                            {(edu.gpa || pathRevealed(canvas, `education.${index}.gpa`)) && (
                              <span style={{ fontWeight: "normal" }}>
                                {" "}
                                (CGPA: {ed(`education.${index}.gpa`, edu.gpa)})
                              </span>
                            )}
                            {edu.percentage && (
                              <span style={{ fontWeight: "normal" }}>
                                {" "}
                                (Percentage: {edu.percentage})
                              </span>
                            )}
                          </div>
                          {(edu.institution || pathRevealed(canvas, `education.${index}.institution`)) && (
                            <div
                              className={`${template.id}-institution`}
                              style={
                                isCobaltStream || isAmberEdge || isMeridian || isSaffronLine
                                  ? undefined
                                  : {
                                      fontSize: `${templateStyle.fontSize.body}px`,
                                      color: templateStyle.colors.secondary,
                                      fontStyle: "italic",
                                    }
                              }
                            >
                              {ed(`education.${index}.institution`, edu.institution)}
                            </div>
                          )}
                        </div>
                        <div
                          className={`${template.id}-education-details-container`}
                          style={
                            isAmberEdge || isMeridian || isSaffronLine
                              ? undefined
                              : {
                                  fontSize: `${templateStyle.fontSize.small}px`,
                                  color: templateStyle.colors.secondary,
                                  textAlign: "right",
                                }
                          }
                        >
                          <div className={`${template.id}-education-date`}>
                            {edDate(`education.${index}`, `${formatResumeDateForDisplay(String(edu.startDate ?? ""))}${edu.startDate || edu.endDate ? " - " : ""}${formatResumeDateForDisplay(String(edu.endDate ?? ""))}`)}
                          </div>
                          {(edu.location || pathRevealed(canvas, `education.${index}.location`)) && (
                            <div
                              className={`${template.id}-education-location`}
                            >
                              {ed(`education.${index}.location`, edu.location)}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "skills":
        // Handle both executive (sections array) and other templates (direct skills object)
        let skillsData: any = null;
        let skillItems: any[] = [];

        // Executive: rated skills from the older sections array, when a resume has them.
        // Everyone else (and Executive without them) uses the skills field — before, Executive
        // printed an empty "Skills" heading for every current resume.
        const executiveRatedSkills =
          template.id === "executive"
            ? ((resume.content as any).sections?.find((s: any) => s.type === "skills")?.items ?? [])
            : [];
        if (executiveRatedSkills.length > 0) {
          skillItems = executiveRatedSkills;
        } else {
          // Other templates: Get from direct skills field (new structure: single field)
          skillsData = resume.content.skills;

          if (isRoyalIndigo) {
            const skillList = parseRoyalIndigoSkillItems(skillsData);

            let languagesData: any[] = [];
            const languagesSection = (resume.content as any).sections?.find(
              (s: any) => s.type === "languages",
            );
            if (languagesSection?.items?.length) {
              languagesData = languagesSection.items;
            } else if (Array.isArray(resume.content.languages)) {
              languagesData = resume.content.languages;
            }

            const languageText = languagesData
              .map((lang) => {
                const name =
                  typeof lang === "string" ? lang : lang.name || String(lang);
                const level =
                  typeof lang === "object"
                    ? Number(lang.level ?? lang.proficiency)
                    : undefined;
                const levelLabel = formatRoyalIndigoLanguageLevel(level);
                return levelLabel ? `${name} (${levelLabel})` : name;
              })
              .filter(Boolean)
              .join(", ");

            const certificatesData = resume.content.certificates || [];
            const certificateText = certificatesData
              .map((cert: { name?: string; title?: string }) =>
                cert.name || cert.title || "",
              )
              .filter(Boolean)
              .join(", ");

            const awardsData = resume.content.awards || [];
            // `node`: the same text with each name as an inline field on the editor canvas.
            const additionalItems: { label: string; value: string; node?: React.ReactNode }[] = [];
            const joinNodes = (parts: React.ReactNode[]) =>
              parts.map((part, i) => <React.Fragment key={i}>{i > 0 ? ", " : null}{part}</React.Fragment>);
            const editableLanguages = canvas && !languagesSection?.items?.length;

            if (skillList.length > 0) {
              additionalItems.push({
                label: "Technical Skills",
                value: skillList.join(", "),
              });
            }
            if (languageText) {
              additionalItems.push({
                label: "Languages",
                value: languageText,
                node: editableLanguages
                  ? joinNodes(
                      languagesData.map((lang, i) => {
                        if (typeof lang !== "object" || lang === null) return String(lang);
                        const levelLabel = formatRoyalIndigoLanguageLevel(Number(lang.level ?? lang.proficiency));
                        return (
                          <>
                            {ed(`languages.${i}.name`, lang.name)}
                            {levelLabel ? ` (${levelLabel})` : null}
                          </>
                        );
                      }),
                    )
                  : undefined,
              });
            }
            if (certificateText) {
              additionalItems.push({
                label: "Certifications",
                value: certificateText,
                node: canvas
                  ? joinNodes(
                      certificatesData
                        .map((cert: { name?: string; title?: string }, i: number) =>
                          cert.name || cert.title
                            ? ed(`certificates.${i}.${cert.title !== undefined || !cert.name ? "title" : "name"}`, cert.title || cert.name)
                            : null,
                        )
                        .filter(Boolean),
                    )
                  : undefined,
              });
            }
            awardsData.forEach((award: {
              title?: string;
              issuer?: string;
              description?: string;
            }, i: number) => {
              // The award itself first, then what it was for (the title used to be dropped).
              const name = [award.title?.trim(), award.issuer?.trim()].filter(Boolean).join(", ");
              const about = award.description?.trim();
              const value = name && about ? `${name}: ${about}` : name || about || "";
              if (value) {
                const rest = [award.issuer?.trim()].filter(Boolean).join("");
                additionalItems.push({
                  label: "Awards/Activities",
                  value,
                  node:
                    canvas && award.title?.trim() ? (
                      <>
                        {ed(`awards.${i}.title`, award.title)}
                        {rest ? `, ${rest}` : null}
                        {about ? `: ${about}` : null}
                      </>
                    ) : undefined,
                });
              }
            });

            if (additionalItems.length === 0) return null;

            return (
              <div
                data-section={section.id}
                className={`${template.id}-section`}
                style={{
                  marginBottom: `${templateStyle.sectionSpacing}px`,
                  ...sidebarStyle,
                }}
              >
                {renderSectionHeader(
                  section.title,
                  isInSidebar,
                  section.type,
                  section.id,
                )}
                <div className={`${template.id}-skills-list`}>
                  <ul>
                    {additionalItems.map((item, index) => (
                      <li
                        key={`${item.label}-${index}`}
                        data-item-id={`additional-${section.id}-${index}`}
                      >
                        <span className={`${template.id}-skill-label`}>
                          {item.label}:
                        </span>{" "}
                        {item.node ?? item.value}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          }

          if (isAmberEdge) {
            const parseAmberEdgeSkillList = (data: unknown): string[] => {
              if (!data) return [];
              if (typeof data === "string") {
                try {
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(data, "text/html");
                  const listElements = doc.querySelectorAll("ul > li, ol > li");
                  if (listElements.length > 0) {
                    return Array.from(listElements)
                      .map((el) => el.textContent?.trim() || "")
                      .filter(Boolean);
                  }
                } catch {
                  /* fall through */
                }
                return data
                  .split(/[,|\n]/)
                  .map((item) => item.trim())
                  .filter(Boolean);
              }
              if (Array.isArray(data)) {
                return data
                  .map((skill) => String(skill).trim())
                  .filter(Boolean);
              }
              return [];
            };

            let professionalSkills: string[] = [];
            let technicalSkills: string[] = [];

            if (
              typeof skillsData === "object" &&
              skillsData !== null &&
              !Array.isArray(skillsData)
            ) {
              const grouped = skillsData as {
                soft?: unknown;
                professional?: unknown;
                technical?: unknown;
              };
              professionalSkills = parseAmberEdgeSkillList(
                grouped.soft ?? grouped.professional,
              );
              technicalSkills = parseAmberEdgeSkillList(grouped.technical);
            }

            // A plain list is one "Skills" section in two columns. It used to be split in half
            // under made-up "Professional" / "Technical" headings, which ATS parsers read as one
            // garbled heading line (and which mislabelled half the skills).
            const isGrouped = professionalSkills.length > 0 || technicalSkills.length > 0;
            if (!isGrouped) {
              const allSkills = parseAmberEdgeSkillList(skillsData);
              if (allSkills.length === 0) return null;
              const midpoint = Math.ceil(allSkills.length / 2);
              professionalSkills = allSkills.slice(0, midpoint);
              technicalSkills = allSkills.slice(midpoint);
            }

            if (professionalSkills.length === 0 && technicalSkills.length === 0) {
              return null;
            }

            const renderSkillColumn = (items: string[], colOffset: number) => (
              <div>
                {items.map((item, index) => (
                  <div
                    key={`${colOffset}-${index}`}
                    data-item-id={`skill-bullet-${colOffset}-${index}`}
                    data-item-index={colOffset + index}
                    className={`${template.id}-skill-item`}
                  >
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            );

            return (
              <div
                data-section={section.id}
                className={`${template.id}-section`}
                style={{
                  marginBottom: `${templateStyle.sectionSpacing}px`,
                  ...sidebarStyle,
                }}
              >
                {isGrouped ? null : renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
                <div className={`${template.id}-skills-dual`}>
                  {professionalSkills.length > 0 && (
                    <div className={`${template.id}-skills-dual-column`}>
                      {isGrouped ? (
                        <div className={`${template.id}-skills-dual-header`}>Professional Skills</div>
                      ) : null}
                      {renderSkillColumn(professionalSkills, 0)}
                    </div>
                  )}
                  {technicalSkills.length > 0 && (
                    <div className={`${template.id}-skills-dual-column`}>
                      {isGrouped ? (
                        <div className={`${template.id}-skills-dual-header`}>Technical Skills</div>
                      ) : null}
                      {renderSkillColumn(
                        technicalSkills,
                        professionalSkills.length,
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (isSaffronLine) {
            const skillGroups = parseSaffronLineSkillGroups(skillsData);
            if (skillGroups.length === 0) return null;

            return (
              <div
                data-section={section.id}
                className={`${template.id}-section`}
                style={{
                  marginBottom: `${templateStyle.sectionSpacing}px`,
                  ...sidebarStyle,
                }}
              >
                {renderSectionHeader(
                  section.title,
                  isInSidebar,
                  section.type,
                  section.id,
                )}
                <div className={`${template.id}-skills-groups`}>
                  {skillGroups.map((group, index) => (
                    <div
                      key={`${group.label}-${index}`}
                      data-item-id={`skill-${section.id}-${index}`}
                      data-item-index={index}
                      className={`${template.id}-skill-category`}
                    >
                      <span className={`${template.id}-skill-category-name`}>
                        {group.label}:
                      </span>{" "}
                      <span className={`${template.id}-skill-category-value`}>
                        {group.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (!skillsData) return null;
        }

        if (isConfidentGrid && resume.templateId !== "executive") {
          const skillItems = parseConfidentGridSkillsList(skillsData);
          if (skillItems.length === 0) return null;

          return (
            <div
              data-section={section.id}
              className={`${template.id}-section`}
              style={{
                marginBottom: `${templateStyle.sectionSpacing}px`,
                ...sidebarStyle,
              }}
            >
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              <div className={`${template.id}-skills-container`}>
                {skillItems.map((item, itemIndex) => (
                  <div
                    key={`cg-skill-${itemIndex}`}
                    data-item-id={`skill-bullet-${itemIndex}`}
                    data-item-index={itemIndex}
                    className={`${template.id}-skill-item`}
                  >
                    <span className={`${template.id}-skill-name`}>
                      {item.name}
                    </span>
                    {item.description && (
                      <>
                        <span className={`${template.id}-skill-separator`}>
                          {" "}
                          —{" "}
                        </span>
                        <span className={`${template.id}-skill-desc`}>
                          {item.description}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (isCondensedRule && resume.templateId !== "executive") {
          let listItems: string[] = [];

          if (typeof skillsData === "string") {
            try {
              const parser = new DOMParser();
              const doc = parser.parseFromString(skillsData, "text/html");
              const listElements = doc.querySelectorAll("ul > li, ol > li");
              if (listElements.length > 0) {
                listItems = Array.from(listElements)
                  .map((el) => el.textContent?.trim() || "")
                  .filter(Boolean);
              } else {
                listItems = skillsData
                  .split(/[,|]/)
                  .map((item) => item.trim())
                  .filter(Boolean);
              }
            } catch {
              listItems = skillsData
                .split(/[,|]/)
                .map((item) => item.trim())
                .filter(Boolean);
            }
          } else if (Array.isArray(skillsData)) {
            listItems = skillsData
              .map((skill: unknown) =>
                typeof skill === "string" ? skill : String(skill),
              )
              .filter((text: string) => text.length > 0);
          }

          if (listItems.length === 0) return null;

          return (
            <div
              data-section={section.id}
              style={{
                marginBottom: `${templateStyle.sectionSpacing}px`,
                ...sidebarStyle,
              }}
            >
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              {renderCondensedRuleInlineList(
                listItems,
                `${template.id}-inline-list`,
              )}
            </div>
          );
        }

        return (
          <div data-section={section.id}
            style={{
              marginBottom: `${isInSidebar && templateStyle.headerStyle === "two-column"
                ? templateStyle.sectionSpacing * 2
                : templateStyle.sectionSpacing
                }px`,
              ...(isInSidebar &&
                templateStyle.headerStyle === "two-column" && {
                paddingTop: "15px",
                paddingBottom: "15px",
              }),
              ...sidebarStyle,
            }}
          >
            {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
            <div
              style={
                useCssBodyTypography
                  ? undefined
                  : {
                      fontSize: `${templateStyle.fontSize.body}px`,
                      lineHeight: templateStyle.lineHeight,
                      color: isInSidebar
                        ? templateStyle.colors.sidebarText
                        : templateStyle.colors.text,
                    }
              }
            >
              {skillItems.length > 0 ? (
                // Executive template: Render skill items with ratings
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6px 20px",
                  }}
                >
                  {skillItems.map((item: any, index: number) => {
                    const level = item.level || 3;
                    return (
                      <div
                        key={index}
                        data-item-id={item.id || `skill-${index}`}
                        data-item-index={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            flex: 1,
                            fontSize: `${templateStyle.fontSize.body}px`,
                          }}
                        >
                          {item.name}
                        </span>
                        <div style={{ display: "flex", gap: "2px" }}>
                          {[1, 2, 3, 4, 5].map((dot) => (
                            <div
                              key={dot}
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                backgroundColor:
                                  dot <= level ? "#000000" : "#e0e0e0",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : templateStyle.skillsDisplay.type === "bullets" ? (
                // Bullet-style layout (configurable columns)
                <>
                  {(() => {
                    if (!skillsData) return null;

                    // Parse HTML string to extract list items
                    let listItems: string[] = [];

                    if (typeof skillsData === "string") {
                      try {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(
                          skillsData,
                          "text/html",
                        );

                        // Extract from ul/ol > li (direct children only)
                        const listElements =
                          doc.querySelectorAll("ul > li, ol > li");
                        if (listElements.length > 0) {
                          listItems = Array.from(listElements)
                            .map((el) => {
                              return el.textContent?.trim() || "";
                            })
                            .filter((text) => text.length > 0);
                        } else {
                          // Fallback: extract from p tags if no list items
                          const paragraphs = doc.querySelectorAll("p");
                          if (paragraphs.length > 0) {
                            listItems = Array.from(paragraphs)
                              .map((el) => {
                                return el.textContent?.trim() || "";
                              })
                              .filter((text) => text.length > 0);
                          }
                        }
                      } catch (error) {
                        console.error("Error parsing skills HTML:", error);
                      }
                    } else if (Array.isArray(skillsData)) {
                      listItems = skillsData
                        .map((skill: any) =>
                          typeof skill === "string" ? skill : String(skill),
                        )
                        .filter((text: string) => text.length > 0);
                    }

                    if (listItems.length === 0) return null;

                    // Remove duplicates using Set
                    const seenItems = new Set<string>();
                    const uniqueItems = listItems.filter((item) => {
                      if (seenItems.has(item)) return false;
                      seenItems.add(item);
                      return true;
                    });

                    const numColumns = templateStyle.skillsDisplay.columns || 3;
                    const bulletSize =
                      templateStyle.skillsDisplay.customBulletSize || 6;

                    // Distribute items into columns using round-robin
                    const columns: string[][] = Array.from(
                      { length: numColumns },
                      () => [],
                    );
                    uniqueItems.forEach((item, index) => {
                      const columnIndex = index % numColumns;
                      columns[columnIndex].push(item);
                    });

                    return (
                      <div
                        className={`${template.id}-skills-container`}
                        style={
                          isConfidentGrid || isMeridian
                            ? undefined
                            : {
                                display: "grid",
                                gridTemplateColumns: `repeat(${numColumns}, 1fr)`,
                                gap: "8px 20px",
                                fontFamily: templateStyle.fontFamily,
                              }
                        }
                      >
                        {isConfidentGrid ? (
                          uniqueItems.map((item, itemIndex) => {
                            const parsed = parseConfidentGridSkillItem(item);
                            return (
                              <div
                                key={`cg-skill-${itemIndex}`}
                                data-item-id={`skill-bullet-${itemIndex}`}
                                data-item-index={itemIndex}
                                className={`${template.id}-skill-item`}
                              >
                                <span className={`${template.id}-skill-name`}>
                                  {parsed.name}
                                </span>
                                {parsed.description && (
                                  <>
                                    <span
                                      className={`${template.id}-skill-separator`}
                                    >
                                      {" "}
                                      —{" "}
                                    </span>
                                    <span className={`${template.id}-skill-desc`}>
                                      {parsed.description}
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          columns.map((column, colIndex) => (
                            <div key={colIndex}>
                              {column.map((item, itemIndex) => (
                                <div
                                  key={`${colIndex}-${itemIndex}`}
                                  data-item-id={`skill-bullet-${colIndex}-${itemIndex}`}
                                  data-item-index={
                                    colIndex *
                                      Math.ceil(
                                        uniqueItems.length / numColumns,
                                      ) +
                                    itemIndex
                                  }
                                  className={`${template.id}-skill-item`}
                                  style={
                                    isMeridian
                                      ? undefined
                                      : {
                                          display: "flex",
                                          alignItems: "flex-start",
                                          gap: "8px",
                                          marginBottom: "4px",
                                          fontSize: `${templateStyle.fontSize.body}px`,
                                        }
                                  }
                                >
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })()}
                </>
              ) : (
                // Other templates: Render as text/HTML
                <>
                  {(() => {
                    // New structure: single skills field (string or array)
                    if (typeof skillsData === "string") {
                      return (
                        <div
                          style={{
                            color: isInSidebar
                              ? templateStyle.colors.sidebarText
                              : templateStyle.colors.text,
                          }}
                          className="resume-content"
                          dangerouslySetInnerHTML={{ __html: skillsData }}
                        />
                      );
                    } else if (Array.isArray(skillsData)) {
                      return (
                        <div>
                          {skillsData.map((skill: any, index: number) => (
                            <span key={index}>
                              {skill}
                              {index < skillsData.length - 1 && ", "}
                            </span>
                          ))}
                        </div>
                      );
                    }
                    // Old structure: backward compatibility - merge technical and soft
                    else if (
                      typeof skillsData === "object" &&
                      skillsData !== null
                    ) {
                      const oldSkills = skillsData as any;
                      // Prefer technical, fallback to soft
                      const primarySkills =
                        oldSkills.technical || oldSkills.soft;

                      if (typeof primarySkills === "string") {
                        return (
                          <div
                            style={{
                              color: isInSidebar
                                ? templateStyle.colors.sidebarText
                                : templateStyle.colors.text,
                            }}
                            className="resume-content"
                            dangerouslySetInnerHTML={{ __html: primarySkills }}
                          />
                        );
                      } else if (Array.isArray(primarySkills)) {
                        return (
                          <div>
                            {primarySkills.map((skill: any, index: number) => (
                              <span key={index}>
                                {skill}
                                {index < primarySkills.length - 1 && ", "}
                              </span>
                            ))}
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}
                </>
              )}
            </div>
          </div>
        );

      case "projects":
        const projectsData = resume.content.projects || [];
        if (projectsData.length === 0) return null;

        if (isCondensedRule || isRoyalIndigo || isCobaltStream) {
          const formatProjectDates = isRoyalIndigo
            ? formatRoyalIndigoDateRange
            : formatProjectDateRange;

          return (
            <div
              data-section={section.id}
              className={`${template.id}-section`}
              style={
                useCssBodyTypography
                  ? { marginBottom: `${templateStyle.sectionSpacing}px`, ...sidebarStyle }
                  : { marginBottom: `${templateStyle.sectionSpacing}px`, ...sidebarStyle }
              }
            >
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              <div>
                {projectsData.map((project, index) => {
                  const tech =
                    project.technologies == null
                      ? ""
                      : typeof project.technologies === "string"
                        ? project.technologies
                            .split(",")
                            .map((t: string) => t.trim())
                            .filter(Boolean)
                            .join(", ")
                        : (project.technologies as string[]).filter(Boolean).join(", ");

                  const itemId = project.id || `project-${index}`;

                  return (
                    <div
                      key={index}
                      className={`${template.id}-project-item`}
                    >
                      <div
                        data-item-id={`${itemId}-header`}
                        data-item-index={index}
                        className={`${template.id}-job-header`}
                      >
                        <div className={`${template.id}-job-title-line`}>
                          {(project.name || pathRevealed(canvas, `projects.${index}.name`)) && (
                            <span className={`${template.id}-company`}>{ed(`projects.${index}.name`, project.name)}</span>
                          )}
                          {(tech || pathRevealed(canvas, `projects.${index}.technologies`)) && (
                            <>
                              {project.name && (
                                <span className={`${template.id}-title-separator`}>, </span>
                              )}
                              <span className={`${template.id}-project-subtitle`}>{ed(`projects.${index}.technologies`, tech)}</span>
                            </>
                          )}
                        </div>
                        {(formatProjectDates(project) || revealEntry(section.id, index)) && (
                          <div className={`${template.id}-job-details-container`}>
                            <div className={`${template.id}-job-date`}>
                              {edDate(`projects.${index}`, formatProjectDates(project))}
                            </div>
                          </div>
                        )}
                      </div>
                      {(hasText(project.description) || revealEntry(section.id, index)) && (
                        <div
                          data-item-id={`${itemId}-body`}
                          className={`resume-content ${template.id}-description`}
                          {...rich(`projects.${index}.description`)} dangerouslySetInnerHTML={stableHtml({
                            __html: formatExperienceDescriptionHtml(project.description),
                          })}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        if (isAmberEdge) {
          return (
            <div
              data-section={section.id}
              className={`${template.id}-section`}
              style={{
                marginBottom: `${templateStyle.sectionSpacing}px`,
                ...sidebarStyle,
              }}
            >
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              <div>
                {projectsData.map((project, index) => {
                  const itemId = project.id || `project-${index}`;
                  const dateText = [project.startDate, project.endDate]
                    .filter(Boolean)
                    .map((d) => formatResumeDateForDisplay(String(d)))
                    .join(" – ");

                  return (
                    <div
                      key={index}
                      className={`${template.id}-project-item`}
                      data-item-id={itemId}
                      data-item-index={index}
                    >
                      <div className={`${template.id}-job-header`}>
                        <div className={`${template.id}-job-title-container`}>
                          <div className={`${template.id}-project-title`}>
                            {ed(`projects.${index}.name`, project.name)}
                          </div>
                        </div>
                        {(dateText || revealEntry(section.id, index)) && (
                          <div className={`${template.id}-job-details-container`}>
                            <div className={`${template.id}-job-date`}>
                              {edDate(`projects.${index}`, dateText)}
                            </div>
                          </div>
                        )}
                      </div>
                      {(hasText(project.description) || revealEntry(section.id, index)) && (
                        <div
                          className={`resume-content ${template.id}-description`}
                          {...rich(`projects.${index}.description`)} dangerouslySetInnerHTML={stableHtml({
                            __html: formatExperienceDescriptionHtml(
                              project.description,
                            ),
                          })}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        return (
          <div
            data-section={section.id}
            style={{
              marginBottom: `${isInSidebar && templateStyle.headerStyle === "two-column"
                ? templateStyle.sectionSpacing * 2
                : templateStyle.sectionSpacing
                }px`,
              ...(isInSidebar &&
                templateStyle.headerStyle === "two-column" && {
                paddingTop: "15px",
                paddingBottom: "15px",
              }),
              ...sidebarStyle,
            }}
          >
            {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
            <div>
              {projectsData.map((project, index) => (
                <div
                  key={index}
                  data-item-id={project.id || `project-${index}`}
                  data-item-index={index}
                  data-pagination-atomic-if-fits=""
                  className={isConfidentGrid ? `${template.id}-project-item` : undefined}
                  style={{
                    marginBottom: isConfidentGrid ? undefined : "16px",
                    pageBreakInside: "auto", // Allow splitting for better pagination
                  }}
                >
                  <div
                    className={isConfidentGrid ? `${template.id}-project-title` : undefined}
                    style={
                      isConfidentGrid
                        ? undefined
                        : {
                            fontSize: `${templateStyle.fontSize.body + 1}px`,
                            fontWeight: "bold",
                            color: isInSidebar
                              ? templateStyle.colors.sidebarText
                              : templateStyle.colors.text,
                            marginBottom: "2px",
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "baseline",
                            gap: "6px",
                          }
                    }
                  >
                    <span>{ed(`projects.${index}.name`, project.name)}</span>
                    {project.link && (
                      <a
                        href={
                          project.link.startsWith("http")
                            ? project.link
                            : `https://${project.link}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resume-content"
                        style={{
                          fontSize: `${templateStyle.fontSize.small}px`,
                          fontWeight: "normal",
                          color: templateStyle.colors.secondary,
                          textDecoration: "underline",
                        }}
                      >
                        Link
                      </a>
                    )}
                  </div>
                  {(project.startDate || project.endDate || revealEntry(section.id, index)) && (
                    <div
                      style={{
                        fontSize: `${templateStyle.fontSize.small}px`,
                        color: templateStyle.colors.secondary,
                        marginBottom: "4px",
                      }}
                    >
                      {edDate(
                        `projects.${index}`,
                        [project.startDate, project.endDate]
                          .filter(Boolean)
                          .map((d) => formatResumeDateForDisplay(String(d)))
                          .join(" – "),
                      )}
                    </div>
                  )}
                  {(hasText(project.description) || revealEntry(section.id, index)) && (
                    <div
                      className={`resume-content${
                        isConfidentGrid ? ` ${template.id}-project-description` : ""
                      }`}
                      style={
                        isConfidentGrid
                          ? undefined
                          : {
                              fontSize: `${templateStyle.fontSize.body}px`,
                              lineHeight: templateStyle.lineHeight,
                              color: isInSidebar
                                ? templateStyle.colors.sidebarText
                                : templateStyle.colors.text,
                              marginBottom: "4px",
                            }
                      }
                      {...rich(`projects.${index}.description`)} dangerouslySetInnerHTML={stableHtml({
                        __html: formatExperienceDescriptionHtml(project.description),
                      })}
                    />
                  )}
                  {(() => {
                    const tech =
                      project.technologies == null
                        ? ""
                        : typeof project.technologies === "string"
                          ? project.technologies
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean)
                            .join(", ")
                          : (project.technologies as string[])
                            .filter(Boolean)
                            .join(", ");
                    return (
                      tech && (
                        <div
                          style={{
                            fontSize: `${templateStyle.fontSize.small}px`,
                            color: templateStyle.colors.secondary,
                          }}
                        >
                          Technologies: {ed(`projects.${index}.technologies`, tech)}
                        </div>
                      )
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        );

      case "languages":
        if (isRoyalIndigo) return null;

        // Check multiple possible locations for languages data
        let languagesData: any[] = [];

        // 1. Check sections array (for templates with ratings)
        const languagesSection = (resume.content as any).sections?.find(
          (s: any) => s.type === "languages",
        );
        if (languagesSection?.items && Array.isArray(languagesSection.items)) {
          languagesData = languagesSection.items;
        }
        // 2. Check direct languages property
        else if (
          resume.content.languages &&
          Array.isArray(resume.content.languages)
        ) {
          languagesData = resume.content.languages;
        }
        // 3. Check skills.languages (old structure - only if skills is an object)
        else if (
          typeof resume.content.skills === "object" &&
          resume.content.skills !== null &&
          !Array.isArray(resume.content.skills) &&
          "languages" in resume.content.skills &&
          Array.isArray((resume.content.skills as any).languages)
        ) {
          languagesData = (resume.content.skills as any).languages;
        }
        // 4. Check if it's a string (rich text format)
        else if (
          typeof resume.content.languages === "string" &&
          resume.content.languages.trim()
        ) {
          // For string format, create a simple display
          return (
            <div data-section={section.id}
              style={{
                marginBottom: `${templateStyle.sectionSpacing}px`,
                ...sidebarStyle,
              }}
            >
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              <div
                style={{
                  fontSize: `${templateStyle.fontSize.body}px`,
                  color: isInSidebar
                    ? templateStyle.colors.sidebarText
                    : templateStyle.colors.text,
                  lineHeight: "1.4",
                }}
                className="resume-content"
                dangerouslySetInnerHTML={{ __html: resume.content.languages }}
              />
            </div>
          );
        }

        if (languagesData.length === 0) {
          // Show placeholder if section is visible but empty
          if (!canvas) return null; // empty sections never reach the PDF
          return (
            <div data-section={section.id}
              style={{
                marginBottom: `${templateStyle.sectionSpacing}px`,
                ...sidebarStyle,
              }}
            >
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              <div
                style={{
                  fontSize: `${templateStyle.fontSize.body}px`,
                  color: isInSidebar
                    ? templateStyle.colors.sidebarText
                    : templateStyle.colors.text,
                  fontStyle: "italic",
                  opacity: 0.7,
                }}
              >
                <span data-rx-empty-section={section.id}>{EMPTY_SECTION_ACTION[section.type] ?? "Add an item"}</span>
              </div>
            </div>
          );
        }

        // Get language display configuration
        const langConfig = templateStyle.languageDisplay || {
          showRatings: false,
          ratingType: "dots",
          maxRating: 5,
          dotSize: 6,
          columns: 2,
        };

        if (isCondensedRule) {
          const languageItems = languagesData.map(
            (lang: { name?: string; level?: number; proficiency?: number }) => {
              const name =
                typeof lang === "string" ? lang : lang.name || String(lang);
              const level =
                typeof lang === "object"
                  ? Number(lang.level ?? lang.proficiency)
                  : undefined;
              return {
                label: name,
                value: formatCondensedRuleLanguageLevel(level),
              };
            },
          );

          return (
            <div
              data-section={section.id}
              style={{
                marginBottom: `${templateStyle.sectionSpacing}px`,
                ...sidebarStyle,
              }}
            >
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              {renderCondensedRuleLabeledInlineList(
                languageItems,
                `${template.id}-inline-list`,
                canvas && languagesData.every((l: unknown) => typeof l === "object" && l !== null)
                  ? (i, label) => ed(`languages.${i}.name`, label)
                  : undefined,
              )}
            </div>
          );
        }

        if (isSaffronLine) {
          const languageItems = languagesData.map(
            (lang: { name?: string; level?: number; proficiency?: number }) => {
              const name =
                typeof lang === "string" ? lang : lang.name || String(lang);
              const level =
                typeof lang === "object"
                  ? Number(lang.level ?? lang.proficiency)
                  : undefined;
              return {
                label: name,
                value: formatSaffronLineLanguageLevel(level),
              };
            },
          );

          return (
            <div
              data-section={section.id}
              className={`${template.id}-section`}
              style={{
                marginBottom: `${templateStyle.sectionSpacing}px`,
                ...sidebarStyle,
              }}
            >
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              <div className={`${template.id}-languages-list`}>
                {languageItems.map((item, index) => (
                  <div
                    key={`${item.label}-${index}`}
                    data-item-id={`lang-${section.id}-${index}`}
                    data-item-index={index}
                    className={`${template.id}-language-item`}
                  >
                    <span className={`${template.id}-skill-category-name`}>
                      {canvas && typeof languagesData[index] === "object" && languagesData[index] !== null
                        ? ed(`languages.${index}.name`, item.label)
                        : item.label}
                      {item.value?.trim() ? ":" : ""}
                    </span>
                    {item.value?.trim() ? (
                      <>
                        {" "}
                        <span className={`${template.id}-skill-category-value`}>{item.value}</span>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div
            data-section={section.id}
            style={{
              position: "relative",
              marginBottom: `${isInSidebar && templateStyle.headerStyle === "two-column"
                ? templateStyle.sectionSpacing * 2
                : templateStyle.sectionSpacing
                }px`,
              ...(isInSidebar &&
                templateStyle.headerStyle === "two-column" && {
                paddingTop: "15px",
                paddingBottom: "15px",
              }),
              ...sidebarStyle,
            }}
          >
            {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
            <div
              className={langConfig.containerClass || ""}
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${langConfig.columns || 2}, 1fr)`,
                gap: "8px",
              }}
            >
              {languagesData.map((lang, index) => (
                <div
                  key={index}
                  data-item-id={lang.id || `lang-${index}`}
                  data-item-index={index}
                  className={langConfig.itemClass || ""}
                  style={{ marginBottom: "6px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      className={langConfig.nameClass || ""}
                      style={{
                        fontSize: `${templateStyle.fontSize.body}px`,
                        color: isInSidebar
                          ? templateStyle.colors.sidebarText
                          : templateStyle.colors.text,
                        flex: 1,
                      }}
                    >
                      {typeof lang === "string"
                        ? lang
                        : Array.isArray(resume.content.languages)
                          ? ed(`languages.${index}.name`, lang.name, "Language")
                          : lang.name || String(lang)}
                    </span>
                    {/* A written level ("Fluent") reads as text; dots only for a 1–5 number
                        (a word used to give five empty dots). */}
                    {typeof lang === "object" &&
                      langConfig.showRatings &&
                      !(Number(lang.level || lang.proficiency) >= 1) &&
                      typeof (lang.proficiency || lang.level) === "string" &&
                      String(lang.proficiency || lang.level).trim() ? (
                        <span
                          style={{
                            marginLeft: "6px",
                            fontSize: `${templateStyle.fontSize.small}px`,
                            color: isInSidebar ? templateStyle.colors.sidebarText : templateStyle.colors.secondary || templateStyle.colors.text,
                          }}
                        >
                          {String(lang.proficiency || lang.level).trim()}
                        </span>
                      ) : null}
                    {typeof lang === "object" &&
                      Number(lang.level || lang.proficiency) >= 1 &&
                      langConfig.showRatings && (
                        <div
                          className={langConfig.ratingClass || ""}
                          style={{
                            display: "flex",
                            gap: `${Math.floor(
                              (langConfig.dotSize || 6) / 2,
                            )}px`,
                            marginLeft: "6px",
                          }}
                        >
                          {Array.from(
                            { length: langConfig.maxRating || 5 },
                            (_, i) => i + 1,
                          ).map((level) => (
                            <div
                              key={level}
                              className={
                                langConfig.dotClass
                                  ? `${langConfig.dotClass} ${level <= (lang.level || lang.proficiency)
                                    ? "filled"
                                    : ""
                                  }`
                                  : ""
                              }
                              style={{
                                width: `${langConfig.dotSize || 6}px`,
                                height: `${langConfig.dotSize || 6}px`,
                                borderRadius: "50%",
                                backgroundColor:
                                  level <= (lang.level || lang.proficiency)
                                    ? isInSidebar
                                      ? templateStyle.colors.sidebarText ||
                                      "#000"
                                      : templateStyle.colors.text || "#000"
                                    : isInSidebar
                                      ? "rgba(255,255,255,0.3)"
                                      : "rgba(0,0,0,0.2)",
                              }}
                            />
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "awards":
        // Royal Indigo lists awards under "Additional Information" (its skills section) —
        // but only while that section is on the page; otherwise they'd vanish.
        if (isRoyalIndigo && visibleSections.some((s) => s.type === "skills")) return null;

        // Executive: the older sections array when it has awards, else the awards field.
        let awardsData: any[] = [];
        const executiveAwards =
          template.id === "executive"
            ? ((resume.content as any).sections?.find((s: any) => s.type === "awards")?.items ?? [])
            : [];
        awardsData = executiveAwards.length > 0 ? executiveAwards : resume.content.awards || [];

        if (awardsData.length === 0) return null;

        if (isCondensedRule) {
          // Same one-line style as its certificates (awards used to be left out entirely).
          const awardDetail = (award: { issuer?: string; date?: string }) =>
            [award.issuer, award.date ? formatResumeDateForDisplay(String(award.date)) : ""].filter(Boolean).join(", ");
          const awardNames = awardsData.map((award: { title?: string; issuer?: string; date?: string }) =>
            [award.title, awardDetail(award)].filter(Boolean).join(" — "),
          );
          return (
            <div data-section={section.id} style={{ marginBottom: templateStyle.sectionSpacing }}>
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              {renderCondensedRuleInlineList(
                awardNames,
                `${template.id}-inline-list`,
                canvas && executiveAwards.length === 0
                  ? (i) => {
                      const award = awardsData[i] as { title?: string; issuer?: string; date?: string };
                      const detail = awardDetail(award);
                      return (
                        <>
                          {ed(`awards.${i}.title`, award.title)}
                          {detail ? ` — ${detail}` : null}
                        </>
                      );
                    }
                  : undefined,
              )}
            </div>
          );
        }

        if (isMeridian) {
          return (
            <div
              data-section={section.id}
              className={`${template.id}-section`}
              style={{
                marginBottom: `${templateStyle.sectionSpacing}px`,
                ...sidebarStyle,
              }}
            >
              {renderSectionHeader(
                section.title,
                isInSidebar,
                section.type,
                section.id,
              )}
              <ul className={`${template.id}-awards-list`}>
                {awardsData.map((award, index) => {
                  const description =
                    typeof award.description === "string"
                      ? award.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
                      : award.description || "";

                  return (
                    <li
                      key={index}
                      data-item-id={award.id || `award-${index}`}
                      data-item-index={index}
                      className={`${template.id}-award-item`}
                    >
                      {(award.title || pathRevealed(canvas, `awards.${index}.title`)) && (
                        <span className={`${template.id}-award-title`}>
                          {ed(`awards.${index}.title`, award.title)}.
                        </span>
                      )}{" "}
                      {description}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        }

        return (
          <div data-section={section.id}
            style={{
              marginBottom: `${isInSidebar && templateStyle.headerStyle === "two-column"
                ? templateStyle.sectionSpacing * 2
                : templateStyle.sectionSpacing
                }px`,
              ...(isInSidebar &&
                templateStyle.headerStyle === "two-column" && {
                paddingTop: "15px",
                paddingBottom: "15px",
              }),
              ...sidebarStyle,
            }}
          >
            {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
            {/* Add style tag to override CSS class color for sidebar */}
            {isInSidebar && (
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                    .awards-sidebar-content,
                    .awards-sidebar-content *,
                    .awards-sidebar-content p,
                    .awards-sidebar-content span,
                    .awards-sidebar-content div {
                      color: ${templateStyle.colors.sidebarText || "#ffffff"
                    } !important;
                    }
                  `,
                }}
              />
            )}
            <div>
              {awardsData.map((award, index) => (
                <div
                  key={index}
                  data-item-id={award.id || `award-${index}`}
                  data-item-index={index}
                  className={`${template.id}-award-item`}
                  style={{ marginBottom: "12px" }}
                >
                  <div
                    className={`${template.id}-award-title`}
                    style={{
                      fontSize: `${templateStyle.fontSize.body}px`,
                      fontWeight: "bold",
                      color: isInSidebar
                        ? templateStyle.colors.sidebarText
                        : templateStyle.colors.text,
                    }}
                  >
                    {ed(`awards.${index}.title`, award.title)}
                  </div>
                  {(award.issuer || award.date || pathRevealed(canvas, `awards.${index}.issuer`)) && (
                    <div
                      className={`${template.id}-award-organization`}
                      style={{
                        fontSize: `${templateStyle.fontSize.small}px`,
                        color: isInSidebar
                          ? templateStyle.colors.sidebarText || "#ffffff"
                          : templateStyle.colors.secondary,
                      }}
                    >
                      {ed(`awards.${index}.issuer`, award.issuer)}
                      {(award.date || pathRevealed(canvas, `awards.${index}.date`)) ? <>{award.issuer || canvas ? ", " : ""}{edDate1(`awards.${index}.date`, formatResumeDateForDisplay(String(award.date ?? "")))}</> : null}
                    </div>
                  )}
                  {(hasText(award.description) || revealEntry(section.id, index)) && (
                    <div
                      className={
                        isInSidebar
                          ? "resume-content awards-sidebar-content"
                          : "resume-content"
                      }
                      style={{
                        fontSize: `${templateStyle.fontSize.small}px`,
                        color: isInSidebar
                          ? templateStyle.colors.sidebarText || "#ffffff"
                          : templateStyle.colors.text,
                        marginTop: "4px",
                        lineHeight: "1.4",
                      }}
                      {...rich(`awards.${index}.description`)} dangerouslySetInnerHTML={stableHtml({
                        __html: award.description,
                      })}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "certificates":
        if (isRoyalIndigo) return null;

        // Handle both executive (sections array) and other templates (direct certificates array)
        let certificatesData: any[] = [];

        if (resume.templateId === "executive") {
          const certSection = (resume.content as any).sections?.find(
            (s: any) => s.type === "certifications",
          );
          certificatesData =
            certSection?.items || resume.content.certificates || [];
        } else {
          certificatesData = resume.content.certificates || [];
        }

        if (certificatesData.length === 0) {
          if (!canvas) return null; // empty sections never reach the PDF
          return (
            <div data-section={section.id} style={{ marginBottom: templateStyle.sectionSpacing }}>
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              <div
                style={{
                  fontSize: `${templateStyle.fontSize.body}px`,
                  color: isInSidebar
                    ? templateStyle.colors.sidebarText
                    : templateStyle.colors.text,
                  fontStyle: "italic",
                  opacity: 0.7,
                }}
              >
                <span data-rx-empty-section={section.id}>{EMPTY_SECTION_ACTION[section.type] ?? "Add an item"}</span>
              </div>
            </div>
          );
        }

        if (isCondensedRule) {
          const certificateNames = certificatesData.map(
            (cert: { name?: string; title?: string }) =>
              cert.name || cert.title || String(cert),
          );
          return (
            <div
              data-section={section.id}
              style={{ marginBottom: templateStyle.sectionSpacing }}
            >
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              {renderCondensedRuleInlineList(
                certificateNames,
                `${template.id}-inline-list`,
                canvas
                  ? (i, label) => {
                      const cert = certificatesData[i] as { name?: string; title?: string } | string;
                      if (typeof cert !== "object" || cert === null) return label;
                      return ed(`certificates.${i}.${cert.title !== undefined || !cert.name ? "title" : "name"}`, label);
                    }
                  : undefined,
              )}
            </div>
          );
        }

        return (
          <div data-section={section.id} style={{ position: "relative", marginBottom: templateStyle.sectionSpacing }}>
            {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
            <div style={{ marginLeft: "0px" }}>
              {certificatesData.map((cert: any, index: number) => (
                <div key={index} data-item-id={cert.id || `cert-${index}`} data-item-index={index} style={{ marginBottom: "8px" }}>
                  <div
                    style={{
                      fontWeight: "600",
                      fontSize: `${templateStyle.fontSize.body}px`,
                      color: isInSidebar
                        ? templateStyle.colors.sidebarText
                        : templateStyle.colors.text,
                    }}
                  >
                    {ed(`certificates.${index}.title`, cert.title)}
                  </div>
                  {/* No empty line when a certificate has only a name. */}
                  {cert.issuer || cert.issueDate || cert.expiryDate || pathRevealed(canvas, `certificates.${index}.issuer`) ? (
                    <div
                      style={{
                        fontSize: `${templateStyle.fontSize.small}px`,
                        color: templateStyle.colors.secondary,
                        marginBottom: "4px",
                      }}
                    >
                      {ed(`certificates.${index}.issuer`, cert.issuer)}
                      {(cert.issueDate || pathRevealed(canvas, `certificates.${index}.issueDate`)) ? (
                        <>
                          {cert.issuer || canvas ? " • " : ""}
                          {edDate1(`certificates.${index}.issueDate`, formatResumeDateForDisplay(String(cert.issueDate ?? "")))}
                        </>
                      ) : null}
                      {cert.expiryDate && ` - ${cert.expiryDate}`}
                    </div>
                  ) : null}
                  {cert.certificateId && (
                    <div
                      style={{
                        fontSize: `${templateStyle.fontSize.small}px`,
                        color: templateStyle.colors.secondary,
                      }}
                    >
                      ID: {cert.certificateId}
                    </div>
                  )}
                  {cert.link && (
                    <div style={{ marginTop: "4px" }}>
                      <a
                        href={cert.link}
                        style={{
                          fontSize: `${templateStyle.fontSize.small}px`,
                          color: templateStyle.colors.accent,
                          textDecoration: "none",
                        }}
                      >
                        View Certificate
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "achievements":
        const achievementsData = resume.content.achievements || [];

        // Check if it's a string (HTML content) or array
        if (typeof achievementsData === "string") {
          const achievementsString = achievementsData as string;
          const isEmpty =
            !achievementsString.trim() ||
            achievementsString.trim() === "<p></p>";

          if (isEmpty) {
            if (!canvas) return null; // empty sections never reach the PDF
            return (
              <div data-section={section.id} style={{ marginBottom: templateStyle.sectionSpacing }}>
                {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
                <div {...rich("achievements", "Your key achievements")}
                  style={{
                    fontSize: `${templateStyle.fontSize.body}px`,
                    color: isInSidebar
                      ? templateStyle.colors.sidebarText
                      : templateStyle.colors.text,
                    fontStyle: "italic",
                    opacity: 0.7,
                  }}
                >
                </div>
              </div>
            );
          }

          return (
            <div data-section={section.id} style={{ marginBottom: templateStyle.sectionSpacing }}>
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              <div
                style={{
                  fontSize: `${templateStyle.fontSize.body}px`,
                  color: isInSidebar
                    ? templateStyle.colors.sidebarText
                    : templateStyle.colors.text,
                  lineHeight: "1.4",
                }}
                className="resume-content"
                {...rich("achievements")}
                dangerouslySetInnerHTML={stableHtml(achievementsString)}
              />
            </div>
          );
        }

        // Handle array format
        if (Array.isArray(achievementsData) && achievementsData.length === 0) {
          if (!canvas) return null; // empty sections never reach the PDF
          return (
            <div data-section={section.id} style={{ marginBottom: templateStyle.sectionSpacing }}>
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              <div
                style={{
                  fontSize: `${templateStyle.fontSize.body}px`,
                  color: isInSidebar
                    ? templateStyle.colors.sidebarText
                    : templateStyle.colors.text,
                  fontStyle: "italic",
                  opacity: 0.7,
                }}
              >
                <span data-rx-empty-section={section.id}>{EMPTY_SECTION_ACTION[section.type] ?? "Add an item"}</span>
              </div>
            </div>
          );
        }

        return (
          <div data-section={section.id} style={{ position: "relative", marginBottom: templateStyle.sectionSpacing }}>
            {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
            <div style={{ marginLeft: "0px" }}>
              {achievementsData.map((achievement: any, index: number) => (
                <div key={index} data-item-id={achievement.id || `achievement-${index}`} data-item-index={index} style={{ marginBottom: "8px" }}>
                  <div
                    style={{
                      fontSize: `${templateStyle.fontSize.body}px`,
                      color: isInSidebar
                        ? templateStyle.colors.sidebarText
                        : templateStyle.colors.text,
                      lineHeight: "1.4",
                    }}
                  >
                    •{" "}
                    {typeof achievement === "string"
                      ? ed(`achievements.${index}`, achievement)
                      : achievement.title || pathRevealed(canvas, `achievements.${index}.title`)
                        ? (
                          <>
                            {ed(`achievements.${index}.title`, achievement.title)}
                            {/* The detail used to be hidden whenever there was a title. */}
                            {hasText(achievement.description) || pathRevealed(canvas, `achievements.${index}.description`) ? (
                              <>
                                {" — "}
                                {ed(
                                  `achievements.${index}.description`,
                                  String(achievement.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
                                  "Details (optional)",
                                )}
                              </>
                            ) : null}
                          </>
                        )
                        : ed(`achievements.${index}.description`, achievement.description, "Achievement")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "interests":
        const interestsRaw = resume.content.interests as
          | string
          | string[]
          | undefined;

        if (isAmberEdge || isMeridian) {
          const additionalItems: { label: string; value: string }[] = [];
          // Languages / certificates are listed here only when they have no section of their
          // own on the page (they used to print twice), and interests are always interests
          // (with no certificates they were printed as "Certifications").
          const shownTypes = new Set(visibleSections.map((s) => s.type));

          const languagesData = Array.isArray(resume.content.languages)
            ? resume.content.languages
            : [];
          const languageText = shownTypes.has("languages")
            ? ""
            : languagesData
                .map((lang) => {
                  const name =
                    typeof lang === "string" ? lang : lang.name || String(lang);
                  const level =
                    typeof lang === "object" && lang !== null
                      ? Number((lang as { level?: number }).level)
                      : undefined;
                  if (level !== undefined && Number.isFinite(level) && level > 0) {
                    return `${name} (${level}/5)`;
                  }
                  return name;
                })
                .filter(Boolean)
                .join(", ");

          if (languageText) {
            additionalItems.push({ label: "Languages", value: languageText });
          }

          const certificatesData = shownTypes.has("certificates") ? [] : resume.content.certificates || [];
          const certificateText = certificatesData
            .map(
              (cert: { name?: string; title?: string }) =>
                cert.name || cert.title || "",
            )
            .filter(Boolean)
            .join(", ");

          const interestsText = Array.isArray(interestsRaw)
            ? interestsRaw.join(", ")
            : typeof interestsRaw === "string"
              ? interestsRaw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
              : "";

          if (certificateText) {
            additionalItems.push({ label: "Certifications", value: certificateText });
          }
          if (interestsText) {
            additionalItems.push({ label: "Interests", value: interestsText });
          }

          if (isMeridian) {
            const achievementsData = resume.content.achievements || [];
            const awardsActivityText = achievementsData
              .map((item: { title?: string; description?: string } | string) =>
                typeof item === "string"
                  ? item
                  : item.title || item.description || "",
              )
              .filter(Boolean)
              .join(", ");

            if (awardsActivityText) {
              additionalItems.push({
                label: "Awards/Activities",
                value: awardsActivityText,
              });
            }
          }

          if (additionalItems.length === 0) return null;

          return (
            <div
              data-section={section.id}
              className={`${template.id}-section`}
              style={{
                marginBottom: `${templateStyle.sectionSpacing}px`,
                ...sidebarStyle,
              }}
            >
              {renderSectionHeader(
                section.title,
                isInSidebar,
                section.type,
                section.id,
              )}
              <div className={`${template.id}-skills-list`}>
                <ul>
                  {additionalItems.map((item, index) => (
                    <li
                      key={`${item.label}-${index}`}
                      data-item-id={`additional-${section.id}-${index}`}
                    >
                      <span className={`${template.id}-skill-label`}>
                        {item.label}:
                      </span>{" "}
                      {item.value}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        }

        // Check if it's empty (string or array)
        const isEmpty =
          !interestsRaw ||
          (Array.isArray(interestsRaw) && interestsRaw.length === 0) ||
          (typeof interestsRaw === "string" && !interestsRaw.trim()) ||
          (typeof interestsRaw === "string" &&
            interestsRaw.trim() === "<p></p>");

        if (isEmpty) {
          if (!canvas) return null; // empty sections never reach the PDF
          return (
            <div data-section={section.id} style={{ marginBottom: templateStyle.sectionSpacing }}>
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              <div {...rich("interests", "Your interests, separated by commas")}
                style={{
                  fontSize: `${templateStyle.fontSize.body}px`,
                  color: isInSidebar
                    ? templateStyle.colors.sidebarText
                    : templateStyle.colors.text,
                  fontStyle: "italic",
                  opacity: 0.7,
                }}
              >
              </div>
            </div>
          );
        }

        return (
          <div data-section={section.id} style={{ position: "relative", marginBottom: templateStyle.sectionSpacing }}>
            {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
            <div
              style={{
                fontSize: `${templateStyle.fontSize.body}px`,
                color: templateStyle.colors.text,
                lineHeight: "1.4",
              }}
            >
              {typeof interestsRaw === "string" ? (
                <div
                  className="resume-content"
                  {...rich("interests", "Your interests, separated by commas")}
                  dangerouslySetInnerHTML={stableHtml(interestsRaw)}
                />
              ) : Array.isArray(interestsRaw) ? (
                interestsRaw.join(", ")
              ) : null}
            </div>
          </div>
        );

      case "courses":
        const coursesData = resume.content.courses || [];
        if (coursesData.length === 0) {
          if (!canvas) return null; // empty sections never reach the PDF
          return (
            <div data-section={section.id}
              style={{
                marginBottom: `${templateStyle.sectionSpacing}px`,
                ...sidebarStyle,
              }}
            >
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              <div
                style={{
                  fontSize: `${templateStyle.fontSize.body}px`,
                  color: isInSidebar
                    ? templateStyle.colors.sidebarText
                    : templateStyle.colors.text,
                  fontStyle: "italic",
                  opacity: 0.7,
                }}
              >
                <span data-rx-empty-section={section.id}>{EMPTY_SECTION_ACTION[section.type] ?? "Add an item"}</span>
              </div>
            </div>
          );
        }

        return (
          <div
            data-section={section.id}
            style={{
              position: "relative",
              marginBottom: `${isInSidebar && templateStyle.headerStyle === "two-column"
                ? templateStyle.sectionSpacing * 2
                : templateStyle.sectionSpacing
                }px`,
              ...(isInSidebar &&
                templateStyle.headerStyle === "two-column" && {
                paddingTop: "15px",
                paddingBottom: "15px",
              }),
              ...sidebarStyle,
            }}
          >
            {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
            <div style={{ marginLeft: "0px" }}>
              {coursesData.map((course: any, index: number) => (
                <div key={index} data-item-id={course.id || `course-${index}`} data-item-index={index} style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      fontWeight: "600",
                      fontSize: `${templateStyle.fontSize.body}px`,
                      color: isInSidebar
                        ? templateStyle.colors.sidebarText
                        : templateStyle.colors.text,
                    }}
                  >
                    {ed(`courses.${index}.${course.title && !course.name ? "title" : "name"}`, course.name || course.title, "Course")}
                  </div>
                  {(course.institution || course.provider || course.date || pathRevealed(canvas, `courses.${index}.institution`)) && (
                    <div
                      style={{
                        fontSize: `${templateStyle.fontSize.small}px`,
                        color: isInSidebar
                          ? templateStyle.colors.sidebarText
                          : templateStyle.colors.secondary,
                        marginTop: "2px",
                      }}
                    >
                      {ed(`courses.${index}.${course.institution || !course.provider ? "institution" : "provider"}`, course.institution || course.provider)}
                      {(course.date || pathRevealed(canvas, `courses.${index}.date`)) ? (
                        <>
                          {course.institution || course.provider || canvas ? " • " : ""}
                          {edDate1(`courses.${index}.date`, formatResumeDateForDisplay(String(course.date ?? "")))}
                        </>
                      ) : null}
                    </div>
                  )}
                  {(hasText(course.description) || revealEntry(section.id, index)) && (
                    <div
                      style={{
                        fontSize: `${templateStyle.fontSize.body}px`,
                        color: isInSidebar
                          ? templateStyle.colors.sidebarText
                          : templateStyle.colors.text,
                        marginTop: "4px",
                        lineHeight: "1.4",
                      }}
                      className="resume-content"
                      {...rich(`courses.${index}.description`)} dangerouslySetInnerHTML={stableHtml({ __html: course.description })}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "publications":
        const publicationsData = resume.content.publications || [];
        if (publicationsData.length === 0) {
          if (!canvas) return null; // empty sections never reach the PDF
          return (
            <div data-section={section.id}
              style={{
                marginBottom: `${templateStyle.sectionSpacing}px`,
                ...sidebarStyle,
              }}
            >
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              <div
                style={{
                  fontSize: `${templateStyle.fontSize.body}px`,
                  color: isInSidebar
                    ? templateStyle.colors.sidebarText
                    : templateStyle.colors.text,
                  fontStyle: "italic",
                  opacity: 0.7,
                }}
              >
                <span data-rx-empty-section={section.id}>{EMPTY_SECTION_ACTION[section.type] ?? "Add an item"}</span>
              </div>
            </div>
          );
        }

        return (
          <div
            data-section={section.id}
            style={{
              position: "relative",
              marginBottom: `${isInSidebar && templateStyle.headerStyle === "two-column"
                ? templateStyle.sectionSpacing * 2
                : templateStyle.sectionSpacing
                }px`,
              ...(isInSidebar &&
                templateStyle.headerStyle === "two-column" && {
                paddingTop: "15px",
                paddingBottom: "15px",
              }),
              ...sidebarStyle,
            }}
          >
            {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
            <div style={{ marginLeft: "0px" }}>
              {publicationsData.map((pub: any, index: number) => (
                <div key={index} data-item-id={pub.id || `pub-${index}`} data-item-index={index} style={{ marginBottom: "8px" }}>
                  <div
                    style={{
                      fontWeight: "600",
                      fontSize: `${templateStyle.fontSize.body}px`,
                      color: isInSidebar
                        ? templateStyle.colors.sidebarText
                        : templateStyle.colors.text,
                    }}
                  >
                    {ed(`publications.${index}.title`, pub.title)}
                  </div>
                  <div
                    style={{
                      fontSize: `${templateStyle.fontSize.body}px`,
                      color: isInSidebar
                        ? templateStyle.colors.sidebarText
                        : templateStyle.colors.text,
                      fontStyle: "italic",
                    }}
                  >
                    {ed(`publications.${index}.publisher`, pub.publisher)}
                    {(pub.date || pathRevealed(canvas, `publications.${index}.date`)) ? <> • {edDate1(`publications.${index}.date`, formatResumeDateForDisplay(String(pub.date ?? "")))}</> : null}
                  </div>
                  {(pub.link || pathRevealed(canvas, `publications.${index}.link`)) && (
                    <div
                      style={{
                        fontSize: `${templateStyle.fontSize.body}px`,
                        color: templateStyle.colors.accent,
                        textDecoration: "none",
                      }}
                    >
                      {ed(`publications.${index}.link`, pub.link)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "references":
        const referencesData = resume.content.references || [];
        if (referencesData.length === 0) {
          if (!canvas) return null; // empty sections never reach the PDF
          return (
            <div data-section={section.id}
              style={{
                marginBottom: `${templateStyle.sectionSpacing}px`,
                ...sidebarStyle,
              }}
            >
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              <div
                style={{
                  fontSize: `${templateStyle.fontSize.body}px`,
                  color: isInSidebar
                    ? templateStyle.colors.sidebarText
                    : templateStyle.colors.text,
                  fontStyle: "italic",
                  opacity: 0.7,
                }}
              >
                <span data-rx-empty-section={section.id}>{EMPTY_SECTION_ACTION[section.type] ?? "Add an item"}</span>
              </div>
            </div>
          );
        }

        return (
          <div
            data-section={section.id}
            style={{
              position: "relative",
              marginBottom: `${isInSidebar && templateStyle.headerStyle === "two-column"
                ? templateStyle.sectionSpacing * 2
                : templateStyle.sectionSpacing
                }px`,
              ...(isInSidebar &&
                templateStyle.headerStyle === "two-column" && {
                paddingTop: "15px",
                paddingBottom: "15px",
              }),
              ...sidebarStyle,
            }}
          >
            {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
            <div style={{ marginLeft: "0px" }}>
              {referencesData.map((ref: any, index: number) => (
                <div key={index} data-item-id={ref.id || `reference-${index}`} data-item-index={index} style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      fontWeight: "600",
                      fontSize: `${templateStyle.fontSize.body}px`,
                      color: isInSidebar
                        ? templateStyle.colors.sidebarText
                        : templateStyle.colors.text,
                    }}
                  >
                    {ed(`references.${index}.name`, ref.name)}
                  </div>
                  <div
                    style={{
                      fontSize: `${templateStyle.fontSize.body}px`,
                      color: isInSidebar
                        ? templateStyle.colors.sidebarText
                        : templateStyle.colors.text,
                    }}
                  >
                    {ed(`references.${index}.position`, ref.position)}
                    {(ref.company || pathRevealed(canvas, `references.${index}.company`)) ? <> at {ed(`references.${index}.company`, ref.company)}</> : null}
                  </div>
                  {(ref.email || ref.phone) && (
                    <div
                      style={{
                        fontSize: `${templateStyle.fontSize.body}px`,
                        color: isInSidebar
                          ? templateStyle.colors.sidebarText
                          : templateStyle.colors.text,
                      }}
                    >
                      {ref.email && ref.email}
                      {ref.email && ref.phone && " • "}
                      {ref.phone && ref.phone}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "spacer":
        // Spacer section - renders as a small margin for column alignment
        return (
          <div
            key={section.id}
            style={{
              marginTop: "5px",
              marginBottom: "5px",
              height: "5px",
            }}
          />
        );

      case "custom":
        // Custom section - renders HTML content from customSections
        const customSectionData = resume.content.customSections?.find(
          (cs: any) => cs.id === section.id,
        );

        if (!customSectionData) {
          console.warn(
            `⚠️ Custom section data not found for section ID: ${section.id}`,
          );
          return null;
        }

        if (
          !customSectionData.content ||
          customSectionData.content.trim() === ""
        ) {
          console.warn(
            `⚠️ Custom section has no content for section ID: ${section.id}`,
          );
          return null;
        }

        return (
          <div
            data-section={section.id}
            key={section.id}
            style={{
              marginBottom: `${isInSidebar && templateStyle.headerStyle === "two-column"
                ? templateStyle.sectionSpacing * 2
                : templateStyle.sectionSpacing
                }px`,
              ...(isInSidebar &&
                templateStyle.headerStyle === "two-column" && {
                paddingTop: "15px",
                paddingBottom: "15px",
              }),
              ...sidebarStyle,
            }}
          >
            {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
            <div
              style={{
                fontSize: `${templateStyle.fontSize.body}px`,
                lineHeight: templateStyle.lineHeight,
                color: isInSidebar
                  ? templateStyle.colors.sidebarText
                  : templateStyle.colors.text,
              }}
              className="resume-content"
              {...rich(`@custom:${section.id}`)} dangerouslySetInnerHTML={stableHtml({ __html: customSectionData.content })}
            />
          </div>
        );

      case "organisations": {
        // Volunteering / organisations: role, organisation, dates, short description.
        const orgs = (resume.content.organisations || []) as Array<{
          name?: string;
          role?: string;
          startDate?: string;
          endDate?: string;
          current?: boolean;
          description?: string;
        }>;
        if (orgs.length === 0 && !canvas) return null;
        const textColor = isInSidebar ? templateStyle.colors.sidebarText : templateStyle.colors.text;
        return (
          <div data-section={section.id} style={{ position: "relative", marginBottom: templateStyle.sectionSpacing, ...sidebarStyle }}>
            {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
            {orgs.length === 0 ? (
              <div style={{ fontSize: `${templateStyle.fontSize.body}px`, color: textColor, fontStyle: "italic", opacity: 0.7 }}>
                Empty — click here, then use + to add one.
              </div>
            ) : null}
            {orgs.map((org, index) => {
              // Same MM/YYYY display and "Present" as experience (raw "2026-10" used to show).
              const dates = formatExperienceDateRange(org);
              return (
                <div key={index} data-item-index={index} style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ fontSize: `${templateStyle.fontSize.body + 1}px`, fontWeight: "bold", color: textColor }}>
                      {ed(`organisations.${index}.role`, org.role, "Role")}
                      {org.role && org.name ? ", " : null}
                      {org.name || revealEntry(section.id, index) ? (
                        <span style={{ fontWeight: "normal", color: templateStyle.colors.secondary }}>
                          {ed(`organisations.${index}.name`, org.name, "Organisation")}
                        </span>
                      ) : null}
                    </div>
                    {dates || revealEntry(section.id, index) ? (
                      <div style={{ fontSize: `${templateStyle.fontSize.small}px`, color: templateStyle.colors.secondary, whiteSpace: "nowrap" }}>
                        {edDate(`organisations.${index}`, dates)}
                      </div>
                    ) : null}
                  </div>
                  {hasText(org.description) || revealEntry(section.id, index) ? (
                    <div
                      className="resume-content"
                      style={{ fontSize: `${templateStyle.fontSize.body}px`, lineHeight: templateStyle.lineHeight, color: textColor }}
                      {...rich(`organisations.${index}.description`, "What you did there")}
                      dangerouslySetInnerHTML={stableHtml(formatExperienceDescriptionHtml(org.description))}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      }

      case "declaration":
        const declarationText = resume.content.declaration;
        if (!declarationText || declarationText.trim() === "") {
          if (!canvas) return null; // empty sections never reach the PDF
          return (
            <div data-section={section.id}
              style={{
                marginBottom: `${templateStyle.sectionSpacing}px`,
                ...sidebarStyle,
              }}
            >
              {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
              <div {...rich("declaration", "Your declaration")}
                style={{
                  fontSize: `${templateStyle.fontSize.body}px`,
                  color: isInSidebar
                    ? templateStyle.colors.sidebarText
                    : templateStyle.colors.text,
                  fontStyle: "italic",
                  opacity: 0.7,
                }}
              >
              </div>
            </div>
          );
        }

        return (
          <div data-section={section.id}
            style={{
              marginBottom: `${isInSidebar && templateStyle.headerStyle === "two-column"
                ? templateStyle.sectionSpacing * 2
                : templateStyle.sectionSpacing
                }px`,
              ...(isInSidebar &&
                templateStyle.headerStyle === "two-column" && {
                paddingTop: "15px",
                paddingBottom: "15px",
              }),
              ...sidebarStyle,
            }}
          >
            {renderSectionHeader(section.title, isInSidebar, section.type, section.id)}
            <div
              className="resume-content"
              style={{
                fontSize: `${templateStyle.fontSize.body}px`,
                color: isInSidebar
                  ? templateStyle.colors.sidebarText
                  : templateStyle.colors.text,
                lineHeight: "1.4",
              }}
              {...rich("declaration", "Your declaration")}
              dangerouslySetInnerHTML={stableHtml(declarationText)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const isAtlanticBlueTwoColumn =
    template.id === "atlantic-blue" && templateStyle.headerStyle === "two-column";

  return (
    <div
      className={`resume-content ${template.id}-template`}
      style={{
        width: "210mm",
        minHeight: "auto",
        padding: `${templateStyle.padding.top}mm ${templateStyle.padding.right}mm ${templateStyle.padding.bottom}mm ${templateStyle.padding.left}mm`,
        ...(isConfidentGrid
          ? ({
              ["--cg-pad-top" as string]: `${templateStyle.padding.top}mm`,
              ["--cg-pad-left" as string]: `${templateStyle.padding.left}mm`,
              ["--cg-pad-right" as string]: `${templateStyle.padding.right}mm`,
              ["--cg-pad-bottom" as string]: `${templateStyle.padding.bottom}mm`,
            } as React.CSSProperties)
          : {}),
        ...({
            ["--resume-heading-font-size" as string]: `${templateStyle.fontSize.heading}px`,
            ["--resume-subheading-font-size" as string]: `${templateStyle.fontSize.subheading}px`,
            ["--resume-section-header-font-size" as string]: `${templateStyle.sectionHeader.fontSize}px`,
            ["--resume-body-font-size" as string]: `${templateStyle.fontSize.body}px`,
            ["--resume-small-font-size" as string]: `${templateStyle.fontSize.small}px`,
            ["--resume-degree-font-size" as string]: `${templateStyle.fontSize.body + 1}px`,
          } as React.CSSProperties),
        backgroundColor: "white",
        color: templateStyle.colors.text,
        fontFamily: templateStyle.fontFamily,
        fontSize: `${templateStyle.fontSize.body}px`,
        lineHeight: templateStyle.lineHeight,
        margin: "0 auto",
        position: "relative",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .resume-content ul { list-style-type: disc !important; margin: 4px 0 8px 0 !important; padding-left: 24px !important; }
          .resume-content ol { list-style-type: decimal !important; margin: 4px 0 8px 0 !important; padding-left: 24px !important; }
          .resume-content li { margin-bottom: 2px !important; line-height: 1.4 !important; }
          .confident-grid-template .resume-content.confident-grid-description ul,
          .confident-grid-template .resume-content.confident-grid-project-description ul {
            list-style: none !important;
            list-style-type: none !important;
            padding-left: 0 !important;
            margin: 2px 0 0 0 !important;
          }
          .confident-grid-template .resume-content.confident-grid-description ul > li,
          .confident-grid-template .resume-content.confident-grid-project-description ul > li {
            display: flex !important;
            align-items: flex-start !important;
            gap: 0.35em !important;
            list-style: none !important;
            padding-left: 0 !important;
          }
          .confident-grid-template .resume-content.confident-grid-description ul > li::before,
          .confident-grid-template .resume-content.confident-grid-project-description ul > li::before {
            content: "-" !important;
            flex-shrink: 0 !important;
          }
          .confident-grid-template .resume-content.confident-grid-description li > p,
          .confident-grid-template .resume-content.confident-grid-project-description li > p {
            margin: 0 !important;
            flex: 1 !important;
            min-width: 0 !important;
          }
          .confident-grid-template .confident-grid-section-header,
          .confident-grid-template h2[data-section-header] {
            font-size: 12px !important;
            font-weight: 700 !important;
            font-family: Arial, Helvetica, sans-serif !important;
            color: #000000 !important;
            border-bottom: 1px solid #b9cad4 !important;
            border-top: none !important;
            padding-bottom: 4px !important;
            margin-bottom: 10px !important;
          }
          .confident-grid-template .confident-grid-header-section {
            background-color: #d8e5ec !important;
          }
          .confident-grid-template .confident-grid-name {
            font-size: 26px !important;
            font-weight: 700 !important;
            color: #000000 !important;
          }
          .confident-grid-template .confident-grid-job-title {
            font-size: 13px !important;
            font-weight: 400 !important;
            color: #000000 !important;
          }
          .confident-grid-template .confident-grid-job-title-exp,
          .confident-grid-template .confident-grid-degree,
          .confident-grid-template .confident-grid-project-title,
          .confident-grid-template .confident-grid-skill-name {
            font-weight: 700 !important;
            color: #000000 !important;
          }
          .confident-grid-template .confident-grid-company,
          .confident-grid-template .confident-grid-institution {
            font-weight: 400 !important;
            font-style: italic !important;
            color: #000000 !important;
          }
          .confident-grid-template .confident-grid-skill-item {
            font-weight: 400 !important;
            line-height: 1.5 !important;
          }
          .condensed-rule-template .resume-content.condensed-rule-description ul {
            list-style: none !important;
            padding-left: 0 !important;
            margin: 2px 0 0 0 !important;
          }
          .condensed-rule-template .resume-content.condensed-rule-description ul > li {
            display: flex !important;
            align-items: flex-start !important;
            gap: 0.35em !important;
            list-style: none !important;
            padding-left: 0 !important;
          }
          .condensed-rule-template .resume-content.condensed-rule-description ul > li::before {
            content: "-" !important;
            flex-shrink: 0 !important;
          }
          .condensed-rule-template .resume-content.condensed-rule-description li > p {
            margin: 0 !important;
            flex: 1 !important;
            min-width: 0 !important;
          }
          .condensed-rule-template .condensed-rule-company,
          .condensed-rule-template .condensed-rule-degree,
          .condensed-rule-template .condensed-rule-inline-label,
          .condensed-rule-template .condensed-rule-name {
            font-weight: 700 !important;
            color: #1a1a1a !important;
          }
          .condensed-rule-template .condensed-rule-section-header,
          .condensed-rule-template h2[data-section-header] {
            font-size: 11px !important;
            font-weight: 700 !important;
            font-style: normal !important;
            font-family: Calibri, "Segoe UI", Arial, sans-serif !important;
            text-transform: uppercase !important;
            letter-spacing: 0.6px !important;
            color: #1a1a1a !important;
            border-bottom: 1px solid #1a1a1a !important;
            border-top: none !important;
            padding-bottom: 3px !important;
            margin-bottom: 8px !important;
            margin-top: 12px !important;
          }
          .condensed-rule-template [data-section="profileSummary"] h2[data-section-header] {
            margin-top: 0 !important;
          }
          .condensed-rule-header-top {
            display: flex !important;
            flex-wrap: wrap !important;
            align-items: baseline !important;
            column-gap: 0.7em !important;
            row-gap: 0 !important;
            line-height: 1 !important;
          }
          .condensed-rule-header-top .condensed-rule-name,
          .condensed-rule-header-top .condensed-rule-job-title {
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1 !important;
          }
          .saffron-line-template .saffron-line-section-header,
          .saffron-line-template h2[data-section-header] {
            font-size: var(--resume-section-header-font-size, 12px) !important;
            font-weight: 700 !important;
            font-family: Georgia, 'Times New Roman', serif !important;
            text-transform: uppercase !important;
            letter-spacing: 0.6px !important;
            color: #2b2b2b !important;
            border-bottom: 2.5px solid #F0A23B !important;
            border-top: none !important;
            padding-bottom: 4px !important;
            margin-bottom: 10px !important;
            display: flex !important;
            align-items: center !important;
          }
          .saffron-line-template .saffron-line-section-header svg,
          .saffron-line-template h2[data-section-header] svg {
            color: #F0A23B !important;
            stroke: #F0A23B !important;
            width: 12px !important;
            height: 12px !important;
            margin-right: 6px !important;
            flex-shrink: 0 !important;
          }
          .saffron-line-template .saffron-line-name {
            font-size: var(--resume-heading-font-size, 28px) !important;
            font-weight: 700 !important;
            color: #2b2b2b !important;
          }
          .saffron-line-template .saffron-line-job-title {
            font-style: italic !important;
            font-size: var(--resume-subheading-font-size, 15px) !important;
            color: #2b2b2b !important;
            font-weight: 400 !important;
          }
          .saffron-line-template .saffron-line-header-top {
            display: flex !important;
            flex-wrap: wrap !important;
            align-items: baseline !important;
            gap: 0 12px !important;
            margin-bottom: 10px !important;
          }
          .saffron-line-template .saffron-line-header-top .saffron-line-name,
          .saffron-line-template .saffron-line-header-top .saffron-line-job-title {
            margin: 0 !important;
          }
          .saffron-line-template .saffron-line-header-section {
            margin-bottom: 30px !important;
          }
          .saffron-line-template .saffron-line-header-section::after {
            content: none !important;
            display: none !important;
          }
          .saffron-line-template .saffron-line-job-title-exp,
          .saffron-line-template .saffron-line-degree,
          .saffron-line-template .saffron-line-skill-category-name {
            font-weight: 700 !important;
            color: #2b2b2b !important;
          }
          .saffron-line-template .saffron-line-company,
          .saffron-line-template .saffron-line-institution {
            font-style: italic !important;
            color: #6a6a6a !important;
          }
          .saffron-line-template .saffron-line-job-date,
          .saffron-line-template .saffron-line-job-location,
          .saffron-line-template .saffron-line-education-date {
            color: #6a6a6a !important;
            font-weight: 400 !important;
          }
          .royal-indigo-template .royal-indigo-section-header,
          .royal-indigo-template h2[data-section-header] {
            font-size: 13px !important;
            font-weight: 700 !important;
            font-style: normal !important;
            font-family: Arial, Helvetica, sans-serif !important;
            text-transform: uppercase !important;
            letter-spacing: 0.6px !important;
            color: #5b3fa0 !important;
            border-top: 1px solid #cbb8e6 !important;
            border-bottom: none !important;
            padding-top: 8px !important;
            padding-bottom: 0 !important;
            margin-bottom: 6px !important;
            margin-top: 8px !important;
          }
          .royal-indigo-template [data-section]:not([data-section="personalInfo"]) {
            padding-top: 8px !important;
          }
          .royal-indigo-template .royal-indigo-name {
            font-size: 30px !important;
            font-weight: 700 !important;
            color: #5b3fa0 !important;
            text-transform: uppercase !important;
            text-align: center !important;
          }
          .royal-indigo-template .royal-indigo-job-header,
          .royal-indigo-template .royal-indigo-education-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .royal-indigo-template .royal-indigo-job-title-line,
          .royal-indigo-template .royal-indigo-education-title-line {
            flex: 1 !important;
            min-width: 0 !important;
          }
          .royal-indigo-template .royal-indigo-job-details-container,
          .royal-indigo-template .royal-indigo-education-details-container {
            flex-shrink: 0 !important;
            text-align: right !important;
            min-width: 108px !important;
            white-space: nowrap !important;
          }
          .royal-indigo-template .royal-indigo-job-date,
          .royal-indigo-template .royal-indigo-education-date {
            font-size: 11px !important;
            font-weight: 700 !important;
            color: #1f2937 !important;
          }
          .royal-indigo-template .royal-indigo-job-title-exp,
          .royal-indigo-template .royal-indigo-company,
          .royal-indigo-template .royal-indigo-degree {
            font-weight: 700 !important;
            color: #1f2937 !important;
          }
          .royal-indigo-template .royal-indigo-skill-label {
            font-weight: 700 !important;
            color: #1f2937 !important;
          }
          .royal-indigo-template .royal-indigo-skills-list ul {
            margin: 0 !important;
            padding-left: 18px !important;
            list-style-type: disc !important;
          }
          .resume-content a:not(.no-underline) { text-decoration: underline !important; color: inherit; }
          .resume-content a.no-underline { text-decoration: none !important; color: inherit; }
        `,
        }}
      />

      {headerSection && (
        <div data-section={headerSection.id}>
          {renderSectionContent(headerSection)}
        </div>
      )}

      {effectiveResumeLayout.type === "double" || templateStyle.headerStyle === "two-column" ? (
        <div
          data-resume-two-column-root=""
          className={
            isAtlanticBlueTwoColumn
              ? "atlantic-blue-two-column"
              : isSaffronLine
                ? "saffron-line-two-column"
                : isConfidentGrid
                  ? "confident-grid-two-column"
                  : undefined
          }
          style={
            isAtlanticBlueTwoColumn
              ? // The Style panel's column widths drive the sidebar (and its background band).
                ({ "--ab-sidebar-width-pct": `${effectiveResumeLayout.columnWidths?.left || 40}%` } as React.CSSProperties)
              : isSaffronLine || isConfidentGrid
                ? { display: "flex", alignItems: "flex-start" }
                : { display: "flex", minHeight: "270mm" }
          }
        >
          <div
            data-resume-left-column=""
            className={isAtlanticBlueTwoColumn ? "atlantic-blue-left-column" : undefined}
            style={
              isAtlanticBlueTwoColumn
                ? {
                    boxSizing: "border-box",
                    paddingTop: ATLANTIC_BLUE_INNER_PADDING_PX.vertical,
                    paddingBottom: ATLANTIC_BLUE_INNER_PADDING_PX.vertical,
                    paddingLeft: ATLANTIC_BLUE_INNER_PADDING_PX.outerEdge,
                    paddingRight: ATLANTIC_BLUE_INNER_PADDING_PX.seam,
                  }
                : isSaffronLine
                  ? {
                      width: `${effectiveResumeLayout.columnWidths?.left || 36}%`,
                      boxSizing: "border-box",
                    }
                  : isConfidentGrid
                    ? {
                        width: `${effectiveResumeLayout.columnWidths?.left || 50}%`,
                        boxSizing: "border-box",
                      }
                    : {
                    width: templateStyle.headerStyle === "two-column" ? `${resumeLayout.columnWidths?.left || 40}%` : `${resumeLayout.columnWidths?.left || 60}%`,
                    paddingRight: templateStyle.headerStyle === "two-column" ? "0" : "10px",
                    backgroundColor: templateStyle.headerStyle === "two-column" ? templateStyle.colors.sidebarBackground : "transparent",
                    minHeight: "100%",
                    ...(templateStyle.headerStyle === "two-column" && { padding: "40px" }),
                  }
            }
          >
            {leftColumn.map((section) => (
              <div key={section.id} data-section={section.id} className={`${template.id}-section`}>
                {renderSectionOrEmpty(section, "left")}
              </div>
            ))}
          </div>
          <div
            data-resume-right-column=""
            className={isAtlanticBlueTwoColumn ? "atlantic-blue-right-column" : undefined}
            style={
              isAtlanticBlueTwoColumn
                ? {
                    boxSizing: "border-box",
                    paddingTop: ATLANTIC_BLUE_INNER_PADDING_PX.vertical,
                    paddingBottom: ATLANTIC_BLUE_INNER_PADDING_PX.vertical,
                    paddingLeft: ATLANTIC_BLUE_INNER_PADDING_PX.seam,
                    paddingRight: ATLANTIC_BLUE_INNER_PADDING_PX.outerEdge,
                    width: `${100 - (effectiveResumeLayout.columnWidths?.left || 40)}%`,
                  }
                : isSaffronLine
                  ? {
                      width: `${effectiveResumeLayout.columnWidths?.right || 64}%`,
                      boxSizing: "border-box",
                    }
                  : isConfidentGrid
                    ? {
                        width: `${effectiveResumeLayout.columnWidths?.right || 50}%`,
                        boxSizing: "border-box",
                      }
                    : {
                    width: templateStyle.headerStyle === "two-column" ? `${resumeLayout.columnWidths?.right || 60}%` : `${resumeLayout.columnWidths?.right || 40}%`,
                    paddingLeft: templateStyle.headerStyle === "two-column" ? "0" : "10px",
                    ...(templateStyle.headerStyle === "two-column" && { padding: "40px" }),
                  }
            }
          >
            {rightColumn.map((section) => (
              <div key={section.id} data-section={section.id} className={`${template.id}-section`}>
                {renderSectionOrEmpty(section, "right")}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {leftColumn.map((section) => (
            <div key={section.id} data-section={section.id} className={`${template.id}-section`}>
              {renderSectionOrEmpty(section)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
