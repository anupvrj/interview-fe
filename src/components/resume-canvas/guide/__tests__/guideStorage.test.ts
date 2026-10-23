import { beforeEach, describe, expect, it, vi } from "vitest";
import { readGuide, writeGuide } from "../guideStorage";

const data = new Map<string, string>();
vi.stubGlobal("window", {
  localStorage: {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  },
});

describe("editor guide storage", () => {
  beforeEach(() => data.clear());

  it("starts empty for a new user", () => {
    expect(readGuide("u1")).toEqual({ tour: null, prompted: false, checklistClosed: false, explored: [], milestones: [], laterCount: 0 });
  });

  it("round-trips per user", () => {
    writeGuide("u1", { tour: "done", prompted: true, checklistClosed: false, explored: ["fix"], milestones: ["exported"], laterCount: 1 });
    expect(readGuide("u1")).toMatchObject({ tour: "done", explored: ["fix"], milestones: ["exported"], laterCount: 1 });
    expect(readGuide("u2").tour).toBeNull();
  });

  it("ignores junk instead of breaking the editor", () => {
    data.set("ix:editorGuide:v1:u1", "{not json");
    expect(readGuide("u1").tour).toBeNull();
    data.set("ix:editorGuide:v1:u1", JSON.stringify({ tour: "weird", explored: [1, "ai"], milestones: "x" }));
    expect(readGuide("u1")).toMatchObject({ tour: null, explored: ["ai"], milestones: [] });
  });
});
