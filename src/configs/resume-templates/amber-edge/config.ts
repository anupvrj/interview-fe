/**
 * Amber Edge Template Configuration
 *
 * Single-column resume with a left-aligned name, amber/gold section rules and a
 * two-column skills block. Date-on-right timeline.
 *
 * @template amber-edge
 * @category modern
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

export const amberedgeTemplate: ResumeTemplate = {
  id: "amber-edge",
  name: "Amber Edge",
  category: "modern",
  description: "Single-column layout with amber rules and a two-column skills block",
  preview: "/resume-template-images/amber-edge-preview.webp",
  colors: {
    primary: "#1f1f1f",
    secondary: "#5a5a5a",
    accent: "#b07d2b",
    text: "#1f1f1f",
    background: "#ffffff",
  },
  layout: {
    headerStyle: "left",
    sectionSpacing: 11,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: {
      heading: 28,
      subheading: 14,
      body: 11,
    },
  },
  atsOptimized: true,
};

export const amberedgeExtendedConfig: Partial<ExtendedResumeTemplate> = {
  style: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: { heading: 28, subheading: 14, body: 11, small: 10 },
    lineHeight: 1.5,
    colors: {
      primary: "#1f1f1f",
      secondary: "#5a5a5a",
      accent: "#b07d2b",
      text: "#1f1f1f",
      background: "#ffffff",
    },
    headerStyle: "left",
    sectionSpacing: 11,
    padding: { top: 10, bottom: 10, left: 14, right: 14 },
    sectionHeader: {
      style: "border-bottom",
      borderWidth: 1.5,
      borderColor: "#d9b877",
      textAlign: "left",
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: "10px",
      paddingBottom: "4px",
      textTransform: "uppercase",
      letterSpacing: "0.6px",
    },
    skillsDisplay: { type: "bullets", showRatings: false, columns: 2 },
    timelineLayout: { type: "vertical", datePosition: "right" },
    contactDisplay: { type: "text", layout: "horizontal" },
  },
  rendering: {
    pageBreak: { enabled: true, calculateDynamically: true },
    dataStructure: "legacy",
    features: { showPresent: true },
    layout: {
      type: "single",
      columnWidths: { left: 100, right: 0 },
    },
  },
  defaultSectionOrder: [
    { id: "personalInfo", type: "personalInfo", title: "Personal Information", visible: true },
    { id: "profileSummary", type: "profileSummary", title: "Summary", visible: true },
    { id: "skills", type: "skills", title: "Skills", visible: true },
    { id: "experience", type: "experience", title: "Professional Experience", visible: true },
    { id: "projects", type: "projects", title: "Projects", visible: true },
    { id: "education", type: "education", title: "Education", visible: true },
    { id: "interests", type: "interests", title: "Additional Information", visible: false },
  ],
};

export const amberedgeConfig: TemplateConfig = {
  template: amberedgeTemplate,
  extended: amberedgeExtendedConfig,
};

export default amberedgeConfig;
