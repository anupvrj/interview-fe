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

import { formatExperienceDateRange } from "@/lib/resume-date-utils";
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

export function ResumeRenderer({
  resume,
  template,
  sections,
  layout,
  pageNumber = 1,
}: ResumeRendererProps) {
  const extendedTemplate = getExtendedTemplate(template);

  // --- V2 ENGINE ROUTER ---
  // If the template is Mercury (or configured to use ProfileHeaderLayout), use the new V2 engine.
  // This isolates Mercury from the legacy renderer to prevent regressions.

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
      if (resumeLayout.type === "single") {
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
    resumeLayout.type,
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

    // Generate template-specific class name for CSS styling
    const templateClassName = `${template.id}-section-header`;

    const baseStyle: React.CSSProperties = {
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
            {sectionType && templateStyle.headerStyle === "two-column" && (
              <>
                {React.createElement(getSectionIcon(sectionType), {
                  size: 16,
                  style: { marginRight: "8px", display: "inline" },
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
            style={{
              ...baseStyle,
              borderBottom: `${headerConfig.borderWidth || 1}px solid ${headerConfig.borderColor || "#000000"
                }`,
            }}
          >
            {sectionType && templateStyle.headerStyle === "two-column" && (
              <>
                {React.createElement(getSectionIcon(sectionType), {
                  size: 16,
                  style: { marginRight: "8px", display: "inline" },
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
            {sectionType && templateStyle.headerStyle === "two-column" && (
              <>
                {React.createElement(getSectionIcon(sectionType), {
                  size: 16,
                  style: { marginRight: "8px", display: "inline" },
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
            {sectionType && templateStyle.headerStyle === "two-column" && (
              <>
                {React.createElement(getSectionIcon(sectionType), {
                  size: 16,
                  style: { marginRight: "8px", display: "inline" },
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
            {sectionType && templateStyle.headerStyle === "two-column" && (
              <>
                {React.createElement(getSectionIcon(sectionType), {
                  size: 16,
                  style: { marginRight: "8px", display: "inline" },
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
    return (
      <div
        style={{
          fontSize: `${templateStyle.fontSize.small}px`,
          textAlign:
            templateStyle.headerStyle === "centered" ||
              resume.templateId === "classic"
              ? "center"
              : "left",
          color: textColor,
        }}
      >
        {contactItems.map((item, index) => (
          <span key={index}>
            {item.href ? (
              <a
                href={item.href}
                className="no-underline"
                style={{ textDecoration: "none", color: textColor }}
              >
                {item.value}
              </a>
            ) : (
              item.value
            )}
            {index < contactItems.length - 1 && " • "}
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
                    style={{
                      fontSize: `${templateStyle.fontSize.heading}px`,
                      fontWeight: "bold",
                      color: templateStyle.colors.sidebarText || "#ffffff",
                      margin: "0 0 4px 0",
                      ...(template.id === "atlantic-blue"
                        ? { fontFamily: "inherit" }
                        : {}),
                    }}
                  >
                    {personalInfoDisplayText(
                      personalInfo.fullName,
                      RESUME_DISPLAY_PLACEHOLDERS.fullName,
                    )}
                  </h1>
                <p
                    className={`${template.id}-job-title`}
                    style={{
                      fontSize:
                        template.id === "atlantic-blue"
                          ? "15px"
                          : `${templateStyle.fontSize.subheading}px`,
                      color: templateStyle.colors.sidebarText || "#ffffff",
                      margin: template.id === "atlantic-blue" ? "0" : "0 0 8px 0",
                      ...(template.id === "atlantic-blue"
                        ? { fontFamily: "inherit", fontStyle: "normal" }
                        : {}),
                    }}
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
                    style={{
                      fontSize: `${templateStyle.fontSize.heading}px`,
                      fontWeight: "bold",
                      // Use CSS classes for header colors if configured, otherwise use inline styles
                      ...(templateStyle.useCSSClassesForHeader
                        ? {}
                        : { color: templateStyle.colors.text }),
                      margin: "0",
                      fontFamily: templateStyle.fontFamily,
                      flexShrink: 0,
                    }}
                  >
                    {personalInfoDisplayText(
                      personalInfo.fullName,
                      RESUME_DISPLAY_PLACEHOLDERS.fullName,
                    )}
                  </h1>
                <p
                    className={`${template.id}-job-title`}
                    style={{
                      fontSize: `${templateStyle.fontSize.subheading}px`,
                      // Use CSS classes for header colors if configured, otherwise use inline styles
                      ...(templateStyle.useCSSClassesForHeader
                        ? {}
                        : { color: templateStyle.colors.text }),
                      margin: "0",
                      fontFamily: templateStyle.fontFamily,
                      fontStyle: "italic",
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
                    }}
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
            (template.id === "mercury" ? "#f5f5f5" : "transparent");

          return (
            <div
              className={`${template.id}-header-section`}
              style={{
                margin: 0,
                backgroundColor: headerBackground,
                padding: "40px 55px",
                display: "flex",
                alignItems: "flex-start",
                gap: "30px",
              }}
            >
              {/* Profile Picture on Left */}
              <div style={{ flexShrink: 0 }}>
                {personalInfo?.profilePicture ? (
                  <img
                    src={personalInfo.profilePicture}
                    alt="Profile"
                    className={`${template.id}-profile-picture`}
                    style={{
                      width: "160px",
                      height: "160px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "none",
                    }}
                  />
                ) : (
                  <div
                    className={`${template.id}-profile-placeholder`}
                    style={{
                      width: "160px",
                      height: "160px",
                      borderRadius: "50%",
                      backgroundColor: "#e0e0e0",
                    }}
                  />
                )}
              </div>

              {/* Name, Title, Contact on Right */}
              <div
                className={`${template.id}-header-content`}
                style={{ flex: 1, paddingTop: "10px" }}
              >
                <h1
                    className={`${template.id}-name`}
                    style={{
                      fontSize: `${templateStyle.fontSize.heading}px`,
                      fontWeight: "bold",
                      color: templateStyle.colors.text,
                      margin: "0 0 8px 0",
                      letterSpacing: "-0.5px",
                      fontFamily: templateStyle.fontFamily,
                    }}
                  >
                    {personalInfoDisplayText(
                      personalInfo.fullName,
                      RESUME_DISPLAY_PLACEHOLDERS.fullName,
                    )}
                  </h1>
                <p
                    className={`${template.id}-job-title`}
                    style={{
                      fontSize: `${templateStyle.fontSize.subheading}px`,
                      color: templateStyle.colors.secondary,
                      margin: "0 0 20px 0",
                      fontWeight: "normal",
                      fontFamily: templateStyle.fontFamily,
                    }}
                  >
                    {personalInfoDisplayText(
                      personalInfo.portfolio,
                      RESUME_DISPLAY_PLACEHOLDERS.portfolio,
                    )}
                  </p>
                {renderProfileHeaderContactInfo()}
                {renderProfileHeaderAdditionalInfo()}
                {renderProfileHeaderPassportDetails()}
              </div>
            </div>
          );
        }

        // Standard header style
        return (
          <div
            className={`${template.id}-header`}
            style={{ marginBottom: `${templateStyle.sectionSpacing}px` }}
          >
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
                    style={{
                      fontSize: `${templateStyle.fontSize.heading}px`,
                      fontWeight: "bold",
                      // Use CSS classes for header colors if configured, otherwise use inline styles
                      ...(templateStyle.useCSSClassesForHeader
                        ? {}
                        : {
                          color: isInSidebar
                            ? templateStyle.colors.sidebarText
                            : templateStyle.colors.text,
                        }),
                      margin: "0 0 4px 0",
                      fontFamily: templateStyle.fontFamily,
                    }}
                  >
                    {personalInfoDisplayText(
                      personalInfo.fullName,
                      RESUME_DISPLAY_PLACEHOLDERS.fullName,
                    )}
                  </h1>
                <p
                    className={`${template.id}-job-title`}
                    style={{
                      fontSize: `${templateStyle.fontSize.subheading}px`,
                      // Use CSS classes for header colors if configured, otherwise use inline styles
                      ...(templateStyle.useCSSClassesForHeader
                        ? {}
                        : { color: templateStyle.colors.secondary }),
                      margin: "0 0 6px 0",
                      fontFamily: templateStyle.fontFamily,
                      fontStyle: "italic",
                    }}
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
                lineHeight: templateStyle.lineHeight,
                color: isInSidebar
                  ? templateStyle.colors.sidebarText
                  : templateStyle.colors.text,
                fontFamily: templateStyle.fontFamily,
              }}
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
            <div>
              {experienceData.map((exp, index) => (
                <div
                  key={index}
                  data-item-id={exp.id || `exp-${index}`}
                  data-item-index={index}
                  className={`${template.id}-experience-item`}
                  style={{
                    marginBottom: "16px",
                    pageBreakInside: "auto", // Allow splitting for better pagination
                    // Only apply inline grid styles if NOT using table-cell layout via CSS
                    // Templates with table-cell layout should define it in their CSS files
                    ...(templateStyle.timelineLayout.type === "grid"
                      ? {
                        // Let CSS override if needed (table-cell templates will override via !important)
                        display: "grid",
                        gridTemplateColumns: `${templateStyle.timelineLayout.dateWidth || 140
                          }px 1fr`,
                        gap: "16px",
                      }
                      : { display: "block" }),
                  }}
                >
                  {templateStyle.timelineLayout.type === "grid" ? (
                    <>
                      <div
                        className={`${template.id}-date-location-column`}
                        style={{
                          fontSize: `${templateStyle.fontSize.small}px`,
                          color: templateStyle.colors.secondary,
                          fontFamily: templateStyle.fontFamily,
                        }}
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
                              : `${template.id}-job-title`
                          }
                          style={{
                            fontSize: `${templateStyle.fontSize.body + 1}px`,
                            fontWeight: "bold",
                            color: isInSidebar
                              ? templateStyle.colors.sidebarText
                              : templateStyle.colors.text,
                            marginBottom: "2px",
                          }}
                        >
                          {exp.position}
                        </div>
                        {exp.company && (
                          <div
                            className={`${template.id}-company`}
                            style={{
                              fontSize: `${templateStyle.fontSize.body}px`,
                              color: templateStyle.colors.secondary,
                              fontStyle: "italic",
                              marginBottom: "6px",
                            }}
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
                              __html: Array.isArray(exp.description)
                                ? exp.description
                                  .map((d: any) => `<p>${d}</p>`)
                                  .join("")
                                : exp.description || "",
                            }}
                          />
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className={`${template.id}-job-header`}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "4px",
                        }}
                      >
                        <div className={`${template.id}-job-title-container`}>
                          <div
                            className={`${template.id}-job-title-exp`}
                            style={{
                              fontSize: `${templateStyle.fontSize.body + 1}px`,
                              fontWeight: "bold",
                              color: isInSidebar
                                ? templateStyle.colors.sidebarText
                                : templateStyle.colors.text,
                            }}
                          >
                            {exp.position}
                          </div>
                          {exp.company && (
                            <div
                              className={`${template.id}-company`}
                              style={{
                                fontSize: `${templateStyle.fontSize.body}px`,
                                color: templateStyle.colors.secondary,
                                fontStyle: "italic",
                              }}
                            >
                              {exp.company}
                            </div>
                          )}
                        </div>
                        <div
                          className={`${template.id}-job-details-container`}
                          style={{
                            fontSize: `${templateStyle.fontSize.small}px`,
                            color: templateStyle.colors.secondary,
                            textAlign: "right",
                            minWidth: "120px",
                          }}
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
                          style={{
                            fontSize: `${templateStyle.fontSize.body}px`,
                            lineHeight: templateStyle.lineHeight,
                            color: isInSidebar
                              ? templateStyle.colors.sidebarText
                              : templateStyle.colors.text,
                            marginTop: "8px",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: Array.isArray(exp.description)
                              ? exp.description
                                .map((d: any) => `<p>${d}</p>`)
                                .join("")
                              : exp.description || "",
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
            <div>
              {educationData.map((edu, index) => (
                <div
                  key={index}
                  data-item-id={edu.id || `edu-${index}`}
                  data-item-index={index}
                  className={`${template.id}-education-item`}
                  style={{
                    marginBottom: "16px",
                    pageBreakInside: "auto", // Allow splitting for better pagination
                    // Only apply inline grid styles if using grid layout
                    // Templates with table-cell layout should define it in their CSS files
                    ...(templateStyle.timelineLayout.type === "grid"
                      ? {
                        // Let CSS override if needed (table-cell templates will override via !important)
                        display: "grid",
                        gridTemplateColumns: `${templateStyle.timelineLayout.dateWidth || 140
                          }px 1fr`,
                        gap: "16px",
                      }
                      : { display: "block" }),
                  }}
                >
                  {templateStyle.timelineLayout.type === "grid" ? (
                    <>
                      <div
                        className={`${template.id}-education-date-location`}
                        style={{
                          fontSize: `${templateStyle.fontSize.small}px`,
                          color: templateStyle.colors.secondary,
                        }}
                      >
                        {edu.startDate} - {edu.endDate}
                      </div>
                      <div className={`${template.id}-education-content`}>
                        <div
                          className={`${template.id}-degree`}
                          style={{
                            fontSize: `${templateStyle.fontSize.body + 1}px`,
                            fontWeight: "bold",
                            color: isInSidebar
                              ? templateStyle.colors.sidebarText
                              : templateStyle.colors.text,
                          }}
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
                            style={{
                              fontSize: `${templateStyle.fontSize.body}px`,
                              color: templateStyle.colors.secondary,
                              fontStyle: "italic",
                            }}
                          >
                            {edu.institution}
                          </div>
                        )}
                        {edu.location && (
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
                  ) : (
                    <>
                      <div
                        className={`${template.id}-education-header`}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          className={`${template.id}-education-title-container`}
                        >
                          <div
                            className={`${template.id}-degree`}
                            style={{
                              fontSize: `${templateStyle.fontSize.body + 1}px`,
                              fontWeight: "bold",
                              color: isInSidebar
                                ? templateStyle.colors.sidebarText
                                : templateStyle.colors.text,
                            }}
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
                              style={{
                                fontSize: `${templateStyle.fontSize.body}px`,
                                color: templateStyle.colors.secondary,
                                fontStyle: "italic",
                              }}
                            >
                              {edu.institution}
                            </div>
                          )}
                        </div>
                        <div
                          className={`${template.id}-education-details-container`}
                          style={{
                            fontSize: `${templateStyle.fontSize.small}px`,
                            color: templateStyle.colors.secondary,
                            textAlign: "right",
                          }}
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
          if (!skillsData) return null;
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
              style={{
                fontSize: `${templateStyle.fontSize.body}px`,
                lineHeight: templateStyle.lineHeight,
                color: isInSidebar
                  ? templateStyle.colors.sidebarText
                  : templateStyle.colors.text,
              }}
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
                        style={{
                          display: "grid",
                          gridTemplateColumns: `repeat(${numColumns}, 1fr)`,
                          gap: "8px 20px",
                          fontFamily: templateStyle.fontFamily,
                        }}
                      >
                        {columns.map((column, colIndex) => (
                          <div key={colIndex}>
                            {column.map((item, itemIndex) => (
                              <div
                                key={`${colIndex}-${itemIndex}`}
                                data-item-id={`skill-bullet-${colIndex}-${itemIndex}`}
                                data-item-index={colIndex * (Math.ceil(uniqueItems.length / numColumns)) + itemIndex}
                                className={`${template.id}-skill-item`}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "8px",
                                  marginBottom: "4px",
                                  fontSize: `${templateStyle.fontSize.body}px`,
                                }}
                              >
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        ))}
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
                  style={{
                    marginBottom: "16px",
                    pageBreakInside: "auto", // Allow splitting for better pagination
                  }}
                >
                  <div
                    style={{
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
                    }}
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
                      className="resume-content"
                      style={{
                        fontSize: `${templateStyle.fontSize.body}px`,
                        lineHeight: templateStyle.lineHeight,
                        color: isInSidebar
                          ? templateStyle.colors.sidebarText
                          : templateStyle.colors.text,
                        marginBottom: "4px",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: Array.isArray(project.description)
                          ? project.description
                            .map((d) => `<p>${d}</p>`)
                            .join("")
                          : project.description || "",
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
        const interestsData: string | string[] = resume.content.interests || "";

        // Check if it's empty (string or array)
        const isEmpty =
          !interestsData ||
          (Array.isArray(interestsData) && interestsData.length === 0) ||
          (typeof interestsData === "string" && !interestsData.trim()) ||
          (typeof interestsData === "string" &&
            interestsData.trim() === "<p></p>");

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
              {typeof interestsData === "string" ? (
                <div
                  className="resume-content"
                  dangerouslySetInnerHTML={{ __html: interestsData }}
                />
              ) : (
                (interestsData as string[]).join(", ")
              )}
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

      {resumeLayout.type === "double" || templateStyle.headerStyle === "two-column" ? (
        <div
          data-resume-two-column-root=""
          className={isAtlanticBlueTwoColumn ? "atlantic-blue-two-column" : undefined}
          style={
            isAtlanticBlueTwoColumn
              ? undefined
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
