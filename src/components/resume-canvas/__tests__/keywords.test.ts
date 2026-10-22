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
