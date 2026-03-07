/**
 * Product Sidebar Resume Template
 *
 * Modern two-column resume with left sidebar,
 * ideal for Product Managers and Business roles.
 *
 * @template product-sidebar
 * @category modern
 */

import {
    ResumeTemplate,
    ExtendedResumeTemplate,
    TemplateConfig,
} from "../template-types";

/* ---------- Base Template ---------- */

export const productSidebarTemplate: ResumeTemplate = {
    id: "hawk",
    name: "Hawk",
    category: "modern",
    description:
        "A modern two-column resume with a sidebar layout, designed for product and business professionals.",
    preview: "/resume-template-images/hawk-preview.webp",
    colors: {
        primary: "#0f4c5c",
        secondary: "#444444",
        accent: "#0f4c5c",
        text: "#000000",
        background: "#ffffff",
    },
    layout: {
        headerStyle: "two-column",
        sectionSpacing: 14,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: {
            heading: 22,
            subheading: 16,
            body: 12,
        },
    },
    atsOptimized: true,
};

/* ---------- Extended Configuration ---------- */

export const productSidebarExtended: Partial<ExtendedResumeTemplate> = {
    style: {
        fontFamily: "Arial, Helvetica, sans-serif",
        lineHeight: 1.5,
        fontSize: {
            heading: 22,
            subheading: 16,
            body: 12,
            small: 10,
        },
        colors: {
            primary: "#0f4c5c",
            secondary: "#444444",
            accent: "#0f4c5c",
            text: "#000000",
            background: "#ffffff",
        },

        headerStyle: "two-column",
        sectionSpacing: 14,
        padding: { top: 8, bottom: 8, left: 8, right: 8 },

        sectionHeader: {
            style: "none",
            borderWidth: 0,
            borderColor: "#0f4c5c",
            textAlign: "left",
            fontSize: 13,
            fontWeight: "bold",
            marginBottom: "8px",
            paddingBottom: "2px",
            textTransform: "uppercase",
        },

        skillsDisplay: {
            type: "list",
            columns: 1,
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
            type: "header-plus-columns",
            columnWidths: {
                left: 32,
                right: 68,
            },
        },
    },

    defaultSectionOrder: [
        { id: "personalInfo", type: "personalInfo", title: "Contact", visible: true },
        { id: "profileSummary", type: "profileSummary", title: "Profile", visible: true },
        { id: "education", type: "education", title: "Education", visible: true },
        { id: "skills", type: "skills", title: "Skills", visible: true },
        { id: "languages", type: "languages", title: "Languages", visible: true },
        { id: "experience", type: "experience", title: "Professional Experience", visible: true },
        { id: "certificates", type: "certificates", title: "Certifications", visible: true },
    ],
};

/* ---------- Export ---------- */

export const productSidebarConfig: TemplateConfig = {
    template: productSidebarTemplate,
    extended: productSidebarExtended,
};

export default productSidebarConfig;
