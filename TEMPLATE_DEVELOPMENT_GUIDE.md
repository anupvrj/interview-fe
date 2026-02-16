# Resume Template Development Guide

A comprehensive guide for developers to create new resume templates for the application.

## Table of Contents

1. [Overview](#overview)
2. [Template Architecture](#template-architecture)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Guide](#step-by-step-guide)
5. [File Structure](#file-structure)
6. [Configuration Details](#configuration-details)
7. [Style Guidelines](#style-guidelines)
8. [Dummy Content](#dummy-content)
9. [Template Registration](#template-registration)
10. [Testing Your Template](#testing-your-template)
11. [Best Practices](#best-practices)
12. [Common Pitfalls](#common-pitfalls)
13. [Troubleshooting](#troubleshooting)

---

## Overview

This application uses a **configuration-driven template system** that allows you to create new resume templates without modifying core rendering logic. Each template consists of three main files:

1. **`config.ts`** - Template configuration (metadata, styles, layout)
2. **`style.css`** - Visual styling (colors, fonts, spacing)
3. **`dummy-content.ts`** - Sample data for preview/testing

### Key Principles

- ✅ **Configuration-Driven**: All template-specific logic is in config files
- ✅ **No Hardcoding**: Never add `if (template.id === "your-template")` in core components
- ✅ **CSS-First**: Use CSS classes for styling, avoid inline styles when possible
- ✅ **Type-Safe**: All configs use TypeScript interfaces for type safety

---

## Template Architecture

### How Templates Work

```
User Selects Template
    ↓
Template Config Loaded (config.ts)
    ↓
Extended Config Merged (style, rendering, sections)
    ↓
ResumeRenderer Uses Config to Render
    ↓
CSS Applied (style.css)
    ↓
PDF Generated (CSS fetched from public folder)
```

### Core Components

- **`ResumeRenderer.tsx`** - Main rendering component (uses config, no hardcoding)
- **`templateRegistry.ts`** - Loads and caches template configs
- **`templateRenderer.tsx`** - Provides template style utilities
- **`PaginatedPreview.tsx`** - Handles pagination for PDF

---

## Prerequisites

Before creating a new template, ensure you have:

1. ✅ A design mockup or reference image
2. ✅ Understanding of CSS (flexbox, grid, print media queries)
3. ✅ Basic TypeScript knowledge
4. ✅ Access to the codebase

---

## Step-by-Step Guide

### Step 1: Create Template Directory

Create a new folder in `src/configs/resume-templates/` with your template ID (kebab-case):

```bash
mkdir -p src/configs/resume-templates/my-awesome-template
cd src/configs/resume-templates/my-awesome-template
```

**Template ID Rules:**
- Use kebab-case: `my-awesome-template`
- Keep it short and descriptive
- Must be unique across all templates

### Step 2: Create Configuration File (`config.ts`)

Create `config.ts` with the following structure:

```typescript
/**
 * My Awesome Template Configuration
 * 
 * Brief description of your template's design and purpose.
 * 
 * @template my-awesome-template
 * @category simple | modern | creative
 */

import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

/**
 * Base Template Configuration
 * This is the minimal template definition
 */
export const myAwesomeTemplate: ResumeTemplate = {
  id: "my-awesome-template",
  name: "My Awesome Template",
  category: "simple", // or "modern" | "creative"
  description: "A clean and professional template with modern design",
  preview: "/resume-template-images/my-awesome-template-preview.webp",
  colors: {
    primary: "#1a1a1a",
    secondary: "#666666",
    accent: "#007bff",
    text: "#000000",
    background: "#ffffff",
  },
  layout: {
    headerStyle: "left", // or "centered" | "two-column" | "full-width"
    sectionSpacing: 12,
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: {
      heading: 24,
      subheading: 18,
      body: 12,
    },
  },
  atsOptimized: true,
};

/**
 * Extended Configuration
 * Detailed styling and rendering rules
 */
export const myAwesomeExtendedConfig: Partial<ExtendedResumeTemplate> = {
  style: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: { heading: 24, subheading: 18, body: 12, small: 10 },
    lineHeight: 1.5,
    colors: {
      primary: "#1a1a1a",
      secondary: "#666666",
      accent: "#007bff",
      text: "#000000",
      background: "#ffffff",
    },
    headerStyle: "left",
    sectionSpacing: 12,
    padding: { top: 8, bottom: 8, left: 8, right: 8 },
    sectionHeader: {
      style: "border-bottom", // or "underline" | "border-top-bottom" | "background" | "none"
      borderWidth: 1,
      borderColor: "#007bff",
      textAlign: "left",
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: "10px",
      paddingBottom: "4px",
      textTransform: "uppercase",
    },
    skillsDisplay: {
      type: "list", // or "grid" | "dots" | "bars" | "bullets"
      showRatings: false,
      columns: 2,
    },
    timelineLayout: {
      type: "vertical", // or "horizontal" | "grid"
      datePosition: "right", // or "left" | "top" | "bottom"
    },
    contactDisplay: {
      type: "icons", // or "text" | "table"
      layout: "horizontal", // or "vertical" | "grid"
    },
    // Use CSS classes for header colors (recommended for PDF compatibility)
    useCSSClassesForHeader: false, // Set to true if you want CSS to control header colors
  },
  rendering: {
    pageBreak: {
      enabled: true,
      calculateDynamically: true,
    },
    dataStructure: "legacy",
    features: {
      showPresent: true,
      showRatingDots: false,
    },
    layout: {
      type: "single", // or "double" | "header-plus-columns"
      columnWidths: {
        left: 100,
        right: 0,
      },
    },
  },
  defaultSectionOrder: [
    { id: "personalInfo", type: "personalInfo", title: "Personal Information", visible: true },
    { id: "profileSummary", type: "profileSummary", title: "Professional Summary", visible: true },
    { id: "experience", type: "experience", title: "Professional Experience", visible: true },
    { id: "education", type: "education", title: "Education", visible: true },
    { id: "skills", type: "skills", title: "Skills", visible: true },
    { id: "projects", type: "projects", title: "Projects", visible: false },
    { id: "certificates", type: "certificates", title: "Certifications", visible: false },
    { id: "languages", type: "languages", title: "Languages", visible: false },
  ],
};

/**
 * Template Config Export
 * Standard export structure
 */
export const myAwesomeConfig: TemplateConfig = {
  template: myAwesomeTemplate,
  extended: myAwesomeExtendedConfig,
};

export default myAwesomeConfig;
```

### Step 3: Create Style File (`style.css`)

Create `style.css` with your template's visual styling:

```css
/**
 * My Awesome Template Styles
 * Professional template with modern design
 */

/* Template Container */
.my-awesome-template {
  font-family: Arial, Helvetica, sans-serif;
  color: #000000;
  background-color: #ffffff;
  padding: 8px;
  line-height: 1.5;
  /* Essential for PDF color preservation */
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color-adjust: exact !important;
}

/* Header Styles */
.my-awesome-name {
  font-size: 24px;
  font-weight: bold;
  color: #1a1a1a !important;
  margin-bottom: 6px;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.my-awesome-job-title {
  font-size: 18px;
  color: #666666 !important;
  margin-bottom: 12px;
  font-weight: normal;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

/* Contact Info Styles */
.my-awesome-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #000000;
  margin-bottom: 16px;
  align-items: center;
}

.my-awesome-contact-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.my-awesome-contact-item svg {
  width: 14px;
  height: 14px;
  stroke-width: 2;
}

/* Section Header Styles */
.my-awesome-section-header,
.my-awesome-template h2 {
  font-size: 14px !important;
  font-weight: bold;
  text-transform: uppercase;
  text-align: left;
  border-bottom: 1px solid #007bff !important;
  padding-bottom: 4px !important;
  margin-bottom: 10px !important;
  margin-top: 16px !important;
  color: #1a1a1a !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

/* Experience/Education Item Styles */
.my-awesome-experience-item,
.my-awesome-education-item {
  margin-bottom: 12px;
}

.my-awesome-experience-title,
.my-awesome-education-title {
  font-size: 13px;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.my-awesome-experience-company,
.my-awesome-education-institution {
  font-size: 12px;
  color: #666666;
  font-style: italic;
  margin-bottom: 4px;
}

.my-awesome-experience-date,
.my-awesome-education-date {
  font-size: 11px;
  color: #666666;
  margin-bottom: 6px;
}

/* Skills Styles */
.my-awesome-skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.my-awesome-skills-list li {
  font-size: 11px;
  padding: 4px 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

/* Print Styles (Critical for PDF Generation) */
@media print {
  /* Universal color preservation */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .my-awesome-template {
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  .my-awesome-name {
    color: #1a1a1a !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  .my-awesome-job-title {
    color: #666666 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  .my-awesome-section-header,
  .my-awesome-template h2 {
    color: #1a1a1a !important;
    border-bottom-color: #007bff !important;
    border-bottom-style: solid !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  /* Prevent page breaks inside sections */
  .my-awesome-experience-item,
  .my-awesome-education-item {
    page-break-inside: avoid;
  }
}
```

**CSS Naming Convention:**
- Use template ID as prefix: `.my-awesome-template`
- Use kebab-case for class names
- Always include `!important` for colors in PDF generation
- Always include `@media print` block with color preservation

### Step 4: Create Dummy Content File (`dummy-content.ts`)

Create `dummy-content.ts` with sample data:

```typescript
/**
 * My Awesome Template - Dummy Content
 * Sample resume data for preview and testing
 */

export const myAwesomeDummyContent = {
  personalInfo: {
    fullName: "John Doe",
    email: "john.doe@email.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA 94102",
    linkedin: "linkedin.com/in/johndoe",
    portfolio: "Software Engineer",
  },

  profileSummary:
    "Experienced software engineer with 5+ years of expertise in full-stack development. Proficient in React, Node.js, and cloud technologies. Passionate about building scalable applications and leading cross-functional teams.",

  experience: [
    {
      position: "Senior Software Engineer",
      company: "Tech Corp Inc.",
      location: "San Francisco, CA",
      startDate: "2020-01",
      endDate: "2024-12",
      current: false,
      description: [
        "Led development of microservices architecture serving 1M+ users",
        "Mentored junior developers and established coding best practices",
        "Reduced application load time by 40% through optimization",
      ],
    },
    {
      position: "Software Engineer",
      company: "StartupXYZ",
      location: "San Francisco, CA",
      startDate: "2018-06",
      endDate: "2019-12",
      current: false,
      description: [
        "Developed React-based frontend applications",
        "Implemented RESTful APIs using Node.js and Express",
        "Collaborated with design team on UI/UX improvements",
      ],
    },
  ],

  education: [
    {
      degree: "B.S. in Computer Science",
      institution: "University of California",
      location: "Berkeley, CA",
      startDate: "2014",
      endDate: "2018",
      gpa: "3.8",
      description: "Magna Cum Laude",
    },
  ],

  skills: [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Python",
    "AWS",
    "Docker",
    "Kubernetes",
  ],

  projects: [
    {
      name: "E-Commerce Platform",
      description: "Built a full-stack e-commerce platform with React and Node.js",
      technologies: ["React", "Node.js", "MongoDB", "Stripe"],
    },
  ],

  certificates: [],
  achievements: [],
  languages: [{ name: "English", level: 5 }],
  interests: "Open Source, Photography, Hiking",
};

export default myAwesomeDummyContent;
```

### Step 5: Register Template

Add your template to the template registry in `src/lib/templateRegistry.ts`:

```typescript
// In the knownConfigs object (around line 75)
const knownConfigs: Record<string, any> = {
  mercury: require("@/configs/resume-templates/mercury/config"),
  classic: require("@/configs/resume-templates/classic/config"),
  "clean-slate": require("@/configs/resume-templates/clean-slate/config"),
  "atlantic-blue": require("@/configs/resume-templates/atlantic-blue/config"),
  corporate: require("@/configs/resume-templates/corporate/config"),
  executive: require("@/configs/resume-templates/executive/config"),
  "true-blue": require("@/configs/resume-templates/true-blue/config"),
  harvard: require("@/configs/resume-templates/harvard/config"),
  "my-awesome-template": require("@/configs/resume-templates/my-awesome-template/config"), // Add this line
};
```

### Step 6: Add Preview Image

1. Create a preview image (WebP format recommended)
2. Save it as `public/resume-template-images/my-awesome-template-preview.webp`
3. Ensure the path in `config.ts` matches: `preview: "/resume-template-images/my-awesome-template-preview.webp"`

### Step 7: Copy CSS to Public Folder

The CSS file is automatically copied to `public/resume-templates/` during build, but you can manually copy it:

```bash
# The build script handles this automatically, but for testing:
npm run copy-template-css
```

Or manually:
```bash
mkdir -p public/resume-templates/my-awesome-template
cp src/configs/resume-templates/my-awesome-template/style.css public/resume-templates/my-awesome-template/style.css
```

---

## File Structure

Your template directory should look like this:

```
src/configs/resume-templates/
└── my-awesome-template/
    ├── config.ts          # Template configuration
    ├── style.css          # Visual styling
    └── dummy-content.ts   # Sample data (optional but recommended)
```

---

## Configuration Details

### Base Template (`ResumeTemplate`)

Required fields:

```typescript
{
  id: string;                    // Unique template identifier (kebab-case)
  name: string;                   // Display name
  category: "simple" | "modern" | "creative";
  description: string;            // Brief description
  preview: string;                // Path to preview image
  colors: {                       // Color palette
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  layout: {
    headerStyle: "centered" | "left" | "two-column" | "full-width";
    sectionSpacing: number;       // Spacing between sections (px)
    fontFamily: string;           // CSS font-family
    fontSize: {
      heading: number;            // Name font size (px)
      subheading: number;         // Job title font size (px)
      body: number;               // Body text font size (px)
    };
  };
  atsOptimized: boolean;         // ATS-friendly flag
}
```

### Extended Configuration (`ExtendedResumeTemplate`)

#### Style Configuration

```typescript
style: {
  fontFamily: string;
  fontSize: { heading, subheading, body, small };
  lineHeight: number;
  colors: { /* same as base */ };
  headerStyle: "centered" | "left" | "two-column" | "full-width";
  sectionSpacing: number;
  padding: { top, bottom, left, right };
  
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
    textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  };
  
  skillsDisplay: {
    type: "list" | "grid" | "dots" | "bars" | "bullets";
    showRatings: boolean;
    columns?: number;
    bulletStyle?: "disc" | "circle" | "square" | "custom";
    customBulletSize?: number;
  };
  
  timelineLayout: {
    type: "vertical" | "horizontal" | "grid";
    datePosition: "left" | "right" | "top" | "bottom";
    applyInlineGrid?: boolean;  // Set to false for table-based layouts (better PDF compatibility)
  };
  
  contactDisplay: {
    type: "icons" | "text" | "table";
    layout: "horizontal" | "vertical" | "grid";
  };
  
  headerLayout?: {
    type: "standard" | "name-title-split" | "with-profile-picture";
    titlePosition?: "below" | "right" | "left";
    padding?: { top, bottom, left, right };
  };
  
  useCSSClassesForHeader?: boolean;  // If true, CSS controls header colors (better for PDF)
}
```

#### Rendering Configuration

```typescript
rendering: {
  pageBreak: {
    enabled: boolean;
    calculateDynamically: boolean;
  };
  dataStructure: "legacy" | "sections-array" | "hybrid";
  features: {
    showPresent: boolean;
    showRatingDots: boolean;
    // ... other feature flags
  };
  layout: {
    type: "single" | "double" | "header-plus-columns";
    columnWidths: { left: number; right: number };
  };
}
```

#### Default Section Order

```typescript
defaultSectionOrder: [
  {
    id: string;        // Unique section ID
    type: string;      // Section type (e.g., "experience", "education")
    title: string;     // Display title
    visible: boolean;  // Initially visible?
    column?: "left" | "right";  // For double-column layouts
  },
  // ... more sections
]
```

---

## Style Guidelines

### CSS Class Naming

- **Template Container**: `.{template-id}-template`
- **Name**: `.{template-id}-name`
- **Job Title**: `.{template-id}-job-title`
- **Section Headers**: `.{template-id}-section-header`
- **Contact Items**: `.{template-id}-contact-item`
- **Experience Items**: `.{template-id}-experience-item`
- **Education Items**: `.{template-id}-education-item`

Example for `my-awesome-template`:
- `.my-awesome-template`
- `.my-awesome-name`
- `.my-awesome-job-title`

### PDF Color Preservation

**Always include these properties for colors:**

```css
.my-awesome-name {
  color: #1a1a1a !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color-adjust: exact !important;
}
```

**Always include a `@media print` block:**

```css
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  /* Re-apply all color rules with !important */
  .my-awesome-name {
    color: #1a1a1a !important;
    /* ... */
  }
}
```

### Layout Best Practices

1. **Use `display: table` for complex layouts** (better PDF compatibility):
   ```css
   .my-awesome-experience-item {
     display: table;
     width: 100%;
   }
   .my-awesome-date-column {
     display: table-cell;
     width: 30%;
   }
   .my-awesome-content-column {
     display: table-cell;
     width: 70%;
   }
   ```

2. **Avoid CSS Grid for PDF-critical layouts** (use flexbox or table instead)

3. **Use `page-break-inside: avoid`** to prevent awkward page breaks:
   ```css
   .my-awesome-experience-item {
     page-break-inside: avoid;
   }
   ```

---

## Dummy Content

### Purpose

- Preview template in development
- Testing different content lengths
- Demonstrating template capabilities

### Structure

Match the structure of `Resume` interface:

```typescript
{
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
    profilePicture?: string;
  };
  profileSummary: string;
  experience: Array<{
    position: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string | string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location?: string;
    startDate: string;
    endDate?: string;
    gpa?: string;
    description?: string;
  }>;
  skills: string[];
  projects?: Array<{...}>;
  // ... other fields
}
```

---

## Template Registration

### Automatic Registration

Templates are automatically discovered if:
1. ✅ Config file exists: `{template-id}/config.ts`
2. ✅ Config exports default or named export matching pattern
3. ✅ Template is added to `templateRegistry.ts` `knownConfigs`

### Manual Registration

Add to `src/lib/templateRegistry.ts`:

```typescript
const knownConfigs: Record<string, any> = {
  // ... existing templates
  "my-awesome-template": require("@/configs/resume-templates/my-awesome-template/config"),
};
```

---

## Testing Your Template

### 1. Visual Testing

1. Start development server: `npm run dev`
2. Navigate to resume editor
3. Select your template
4. Verify:
   - ✅ Header renders correctly
   - ✅ Sections display properly
   - ✅ Colors match design
   - ✅ Spacing looks good
   - ✅ Fonts load correctly

### 2. PDF Testing

1. Click "Download PDF"
2. Verify:
   - ✅ Colors preserved (not black)
   - ✅ Layout intact
   - ✅ No content cut off
   - ✅ Page breaks appropriate
   - ✅ Fonts render correctly

### 3. Responsive Testing

1. Test in different browser sizes
2. Verify preview scales correctly
3. Check zoom functionality

### 4. Content Testing

1. Test with minimal content (1 item per section)
2. Test with maximum content (many items)
3. Test with missing fields (optional fields)
4. Verify edge cases (long text, special characters)

---

## Best Practices

### ✅ DO

- **Use CSS classes** for styling instead of inline styles
- **Include `!important`** for colors to ensure PDF compatibility
- **Use `display: table`** for complex layouts (better PDF support)
- **Test PDF generation** before considering template complete
- **Follow naming conventions** for CSS classes
- **Document your template** with comments
- **Use semantic HTML** in CSS selectors
- **Include print media queries** for PDF-specific styles
- **Set `useCSSClassesForHeader: true`** if you want CSS to control header colors

### ❌ DON'T

- **Don't hardcode template IDs** in `ResumeRenderer.tsx`
- **Don't use CSS Grid** for PDF-critical layouts (use table/flexbox)
- **Don't forget `@media print`** block
- **Don't skip color preservation** properties
- **Don't use inline styles** for colors (use CSS classes)
- **Don't assume browser rendering** matches PDF rendering
- **Don't forget to register** template in `templateRegistry.ts`
- **Don't use absolute positioning** for main layout elements

---

## Common Pitfalls

### 1. Colors Turn Black in PDF

**Problem**: Colors appear correct in browser but turn black in PDF.

**Solution**:
```css
/* Add these properties to all color rules */
.my-awesome-name {
  color: #1a1a1a !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color-adjust: exact !important;
}

/* And in @media print block */
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
```

### 2. Layout Breaks in PDF

**Problem**: Layout looks fine in browser but breaks in PDF.

**Solution**:
- Use `display: table` instead of `display: grid`
- Avoid complex flexbox nesting
- Use fixed widths instead of percentages for critical elements
- Test with Puppeteer's print rendering

### 3. Header Colors Not Working

**Problem**: Header colors (name, title) don't match CSS.

**Solution**:
- Set `useCSSClassesForHeader: true` in config
- Ensure CSS classes are applied: `.{template-id}-name`, `.{template-id}-job-title`
- Remove inline `color` styles from `ResumeRenderer.tsx` (handled by config)

### 4. Sections Not Rendering

**Problem**: Some sections don't appear in preview.

**Solution**:
- Check `defaultSectionOrder` includes all sections
- Verify section `type` matches expected values
- Check `visible: true` for sections that should show
- Verify section data exists in resume content

### 5. Fonts Not Loading

**Problem**: Fonts don't render correctly.

**Solution**:
- Use web-safe fonts or include `@import` in CSS
- Ensure font names match exactly
- Test with fallback fonts: `"Font Name", fallback, sans-serif`

---

## Troubleshooting

### Template Not Appearing in List

1. ✅ Check template is registered in `templateRegistry.ts`
2. ✅ Verify config file exports correctly
3. ✅ Check template ID is unique
4. ✅ Restart development server

### CSS Not Applying

1. ✅ Verify CSS file exists in `public/resume-templates/{template-id}/style.css`
2. ✅ Run `npm run copy-template-css` or restart dev server
3. ✅ Check CSS class names match template ID
4. ✅ Verify CSS is loaded in browser DevTools

### PDF Generation Fails

1. ✅ Check CSS file is accessible at `/resume-templates/{template-id}/style.css`
2. ✅ Verify no syntax errors in CSS
3. ✅ Check Puppeteer logs for errors
4. ✅ Test with simpler CSS first

### Layout Issues

1. ✅ Use browser DevTools to inspect elements
2. ✅ Check for conflicting CSS rules
3. ✅ Verify `display` properties (table vs grid vs flex)
4. ✅ Test with minimal content first

---

## Advanced Topics

### Custom Header Layouts

For templates with profile pictures or special headers:

```typescript
headerLayout: {
  type: "with-profile-picture",  // or "name-title-split" | "standard"
  titlePosition: "below",        // or "right" | "left"
  padding: { top: 40, bottom: 40, left: 55, right: 55 },
}
```

### Two-Column Layouts

```typescript
rendering: {
  layout: {
    type: "double",
    columnWidths: { left: 40, right: 60 },
  },
}
```

### Custom Section Rendering

If you need custom rendering logic, create a dedicated component (like `ProfileHeaderLayout.tsx` for Mercury) and route to it in `ResumeRenderer.tsx` using the V2 Engine Router pattern.

---

## Resources

- **Template Types**: `src/configs/resume-templates/template-types.ts`
- **Example Templates**: 
  - Simple: `true-blue/`, `clean-slate/`
  - Modern: `atlantic-blue/`, `mercury/`
  - Complex: `executive/`
- **Rendering Component**: `src/components/ResumeRenderer.tsx`
- **Template Registry**: `src/lib/templateRegistry.ts`

---

## Getting Help

If you encounter issues:

1. Check existing templates for similar patterns
2. Review `ResumeRenderer.tsx` for rendering logic
3. Test with browser DevTools
4. Check Puppeteer/PDF generation logs
5. Ask the team for code review

---

## Checklist

Before submitting your template:

- [ ] Config file created with all required fields
- [ ] Style file created with proper class naming
- [ ] Dummy content file created (optional but recommended)
- [ ] Template registered in `templateRegistry.ts`
- [ ] Preview image added to `public/resume-template-images/`
- [ ] CSS copied to `public/resume-templates/` (automatic via build)
- [ ] Tested in browser preview
- [ ] Tested PDF generation
- [ ] Colors preserved in PDF
- [ ] Layout works with minimal content
- [ ] Layout works with maximum content
- [ ] No hardcoded template IDs in core components
- [ ] Follows naming conventions
- [ ] Includes print media queries
- [ ] Documentation/comments added

---

**Happy Template Building! 🎨**

