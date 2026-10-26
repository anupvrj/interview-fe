import { describe, expect, it } from "vitest";
import { computeFocusCamera } from "../focus-camera";

describe("computeFocusCamera", () => {
  it("fits the whole screen in overview and never scales above 1", () => {
    const cam = computeFocusCamera({
      focused: false,
      max: 1.75,
      vpW: 640,
      vpH: 400,
      rootW: 800,
      rootH: 600,
    });
    expect(cam.s).toBeLessThanOrEqual(1);
    expect(cam.s).toBeCloseTo(Math.min(1, 640 / 800, 400 / 600));
    expect(cam.x).toBeCloseTo((640 - 800 * cam.s) / 2);
    expect(cam.y).toBeCloseTo((400 - 600 * cam.s) / 2);
  });

  it("centres a focused panel", () => {
    const panel = { x: 100, y: 80, w: 200, h: 120 };
    const cam = computeFocusCamera({
      focused: true,
      max: 1.75,
      vpW: 640,
      vpH: 400,
      rootW: 800,
      rootH: 600,
      panel,
    });
    const sc = Math.min(1.75, (640 - 40) / 200, (400 - 48) / 120);
    expect(cam.s).toBeCloseTo(sc);
    expect(cam.x).toBeCloseTo(640 / 2 - (100 + 100) * sc);
    expect(cam.y).toBeCloseTo(400 / 2 - (80 + 60) * sc);
  });
});
