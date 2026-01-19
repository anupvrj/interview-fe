/**
 * Classic Template Configuration
 *
 * Traditional resume template with Times New Roman font and centered header.
 * Features classic styling with border-bottom section headers.
 *
 * @template classic
 * @category simple
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

export const classicTemplate: ResumeTemplate = {
  id: "classic",
  name: "Classic",
  category: "simple",
  description: "Traditional resume with timeless design",
  preview: "/resume-template-images/classic-preview.webp",
  colors: {
    primary: "#000000",
    secondary: "#666666",
    accent: "#333333",
    text: "#000000",
    background: "#ffffff",
  },
  layout: {
    headerStyle: "centered",
    sectionSpacing: 10,
    fontFamily: "'Zilla Slab', serif",
    fontSize: {
      heading: 28,
      subheading: 14,
      body: 10.5,
    },
  },
  atsOptimized: true,
};

export const classicExtendedConfig: Partial<ExtendedResumeTemplate> = {
  // Minimal style config for renderer (detailed CSS in style.css)
  style: {
    fontFamily: "'Zilla Slab', serif",
    fontSize: { heading: 28, subheading: 14, body: 10.5, small: 9.5 },
    lineHeight: 1.4,
    colors: {
      primary: "#000000",
      secondary: "#000000",
      accent: "#333333",
      text: "#000000",
      background: "#ffffff",
    },
    headerStyle: "centered",
    sectionSpacing: 10,
    padding: { top: 8, bottom: 8, left: 8, right: 8 },
    sectionHeader: {
      style: "border-bottom",
      borderWidth: 1.5,
      borderColor: "#000000",
      textAlign: "left",
      fontSize: 11,
      fontWeight: "bold",
      marginBottom: "8px",
      paddingBottom: "3px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    skillsDisplay: { type: "list", showRatings: false },
    timelineLayout: { type: "vertical", datePosition: "right" },
    contactDisplay: { type: "icons", layout: "horizontal" },
  },
  rendering: {
    pageBreak: {
      enabled: true,
      calculateDynamically: true,
    },
    dataStructure: "legacy",
    features: {
      showRatingDots: true,
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

export const classicConfig: TemplateConfig = {
  template: classicTemplate,
  extended: classicExtendedConfig,
};

/**
 * Default export for dynamic imports
 */
export default classicConfig;
