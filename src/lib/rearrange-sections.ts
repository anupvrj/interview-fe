import type { SectionWithColumn } from "@/lib/sectionColumnUtils";

/**
 * Labels and rules for the "Order your sections" dialog. Where sections sit (header,
 * columns) and how a drop or ↑/↓ changes the order lives in sectionLayout.ts, shared with
 * the page itself.
 */

export type RearrangeLayoutType = "single" | "double";

export function canDeleteSection(section: SectionWithColumn): boolean {
  return section.type !== "personalInfo";
}

export function getSectionBoxLabel(section: SectionWithColumn): string {
  if (section.type === "personalInfo") return "Header";
  return section.title?.trim() || section.type;
}

export function isSectionLocked(section: SectionWithColumn): boolean {
  return section.type === "personalInfo";
}
