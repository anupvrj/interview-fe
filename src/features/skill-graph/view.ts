import type { CommunicationBand, SkillGraphNode, SkillLens, SkillStatus } from "./types";

export const LENS_TABS: { value: SkillLens; label: string; blurb: string }[] = [
  { value: "knowledge", label: "Knowledge", blurb: "What you know: languages, databases, systems." },
  { value: "problem_solving", label: "Problem solving", blurb: "How you work a problem: approach, trade-offs, edge cases." },
  { value: "communication", label: "Communication", blurb: "How you explain it. Shown as bands and never used to rank you." },
];

export const STATUS_META: Record<SkillStatus, { label: string; badge: "success" | "info" | "warning" | "neutral" | "danger" }> = {
  verified: { label: "Verified", badge: "success" },
  claimed: { label: "On resume", badge: "info" },
  gap: { label: "Gap", badge: "warning" },
  unassessed: { label: "Not assessed", badge: "neutral" },
  hidden: { label: "Hidden", badge: "neutral" },
};

export const BAND_LABEL: Record<CommunicationBand, string> = {
  developing: "Developing",
  solid: "Solid",
  strong: "Strong",
};

export const ROUND_LABEL: Record<string, string> = {
  resume: "Resume",
  interview: "AI interview",
  coding: "Coding round",
  system_design: "System design",
  manual: "Admin edit",
};

export interface SkillTreeNode extends SkillGraphNode {
  children: SkillTreeNode[];
}

/** Domain roots with their descendants nested, sorted by name. Hidden nodes are dropped unless asked for. */
export function buildSkillTree(nodes: SkillGraphNode[], opts: { includeHidden?: boolean } = {}): SkillTreeNode[] {
  const visible = opts.includeHidden ? nodes : nodes.filter((n) => n.status !== "hidden" || n.is_main);
  const byId = new Map<string, SkillTreeNode>(visible.map((n) => [n.id, { ...n, children: [] }]));
  const roots: SkillTreeNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parent_id ? byId.get(node.parent_id) : undefined;
    if (parent) parent.children.push(node);
    else if (node.is_main) roots.push(node);
  }
  const sort = (list: SkillTreeNode[]) => {
    list.sort((a, b) => a.name.localeCompare(b.name));
    list.forEach((n) => sort(n.children));
  };
  sort(roots);
  // Domains with a score first, then by importance.
  return roots.sort((a, b) => Number(b.score !== null || b.band !== null) - Number(a.score !== null || a.band !== null) || b.importance - a.importance);
}

export function countDescendants(node: SkillTreeNode, pred: (n: SkillTreeNode) => boolean): number {
  return node.children.reduce((sum, c) => sum + (pred(c) ? 1 : 0) + countDescendants(c, pred), 0);
}

export const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${Math.round(v * 100)}%`);

/** What a main node shows as its headline: a score, a communication band, or nothing yet. */
export function headline(node: Pick<SkillGraphNode, "score" | "band">): { kind: "score"; value: number } | { kind: "band"; value: CommunicationBand } | { kind: "none" } {
  if (node.band) return { kind: "band", value: node.band };
  if (node.score !== null) return { kind: "score", value: node.score };
  return { kind: "none" };
}

/** Plain-language confidence, so a 0.2 is not read as "20% good". */
export function confidenceLabel(confidence: number | null): string {
  if (confidence === null) return "No evidence yet";
  if (confidence < 0.35) return "Low confidence";
  if (confidence < 0.6) return "Medium confidence";
  return "High confidence";
}

