/**
 * Configuration-Driven Resume Renderer
 * Renders resumes based purely on template configuration without hardcoded template logic
 */

"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { Resume, ResumeTemplate } from "@/lib/api";
import { getExtendedTemplate } from "@/lib/templateConfigs";
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
} from "lucide-react";

interface Section {
  id: string;
  type: string;
  title: string;
  visible: boolean;
  column?: "left" | "right";
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
}

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
}: ResumeRendererProps) {
  const extendedTemplate = getExtendedTemplate(template);
  const baseTemplateStyle = getTemplateStyle(extendedTemplate);
  const resumeLayout = layout || resume.layout || { type: "single" };

  // Merge custom layout padding into template style
  const templateStyle = {
    ...baseTemplateStyle,
    padding: resumeLayout.padding || baseTemplateStyle.padding,
  };

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

  const displaySections = useMemo(
    () => (sections && sections.length > 0 ? sections : getDefaultSections()),
    [sections, extendedTemplate.defaultSectionOrder]
  );

  const visibleSections = useMemo(
    () => displaySections.filter((s) => s.visible),
    [displaySections]
  );

  // Page break state removed - using useMemo instead
  const measureRef = useRef<HTMLDivElement>(null);
  const visibleContainerRef = useRef<HTMLDivElement>(null);

  // Simple single page approach - let PDF handle page breaks naturally
  const pages = useMemo(() => {
    return [{ pageNumber: 1, sections: visibleSections.map((s) => s.id) }];
  }, [visibleSections]);

  // Organize sections into columns based on template configuration
  const organizeIntoColumns = () => {
    if (resumeLayout.type === "single") {
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

    bodySections.forEach((section, index) => {
      // Use explicit column assignment if available
      if (section.column === "left") {
        leftColumn.push(section);
      } else if (section.column === "right") {
        rightColumn.push(section);
      } else {
        // Dynamic flowing distribution: 1→left, 2→right, 3→left, 4→right, etc.
        // This ensures even distribution regardless of section types
        if (templateStyle.headerStyle === "two-column") {
          // Atlantic Blue: specific section distribution based on original design
          const leftColumnSections = [
            "personalInfo",
            "profileSummary",
            "languages",
            "awards",
            "certificates",
            "interests",
          ];

          if (leftColumnSections.includes(section.type)) {
            leftColumn.push(section);
          } else {
            // Right column: experience, education, skills, projects, etc.
            rightColumn.push(section);
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
      }
    });

    return { headerSection, leftColumn, rightColumn };
  };

  const { headerSection, leftColumn, rightColumn } = organizeIntoColumns();

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
    };
    return iconMap[sectionType] || FileText;
  };

  // Render section header based on template configuration
  const renderSectionHeader = (
    title: string,
    isInSidebar: boolean = false,
    sectionType?: string
  ) => {
    const headerConfig = templateStyle.sectionHeader;

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
            style={{
              ...baseStyle,
              borderTop: `${headerConfig.borderWidth || 2}px solid ${
                headerConfig.borderColor || "#000000"
              }`,
              borderBottom: `${headerConfig.borderWidth || 2}px solid ${
                headerConfig.borderColor || "#000000"
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
              ? title.toUpperCase()
              : title}
          </h2>
        );

      case "border-bottom":
        return (
          <h2
            style={{
              ...baseStyle,
              borderBottom: `${headerConfig.borderWidth || 1}px solid ${
                headerConfig.borderColor || "#000000"
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
              ? title.toUpperCase()
              : title}
          </h2>
        );

      case "background":
        return (
          <h2
            style={{
              ...baseStyle,
              // Don't apply background in sidebar for Atlantic Blue template
              backgroundColor: isInSidebar
                ? "rgba(255, 255, 255, 0.1)"
                : headerConfig.backgroundColor ||
                  templateStyle.colors.sectionHeaderBg ||
                  "#f0f0f0",
              padding: isInSidebar ? "8px 12px" : "8px 12px",
              borderRadius: isInSidebar ? "4px" : "4px",
              boxShadow: isInSidebar ? "0 2px 4px rgba(0, 0, 0, 0.2)" : "none",
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
              ? title.toUpperCase()
              : title}
          </h2>
        );

      case "underline":
        return (
          <h2
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
              ? title.toUpperCase()
              : title}
          </h2>
        );

      default:
        return (
          <h2 style={baseStyle}>
            {sectionType && templateStyle.headerStyle === "two-column" && (
              <>
                {React.createElement(getSectionIcon(sectionType), {
                  size: 16,
                  style: { marginRight: "8px", display: "inline" },
                })}
              </>
            )}
            {headerConfig.textTransform === "uppercase"
              ? title.toUpperCase()
              : title}
          </h2>
        );
    }
  };

  // Render contact information based on template configuration
  const renderContactInfo = () => {
    const personalInfo = resume.content.personalInfo;
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
        type: "website",
        value: personalInfo.website,
        icon: ExternalLink,
        href: personalInfo.website?.startsWith("http")
          ? personalInfo.website
          : `https://${personalInfo.website}`,
      },
    ].filter((item) => item.value);

    if (contactConfig.type === "icons") {
      return (
        <div
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
          }}
        >
          {contactItems.map((item, index) => {
            const IconComponent = item.icon;
            const content = (
              <div
                key={index}
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <IconComponent size={14} />
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
                key={index}
                href={item.href}
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
        }}
      >
        {contactItems.map((item, index) => (
          <span key={index}>
            {item.href ? (
              <a
                href={item.href}
                style={{ textDecoration: "none", color: "inherit" }}
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
    column?: "left" | "right"
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
          // Sidebar style for Atlantic Blue
          return (
            <div style={{ ...sidebarStyle }}>
              <div style={{ textAlign: "left", marginBottom: "12px" }}>
                {resume.content.personalInfo.fullName && (
                  <h1
                    style={{
                      fontSize: `${templateStyle.fontSize.heading}px`,
                      fontWeight: "bold",
                      color: templateStyle.colors.sidebarText || "#ffffff",
                      margin: "0 0 4px 0",
                    }}
                  >
                    {resume.content.personalInfo.fullName}
                  </h1>
                )}
                {resume.content.personalInfo.portfolio && (
                  <p
                    style={{
                      fontSize: `${templateStyle.fontSize.subheading}px`,
                      color: templateStyle.colors.sidebarText || "#ffffff",
                      margin: "0 0 20px 0",
                    }}
                  >
                    {resume.content.personalInfo.portfolio}
                  </p>
                )}
              </div>

              {/* Profile Picture for Atlantic Blue */}
              {resume.content.personalInfo.profilePicture && (
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <img
                    src={resume.content.personalInfo.profilePicture}
                    alt="Profile"
                    crossOrigin="anonymous"
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "3px solid #ffffff",
                    }}
                  />
                </div>
              )}

              {renderContactInfo()}
            </div>
          );
        }

        // Standard header style
        return (
          <div style={{ marginBottom: `${templateStyle.sectionSpacing}px` }}>
            <div
              style={{
                textAlign:
                  templateStyle.headerStyle === "centered" ||
                  resume.templateId === "classic"
                    ? "center"
                    : "left",
              }}
            >
              {resume.content.personalInfo.fullName && (
                <h1
                  style={{
                    fontSize: `${templateStyle.fontSize.heading}px`,
                    fontWeight: "bold",
                    color: isInSidebar
                      ? templateStyle.colors.sidebarText
                      : templateStyle.colors.text,
                    margin: "0 0 4px 0",
                    fontFamily: templateStyle.fontFamily,
                  }}
                >
                  {resume.content.personalInfo.fullName}
                </h1>
              )}
              {resume.content.personalInfo.portfolio && (
                <p
                  style={{
                    fontSize: `${templateStyle.fontSize.subheading}px`,
                    color: templateStyle.colors.secondary,
                    margin: "0 0 12px 0",
                    fontFamily: templateStyle.fontFamily,
                    fontStyle: "italic",
                  }}
                >
                  {resume.content.personalInfo.portfolio}
                </p>
              )}
              {renderContactInfo()}
            </div>
          </div>
        );

      case "profileSummary":
        const profileContent =
          resume.profileSummary ||
          (resume.content as any).profileSummary ||
          (resume.content as any).sections?.find(
            (s: any) => s.type === "profileSummary"
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
              {renderSectionHeader(section.title, isInSidebar, section.type)}
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
                No profile summary available. Add your profile summary in the
                editor.
              </div>
            </div>
          );
        }

        return (
          <div
            style={{
              marginBottom: `${
                isInSidebar && templateStyle.headerStyle === "two-column"
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
            {renderSectionHeader(section.title, isInSidebar, section.type)}
            <div
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
            (s: any) => s.type === "workExperience"
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
              {renderSectionHeader(section.title, isInSidebar, section.type)}
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
            style={{
              marginBottom: `${
                isInSidebar && templateStyle.headerStyle === "two-column"
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
            {renderSectionHeader(section.title, isInSidebar, section.type)}
            <div>
              {experienceData.map((exp, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "16px",
                    pageBreakInside: "auto", // Allow splitting for better pagination
                    display:
                      templateStyle.timelineLayout.type === "grid"
                        ? "grid"
                        : "block",
                    gridTemplateColumns:
                      templateStyle.timelineLayout.type === "grid"
                        ? `${
                            templateStyle.timelineLayout.dateWidth || 140
                          }px 1fr`
                        : undefined,
                    gap:
                      templateStyle.timelineLayout.type === "grid"
                        ? "16px"
                        : undefined,
                  }}
                >
                  {templateStyle.timelineLayout.type === "grid" ? (
                    <>
                      <div
                        style={{
                          fontSize: `${templateStyle.fontSize.small}px`,
                          color: templateStyle.colors.secondary,
                          fontFamily: templateStyle.fontFamily,
                        }}
                      >
                        {exp.startDate} - {exp.endDate || "Present"}
                        {exp.location && <div>{exp.location}</div>}
                      </div>
                      <div>
                        <div
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
                            style={{
                              fontSize: `${templateStyle.fontSize.body}px`,
                              lineHeight: templateStyle.lineHeight,
                              color: isInSidebar
                                ? templateStyle.colors.sidebarText
                                : templateStyle.colors.text,
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
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "4px",
                        }}
                      >
                        <div>
                          <div
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
                          style={{
                            fontSize: `${templateStyle.fontSize.small}px`,
                            color: templateStyle.colors.secondary,
                            textAlign: "right",
                            minWidth: "120px",
                          }}
                        >
                          {exp.startDate} - {exp.endDate || "Present"}
                          {exp.location && <div>{exp.location}</div>}
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

      case "education":
        // Handle both executive (sections array) and other templates (direct education array)
        let educationData: any[] = [];

        if (resume.templateId === "executive") {
          const eduSection = (resume.content as any).sections?.find(
            (s: any) => s.type === "education"
          );
          educationData = eduSection?.items || resume.content.education || [];
        } else {
          educationData = resume.content.education || [];
        }

        if (educationData.length === 0) return null;

        return (
          <div
            style={{
              marginBottom: `${
                isInSidebar && templateStyle.headerStyle === "two-column"
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
            {renderSectionHeader(section.title, isInSidebar, section.type)}
            <div>
              {educationData.map((edu, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "6px",
                    pageBreakInside: "auto", // Allow splitting for better pagination
                    display:
                      templateStyle.timelineLayout.type === "grid"
                        ? "grid"
                        : "block",
                    gridTemplateColumns:
                      templateStyle.timelineLayout.type === "grid"
                        ? `${
                            templateStyle.timelineLayout.dateWidth || 140
                          }px 1fr`
                        : undefined,
                    gap:
                      templateStyle.timelineLayout.type === "grid"
                        ? "16px"
                        : undefined,
                  }}
                >
                  {templateStyle.timelineLayout.type === "grid" ? (
                    <>
                      <div
                        style={{
                          fontSize: `${templateStyle.fontSize.small}px`,
                          color: templateStyle.colors.secondary,
                        }}
                      >
                        {edu.startDate} - {edu.endDate}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: `${templateStyle.fontSize.body + 1}px`,
                            fontWeight: "bold",
                            color: isInSidebar
                              ? templateStyle.colors.sidebarText
                              : templateStyle.colors.text,
                          }}
                        >
                          {edu.degree}
                          {edu.field && (
                            <span style={{ fontWeight: "normal" }}>
                              {" "}
                              in {edu.field}
                            </span>
                          )}
                        </div>
                        {edu.institution && (
                          <div
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
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: `${templateStyle.fontSize.body + 1}px`,
                              fontWeight: "bold",
                              color: isInSidebar
                                ? templateStyle.colors.sidebarText
                                : templateStyle.colors.text,
                            }}
                          >
                            {edu.degree}
                            {edu.field && (
                              <span style={{ fontWeight: "normal" }}>
                                {" "}
                                in {edu.field}
                              </span>
                            )}
                          </div>
                          {edu.institution && (
                            <div
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
                          style={{
                            fontSize: `${templateStyle.fontSize.small}px`,
                            color: templateStyle.colors.secondary,
                            textAlign: "right",
                            minWidth: "120px",
                          }}
                        >
                          {edu.startDate} - {edu.endDate}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "skills":
        // Handle both executive (sections array) and other templates (direct skills object)
        let skillsData: any = null;
        let skillItems: any[] = [];

        // Executive template: Get from sections array
        if (resume.templateId === "executive") {
          const skillsSection = (resume.content as any).sections?.find(
            (s: any) => s.type === "skills"
          );
          skillItems = skillsSection?.items || [];
        } else {
          // Other templates: Get from direct skills object
          skillsData = resume.content.skills;
          if (!skillsData) return null;
        }

        return (
          <div
            style={{
              marginBottom: `${
                isInSidebar && templateStyle.headerStyle === "two-column"
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
            {renderSectionHeader(section.title, isInSidebar, section.type)}
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
              ) : (
                // Other templates: Render as text/HTML
                <>
                  {typeof skillsData.technical === "string" ? (
                    <div
                      style={{
                        color: isInSidebar
                          ? templateStyle.colors.sidebarText
                          : templateStyle.colors.text,
                      }}
                      dangerouslySetInnerHTML={{ __html: skillsData.technical }}
                    />
                  ) : (
                    <div>
                      {skillsData.technical?.map(
                        (skill: any, index: number) => (
                          <span key={index}>
                            {skill}
                            {index < skillsData.technical.length - 1 && ", "}
                          </span>
                        )
                      )}
                    </div>
                  )}
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
            style={{
              marginBottom: `${
                isInSidebar && templateStyle.headerStyle === "two-column"
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
            {renderSectionHeader(section.title, isInSidebar, section.type)}
            <div>
              {projectsData.map((project, index) => (
                <div
                  key={index}
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
                      marginBottom: "4px",
                    }}
                  >
                    {project.name}
                  </div>
                  {project.description && (
                    <div
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
                  {project.technologies && project.technologies.length > 0 && (
                    <div
                      style={{
                        fontSize: `${templateStyle.fontSize.small}px`,
                        color: templateStyle.colors.secondary,
                        fontStyle: "italic",
                      }}
                    >
                      Technologies: {project.technologies.join(", ")}
                    </div>
                  )}
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
          (s: any) => s.type === "languages"
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
        // 3. Check skills.languages (old structure)
        else if (
          resume.content.skills?.languages &&
          Array.isArray(resume.content.skills.languages)
        ) {
          languagesData = resume.content.skills.languages;
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
              {renderSectionHeader(section.title, isInSidebar, section.type)}
              <div
                style={{
                  fontSize: `${templateStyle.fontSize.body}px`,
                  color: isInSidebar
                    ? templateStyle.colors.sidebarText
                    : templateStyle.colors.text,
                  lineHeight: "1.4",
                }}
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
              {renderSectionHeader(section.title, isInSidebar, section.type)}
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

        return (
          <div
            style={{
              marginBottom: `${
                isInSidebar && templateStyle.headerStyle === "two-column"
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
            {renderSectionHeader(section.title, isInSidebar, section.type)}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              {languagesData.map((lang, index) => (
                <div key={index} style={{ marginBottom: "6px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
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
                    {typeof lang === "object" && lang.proficiency && (
                      <div
                        style={{
                          display: "flex",
                          gap: "2px",
                          marginLeft: "6px",
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor:
                                level <= lang.proficiency
                                  ? isInSidebar
                                    ? templateStyle.colors.sidebarText || "#000"
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
            (s: any) => s.type === "awards"
          );
          awardsData = awardsSection?.items || resume.content.awards || [];
        } else {
          awardsData = resume.content.awards || [];
        }

        if (awardsData.length === 0) return null;

        return (
          <div
            style={{
              marginBottom: `${
                isInSidebar && templateStyle.headerStyle === "two-column"
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
            {renderSectionHeader(section.title, isInSidebar, section.type)}
            <div>
              {awardsData.map((award, index) => (
                <div key={index} style={{ marginBottom: "8px" }}>
                  <div
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
                      style={{
                        fontSize: `${templateStyle.fontSize.small}px`,
                        color: templateStyle.colors.secondary,
                      }}
                    >
                      {award.issuer} • {award.date}
                    </div>
                  )}
                  {award.description && (
                    <div
                      style={{
                        fontSize: `${templateStyle.fontSize.small}px`,
                        color: isInSidebar
                          ? templateStyle.colors.sidebarText
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
            (s: any) => s.type === "certifications"
          );
          certificatesData =
            certSection?.items || resume.content.certificates || [];
        } else {
          certificatesData = resume.content.certificates || [];
        }

        if (certificatesData.length === 0) {
          return (
            <div style={{ marginBottom: templateStyle.sectionSpacing }}>
              {renderSectionHeader(section.title, isInSidebar, section.type)}
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
          <div style={{ marginBottom: templateStyle.sectionSpacing }}>
            {renderSectionHeader(section.title, isInSidebar, section.type)}
            <div style={{ marginLeft: "0px" }}>
              {certificatesData.map((cert: any, index: number) => (
                <div key={index} style={{ marginBottom: "8px" }}>
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
                {renderSectionHeader(section.title, isInSidebar, section.type)}
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
              {renderSectionHeader(section.title, isInSidebar, section.type)}
              <div
                style={{
                  fontSize: `${templateStyle.fontSize.body}px`,
                  color: isInSidebar
                    ? templateStyle.colors.sidebarText
                    : templateStyle.colors.text,
                  lineHeight: "1.4",
                }}
                dangerouslySetInnerHTML={{ __html: achievementsString }}
              />
            </div>
          );
        }

        // Handle array format
        if (Array.isArray(achievementsData) && achievementsData.length === 0) {
          return (
            <div style={{ marginBottom: templateStyle.sectionSpacing }}>
              {renderSectionHeader(section.title, isInSidebar, section.type)}
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
            {renderSectionHeader(section.title, isInSidebar, section.type)}
            <div style={{ marginLeft: "0px" }}>
              {achievementsData.map((achievement: any, index: number) => (
                <div key={index} style={{ marginBottom: "8px" }}>
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
              {renderSectionHeader(section.title, isInSidebar, section.type)}
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
          <div style={{ marginBottom: templateStyle.sectionSpacing }}>
            {renderSectionHeader(section.title, isInSidebar, section.type)}
            <div
              style={{
                fontSize: `${templateStyle.fontSize.body}px`,
                color: templateStyle.colors.text,
                lineHeight: "1.4",
              }}
            >
              {typeof interestsData === "string" ? (
                <div dangerouslySetInnerHTML={{ __html: interestsData }} />
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
              {renderSectionHeader(section.title, isInSidebar, section.type)}
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
            style={{
              marginBottom: `${
                isInSidebar && templateStyle.headerStyle === "two-column"
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
            {renderSectionHeader(section.title, isInSidebar, section.type)}
            <div style={{ marginLeft: "0px" }}>
              {coursesData.map((course: any, index: number) => (
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
              {renderSectionHeader(section.title, isInSidebar, section.type)}
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
            style={{
              marginBottom: `${
                isInSidebar && templateStyle.headerStyle === "two-column"
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
            {renderSectionHeader(section.title, isInSidebar, section.type)}
            <div style={{ marginLeft: "0px" }}>
              {publicationsData.map((pub: any, index: number) => (
                <div key={index} style={{ marginBottom: "8px" }}>
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
              {renderSectionHeader(section.title, isInSidebar, section.type)}
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
            style={{
              marginBottom: `${
                isInSidebar && templateStyle.headerStyle === "two-column"
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
            {renderSectionHeader(section.title, isInSidebar, section.type)}
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
              {renderSectionHeader(section.title, isInSidebar, section.type)}
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
              marginBottom: `${
                isInSidebar && templateStyle.headerStyle === "two-column"
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
            {renderSectionHeader(section.title, isInSidebar, section.type)}
            <div
              style={{
                fontSize: `${templateStyle.fontSize.body}px`,
                color: isInSidebar
                  ? templateStyle.colors.sidebarText
                  : templateStyle.colors.text,
                lineHeight: "1.4",
              }}
            >
              {declarationText}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Calculate page styles
  const pageStyle: React.CSSProperties = {
    width: "210mm",
    minHeight: "297mm",
    backgroundColor: templateStyle.colors.background || "#ffffff",
    fontFamily: templateStyle.fontFamily,
    fontSize: `${templateStyle.fontSize.body}px`,
    lineHeight: templateStyle.lineHeight,
    color: templateStyle.colors.text,
    padding: `${templateStyle.padding.top}mm ${templateStyle.padding.right}mm ${templateStyle.padding.bottom}mm ${templateStyle.padding.left}mm`,
    boxSizing: "border-box",
    position: "relative",
  };

  // Render measurement container (hidden) - positioned outside zoom container
  const measurementContainer = (
    <div
      ref={measureRef}
      style={{
        position: "fixed",
        top: "-10000px",
        left: "-10000px",
        width: "210mm",
        minHeight: "297mm",
        visibility: "hidden",
        pointerEvents: "none",
        backgroundColor: templateStyle.colors.background,
        fontFamily: templateStyle.fontFamily,
        fontSize: `${templateStyle.fontSize.body}px`,
        lineHeight: templateStyle.lineHeight,
        color: templateStyle.colors.text,
        padding: `${templateStyle.padding.top}mm ${templateStyle.padding.right}mm ${templateStyle.padding.bottom}mm ${templateStyle.padding.left}mm`,
        zIndex: -9999,
        transform: "none", // Ensure no zoom scaling affects measurements
      }}
    >
      {/* Render all sections for measurement */}
      {headerSection && (
        <div data-section={headerSection.id}>
          {renderSectionContent(headerSection)}
        </div>
      )}

      {resumeLayout.type === "double" ? (
        <div style={{ display: "flex" }}>
          <div style={{ width: `${resumeLayout.columnWidths?.left || 60}%` }}>
            {leftColumn.map((section) => (
              <div key={section.id} data-section={section.id}>
                {renderSectionContent(section, "left")}
              </div>
            ))}
          </div>
          <div style={{ width: `${resumeLayout.columnWidths?.right || 40}%` }}>
            {rightColumn.map((section) => (
              <div key={section.id} data-section={section.id}>
                {renderSectionContent(section, "right")}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {leftColumn.map((section) => (
            <div key={section.id} data-section={section.id}>
              {renderSectionContent(section)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Add global styles for list rendering */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .resume-content ul, .resume-content ol {
            margin: 4px 0 8px 0 !important;
            padding-left: 20px !important;
          }
          
          .resume-content ul {
            list-style-type: disc !important;
          }
          
          .resume-content ol {
            list-style-type: decimal !important;
          }
          
          .resume-content li {
            margin-bottom: 2px !important;
            line-height: 1.4 !important;
            display: list-item !important;
          }
          
          .resume-content ul ul, .resume-content ol ol, .resume-content ul ol, .resume-content ol ul {
            margin: 2px 0 !important;
            padding-left: 18px !important;
          }
          
          .resume-content ul ul {
            list-style-type: circle !important;
          }
          
          .resume-content ul ul ul {
            list-style-type: square !important;
          }
          
          /* Clean page styling */
          
          /* Page break styles for PDF generation */
          @media print {
            @page {
              size: A4;
              margin: ${templateStyle.padding.top}mm ${templateStyle.padding.right}mm ${templateStyle.padding.bottom}mm ${templateStyle.padding.left}mm;
            }
            
            html, body {
              width: 210mm;
              height: 100%;
              margin: 0;
              padding: 0;
              overflow: visible;
            }

            .resume-page {
              width: 100% !important;
              min-height: 0 !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important; /* Reset padding to prevent overflow issues */
              overflow: visible !important;
              border: none !important;
              box-shadow: none !important;
              display: block !important;
              page-break-after: auto !important; /* Let content flow naturally */
              page-break-inside: auto !important;
            }
            
            /* Re-apply padding to a proper content wrapper if needed, or rely on template styles 
               But template styles are inline. We need to ensure they don't conflict.
               Actually, if we remove padding from .resume-page, content will hit edges.
               We should respect template padding. 
            */
             
            .resume-page {
               /* Resetting only problematic properties */
               min-height: auto !important;
               height: auto !important;
               overflow: visible !important;
               page-break-after: auto !important;
               page-break-inside: auto !important;
            }

            .resume-page:last-child {
              page-break-after: auto !important;
            }
            
            /* Remove visual page break lines in print */
            .resume-page::after {
              display: none;
            }
            
            .resume-content {
              background-image: none;
            }
            
            /* Allow sections to break naturally */
            [data-section] {
              page-break-inside: auto !important;
              break-inside: auto !important;
              page-break-before: auto !important;
              page-break-after: auto !important;
              display: block !important; /* Ensure block flow */
            }
            
            /* Allow lists to break */
            ul, ol, li {
                page-break-inside: auto !important;
                break-inside: auto !important;
            }
          }
            
            /* Allow natural page breaks for long content */
            .resume-content {
              page-break-inside: auto;
              break-inside: auto;
            }
            
            /* Keep section headers with content */
            h1, h2, h3 {
              page-break-after: avoid;
              break-after: avoid;
            }
            
            /* Prevent orphaned lines */
            p, li, div {
              orphans: 2;
              widows: 2;
            }
          }
        `,
        }}
      />

      {measurementContainer}
      <div
        ref={visibleContainerRef}
        className="resume-content"
        style={{
          marginBottom: pages.length > 1 ? "20px" : "0",
        }}
      >
        {pages.map((page, pageIndex) => (
          <div
            key={page.pageNumber}
            className="resume-page"
            style={{
              ...pageStyle,
              marginBottom: pageIndex < pages.length - 1 ? "20px" : "0",
            }}
          >
            {/* Header on first page */}
            {pageIndex === 0 && headerSection && (
              <div data-section={headerSection.id}>
                {renderSectionContent(headerSection)}
              </div>
            )}

            {/* Page content */}
            {resumeLayout.type === "double" ||
            templateStyle.headerStyle === "two-column" ? (
              <div
                style={{
                  display: "flex",
                  minHeight:
                    templateStyle.headerStyle === "two-column"
                      ? "297mm"
                      : "100%",
                }}
              >
                <div
                  style={{
                    width:
                      templateStyle.headerStyle === "two-column"
                        ? "40%"
                        : `${resumeLayout.columnWidths?.left || 60}%`,
                    paddingRight:
                      templateStyle.headerStyle === "two-column" ? "0" : "10px",
                    backgroundColor:
                      templateStyle.headerStyle === "two-column"
                        ? templateStyle.colors.sidebarBackground
                        : "transparent",
                    minHeight: "100%",
                    ...(templateStyle.headerStyle === "two-column" && {
                      padding: "40px",
                    }),
                  }}
                >
                  {leftColumn
                    .filter((section) => page.sections.includes(section.id))
                    .map((section) => (
                      <div key={section.id} data-section={section.id}>
                        {renderSectionContent(section, "left")}
                      </div>
                    ))}
                </div>
                <div
                  style={{
                    width:
                      templateStyle.headerStyle === "two-column"
                        ? "60%"
                        : `${resumeLayout.columnWidths?.right || 40}%`,
                    paddingLeft:
                      templateStyle.headerStyle === "two-column" ? "0" : "10px",
                    ...(templateStyle.headerStyle === "two-column" && {
                      padding: "40px",
                    }),
                  }}
                >
                  {rightColumn
                    .filter((section) => page.sections.includes(section.id))
                    .map((section) => (
                      <div key={section.id} data-section={section.id}>
                        {renderSectionContent(section, "right")}
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <>
                {leftColumn
                  .filter((section) => page.sections.includes(section.id))
                  .map((section) => (
                    <div key={section.id} data-section={section.id}>
                      {renderSectionContent(section)}
                    </div>
                  ))}
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
