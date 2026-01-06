/**
 * Clean Slate Template Configuration
 * 
 * A clean, professional single-column template with classic styling.
 * Features centered section headers with top and bottom borders.
 * 
 * @template clean-slate
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
export const cleanslateTemplate: ResumeTemplate = {
  id: "clean-slate",
  name: "Clean Slate",
  category: "simple",
  description: "Clean professional layout with classic styling",
  preview: "/resume-template-images/clean-slate-preview.webp",
  colors: {
    primary: "#000000",
    secondary: "#333333",
    accent: "#555555",
    text: "#000000",
    background: "#ffffff",
  },
  layout: {
    headerStyle: "left",
    sectionSpacing: 10,
    fontFamily: "Arial, sans-serif",
    fontSize: {
      heading: 28,
      subheading: 16,
      body: 11,
    },
  },
  atsOptimized: true,
};

/**
 * Extended Configuration
 */
export const cleanslateExtendedConfig: Partial<ExtendedResumeTemplate> = {
  // Minimal style config for renderer (detailed CSS in style.css)
  style: {
    fontFamily: "Arial, sans-serif",
    fontSize: { heading: 28, subheading: 16, body: 11, small: 9 },
    lineHeight: 1.4,
    colors: {
      primary: "#000000",
      secondary: "#333333",
      accent: "#555555",
      text: "#000000",
      background: "#ffffff",
    },
    headerStyle: "left",
    sectionSpacing: 10,
    padding: { top: 20, bottom: 20, left: 20, right: 20 },
    sectionHeader: {
      style: "border-top-bottom",
      borderWidth: 1,
      borderColor: "#000000",
      textAlign: "center",
      fontSize: 13,
      fontWeight: "bold",
      marginBottom: "12px",
      paddingTop: "8px",
      paddingBottom: "8px",
      textTransform: "uppercase",
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
      id: "skills",
      type: "skills",
      title: "Technical Skills",
      visible: true,
    },
    {
      id: "experience",
      type: "experience",
      title: "Professional Experience",
      visible: true,
    },
    {
      id: "education",
      type: "education",
      title: "Education",
      visible: true,
    },
    {
      id: "certificates",
      type: "certificates",
      title: "Certifications",
      visible: true,
    },
    {
      id: "projects",
      type: "projects",
      title: "Key Technical Projects",
      visible: true,
    },
    {
      id: "interests",
      type: "interests",
      title: "Interests & Activities",
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
export const cleanslateConfig: TemplateConfig = {
  template: cleanslateTemplate,
  extended: cleanslateExtendedConfig,
};

