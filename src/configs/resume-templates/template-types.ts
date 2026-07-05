/**
 * Shared Template Type Definitions
 * 
 * This file contains all TypeScript interfaces used across resume templates.
 * All template config files should import from here to ensure type consistency.
 * 
 * @see TEMPLATE_DEVELOPMENT_GUIDE.md for usage instructions
 */

/**
 * Base Resume Template Interface
 * Defines the core metadata and basic configuration for a template
 */
export interface ResumeTemplate {
  id: string;
  name: string;
  category: "simple" | "modern" | "creative";
  description: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    sidebarBackground?: string;
    sidebarText?: string;
    sectionHeaderBg?: string;
    headerBackground?: string;
  };
  layout: {
    headerStyle: "centered" | "left" | "two-column" | "full-width";
    sectionSpacing: number;
    fontFamily: string;
    fontSize: {
      heading: number;
      subheading: number;
      body: number;
    };
  };
  atsOptimized: boolean;
}

/**
 * Template Style Configuration
 * Detailed styling rules for template rendering
 */
export interface TemplateStyleConfig {
  fontFamily: string;
  fontSize: {
    heading: number;
    subheading: number;
    body: number;
    small: number;
  };
  lineHeight: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    sidebarBackground?: string;
    sidebarText?: string;
    sectionHeaderBg?: string;
    headerBackground?: string;
  };
  headerStyle: "centered" | "left" | "two-column" | "full-width";
  sectionSpacing: number;
  padding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  sectionHeader: {
    style: "underline" | "border-bottom" | "border-top-bottom" | "background" | "none";
    borderWidth?: number;
    borderColor?: string;
    backgroundColor?: string;
    textAlign: "left" | "center" | "right";
    fontSize: number;
    fontWeight: string;
    marginBottom?: string;
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
    borderRadius?: string;
    letterSpacing?: string;
  };
  skillsDisplay: {
    type: "list" | "grid" | "dots" | "bars" | "bullets";
    showRatings: boolean;
    maxRating?: number;
    columns?: number;
    bulletStyle?: "disc" | "circle" | "square" | "custom";
    customBulletSize?: number;
    layout?: "grid" | "flex" | "columns";
  };
  timelineLayout: {
    type: "vertical" | "horizontal" | "grid";
    datePosition: "left" | "right" | "top" | "bottom";
    dateWidth?: number;
    applyInlineGrid?: boolean;
  };
  contactDisplay: {
    type: "icons" | "text" | "table";
    layout: "horizontal" | "vertical" | "grid";
  };
  languageDisplay?: {
    showRatings: boolean;
    ratingType?: "dots" | "bars" | "text";
    maxRating?: number;
    dotSize?: number;
    columns?: number;
    containerClass?: string;
    itemClass?: string;
    nameClass?: string;
    ratingClass?: string;
    dotClass?: string;
  };
  headerLayout?: {
    type: "standard" | "name-title-split" | "with-profile-picture";
    titlePosition?: "below" | "right" | "left" | "inline";
    padding?: { top: number; bottom: number; left: number; right: number };
  };
  /**
   * If true, header colors (name, job title) will be controlled by CSS classes
   * instead of inline styles. This allows templates to use CSS files for color styling.
   */
  useCSSClassesForHeader?: boolean;
}

/**
 * Template Rendering Rules
 * Controls how the template is rendered and what features are enabled
 */
export interface TemplateRenderingRules {
  pageBreak: {
    enabled: boolean;
    calculateDynamically: boolean;
  };
  dataStructure: "legacy" | "sections-array" | "hybrid";
  features: {
    twoColumnLayout?: boolean;
    fullWidthHeader?: boolean;
    showRatingDots?: boolean;
    showSkillLevels?: boolean;
    showPresent?: boolean;
    customHeader?: boolean;
  };
  layout?: {
    type: "single" | "double" | "header-plus-columns";
    columnWidths?: {
      left: number;
      right: number;
    };
    columnAssignment?: {
      left: string[];
      right: string[];
    };
  };
}

/**
 * Section Definition
 * Used in defaultSectionOrder
 */
export interface SectionDefinition {
  id: string;
  type: string;
  title: string;
  visible: boolean;
  column?: "left" | "right";
}

/**
 * Extended Resume Template
 * Combines base template with detailed style and rendering configuration
 */
export interface ExtendedResumeTemplate extends ResumeTemplate {
  style?: TemplateStyleConfig;
  rendering?: TemplateRenderingRules;
  defaultSectionOrder?: SectionDefinition[];
}

/**
 * Template Configuration Export
 * Standard structure for exporting template configurations
 */
export interface TemplateConfig {
  template: ResumeTemplate;
  extended: Partial<ExtendedResumeTemplate>;
}

/**
 * Template Catalog Item
 * Used for marketing pages and template showcases
 */
export interface TemplateCatalogItem {
  id: string;
  name: string;
  category: "simple" | "modern" | "creative";
  description: string;
  shortDescription: string;
  thumbnail: string;
  previewImages: {
    main: string;
    hover?: string;
    mobile?: string;
  };
  features: string[];
  tags: string[];
  atsOptimized: boolean;
  popular: boolean;
  new: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };
  marketing?: {
    headline: string;
    benefits: string[];
    bestFor: string[];
    industry: string[];
  };
}

