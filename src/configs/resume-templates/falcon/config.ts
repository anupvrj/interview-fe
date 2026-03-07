/**
 * Falcon Resume Template
 *
 * Clean, ATS-first resume template with
 * icon-based contact line and pixel-perfect spacing.
 *
 * @template falcon
 * @category simple
 */

import {
    ResumeTemplate,
    ExtendedResumeTemplate,
    TemplateConfig,
} from "../template-types";

/* ---------- Base Template ---------- */

export const falconTemplate: ResumeTemplate = {
    id: "falcon",
    name: "Falcon",
    category: "simple",
    description:
        "A clean, ATS-optimized resume template with icon-based contact details and precise spacing.",
    preview: "/resume-template-images/falcon-preview.webp",
    colors: {
        primary: "#000000",
        secondary: "#555555",
        accent: "#000000",
        text: "#000000",
        background: "#ffffff",
    },
    layout: {
        headerStyle: "left",
        sectionSpacing: 14,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: {
            heading: 20,
            subheading: 14,
            body: 12,
        },
    },
    atsOptimized: true,
};

/* ---------- Extended Configuration ---------- */

export const falconExtended: Partial<ExtendedResumeTemplate> = {
    style: {
        fontFamily: "Arial, Helvetica, sans-serif",
        lineHeight: 1.48,
        fontSize: {
            heading: 20,
            subheading: 14,
            body: 12,
            small: 10,
        },
        colors: {
            primary: "#000000",
            secondary: "#555555",
            accent: "#000000",
            text: "#000000",
            background: "#ffffff",
        },

        headerStyle: "left",
        sectionSpacing: 14,
        padding: { top: 10, bottom: 10, left: 10, right: 10 },

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
            columns: 2,
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

        useCSSClassesForHeader: false,
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
        { id: "personalInfo", type: "personalInfo", title: "Personal Information", visible: true },
        { id: "profileSummary", type: "profileSummary", title: "Summary", visible: true },
        { id: "experience", type: "experience", title: "Experience", visible: true },
        { id: "education", type: "education", title: "Education", visible: true },
        { id: "skills", type: "skills", title: "Skills", visible: true },
        { id: "projects", type: "projects", title: "Projects", visible: true },
        { id: "languages", type: "languages", title: "Languages", visible: true },
    ],
};

/* ---------- Export ---------- */

export const falconConfig: TemplateConfig = {
    template: falconTemplate,
    extended: falconExtended,
};

export default falconConfig;
