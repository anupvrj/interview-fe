/**
 * Rhino Resume Template Configuration
 *
 * A clean professional two-column template with a strong blue sidebar.
 *
 * @template rhino
 * @category modern
 */

import {
    ResumeTemplate,
    ExtendedResumeTemplate,
    TemplateConfig,
} from "../template-types";

export const rhinoTemplate: ResumeTemplate = {
    id: "rhino",
    name: "Rhino",
    category: "modern",
    description: "Professional two-column resume with strong sidebar emphasis",
    preview: "/resume-template-images/rhino-preview.webp",
    colors: {
        primary: "#0f4c75",
        secondary: "#3282b8",
        accent: "#3282b8",
        text: "#000000",
        background: "#ffffff",
        sidebarBackground: "#0f4c75",
        sidebarText: "#ffffff",
        sectionHeaderBg: "#f2f4f6",
    },
    layout: {
        headerStyle: "two-column",
        sectionSpacing: 12,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        fontSize: {
            heading: 26,
            subheading: 14,
            body: 11,
        },
    },
    atsOptimized: true,
};

export const rhinoExtendedConfig: Partial<ExtendedResumeTemplate> = {
    style: {
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        fontSize: { heading: 26, subheading: 14, body: 11, small: 10 },
        lineHeight: 1.45,
        colors: {
            primary: "#0e3c5e", // Dark Navy Blue
            secondary: "#444444",
            accent: "#0e3c5e",
            text: "#333333",
            background: "#ffffff",
            sidebarBackground: "#0e3c5e",
            sidebarText: "#ffffff",
            sectionHeaderBg: "transparent", // Removing grey bg
        },
        headerStyle: "two-column",
        sectionSpacing: 18,
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        sectionHeader: {
            style: "border-bottom",
            backgroundColor: "transparent",
            textAlign: "left",
            fontSize: 14,
            fontWeight: "bold",
            textTransform: "uppercase",
            paddingTop: "0",
            paddingBottom: "6px",
            paddingLeft: "0",
            paddingRight: "0",
            marginBottom: "16px",
            borderWidth: 1,
            borderColor: "#cccccc",
        },
        skillsDisplay: { type: "list", columns: 1, showRatings: true },
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
                left: 32,
                right: 68,
            },
            columnAssignment: {
                left: [],
                right: [],
            },
        },
    },
    defaultSectionOrder: [
        { id: "personalInfo", type: "personalInfo", title: "Contact", visible: true },
        { id: "profileSummary", type: "profileSummary", title: "Profile", visible: true },
        { id: "skills", type: "skills", title: "Skills", visible: true },
        { id: "education", type: "education", title: "Education", visible: true },
        { id: "certificates", type: "certificates", title: "Certifications", visible: true },
        { id: "experience", type: "experience", title: "Work Experience", visible: true },
        { id: "languages", type: "languages", title: "Languages", visible: true },
    ],
};

export const rhinoConfig: TemplateConfig = {
    template: rhinoTemplate,
    extended: rhinoExtendedConfig,
};

export default rhinoConfig;
