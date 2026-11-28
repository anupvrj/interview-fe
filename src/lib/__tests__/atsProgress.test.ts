import { describe, expect, it } from "vitest";
import { atsProgress } from "../atsProgress";
import type { AtsHistoryEntry } from "../api";

const entry = (score: number, at: string, checks: AtsHistoryEntry["checks"]): AtsHistoryEntry => ({
  _id: at, score, issueCount: 0, categories: {}, checks, source: "full", createdAt: at,
});
const c = (id: string, status: string, issueCount: number) => ({ id, category: "content", status, score: 50, issueCount });

describe("atsProgress", () => {
  it("needs at least two checks", () => {
    expect(atsProgress([])).toBeNull();
    expect(atsProgress([entry(40, "2026-11-01", [])])).toBeNull();
  });

  it("measures points since the first and previous check, oldest to newest", () => {
    // API order is newest first
    const p = atsProgress([
      entry(72, "2026-11-03", [c("repetition", "pass", 0), c("credibility", "fail", 2)]),
      entry(58, "2026-11-02", [c("repetition", "fail", 3), c("credibility", "pass", 0)]),
      entry(41, "2026-11-01", []),
    ])!;
    expect(p.series.map((s) => s.score)).toEqual([41, 58, 72]);
    expect(p.sinceFirst).toBe(31);
    expect(p.sinceLast).toBe(14);
    expect(p.fixedSinceLast).toEqual(["repetition"]);
    expect(p.newSinceLast).toEqual(["credibility"]);
  });
});
