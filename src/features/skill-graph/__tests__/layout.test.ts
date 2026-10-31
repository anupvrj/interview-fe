import { describe, expect, it } from "vitest";
import type { SkillGraphNode } from "../types";
import { CENTER, countStatuses, layoutGraph } from "../layout";

function node(id: string, extra: Partial<SkillGraphNode> = {}): SkillGraphNode {
  const dot = id.lastIndexOf(".");
  const isMain = dot === -1;
  return {
    id, name: id.split(".").pop()!, parent_id: isMain ? null : id.slice(0, dot), lens: "knowledge", domain: id.split(".")[0],
    is_main: isMain, status: "unassessed", score: null, band: null, confidence: null, coverage: isMain ? 0 : undefined,
    importance: 1, evidence_count: 0, origin: "seed", ...extra,
  };
}

const graph = [
  node("ix:databases", { score: 60, status: "verified", importance: 1.5 }),
  node("ix:databases.sql", { status: "unassessed" }),
  node("ix:databases.sql.postgresql", { status: "verified", evidence_count: 3 }),
  node("ix:databases.indexing", { status: "gap" }),
  node("ix:databases.nosql"),
  node("ix:dsa", { importance: 1.4, status: "claimed" }),
  node("ix:dsa.graphs", { status: "claimed" }),
  node("ix:comm", { lens: "communication", band: "solid", status: "verified" }),
  node("ix:comm.clarity", { lens: "communication", status: "verified" }),
  node("ix:comm.fluency", { lens: "communication" }),
  node("ix:behavioural", { lens: "communication" }),
  node("ix:behavioural.ownership", { lens: "communication" }),
  node("ix:security"),
];

const dist = (n: { x: number; y: number }) => Math.hypot(n.x - CENTER, n.y - CENTER);

describe("layoutGraph", () => {
  it("shows only the candidate's skills: no untested skills, no empty areas", () => {
    const { nodes } = layoutGraph(graph, "technical");
    expect(nodes.map((n) => n.node.id).sort()).toEqual(["ix:databases", "ix:databases.indexing", "ix:dsa", "ix:dsa.graphs"]);
    // ix:security has nothing the candidate has → hidden; ix:dsa shows because it holds a claimed skill.
    const db = nodes.find((n) => n.node.id === "ix:databases")!;
    const idx = nodes.find((n) => n.node.id === "ix:databases.indexing")!;
    expect(db.depth).toBe(1);
    expect(idx).toMatchObject({ depth: 2, parentId: "ix:databases", groupId: "ix:databases" });
    expect(dist(idx)).toBeGreaterThan(dist(db));
  });

  it("folding a group parks its skills on the group node and reports the count", () => {
    const { nodes } = layoutGraph(graph, "technical", { folded: new Set(["ix:databases"]) });
    const db = nodes.find((n) => n.node.id === "ix:databases")!;
    const idx = nodes.find((n) => n.node.id === "ix:databases.indexing")!;
    expect(db).toMatchObject({ folded: true, childCount: 1 });
    expect(idx).toMatchObject({ hiddenInGroup: true, x: db.x, y: db.y });
    const dsa = nodes.find((n) => n.node.id === "ix:dsa")!;
    expect(dsa.folded).toBe(false);
  });

  it("communication tab: the area's skills the candidate has become the first ring around YOU", () => {
    const layout = layoutGraph(graph, "communication");
    expect(layout.domain?.id).toBe("ix:comm");
    expect(layout.nodes.map((n) => n.node.id)).toEqual(["ix:comm.clarity"]);
    expect(layout.nodes.every((n) => n.depth === 1)).toBe(true);
  });

  it("overall tab includes every area the candidate has; behavioural with nothing is empty", () => {
    expect(layoutGraph(graph, "overall").nodes.filter((n) => n.depth === 1).map((n) => n.node.id).sort()).toEqual(["ix:comm", "ix:databases", "ix:dsa"]);
    expect(layoutGraph(graph, "behavioural").nodes).toEqual([]);
  });

  it("gives every node a distinct position and centres the first group at the top", () => {
    const { nodes } = layoutGraph(graph, "overall");
    const keys = new Set(nodes.map((n) => `${n.x},${n.y}`));
    expect(keys.size).toBe(nodes.length);
    const first = nodes.find((n) => n.node.id === "ix:databases")!;
    expect(first.x).toBeCloseTo(CENTER, 0);
    expect(first.y).toBeLessThan(CENTER);
  });

  it("counts statuses over skills, not groups", () => {
    expect(countStatuses(layoutGraph(graph, "technical").nodes, "technical")).toEqual({ verified: 0, gap: 1, claimed: 1 });
  });
});
