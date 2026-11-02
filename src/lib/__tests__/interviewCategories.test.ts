import { describe, expect, it } from "vitest";
import {
  interviewerTitleForCategory,
  interviewCategoryEmblem,
  interviewCategoryLabel,
  visibleInterviewCategories,
  type InterviewCategory,
} from "@/lib/interviewCategories";
import { normalizeInterviewDurationMinutes } from "@/lib/interviewDuration";
import { interviewRoundLabel } from "@/lib/interview-kind";
import { voiceAllowsDuration } from "@/lib/voiceProviders";

const round = (id: InterviewCategory["id"], order: number, accessible = true): InterviewCategory => ({
  id,
  name: id,
  shortDescription: "",
  emblem: "voice",
  order,
  defaultDurationMinutes: 10,
  allowedDurations: [10],
  accessible,
});

describe("interview categories", () => {
  it("shows no rounds when the feature is off for the user", () => {
    expect(visibleInterviewCategories(undefined)).toEqual([]);
    expect(visibleInterviewCategories({ enabled: false, categories: [round("managerial", 1)] })).toEqual([]);
  });

  it("shows only rounds the user may start, in order", () => {
    const visible = visibleInterviewCategories({
      enabled: true,
      categories: [round("salary_negotiation", 4), round("general_screening", 1), round("managerial", 3, false)],
    });
    expect(visible.map((c) => c.id)).toEqual(["general_screening", "salary_negotiation"]);
  });

  it("labels stored rounds and ignores unknown ids", () => {
    expect(interviewCategoryLabel("culture_fit_hr")).toBe("Culture Fit / HR");
    expect(interviewCategoryLabel("bogus")).toBeNull();
    expect(interviewCategoryLabel(undefined)).toBeNull();
    expect(interviewCategoryEmblem({ emblem: "spark" })).toBe("spark");
    expect(interviewCategoryEmblem({ emblem: "rocket" })).toBe("voice");
    expect(interviewerTitleForCategory("salary_negotiation")).toBe("Recruiter");
    expect(interviewerTitleForCategory("managerial")).toBeNull();
  });

  it("names the round in history rows", () => {
    const base = { metadata: { role: "SDE", experience: 2, language: "en" as const, createdAt: "" } };
    expect(interviewRoundLabel(base as never)).toBe("Screening Round");
    expect(interviewRoundLabel({ ...base, metadata: { ...base.metadata, interviewCategory: "salary_negotiation" } } as never)).toBe("Salary Negotiation");
  });
});

describe("10-minute rounds", () => {
  it("keeps 10 minutes instead of rounding up to 15", () => {
    expect(normalizeInterviewDurationMinutes(10)).toBe(10);
    expect(normalizeInterviewDurationMinutes("10")).toBe(10);
    expect(normalizeInterviewDurationMinutes(30)).toBe(30);
    expect(normalizeInterviewDurationMinutes(undefined)).toBe(15);
  });

  it("runs on any voice that allows 15 minutes", () => {
    expect(voiceAllowsDuration({ allowedDurations: [15] }, 10)).toBe(true);
    expect(voiceAllowsDuration({ allowedDurations: [30] }, 10)).toBe(false);
  });
});
