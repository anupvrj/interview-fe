/**
 * Template Configurations
 * Maps template IDs to their extended rendering configurations
 * This allows adding 50+ templates without hardcoded if-else statements
 */

import {
  ExtendedResumeTemplate,
  TemplateStyleConfig,
} from "./templateRenderer";

/**
 * Template configuration registry
 * Add new templates here - no code changes needed elsewhere!
 */
export const TEMPLATE_CONFIGS: Record<
  string,
  Partial<ExtendedResumeTemplate>
> = {
  executive: {
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
      },
      skillsDisplay: {
        type: "dots",
        showRatings: true,
        maxRating: 5,
        columns: 2,
      },
      timelineLayout: {
        type: "grid",
        datePosition: "left",
        dateWidth: 140,
      },
      contactDisplay: {
        type: "icons",
        layout: "grid",
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
      },
    },
  },

  "clean-slate": {
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
      headerStyle: "left", // Clean slate specific: left-aligned header
      sectionSpacing: 10,
      padding: { top: 20, bottom: 20, left: 20, right: 20 },
      sectionHeader: {
        style: "border-top-bottom",
        borderWidth: 1,
        borderColor: "#000000",
        textAlign: "center", // Clean slate specific: centered section headers
        fontSize: 13,
        fontWeight: "bold",
        marginBottom: "12px",
        paddingTop: "8px",
        paddingBottom: "8px",
        textTransform: "uppercase", // Clean slate specific: uppercase headers
      },
      skillsDisplay: {
        type: "list", // Clean slate specific: list format for skills
        showRatings: false,
      },
      timelineLayout: {
        type: "vertical",
        datePosition: "right", // Clean slate specific: dates on right
      },
      contactDisplay: {
        type: "icons", // Clean slate specific: icons for contact
        layout: "horizontal",
      },
    },
    layout: {
      fontFamily: "Arial, sans-serif",
      fontSize: { heading: 28, subheading: 16, body: 11 },
      headerStyle: "left",
      sectionSpacing: 10,
    },
    rendering: {
      pageBreak: {
        enabled: true,
        calculateDynamically: true,
      },
      dataStructure: "legacy",
      features: {},
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
      { id: "education", type: "education", title: "Education", visible: true },
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
      { id: "languages", type: "languages", title: "Languages", visible: true },
      { id: "awards", type: "awards", title: "Awards", visible: true },
      // Additional sections that can be added
      { id: "courses", type: "courses", title: "Courses", visible: false },
      {
        id: "organisations",
        type: "organisations",
        title: "Organizations",
        visible: false,
      },
      {
        id: "publications",
        type: "publications",
        title: "Publications",
        visible: false,
      },
      {
        id: "references",
        type: "references",
        title: "References",
        visible: false,
      },
      {
        id: "declaration",
        type: "declaration",
        title: "Declaration",
        visible: false,
      },
    ],
  },

  classic: {
    style: {
      fontFamily: "'Times New Roman', Times, serif",
      fontSize: { heading: 24, subheading: 16, body: 11, small: 10 },
      lineHeight: 1.4,
      colors: {
        primary: "#000000",
        secondary: "#666666",
        accent: "#333333",
        text: "#000000",
        background: "#ffffff",
      },
      headerStyle: "centered",
      sectionSpacing: 9,
      padding: { top: 8, bottom: 8, left: 8, right: 8 },
      sectionHeader: {
        style: "border-bottom",
        borderWidth: 1,
        borderColor: "#000000",
        textAlign: "left",
        fontSize: 13,
        fontWeight: "bold",
        marginBottom: "8px",
        paddingBottom: "4px",
        textTransform: "uppercase",
      },
      skillsDisplay: {
        type: "list",
        showRatings: false,
      },
      timelineLayout: {
        type: "vertical",
        datePosition: "right",
      },
      contactDisplay: {
        type: "icons",
        layout: "horizontal",
      },
    },
    rendering: {
      pageBreak: {
        enabled: true,
        calculateDynamically: true,
      },
      dataStructure: "legacy",
      features: {
        showRatingDots: true,
      },
    },
  },

  corporate: {
    style: {
      fontFamily: "'Times New Roman', Times, serif", // Body text uses serif
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
      padding: { top: 8, bottom: 8, left: 8, right: 8 },
      sectionHeader: {
        style: "border-top-bottom",
        borderWidth: 2,
        borderColor: "#000000",
        textAlign: "center",
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: "10px",
        paddingTop: "6px",
        paddingBottom: "6px",
        textTransform: "uppercase",
      },
      skillsDisplay: {
        type: "list",
        showRatings: false,
      },
      timelineLayout: {
        type: "vertical",
        datePosition: "right", // Dates aligned to the right
      },
      contactDisplay: {
        type: "text", // No icons, just text with separators
        layout: "horizontal",
      },
    },
    rendering: {
      pageBreak: {
        enabled: true,
        calculateDynamically: true,
      },
      dataStructure: "legacy",
      features: {
        showPresent: true, // Show "Present" for current roles
      },
    },
  },

  harvard: {
    style: {
      fontFamily: "Garamond, 'Times New Roman', serif",
      fontSize: { heading: 22, subheading: 16, body: 11, small: 10 },
      lineHeight: 1.4,
      colors: {
        primary: "#000000", // Black like other templates
        secondary: "#5a5a5a",
        accent: "#000000",
        text: "#000000",
        background: "#ffffff",
      },
      headerStyle: "centered",
      sectionSpacing: 9,
      padding: { top: 8, bottom: 8, left: 8, right: 8 },
      sectionHeader: {
        style: "border-bottom",
        borderWidth: 1,
        borderColor: "#000000", // Black border
        textAlign: "left",
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: "8px",
        paddingBottom: "4px",
        textTransform: "uppercase",
      },
      skillsDisplay: {
        type: "list",
        showRatings: false,
        columns: 3, // Multi-column layout for skills
      },
      timelineLayout: {
        type: "vertical",
        datePosition: "right",
      },
      contactDisplay: {
        type: "text", // Simple text, no icons
        layout: "horizontal",
      },
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
    },
  },

  "true-blue": {
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
      skillsDisplay: {
        type: "list",
        showRatings: false,
      },
      timelineLayout: {
        type: "vertical",
        datePosition: "right",
      },
      contactDisplay: {
        type: "text", // Simple text, no icons
        layout: "horizontal",
      },
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
    },
  },

  "atlantic-blue": {
    style: {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: { heading: 22, subheading: 16, body: 11, small: 10 },
      lineHeight: 1.4,
      colors: {
        primary: "#2c3e50", // Dark blue for sidebar
        secondary: "#3498db", // Lighter blue for accents
        accent: "#3498db",
        text: "#000000",
        background: "#ffffff",
        sidebarBackground: "#2c3e50", // Sidebar background
        sidebarText: "#ffffff", // Sidebar text color
        sectionHeaderBg: "#ecf0f1", // Light gray for main content section headers
      },
      headerStyle: "two-column",
      sectionSpacing: 10,
      padding: { top: 0, bottom: 0, left: 0, right: 0 }, // Zero padding for full-width layout
      sectionHeader: {
        style: "background",
        backgroundColor: "#ecf0f1", // Light gray for main content
        textAlign: "center",
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: "12px",
        paddingBottom: "8px",
        paddingTop: "8px",
        textTransform: "uppercase",
      },
      skillsDisplay: {
        type: "list",
        showRatings: false,
      },
      timelineLayout: {
        type: "vertical",
        datePosition: "right",
      },
      contactDisplay: {
        type: "icons",
        layout: "vertical",
      },
    },
    layout: {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: { heading: 22, subheading: 16, body: 11 },
      headerStyle: "two-column", // Atlantic Blue specific: two-column header
      sectionSpacing: 10,
    },
    rendering: {
      pageBreak: {
        enabled: true,
        calculateDynamically: true,
      },
      dataStructure: "legacy",
      features: {
        showPresent: true,
        showRatingDots: true, // For languages
        twoColumnLayout: true, // Sidebar layout
      },
    },
  },

  mercury: {
    style: {
      fontFamily: "Arial, Calibri, sans-serif", // ATS-friendly fonts
      fontSize: { heading: 24, subheading: 16, body: 11, small: 10 },
      lineHeight: 1.5,
      colors: {
        primary: "#374151",
        secondary: "#6b7280",
        accent: "#9ca3af",
        text: "#111827",
        background: "#ffffff",
        headerBackground: "#f5f5f5", // Light grey for header background
      },
      headerStyle: "left", // Single column with header at top
      sectionSpacing: 20,
      padding: { top: 20, bottom: 20, left: 20, right: 20 }, // 20mm padding
      sectionHeader: {
        style: "background",
        backgroundColor: "#f5f5f5", // Light grey background
        textAlign: "center",
        fontSize: 14, // Consistent font size for all headers
        fontWeight: "bold", // Consistent bold formatting
        marginBottom: "12px",
        paddingTop: "8px",
        paddingBottom: "8px",
        paddingLeft: "12px",
        paddingRight: "12px",
        textTransform: "uppercase",
        borderRadius: "0px", // Consistent rectangular headers
        letterSpacing: "0.5px", // Better readability for uppercase text
      },
      skillsDisplay: {
        type: "list",
        showRatings: false,
      },
      timelineLayout: {
        type: "grid", // Two-column layout for Mercury: date/location on left, content on right
        datePosition: "left",
        dateWidth: 180, // Width for date and location column
      },
      contactDisplay: {
        type: "icons",
        layout: "horizontal",
      },
    },
    layout: {
      fontFamily: "Arial, Calibri, sans-serif", // ATS-friendly fonts
      fontSize: { heading: 24, subheading: 16, body: 11 },
      headerStyle: "left",
      sectionSpacing: 20,
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
    },
    // Hard-coded section order for Mercury template
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
  },

  // Add more templates here - they'll automatically work!
};

/**
 * Get extended template configuration
 * Merges base template with extended config
 */
export function getExtendedTemplate(baseTemplate: any): ExtendedResumeTemplate {
  const config = TEMPLATE_CONFIGS[baseTemplate.id] || {};

  return {
    ...baseTemplate,
    style: config.style,
    rendering: config.rendering,
    defaultSectionOrder: config.defaultSectionOrder,
  };
}

/**
 * Check if template has a specific feature
 */
export function hasFeature(templateId: string, feature: string): boolean {
  const config = TEMPLATE_CONFIGS[templateId];
  return (
    config?.rendering?.features?.[
      feature as keyof typeof config.rendering.features
    ] === true
  );
}

/**
 * Get template style configuration
 */
export function getTemplateStyleConfig(
  templateId: string
): TemplateStyleConfig | null {
  const config = TEMPLATE_CONFIGS[templateId];
  return config?.style || null;
}
