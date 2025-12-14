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
  Github,
} from "lucide-react";

// Profile Picture Image Component with forced re-render on URL change
// Handles S3 presigned URLs correctly by preserving their signature
const ProfilePictureImage = ({
  src,
  alt,
  style,
}: {
  src: string;
  alt: string;
  style: React.CSSProperties;
}) => {
  const [imageKey, setImageKey] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const previousSrcRef = useRef<string>("");
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Force re-render when src changes
  useEffect(() => {
    if (src && src !== previousSrcRef.current) {
      previousSrcRef.current = src;
      setRetryCount(0);
      // Force image reload by updating key
      setImageKey((prev) => prev + 1);

      // Clear any pending retries
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    }
  }, [src]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;

    // For S3 presigned URLs, retry after a delay (image might still be uploading)
    if (target && src && src.includes("X-Amz-Signature") && retryCount < 3) {
      const delay = (retryCount + 1) * 2000; // 2s, 4s, 6s
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setImageKey((prev) => prev + 1); // Force reload by changing key
      }, delay);
    } else if (target && src && !src.includes("X-Amz-Signature")) {
      // For non-presigned URLs, retry immediately with cache-busting
      const separator = src.includes("?") ? "&" : "?";
      target.src = `${src}${separator}_retry=${Date.now()}`;
    }
  };

  // Check if this is an S3 presigned URL (don't add cache-busting to preserve signature)
  const isPresignedUrl = useMemo(() => {
    return (
      src &&
      (src.includes("X-Amz-Signature") ||
        src.includes("s3.amazonaws.com") ||
        src.includes("amazonaws.com"))
    );
  }, [src]);

  // Show placeholder if no src
  if (!src || src.trim() === "") {
    return (
      <div
        style={{
          ...style,
          backgroundColor: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#9ca3af",
          fontSize: "24px",
        }}
      >
        👤
      </div>
    );
  }

  // For S3 presigned URLs, don't modify the URL - just use key prop to force re-render
  // For other URLs, add cache-busting if needed
  const finalSrc = useMemo(() => {
    if (isPresignedUrl) {
      // Don't modify presigned URLs - they're already signed with specific parameters
      return src;
    }
    // For non-presigned URLs, add cache-busting
    const separator = src.includes("?") ? "&" : "?";
    return `${src}${separator}_v=${imageKey}`;
  }, [src, imageKey, isPresignedUrl]);

  return (
    <img
      ref={imageRef}
      key={`profile-img-${src}-${imageKey}-${retryCount}`}
      src={finalSrc}
      alt={alt}
      crossOrigin="anonymous"
      style={style}
      onError={handleError}
    />
  );
};

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

    // Track position for alternating distribution (for Atlantic Blue)
    let nonPersonalInfoIndex = 0;

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
      custom: FileText,
      spacer: FileText,
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
              padding: isInSidebar
                ? "8px 12px"
                : `${headerConfig.paddingTop || "8px"} ${
                    headerConfig.paddingRight || "12px"
                  } ${headerConfig.paddingBottom || "8px"} ${
                    headerConfig.paddingLeft || "12px"
                  }`,
              borderRadius:
                headerConfig.borderRadius !== undefined
                  ? `${headerConfig.borderRadius}px`
                  : isInSidebar
                  ? "4px"
                  : "0px",
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

  // Render additional personal information fields
  const renderAdditionalPersonalInfo = (isInSidebar: boolean = false) => {
    const personalInfo = resume.content.personalInfo;
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
                      margin: "0 0 8px 0",
                    }}
                  >
                    {resume.content.personalInfo.portfolio}
                  </p>
                )}
                {resume.content.personalInfo.yearsOfExperience && (
                  <p
                    style={{
                      fontSize: `${templateStyle.fontSize.subheading}px`,
                      color: templateStyle.colors.sidebarText || "#ffffff",
                      margin: "0 0 20px 0",
                    }}
                  >
                    Experience: {resume.content.personalInfo.yearsOfExperience}
                  </p>
                )}
              </div>

              {/* Profile Picture for Atlantic Blue */}
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                {resume.content.personalInfo?.profilePicture ? (
                  <ProfilePictureImage
                    src={resume.content.personalInfo.profilePicture}
                    alt="Profile"
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "3px solid #ffffff",
                    }}
                  />
                ) : (
                  <svg
                    width="120"
                    height="120"
                    viewBox="0 0 120 120"
                    style={{
                      borderRadius: "50%",
                      backgroundColor: "#e5e7eb",
                    }}
                  >
                    <circle cx="60" cy="45" r="20" fill="#9ca3af" />
                    <ellipse cx="60" cy="95" rx="30" ry="25" fill="#9ca3af" />
                  </svg>
                )}
              </div>

              {renderContactInfo()}
              {renderAdditionalPersonalInfo(true)}
            </div>
          );
        }

        // Mercury template header - special layout with profile picture on left
        if (resume.templateId === "mercury") {
          const headerBackground =
            templateStyle.colors.headerBackground || "#f5f5f5";
          const paddingLeft = templateStyle.padding?.left || 20;
          const paddingRight = templateStyle.padding?.right || 20;

          // Render contact info for Mercury (two per line)
          const renderMercuryContactInfo = () => {
            const personalInfo = resume.content.personalInfo;
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
                          style={{ textDecoration: "none", color: "inherit" }}
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

          // Render additional personal info for Mercury (two per line)
          const renderMercuryAdditionalInfo = () => {
            const personalInfo = resume.content.personalInfo;
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
                        <span style={{ fontWeight: "bold" }}>
                          {field.label}
                        </span>
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

          // Render passport details for Mercury (two per line)
          const renderMercuryPassportDetails = () => {
            const personalInfo = resume.content.personalInfo;
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
                        <span style={{ fontWeight: "bold" }}>
                          {field.label}
                        </span>{" "}
                        - {field.value}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          };

          // Placeholder avatar when no profile picture
          const renderPlaceholderAvatar = () => (
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              style={{
                borderRadius: "50%",
                backgroundColor: "#e5e7eb",
              }}
            >
              <circle cx="60" cy="45" r="20" fill="#9ca3af" />
              <ellipse cx="60" cy="95" rx="30" ry="25" fill="#9ca3af" />
            </svg>
          );

          return (
            <div
              style={{
                marginBottom: `${templateStyle.sectionSpacing}px`,
                marginLeft: `-${paddingLeft}mm`,
                marginRight: `-${paddingRight}mm`,
                marginTop: `-${templateStyle.padding?.top || 20}mm`,
                backgroundColor: headerBackground,
                padding: `32px ${paddingLeft}mm`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                {/* Profile Picture on Left */}
                <div style={{ flexShrink: 0 }}>
                  {resume.content.personalInfo?.profilePicture ? (
                    <ProfilePictureImage
                      src={resume.content.personalInfo.profilePicture}
                      alt="Profile"
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #e5e7eb",
                      }}
                    />
                  ) : (
                    renderPlaceholderAvatar()
                  )}
                </div>

                {/* Name, Title, Contact on Right */}
                <div style={{ flex: 1 }}>
                  {resume.content.personalInfo.fullName && (
                    <h1
                      style={{
                        fontSize: `${templateStyle.fontSize.heading}px`,
                        fontWeight: "bold",
                        color: templateStyle.colors.text,
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
                        margin: "0 0 4px 0",
                        fontFamily: templateStyle.fontFamily,
                      }}
                    >
                      {resume.content.personalInfo.portfolio}
                    </p>
                  )}
                  {resume.content.personalInfo.yearsOfExperience && (
                    <p
                      style={{
                        fontSize: `${templateStyle.fontSize.subheading}px`,
                        color: templateStyle.colors.secondary,
                        margin: "0 0 4px 0",
                        fontFamily: templateStyle.fontFamily,
                      }}
                    >
                      <span style={{ fontWeight: "bold" }}>Experience:</span>{" "}
                      {resume.content.personalInfo.yearsOfExperience}
                    </p>
                  )}
                  {renderMercuryContactInfo()}
                  {renderMercuryAdditionalInfo()}
                  {renderMercuryPassportDetails()}
                </div>
              </div>
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
                    margin: "0 0 6px 0",
                    fontFamily: templateStyle.fontFamily,
                    fontStyle: "italic",
                  }}
                >
                  {resume.content.personalInfo.portfolio}
                </p>
              )}
              {resume.content.personalInfo.yearsOfExperience && (
                <p
                  style={{
                    fontSize: `${templateStyle.fontSize.subheading}px`,
                    color: templateStyle.colors.secondary,
                    margin: "0 0 12px 0",
                    fontFamily: templateStyle.fontFamily,
                    fontStyle: "italic",
                  }}
                >
                  Experience: {resume.content.personalInfo.yearsOfExperience}
                </p>
              )}
              {renderContactInfo()}
              {renderAdditionalPersonalInfo(isInSidebar)}
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
                            className="resume-content mercury-experience-content"
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
          // Other templates: Get from direct skills field (new structure: single field)
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
              ) : resume.templateId === "mercury" ? (
                // Mercury template: 3-column layout with circular bullets
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
                          "text/html"
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
                          typeof skill === "string" ? skill : String(skill)
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

                    // Distribute items into 3 columns using round-robin
                    const columns: string[][] = [[], [], []];
                    uniqueItems.forEach((item, index) => {
                      const columnIndex = index % 3;
                      columns[columnIndex].push(item);
                    });

                    return (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "8px 16px",
                          fontFamily: templateStyle.fontFamily, // Arial, Calibri for Mercury
                        }}
                      >
                        {columns.map((column, colIndex) => (
                          <div key={colIndex}>
                            {column.map((item, itemIndex) => (
                              <div
                                key={`${colIndex}-${itemIndex}`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  marginBottom: "4px",
                                  fontSize: `${templateStyle.fontSize.body}px`,
                                }}
                              >
                                <div
                                  style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    backgroundColor:
                                      templateStyle.colors.primary,
                                    flexShrink: 0,
                                    marginTop: "2px", // Align with text baseline
                                  }}
                                />
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
                            className="resume-content mercury-education-content"
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
              {renderSectionHeader(section.title, isInSidebar, section.type)}
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
                      color: ${
                        templateStyle.colors.sidebarText || "#ffffff"
                      } !important;
                    }
                  `,
                }}
              />
            )}
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
                        color: isInSidebar
                          ? templateStyle.colors.sidebarText || "#ffffff"
                          : templateStyle.colors.secondary,
                      }}
                    >
                      {award.issuer} • {award.date}
                    </div>
                  )}
                  {award.description && (
                    <div
                      className={
                        isInSidebar
                          ? "resume-content awards-sidebar-content"
                          : "resume-content mercury-awards-content"
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
          (cs: any) => cs.id === section.id
        );

        // Debug logging
        if (process.env.NODE_ENV === "development") {
          console.log("🔍 [Custom Section Render]", {
            sectionId: section.id,
            sectionTitle: section.title,
            customSectionsInResume: resume.content.customSections,
            foundCustomSection: customSectionData,
            hasContent: customSectionData?.content ? true : false,
            contentLength: customSectionData?.content?.length || 0,
          });
        }

        if (!customSectionData) {
          console.warn(
            `⚠️ Custom section data not found for section ID: ${section.id}`
          );
          return null;
        }

        if (
          !customSectionData.content ||
          customSectionData.content.trim() === ""
        ) {
          console.warn(
            `⚠️ Custom section has no content for section ID: ${section.id}`
          );
          return null;
        }

        return (
          <div
            key={section.id}
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
          /* Global list styles for all content in resume - scoped to resume container */
          .resume-content ul, 
          .resume-content ol,
          .resume-page ul,
          .resume-page ol,
          ul, 
          ol {
            margin: 4px 0 8px 0 !important;
            padding-left: 20px !important;
            list-style-position: outside !important;
            list-style: disc outside !important;
          }
          
          .resume-content ul,
          .resume-page ul,
          ul {
            list-style-type: disc !important;
          }
          
          .resume-content ol,
          .resume-page ol,
          ol {
            list-style-type: decimal !important;
          }
          
          .resume-content li,
          .resume-page li,
          li {
            margin-bottom: 2px !important;
            line-height: 1.4 !important;
            display: list-item !important;
            list-style-position: outside !important;
            list-style: inherit !important;
          }
          
          .resume-content ul ul, 
          .resume-content ol ol, 
          .resume-content ul ol, 
          .resume-content ol ul,
          .resume-page ul ul,
          .resume-page ol ol,
          ul ul, 
          ol ol, 
          ul ol, 
          ol ul {
            margin: 2px 0 !important;
            padding-left: 18px !important;
          }
          
          .resume-content ul ul,
          .resume-page ul ul,
          ul ul {
            list-style-type: circle !important;
          }
          
          .resume-content ul ul ul,
          .resume-page ul ul ul,
          ul ul ul {
            list-style-type: square !important;
          }
          
          /* Also apply to resume-content class for specificity */
          .resume-content ul, .resume-content ol {
            margin: 4px 0 8px 0 !important;
            padding-left: 20px !important;
            list-style-position: outside !important;
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
            list-style-position: outside !important;
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
