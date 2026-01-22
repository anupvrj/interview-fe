/**
 * True Blue Template Configuration
 * 
 * Professional academic/research template with blue color scheme.
 * Features clean layout with blue headers and underlines.
 * 
 * @template true-blue
 * @category simple
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

export const trueblueTemplate: ResumeTemplate = {
  id: "true-blue",
  name: "True Blue",
  category: "simple",
  description: "Professional template with blue accents and clean layout",
  preview: "/resume-template-images/true-blue-preview.webp",
  colors: {
    primary: "#2c5f9e",
    secondary: "#000000",
    accent: "#2c5f9e",
    text: "#000000",
    background: "#ffffff",
  },
  layout: {
    headerStyle: "left",
    sectionSpacing: 12,
    fontFamily: "Calibri, 'Segoe UI', 'Trebuchet MS', sans-serif",
    fontSize: {
      heading: 28,
      subheading: 16,
      body: 11,
    },
  },
  atsOptimized: true,
};

export const trueblueExtendedConfig: Partial<ExtendedResumeTemplate> = {
  style: {
    fontFamily: "Calibri, 'Segoe UI', 'Trebuchet MS', sans-serif",
    fontSize: { heading: 28, subheading: 16, body: 11, small: 10 },
    lineHeight: 1.5,
    colors: {
      primary: "#2c5f9e",
      secondary: "#000000",
      accent: "#2c5f9e",
      text: "#000000",
      background: "#ffffff",
    },
    headerStyle: "left",
    sectionSpacing: 12,
    padding: { top: 8, bottom: 8, left: 8, right: 8 },
    sectionHeader: {
      style: "border-bottom",
      borderWidth: 1.5,
      borderColor: "#2c5f9e",
      textAlign: "left",
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: "10px",
      paddingBottom: "4px",
      textTransform: "uppercase",
    },
    skillsDisplay: { type: "list", showRatings: false },
    timelineLayout: { type: "vertical", datePosition: "right" },
    contactDisplay: { type: "icons", layout: "horizontal" },
    // Use CSS classes for header colors instead of inline styles
    // This allows the CSS file to control name and job title colors
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
      showRatingDots: false,
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
    { id: "experience", type: "experience", title: "Research Experience", visible: true },
    { id: "education", type: "education", title: "Education", visible: true },
    { id: "skills", type: "skills", title: "Skills", visible: true },
    { id: "certificates", type: "certificates", title: "Certifications", visible: false },
    { id: "projects", type: "projects", title: "Projects", visible: false },
    { id: "publications", type: "publications", title: "Publications", visible: false },
    { id: "awards", type: "awards", title: "Awards", visible: false },
    { id: "languages", type: "languages", title: "Languages", visible: false },
    { id: "interests", type: "interests", title: "Interests", visible: false },
  ],
};

export const trueblueConfig: TemplateConfig = {
  template: trueblueTemplate,
  extended: trueblueExtendedConfig,
};

export default trueblueConfig;
