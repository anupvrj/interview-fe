/**
 * Confident Grid Template Configuration
 *
 * Two-column layout with a tinted left sidebar carrying the photo, identity, summary,
 * skills and languages; the main column holds experience and education. Thin underline
 * section headers and dotted language ratings.
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
  description: "Two-column layout with a tinted sidebar and dotted language ratings",
  preview: "/resume-template-images/confident-grid-preview.webp",
  colors: {
    primary: "#1f2d3d",
    secondary: "#41566b",
    accent: "#2f5fa6",
    text: "#1f2d3d",
    background: "#ffffff",
    sidebarBackground: "#eaf1fb",
    sidebarText: "#1f2d3d",
  },
  layout: {
    headerStyle: "two-column",
    sectionSpacing: 10,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: {
      heading: 24,
      subheading: 14,
      body: 11,
    },
  },
  atsOptimized: true,
};

const SIDEBAR_TYPES = ["personalInfo", "profileSummary", "skills", "languages", "interests"] as const;
const MAIN_TYPES = [
  "experience",
  "education",
  "certificates",
  "projects",
  "awards",
  "achievements",
  "courses",
  "organisations",
  "publications",
  "references",
] as const;

export const confidentgridExtendedConfig: Partial<ExtendedResumeTemplate> = {
  style: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: { heading: 24, subheading: 14, body: 11, small: 10 },
    lineHeight: 1.45,
    colors: {
      primary: "#1f2d3d",
      secondary: "#41566b",
      accent: "#2f5fa6",
      text: "#1f2d3d",
      background: "#ffffff",
      sidebarBackground: "#eaf1fb",
      sidebarText: "#1f2d3d",
    },
    headerStyle: "two-column",
    sectionSpacing: 10,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
    sectionHeader: {
      style: "border-bottom",
      borderWidth: 1,
      borderColor: "#c2d2ea",
      textAlign: "left",
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: "10px",
      paddingBottom: "4px",
      textTransform: "none",
      letterSpacing: "0.2px",
    },
    skillsDisplay: { type: "bullets", showRatings: false, columns: 1 },
    timelineLayout: { type: "vertical", datePosition: "right" },
    contactDisplay: { type: "icons", layout: "vertical" },
    languageDisplay: {
      showRatings: true,
      ratingType: "dots",
      maxRating: 5,
    },
  },
  rendering: {
    pageBreak: { enabled: true, calculateDynamically: true },
    dataStructure: "legacy",
    features: { twoColumnLayout: true, showPresent: true, showRatingDots: true },
    layout: {
      type: "double",
      columnWidths: { left: 40, right: 60 },
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
    { id: "experience", type: "experience", title: "Professional Experience", visible: true },
    { id: "education", type: "education", title: "Education", visible: true },
    { id: "certificates", type: "certificates", title: "Certificates", visible: false },
    { id: "projects", type: "projects", title: "Projects", visible: false },
  ],
};

export const confidentgridConfig: TemplateConfig = {
  template: confidentgridTemplate,
  extended: confidentgridExtendedConfig,
};

export default confidentgridConfig;
