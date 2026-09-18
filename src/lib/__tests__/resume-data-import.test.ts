import { describe, expect, it } from "vitest";
import {
  getResumeProcessingMessages,
  RESUME_CHAT_PROCESSING_MESSAGES,
  RESUME_IMPORT_PROCESSING_MESSAGES,
  RESUME_JD_TAILORING_SUFFIX,
} from "../resume-data-import";

describe("getResumeProcessingMessages", () => {
  it("returns chat-specific messages for chat imports", () => {
    const messages = getResumeProcessingMessages(
      { source: "chat", templateId: "classic" },
      false,
    );
    expect(messages[0]).toBe(RESUME_CHAT_PROCESSING_MESSAGES[0]);
  });

  it("returns pdf messages for pdf imports", () => {
    const messages = getResumeProcessingMessages(
      { source: "pdf", templateId: "classic", resumeText: "text" },
      false,
    );
    expect(messages[0]).toBe(RESUME_IMPORT_PROCESSING_MESSAGES[0]);
  });

  it("appends JD tailoring suffix when a job description is present", () => {
    const messages = getResumeProcessingMessages(
      { source: "linkedin", templateId: "classic", linkedinHandle: "jane" },
      true,
    );
    expect(messages.at(-1)).toBe(
      RESUME_JD_TAILORING_SUFFIX[RESUME_JD_TAILORING_SUFFIX.length - 1],
    );
  });

  it("returns default messages for dummy imports", () => {
    const messages = getResumeProcessingMessages(
      { source: "dummy", templateId: "classic" },
      false,
    );
    expect(messages[0]).toContain("default content");
  });
});
