/**
 * Contract with the server's sample-data check (interview-core
 * resumePlaceholderCheck.ts): template sample content may only use labels the
 * server recognises — "Your Name", "Your Title", or "Sample <Thing> <n>".
 * If you add a new kind of sample label, add it to the server's contract test too.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const DIR = path.resolve(__dirname, "..");
const templateIds = fs.readdirSync(DIR).filter((id) => fs.existsSync(path.join(DIR, id, "dummy-content.ts")));

/** Labels the server's contract test covers. */
const KNOWN_LABEL =
  /^(Your Name|Your Title|Sample City, Country|Sample Field of Study|Sample (Job|Company|Degree|University|Project|Certificate|Organisation|Award|Achievement|Language|Interest|Skill) \d{1,2})$/;

/** Heading-level fields the server checks, per section. */
const HEADING_FIELDS: Record<string, string[]> = {
  experience: ["position", "company", "location"],
  education: ["degree", "institution", "location", "field"],
  projects: ["name"],
  certificates: ["title", "name", "issuer"],
  awards: ["title", "issuer", "organization"],
  achievements: ["title"],
  languages: ["name"],
};

describe.each(templateIds)("%s sample content", (id) => {
  it("uses only labels the server flags", async () => {
    const c = (await import(`../${id}/dummy-content.ts`)).default as Record<string, unknown>;
    const values: string[] = [];
    const info = c.personalInfo as Record<string, string>;
    values.push(info.fullName, info.portfolio);
    if (info.location) values.push(info.location);
    for (const [section, fields] of Object.entries(HEADING_FIELDS)) {
      for (const entry of (c[section] as Record<string, unknown>[] | undefined) ?? []) {
        for (const f of fields) if (typeof entry[f] === "string" && entry[f]) values.push(entry[f] as string);
      }
    }
    const skills = c.skills;
    const skillList = Array.isArray(skills)
      ? skills
      : Object.values((skills as Record<string, string>) ?? {}).flatMap((s) => s.split(", "));
    values.push(...(skillList as string[]));
    if (typeof c.interests === "string") values.push(...c.interests.split(", "));

    expect(values.filter((v) => !KNOWN_LABEL.test(v))).toEqual([]);
    expect(info.email).toBe("your.email@example.com");
    expect(info.phone).toBe("+00 00000 00000");
  });
});
