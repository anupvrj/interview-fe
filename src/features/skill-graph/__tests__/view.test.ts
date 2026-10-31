import { describe, expect, it } from "vitest";
import type { SkillGraphNode } from "../types";
import { buildSkillTree, confidenceLabel, countDescendants, headline, pct } from "../view";

function node(id: string, extra: Partial<SkillGraphNode> = {}): SkillGraphNode {
  const dot = id.lastIndexOf(".");
  const isMain = dot === -1;
  return {
    id,
    name: id.split(".").pop()!,
    parent_id: isMain ? null : id.slice(0, dot),
    lens: "knowledge",
    domain: id.split(".")[0],
    is_main: isMain,
    status: "unassessed",
    score: null,
    band: null,
    confidence: null,
    coverage: isMain ? 0 : undefined,
    importance: 1,
    evidence_count: 0,
    origin: "seed",
    ...extra,
  };
}

describe("buildSkillTree", () => {
  const nodes = [
    node("ix:security", { importance: 0.9 }),
    node("ix:databases", { score: 68, importance: 1.5 }),
    node("ix:databases.sql"),
    node("ix:databases.sql.postgresql", { status: "verified" }),
    node("ix:databases.indexing", { status: "hidden" }),
    node("ix:apis", { importance: 1.3 }),
  ];

  it("nests children under their domain and puts scored domains first", () => {
    const tree = buildSkillTree(nodes);
    expect(tree.map((n) => n.id)).toEqual(["ix:databases", "ix:apis", "ix:security"]);
    const db = tree[0];
    expect(db.children.map((c) => c.id)).toEqual(["ix:databases.sql"]);
    expect(db.children[0].children.map((c) => c.id)).toEqual(["ix:databases.sql.postgresql"]);
    expect(countDescendants(db, (n) => n.status === "verified")).toBe(1);
  });

  it("drops hidden skills unless asked for", () => {
    expect(countDescendants(buildSkillTree(nodes)[0], () => true)).toBe(2);
    expect(countDescendants(buildSkillTree(nodes, { includeHidden: true })[0], () => true)).toBe(3);
  });
});

describe("display helpers", () => {
  it("prefers a band over a score for the headline", () => {
    expect(headline({ score: null, band: "solid" })).toEqual({ kind: "band", value: "solid" });
    expect(headline({ score: 72, band: null })).toEqual({ kind: "score", value: 72 });
    expect(headline({ score: null, band: null })).toEqual({ kind: "none" });
  });

  it("formats confidence and percentages", () => {
    expect(confidenceLabel(null)).toBe("No evidence yet");
    expect(confidenceLabel(0.2)).toBe("Low confidence");
    expect(confidenceLabel(0.5)).toBe("Medium confidence");
    expect(confidenceLabel(0.7)).toBe("High confidence");
    expect(pct(0.256)).toBe("26%");
    expect(pct(null)).toBe("—");
  });

});
