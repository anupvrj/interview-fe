#!/usr/bin/env node
/**
 * Copy Template CSS to Public Folder
 * 
 * This script copies all template CSS files from src/configs/resume-templates
 * to public/resume-templates so they can be fetched for PDF generation.
 * 
 * Run: node scripts/copy-template-css.js
 * Or: npm run copy-template-css
 */

const fs = require('fs');
const path = require('path');

const TEMPLATES_SRC = path.join(__dirname, '../src/configs/resume-templates');
const TEMPLATES_PUBLIC = path.join(__dirname, '../public/resume-templates');

// Ensure public directory exists
if (!fs.existsSync(TEMPLATES_PUBLIC)) {
  fs.mkdirSync(TEMPLATES_PUBLIC, { recursive: true });
  console.log('✓ Created public/resume-templates directory');
}

// Read all template directories
const templateDirs = fs.readdirSync(TEMPLATES_SRC, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

console.log(`Found ${templateDirs.length} templates to process...`);

let copiedCount = 0;

// Copy CSS files for each template
templateDirs.forEach(templateId => {
  const srcCssPath = path.join(TEMPLATES_SRC, templateId, 'style.css');
  
  if (fs.existsSync(srcCssPath)) {
    const destDir = path.join(TEMPLATES_PUBLIC, templateId);
    const destCssPath = path.join(destDir, 'style.css');
    
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copy CSS file
    fs.copyFileSync(srcCssPath, destCssPath);
    console.log(`  ✓ Copied ${templateId}/style.css`);
    copiedCount++;
  } else {
    console.log(`  ⚠ No style.css found for ${templateId} (optional)`);
  }
});

console.log(`\n✓ Successfully copied ${copiedCount} CSS files to public folder`);

// Mercury: editor-only bullet/ATS fixes (imported in edit page) — needed for server PDF parity
const mercuryOverridesSrc = path.join(__dirname, '../src/styles/mercury-template.css');
const mercuryDir = path.join(TEMPLATES_PUBLIC, 'mercury');
if (fs.existsSync(mercuryOverridesSrc)) {
  if (!fs.existsSync(mercuryDir)) {
    fs.mkdirSync(mercuryDir, { recursive: true });
  }
  const mercuryOverridesDest = path.join(mercuryDir, 'mercury-overrides.css');
  fs.copyFileSync(mercuryOverridesSrc, mercuryOverridesDest);
  console.log('  ✓ Copied mercury/mercury-overrides.css (editor + PDF parity)');
} else {
  console.log('  ⚠ mercury-template.css not found for overrides');
}

console.log('✓ Template CSS files are now accessible for PDF generation');

