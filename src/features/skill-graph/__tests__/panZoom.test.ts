import { describe, expect, it } from "vitest";
import { IDENTITY, MAX_ZOOM, MIN_ZOOM, clampZoom, zoomAt } from "../usePanZoom";

/** Where a viewBox point lands on screen after the pan/zoom transform. */
const project = (v: { k: number; x: number; y: number }, px: number, py: number) => ({ x: v.x + px * v.k, y: v.y + py * v.k });

describe("pan/zoom math", () => {
  it("keeps the point under the cursor fixed while zooming", () => {
    const before = { k: 1.2, x: -40, y: 25 };
    const screen = project(before, 310, 640);
    // The point currently under (screen) in content coords:
    const content = { x: (screen.x - before.x) / before.k, y: (screen.y - before.y) / before.k };
    const after = zoomAt(before, 2, screen.x, screen.y);
    const again = project(after, content.x, content.y);
    expect(again.x).toBeCloseTo(screen.x, 6);
    expect(again.y).toBeCloseTo(screen.y, 6);
  });

  it("clamps zoom between the limits", () => {
    expect(clampZoom(10)).toBe(MAX_ZOOM);
    expect(clampZoom(0.01)).toBe(MIN_ZOOM);
    expect(zoomAt(IDENTITY, 99, 500, 500).k).toBe(MAX_ZOOM);
  });

  it("zooming about the centre and back returns to identity", () => {
    const zoomed = zoomAt(IDENTITY, 2, 500, 500);
    expect(zoomed).toEqual({ k: 2, x: -500, y: -500 });
    expect(zoomAt(zoomed, 1, 500, 500)).toEqual(IDENTITY);
  });
});
