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
    sectionSpacing: 12,
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: {
      heading: 32,
      subheading: 24,
      body: 11,
    },
  },
  atsOptimized: true,
};

export const executiveExtendedConfig: Partial<ExtendedResumeTemplate> = {
  // Minimal style config for renderer (detailed CSS in style.css)
  style: {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: { heading: 32, subheading: 24, body: 11, small: 10 },
    lineHeight: 1.5,
    colors: {
      primary: "#000000",
      secondary: "#000000",
      accent: "#000000",
      text: "#000000",
      background: "#ffffff",
    },
    headerStyle: "left",
    sectionSpacing: 12,
    padding: { top: 20, bottom: 20, left: 20, right: 20 },
    sectionHeader: {
      style: "border-bottom",
      borderWidth: 3,
      borderColor: "#000000",
      textAlign: "left",
      fontSize: 13,
      fontWeight: "bold",
      marginBottom: "10px",
      paddingBottom: "2px",
      textTransform: "none",
    },
    skillsDisplay: { type: "dots", showRatings: true, maxRating: 5, columns: 2 },
    timelineLayout: { type: "grid", datePosition: "left", dateWidth: 140 },
    contactDisplay: { type: "icons", layout: "grid" },
    headerLayout: {
      type: "name-title-split",
      titlePosition: "right",
    },
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

export default executiveConfig;

