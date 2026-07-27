/**
 * Configuration-Driven Resume Renderer
 * Renders resumes based purely on template configuration without hardcoded template logic
 */

"use client";

import React, { useRef, useMemo } from "react";
import { Resume, ResumeTemplate } from "@/lib/api";
import { ATLANTIC_BLUE_INNER_PADDING_PX } from "@/configs/resume-templates/atlantic-blue/column-insets";
import { mergeLayoutPaddingWithTemplateStyle } from "@/lib/resume-page-dimensions";
import { getExtendedTemplate } from "@/lib/templateConfigs";
import { isListedInTemplateColumnAssignment } from "@/lib/sectionColumnUtils";
import { getTemplateStyle, TemplateStyleConfig } from "@/lib/templateRenderer";
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
} from "@/lib/resume-date-utils";
import {
  RESUME_DISPLAY_PLACEHOLDERS,
  normalizePersonalInfoRecord,
  personalInfoDisplayText,
} from "@/lib/resume-data-import";

interface PageBreak {
  pageNumber: number;
  sections: string[];
}

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

function renderCondensedRuleLabeledInlineList(
  items: { label: string; value: string }[],
  className: string,
): React.ReactNode {
  const filtered = items.filter((item) => item.label.trim());
  if (filtered.length === 0) return null;

  return (
    <div className={className}>
      {filtered.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {index > 0 && (
            <span className="condensed-rule-inline-separator"> | </span>
          )}
          <span className="condensed-rule-inline-label">{item.label}:</span>{" "}
          {item.value}
        </span>
      ))}
    </div>
  );
}

function renderCondensedRuleInlineList(
  items: string[],
  className: string,
): React.ReactNode {
  const filtered = items.map((item) => item.trim()).filter(Boolean);
  if (filtered.length === 0) return null;

  return (
    <div className={className}>
      {filtered.map((item, index) => (
        <span key={`${item}-${index}`}>
          {index > 0 && (
            <span className="condensed-rule-inline-separator"> | </span>
          )}
          {item}
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

export function ResumeRenderer({
  resume,
  template,
  sections,
  layout,
  pageNumber = 1,
}: ResumeRendererProps) {
  const extendedTemplate = getExtendedTemplate(template);

  const baseTemplateStyle = getTemplateStyle(extendedTemplate);
  const resumeLayout = layout || resume.layout || { type: "single" };
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
    const organizeIntoColumns = () => {
      if (effectiveResumeLayout.type === "single") {
        // Check if template uses profile picture header layout
        if (
          templateStyle.headerLayout?.type === "with-profile-picture" ||
          template.id === "mercury"
        ) {
          const headerSection = visibleSections.find(
            (s) => s.type === "personalInfo",
          );
          const bodySections = visibleSections.filter(
            (s) => s.type !== "personalInfo",
          );

          return {
            headerSection,
            leftColumn: bodySections,
            rightColumn: [],
          };
        }

        return {
          headerSection: null,
          leftColumn: visibleSections,
          rightColumn: [],
        };
      }

      // For two-column layouts, organize based on template style
      const headerSection =
        templateStyle.headerStyle === "two-column"
          ? null
          : visibleSections.find((s) => s.type === "personalInfo");

      const bodySections =
        templateStyle.headerStyle === "two-column"
          ? visibleSections
          : visibleSections.filter((s) => s.type !== "personalInfo");

      const leftColumn: Section[] = [];
      const rightColumn: Section[] = [];

      const extendedTemplate = getExtendedTemplate(template);
      const columnAssignment = extendedTemplate?.rendering?.layout?.columnAssignment;

      // Track position for alternating distribution (for Atlantic Blue)
      let nonPersonalInfoIndex = 0;

      bodySections.forEach((section, index) => {
        // Saffron Line: always follow template column assignment (education on left, etc.)
        if (
          isSaffronLine &&
          columnAssignment &&
          (columnAssignment.left?.length > 0 || columnAssignment.right?.length > 0)
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

        // Saved column from editor reordering takes precedence
        if (section.column === "left" || section.column === "right") {
          if (section.column === "left") {
            leftColumn.push(section);
          } else {
            rightColumn.push(section);
          }
          return;
        }

        // Template defaults by section id/type
        if (columnAssignment && (columnAssignment.left?.length > 0 || columnAssignment.right?.length > 0)) {
          if (isListedInTemplateColumnAssignment(columnAssignment.left, section)) {
            leftColumn.push(section);
            return;
          }
          if (isListedInTemplateColumnAssignment(columnAssignment.right, section)) {
            rightColumn.push(section);
            return;
          }
          // Default unassigned sections to the left column (main body)
          leftColumn.push(section);
          return;
        }

        // Dynamic flowing distribution when no explicit assignment exists
        if (templateStyle.headerStyle === "two-column") {
          // Atlantic Blue: Keep only personalInfo fixed in left column, rest flow evenly
          if (section.type === "personalInfo") {
            // PersonalInfo always goes to left column (sidebar)
            leftColumn.push(section);
          } else {
            // All other sections alternate evenly: 1→right, 2→left, 3→right, 4→left, etc.
            // Start with right column (index 0 → right, index 1 → left, etc.)
            if (nonPersonalInfoIndex % 2 === 0) {
              rightColumn.push(section);
            } else {
              leftColumn.push(section);
            }
            nonPersonalInfoIndex++;
          }
        } else {
          // Standard templates: True alternating distribution
          // 1→left, 2→right, 3→left, 4→right, etc.
          if (index % 2 === 0) {
            leftColumn.push(section);
          } else {
            rightColumn.push(section);
          }
        }
      });

      return { headerSection, leftColumn, rightColumn };
    };

    return organizeIntoColumns();
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
            {headerConfig.textTransform === "uppercase"
              ? headerTitle.toUpperCase()
              : headerTitle}
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
            {headerConfig.textTransform === "uppercase"
              ? headerTitle.toUpperCase()
              : headerTitle}
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
            {headerConfig.textTransform === "uppercase"
              ? headerTitle.toUpperCase()
              : headerTitle}
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
            {headerConfig.textTransform === "uppercase"
              ? headerTitle.toUpperCase()
              : headerTitle}
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
            {headerConfig.textTransform === "uppercase"
              ? headerTitle.toUpperCase()
              : headerTitle}
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
        style={{
          marginTop: "12px",
          fontSize: `${templateStyle.fontSize.small}px`,
          lineHeight: "1.4",
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
        href: personalInfo.linkedin?.startsWith("http")
          ? personalInfo.linkedin
          : `https://linkedin.com/in/${personalInfo.linkedin}`,
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
        href: personalInfo.website?.startsWith("http")
          ? personalInfo.website
          : `https://${personalInfo.website}`,
      },
    ].filter((item) => item.value);

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
                >
                  <IconComponent size={13} style={{ flexShrink: 0 }} />
                  <span>{item.value}</span>
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
                  alignItems: "center",
                  gap: "6px",
                  color: textColor,
                }}
              >
                <IconComponent size={16} style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: `${templateStyle.fontSize.small}px`,
                    fontFamily: templateStyle.fontFamily,
                    color: textColor,
                  }}
                >
                  {item.value}
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
                {item.value}
              </a>
            ) : (
              item.value
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
                {item.value}
              </a>
            ) : (
              item.value
            )}
            {index < contactItems.length - 1 && contactSeparator}
          </span>
        ))}
      </div>
    );
  };

  // Render section content based on type and template configuration
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
                    {personalInfoDisplayText(
                      personalInfo.fullName,
                      RESUME_DISPLAY_PLACEHOLDERS.fullName,
                    )}
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
                    {personalInfoDisplayText(
                      personalInfo.portfolio,
                      RESUME_DISPLAY_PLACEHOLDERS.portfolio,
                    )}
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
                    style={
                      template.id === "atlantic-blue"
                        ? undefined
                        : { borderRadius: "50%", backgroundColor: "#e5e7eb" }
                    }
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
            const websiteValue =
              personalInfo.website || personalInfo.linkedin || "";
            const labeledRows: {
              label: string;
              value?: string;
              href?: string;
            }[] = [
              { label: "Address:", value: personalInfo.location },
              { label: "Phone:", value: personalInfo.phone },
              {
                label: "Email:",
                value: personalInfo.email,
                href: personalInfo.email
                  ? `mailto:${personalInfo.email}`
                  : undefined,
              },
              {
                label: "Website:",
                value: websiteValue,
                href: websiteValue
                  ? websiteValue.startsWith("http")
                    ? websiteValue
                    : `https://${websiteValue.replace(/^\/\//, "")}`
                  : undefined,
              },
            ].filter((row) => row.value);

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
                        {row.value}
                      </a>
                    ) : (
                      <span className={`${template.id}-contact-value`}>
                        {row.value}
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
          ].filter((item) => item.value);

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
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <IconComponent size={12} />
                        <span
                          style={{
                            fontSize: `${templateStyle.fontSize.small}px`,
                            fontFamily: templateStyle.fontFamily,
                          }}
                        >
                          {item.value}
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
                    {personalInfoDisplayText(
                      personalInfo.fullName,
                      RESUME_DISPLAY_PLACEHOLDERS.fullName,
                    )}
                  </h1>
                  <span className={`${template.id}-job-title`}>
                    {personalInfoDisplayText(
                      personalInfo.portfolio,
                      RESUME_DISPLAY_PLACEHOLDERS.portfolio,
                    )}
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
                    {personalInfoDisplayText(
                      personalInfo.fullName,
                      RESUME_DISPLAY_PLACEHOLDERS.fullName,
                    )}
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
                    {personalInfoDisplayText(
                      personalInfo.portfolio,
                      RESUME_DISPLAY_PLACEHOLDERS.portfolio,
                    )}
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
                margin: 0,
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
                    style={
                      isSaffronLine || isConfidentGrid
                        ? undefined
                        : {
                            width: "160px",
                            height: "160px",
                            borderRadius: "50%",
                            backgroundColor: "#e0e0e0",
                          }
                    }
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
                      {personalInfoDisplayText(
                        personalInfo.fullName,
                        RESUME_DISPLAY_PLACEHOLDERS.fullName,
                      )}
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
                      {personalInfoDisplayText(
                        personalInfo.portfolio,
                        RESUME_DISPLAY_PLACEHOLDERS.portfolio,
                      )}
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
                    {personalInfoDisplayText(
                      personalInfo.fullName,
                      RESUME_DISPLAY_PLACEHOLDERS.fullName,
                    )}
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
                    {personalInfoDisplayText(
                      personalInfo.portfolio,
                      RESUME_DISPLAY_PLACEHOLDERS.portfolio,
                    )}
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
                {personalInfoDisplayText(
                  personalInfo.fullName,
                  RESUME_DISPLAY_PLACEHOLDERS.fullName,
                )}
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
                    {personalInfoDisplayText(
                      personalInfo.fullName,
                      RESUME_DISPLAY_PLACEHOLDERS.fullName,
                    )}
                  </h1>
                  <p className={`${template.id}-job-title`}>
                    {personalInfoDisplayText(
                      personalInfo.portfolio,
                      RESUME_DISPLAY_PLACEHOLDERS.portfolio,
                    )}
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
                    {personalInfoDisplayText(
                      personalInfo.fullName,
                      RESUME_DISPLAY_PLACEHOLDERS.fullName,
                    )}
                  </h1>
                <p
                    className={`${template.id}-job-title`}
                    style={mergeHeaderJobTitleStyle(
                      { margin: "0 0 6px 0" },
                      templateStyle.colors.secondary,
                    )}
                  >
                    {personalInfoDisplayText(
                      personalInfo.portfolio,
                      RESUME_DISPLAY_PLACEHOLDERS.portfolio,
                    )}
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
          // Show placeholder instead of null to help with debugging
          return (
            <div
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
              >
                {RESUME_DISPLAY_PLACEHOLDERS.profileSummary}
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
              dangerouslySetInnerHTML={{ __html: profileContent }}
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
            <div
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
                          {formatExperienceDateRange(exp)}
                        </span>
                        {exp.location && (
                          <div className={`${template.id}-location`}>
                            {exp.location}
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
                          {exp.position}
                        </div>
                        {exp.company && (
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
                            {exp.company}
                          </div>
                        )}
                        {exp.description && (
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
                            dangerouslySetInnerHTML={{
                              __html: formatExperienceDescriptionHtml(exp.description),
                            }}
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
                          {exp.position && (
                            <span className={`${template.id}-job-title-exp`}>
                              {exp.position}
                            </span>
                          )}
                          {exp.company && (
                            <>
                              {exp.position && (
                                <span className={`${template.id}-title-separator`}>
                                  ,{" "}
                                </span>
                              )}
                              <span className={`${template.id}-company`}>
                                {exp.company}
                              </span>
                            </>
                          )}
                        </div>
                        <div className={`${template.id}-job-details-container`}>
                          <div className={`${template.id}-job-date`}>
                            {formatRoyalIndigoDateRange(exp)}
                          </div>
                        </div>
                      </div>
                      {exp.description && (
                        <div
                          data-item-id={`${exp.id || `exp-${index}`}-body`}
                          className={`resume-content ${template.id}-description`}
                          dangerouslySetInnerHTML={{
                            __html: formatExperienceDescriptionHtml(
                              exp.description,
                            ),
                          }}
                        />
                      )}
                    </>
                  ) : isCondensedRule ? (
                    <>
                      <div className={`${template.id}-job-header`}>
                        <div className={`${template.id}-job-title-line`}>
                          {exp.company && (
                            <span className={`${template.id}-company`}>
                              {exp.company}
                            </span>
                          )}
                          {exp.position && (
                            <>
                              {exp.company && (
                                <span className={`${template.id}-title-separator`}>
                                  ,{" "}
                                </span>
                              )}
                              <span className={`${template.id}-job-title-exp`}>
                                {exp.position}
                              </span>
                            </>
                          )}
                        </div>
                        <div className={`${template.id}-job-details-container`}>
                          <div className={`${template.id}-job-date`}>
                            {formatExperienceDateRange(exp)}
                          </div>
                          {exp.location && (
                            <div className={`${template.id}-job-location`}>
                              {exp.location}
                            </div>
                          )}
                        </div>
                      </div>
                      {exp.description && (
                        <div
                          className={`resume-content ${template.id}-description`}
                          dangerouslySetInnerHTML={{
                            __html: formatExperienceDescriptionHtml(
                              exp.description,
                            ),
                          }}
                        />
                      )}
                    </>
                  ) : isConfidentGrid ? (
                    <>
                      <div className={`${template.id}-job-title-line`}>
                        <span className={`${template.id}-job-title-exp`}>
                          {exp.position}
                        </span>
                        {exp.company && (
                          <>
                            <span className={`${template.id}-title-separator`}>
                              ,{" "}
                            </span>
                            <span className={`${template.id}-company`}>
                              {exp.company}
                            </span>
                          </>
                        )}
                      </div>
                      {(formatExperienceDateRange(exp) || exp.location) && (
                        <div className={`${template.id}-job-meta-line`}>
                          {[formatExperienceDateRange(exp), exp.location]
                            .filter(Boolean)
                            .join(" | ")}
                        </div>
                      )}
                      {exp.description && (
                        <div
                          className={`resume-content ${template.id}-description`}
                          dangerouslySetInnerHTML={{
                            __html: formatExperienceDescriptionHtml(
                              exp.description,
                            ),
                          }}
                        />
                      )}
                    </>
                  ) : isMeridian ? (
                    <>
                      <div className={`${template.id}-job-header`}>
                        <div className={`${template.id}-job-title-container`}>
                          <div className={`${template.id}-job-title-line`}>
                            {exp.position && (
                              <span className={`${template.id}-job-title-exp`}>
                                {exp.position}
                              </span>
                            )}
                            {exp.company && (
                              <>
                                {exp.position && (
                                  <span className={`${template.id}-title-separator`}>
                                    {" "}
                                    |{" "}
                                  </span>
                                )}
                                <span className={`${template.id}-company`}>
                                  {exp.company}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className={`${template.id}-job-details-container`}>
                          <div className={`${template.id}-job-date`}>
                            {formatExperienceDateRange(exp)}
                          </div>
                        </div>
                      </div>
                      {exp.description && (
                        <div
                          className={`resume-content ${template.id}-description`}
                          dangerouslySetInnerHTML={{
                            __html: formatExperienceDescriptionHtml(
                              exp.description,
                            ),
                          }}
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
                            {exp.position}
                          </div>
                          {exp.company && (
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
                              {exp.company}
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
                            {formatExperienceDateRange(exp)}
                          </div>
                          {exp.location && (
                            <div className={`${template.id}-location`}>
                              {exp.location}
                            </div>
                          )}
                        </div>
                      </div>
                      {exp.description && (
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
                          dangerouslySetInnerHTML={{
                            __html: formatExperienceDescriptionHtml(exp.description),
                          }}
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
        // Skip rendering common default/placeholder field values (e.g. from old dummy data or AI)
        const isDefaultEducationField = (field: string | undefined) => {
          if (!field || !field.trim()) return true;
          const v = field.trim().toLowerCase();
          return (
            v === "computer science" ||
            v === "computer science & engineering" ||
            v === "computer science and engineering" ||
            v === "business administration"
          );
        };
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
                          {formatResumeDateForDisplay(String(edu.startDate ?? ""))}
                          {edu.startDate || edu.endDate ? " - " : ""}
                          {formatResumeDateForDisplay(String(edu.endDate ?? ""))}
                        </span>
                        {edu.location && (
                          <div className={`${template.id}-education-location`}>
                            {edu.location}
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
                          {edu.degree}
                          {edu.degree &&
                            edu.field &&
                            !isDefaultEducationField(edu.field) && (
                              <span style={{ fontWeight: "normal" }}>
                                {" "}
                                in {edu.field}
                              </span>
                            )}
                          {edu.gpa && (
                            <span style={{ fontWeight: "normal" }}>
                              {" "}
                              (CGPA: {edu.gpa})
                            </span>
                          )}
                          {edu.percentage && (
                            <span style={{ fontWeight: "normal" }}>
                              {" "}
                              (Percentage: {edu.percentage})
                            </span>
                          )}
                        </div>
                        {edu.institution && (
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
                            {edu.institution}
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
                            {edu.location}
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
                          {edu.degree && (
                            <span className={`${template.id}-degree`}>
                              {edu.degree}
                            </span>
                          )}
                        </div>
                        <div className={`${template.id}-education-details-container`}>
                          {formatRoyalIndigoDateRange(edu) && (
                            <div className={`${template.id}-education-date`}>
                              {formatRoyalIndigoDateRange(edu)}
                            </div>
                          )}
                        </div>
                      </div>
                      {edu.institution && (
                        <div className={`${template.id}-institution`}>
                          {edu.institution}
                        </div>
                      )}
                      {edu.description && (
                        <div
                          data-item-id={`${edu.id || `edu-${index}`}-body`}
                          className={`resume-content ${template.id}-description`}
                          dangerouslySetInnerHTML={{
                            __html: formatExperienceDescriptionHtml(edu.description),
                          }}
                        />
                      )}
                    </>
                  ) : isCondensedRule ? (
                    <>
                      <div className={`${template.id}-education-header`}>
                        <div className={`${template.id}-education-title-line`}>
                          {edu.degree && (
                            <span className={`${template.id}-degree`}>
                              {edu.degree}
                            </span>
                          )}
                          {edu.institution && (
                            <>
                              {edu.degree && (
                                <span className={`${template.id}-title-separator`}>
                                  ,{" "}
                                </span>
                              )}
                              <span className={`${template.id}-institution`}>
                                {edu.institution}
                              </span>
                            </>
                          )}
                        </div>
                        <div className={`${template.id}-education-details-container`}>
                          {(edu.startDate || edu.endDate) && (
                            <div className={`${template.id}-education-date`}>
                              {formatResumeDateForDisplay(String(edu.startDate ?? ""))}
                              {edu.startDate || edu.endDate ? " – " : ""}
                              {formatResumeDateForDisplay(String(edu.endDate ?? ""))}
                            </div>
                          )}
                          {edu.location && (
                            <div className={`${template.id}-education-location`}>
                              {edu.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : isConfidentGrid ? (
                    <>
                      <div className={`${template.id}-education-title-line`}>
                        {edu.institution && (
                          <span className={`${template.id}-degree`}>
                            {edu.institution}
                          </span>
                        )}
                        {edu.degree && (
                          <>
                            {edu.institution && (
                              <span className={`${template.id}-title-separator`}>
                                ,{" "}
                              </span>
                            )}
                            <span className={`${template.id}-institution`}>
                              {edu.degree}
                            </span>
                          </>
                        )}
                      </div>
                      {(edu.startDate ||
                        edu.endDate ||
                        edu.location ||
                        (edu.field && !isDefaultEducationField(edu.field))) && (
                        <div className={`${template.id}-education-meta-line`}>
                          {[
                            edu.startDate || edu.endDate
                              ? `${formatResumeDateForDisplay(String(edu.startDate ?? ""))}${edu.startDate || edu.endDate ? " - " : ""}${formatResumeDateForDisplay(String(edu.endDate ?? ""))}`
                              : "",
                            edu.location,
                            edu.field && !isDefaultEducationField(edu.field)
                              ? edu.field
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" | ")}
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
                            {edu.degree}
                            {edu.degree &&
                              edu.field &&
                              !isDefaultEducationField(edu.field) && (
                                <span style={{ fontWeight: "normal" }}>
                                  {" "}
                                  in {edu.field}
                                </span>
                              )}
                            {edu.gpa && (
                              <span style={{ fontWeight: "normal" }}>
                                {" "}
                                (CGPA: {edu.gpa})
                              </span>
                            )}
                            {edu.percentage && (
                              <span style={{ fontWeight: "normal" }}>
                                {" "}
                                (Percentage: {edu.percentage})
                              </span>
                            )}
                          </div>
                          {edu.institution && (
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
                              {edu.institution}
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
                            {edu.startDate} - {edu.endDate}
                          </div>
                          {edu.location && (
                            <div
                              className={`${template.id}-education-location`}
                            >
                              {edu.location}
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

        // Executive template: Get from sections array
        if (resume.templateId === "executive") {
          const skillsSection = (resume.content as any).sections?.find(
            (s: any) => s.type === "skills",
          );
          skillItems = skillsSection?.items || [];
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
            const additionalItems: { label: string; value: string }[] = [];

            if (skillList.length > 0) {
              additionalItems.push({
                label: "Technical Skills",
                value: skillList.join(", "),
              });
            }
            if (languageText) {
              additionalItems.push({ label: "Languages", value: languageText });
            }
            if (certificateText) {
              additionalItems.push({
                label: "Certifications",
                value: certificateText,
              });
            }
            awardsData.forEach((award: {
              title?: string;
              issuer?: string;
              description?: string;
            }) => {
              const value =
                award.description?.trim() ||
                [award.title, award.issuer].filter(Boolean).join(", ");
              if (value) {
                additionalItems.push({ label: "Awards/Activities", value });
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
                        {item.value}
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

            if (professionalSkills.length === 0 && technicalSkills.length === 0) {
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
                <div className={`${template.id}-skills-dual`}>
                  {professionalSkills.length > 0 && (
                    <div className={`${template.id}-skills-dual-column`}>
                      <div className={`${template.id}-skills-dual-header`}>
                        Professional Skills
                      </div>
                      {renderSkillColumn(professionalSkills, 0)}
                    </div>
                  )}
                  {technicalSkills.length > 0 && (
                    <div className={`${template.id}-skills-dual-column`}>
                      <div className={`${template.id}-skills-dual-header`}>
                        Technical Skills
                      </div>
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
          <div
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
              {resume.templateId === "executive" ? (
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
                          {project.name && (
                            <span className={`${template.id}-company`}>{project.name}</span>
                          )}
                          {tech && (
                            <>
                              {project.name && (
                                <span className={`${template.id}-title-separator`}>, </span>
                              )}
                              <span className={`${template.id}-project-subtitle`}>{tech}</span>
                            </>
                          )}
                        </div>
                        {formatProjectDates(project) && (
                          <div className={`${template.id}-job-details-container`}>
                            <div className={`${template.id}-job-date`}>
                              {formatProjectDates(project)}
                            </div>
                          </div>
                        )}
                      </div>
                      {project.description && (
                        <div
                          data-item-id={`${itemId}-body`}
                          className={`resume-content ${template.id}-description`}
                          dangerouslySetInnerHTML={{
                            __html: formatExperienceDescriptionHtml(project.description),
                          }}
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
                            {project.name}
                          </div>
                        </div>
                        {dateText && (
                          <div className={`${template.id}-job-details-container`}>
                            <div className={`${template.id}-job-date`}>
                              {dateText}
                            </div>
                          </div>
                        )}
                      </div>
                      {project.description && (
                        <div
                          className={`resume-content ${template.id}-description`}
                          dangerouslySetInnerHTML={{
                            __html: formatExperienceDescriptionHtml(
                              project.description,
                            ),
                          }}
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
                    <span>{project.name}</span>
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
                  {(project.startDate || project.endDate) && (
                    <div
                      style={{
                        fontSize: `${templateStyle.fontSize.small}px`,
                        color: templateStyle.colors.secondary,
                        marginBottom: "4px",
                      }}
                    >
                      {[project.startDate, project.endDate]
                        .filter(Boolean)
                        .join(" – ")}
                    </div>
                  )}
                  {project.description && (
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
                      dangerouslySetInnerHTML={{
                        __html: formatExperienceDescriptionHtml(project.description),
                      }}
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
                          Technologies: {tech}
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
            <div
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
          return (
            <div
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
                No languages added. Add your language skills in the editor.
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
                      {item.label}:
                    </span>{" "}
                    <span className={`${template.id}-skill-category-value`}>
                      {item.value}
                    </span>
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
                        : lang.name || String(lang)}
                    </span>
                    {typeof lang === "object" &&
                      (lang.proficiency || lang.level) &&
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
        if (isRoyalIndigo || isCondensedRule) return null;

        // Handle both executive (sections array) and other templates (direct awards array)
        let awardsData: any[] = [];

        if (resume.templateId === "executive") {
          const awardsSection = (resume.content as any).sections?.find(
            (s: any) => s.type === "awards",
          );
          awardsData = awardsSection?.items || resume.content.awards || [];
        } else {
          awardsData = resume.content.awards || [];
        }

        if (awardsData.length === 0) return null;

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
                      {award.title && (
                        <span className={`${template.id}-award-title`}>
                          {award.title}.
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
          <div
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
                    {award.title}
                  </div>
                  {award.issuer && (
                    <div
                      className={`${template.id}-award-organization`}
                      style={{
                        fontSize: `${templateStyle.fontSize.small}px`,
                        color: isInSidebar
                          ? templateStyle.colors.sidebarText || "#ffffff"
                          : templateStyle.colors.secondary,
                      }}
                    >
                      {award.issuer}
                      {award.date && `, ${award.date}`}
                    </div>
                  )}
                  {award.description && (
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
                      dangerouslySetInnerHTML={{
                        __html: award.description,
                      }}
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
          return (
            <div style={{ marginBottom: templateStyle.sectionSpacing }}>
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
                No certificates added. Add your certifications in the editor.
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
                    {cert.title}
                  </div>
                  <div
                    style={{
                      fontSize: `${templateStyle.fontSize.small}px`,
                      color: templateStyle.colors.secondary,
                      marginBottom: "4px",
                    }}
                  >
                    {cert.issuer}
                    {cert.issueDate && ` • ${cert.issueDate}`}
                    {cert.expiryDate && ` - ${cert.expiryDate}`}
                  </div>
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
            return (
              <div style={{ marginBottom: templateStyle.sectionSpacing }}>
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
                  No achievements added. Add your achievements in the editor.
                </div>
              </div>
            );
          }

          return (
            <div style={{ marginBottom: templateStyle.sectionSpacing }}>
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
                dangerouslySetInnerHTML={{ __html: achievementsString }}
              />
            </div>
          );
        }

        // Handle array format
        if (Array.isArray(achievementsData) && achievementsData.length === 0) {
          return (
            <div style={{ marginBottom: templateStyle.sectionSpacing }}>
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
                No achievements added. Add your achievements in the editor.
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
                    {achievement.title ||
                      achievement.description ||
                      achievement}
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

          const languagesData = Array.isArray(resume.content.languages)
            ? resume.content.languages
            : [];
          const languageText = languagesData
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

          const certificatesData = resume.content.certificates || [];
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
            additionalItems.push({
              label: "Certifications",
              value: certificateText,
            });
          } else if (interestsText) {
            additionalItems.push({
              label: "Certifications",
              value: interestsText,
            });
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
          return (
            <div style={{ marginBottom: templateStyle.sectionSpacing }}>
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
                No interests added. Add your interests in the editor.
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
                  dangerouslySetInnerHTML={{ __html: interestsRaw }}
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
          return (
            <div
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
                No courses added. Add your courses in the editor.
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
                <div key={index} data-item-id={course.id || `course-${index}`} style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      fontWeight: "600",
                      fontSize: `${templateStyle.fontSize.body}px`,
                      color: isInSidebar
                        ? templateStyle.colors.sidebarText
                        : templateStyle.colors.text,
                    }}
                  >
                    {course.title || course.name}
                  </div>
                  {(course.institution || course.provider) && (
                    <div
                      style={{
                        fontSize: `${templateStyle.fontSize.small}px`,
                        color: isInSidebar
                          ? templateStyle.colors.sidebarText
                          : templateStyle.colors.secondary,
                        marginTop: "2px",
                      }}
                    >
                      {course.institution || course.provider}
                      {course.date && ` • ${course.date}`}
                    </div>
                  )}
                  {course.description && (
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
                      dangerouslySetInnerHTML={{ __html: course.description }}
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
          return (
            <div
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
                No publications added. Add your publications in the editor.
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
                    {pub.title}
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
                    {pub.publisher}
                    {pub.date && ` • ${pub.date}`}
                  </div>
                  {pub.link && (
                    <div
                      style={{
                        fontSize: `${templateStyle.fontSize.body}px`,
                        color: templateStyle.colors.accent,
                        textDecoration: "none",
                      }}
                    >
                      {pub.link}
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
          return (
            <div
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
                No references added. Add your references in the editor.
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
                <div key={index} style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      fontWeight: "600",
                      fontSize: `${templateStyle.fontSize.body}px`,
                      color: isInSidebar
                        ? templateStyle.colors.sidebarText
                        : templateStyle.colors.text,
                    }}
                  >
                    {ref.name}
                  </div>
                  <div
                    style={{
                      fontSize: `${templateStyle.fontSize.body}px`,
                      color: isInSidebar
                        ? templateStyle.colors.sidebarText
                        : templateStyle.colors.text,
                    }}
                  >
                    {ref.position}
                    {ref.company && ` at ${ref.company}`}
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
              dangerouslySetInnerHTML={{ __html: customSectionData.content }}
            />
          </div>
        );

      case "declaration":
        const declarationText = resume.content.declaration;
        if (!declarationText || declarationText.trim() === "") {
          return (
            <div
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
                No declaration added. Add your declaration in the editor.
              </div>
            </div>
          );
        }

        return (
          <div
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
              dangerouslySetInnerHTML={{ __html: declarationText }}
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
          .confident-grid-template .resume-content.confident-grid-description li,
          .confident-grid-template .resume-content.confident-grid-project-description li {
            display: flex !important;
            align-items: flex-start !important;
            gap: 0.35em !important;
            list-style: none !important;
            padding-left: 0 !important;
          }
          .confident-grid-template .resume-content.confident-grid-description li::before,
          .confident-grid-template .resume-content.confident-grid-project-description li::before {
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
          .condensed-rule-template .resume-content.condensed-rule-description li {
            display: flex !important;
            align-items: flex-start !important;
            gap: 0.35em !important;
            list-style: none !important;
            padding-left: 0 !important;
          }
          .condensed-rule-template .resume-content.condensed-rule-description li::before {
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
              ? undefined
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
                    width: templateStyle.headerStyle === "two-column" ? "40%" : `${resumeLayout.columnWidths?.left || 60}%`,
                    paddingRight: templateStyle.headerStyle === "two-column" ? "0" : "10px",
                    backgroundColor: templateStyle.headerStyle === "two-column" ? templateStyle.colors.sidebarBackground : "transparent",
                    minHeight: "100%",
                    ...(templateStyle.headerStyle === "two-column" && { padding: "40px" }),
                  }
            }
          >
            {leftColumn.map((section) => (
              <div key={section.id} data-section={section.id} className={`${template.id}-section`}>
                {renderSectionContent(section, "left")}
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
                    width: templateStyle.headerStyle === "two-column" ? "60%" : `${resumeLayout.columnWidths?.right || 40}%`,
                    paddingLeft: templateStyle.headerStyle === "two-column" ? "0" : "10px",
                    ...(templateStyle.headerStyle === "two-column" && { padding: "40px" }),
                  }
            }
          >
            {rightColumn.map((section) => (
              <div key={section.id} data-section={section.id} className={`${template.id}-section`}>
                {renderSectionContent(section, "right")}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {leftColumn.map((section) => (
            <div key={section.id} data-section={section.id} className={`${template.id}-section`}>
              {renderSectionContent(section)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
