/**
 * Mercury Template Configuration
 * 
 * ATS-optimized template with clean design and grid-based timeline layout.
 * Features light grey section headers and 20mm padding for professional appearance.
 * 
 * @template mercury
 * @category simple
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

export const mercuryTemplate: ResumeTemplate = {
  id: "mercury",
  name: "Mercury",
  category: "simple",
  description: "ATS-optimized template with clean, professional design",
  preview: "/resume-template-images/mercury-preview.webp",
  colors: {
    primary: "#374151",
    secondary: "#6b7280",
    accent: "#9ca3af",
    text: "#111827",
    background: "#ffffff",
    headerBackground: "#f5f5f5",
  },
  layout: {
    headerStyle: "left",
    sectionSpacing: 20,
    fontFamily: "Arial, Calibri, sans-serif",
    fontSize: {
      heading: 24,
      subheading: 16,
      body: 11,
    },
  },
  atsOptimized: true,
};

export const mercuryExtendedConfig: Partial<ExtendedResumeTemplate> = {
  // Minimal style config for renderer (detailed CSS in style.css)
  style: {
    fontFamily: "Arial, Calibri, sans-serif",
    fontSize: { heading: 24, subheading: 16, body: 11, small: 10 },
    lineHeight: 1.5,
    colors: {
      primary: "#374151",
      secondary: "#6b7280",
      accent: "#9ca3af",
      text: "#111827",
      background: "#ffffff",
      headerBackground: "#f5f5f5",
    },
    headerStyle: "left",
    sectionSpacing: 20,
    padding: { top: 20, bottom: 20, left: 20, right: 20 },
    sectionHeader: {
      style: "background",
      backgroundColor: "#f5f5f5",
      textAlign: "center",
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: "12px",
      paddingTop: "8px",
      paddingBottom: "8px",
      paddingLeft: "12px",
      paddingRight: "12px",
      textTransform: "uppercase",
      borderRadius: "0px",
      letterSpacing: "0.5px",
    },
    skillsDisplay: { type: "list", showRatings: false },
    timelineLayout: { type: "grid", datePosition: "left", dateWidth: 180 },
    contactDisplay: { type: "icons", layout: "horizontal" },
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

export const mercuryConfig: TemplateConfig = {
  template: mercuryTemplate,
  extended: mercuryExtendedConfig,
};

