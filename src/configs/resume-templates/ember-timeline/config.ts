/**
 * Ember Timeline Template Configuration
 *
 * Single-column resume with a date-on-left timeline, navy section headers, orange
 * role/company accents, boxed skill tags and a two-column Key Achievements footer.
 *
 * @template ember-timeline
 * @category modern
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

export const embertimelineTemplate: ResumeTemplate = {
  id: "ember-timeline",
  name: "Ember Timeline",
  category: "modern",
  description: "Date-on-left timeline with navy headers and boxed skill tags",
  preview: "/resume-template-images/ember-timeline-preview.webp",
  colors: {
    primary: "#1f2a66",
    secondary: "#5b6472",
    accent: "#e8632a",
    text: "#1f2937",
    background: "#ffffff",
  },
  layout: {
    headerStyle: "left",
    sectionSpacing: 11,
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: {
      heading: 28,
      subheading: 14,
      body: 11,
    },
  },
  atsOptimized: true,
};

export const embertimelineExtendedConfig: Partial<ExtendedResumeTemplate> = {
  style: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: { heading: 28, subheading: 14, body: 11, small: 10 },
    lineHeight: 1.5,
    colors: {
      primary: "#1f2a66",
      secondary: "#5b6472",
      accent: "#e8632a",
      text: "#1f2937",
      background: "#ffffff",
    },
    headerStyle: "left",
    sectionSpacing: 11,
    padding: { top: 5, bottom: 10, left: 12, right: 12 },
    sectionHeader: {
      style: "default",
      textAlign: "left",
      fontSize: 13,
      fontWeight: "bold",
      marginBottom: "8px",
      paddingBottom: "0px",
      textTransform: "uppercase",
      letterSpacing: "0.4px",
    },
    skillsDisplay: { type: "bullets", showRatings: false, columns: 4 },
    timelineLayout: { type: "grid", datePosition: "left", dateWidth: 115 },
    contactDisplay: { type: "icons", layout: "horizontal" },
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
    { id: "experience", type: "experience", title: "Experience", visible: true },
    { id: "education", type: "education", title: "Education", visible: true },
    { id: "skills", type: "skills", title: "Skills", visible: true },
    { id: "awards", type: "awards", title: "Key Achievements", visible: true },
    { id: "certificates", type: "certificates", title: "Certificates", visible: false },
  ],
};

export const embertimelineConfig: TemplateConfig = {
  template: embertimelineTemplate,
  extended: embertimelineExtendedConfig,
};

export default embertimelineConfig;
