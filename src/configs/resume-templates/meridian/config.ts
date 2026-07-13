/**
 * Meridian Template Configuration
 *
 * Clean black-and-white single-column resume with a centered name/title, a multi-column
 * "Area of Expertise" grid, and slim underline section headers.
 *
 * @template meridian
 * @category simple
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

export const meridianTemplate: ResumeTemplate = {
  id: "meridian",
  name: "Meridian",
  category: "simple",
  description: "Minimal centered layout with an expertise grid",
  preview: "/resume-template-images/meridian-preview.webp",
  colors: {
    primary: "#1a1a1a",
    secondary: "#4a4a4a",
    accent: "#1a1a1a",
    text: "#1a1a1a",
    background: "#ffffff",
  },
  layout: {
    headerStyle: "centered",
    sectionSpacing: 10,
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: {
      heading: 28,
      subheading: 15,
      body: 11,
    },
  },
  atsOptimized: true,
};

export const meridianExtendedConfig: Partial<ExtendedResumeTemplate> = {
  style: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: { heading: 28, subheading: 15, body: 11, small: 10 },
    lineHeight: 1.5,
    colors: {
      primary: "#1a1a1a",
      secondary: "#4a4a4a",
      accent: "#1a1a1a",
      text: "#1a1a1a",
      background: "#ffffff",
    },
    headerStyle: "centered",
    sectionSpacing: 10,
    padding: { top: 5, bottom: 10, left: 14, right: 14 },
    sectionHeader: {
      style: "border-bottom",
      borderWidth: 1,
      borderColor: "#1a1a1a",
      textAlign: "left",
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: "10px",
      paddingBottom: "4px",
      textTransform: "uppercase",
      letterSpacing: "0.6px",
    },
    skillsDisplay: { type: "bullets", showRatings: false, columns: 3 },
    timelineLayout: { type: "vertical", datePosition: "right" },
    contactDisplay: { type: "text", layout: "horizontal" },
    useCSSClassesForHeader: true,
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
    { id: "skills", type: "skills", title: "Area of Expertise", visible: true },
    { id: "awards", type: "awards", title: "Key Achievements", visible: true },
    { id: "experience", type: "experience", title: "Professional Experience", visible: true },
    { id: "education", type: "education", title: "Education", visible: true },
    { id: "interests", type: "interests", title: "Additional Information", visible: true },
  ],
};

export const meridianConfig: TemplateConfig = {
  template: meridianTemplate,
  extended: meridianExtendedConfig,
};

export default meridianConfig;
