# CSS Management Guide for Resume Templates

## Overview

Each resume template has its own dedicated `style.css` file for better organization and maintainability. This guide explains how to structure and manage CSS for templates.

## File Structure

```
interview-fe/src/configs/resume-templates/
├── atlantic-blue/
│   ├── config.ts
│   ├── dummy-content.ts
│   └── style.css          ← Template-specific CSS
├── clean-slate/
│   ├── config.ts
│   ├── dummy-content.ts
│   └── style.css          ← Template-specific CSS
└── ... (other templates)
```

## CSS Naming Convention

### BEM-Like Structure with Template Prefix

All CSS classes should follow this pattern:
```
.{template-id}-{element}
```

**Examples**:
- `.atlantic-blue-template` - Main container
- `.atlantic-blue-header` - Header section
- `.atlantic-blue-name` - Name element
- `.atlantic-blue-section-header` - Section headers

### Benefits of This Convention

1. **No Conflicts**: Each template has unique class names
2. **Easy to Debug**: Know which template a class belongs to
3. **Clear Structure**: Understand element hierarchy
4. **Maintainable**: Easy to find and update styles

## CSS File Structure

Each `style.css` file should follow this structure:

```css
/**
 * Template Name Template Styles
 * Brief description of the template design
 */

/* 1. Template Container */
.template-id-template {
  /* Base styles */
}

/* 2. Header Styles */
.template-id-header {
  /* Header layout */
}

.template-id-name {
  /* Name styling */
}

.template-id-job-title {
  /* Job title styling */
}

/* 3. Contact Styles */
.template-id-contact {
  /* Contact layout */
}

/* 4. Section Header Styles */
.template-id-section-header {
  /* Section header styling */
}

/* 5. Experience Styles */
.template-id-experience-item {
  /* Experience item layout */
}

/* 6. Skills Styles */
.template-id-skills-list {
  /* Skills layout */
}

/* 7. Education Styles */
.template-id-education-item {
  /* Education item layout */
}

/* 8. Print Styles */
@media print {
  .template-id-template {
    /* Print-specific styles */
  }
}
```

## Common CSS Patterns

### 1. Template Container

```css
.template-id-template {
  font-family: Arial, sans-serif;
  color: #000000;
  background-color: #ffffff;
  padding: 20px;
  line-height: 1.4;
}
```

### 2. Header Styles

**Centered Header**:
```css
.template-id-header {
  text-align: center;
  margin-bottom: 24px;
}
```

**Left-Aligned Header**:
```css
.template-id-header {
  text-align: left;
  margin-bottom: 24px;
}
```

**Two-Column Header**:
```css
.template-id-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
```

### 3. Section Headers

**Border Bottom**:
```css
.template-id-section-header {
  font-size: 13px;
  font-weight: bold;
  text-transform: uppercase;
  border-bottom: 1px solid #000000;
  padding-bottom: 4px;
  margin-bottom: 12px;
}
```

**Background Style**:
```css
.template-id-section-header {
  background-color: #f5f5f5;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 12px;
}
```

**Border Top and Bottom**:
```css
.template-id-section-header {
  border-top: 2px solid #000000;
  border-bottom: 2px solid #000000;
  padding: 6px 0;
  text-align: center;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}
```

### 4. Experience Layout

**Standard Vertical**:
```css
.template-id-experience-item {
  margin-bottom: 16px;
  page-break-inside: avoid;
}

.template-id-job-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
```

**Grid Layout (Date on Left)**:
```css
.template-id-experience-item {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
```

### 5. Two-Column Layout

```css
.template-id-two-column {
  display: flex;
  gap: 20px;
}

.template-id-left-column {
  width: 35%;
}

.template-id-right-column {
  width: 65%;
}
```

### 6. Print Styles

Always include print-specific styles:

```css
@media print {
  .template-id-template {
    padding: 8mm;
  }
  
  .template-id-section {
    page-break-inside: avoid;
  }
  
  .template-id-section-header {
    page-break-after: avoid;
  }
  
  .template-id-experience-item {
    page-break-inside: avoid;
  }
}
```

## Best Practices

### 1. Use Consistent Units

- **Padding/Margins**: Use `px` for consistency
- **Font Sizes**: Use `px` for precise control
- **Line Height**: Use unitless values (e.g., `1.4`)

### 2. Avoid Inline Styles

Keep all styles in the CSS file, not in config.ts:

❌ **Bad**:
```typescript
style: {
  customStyles: "color: red; font-size: 14px;"
}
```

✅ **Good**:
```css
.template-id-custom-element {
  color: red;
  font-size: 14px;
}
```

### 3. Use CSS Variables for Colors

For templates with multiple color variations:

```css
.template-id-template {
  --primary-color: #2c3e50;
  --secondary-color: #3498db;
  --text-color: #000000;
}

.template-id-name {
  color: var(--primary-color);
}
```

### 4. Page Break Control

Prevent awkward page breaks:

```css
.template-id-experience-item,
.template-id-education-item,
.template-id-project-item {
  page-break-inside: avoid;
}

.template-id-section-header {
  page-break-after: avoid;
}
```

### 5. Responsive Considerations

While resumes are primarily for print, consider responsive design:

```css
@media screen and (max-width: 768px) {
  .template-id-two-column {
    flex-direction: column;
  }
  
  .template-id-left-column,
  .template-id-right-column {
    width: 100%;
  }
}
```

## Template-Specific Examples

### Atlantic Blue (Two-Column with Sidebar)

```css
.atlantic-blue-two-column {
  display: flex;
  gap: 0;
}

.atlantic-blue-left-column {
  width: 35%;
  background-color: #2c3e50;
  color: #ffffff;
  padding: 20px;
}

.atlantic-blue-right-column {
  width: 65%;
  background-color: #ffffff;
  padding: 20px;
}
```

### Executive (Grid Timeline Layout)

```css
.executive-experience-item {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.executive-date-location {
  font-size: 9px;
  color: #666666;
}

.executive-job-content {
  flex: 1;
}
```

### Mercury (ATS-Optimized)

```css
.mercury-experience-item {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.mercury-section-header {
  background-color: #f5f5f5;
  text-align: center;
  padding: 8px 12px;
  letter-spacing: 0.5px;
}
```

## Importing CSS in Components

### Option 1: Global Import (Current Approach)

CSS is currently applied inline via config.ts. Styles in `style.css` serve as documentation and reference.

### Option 2: Component Import (Future Enhancement)

If implementing CSS imports:

```typescript
// In ResumeRenderer.tsx
import './configs/resume-templates/atlantic-blue/style.css';
```

### Option 3: Dynamic Import

```typescript
// Dynamic CSS loading based on template
useEffect(() => {
  import(`./configs/resume-templates/${templateId}/style.css`);
}, [templateId]);
```

## Debugging CSS

### 1. Use Browser DevTools

Inspect elements to see applied styles:
```
Right-click → Inspect Element → Styles tab
```

### 2. Check Class Names

Verify correct class names are applied:
```javascript
console.log(element.className);
```

### 3. Test Print Styles

Preview print layout:
```
Browser → Print Preview (Cmd/Ctrl + P)
```

## Maintenance

### Adding New Styles

1. Open template's `style.css`
2. Add new class following naming convention
3. Test in browser and print preview
4. Document any special behavior

### Updating Existing Styles

1. Find the class in `style.css`
2. Make changes
3. Test across different content lengths
4. Verify print output

### Removing Unused Styles

1. Search for class usage in codebase
2. If not used, remove from `style.css`
3. Keep file clean and organized

## Common Issues and Solutions

### Issue 1: Styles Not Applying

**Problem**: CSS classes defined but not visible
**Solution**: Verify class names match exactly (case-sensitive)

### Issue 2: Print Layout Different

**Problem**: Screen looks good but print is broken
**Solution**: Add `@media print` styles and test with print preview

### Issue 3: Page Breaks in Wrong Places

**Problem**: Content splits awkwardly across pages
**Solution**: Use `page-break-inside: avoid` on container elements

### Issue 4: Fonts Not Loading

**Problem**: Custom fonts not displaying
**Solution**: Use web-safe fonts or ensure font files are included

## Checklist for New Template CSS

When creating a new template CSS file:

- [ ] File named `style.css` in template folder
- [ ] Header comment with template name and description
- [ ] Template container class defined
- [ ] Header styles (name, job title, contact)
- [ ] Section header styles
- [ ] Experience/Education/Skills styles
- [ ] Print-specific styles (`@media print`)
- [ ] Page break controls
- [ ] Consistent naming convention used
- [ ] Comments for complex styles
- [ ] Tested in browser
- [ ] Tested in print preview

## Resources

- **CSS Reference**: [MDN CSS Documentation](https://developer.mozilla.org/en-US/docs/Web/CSS)
- **Print CSS**: [Smashing Magazine - Print CSS Guide](https://www.smashingmagazine.com/2015/01/designing-for-print-with-css/)
- **BEM Methodology**: [BEM Official Site](http://getbem.com/)

---

**Remember**: Well-organized CSS makes templates easier to maintain, debug, and extend!

