import { describe, expect, it } from "vitest";
import { addBullet, bulletsOf, fillSlot, personalFieldsToClear, removeLine, whatsLeft } from "@/lib/aiBuildMetaApply";
import type { Resume } from "@/lib/api";

const content = (desc: string) =>
  ({
    personalInfo: { fullName: "Test User", email: "t@example.com", phone: "", linkedin: "" },
    experience: [{ title: "Engineer", company: "Acme", description: desc }],
    skills: ["Go"],
  }) as unknown as Resume["content"];

const desc = "<ul><li>Cut checkout latency by [X%] by caching product lookups in Redis.</li><li>Built the order API in Go &amp; Postgres.</li></ul>";

describe("aiBuildMetaApply", () => {
  it("fills a slot in place and keeps the other line's markup", () => {
    const next = fillSlot(content(desc), "experience.0.description.0", "Cut checkout latency by [X%] by caching product lookups in Redis.", "35%")!;
    const d = (next.experience as unknown as { description: string }[])[0].description;
    expect(d).toContain("<li>Cut checkout latency by 35% by caching");
    expect(d).toContain("Go &amp; Postgres");
  });

  it("finds a moved line by its text", () => {
    const moved = "<ul><li>New first line written by the user.</li>" + desc.slice(4);
    const next = fillSlot(content(moved), "experience.0.description.0", "Cut checkout latency by [X%] by caching product lookups in Redis.", "20%")!;
    expect(bulletsOf((next.experience as unknown as { description: string }[])[0].description)[1]).toContain("by 20% by");
  });

  it("reads a description stored as a one-element array", () => {
    const c = content(desc);
    (c.experience as unknown as { description: unknown }[])[0].description = [desc];
    expect(bulletsOf([desc])).toHaveLength(2);
    const next = fillSlot(c, "experience.0.description.0", "Cut checkout latency by [X%] by caching product lookups in Redis.", "35%")!;
    expect(bulletsOf((next.experience as unknown as { description: unknown }[])[0].description)).toEqual([
      "Cut checkout latency by 35% by caching product lookups in Redis.",
      "Built the order API in Go & Postgres.",
    ]);
  });

  it("adds and removes lines", () => {
    const added = addBullet(content(desc), 0, "Mentored two interns.");
    expect(bulletsOf((added.experience as unknown as { description: string }[])[0].description)).toHaveLength(3);
    const removed = removeLine(added, "experience.0.description.1", "Built the order API in Go & Postgres.")!;
    const lines = bulletsOf((removed.experience as unknown as { description: string }[])[0].description);
    expect(lines).toEqual(["Cut checkout latency by [X%] by caching product lookups in Redis.", "Mentored two interns."]);
  });

  it("lists open items and hides dismissed or stale ones", () => {
    const meta = {
      slots: [{ path: "experience.0.description.0", text: "Cut checkout latency by [X%] by caching product lookups in Redis." }],
      skillsToConfirm: ["Kubernetes"],
      suggestions: [{ roleIndex: 0, role: "Engineer (Acme)", text: "Wrote runbooks." }],
      dismissed: ["skill:kubernetes"],
    };
    const items = whatsLeft(content(desc), meta);
    expect(items.map((i) => i.kind)).toEqual(["contact", "contact", "slot", "suggestion"]);
    const filled = fillSlot(content(desc), meta.slots[0].path, meta.slots[0].text, "35%")!;
    expect(whatsLeft(filled, meta).some((i) => i.kind === "slot")).toBe(false);
    expect(whatsLeft(content(desc), undefined)).toEqual([]);
  });

  it("flags photo / date of birth / passport for US, UK and India, but not elsewhere", () => {
    const c = content(desc);
    (c.personalInfo as Record<string, string>).dateOfBirth = "01/01/1995";
    (c.personalInfo as Record<string, string>).passportNo = "Z1234567";
    const us = whatsLeft(c, { brief: { region: "us" } }).find((i) => i.kind === "personal");
    expect(us).toMatchObject({ label: "date of birth, passport details", region: "the US" });
    expect(whatsLeft(c, { brief: { region: "eu" } }).some((i) => i.kind === "personal")).toBe(false);
    expect(personalFieldsToClear(["passportNo"])).toContain("passportDateOfExpiry");
  });

  it("lists tools named before they existed, until checked", () => {
    const meta = { timelineFlags: [{ roleIndex: 0, role: "Engineer (Acme)", tool: "chatgpt", released: 2022, roleEnded: 2019 }], dismissed: [] as string[] };
    expect(whatsLeft(content(desc), meta).find((i) => i.kind === "timeline")).toMatchObject({ key: "timeline:0:chatgpt" });
    meta.dismissed.push("timeline:0:chatgpt");
    expect(whatsLeft(content(desc), meta).some((i) => i.kind === "timeline")).toBe(false);
  });
});
