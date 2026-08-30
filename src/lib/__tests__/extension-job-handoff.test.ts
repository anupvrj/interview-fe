import { describe, expect, it } from "vitest";
import {
  isPracticeInterviewCapture,
  isResumeHandoffCapture,
  parsePendingJobCapture,
  tailoredResumeTitle,
} from "@/lib/extension-job-handoff";

const basePayload = {
  v: 1 as const,
  sourceUrl: "https://linkedin.com/jobs/view/1",
  title: "SDE",
  company: "Acme",
  location: "Bengaluru",
  jobDescription: "Build APIs and own delivery.",
  details: { Role: "SDE", "Key Skills": "Node.js" },
  capturedAt: "2026-08-30T00:00:00.000Z",
};

describe("extension-job-handoff", () => {
  it("parses a v1 capture payload", () => {
    const parsed = parsePendingJobCapture(JSON.stringify(basePayload));
    expect(parsed?.title).toBe("SDE");
    expect(parsed?.company).toBe("Acme");
    expect(parsed?.details?.Role).toBe("SDE");
    expect(parsed?.intent).toBeUndefined();
  });

  it("parses practice-interview intent", () => {
    const parsed = parsePendingJobCapture(
      JSON.stringify({ ...basePayload, intent: "practice-interview" }),
    );
    expect(parsed?.intent).toBe("practice-interview");
    expect(isPracticeInterviewCapture(parsed!)).toBe(true);
    expect(isResumeHandoffCapture(parsed!)).toBe(false);
  });

  it("parses resume intent", () => {
    const parsed = parsePendingJobCapture(
      JSON.stringify({ ...basePayload, intent: "resume" }),
    );
    expect(parsed?.intent).toBe("resume");
    expect(isPracticeInterviewCapture(parsed!)).toBe(false);
    expect(isResumeHandoffCapture(parsed!)).toBe(true);
  });

  it("treats legacy payloads without intent as resume handoff", () => {
    const parsed = parsePendingJobCapture(JSON.stringify(basePayload));
    expect(isResumeHandoffCapture(parsed!)).toBe(true);
    expect(isPracticeInterviewCapture(parsed!)).toBe(false);
  });

  it("strips unknown intent values", () => {
    const parsed = parsePendingJobCapture(
      JSON.stringify({ ...basePayload, intent: "unknown" }),
    );
    expect(parsed?.intent).toBeUndefined();
    expect(isResumeHandoffCapture(parsed!)).toBe(true);
  });

  it("rejects invalid payloads", () => {
    expect(parsePendingJobCapture(null)).toBeNull();
    expect(parsePendingJobCapture("{")).toBeNull();
    expect(parsePendingJobCapture(JSON.stringify({ v: 2 }))).toBeNull();
  });

  it("builds a tailored resume title", () => {
    expect(tailoredResumeTitle("SDE II", "Google")).toBe("SDE II · Google");
    expect(tailoredResumeTitle("", "")).toBe("Resume");
  });
});
