/**
 * Berlin Resume Template Configuration
 *
 * Minimal, editorial-style resume with strong typography
 * and clean left-right separation.
 *
 * @template berlin
 * @category simple
 */

import {
    ResumeTemplate,
    ExtendedResumeTemplate,
    TemplateConfig,
} from "../template-types";

export const berlinTemplate: ResumeTemplate = {
    id: "berlin",
    name: "Berlin",
    category: "simple",
    description: "Minimal editorial resume with clean typography and dividers",
    preview: "/resume-template-images/berlin-preview.webp",
    colors: {
        primary: "#000000",
        secondary: "#666666",
        accent: "#000000",
        text: "#000000",
        background: "#ffffff",
        sidebarBackground: "#ffffff",
        sidebarText: "#000000",
        sectionHeaderBg: "#ffffff",
    },
    layout: {
        headerStyle: "single-column",
        sectionSpacing: 14,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        fontSize: {
            heading: 30,
            subheading: 14,
            body: 11,
        },
    },
    atsOptimized: true,
};

export const berlinExtendedConfig: Partial<ExtendedResumeTemplate> = {
    style: {
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        fontSize: { heading: 30, subheading: 14, body: 11, small: 10 },
        lineHeight: 1.6,
        colors: {
            primary: "#000000",
            secondary: "#666666",
            accent: "#000000",
            text: "#000000",
            background: "#ffffff",
            sidebarBackground: "#ffffff",
            sidebarText: "#000000",
            sectionHeaderBg: "#ffffff",
        },
        headerStyle: "left",
        sectionSpacing: 14,
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        sectionHeader: {
            style: "border-bottom",
            backgroundColor: "transparent",
            textAlign: "left",
            fontSize: 13,
            fontWeight: "bold",
            textTransform: "uppercase",
            paddingBottom: "6px",
            marginBottom: "14px",
            borderWidth: 2,
            borderColor: "#000000",
        },
        skillsDisplay: {
            type: "bars",
            showRatings: true,
            layout: "columns"
        },
        timelineLayout: { type: "vertical", datePosition: "right" },
        contactDisplay: { type: "text", layout: "vertical" },
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
            showRatingDots: false,
        },
        layout: {
            type: "header-plus-columns",
            columnWidths: {
                left: 30,
                right: 70,
            },
            columnAssignment: {
                left: ["personalInfo", "skills", "languages"],
                right: ["profileSummary", "experience", "education"],
            },
        },
    },
    defaultSectionOrder: [
        { id: "personalInfo", type: "personalInfo", title: "Details", visible: true },
        { id: "profileSummary", type: "profileSummary", title: "Profile", visible: true },
        { id: "experience", type: "experience", title: "Employment History", visible: true },
        { id: "education", type: "education", title: "Education", visible: true },
        { id: "skills", type: "skills", title: "Skills", visible: true },
        { id: "languages", type: "languages", title: "Languages", visible: true },
    ],
};

export const berlinConfig: TemplateConfig = {
    template: berlinTemplate,
    extended: berlinExtendedConfig,
};

export default berlinConfig;
