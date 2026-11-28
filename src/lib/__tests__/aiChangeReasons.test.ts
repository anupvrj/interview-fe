import { describe, expect, it } from "vitest";
import { explainChanges, reasonFor } from "@/lib/aiChangeReasons";

describe("aiChangeReasons", () => {
  it("says which job words a line now uses and that numbers were kept", () => {
    const r = reasonFor("Ran 12 campaigns for the brand team", "Ran 12 paid acquisition campaigns on Google Ads for the brand team", "Own paid acquisition across Google Ads and Meta");
    expect(r).toMatch(/job's words: .*paid/);
    expect(r).toMatch(/keeps your numbers/);
  });

  it("pairs a rewritten bullet with the one it replaced", () => {
    const before = { content: { experience: [{ description: "<ul><li>Responsible for weekly sales reports for store managers</li><li>Wrote SQL</li></ul>" }] } };
    const after = { content: { experience: [{ description: "<ul><li>Built weekly sales reports in Power BI for 40 store managers</li><li>Wrote SQL</li></ul>" }] } };
    const changes = explainChanges(before, after, "Power BI dashboards");
    expect(changes).toHaveLength(1);
    expect(changes[0].before).toContain("Responsible for");
    expect(changes[0].reason).toMatch(/opens with "Built"/);
  });

  it("marks a brand-new line as new", () => {
    const changes = explainChanges({ content: { experience: [{ description: "<ul><li>Wrote SQL</li></ul>" }] } }, { content: { experience: [{ description: "<ul><li>Wrote SQL</li><li>Presented forecasts monthly to the leadership group</li></ul>" }] } });
    expect(changes[0].before).toBeUndefined();
    expect(changes[0].reason).toMatch(/New line/);
  });
});
