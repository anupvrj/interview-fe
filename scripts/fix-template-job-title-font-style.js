#!/usr/bin/env node
/**
 * Ensure job-title font-style in template CSS wins over any legacy inline styles.
 */

const fs = require("fs");
const path = require("path");

const TEMPLATES_DIR = path.join(__dirname, "../src/configs/resume-templates");

/** template id -> font-style for header job title (.{id}-job-title) */
const JOB_TITLE_FONT_STYLE = {
  "condensed-rule": "italic",
  "saffron-line": "italic",
  classic: "italic",
  executive: "italic",
  meridian: "normal",
  "confident-grid": "normal",
  "cobalt-stream": "normal",
  "amber-edge": "normal",
  "royal-indigo": "normal",
  "navy-frame": "normal",
  "ember-timeline": "normal",
  "true-blue": "normal",
  mercury: "normal",
  harvard: "normal",
  corporate: "normal",
  "clean-slate": "normal",
  "atlantic-blue": "normal",
};

for (const [templateId, fontStyle] of Object.entries(JOB_TITLE_FONT_STYLE)) {
  const cssPath = path.join(TEMPLATES_DIR, templateId, "style.css");
  if (!fs.existsSync(cssPath)) continue;

  let css = fs.readFileSync(cssPath, "utf8");
  const selector = `.${templateId}-job-title`;
  const ruleRe = new RegExp(
    `(${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{)([^}]*)(\\})`,
    "m",
  );

  const match = css.match(ruleRe);
  if (!match) {
    console.warn(`  ⚠ No ${selector} rule in ${templateId}`);
    continue;
  }

  let body = match[2];
  body = body.replace(/\s*font-style:\s*[^;]+;?/g, "");
  body = body.replace(/\s*font-size:\s*([^;]+);?/g, (m, size) =>
    `  font-size: ${size.trim()} !important;\n`,
  );
  body = `  font-style: ${fontStyle} !important;\n${body}`;

  const next = css.replace(ruleRe, `$1\n${body}$3`);
  if (next !== css) {
    fs.writeFileSync(cssPath, next);
    console.log(`  ✓ ${templateId} job-title font-style: ${fontStyle}`);
  }
}

console.log("\n✓ Job title font-style parity updated");
