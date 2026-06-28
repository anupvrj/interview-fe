/**
 * Royal Indigo Template Configuration
 *
 * Single-column resume with a centered indigo name, centered contact line and
 * uppercase indigo section headers carrying a slim full-width rule.
 *
 * @template royal-indigo
 * @category modern
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

export const royalindigoTemplate: ResumeTemplate = {
  id: "royal-indigo",
  name: "Royal Indigo",
  category: "modern",
  description: "Centered single-column layout with indigo accents",
  preview: "/resume-template-images/royal-indigo-preview.webp",
  colors: {
    primary: "#5b3fa0",
    secondary: "#6b7280",
    accent: "#7857b8",
    text: "#1f2937",
    background: "#ffffff",
  },
  layout: {
    headerStyle: "centered",
    sectionSpacing: 11,
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: {
      heading: 30,
      subheading: 14,
      body: 11,
    },
  },
  atsOptimized: true,
};

export const royalindigoExtendedConfig: Partial<ExtendedResumeTemplate> = {
  style: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: { heading: 30, subheading: 14, body: 11, small: 10 },
    lineHeight: 1.5,
    colors: {
      primary: "#5b3fa0",
      secondary: "#6b7280",
      accent: "#7857b8",
      text: "#1f2937",
      background: "#ffffff",
    },
    headerStyle: "centered",
    sectionSpacing: 11,
    padding: { top: 10, bottom: 10, left: 12, right: 12 },
    sectionHeader: {
      style: "border-bottom",
      borderWidth: 1,
      borderColor: "#cbb8e6",
      textAlign: "left",
      fontSize: 13,
      fontWeight: "bold",
      marginBottom: "10px",
      paddingBottom: "4px",
      textTransform: "uppercase",
      letterSpacing: "0.6px",
    },
    skillsDisplay: { type: "list", showRatings: false },
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
    { id: "experience", type: "experience", title: "Work Experience", visible: true },
    { id: "education", type: "education", title: "Education", visible: true },
    { id: "skills", type: "skills", title: "Skills", visible: true },
    { id: "interests", type: "interests", title: "Additional Information", visible: false },
    { id: "certificates", type: "certificates", title: "Certificates", visible: false },
  ],
};

export const royalindigoConfig: TemplateConfig = {
  template: royalindigoTemplate,
  extended: royalindigoExtendedConfig,
};

export default royalindigoConfig;
