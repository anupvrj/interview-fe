/**
 * What an uploaded resume contains, from its text (free, instant), and its layout in words, for
 * the "found so far" panel while it's read. Only labels; nothing personal is shown or sent.
 */
import type { DesignStyle } from "./designStyle";

const SECTIONS: { label: string; heading: RegExp }[] = [
  { label: "Summary", heading: /^(professional\s+)?(summary|profile|objective|about( me)?|career objective)\b/i },
  { label: "Experience", heading: /^(work\s+|professional\s+)?(experience|employment|work history|career history)\b/i },
  { label: "Education", heading: /^(education|academic|qualifications)\b/i },
  { label: "Skills", heading: /^(technical\s+|key\s+|core\s+)?(skills|competencies|expertise|tech stack)\b/i },
  { label: "Projects", heading: /^(key\s+|personal\s+|academic\s+)?projects?\b/i },
  { label: "Certifications", heading: /^(certifications?|certificates?|licen[cs]es?)\b/i },
  { label: "Achievements", heading: /^(achievements|awards|honou?rs|accomplishments)\b/i },
  { label: "Languages", heading: /^languages?\b/i },
];

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;
const PHONE = /(\+?\d[\d\s-]{8,}\d)/;

/** "Contact details", then sections in resume order of importance, as found in the text. */
export function findResumeParts(text: string): string[] {
  const found: string[] = [];
  if (EMAIL.test(text) || PHONE.test(text)) found.push("Contact details");
  const headings = text
    .split(/\n+/)
    .map((l) => l.trim().replace(/[:•|\-–—]+$/, "").trim())
    .filter((l) => l.length > 0 && l.length <= 40);
  for (const s of SECTIONS) {
    if (headings.some((h) => s.heading.test(h))) found.push(s.label);
  }
  return found;
}

/** The look in a few words ("2 columns", "Dark left sidebar", "Sans-serif font"…). */
export function describeLayout(style: DesignStyle): { label: string; color?: string }[] {
  const out: { label: string; color?: string }[] = [{ label: style.columns === 2 ? "2 columns" : "1 column" }];
  if (style.sidebar !== "none") out.push({ label: `${style.sidebarDark ? "Dark" : "Light"} ${style.sidebar} sidebar` });
  if (style.headerBand) out.push({ label: "Coloured header" });
  if (style.serif !== null) out.push({ label: style.serif ? "Serif font" : "Sans-serif font" });
  if (style.photo) out.push({ label: "Photo" });
  if (style.accent) out.push({ label: "Colour accent", color: style.accent });
  return out;
}
