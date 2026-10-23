import { beforeEach, describe, expect, it, vi } from "vitest";

const data = new Map<string, string>();
const localStorage = {
  getItem: (k: string) => data.get(k) ?? null,
  setItem: (k: string, v: string) => void data.set(k, v),
  removeItem: (k: string) => void data.delete(k),
};
vi.stubGlobal("window", { localStorage });
vi.stubGlobal("localStorage", localStorage);

const { resumeHackathonReturnTo } = await import("../interview-return-to");
const DASH = "/hackathon/hiring-games-hackathon-2026/dashboard";

describe("resumeHackathonReturnTo", () => {
  beforeEach(() => data.clear());

  it("remembers a resume opened from the hackathon, so reopening it later still offers Submit", () => {
    expect(resumeHackathonReturnTo("res_1", DASH)).toBe(DASH);
    expect(resumeHackathonReturnTo("res_1", null)).toBe(DASH);
    expect(resumeHackathonReturnTo("res_2", null)).toBeNull();
  });

  it("only remembers hackathon dashboards (other return links stay one-off)", () => {
    expect(resumeHackathonReturnTo("res_1", "/dashboard/jobs")).toBe("/dashboard/jobs");
    expect(resumeHackathonReturnTo("res_1", null)).toBeNull();
  });

  it("forgets after 30 days and ignores junk", () => {
    data.set("ix:resumeHackathon:res_1", JSON.stringify({ path: DASH, at: Date.now() - 31 * 24 * 3600 * 1000 }));
    expect(resumeHackathonReturnTo("res_1", null)).toBeNull();
    data.set("ix:resumeHackathon:res_1", "{nope");
    expect(resumeHackathonReturnTo("res_1", null)).toBeNull();
    data.set("ix:resumeHackathon:res_1", JSON.stringify({ path: "https://evil.example/x", at: Date.now() }));
    expect(resumeHackathonReturnTo("res_1", null)).toBeNull();
  });
});
