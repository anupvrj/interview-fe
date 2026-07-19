/**
 * Mercury Template Configuration
 *
 * Professional template with profile picture header and slab serif typography.
 * Features cream header background and light gray section headers.
 *
 * @template mercury
 * @category simple
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

/**
 * Base Template Configuration
 */
export const mercuryTemplate: ResumeTemplate = {
  id: "mercury",
  name: "Mercury",
  category: "simple",
  description:
    "Professional template with profile picture and slab serif typography",
  preview: "/resume-template-images/mercury-preview.webp",
  colors: {
    primary: "#3d3d3d",
    secondary: "#5a5a5a",
    accent: "#666666",
    text: "#3d3d3d",
    background: "#ffffff",
    headerBackground: "#e5e6e3",
  },
  layout: {
    headerStyle: "full-width",
    sectionSpacing: 14,
    fontFamily:
      "'Rockwell Std', 'Zilla Slab', 'Roboto Slab', Rockwell, 'Courier New', serif",
    fontSize: {
      heading: 32,
      subheading: 18,
      body: 11,
    },
  },
  atsOptimized: true,
};

/**
 * Extended Configuration
 */
export const mercuryExtendedConfig: Partial<ExtendedResumeTemplate> = {
  style: {
    fontFamily:
      "'Rockwell Std', 'Zilla Slab', 'Roboto Slab', Rockwell, 'Courier New', serif",
    fontSize: { heading: 32, subheading: 18, body: 11, small: 11 },
    lineHeight: 1.5,
    colors: {
      primary: "#3d3d3d",
      secondary: "#5a5a5a",
      accent: "#666666",
      text: "#3d3d3d",
      background: "#ffffff",
      headerBackground: "#e5e6e3",
    },
    headerStyle: "full-width",
    sectionSpacing: 14,
    padding: { top: 0, bottom: 20, left: 0, right: 0 },
    sectionHeader: {
      style: "background",
      backgroundColor: "#f2f2f2",
      textAlign: "center",
      fontSize: 13,
      fontWeight: "bold",
      marginBottom: "15px",
      paddingTop: "8px",
      paddingBottom: "8px",
      paddingLeft: "0px",
      paddingRight: "0px",
      textTransform: "none",
      borderRadius: "0px",
      letterSpacing: "0.3px",
    },
    useCSSClassesForHeader: true,
    skillsDisplay: {
      type: "bullets",
      showRatings: false,
      columns: 3,
      customBulletSize: 6,
    },
    timelineLayout: {
      type: "grid",
      datePosition: "left",
      dateWidth: 160,
      applyInlineGrid: false,
    },
    contactDisplay: {
      type: "icons",
      layout: "vertical",
    },
    headerLayout: {
      type: "with-profile-picture",
      padding: { top: 40, bottom: 40, left: 55, right: 55 },
    },
    languageDisplay: {
      showRatings: true,
      ratingType: "dots",
      maxRating: 5,
      dotSize: 10,
      columns: 2,
      containerClass: "mercury-languages-container",
      itemClass: "mercury-language-item",
      nameClass: "mercury-language-name",
      ratingClass: "mercury-language-rating",
      dotClass: "mercury-language-dot",
    },
  },
  rendering: {
    pageBreak: {
      enabled: true,
      calculateDynamically: true,
    },
    /** Page 1 is flush; page 2+ use 5mm top gutter (see MERCURY_CONTINUATION_TOP_MM). */
    continuationPageTopPaddingMm: 5,
    dataStructure: "legacy",
    features: {
      showPresent: true,
      customHeader: true,
    },
    layout: {
      type: "single",
      columnWidths: {
        left: 100,
        right: 0,
      },
    },
  },
  defaultSectionOrder: [
    {
      id: "personalInfo",
      type: "personalInfo",
      title: "Personal Information",
      visible: true,
    },
    {
      id: "profileSummary",
      type: "profileSummary",
      title: "Profile",
      visible: true,
    },
    {
      id: "experience",
      type: "experience",
      title: "Work Experience",
      visible: true,
    },
    {
      id: "education",
      type: "education",
      title: "Education",
      visible: true,
    },
    {
      id: "skills",
      type: "skills",
      title: "Skills",
      visible: true,
    },
    {
      id: "languages",
      type: "languages",
      title: "Languages",
      visible: true,
    },
    {
      id: "awards",
      type: "awards",
      title: "Awards",
      visible: true,
    },
  ],
};

/**
 * Complete Template Configuration Export
 */
export const mercuryConfig: TemplateConfig = {
  template: mercuryTemplate,
  extended: mercuryExtendedConfig,
};

export default mercuryConfig;
