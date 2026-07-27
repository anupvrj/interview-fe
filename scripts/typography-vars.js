#!/usr/bin/env node
/* eslint-disable */
// One-off: converts hardcoded `font-size: Xpx` in each template's style.css to
// `font-size: var(--resume-<bucket>-font-size, Xpx)`, where <bucket> is inferred
// from the selector. Run: node scripts/typography-vars.js [--write]
const fs = require("fs");
const path = require("path");

const TPL_DIR = path.join(
  __dirname,
  "..",
  "src",
  "configs",
  "resume-templates",
);
const WRITE = process.argv.includes("--write");

// bucket priority (first match wins). Each entry: [regex, bucket]
// `id` is the template id (folder name), used to match person-name / job-title classes.
function bucketForSelector(sel, id) {
  const s = sel;
  if (/section-header|data-section-header/.test(s)) return "section-header";
  if (/(\.|^)h2\b/.test(s) || /(\.|^)h3\b/.test(s)) {
    // h2/h3 are usually section headers in these templates
    if (!/name|title|degree/.test(s)) return "section-header";
  }
  // person name: a class that is exactly `<id>-name` (word boundary, not followed by more)
  if (new RegExp(`(^|[\\s.,>+~])${id}-name(?![A-Za-z0-9-])`).test(s)) return "heading";
  if (/(\.|^)h1\b/.test(s)) return "heading";
  // job title (person): `<id>-job-title` but NOT `-job-title-exp`
  if (new RegExp(`(^|[\\s.,>+~])${id}-job-title(?![A-Za-z0-9-])`).test(s))
    return "subheading";
  if (new RegExp(`(^|[\\s.,>+~])${id}-title(?![A-Za-z0-9-])`).test(s)) {
    // project-title / award-name etc. handled below; a bare `-title` is subheading
    if (!/project|award|section|category|skill|language/.test(s))
      return "subheading";
  }
  // degree-ish (bigger than body): degree, job-title-exp, award-name, project-title, project-subtitle
  if (
    /degree|job-title-exp|award-name|project-title|project-subtitle|skill-category-name/.test(
      s,
    )
  )
    return "degree";
  // small meta: dates, contact, location, meta, issuer, rating, link
  if (/date|contact|location|meta|issuer|rating|link|subtitle/.test(s))
    return "small";
  // everything else (description, summary, body, skill, language, company, institution, bullet)
  return "body";
}

function transform(css, id) {
  // Walk through the file, tracking the current selector block.
  let out = "";
  let i = 0;
  let curSelector = "";
  let depth = 0;
  let buf = "";
  while (i < css.length) {
    const ch = css[i];
    if (depth === 0 && ch === "{") {
      curSelector = buf.trim();
      buf = "";
      depth = 1;
      out += "{";
      i++;
      continue;
    }
    if (depth > 0 && ch === "{") {
      depth++;
      out += ch;
      i++;
      continue;
    }
    if (depth > 0 && ch === "}") {
      depth--;
      out += ch;
      if (depth === 0) curSelector = "";
      i++;
      continue;
    }
    if (depth === 0) {
      buf += ch;
      out += ch;
      i++;
      continue;
    }
    // inside a block: look for `font-size: <num>px` declarations
    if (depth === 1) {
      // try to match a font-size declaration starting here
      const tail = css.slice(i);
      const m = tail.match(/^font-size:\s*(\d+(?:\.\d+)?)px(\s*!important)?/);
      if (m) {
        const bucket = bucketForSelector(curSelector, id);
        const important = m[2] || "";
        out += `font-size: var(--resume-${bucket}-font-size, ${m[1]}px)${important}`;
        i += m[0].length;
        continue;
      }
    }
    out += ch;
    i++;
  }
  return out;
}

const dirs = fs
  .readdirSync(TPL_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let totalChanges = 0;
for (const id of dirs) {
  const file = path.join(TPL_DIR, id, "style.css");
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, "utf8");
  const next = transform(src, id);
  if (next === src) {
    console.log(`${id}: no change`);
    continue;
  }
  const before = (src.match(/font-size:/g) || []).length;
  const after = (next.match(/font-size:/g) || []).length;
  const vars = (next.match(/var\(--resume-/g) || []).length;
  console.log(`${id}: ${vars} var() substitutions (font-size decls ${before} -> ${after})`);
  totalChanges += vars;
  if (WRITE) fs.writeFileSync(file, next);
}
console.log(`total var() substitutions: ${totalChanges}${WRITE ? " [WRITTEN]" : " [DRY RUN]"}`);
