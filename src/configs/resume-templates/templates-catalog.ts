/**
 * Templates Catalog
 * 
 * Marketing catalog for resume templates.
 * Used for template showcases, landing pages, and template selection UI.
 * 
 * @see TEMPLATE_DEVELOPMENT_GUIDE.md for adding new templates
 */

import { TemplateCatalogItem } from "./template-types";

/**
 * Templates Catalog
 * Complete marketing information for all templates
 * 
 * To add a new template:
 * 1. Create template config in individual folder
 * 2. Add template to templateRegistry.ts
 * 3. Add marketing entry here
 * 4. Add preview images to public/resume-template-images/
 */
export const TEMPLATES_CATALOG: TemplateCatalogItem[] = [
  {
    id: "atlantic-blue",
    name: "Atlantic Blue",
    category: "modern",
    description:
      "Modern two-column template with distinctive blue sidebar. Perfect for creative professionals who want to stand out.",
    shortDescription: "Modern two-column with blue sidebar",
    thumbnail: "/resume-template-images/atlantic-blue-preview.webp",
    previewImages: {
      main: "/resume-template-images/atlantic-blue-preview.webp",
    },
    features: [
      "Two-column layout with sidebar",
      "Blue color scheme",
      "Icon-based contact info",
      "ATS-optimized",
    ],
    tags: ["modern", "two-column", "colorful", "sidebar"],
    atsOptimized: true,
    popular: true,
    new: false,
    colors: {
      primary: "#2c3e50",
      secondary: "#3498db",
      accent: "#3498db",
    },
    seo: {
      title: "Atlantic Blue Resume Template - Modern Two-Column Design",
      description:
        "Professional two-column resume template with blue sidebar. ATS-friendly and perfect for creative professionals.",
      keywords: ["modern resume", "two-column resume", "blue resume template"],
    },
    marketing: {
      headline: "Stand Out with Modern Design",
      benefits: [
        "Eye-catching blue sidebar design",
        "Organized two-column layout",
        "Professional yet creative appearance",
      ],
      bestFor: [
        "Creative professionals",
        "Tech industry",
        "Design roles",
      ],
      industry: ["Technology", "Design", "Marketing"],
    },
  },

  {
    id: "clean-slate",
    name: "Clean Slate",
    category: "simple",
    description:
      "Clean, professional single-column template with classic styling. Perfect for traditional industries and formal applications.",
    shortDescription: "Clean professional single-column",
    thumbnail: "/resume-template-images/clean-slate-preview.webp",
    previewImages: {
      main: "/resume-template-images/clean-slate-preview.webp",
    },
    features: [
      "Single-column layout",
      "Classic section headers",
      "Professional styling",
      "ATS-optimized",
    ],
    tags: ["simple", "professional", "classic", "ats-friendly"],
    atsOptimized: true,
    popular: true,
    new: false,
    colors: {
      primary: "#000000",
      secondary: "#333333",
      accent: "#555555",
    },
    seo: {
      title: "Clean Slate Resume Template - Professional & ATS-Friendly",
      description:
        "Simple, professional resume template optimized for ATS systems. Perfect for traditional industries.",
      keywords: ["professional resume", "ats resume", "simple resume template"],
    },
    marketing: {
      headline: "Classic Professionalism",
      benefits: [
        "Clean, distraction-free design",
        "Excellent ATS compatibility",
        "Suitable for all industries",
      ],
      bestFor: [
        "Traditional industries",
        "Corporate roles",
        "Entry-level positions",
      ],
      industry: ["Finance", "Healthcare", "Education", "Government"],
    },
  },

  {
    id: "executive",
    name: "Executive",
    category: "simple",
    description:
      "Sophisticated template with Times New Roman font and elegant styling. Perfect for senior-level positions.",
    shortDescription: "Sophisticated template for executives",
    thumbnail: "/resume-template-images/executive-preview.webp",
    previewImages: {
      main: "/resume-template-images/executive-preview.webp",
    },
    features: [
      "Elegant serif typography",
      "Grid-based timeline",
      "Skill ratings",
      "ATS-optimized",
    ],
    tags: ["executive", "sophisticated", "professional", "serif"],
    atsOptimized: true,
    popular: false,
    new: false,
    colors: {
      primary: "#000000",
      secondary: "#333333",
      accent: "#666666",
    },
    seo: {
      title: "Executive Resume Template - Sophisticated Professional Design",
      description:
        "Elegant resume template for executive and senior-level positions. Features sophisticated typography and professional styling.",
      keywords: ["executive resume", "senior resume", "professional template"],
    },
    marketing: {
      headline: "Executive Excellence",
      benefits: [
        "Sophisticated appearance",
        "Perfect for senior roles",
        "Elegant typography",
      ],
      bestFor: [
        "C-level executives",
        "Senior managers",
        "Directors",
      ],
      industry: ["Corporate", "Finance", "Consulting"],
    },
  },

  {
    id: "classic",
    name: "Classic",
    category: "simple",
    description:
      "Traditional resume template with timeless design. Features centered header and classic formatting.",
    shortDescription: "Traditional timeless design",
    thumbnail: "/resume-template-images/classic-preview.webp",
    previewImages: {
      main: "/resume-template-images/classic-preview.webp",
    },
    features: [
      "Centered header",
      "Times New Roman font",
      "Classic styling",
      "ATS-optimized",
    ],
    tags: ["classic", "traditional", "simple", "timeless"],
    atsOptimized: true,
    popular: true,
    new: false,
    colors: {
      primary: "#000000",
      secondary: "#666666",
      accent: "#333333",
    },
    seo: {
      title: "Classic Resume Template - Timeless Professional Design",
      description:
        "Traditional resume template with classic formatting. Perfect for conservative industries and formal applications.",
      keywords: ["classic resume", "traditional resume", "professional template"],
    },
    marketing: {
      headline: "Timeless Professionalism",
      benefits: [
        "Never goes out of style",
        "Widely accepted format",
        "Professional appearance",
      ],
      bestFor: [
        "Traditional industries",
        "Academic positions",
        "Government roles",
      ],
      industry: ["Education", "Government", "Healthcare", "Law"],
    },
  },

  {
    id: "corporate",
    name: "Corporate",
    category: "simple",
    description:
      "Professional template with formal corporate styling. Features centered header and border-top-bottom section headers.",
    shortDescription: "Formal corporate styling",
    thumbnail: "/resume-template-images/corporate-preview.webp",
    previewImages: {
      main: "/resume-template-images/corporate-preview.webp",
    },
    features: [
      "Formal styling",
      "Centered header",
      "Professional appearance",
      "ATS-optimized",
    ],
    tags: ["corporate", "professional", "formal", "traditional"],
    atsOptimized: true,
    popular: false,
    new: false,
    colors: {
      primary: "#000000",
      secondary: "#7f8c8d",
      accent: "#34495e",
    },
    seo: {
      title: "Corporate Resume Template - Formal Professional Design",
      description:
        "Formal corporate resume template perfect for business professionals. Features professional styling and ATS optimization.",
      keywords: ["corporate resume", "business resume", "professional template"],
    },
    marketing: {
      headline: "Corporate Professionalism",
      benefits: [
        "Formal business appearance",
        "Suitable for corporate roles",
        "Professional credibility",
      ],
      bestFor: [
        "Business professionals",
        "Corporate roles",
        "Management positions",
      ],
      industry: ["Finance", "Corporate", "Business Services"],
    },
  },

  {
    id: "harvard",
    name: "Harvard",
    category: "simple",
    description:
      "Academic-style template with elegant Garamond typography. Perfect for academic and research positions.",
    shortDescription: "Academic-style with elegant typography",
    thumbnail: "/resume-template-images/harvard-preview.webp",
    previewImages: {
      main: "/resume-template-images/harvard-preview.webp",
    },
    features: [
      "Garamond font",
      "Academic styling",
      "Multi-column skills",
      "ATS-optimized",
    ],
    tags: ["academic", "elegant", "professional", "serif"],
    atsOptimized: true,
    popular: false,
    new: false,
    colors: {
      primary: "#000000",
      secondary: "#5a5a5a",
      accent: "#000000",
    },
    seo: {
      title: "Harvard Resume Template - Academic Professional Design",
      description:
        "Academic-style resume template with elegant typography. Perfect for research and academic positions.",
      keywords: ["academic resume", "harvard resume", "research resume"],
    },
    marketing: {
      headline: "Academic Excellence",
      benefits: [
        "Elegant typography",
        "Academic credibility",
        "Professional appearance",
      ],
      bestFor: [
        "Academic positions",
        "Research roles",
        "PhD candidates",
      ],
      industry: ["Education", "Research", "Academia"],
    },
  },

  {
    id: "true-blue",
    name: "True Blue",
    category: "simple",
    description:
      "Clean and straightforward professional template. Features left-aligned header and simple styling.",
    shortDescription: "Clean straightforward professional",
    thumbnail: "/resume-template-images/true-blue-preview.webp",
    previewImages: {
      main: "/resume-template-images/true-blue-preview.webp",
    },
    features: [
      "Left-aligned header",
      "Simple styling",
      "Professional appearance",
      "ATS-optimized",
    ],
    tags: ["simple", "professional", "clean", "straightforward"],
    atsOptimized: true,
    popular: false,
    new: false,
    colors: {
      primary: "#000000",
      secondary: "#5a5a5a",
      accent: "#000000",
    },
    seo: {
      title: "True Blue Resume Template - Clean Professional Design",
      description:
        "Simple, professional resume template with clean design. Perfect for straightforward, no-nonsense applications.",
      keywords: ["simple resume", "professional resume", "clean template"],
    },
    marketing: {
      headline: "Simple Professionalism",
      benefits: [
        "No-nonsense design",
        "Easy to read",
        "Professional appearance",
      ],
      bestFor: [
        "All industries",
        "Entry to mid-level",
        "Career changers",
      ],
      industry: ["All Industries"],
    },
  },

  {
    id: "mercury",
    name: "Mercury",
    category: "simple",
    description:
      "ATS-optimized template with clean design and grid-based timeline. Features light grey section headers and generous padding.",
    shortDescription: "ATS-optimized with clean design",
    thumbnail: "/resume-template-images/mercury-preview.webp",
    previewImages: {
      main: "/resume-template-images/mercury-preview.webp",
    },
    features: [
      "Grid-based timeline",
      "Light grey headers",
      "20mm padding",
      "ATS-optimized",
    ],
    tags: ["ats-friendly", "clean", "professional", "modern"],
    atsOptimized: true,
    popular: true,
    new: false,
    colors: {
      primary: "#374151",
      secondary: "#6b7280",
      accent: "#9ca3af",
    },
    seo: {
      title: "Mercury Resume Template - ATS-Optimized Professional Design",
      description:
        "Highly ATS-optimized resume template with clean, professional design. Perfect for maximizing applicant tracking system compatibility.",
      keywords: ["ats resume", "optimized resume", "professional template"],
    },
    marketing: {
      headline: "Maximum ATS Compatibility",
      benefits: [
        "Excellent ATS compatibility",
        "Clean, professional design",
        "Easy to customize",
      ],
      bestFor: [
        "Job seekers",
        "Career changers",
        "All experience levels",
      ],
      industry: ["All Industries"],
    },
  },
];

/**
 * Get Template Catalog Item by ID
 */
export function getTemplateCatalogItem(
  templateId: string
): TemplateCatalogItem | undefined {
  return TEMPLATES_CATALOG.find((item) => item.id === templateId);
}

/**
 * Get Templates by Category
 */
export function getTemplatesByCategory(
  category: "simple" | "modern" | "creative"
): TemplateCatalogItem[] {
  return TEMPLATES_CATALOG.filter((item) => item.category === category);
}

/**
 * Get Popular Templates
 */
export function getPopularTemplates(): TemplateCatalogItem[] {
  return TEMPLATES_CATALOG.filter((item) => item.popular);
}

/**
 * Get New Templates
 */
export function getNewTemplates(): TemplateCatalogItem[] {
  return TEMPLATES_CATALOG.filter((item) => item.new);
}

/**
 * Search Templates
 */
export function searchTemplates(query: string): TemplateCatalogItem[] {
  const lowerQuery = query.toLowerCase();
  return TEMPLATES_CATALOG.filter(
    (item) =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

