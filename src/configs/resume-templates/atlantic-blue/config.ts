/**
 * Atlantic Blue Template Configuration
 *
 * Two-column resume: full-bleed navy sidebar + white main column.
 * Visual tokens live in `style.css` (`--ab-*` variables) for easy tuning and PDF parity.
 *
 * @template atlantic-blue
 * @category modern
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

/**
 * Base Template Configuration
 */
export const atlanticblueTemplate: ResumeTemplate = {
  id: "atlantic-blue",
  name: "Atlantic Blue",
  category: "modern",
  description: "Modern two-column template with blue sidebar",
  preview: "/resume-template-images/atlantic-blue-preview.webp",
  colors: {
    primary: "#2c3e50",
    secondary: "#3498db",
    accent: "#3498db",
    text: "#000000",
    background: "#ffffff",
    sidebarBackground: "#2c3e50",
    sidebarText: "#ffffff",
    sectionHeaderBg: "#ecf0f1",
  },
  layout: {
    headerStyle: "two-column",
    sectionSpacing: 10,
    fontFamily: "'Zilla Slab', 'Roboto Slab', Rockwell, 'Courier New', serif",
    fontSize: {
      heading: 28,
      subheading: 18,
      body: 11,
    },
  },
  atsOptimized: true,
};

/** Main column types (professional body). Sidebar = everything else. */
const MAIN_COLUMN_TYPES = [
  "experience",
  "education",
  "skills",
  "projects",
  "certificates",
  "courses",
  "achievements",
  "organisations",
  "publications",
  "references",
  "declaration",
  "custom",
  "spacer",
] as const;

const SIDEBAR_COLUMN_TYPES = [
  "personalInfo",
  "profileSummary",
  "languages",
  "awards",
  "interests",
] as const;

/**
 * Extended Configuration
 */
export const atlanticblueExtendedConfig: Partial<ExtendedResumeTemplate> = {
  style: {
    fontFamily: "'Zilla Slab', 'Roboto Slab', Rockwell, 'Courier New', serif",
    fontSize: { heading: 28, subheading: 18, body: 11, small: 10 },
    lineHeight: 1.45,
    colors: {
      primary: "#2c3e50",
      secondary: "#3498db",
      accent: "#3498db",
      text: "#000000",
      background: "#ffffff",
      sidebarBackground: "#2c3e50",
      sidebarText: "#ffffff",
      sectionHeaderBg: "#ecf0f1",
    },
    headerStyle: "two-column",
    sectionSpacing: 10,
    /* Full-bleed sidebar to page edges; inner padding is in style.css on columns */
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
    sectionHeader: {
      style: "background",
      backgroundColor: "#ecf0f1",
      textAlign: "left",
      fontSize: 11,
      fontWeight: "bold",
      marginBottom: "12px",
      paddingBottom: "10px",
      paddingTop: "10px",
      paddingLeft: "14px",
      paddingRight: "14px",
      textTransform: "uppercase",
      borderWidth: 0,
      borderColor: "transparent",
      borderRadius: "0",
    },
    skillsDisplay: { type: "list", showRatings: false },
    timelineLayout: { type: "vertical", datePosition: "right" },
    contactDisplay: { type: "icons", layout: "vertical" },
  },
  rendering: {
    pageBreak: {
      enabled: true,
      calculateDynamically: true,
    },
    dataStructure: "legacy",
    features: {
      twoColumnLayout: true,
      showPresent: true,
      showRatingDots: true,
    },
    layout: {
      type: "double",
      columnWidths: {
        left: 40,
        right: 60,
      },
      columnAssignment: {
        left: [...SIDEBAR_COLUMN_TYPES],
        right: [...MAIN_COLUMN_TYPES],
      },
    },
  },
  defaultSectionOrder: [
    {
      id: "personalInfo",
      type: "personalInfo",
      title: "Personal Information",
      visible: true,
    },
    {
      id: "profileSummary",
      type: "profileSummary",
      title: "Profile",
      visible: true,
    },
    {
      id: "languages",
      type: "languages",
      title: "Languages",
      visible: true,
    },
    {
      id: "awards",
      type: "awards",
      title: "Awards",
      visible: true,
    },
    {
      id: "experience",
      type: "experience",
      title: "Professional Experience",
      visible: true,
    },
    {
      id: "education",
      type: "education",
      title: "Education",
      visible: true,
    },
    {
      id: "skills",
      type: "skills",
      title: "Skills",
      visible: true,
    },
    {
      id: "projects",
      type: "projects",
      title: "Projects",
      visible: false,
    },
    {
      id: "certificates",
      type: "certificates",
      title: "Certifications",
      visible: false,
    },
    {
      id: "interests",
      type: "interests",
      title: "Interests",
      visible: false,
    },
  ],
};

export const atlanticblueConfig: TemplateConfig = {
  template: atlanticblueTemplate,
  extended: atlanticblueExtendedConfig,
};

export default atlanticblueConfig;
