/**
 * Confident Grid Template Configuration
 *
 * Full-width tinted header (photo, identity, 2×2 contact grid), then a balanced
 * 50/50 body: summary, experience and education on the left; projects and core
 * strengths on the right.
 *
 * @template confident-grid
 * @category modern
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

export const confidentgridTemplate: ResumeTemplate = {
  id: "confident-grid",
  name: "Confident Grid",
  category: "modern",
  description:
    "Tinted header with photo and contact grid, plus balanced two-column sections",
  preview: "/resume-template-images/confident-grid-preview.webp",
  colors: {
    primary: "#000000",
    secondary: "#000000",
    accent: "#2f5fa6",
    text: "#000000",
    background: "#ffffff",
    headerBackground: "#deeef7",
  },
  layout: {
    headerStyle: "left",
    sectionSpacing: 12,
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: {
      heading: 26,
      subheading: 13,
      body: 11,
    },
  },
  atsOptimized: true,
};

const LEFT_COLUMN_TYPES = [
  "profileSummary",
  "experience",
  "education",
] as const;

const RIGHT_COLUMN_TYPES = [
  "projects",
  "skills",
  "certificates",
  "awards",
  "achievements",
  "courses",
  "organisations",
  "publications",
  "references",
  "languages",
  "interests",
] as const;

export const confidentgridExtendedConfig: Partial<ExtendedResumeTemplate> = {
  style: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: { heading: 26, subheading: 13, body: 11, small: 10 },
    lineHeight: 1.45,
    colors: {
      primary: "#000000",
      secondary: "#000000",
      accent: "#2f5fa6",
      text: "#000000",
      background: "#ffffff",
      headerBackground: "#deeef7",
    },
    headerStyle: "left",
    sectionSpacing: 12,
    padding: { top: 0, bottom: 10, left: 12, right: 12 },
    sectionHeader: {
      style: "border-bottom",
      borderWidth: 1,
      borderColor: "#b0c4de",
      textAlign: "left",
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: "10px",
      paddingBottom: "4px",
      textTransform: "none",
      letterSpacing: "0.1px",
    },
    skillsDisplay: { type: "bullets", showRatings: false, columns: 1 },
    timelineLayout: { type: "vertical", datePosition: "right" },
    contactDisplay: { type: "icons", layout: "grid" },
    useCSSClassesForHeader: true,
    headerLayout: {
      type: "with-profile-picture",
      titlePosition: "below",
    },
    languageDisplay: {
      showRatings: false,
    },
  },
  rendering: {
    pageBreak: { enabled: true, calculateDynamically: true },
    dataStructure: "legacy",
    features: { twoColumnLayout: true, showPresent: true },
    layout: {
      type: "double",
      columnWidths: { left: 50, right: 50 },
      columnAssignment: {
        left: [...LEFT_COLUMN_TYPES],
        right: [...RIGHT_COLUMN_TYPES],
      },
    },
  },
  defaultSectionOrder: [
    { id: "personalInfo", type: "personalInfo", title: "Personal Information", visible: true },
    { id: "profileSummary", type: "profileSummary", title: "Profile Summary", visible: true },
    { id: "experience", type: "experience", title: "Professional Experience", visible: true },
    { id: "education", type: "education", title: "Education", visible: true },
    { id: "projects", type: "projects", title: "Projects", visible: true },
    { id: "skills", type: "skills", title: "Core Strengths", visible: true },
    { id: "languages", type: "languages", title: "Languages", visible: false },
    { id: "certificates", type: "certificates", title: "Certificates", visible: false },
  ],
};

export const confidentgridConfig: TemplateConfig = {
  template: confidentgridTemplate,
  extended: confidentgridExtendedConfig,
};

export default confidentgridConfig;
