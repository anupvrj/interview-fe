import { describe, expect, it } from "vitest";
import { keywordOnResume, resumeSearchText } from "../jobKeywords";

describe("job keywords against the live resume", () => {
  const text = resumeSearchText({
    skills: ["Python", "Kubernetes"],
    experience: [{ description: "<ul><li>Built gRPC services on AWS</li></ul>" }],
  });

  it("finds keywords anywhere in the resume text, ignoring markup and case", () => {
    expect(keywordOnResume("kubernetes", text)).toBe(true);
    expect(keywordOnResume("AWS", text)).toBe(true);
  });

  it("counts an either/or keyword when one side is present", () => {
    expect(keywordOnResume("REST or gRPC", text)).toBe(true);
  });

  it("matches whole words only", () => {
    expect(keywordOnResume("Go", text)).toBe(false);
    expect(keywordOnResume("Grafana", text)).toBe(false);
  });
});

import { keywordCount } from "../jobKeywords";

describe("keyword counts for the job table", () => {
  it("counts whole-word occurrences, including either/or forms", () => {
    const text = "built rest apis. rest and grpc services; restful? no. aws, aws lambda";
    expect(keywordCount("AWS", text)).toBe(2);
    expect(keywordCount("REST or gRPC", text)).toBe(3);
    expect(keywordCount("Kafka", text)).toBe(0);
  });
});

import { jobKeywordGroups } from "../jobKeywords";
import type { ATSReportV3 } from "@/types/atsReport";

describe("job keyword groups for the report", () => {
  const report = {
    categories: {
      jobMatch: {
        checks: [
          { id: "mustHaveSkillsMatch", status: "warn", meta: { matched: ["Python", "AWS"], missing: ["Kafka", "Terraform"], partial: ["Kubernetes"] } },
          { id: "preferredSkillsMatch", status: "fail", meta: { matched: [], missing: ["GraphQL"], partial: [] } },
        ],
      },
    },
  } as unknown as ATSReportV3;

  it("splits required and preferred keywords into found, missing and partly there", () => {
    const g = jobKeywordGroups(report)!;
    expect(g.required).toEqual({ found: ["Python", "AWS"], missing: ["Kafka", "Terraform"], partial: ["Kubernetes"] });
    expect(g.preferred).toEqual({ found: [], missing: ["GraphQL"], partial: [] });
    expect(g.total).toBe(6);
    expect(g.foundCount).toBe(2);
  });

  it("moves a keyword added since the check to found", () => {
    const g = jobKeywordGroups(report, "built streaming jobs on kafka")!;
    expect(g.required!.missing).toEqual(["Terraform"]);
    expect(g.required!.found).toContain("Kafka");
    expect(g.foundCount).toBe(3);
  });

  it("is null without a job description (skipped checks)", () => {
    const none = { categories: { jobMatch: { checks: [{ id: "mustHaveSkillsMatch", status: "skipped", meta: {} }] } } } as unknown as ATSReportV3;
    expect(jobKeywordGroups(none)).toBeNull();
    expect(jobKeywordGroups(null)).toBeNull();
  });
});
