/**
 * Professional Classic Template Configuration
 *
 * A clean, single-column, ATS-friendly professional resume template.
 *
 * @template professional-classic
 * @category classic
 */

import {
    ResumeTemplate,
    ExtendedResumeTemplate,
    TemplateConfig,
  } from "../template-types";
  
  /**
   * Base Template Configuration
   */
  export const professionalClassicTemplate: ResumeTemplate = {
    id: "professional-classic",
    name: "Professional Classic",
    category: "classic",
    description: "Clean single-column professional resume optimized for ATS",
    preview: "/resume-template-images/professional-classic-preview.webp",
    colors: {
      primary: "#000000",
      secondary: "#333333",
      accent: "#000000",
      text: "#000000",
      background: "#ffffff",
      sectionHeaderBg: "transparent",
    },
    layout: {
      headerStyle: "single-column",
      sectionSpacing: 14,
      fontFamily: "'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
      fontSize: {
        heading: 26,
        subheading: 16,
        body: 11,
      },
    },
    atsOptimized: true,
  };
  
  /**
   * Extended Configuration
   */
  export const professionalClassicExtendedConfig: Partial<ExtendedResumeTemplate> = {
    style: {
      fontFamily: "'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
      fontSize: { heading: 26, subheading: 16, body: 11, small: 10 },
      lineHeight: 1.5,
      colors: {
        primary: "#000000",
        secondary: "#333333",
        accent: "#000000",
        text: "#000000",
        background: "#ffffff",
      },
      headerStyle: "single-column",
      sectionSpacing: 14,
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
      sectionHeader: {
        style: "plain",
        textAlign: "left",
        fontSize: 13,
        fontWeight: "bold",
        marginBottom: "8px",
        paddingBottom: "4px",
        paddingTop: "0",
        paddingLeft: "0",
        paddingRight: "0",
        textTransform: "none",
        borderWidth: 0,
        borderColor: "transparent",
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
        twoColumnLayout: false,
        showPresent: true,
        showRatingDots: false,
      },
      layout: {
        type: "single",
      },
    },
    defaultSectionOrder: [
      { id: "personalInfo", type: "personalInfo", title: "Personal Information", visible: true },
      { id: "profileSummary", type: "profileSummary", title: "Summary", visible: true },
      { id: "experience", type: "experience", title: "Experience", visible: true },
      { id: "projects", type: "projects", title: "Projects", visible: true },
      { id: "skills", type: "skills", title: "Skills", visible: true },
      { id: "education", type: "education", title: "Education", visible: true },
      { id: "certificates", type: "certificates", title: "Certifications", visible: true },
      { id: "languages", type: "languages", title: "Languages", visible: true },
      { id: "awards", type: "awards", title: "Awards", visible: false },
      { id: "interests", type: "interests", title: "Interests", visible: false },
    ],
  };
  
  /**
   * Complete Template Export
   */
  export const professionalClassicConfig: TemplateConfig = {
    template: professionalClassicTemplate,
    extended: professionalClassicExtendedConfig,
  };
  
  export default professionalClassicConfig;
  