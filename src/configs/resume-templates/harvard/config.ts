/**
 * Harvard Template Configuration
 *
 * Academic-style template with Garamond font and centered header.
 * Features elegant typography and professional formatting.
 *
 * @template harvard
 * @category simple
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

export const harvardTemplate: ResumeTemplate = {
  id: "harvard",
  name: "Harvard",
  category: "simple",
  description: "Academic-style template with elegant typography",
  preview: "/resume-template-images/harvard-preview.webp",
  colors: {
    primary: "#000000",
    secondary: "#5a5a5a",
    accent: "#000000",
    text: "#000000",
    background: "#ffffff",
  },
  layout: {
    headerStyle: "centered",
    sectionSpacing: 9,
    fontFamily: "Garamond, 'Times New Roman', serif",
    fontSize: {
      heading: 22,
      subheading: 16,
      body: 11,
    },
  },
  atsOptimized: true,
};

export const harvardExtendedConfig: Partial<ExtendedResumeTemplate> = {
  // Minimal style config for renderer (detailed CSS in style.css)
  style: {
    fontFamily: "Garamond, 'Times New Roman', serif",
    fontSize: { heading: 22, subheading: 16, body: 11, small: 10 },
    lineHeight: 1.4,
    colors: {
      primary: "#000000",
      secondary: "#5a5a5a",
      accent: "#000000",
      text: "#000000",
      background: "#ffffff",
    },
    headerStyle: "centered",
    sectionSpacing: 9,
    padding: { top: 8, bottom: 8, left: 8, right: 8 },
    sectionHeader: {
      style: "border-bottom",
      borderWidth: 1,
      borderColor: "#000000",
      textAlign: "left",
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: "8px",
      paddingBottom: "4px",
      textTransform: "uppercase",
    },
    skillsDisplay: { type: "list", showRatings: false, columns: 3 },
    timelineLayout: { type: "vertical", datePosition: "right" },
    contactDisplay: { type: "text", layout: "horizontal" },
  },
  rendering: {
    pageBreak: {
      enabled: true,
      calculateDynamically: true,
    },
    dataStructure: "legacy",
    features: {
      showPresent: true,
    },
    layout: {
      type: "single",
      columnWidths: {
        left: 100,
        right: 0,
      },
    },
  },
};

export const harvardConfig: TemplateConfig = {
  template: harvardTemplate,
  extended: harvardExtendedConfig,
};
