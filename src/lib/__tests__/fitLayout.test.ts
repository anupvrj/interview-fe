import { describe, expect, it } from "vitest";
import { FIT_FLOORS, nextFitStep, type FitLayout } from "@/lib/fitLayout";

const base = { heading: 24, subheading: 16, body: 12, small: 10, sectionHeader: 14 };
const pad = { top: 10, bottom: 10, left: 10, right: 10 };

describe("nextFitStep", () => {
  it("tightens margins first, then body text, then headings, and stops at readable floors", () => {
    let layout: FitLayout | null = {};
    const steps: FitLayout[] = [];
    while ((layout = nextFitStep(layout, base, pad))) steps.push(layout);
    expect(steps[0].padding).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });
    expect(steps[0].fontSize).toBeUndefined();
    const last = steps[steps.length - 1];
    expect(last.padding?.top).toBe(FIT_FLOORS.padding);
    expect(last.fontSize?.body).toBe(10.5);
    expect(last.fontSize?.subheading).toBe(14);
    expect(steps.length).toBeLessThan(12);
  });

  it("never shrinks body text below 10", () => {
    let layout: FitLayout | null = { padding: { top: 6, bottom: 6, left: 6, right: 6 } };
    let min = 99;
    while ((layout = nextFitStep(layout, { ...base, body: 10.5 }, pad))) min = Math.min(min, layout.fontSize?.body ?? 99);
    expect(min).toBeGreaterThanOrEqual(10);
  });
});
