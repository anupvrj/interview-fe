/**
 * Minimalist Bar Resume Template
 *
 * Ultra-clean, ATS-friendly resume with subtle
 * section bars and minimal visual elements.
 *
 * @template minimalist-bar
 * @category simple
 */

import {
    ResumeTemplate,
    ExtendedResumeTemplate,
    TemplateConfig,
} from "../template-types";

/* ---------- Base Template ---------- */

export const minimalistBarTemplate: ResumeTemplate = {
    id: "minimalist-bar",
    name: "Minimalist Bar",
    category: "simple",
    description:
        "A minimalist resume template with subtle section bars, ideal for engineering and enterprise roles.",
    preview: "/resume-template-images/minimalist-bar-preview.webp",
    colors: {
        primary: "#000000",
        secondary: "#666666",
        accent: "#f3f4f6",
        text: "#1a1a1a",
        background: "#ffffff",
    },
    layout: {
        headerStyle: "left",
        sectionSpacing: 10,
        fontFamily: "'Inter', sans-serif",
        fontSize: {
            heading: 28,
            subheading: 14,
            body: 11,
        },
    },
    atsOptimized: true,
};

/* ---------- Extended Configuration ---------- */

export const minimalistBarExtended: Partial<ExtendedResumeTemplate> = {
    style: {
        fontFamily: "'Inter', sans-serif",
        lineHeight: 1.5,
        fontSize: {
            heading: 28,
            subheading: 14,
            body: 11,
            small: 10,
        },
        colors: {
            primary: "#000000",
            secondary: "#666666",
            accent: "#f3f4f6",
            text: "#1a1a1a",
            background: "#ffffff",
        },
        headerStyle: "left",
        sectionSpacing: 10,
        padding: { top: 30, bottom: 30, left: 40, right: 40 },

        sectionHeader: {
            style: "background",
            borderWidth: 0,
            borderColor: "#f3f4f6",
            backgroundColor: "#f3f4f6",
            textAlign: "left",
            fontSize: 12,
            fontWeight: "700",
            marginBottom: "12px",
            paddingTop: "6px",
            paddingBottom: "6px",
            paddingLeft: "16px",
            paddingRight: "16px",
            textTransform: "uppercase",
            borderRadius: "20",
        },

        skillsDisplay: {
            type: "bullets",
            columns: 3,
            showRatings: false,
        },

        timelineLayout: {
            type: "vertical",
            datePosition: "right",
        },

        contactDisplay: {
            type: "text",
            layout: "horizontal",
        },

        useCSSClassesForHeader: true,
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
        { id: "profileSummary", type: "profileSummary", title: "Professional Summary", visible: true },
        { id: "experience", type: "experience", title: "Work Experience", visible: true },
        { id: "education", type: "education", title: "Education", visible: true },
        { id: "skills", type: "skills", title: "Skills", visible: true },
        { id: "certificates", type: "certificates", title: "Certificates", visible: true },
        { id: "projects", type: "projects", title: "Projects", visible: true },
    ],
};

/* ---------- Export ---------- */

export const minimalistBarConfig: TemplateConfig = {
    template: minimalistBarTemplate,
    extended: minimalistBarExtended,
};

export default minimalistBarConfig;
