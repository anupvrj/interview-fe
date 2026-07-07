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
    thumbnail: "/resume-template-images/atlantic-blue-template-design.webp",
    previewImages: {
      main: "/resume-template-images/atlantic-blue-template-design.webp",
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

  {
    id: "confident-grid",
    name: "Confident Grid",
    category: "modern",
    description:
      "Two-column resume with a tinted sidebar carrying identity, summary and skills, and a spacious main column for experience and education.",
    shortDescription: "Two-column with tinted sidebar",
    thumbnail: "/resume-template-images/confident-grid-preview.webp",
    previewImages: {
      main: "/resume-template-images/confident-grid-preview.webp",
    },
    features: [
      "Two-column layout",
      "Tinted sidebar",
      "Dotted language ratings",
      "ATS-optimized",
    ],
    tags: ["modern", "two-column", "sidebar", "professional"],
    atsOptimized: true,
    popular: false,
    new: true,
    colors: { primary: "#1f2d3d", secondary: "#41566b", accent: "#2f5fa6" },
    seo: {
      title: "Confident Grid Resume Template - Modern Two-Column Design",
      description:
        "Two-column resume template with a tinted sidebar and clean main column. ATS-friendly and great for managers and consultants.",
      keywords: ["two-column resume", "modern resume", "sidebar resume template"],
    },
    marketing: {
      headline: "Organized and Confident",
      benefits: [
        "Clear two-column structure",
        "Sidebar keeps skills visible",
        "Professional, modern feel",
      ],
      bestFor: ["Managers", "Consultants", "Operations leaders"],
      industry: ["Consulting", "Operations", "Business"],
    },
  },

  {
    id: "saffron-line",
    name: "Saffron Line",
    category: "modern",
    description:
      "Two-column resume with serif headings, warm saffron section rules and a subtle column divider for an editorial, premium feel.",
    shortDescription: "Serif two-column with saffron rules",
    thumbnail: "/resume-template-images/saffron-line-preview.webp",
    previewImages: {
      main: "/resume-template-images/saffron-line-preview.webp",
    },
    features: [
      "Serif typography",
      "Saffron section rules",
      "Two-column layout",
      "ATS-optimized",
    ],
    tags: ["modern", "two-column", "serif", "elegant"],
    atsOptimized: true,
    popular: false,
    new: true,
    colors: { primary: "#2b2b2b", secondary: "#6a6a6a", accent: "#c0871f" },
    seo: {
      title: "Saffron Line Resume Template - Elegant Serif Two-Column",
      description:
        "Editorial two-column resume template with serif headings and saffron rules. ATS-friendly and refined.",
      keywords: ["serif resume", "elegant resume", "two-column resume template"],
    },
    marketing: {
      headline: "Editorial Elegance",
      benefits: [
        "Refined serif headings",
        "Warm accent rules",
        "Balanced two-column layout",
      ],
      bestFor: ["Operations leaders", "Account managers", "Senior professionals"],
      industry: ["Operations", "Hospitality", "Business"],
    },
  },

  {
    id: "condensed-rule",
    name: "Condensed Rule",
    category: "simple",
    description:
      "Dense single-column consulting resume with an inline name and title, slim full-width rules and compact multi-column skills.",
    shortDescription: "Dense single-column with slim rules",
    thumbnail: "/resume-template-images/condensed-rule-preview.webp",
    previewImages: {
      main: "/resume-template-images/condensed-rule-preview.webp",
    },
    features: [
      "Single-column layout",
      "Inline name/title",
      "Compact, information-dense",
      "ATS-optimized",
    ],
    tags: ["simple", "ats-friendly", "compact", "professional"],
    atsOptimized: true,
    popular: false,
    new: true,
    colors: { primary: "#1a1a1a", secondary: "#555555", accent: "#1a1a1a" },
    seo: {
      title: "Condensed Rule Resume Template - Dense ATS-Friendly Design",
      description:
        "Information-dense single-column resume template with slim rules. Ideal for senior leaders with extensive experience.",
      keywords: ["ats resume", "dense resume", "consulting resume template"],
    },
    marketing: {
      headline: "More Substance Per Page",
      benefits: [
        "Fits extensive experience",
        "Clean, scannable rules",
        "Excellent ATS compatibility",
      ],
      bestFor: ["Senior leaders", "Consultants", "Executives"],
      industry: ["Consulting", "Engineering", "Corporate"],
    },
  },

  {
    id: "royal-indigo",
    name: "Royal Indigo",
    category: "modern",
    description:
      "Centered single-column resume with an indigo name and uppercase indigo section headers. Polished yet ATS-friendly.",
    shortDescription: "Centered layout with indigo accents",
    thumbnail: "/resume-template-images/royal-indigo-preview.webp",
    previewImages: {
      main: "/resume-template-images/royal-indigo-preview.webp",
    },
    features: [
      "Centered header",
      "Indigo accents",
      "Single-column layout",
      "ATS-optimized",
    ],
    tags: ["modern", "centered", "colorful", "professional"],
    atsOptimized: true,
    popular: false,
    new: true,
    colors: { primary: "#5b3fa0", secondary: "#6b7280", accent: "#7857b8" },
    seo: {
      title: "Royal Indigo Resume Template - Centered Modern Design",
      description:
        "Centered single-column resume template with indigo accents. ATS-friendly and polished for any industry.",
      keywords: ["modern resume", "centered resume", "indigo resume template"],
    },
    marketing: {
      headline: "Polished and Distinctive",
      benefits: [
        "Eye-catching centered header",
        "Tasteful indigo accents",
        "Clean, readable structure",
      ],
      bestFor: ["Engineers", "Project managers", "Graduates"],
      industry: ["Engineering", "Technology", "Business"],
    },
  },

  {
    id: "meridian",
    name: "Meridian",
    category: "simple",
    description:
      "Minimal black-and-white resume with a centered name, an Area of Expertise grid and key achievements. Maximum ATS clarity.",
    shortDescription: "Minimal centered with expertise grid",
    thumbnail: "/resume-template-images/meridian-preview.webp",
    previewImages: {
      main: "/resume-template-images/meridian-preview.webp",
    },
    features: [
      "Centered header",
      "Expertise grid",
      "Minimal styling",
      "ATS-optimized",
    ],
    tags: ["simple", "minimal", "ats-friendly", "clean"],
    atsOptimized: true,
    popular: false,
    new: true,
    colors: { primary: "#1a1a1a", secondary: "#4a4a4a", accent: "#1a1a1a" },
    seo: {
      title: "Meridian Resume Template - Minimal ATS-Friendly Design",
      description:
        "Minimal black-and-white resume template with an expertise grid. Maximum readability and ATS compatibility.",
      keywords: ["minimal resume", "ats resume", "clean resume template"],
    },
    marketing: {
      headline: "Minimal, Maximum Clarity",
      benefits: [
        "Distraction-free design",
        "Expertise grid stands out",
        "Excellent ATS compatibility",
      ],
      bestFor: ["Designers", "Specialists", "All experience levels"],
      industry: ["Design", "Technology", "All Industries"],
    },
  },

  {
    id: "amber-edge",
    name: "Amber Edge",
    category: "modern",
    description:
      "Single-column resume with amber/gold section rules and a two-column skills block. Warm, modern and ATS-friendly.",
    shortDescription: "Single-column with amber rules",
    thumbnail: "/resume-template-images/amber-edge-preview.webp",
    previewImages: {
      main: "/resume-template-images/amber-edge-preview.webp",
    },
    features: [
      "Amber section rules",
      "Two-column skills block",
      "Single-column layout",
      "ATS-optimized",
    ],
    tags: ["modern", "warm", "professional", "ats-friendly"],
    atsOptimized: true,
    popular: false,
    new: true,
    colors: { primary: "#1f1f1f", secondary: "#5a5a5a", accent: "#b07d2b" },
    seo: {
      title: "Amber Edge Resume Template - Warm Modern Single-Column",
      description:
        "Single-column resume template with amber rules and a two-column skills block. ATS-friendly and modern.",
      keywords: ["modern resume", "warm resume", "skills resume template"],
    },
    marketing: {
      headline: "Warm and Professional",
      benefits: [
        "Distinctive amber accents",
        "Skills shown in two columns",
        "Clean, modern structure",
      ],
      bestFor: ["Engineers", "Specialists", "Individual contributors"],
      industry: ["Engineering", "Technology", "Manufacturing"],
    },
  },

  {
    id: "navy-frame",
    name: "Navy Frame",
    category: "modern",
    description:
      "Single-column resume with a soft-grey profile header band (photo + contact) and navy uppercase section headers.",
    shortDescription: "Profile header band with navy headers",
    thumbnail: "/resume-template-images/navy-frame-preview.webp",
    previewImages: {
      main: "/resume-template-images/navy-frame-preview.webp",
    },
    features: [
      "Profile photo header band",
      "Navy section headers",
      "Single-column layout",
      "ATS-optimized",
    ],
    tags: ["modern", "photo", "professional", "header"],
    atsOptimized: true,
    popular: false,
    new: true,
    colors: { primary: "#1f3a5f", secondary: "#5a6b7d", accent: "#1f3a5f" },
    seo: {
      title: "Navy Frame Resume Template - Photo Header Modern Design",
      description:
        "Single-column resume template with a profile photo header band and navy headers. ATS-friendly and professional.",
      keywords: ["photo resume", "modern resume", "navy resume template"],
    },
    marketing: {
      headline: "A Confident First Impression",
      benefits: [
        "Photo header band",
        "Strong navy section rules",
        "Clean single-column body",
      ],
      bestFor: ["Engineers", "Professionals", "Client-facing roles"],
      industry: ["Engineering", "Technology", "Business"],
    },
  },

  {
    id: "cobalt-stream",
    name: "Cobalt Stream",
    category: "modern",
    description:
      "Single-column resume with bold black section rules, cobalt role/company accents and a two-column Key Achievements footer.",
    shortDescription: "Bold rules with cobalt accents",
    thumbnail: "/resume-template-images/cobalt-stream-preview.webp",
    previewImages: {
      main: "/resume-template-images/cobalt-stream-preview.webp",
    },
    features: [
      "Bold section rules",
      "Cobalt accents",
      "Key achievements footer",
      "ATS-optimized",
    ],
    tags: ["modern", "bold", "professional", "ats-friendly"],
    atsOptimized: true,
    popular: false,
    new: true,
    colors: { primary: "#111827", secondary: "#4b5563", accent: "#2563eb" },
    seo: {
      title: "Cobalt Stream Resume Template - Bold Modern Single-Column",
      description:
        "Single-column resume template with bold rules and cobalt accents. ATS-friendly and impactful for sales and business roles.",
      keywords: ["modern resume", "bold resume", "sales resume template"],
    },
    marketing: {
      headline: "Bold and Results-Driven",
      benefits: [
        "Strong visual hierarchy",
        "Cobalt accents pop",
        "Achievements highlighted",
      ],
      bestFor: ["Sales professionals", "Account executives", "Business roles"],
      industry: ["Sales", "Business", "Technology"],
    },
  },

  {
    id: "ember-timeline",
    name: "Ember Timeline",
    category: "modern",
    description:
      "Single-column resume with a date-on-left timeline, navy headers, orange accents and boxed skill tags.",
    shortDescription: "Date-on-left timeline with orange accents",
    thumbnail: "/resume-template-images/ember-timeline-preview.webp",
    previewImages: {
      main: "/resume-template-images/ember-timeline-preview.webp",
    },
    features: [
      "Date-on-left timeline",
      "Boxed skill tags",
      "Orange accents",
      "ATS-optimized",
    ],
    tags: ["modern", "timeline", "colorful", "professional"],
    atsOptimized: true,
    popular: false,
    new: true,
    colors: { primary: "#1f2a66", secondary: "#5b6472", accent: "#e8632a" },
    seo: {
      title: "Ember Timeline Resume Template - Timeline Modern Design",
      description:
        "Single-column resume template with a date-on-left timeline and boxed skill tags. ATS-friendly and great for technical roles.",
      keywords: ["timeline resume", "modern resume", "data science resume template"],
    },
    marketing: {
      headline: "A Clear Career Timeline",
      benefits: [
        "Dates align on the left",
        "Skills shown as tags",
        "Achievements footer",
      ],
      bestFor: ["Data scientists", "Analysts", "Technical specialists"],
      industry: ["Technology", "Data", "Engineering"],
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

