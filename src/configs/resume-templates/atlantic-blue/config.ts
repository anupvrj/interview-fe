/**
 * Atlantic Blue Template Configuration
 * 
 * A modern two-column template with a distinctive blue sidebar.
 * Features a professional layout with sidebar for contact info and skills.
 * 
 * @template atlantic-blue
 * @category modern
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

/**
 * Base Template Configuration
 * Defines core metadata and basic styling
 */
export const atlanticblueTemplate: ResumeTemplate = {
  id: "atlantic-blue",
  name: "Atlantic Blue",
  category: "modern",
  description: "Modern two-column template with blue sidebar",
  preview: "/resume-template-images/atlantic-blue-preview.webp",
  colors: {
    primary: "#2c3e50",
    secondary: "#3498db",
    accent: "#3498db",
    text: "#000000",
    background: "#ffffff",
    sidebarBackground: "#2c3e50",
    sidebarText: "#ffffff",
    sectionHeaderBg: "#ecf0f1",
  },
  layout: {
    headerStyle: "two-column",
    sectionSpacing: 10,
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: {
      heading: 22,
      subheading: 16,
      body: 11,
    },
  },
  atsOptimized: true,
};

/**
 * Extended Configuration
 * Detailed styling and rendering rules
 */
export const atlanticblueExtendedConfig: Partial<ExtendedResumeTemplate> = {
  // Minimal style config for renderer (detailed CSS in style.css)
  style: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: { heading: 22, subheading: 16, body: 11, small: 10 },
    lineHeight: 1.4,
    colors: {
      primary: "#2c3e50",
      secondary: "#3498db",
      accent: "#3498db",
      text: "#000000",
      background: "#ffffff",
      sidebarBackground: "#2c3e50",
      sidebarText: "#ffffff",
      sectionHeaderBg: "#ecf0f1",
    },
    headerStyle: "two-column",
    sectionSpacing: 10,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
    sectionHeader: {
      style: "background",
      backgroundColor: "#ecf0f1",
      textAlign: "center",
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: "12px",
      paddingBottom: "8px",
      paddingTop: "8px",
      textTransform: "uppercase",
    },
    skillsDisplay: { type: "list", showRatings: false },
    timelineLayout: { type: "vertical", datePosition: "right" },
    contactDisplay: { type: "icons", layout: "vertical" },
  },
  rendering: {
    pageBreak: {
      enabled: true,
      calculateDynamically: true,
    },
    dataStructure: "legacy",
    features: {
      twoColumnLayout: true,
      showPresent: true,
      showRatingDots: true,
    },
    layout: {
      type: "double",
      columnWidths: {
        left: 35,
        right: 65,
      },
      columnAssignment: {
        left: ["personalInfo", "skills", "languages"],
        right: ["profileSummary", "experience", "education", "projects", "certificates"],
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
      title: "Professional Experience",
      visible: true,
    },
    {
      id: "skills",
      type: "skills",
      title: "Skills",
      visible: true,
    },
    {
      id: "education",
      type: "education",
      title: "Education",
      visible: true,
    },
    {
      id: "projects",
      type: "projects",
      title: "Projects",
      visible: true,
    },
    {
      id: "certificates",
      type: "certificates",
      title: "Certifications",
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
      visible: false,
    },
    {
      id: "interests",
      type: "interests",
      title: "Interests",
      visible: false,
    },
  ],
};

/**
 * Complete Template Configuration Export
 */
export const atlanticblueConfig: TemplateConfig = {
  template: atlanticblueTemplate,
  extended: atlanticblueExtendedConfig,
};

