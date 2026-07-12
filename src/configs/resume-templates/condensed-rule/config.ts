/**
 * Condensed Rule Template Configuration
 *
 * Dense, single-column consulting/leadership resume. Name + title sit inline in the
 * header, separated from contact by a thin full-width rule. Uppercase section headers
 * each carry a slim bottom rule. Date-on-right timeline. Skills/certificates render as
 * compact multi-column lists.
 *
 * @template condensed-rule
 * @category simple
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

export const condensedruleTemplate: ResumeTemplate = {
  id: "condensed-rule",
  name: "Condensed Rule",
  category: "simple",
  description:
    "Dense single-column layout with inline name/title and slim section rules",
  preview: "/resume-template-images/condensed-rule-preview.webp",
  colors: {
    primary: "#1a1a1a",
    secondary: "#555555",
    accent: "#1a1a1a",
    text: "#1a1a1a",
    background: "#ffffff",
  },
  layout: {
    headerStyle: "left",
    sectionSpacing: 9,
    fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
    fontSize: {
      heading: 24,
      subheading: 14,
      body: 10.5,
    },
  },
  atsOptimized: true,
};

export const condensedruleExtendedConfig: Partial<ExtendedResumeTemplate> = {
  style: {
    fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
    fontSize: { heading: 24, subheading: 14, body: 10.5, small: 9.5 },
    lineHeight: 1.4,
    colors: {
      primary: "#1a1a1a",
      secondary: "#555555",
      accent: "#1a1a1a",
      text: "#1a1a1a",
      background: "#ffffff",
    },
    headerStyle: "left",
    sectionSpacing: 9,
    padding: { top: 6, bottom: 10, left: 12, right: 12 },
    sectionHeader: {
      style: "border-bottom",
      borderWidth: 1,
      borderColor: "#1a1a1a",
      textAlign: "left",
      fontSize: 11,
      fontWeight: "bold",
      marginBottom: "8px",
      paddingBottom: "3px",
      textTransform: "uppercase",
      letterSpacing: "0.6px",
    },
    skillsDisplay: { type: "list", showRatings: false, columns: 1 },
    timelineLayout: { type: "vertical", datePosition: "right" },
    contactDisplay: { type: "text", layout: "horizontal" },
    useCSSClassesForHeader: true,
    headerLayout: {
      type: "name-title-split",
      titlePosition: "inline",
    },
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
    { id: "experience", type: "experience", title: "Professional Experience", visible: true },
    { id: "education", type: "education", title: "Education", visible: true },
    { id: "projects", type: "projects", title: "Projects", visible: false },
    { id: "skills", type: "skills", title: "Skills", visible: true },
    { id: "languages", type: "languages", title: "Languages", visible: true },
    { id: "certificates", type: "certificates", title: "Certificates", visible: true },
    { id: "awards", type: "awards", title: "Awards", visible: false },
  ],
};

export const condensedruleConfig: TemplateConfig = {
  template: condensedruleTemplate,
  extended: condensedruleExtendedConfig,
};

export default condensedruleConfig;
