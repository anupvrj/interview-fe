/**
 * Dynamic Template Renderer
 * Renders resume sections based on template configuration - no hardcoded template IDs
 */

"use client";

import React from "react";
import { ResumeTemplate, Resume } from "@/lib/api";

// Template configuration types (shared between frontend and backend)
export interface TemplateStyleConfig {
  fontFamily: string;
  fontSize: {
    heading: number;
    subheading: number;
    body: number;
    small: number;
  };
  lineHeight: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    border?: string;
    sidebarBackground?: string;
    sidebarText?: string;
    sectionHeaderBg?: string;
  };
  headerStyle: "centered" | "left" | "two-column";
  sectionSpacing: number;
  padding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  sectionHeader: {
    style:
      | "underline"
      | "border-top-bottom"
      | "border-bottom"
      | "background"
      | "none";
    borderWidth?: number;
    borderColor?: string;
    backgroundColor?: string;
    textAlign?: "left" | "center" | "right";
    fontSize?: number;
    fontWeight?: "normal" | "bold" | "semibold";
    marginBottom?: string;
    paddingBottom?: string;
    paddingTop?: string;
    textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  };
  skillsDisplay: {
    type: "list" | "grid" | "dots" | "bars";
    showRatings?: boolean;
    maxRating?: number;
    columns?: number;
  };
  timelineLayout: {
    type: "grid" | "vertical" | "horizontal";
    datePosition: "left" | "right" | "top" | "bottom";
    dateWidth?: number;
  };
  contactDisplay: {
    type: "icons" | "text" | "table";
    layout: "horizontal" | "vertical" | "grid";
  };
}

export interface ExtendedResumeTemplate extends ResumeTemplate {
  style?: TemplateStyleConfig;
  rendering?: {
    pageBreak?: {
      enabled: boolean;
      calculateDynamically: boolean;
    };
    sections?: {
      [sectionType: string]: {
        renderer?: string;
        defaultColumn?: "left" | "right";
        alwaysOnFirstPage?: boolean;
        pageBreakInside?: "avoid" | "auto";
      };
    };
    dataStructure?: "legacy" | "sections-array" | "hybrid";
    features?: {
      showQuote?: boolean;
      showRatingDots?: boolean;
      showSkillLevels?: boolean;
      customHeader?: boolean;
      showPresent?: boolean;
      twoColumnLayout?: boolean;
    };
  };
}

export interface RenderContext {
  template: ExtendedResumeTemplate;
  resume: Resume;
  sectionType: string;
  sectionTitle: string;
  sectionData: any;
}

/**
 * Get template style configuration
 * Falls back to defaults if extended config not available
 */
export function getTemplateStyle(
  template: ResumeTemplate | ExtendedResumeTemplate
): TemplateStyleConfig {
  if ("style" in template && template.style) {
    return template.style;
  }

  // Fallback to basic template config
  return {
    fontFamily: template.layout.fontFamily,
    fontSize: {
      heading: template.layout.fontSize.heading,
      subheading: template.layout.fontSize.subheading,
      body: template.layout.fontSize.body,
      small: template.layout.fontSize.body - 2,
    },
    lineHeight: 1.4,
    colors: template.colors,
    headerStyle: template.layout.headerStyle,
    sectionSpacing: template.layout.sectionSpacing,
    padding: { top: 5, bottom: 5, left: 8, right: 8 },
    sectionHeader: {
      style: "border-top-bottom",
      textAlign: "center",
      fontSize: 13,
      fontWeight: "bold",
    },
    skillsDisplay: {
      type: "list",
      showRatings: false,
    },
    timelineLayout: {
      type: "vertical",
      datePosition: "left",
    },
    contactDisplay: {
      type: "text",
      layout: "horizontal",
    },
  };
}

/**
 * Render section header based on template style
 */
export function renderSectionHeader(
  title: string,
  style: TemplateStyleConfig["sectionHeader"]
): React.ReactElement {
  const baseStyle: React.CSSProperties = {
    fontSize: `${style.fontSize || 13}px`,
    fontWeight: style.fontWeight || "bold",
    textAlign: style.textAlign || "center",
    marginBottom: style.marginBottom || "6px",
    paddingBottom: style.paddingBottom || "2px",
    paddingTop: style.paddingTop || "4px",
    textTransform: style.textTransform || "none",
  };

  switch (style.style) {
    case "underline":
      return (
        <h2
          style={{
            ...baseStyle,
            borderBottom: `${style.borderWidth || 1}px solid ${
              style.borderColor || "#000000"
            }`,
            borderTop: "none",
            marginTop: 0,
          }}
        >
          {title}
        </h2>
      );

    case "border-top-bottom":
      return (
        <h2
          style={{
            ...baseStyle,
            borderTop: `${style.borderWidth || 2}px solid ${
              style.borderColor || "#000000"
            }`,
            borderBottom: `${style.borderWidth || 2}px solid ${
              style.borderColor || "#000000"
            }`,
            lineHeight: "1.2",
            display: "block",
            letterSpacing: "0.5px",
          }}
        >
          {style.textTransform === "uppercase" ? title.toUpperCase() : title}
        </h2>
      );

    case "border-bottom":
      return (
        <h2
          style={{
            ...baseStyle,
            borderBottom: `${style.borderWidth || 3}px solid ${
              style.borderColor || "#000000"
            }`,
            paddingBottom: "2px",
          }}
        >
          {title}
        </h2>
      );

    case "background":
      return (
        <h2
          style={{
            ...baseStyle,
            backgroundColor: style.backgroundColor || "#f0f0f0",
            padding: "4px 8px",
            borderRadius: "4px",
          }}
        >
          {title}
        </h2>
      );

    case "none":
    default:
      return <h2 style={baseStyle}>{title}</h2>;
  }
}

/**
 * Render skills based on template configuration
 */
export function renderSkills(
  skills: any,
  style: TemplateStyleConfig["skillsDisplay"],
  colors: TemplateStyleConfig["colors"]
): React.ReactNode {
  if (!skills || (Array.isArray(skills) && skills.length === 0)) {
    return null;
  }

  // Parse skills from various formats
  let skillItems: Array<{ name: string; level?: number }> = [];

  if (Array.isArray(skills)) {
    skillItems = skills.map((s) => ({
      name: typeof s === "string" ? s : s.name || s.title,
      level: s.level || 4,
    }));
  } else if (typeof skills === "string") {
    const skillsText = skills.replace(/<[^>]*>/g, "").trim();
    const skillsList = skillsText.split("\n").filter((s) => s.trim());
    skillItems = skillsList.map((skill) => ({
      name: skill.trim(),
      level: 4,
    }));
  }

  if (skillItems.length === 0) return null;

  switch (style.type) {
    case "dots":
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${style.columns || 2}, 1fr)`,
            gap: "6px 20px",
          }}
        >
          {skillItems.map((item, index) => {
            const level = item.level || 4;
            const maxDots = style.maxRating || 5;
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1, fontSize: "10pt" }}>{item.name}</div>
                <div
                  style={{ display: "flex", gap: "3px", marginLeft: "10px" }}
                >
                  {Array.from({ length: maxDots }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: i < level ? colors.primary : "#cccccc",
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );

    case "grid":
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${style.columns || 3}, 1fr)`,
            gap: "6px",
          }}
        >
          {skillItems.map((item, index) => (
            <div key={index} style={{ fontSize: "10pt" }}>
              • {item.name}
            </div>
          ))}
        </div>
      );

    case "bars":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {skillItems.map((item, index) => {
            const level = item.level || 4;
            const maxLevel = style.maxRating || 5;
            const percentage = (level / maxLevel) * 100;
            return (
              <div key={index}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "2px",
                  }}
                >
                  <span style={{ fontSize: "10pt" }}>{item.name}</span>
                  <span style={{ fontSize: "9pt", color: colors.secondary }}>
                    {level}/{maxLevel}
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    backgroundColor: "#e0e0e0",
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: "100%",
                      backgroundColor: colors.primary,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );

    case "list":
    default:
      return (
        <div style={{ fontSize: "10pt", lineHeight: "1.5" }}>
          <ul style={{ margin: 0, paddingLeft: "20px", listStyle: "disc" }}>
            {skillItems.map((item, index) => (
              <li key={index}>{item.name}</li>
            ))}
          </ul>
        </div>
      );
  }
}

/**
 * Get page container styles based on template
 */
export function getPageContainerStyles(
  template: ResumeTemplate | ExtendedResumeTemplate
): React.CSSProperties {
  const style = getTemplateStyle(template);

  return {
    fontFamily: style.fontFamily,
    backgroundColor: style.colors.background,
    color: style.colors.text,
    fontSize: `${style.fontSize.body}pt`,
    lineHeight: style.lineHeight,
  };
}

/**
 * Check if template has a specific feature enabled
 */
export function hasTemplateFeature(
  template: ResumeTemplate | ExtendedResumeTemplate,
  feature: string
): boolean {
  if ("rendering" in template && template.rendering?.features) {
    return (
      template.rendering.features[
        feature as keyof typeof template.rendering.features
      ] === true
    );
  }
  return false;
}
