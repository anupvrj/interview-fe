import { describe, expect, it } from "vitest";
import {
  revealedAssistantText,
  shouldHoldAssistantCaptionUntilAudio,
} from "../voice/speechSyncedTranscript";

describe("revealedAssistantText", () => {
  const line = "Walk me through your career journey so far.";

  it("stays empty before speech starts", () => {
    expect(revealedAssistantText(line, 0)).toBe("");
  });

  it("reveals on word boundaries while audio plays", () => {
    const shown = revealedAssistantText(line, 800);
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.length).toBeLessThan(line.length);
    expect(line.startsWith(shown)).toBe(true);
    expect(shown.endsWith(" ")).toBe(false);
  });

  it("returns the full line once enough time has passed", () => {
    expect(revealedAssistantText(line, 8_000)).toBe(line);
  });
});

describe("shouldHoldAssistantCaptionUntilAudio", () => {
  it("holds Sarvam captions until audio, leaves Gemini live", () => {
    expect(shouldHoldAssistantCaptionUntilAudio("sarvam")).toBe(true);
    expect(shouldHoldAssistantCaptionUntilAudio("gemini")).toBe(false);
  });
});
