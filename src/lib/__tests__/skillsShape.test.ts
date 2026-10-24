import { describe, expect, it } from "vitest";
import { unwrapSkills } from "../skillsShape";
import { parseTags, serialiseTags } from "@/components/resume-canvas/TagListPopover";

describe("skills stored as { skills: [...] }", () => {
  const stored = { skills: ["Network Protocols", "OpenMP", "MPI", "C++"] };

  it("is read as the list it holds (it printed an empty Skills heading)", () => {
    expect(unwrapSkills(stored)).toEqual(stored.skills);
    expect(unwrapSkills({ skills: "Go, Rust" })).toBe("Go, Rust");
  });

  it("other shapes are left alone (grouped skills keep their groups)", () => {
    const grouped = { technical: ["Go"], soft: ["Mentoring"] };
    expect(unwrapSkills(grouped)).toBe(grouped);
    expect(unwrapSkills(["Go"])).toEqual(["Go"]);
    expect(unwrapSkills("Go, Rust")).toBe("Go, Rust");
    expect(unwrapSkills(null)).toBeNull();
  });

  it("the editor shows its chips, and adding one keeps the others", () => {
    const { tags, shape } = parseTags(stored);
    expect(tags).toEqual(stored.skills);
    expect(serialiseTags([...tags, "FastAPI"], shape)).toEqual([...stored.skills, "FastAPI"]);
  });
});
