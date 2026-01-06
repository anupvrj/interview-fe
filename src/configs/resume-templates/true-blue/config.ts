/**
 * True Blue Template Configuration
 * 
 * Clean template with left-aligned header and simple styling.
 * Features Arial font and professional appearance.
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
  description: "Clean and straightforward professional template",
  preview: "/resume-template-images/true-blue-preview.webp",
  colors: {
    primary: "#000000",
    secondary: "#5a5a5a",
    accent: "#000000",
    text: "#000000",
    background: "#ffffff",
  },
  layout: {
    headerStyle: "left",
    sectionSpacing: 9,
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: {
      heading: 22,
      subheading: 16,
      body: 11,
    },
  },
  atsOptimized: true,
};

export const trueblueExtendedConfig: Partial<ExtendedResumeTemplate> = {
  // Minimal style config for renderer (detailed CSS in style.css)
  style: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: { heading: 22, subheading: 16, body: 11, small: 10 },
    lineHeight: 1.4,
    colors: {
      primary: "#000000",
      secondary: "#5a5a5a",
      accent: "#000000",
      text: "#000000",
      background: "#ffffff",
    },
    headerStyle: "left",
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
    skillsDisplay: { type: "list", showRatings: false },
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

export const trueblueConfig: TemplateConfig = {
  template: trueblueTemplate,
  extended: trueblueExtendedConfig,
};

