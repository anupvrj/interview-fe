import type { ResumeTemplate } from "@/lib/api";
import { getExtendedTemplate } from "@/lib/templateConfigs";
import { getTemplateStyle } from "@/lib/templateRenderer";
import { isListedInTemplateColumnAssignment, type SectionWithColumn } from "@/lib/sectionColumnUtils";

/**
 * Where each section sits on the page: header, left / right column, or one column.
 * The page (ResumeRenderer), the "Order your sections" dialog and the ↑/↓ buttons all use
 * this, so a move made in one place lands where the page shows it.
 */

export type LayoutType = "single" | "double";

export interface SectionColumns<T> {
  /** Shown above the columns (not movable). */
  header: T | null;
  left: T[];
  right: T[];
  /** One-column layouts: every body section, in order. */
  single: T[];
  isDouble: boolean;
}

/** Some designs are always two columns, whatever the resume's layout setting says. */
export function effectiveLayoutType(layoutType: LayoutType | undefined, template: ResumeTemplate | null | undefined): LayoutType {
  if (!template) return layoutType ?? "single";
  const forced = getExtendedTemplate(template)?.rendering?.layout?.type === "double";
  if (forced && (template.id === "saffron-line" || template.id === "confident-grid")) return "double";
  return layoutType ?? "single";
}

export function organizeSectionColumns<T extends SectionWithColumn>(
  sections: T[],
  layoutType: LayoutType | undefined,
  template: ResumeTemplate,
): SectionColumns<T> {
  const visible = sections.filter((s) => s.visible);
  const style = getTemplateStyle(getExtendedTemplate(template));
  const type = effectiveLayoutType(layoutType, template);

  if (type === "single") {
    const pinnedHeader = style.headerLayout?.type === "with-profile-picture" || template.id === "mercury";
    const header = pinnedHeader ? visible.find((s) => s.type === "personalInfo") ?? null : null;
    return { header, left: [], right: [], single: header ? visible.filter((s) => s !== header) : visible, isDouble: false };
  }

  // A sidebar header ("two-column" header style) lives in the left column; otherwise it spans the top.
  const sidebarHeader = style.headerStyle === "two-column";
  const header = sidebarHeader ? null : visible.find((s) => s.type === "personalInfo") ?? null;
  const body = sidebarHeader ? visible : visible.filter((s) => s.type !== "personalInfo");
  const assignment = getExtendedTemplate(template)?.rendering?.layout?.columnAssignment;
  const hasAssignment = !!assignment && ((assignment.left?.length ?? 0) > 0 || (assignment.right?.length ?? 0) > 0);

  const left: T[] = [];
  const right: T[] = [];
  let flowIndex = 0;
  body.forEach((section, index) => {
    // The column the user chose (Order your sections / ↑↓) wins.
    if (section.column === "left" || section.column === "right") {
      (section.column === "left" ? left : right).push(section);
      return;
    }
    if (hasAssignment) {
      if (isListedInTemplateColumnAssignment(assignment!.right, section)) right.push(section);
      else left.push(section); // listed left, or unassigned: the main column
      return;
    }
    if (sidebarHeader) {
      if (section.type === "personalInfo") left.push(section);
      else (flowIndex++ % 2 === 0 ? right : left).push(section);
      return;
    }
    (index % 2 === 0 ? left : right).push(section);
  });

  // The sidebar header stays at the top of its column.
  for (const list of [left, right]) {
    const at = list.findIndex((s) => s.type === "personalInfo");
    if (at > 0) list.unshift(...list.splice(at, 1));
  }
  return { header, left, right, single: [], isDouble: true };
}

/** Back to a stored order: header, then left column, then right; each body section keeps its column. */
export function sectionsFromColumns<T extends SectionWithColumn>(all: T[], columns: SectionColumns<T>): T[] {
  const visibleOrdered: T[] = columns.isDouble
    ? [
        ...(columns.header ? [columns.header] : []),
        ...columns.left.map((s) => ({ ...s, column: "left" as const })),
        ...columns.right.map((s) => ({ ...s, column: "right" as const })),
      ]
    : [...(columns.header ? [columns.header] : []), ...columns.single];
  const placed = new Set(visibleOrdered.map((s) => s.id));
  return [...visibleOrdered, ...all.filter((s) => !placed.has(s.id))];
}

type ListKey = "left" | "right" | "single";

function listOf<T extends SectionWithColumn>(columns: SectionColumns<T>, id: string): ListKey | null {
  if (columns.left.some((s) => s.id === id)) return "left";
  if (columns.right.some((s) => s.id === id)) return "right";
  if (columns.single.some((s) => s.id === id)) return "single";
  return null;
}

/** First index a section may take in a list: below a header kept at the top of it. */
function firstMovableIndex<T extends SectionWithColumn>(list: T[]): number {
  return list[0]?.type === "personalInfo" ? 1 : 0;
}

/** Can ↑ / ↓ move this section within its column? */
export function sectionMoveBounds<T extends SectionWithColumn>(
  sections: T[],
  id: string,
  layoutType: LayoutType | undefined,
  template: ResumeTemplate,
): { up: boolean; down: boolean } {
  const columns = organizeSectionColumns(sections, layoutType, template);
  const key = listOf(columns, id);
  if (!key) return { up: false, down: false };
  const list = columns[key];
  const at = list.findIndex((s) => s.id === id);
  if (list[at].type === "personalInfo") return { up: false, down: false };
  return { up: at > firstMovableIndex(list), down: at < list.length - 1 };
}

/** ↑ / ↓: swap with the neighbour in the same column. Null when it can't move that way. */
export function moveSectionWithinColumn<T extends SectionWithColumn>(
  sections: T[],
  id: string,
  delta: -1 | 1,
  layoutType: LayoutType | undefined,
  template: ResumeTemplate,
): T[] | null {
  const bounds = sectionMoveBounds(sections, id, layoutType, template);
  if (delta < 0 ? !bounds.up : !bounds.down) return null;
  const columns = organizeSectionColumns(sections, layoutType, template);
  const key = listOf(columns, id)!;
  const list = [...columns[key]];
  const at = list.findIndex((s) => s.id === id);
  [list[at], list[at + delta]] = [list[at + delta], list[at]];
  return sectionsFromColumns(sections, { ...columns, [key]: list });
}

/**
 * Drop `id` into a column: before `targetId`, after it, or at the end (targetId null).
 * Never above a header kept at the top of the column. Null when nothing changes.
 */
export function dropSection<T extends SectionWithColumn>(
  sections: T[],
  id: string,
  column: ListKey,
  targetId: string | null,
  place: "before" | "after",
  layoutType: LayoutType | undefined,
  template: ResumeTemplate,
): T[] | null {
  if (targetId === id) return null;
  const columns = organizeSectionColumns(sections, layoutType, template);
  const from = listOf(columns, id);
  if (!from) return null;
  const moving = columns[from].find((s) => s.id === id)!;
  if (moving.type === "personalInfo") return null;
  const next: SectionColumns<T> = {
    ...columns,
    left: columns.left.filter((s) => s.id !== id),
    right: columns.right.filter((s) => s.id !== id),
    single: columns.single.filter((s) => s.id !== id),
  };
  const key: ListKey = columns.isDouble ? (column === "single" ? from : column) : "single";
  const list = [...next[key]];
  let at = targetId ? list.findIndex((s) => s.id === targetId) : -1;
  at = at < 0 ? list.length : place === "after" ? at + 1 : at;
  at = Math.max(at, firstMovableIndex(list));
  list.splice(at, 0, moving);
  next[key] = list;
  const out = sectionsFromColumns(sections, next);
  const same = out.length === sections.length && out.every((s, i) => s.id === sections[i].id && s.column === sections[i].column);
  return same ? null : out;
}
