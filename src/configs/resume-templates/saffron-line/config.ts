/**
 * Saffron Line Template Configuration
 *
 * Two-column resume with a clean white sidebar, serif headings and saffron section
 * rules. Sidebar carries identity, summary, skills, languages and certificates; the
 * main column holds experience and education. A thin saffron divider separates columns.
 *
 * @template saffron-line
 * @category modern
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

export const saffronlineTemplate: ResumeTemplate = {
  id: "saffron-line",
  name: "Saffron Line",
  category: "modern",
  description: "Two-column resume with serif headings and saffron section rules",
  preview: "/resume-template-images/saffron-line-preview.webp",
  colors: {
    primary: "#2b2b2b",
    secondary: "#6a6a6a",
    accent: "#c0871f",
    text: "#2b2b2b",
    background: "#ffffff",
    sidebarBackground: "#ffffff",
    sidebarText: "#2b2b2b",
  },
  layout: {
    headerStyle: "two-column",
    sectionSpacing: 10,
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: {
      heading: 26,
      subheading: 15,
      body: 11,
    },
  },
  atsOptimized: true,
};

const SIDEBAR_TYPES = [
  "personalInfo",
  "profileSummary",
  "skills",
  "languages",
  "certificates",
  "interests",
] as const;
const MAIN_TYPES = [
  "experience",
  "education",
  "projects",
  "awards",
  "achievements",
  "courses",
  "organisations",
  "publications",
  "references",
] as const;

export const saffronlineExtendedConfig: Partial<ExtendedResumeTemplate> = {
  style: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: { heading: 26, subheading: 15, body: 11, small: 10 },
    lineHeight: 1.45,
    colors: {
      primary: "#2b2b2b",
      secondary: "#6a6a6a",
      accent: "#c0871f",
      text: "#2b2b2b",
      background: "#ffffff",
      sidebarBackground: "#ffffff",
      sidebarText: "#2b2b2b",
    },
    headerStyle: "two-column",
    sectionSpacing: 10,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
    sectionHeader: {
      style: "border-bottom",
      borderWidth: 1.5,
      borderColor: "#c0871f",
      textAlign: "left",
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: "10px",
      paddingBottom: "4px",
      textTransform: "uppercase",
      letterSpacing: "0.6px",
    },
    skillsDisplay: { type: "bullets", showRatings: false, columns: 1 },
    timelineLayout: { type: "vertical", datePosition: "right" },
    contactDisplay: { type: "icons", layout: "vertical" },
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
      columnWidths: { left: 38, right: 62 },
      columnAssignment: {
        left: [...SIDEBAR_TYPES],
        right: [...MAIN_TYPES],
      },
    },
  },
  defaultSectionOrder: [
    { id: "personalInfo", type: "personalInfo", title: "Personal Information", visible: true },
    { id: "profileSummary", type: "profileSummary", title: "Summary", visible: true },
    { id: "skills", type: "skills", title: "Skills", visible: true },
    { id: "languages", type: "languages", title: "Languages", visible: true },
    { id: "certificates", type: "certificates", title: "Certificates", visible: true },
    { id: "experience", type: "experience", title: "Professional Experience", visible: true },
    { id: "education", type: "education", title: "Education", visible: true },
    { id: "projects", type: "projects", title: "Projects", visible: false },
  ],
};

export const saffronlineConfig: TemplateConfig = {
  template: saffronlineTemplate,
  extended: saffronlineExtendedConfig,
};

export default saffronlineConfig;
