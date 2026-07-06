#!/usr/bin/env node
/**
 * Remove duplicate container padding from template style.css files.
 * Page gutters are applied by ResumeRenderer via config.style.padding (mm).
 */

const fs = require("fs");
const path = require("path");

const TEMPLATES_DIR = path.join(__dirname, "../src/configs/resume-templates");

const templateDirs = fs
  .readdirSync(TEMPLATES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let updated = 0;

for (const templateId of templateDirs) {
  const cssPath = path.join(TEMPLATES_DIR, templateId, "style.css");
  if (!fs.existsSync(cssPath)) continue;

  let css = fs.readFileSync(cssPath, "utf8");
  const className = `.${templateId}-template`;
  const blockRe = new RegExp(
    `(${className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{[^}]*?)\\s*padding:\\s*[^;]+;`,
    "g",
  );

  const next = css.replace(blockRe, "$1");
  if (next !== css) {
    fs.writeFileSync(cssPath, next);
    console.log(`  ✓ Removed container padding from ${templateId}/style.css`);
    updated++;
  }
}

console.log(`\n✓ Updated ${updated} template CSS files`);
