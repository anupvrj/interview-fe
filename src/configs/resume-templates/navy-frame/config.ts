/**
 * Navy Frame Template Configuration
 *
 * Single-column resume with profile photo left and labeled contact right on a
 * white header (no background band). Navy uppercase section headers and a
 * date-on-right timeline.
 *
 * @template navy-frame
 * @category modern
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

export const navyframeTemplate: ResumeTemplate = {
  id: "navy-frame",
  name: "Navy Frame",
  category: "modern",
  description: "Profile-photo header with navy section headers on white",
  preview: "/resume-template-images/navy-frame-preview.webp",
  colors: {
    primary: "#1f3a5f",
    secondary: "#5a6b7d",
    accent: "#1f3a5f",
    text: "#1f2937",
    background: "#ffffff",
  },
  layout: {
    headerStyle: "left",
    sectionSpacing: 11,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: {
      heading: 26,
      subheading: 14,
      body: 11,
    },
  },
  atsOptimized: true,
};

export const navyframeExtendedConfig: Partial<ExtendedResumeTemplate> = {
  style: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: { heading: 26, subheading: 14, body: 11, small: 10 },
    lineHeight: 1.5,
    colors: {
      primary: "#1f3a5f",
      secondary: "#5a6b7d",
      accent: "#1f3a5f",
      text: "#1f2937",
      background: "#ffffff",
    },
    headerStyle: "left",
    sectionSpacing: 11,
    padding: { top: 12, bottom: 12, left: 14, right: 14 },
    sectionHeader: {
      style: "border-bottom",
      borderWidth: 1.5,
      borderColor: "#1f3a5f",
      textAlign: "left",
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: "10px",
      paddingBottom: "4px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    skillsDisplay: { type: "bullets", showRatings: false, columns: 2 },
    timelineLayout: { type: "vertical", datePosition: "right" },
    contactDisplay: { type: "text", layout: "vertical" },
    useCSSClassesForHeader: true,
    headerLayout: {
      type: "with-profile-picture",
      titlePosition: "below",
    },
  },
  rendering: {
    pageBreak: { enabled: true, calculateDynamically: true },
    dataStructure: "legacy",
    features: { showPresent: true, customHeader: true },
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
    { id: "skills", type: "skills", title: "Additional Information", visible: true },
    { id: "languages", type: "languages", title: "Languages", visible: false },
    { id: "certificates", type: "certificates", title: "Certificates", visible: false },
  ],
};

export const navyframeConfig: TemplateConfig = {
  template: navyframeTemplate,
  extended: navyframeExtendedConfig,
};

export default navyframeConfig;
