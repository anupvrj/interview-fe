/**
 * Saffron Line Template Configuration
 *
 * Full-width header (photo, name, contact) on top, then two columns below.
 * Left: summary, education, skills, languages; right: experience, projects.
 * Serif headings with saffron section rules — no vertical column divider.
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
  description:
    "Full-width header with two columns below and saffron section rules",
  preview: "/resume-template-images/saffron-line-preview.webp",
  colors: {
    primary: "#2b2b2b",
    secondary: "#6a6a6a",
    accent: "#c0871f",
    text: "#2b2b2b",
    background: "#ffffff",
  },
  layout: {
    headerStyle: "left",
    sectionSpacing: 12,
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: {
      heading: 28,
      subheading: 15,
      body: 11,
    },
  },
  atsOptimized: true,
};

const SIDEBAR_TYPES = [
  "profileSummary",
  "education",
  "skills",
  "languages",
  "certificates",
  "interests",
] as const;
const MAIN_TYPES = [
  "experience",
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
    fontSize: { heading: 28, subheading: 15, body: 11, small: 10.5 },
    lineHeight: 1.5,
    colors: {
      primary: "#2b2b2b",
      secondary: "#6a6a6a",
      accent: "#c0871f",
      text: "#2b2b2b",
      background: "#ffffff",
    },
    headerStyle: "left",
    sectionSpacing: 12,
    padding: { top: 5, bottom: 8, left: 8, right: 8 },
    sectionHeader: {
      style: "border-bottom",
      borderWidth: 2.5,
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
    contactDisplay: { type: "icons", layout: "horizontal" },
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
      columnWidths: { left: 36, right: 64 },
      columnAssignment: {
        left: [...SIDEBAR_TYPES],
        right: [...MAIN_TYPES],
      },
    },
  },
  defaultSectionOrder: [
    { id: "personalInfo", type: "personalInfo", title: "Personal Information", visible: true },
    { id: "profileSummary", type: "profileSummary", title: "Summary", visible: true },
    { id: "education", type: "education", title: "Education", visible: true },
    { id: "skills", type: "skills", title: "Skills", visible: true },
    { id: "languages", type: "languages", title: "Languages", visible: true },
    { id: "experience", type: "experience", title: "Work Experience", visible: true },
    { id: "projects", type: "projects", title: "Projects", visible: true },
  ],
};

export const saffronlineConfig: TemplateConfig = {
  template: saffronlineTemplate,
  extended: saffronlineExtendedConfig,
};

export default saffronlineConfig;
