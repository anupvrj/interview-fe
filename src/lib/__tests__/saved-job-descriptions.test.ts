import { describe, expect, it } from "vitest";
import type { SavedJobDescription } from "@/lib/api";
import {
  defaultJobDescription,
  matchSavedJobDescription,
  savedJobDescriptionPreview,
  savedJobDescriptionTitle,
} from "@/lib/saved-job-descriptions";

const saved: SavedJobDescription[] = [
  { id: "a", text: "Senior Backend Engineer\nBuild payment APIs in Go.", role: "Backend Engineer", company: "Razorpay", lastUsedAt: "2026-11-02T00:00:00Z" },
  { id: "b", text: "Frontend Developer at Swiggy. React, TypeScript and design systems.", lastUsedAt: "2026-10-01T00:00:00Z" },
];

describe("saved job descriptions", () => {
  it("matches the box text to a saved post, ignoring spacing and case", () => {
    expect(matchSavedJobDescription(saved, "senior backend engineer   build payment APIs in go.")?.id).toBe("a");
    expect(matchSavedJobDescription(saved, "Senior Backend Engineer\nBuild payment APIs in Go. Remote.")).toBeUndefined();
    expect(matchSavedJobDescription(saved, "  ")).toBeUndefined();
  });

  it("titles a post by role and company, else by its first line", () => {
    expect(savedJobDescriptionTitle(saved[0]!)).toBe("Backend Engineer · Razorpay");
    expect(savedJobDescriptionTitle(saved[1]!)).toBe(`${saved[1]!.text.slice(0, 57)}…`);
  });

  it("previews a post on one short line", () => {
    expect(savedJobDescriptionPreview(saved[0]!)).toBe("Senior Backend Engineer Build payment APIs in Go.");
    expect(savedJobDescriptionPreview(saved[1]!, 20)).toBe("Frontend Developer …");
  });

  it("pre-selects last time's post, else one for the same company or role, never an unrelated one", () => {
    expect(defaultJobDescription(saved, { lastUsedId: "b", company: "Razorpay" })?.id).toBe("b");
    expect(defaultJobDescription(saved, { company: " razorpay " })?.id).toBe("a");
    expect(defaultJobDescription(saved, { role: "backend engineer" })?.id).toBe("a");
    expect(defaultJobDescription(saved, { company: "Amazon", role: "Lead Software Engineer" })).toBeUndefined();
    expect(defaultJobDescription(saved, { lastUsedId: "gone" })).toBeUndefined();
  });
});
