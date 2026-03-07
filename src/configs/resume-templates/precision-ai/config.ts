/**
 * Precision AI Resume Template
 *
 * Clean, ATS-optimized resume for Data Scientists,
 * ML Engineers, and AI Specialists.
 *
 * @template precision-ai
 * @category modern
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

/* ---------------- Base Template ---------------- */

export const precisionAiTemplate: ResumeTemplate = {
  id: "precision-ai",
  name: "Precision AI",
  category: "modern",
  description:
    "A clean, ATS-optimized resume template designed for Data Science, ML, and AI professionals.",
  preview: "/resume-template-images/precision-ai-preview.webp",
  colors: {
    primary: "#0f2a44",
    secondary: "#555555",
    accent: "#0f2a44",
    text: "#000000",
    background: "#ffffff",
  },
  layout: {
    headerStyle: "centered",
    sectionSpacing: 20,
    fontFamily: "'Inter', sans-serif",
    fontSize: {
      heading: 32,
      subheading: 16,
      body: 12,
    },
  },
  atsOptimized: true,
};

/* ---------------- Extended Configuration ---------------- */

export const precisionAiExtended: Partial<ExtendedResumeTemplate> = {
  style: {
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.6,
    fontSize: {
      heading: 32,
      subheading: 16,
      body: 12,
      small: 11,
    },
    colors: {
      primary: "#0f2a44",
      secondary: "#555555",
      accent: "#0f2a44",
      text: "#000000",
      background: "#ffffff",
    },
    headerStyle: "centered",
    sectionSpacing: 20,
    padding: { top: 30, bottom: 30, left: 40, right: 40 },

    sectionHeader: {
      style: "border-bottom",
      borderWidth: 2,
      borderColor: "#0f2a44",
      textAlign: "left",
      fontSize: 13,
      fontWeight: "700",
      marginBottom: "12px",
      paddingBottom: "6px",
      textTransform: "uppercase",
    },

    skillsDisplay: {
      type: "list",
      columns: 1,
      showRatings: false,
    },

    timelineLayout: {
      type: "vertical",
      datePosition: "right",
    },

    contactDisplay: {
      type: "text",
      layout: "horizontal",
    },

    useCSSClassesForHeader: true,
  },

  rendering: {
    pageBreak: {
      enabled: true,
      calculateDynamically: true,
    },
    dataStructure: "legacy",
    features: {
      showPresent: true,
    },
    layout: {
      type: "single",
      columnWidths: {
        left: 100,
        right: 0,
      },
    },
  },

  defaultSectionOrder: [
    { id: "personalInfo", type: "personalInfo", title: "Personal Information", visible: true },
    { id: "profileSummary", type: "profileSummary", title: "Professional Summary", visible: true },
    { id: "experience", type: "experience", title: "Work Experience", visible: true },
    { id: "education", type: "education", title: "Education", visible: true },
    { id: "skills", type: "skills", title: "Skills", visible: true },
    { id: "projects", type: "projects", title: "Academic Projects", visible: true },
    { id: "certificates", type: "certificates", title: "Certifications", visible: true },
  ],
};

/* ---------------- Export ---------------- */

export const precisionAiConfig: TemplateConfig = {
  template: precisionAiTemplate,
  extended: precisionAiExtended,
};

export default precisionAiConfig;