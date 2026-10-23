import { describe, expect, it } from "vitest";
import { HACKATHON_TEMPLATES, pickHackathonTemplate } from "../hackathon-resume-template";

describe("pickHackathonTemplate", () => {
  it("picks one of the three hackathon designs", () => {
    expect(pickHackathonTemplate([], () => 0)).toBe("true-blue");
    expect(pickHackathonTemplate([], () => 0.5)).toBe("cobalt-stream");
    expect(pickHackathonTemplate([], () => 0.9999)).toBe("condensed-rule");
  });

  it("skips designs Super Admin turned off", () => {
    expect(pickHackathonTemplate(["true-blue", "cobalt-stream"], () => 0)).toBe("condensed-rule");
  });

  it("returns null when all are off (the normal template step shows)", () => {
    expect(pickHackathonTemplate([...HACKATHON_TEMPLATES])).toBeNull();
  });

  it("never goes out of range, even with random() === 1", () => {
    expect(pickHackathonTemplate([], () => 1)).toBe("condensed-rule");
  });
});
