import { beforeEach, describe, expect, it, vi } from "vitest";
import { markHackathonMember, readHackathonMember } from "../returningMember";

const data = new Map<string, string>();
const localStorage = {
  getItem: (k: string) => data.get(k) ?? null,
  setItem: (k: string, v: string) => void data.set(k, v),
  removeItem: (k: string) => void data.delete(k),
  clear: () => data.clear(),
};
vi.stubGlobal("window", { localStorage });

const YEAR = 365 * 24 * 60 * 60 * 1000;

describe("returning hackathon member", () => {
  beforeEach(() => localStorage.clear());

  it("is nobody until marked", () => {
    expect(readHackathonMember()).toBeNull();
  });

  it("remembers the event and never downgrades registered", () => {
    markHackathonMember("hiring-games", true, 1000);
    markHackathonMember("hiring-games", false, 2000);
    expect(readHackathonMember(3000)).toEqual({ slugs: ["hiring-games"], registered: true, at: 2000 });
  });

  it("survives sign-out (only session keys are removed) and holds no personal data", () => {
    markHackathonMember("hiring-games", false);
    localStorage.removeItem("clerk-user-id");
    expect(readHackathonMember()).not.toBeNull();
    expect(Object.keys(JSON.parse(localStorage.getItem("ix:hackathonMember")!)).sort()).toEqual(["at", "registered", "slugs", "v"]);
  });

  it("expires after a year and ignores junk", () => {
    markHackathonMember("hiring-games", false, 0);
    expect(readHackathonMember(YEAR + 1)).toBeNull();
    localStorage.setItem("ix:hackathonMember", "{not json");
    expect(readHackathonMember()).toBeNull();
  });
});
