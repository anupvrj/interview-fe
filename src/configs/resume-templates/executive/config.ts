/**
 * Executive Template Configuration
 * 
 * A sophisticated template with Times New Roman font and elegant styling.
 * Features grid-based timeline layout and professional formatting.
 * 
 * @template executive
 * @category simple
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

export const executiveTemplate: ResumeTemplate = {
  id: "executive",
  name: "Executive",
  category: "simple",
  description: "Sophisticated template with classic serif typography",
  preview: "/resume-template-images/executive-preview.webp",
  colors: {
    primary: "#000000",
    secondary: "#333333",
    accent: "#666666",
    text: "#000000",
    background: "#ffffff",
  },
  layout: {
    headerStyle: "left",
    sectionSpacing: 8,
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: {
      heading: 28,
      subheading: 20,
      body: 10,
    },
  },
  atsOptimized: true,
};

export const executiveExtendedConfig: Partial<ExtendedResumeTemplate> = {
  // Minimal style config for renderer (detailed CSS in style.css)
  style: {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: { heading: 28, subheading: 20, body: 10, small: 9 },
    lineHeight: 1.4,
    colors: {
      primary: "#000000",
      secondary: "#333333",
      accent: "#666666",
      text: "#000000",
      background: "#ffffff",
    },
    headerStyle: "left",
    sectionSpacing: 8,
    padding: { top: 8, bottom: 8, left: 8, right: 8 },
    sectionHeader: {
      style: "border-bottom",
      borderWidth: 3,
      borderColor: "#000000",
      textAlign: "left",
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: "8px",
      paddingBottom: "4px",
      textTransform: "none",
    },
    skillsDisplay: { type: "dots", showRatings: true, maxRating: 5, columns: 2 },
    timelineLayout: { type: "grid", datePosition: "left", dateWidth: 140 },
    contactDisplay: { type: "icons", layout: "grid" },
  },
  rendering: {
    pageBreak: {
      enabled: true,
      calculateDynamically: true,
    },
    dataStructure: "hybrid",
    features: {
      showRatingDots: true,
      showSkillLevels: true,
      customHeader: true,
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

export const executiveConfig: TemplateConfig = {
  template: executiveTemplate,
  extended: executiveExtendedConfig,
};

