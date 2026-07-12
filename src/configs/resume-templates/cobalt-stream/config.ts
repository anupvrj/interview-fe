/**
 * Cobalt Stream Template Configuration
 *
 * Single-column resume with bold black section headers (thick underline), cobalt blue
 * role/company accents and a two-column Key Achievements footer.
 *
 * @template cobalt-stream
 * @category modern
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

export const cobaltstreamTemplate: ResumeTemplate = {
  id: "cobalt-stream",
  name: "Cobalt Stream",
  category: "modern",
  description: "Bold section rules with cobalt accents and a key-achievements footer",
  preview: "/resume-template-images/cobalt-stream-preview.webp",
  colors: {
    primary: "#111827",
    secondary: "#4b5563",
    accent: "#2563eb",
    text: "#111827",
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

export const cobaltstreamExtendedConfig: Partial<ExtendedResumeTemplate> = {
  style: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: { heading: 28, subheading: 14, body: 11, small: 10 },
    lineHeight: 1.5,
    colors: {
      primary: "#111827",
      secondary: "#4b5563",
      accent: "#2563eb",
      text: "#111827",
      background: "#ffffff",
    },
    headerStyle: "left",
    sectionSpacing: 11,
    padding: { top: 5, bottom: 10, left: 12, right: 12 },
    sectionHeader: {
      style: "border-bottom",
      borderWidth: 2,
      borderColor: "#111827",
      textAlign: "left",
      fontSize: 13,
      fontWeight: "bold",
      marginBottom: "10px",
      paddingBottom: "3px",
      textTransform: "uppercase",
      letterSpacing: "0.4px",
    },
    skillsDisplay: { type: "bullets", showRatings: false, columns: 3 },
    timelineLayout: { type: "vertical", datePosition: "right" },
    contactDisplay: { type: "icons", layout: "horizontal" },
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
    { id: "awards", type: "awards", title: "Key Achievements", visible: true },
    { id: "skills", type: "skills", title: "Skills", visible: false },
    { id: "certificates", type: "certificates", title: "Certificates", visible: false },
  ],
};

export const cobaltstreamConfig: TemplateConfig = {
  template: cobaltstreamTemplate,
  extended: cobaltstreamExtendedConfig,
};

export default cobaltstreamConfig;
