/**
 * Corporate Template Configuration
 *
 * Professional template with centered header and border-top-bottom section headers.
 * Features Times New Roman font and formal styling.
 *
 * @template corporate
 * @category simple
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

export const corporateTemplate: ResumeTemplate = {
  id: "corporate",
  name: "Corporate",
  category: "simple",
  description: "Professional template with formal corporate styling",
  preview: "/resume-template-images/corporate-preview.webp",
  colors: {
    primary: "#000000",
    secondary: "#7f8c8d",
    accent: "#34495e",
    text: "#000000",
    background: "#ffffff",
  },
  layout: {
    headerStyle: "centered",
    sectionSpacing: 10,
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: {
      heading: 22,
      subheading: 16,
      body: 11,
    },
  },
  atsOptimized: true,
};

export const corporateExtendedConfig: Partial<ExtendedResumeTemplate> = {
  // Minimal style config for renderer (detailed CSS in style.css)
  style: {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: { heading: 22, subheading: 16, body: 11, small: 10 },
    lineHeight: 1.4,
    colors: {
      primary: "#000000",
      secondary: "#7f8c8d",
      accent: "#34495e",
      text: "#000000",
      background: "#ffffff",
    },
    headerStyle: "centered",
    sectionSpacing: 10,
    padding: { top: 6, bottom: 8, left: 8, right: 8 },
    sectionHeader: {
      style: "border-top-bottom",
      borderWidth: 2,
      borderColor: "#000000",
      textAlign: "center",
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: "10px",
      paddingTop: "8px",
      paddingBottom: "8px",
      paddingLeft: "16px",
      paddingRight: "16px",
      textTransform: "uppercase",
    },
    useCSSClassesForHeader: true,
    skillsDisplay: { type: "list", showRatings: false },
    timelineLayout: { type: "vertical", datePosition: "right" },
    contactDisplay: { type: "text", layout: "horizontal" },
  },
  rendering: {
    pageBreak: {
      enabled: true,
      calculateDynamically: true,
    },
    /** Page 2+ top gutter follows layout.padding.top from editor settings. */
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

export const corporateConfig: TemplateConfig = {
  template: corporateTemplate,
  extended: corporateExtendedConfig,
};
