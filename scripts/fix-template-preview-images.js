#!/usr/bin/env node
/**
 * Copy template design images to preview paths (Windows-safe; no symlinks).
 * Run: node scripts/fix-template-preview-images.js
 */

const fs = require("fs");
const path = require("path");

const IMAGES_DIR = path.join(__dirname, "../public/resume-template-images");

/** preview filename -> source design filename */
const COPY_MAP = {
  "atlantic-blue-preview.webp": "atlantic-blue-template-design.webp",
  "classic-preview.webp": "classic-template-design.webp",
  "clean-slate-preview.webp": "clean-slate-form-template-design.webp",
  "corporate-preview.webp": "corporate-template-design.webp",
  "executive-preview.webp": "executive-template-design.webp",
  "harvard-preview.webp": "harvard-template-design.webp",
  "mercury-preview.webp": "Mercury-template-design.webp",
  "true-blue-preview.webp": "true-blue-template-design.webp",
  "confident-grid-preview.webp": "confident-grid-template-design.webp",
  "saffron-line-preview.webp": "saffron-line-template-design.webp",
};

let copied = 0;

for (const [preview, source] of Object.entries(COPY_MAP)) {
  const srcPath = path.join(IMAGES_DIR, source);
  const destPath = path.join(IMAGES_DIR, preview);

  if (!fs.existsSync(srcPath)) {
    console.warn(`  ⚠ Source missing: ${source}`);
    continue;
  }

  fs.copyFileSync(srcPath, destPath);
  console.log(`  ✓ ${preview} <- ${source}`);
  copied++;
}

console.log(`\n✓ Refreshed ${copied} preview images`);
