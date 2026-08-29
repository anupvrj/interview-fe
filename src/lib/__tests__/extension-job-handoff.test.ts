import { describe, expect, it } from "vitest";
import {
  parsePendingJobCapture,
  tailoredResumeTitle,
} from "@/lib/extension-job-handoff";

describe("extension-job-handoff", () => {
  it("parses a v1 capture payload", () => {
    const parsed = parsePendingJobCapture(
      JSON.stringify({
        v: 1,
        sourceUrl: "https://linkedin.com/jobs/view/1",
        title: "SDE",
        company: "Acme",
        location: "Bengaluru",
        jobDescription: "Build APIs and own delivery.",
        details: { Role: "SDE", "Key Skills": "Node.js" },
        capturedAt: "2026-08-30T00:00:00.000Z",
      }),
    );
    expect(parsed?.title).toBe("SDE");
    expect(parsed?.company).toBe("Acme");
    expect(parsed?.details?.Role).toBe("SDE");
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
