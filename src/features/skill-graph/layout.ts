import type { SkillGraphNode, SkillStatus } from "./types";

/**
 * Radial layout for the Skill Graph canvas, modelled on the homepage Skills Graph:
 * "YOU" in the centre, the tab's groups on the first ring, their skills further out.
 * Every leaf gets an equal angular slot, so the rings never overlap however many
 * skills a candidate has; a group sits at the middle of its children's span.
 */

export type GraphTab = "overall" | "technical" | "communication" | "behavioural";

export const GRAPH_TABS: { value: GraphTab; label: string }[] = [
  { value: "overall", label: "Overall" },
  { value: "technical", label: "Technical Skills" },
  { value: "communication", label: "Communication" },
  { value: "behavioural", label: "Behavioural Skills" },
];

export const COMMUNICATION_DOMAIN = "ix:comm";
export const BEHAVIOURAL_DOMAIN = "ix:behavioural";
const SOFT_DOMAINS = new Set([COMMUNICATION_DOMAIN, BEHAVIOURAL_DOMAIN]);

export const VIEW = 1000;
export const CENTER = VIEW / 2;
/** Room around the rings for labels. */
export const PAD = 140;

export type LabelSide = "above" | "below" | "left" | "right";

/** Group label metrics shared with the canvas. */
export const GROUP_FONT = 20;
export const GROUP_LINE = 25;
export const GROUP_GAP = 12;

/** Long group names wrap at " & " so neighbouring groups don't collide. */
export function splitName(name: string): string[] {
  if (name.length <= 14) return [name];
  const amp = name.indexOf(" & ");
  if (amp > 0) return [`${name.slice(0, amp)} &`, name.slice(amp + 3)];
  const mid = name.lastIndexOf(" ", Math.ceil(name.length / 2) + 2);
  return mid > 0 ? [name.slice(0, mid), name.slice(mid + 1)] : [name];
}

export function groupLabelLines(node: SkillGraphNode): { text: string; score: boolean }[] {
  const score = node.band ? node.band[0].toUpperCase() + node.band.slice(1) : node.score !== null ? String(node.score) : null;
  return [...splitName(node.name).map((text) => ({ text, score: false })), ...(score ? [{ text: score, score: true }] : [])];
}

/** Drawn radius of a first-ring node: group hubs, or an area's skills on single-area tabs. */
export function firstRingRadius(node: SkillGraphNode, singleArea: boolean): number {
  return singleArea ? 13 + Math.min(node.evidence_count, 10) * 1.2 : 18;
}

type Box = { l: number; r: number; t: number; b: number };

function labelBox(n: LaidNode, side: LabelSide, radius: number): Box {
  const lines = groupLabelLines(n.node);
  const w = Math.max(...lines.map((l) => l.text.length)) * GROUP_FONT * 0.58;
  const h = lines.length * GROUP_LINE;
  const off = radius + GROUP_GAP;
  switch (side) {
    case "above":
      return { l: n.x - w / 2, r: n.x + w / 2, t: n.y - off - h, b: n.y - off };
    case "below":
      return { l: n.x - w / 2, r: n.x + w / 2, t: n.y + off, b: n.y + off + h };
    case "left":
      return { l: n.x - off - w, r: n.x - off, t: n.y - h / 2, b: n.y + h / 2 };
    case "right":
      return { l: n.x + off, r: n.x + off + w, t: n.y - h / 2, b: n.y + h / 2 };
  }
}

const overlaps = (a: Box, b: Box) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 2 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 2;

/**
 * Greedy label placement for first-ring nodes: try the natural side first (away from
 * the centre vertically, then horizontally), keep the first box that clears the YOU
 * tile and every label already placed.
 */
export function placeGroupLabels(groups: LaidNode[], radiusOf: (n: LaidNode) => number = () => 18): void {
  const placed: Box[] = [{ l: CENTER - 60, r: CENTER + 60, t: CENTER - 60, b: CENTER + 60 }];
  const order = [...groups].sort((a, b) => a.angle - b.angle);
  for (const n of order) {
    const sin = Math.sin((n.angle * Math.PI) / 180);
    const cos = Math.cos((n.angle * Math.PI) / 180);
    const vertical: LabelSide[] = sin > 0.35 ? ["below", "above"] : sin < -0.35 ? ["above", "below"] : [];
    const horizontal: LabelSide[] = cos >= 0 ? ["right", "left"] : ["left", "right"];
    const candidates: LabelSide[] = Math.abs(sin) > 0.35 ? [vertical[0], horizontal[0], vertical[1], horizontal[1]] : [horizontal[0], "above", "below", horizontal[1]];
    const r = radiusOf(n);
    let chosen = candidates[0];
    for (const side of candidates) {
      if (!placed.some((p) => overlaps(p, labelBox(n, side, r)))) {
        chosen = side;
        break;
      }
    }
    n.labelSide = chosen;
    placed.push(labelBox(n, chosen, r));
  }
}

export interface LaidNode {
  node: SkillGraphNode;
  depth: 1 | 2 | 3;
  /** Degrees, 0 = east, clockwise (SVG). */
  angle: number;
  x: number;
  y: number;
  parentId: string | null;
  /** First-ring ancestor (the group this node belongs to). */
  groupId: string;
  hasChildren: boolean;
  /** Where a group's label sits relative to its node; chosen to avoid other labels. */
  labelSide?: LabelSide;
  /** Groups: how many skills sit under it, and whether they are folded in. */
  childCount?: number;
  folded?: boolean;
  /** Skills of a folded group: parked on the group node, invisible. */
  hiddenInGroup?: boolean;
}

export interface GraphLayout {
  nodes: LaidNode[];
  /** Single-domain tabs: the domain whose children form the first ring. */
  domain: SkillGraphNode | null;
  radialLabels: boolean;
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const polar = (angle: number, radius: number) => ({
  x: r1(CENTER + Math.cos((angle * Math.PI) / 180) * radius),
  y: r1(CENTER + Math.sin((angle * Math.PI) / 180) * radius),
});

/** Above this many leaves, labels follow the radius instead of sitting level. */
const RADIAL_LABEL_THRESHOLD = 30;

export function isTechnicalDomain(domain: string): boolean {
  return !SOFT_DOMAINS.has(domain);
}

function childrenMap(nodes: SkillGraphNode[]) {
  const map = new Map<string, SkillGraphNode[]>();
  for (const n of nodes) {
    if (!n.parent_id) continue;
    const list = map.get(n.parent_id) ?? [];
    list.push(n);
    map.set(n.parent_id, list);
  }
  for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name));
  return map;
}

/** Only skills the candidate actually has: on their resume/profile, or shown in a round. */
function keep(node: SkillGraphNode): boolean {
  return node.status !== "hidden" && node.status !== "unassessed";
}

export function layoutGraph(all: SkillGraphNode[], tab: GraphTab, opts: { folded?: ReadonlySet<string> } = {}): GraphLayout {
  const folded = opts.folded ?? new Set<string>();
  const kids = childrenMap(all);
  const mains = all.filter((n) => n.is_main && keep(n)).sort((a, b) => b.importance - a.importance || a.name.localeCompare(b.name));

  let roots: SkillGraphNode[];
  let domain: SkillGraphNode | null = null;
  if (tab === "communication" || tab === "behavioural") {
    const id = tab === "communication" ? COMMUNICATION_DOMAIN : BEHAVIOURAL_DOMAIN;
    domain = all.find((m) => m.id === id) ?? null;
    roots = domain ? (kids.get(domain.id) ?? []).filter(keep) : [];
  } else {
    roots = tab === "technical" ? mains.filter((m) => isTechnicalDomain(m.id)) : mains;
  }

  // Subtree per root, two levels below it.
  type Branch = { node: SkillGraphNode; children: Branch[] };
  const branch = (node: SkillGraphNode, depthLeft: number): Branch => ({
    node,
    children: depthLeft > 0 ? (kids.get(node.id) ?? []).filter(keep).map((c) => branch(c, depthLeft - 1)) : [],
  });
  const trees = roots.map((r) => branch(r, 2));
  // Every group on a multi-group tab gets an equal base share plus room for its skills,
  // so sparse groups never crowd their neighbours' labels.
  const rawLeaves = (b: Branch): number => (b.children.length === 0 ? 1 : b.children.reduce((s, c) => s + rawLeaves(c), 0));
  const rawTotal = trees.reduce((sum, t) => sum + rawLeaves(t), 0);
  const base = domain ? 0 : Math.max(1.5, rawTotal / Math.max(1, roots.length));
  const rootIds = new Set(roots.map((r) => r.id));
  const leafCount = (b: Branch): number => (rootIds.has(b.node.id) ? rawLeaves(b) + base : rawLeaves(b));
  const totalLeaves = trees.reduce((s, t) => s + leafCount(t), 0) || 1;
  const deepest = trees.some((t) => t.children.some((c) => c.children.length > 0)) ? 3 : trees.some((t) => t.children.length > 0) ? 2 : 1;

  // Rings scale with how deep the tab goes so a flat tab still fills the canvas.
  const radii: Record<number, number> = deepest === 1 ? { 1: 350 } : deepest === 2 ? { 1: 230, 2: 375 } : { 1: 200, 2: 325, 3: 415 };

  const step = 360 / totalLeaves;
  const out: LaidNode[] = [];
  // Centre the first group at 12 o'clock.
  let cursor = -90 - (trees[0] ? leafCount(trees[0]) * step : 0) / 2;
  /** `unit` = degrees per leaf inside the current group. */
  const place = (b: Branch, depth: 1 | 2 | 3, parentId: string | null, groupId: string, unit: number): number => {
    const start = cursor;
    let angle: number;
    if (depth === 1) {
      // A group owns its whole slice; its skills fan across most of it, leaving a gap to the next group.
      const span = leafCount(b) * step;
      const raw = rawLeaves(b);
      const margin = b.children.length > 0 && !domain ? span * 0.08 : 0;
      cursor += margin;
      if (b.children.length === 0) cursor += span - 2 * margin;
      else b.children.forEach((c) => place(c, 2, b.node.id, groupId, (span - 2 * margin) / raw));
      cursor += margin;
      angle = start + span / 2;
    } else if (b.children.length === 0) {
      angle = cursor + unit / 2;
      cursor += unit;
    } else {
      b.children.forEach((c) => place(c, (depth + 1) as 2 | 3, b.node.id, groupId, unit));
      angle = (start + cursor) / 2;
    }
    const { x, y } = polar(angle, radii[depth] ?? radii[deepest]);
    out.push({ node: b.node, depth, angle, x, y, parentId, groupId, hasChildren: b.children.length > 0 });
    return angle;
  };
  trees.forEach((t) => place(t, 1, null, t.node.id, step));

  // Folded groups pull their skills back into the group node (they animate home, then hide).
  const groupById = new Map(out.filter((n) => n.depth === 1).map((n) => [n.node.id, n]));
  for (const n of out) {
    const g = groupById.get(n.groupId);
    if (n.depth === 1) {
      n.childCount = out.filter((c) => c.groupId === n.node.id && c.depth > 1).length;
      n.folded = folded.has(n.node.id) && n.childCount > 0;
    } else if (g && folded.has(g.node.id)) {
      n.hiddenInGroup = true;
      n.x = g.x;
      n.y = g.y;
    }
  }

  placeGroupLabels(out.filter((n) => n.depth === 1), (n) => firstRingRadius(n.node, Boolean(domain)));

  return { nodes: out, domain, radialLabels: out.filter((n) => n.depth > 1 && !n.hiddenInGroup).length > RADIAL_LABEL_THRESHOLD };
}

export type StatusCounts = Record<"verified" | "gap" | "claimed", number>;

/** Legend counts over the skills (not groups) in a layout, folded or not. */
export function countStatuses(nodes: LaidNode[], tab: GraphTab): StatusCounts {
  const counts: StatusCounts = { verified: 0, gap: 0, claimed: 0 };
  for (const n of nodes) {
    if ((tab === "overall" || tab === "technical") && n.depth === 1) continue;
    const s = n.node.status as SkillStatus;
    if (s === "verified" || s === "gap" || s === "claimed") counts[s]++;
  }
  return counts;
}
