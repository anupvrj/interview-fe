import { describe, expect, it } from "vitest";
import {
  formatVoiceAllowedDurations,
  formatVoiceProviderChoiceLabel,
  inferVoiceHighlightStyle,
  resolveVoiceHighlightStyle,
  resolveVoiceProviderForDuration,
  voiceAllowsDuration,
} from "@/lib/voiceProviders";

describe("formatVoiceProviderChoiceLabel", () => {
  it("puts the model name first and credits after", () => {
    expect(
      formatVoiceProviderChoiceLabel({
        label: "InterviewTrix Voice",
        creditsPerMinute: 8,
      }),
    ).toBe("InterviewTrix Voice - 8 credits/min");
  });

  it("keeps the Beta suffix after the rewritten label", () => {
    expect(
      formatVoiceProviderChoiceLabel({
        label: "Studio Voice",
        creditsPerMinute: 3,
        beta: true,
      }),
    ).toBe("Studio Voice (Beta) - 3 credits/min");
  });

  it("falls back to 5 credits/min when the rate is missing", () => {
    expect(
      formatVoiceProviderChoiceLabel({
        label: "Sarvam AI",
      }),
    ).toBe("Sarvam AI - 5 credits/min");
  });
});

describe("voice highlight tags", () => {
  it("infers animation from the admin tag text", () => {
    expect(inferVoiceHighlightStyle("Trending")).toBe("trending");
    expect(inferVoiceHighlightStyle("Most popular")).toBe("popular");
    expect(inferVoiceHighlightStyle("Hot pick")).toBe("hot");
    expect(inferVoiceHighlightStyle("Best")).toBe("flash");
  });

  it("disables a model for durations the admin did not enable", () => {
    expect(voiceAllowsDuration({ allowedDurations: [15] }, 15)).toBe(true);
    expect(voiceAllowsDuration({ allowedDurations: [15] }, 30)).toBe(false);
    expect(formatVoiceAllowedDurations([15])).toBe("15 min");
    expect(
      resolveVoiceProviderForDuration(
        "gemini",
        [
          { id: "gemini", label: "Gemini Live", enabled: true, allowedDurations: [15] },
          { id: "sarvam", label: "Sarvam AI", enabled: true, allowedDurations: [15, 30] },
        ],
        30,
        "gemini",
      ),
    ).toBe("sarvam");
  });

  it("uses the stored style when a tag is present", () => {
    expect(
      resolveVoiceHighlightStyle({
        highlightTag: "Popular",
        highlightStyle: "flash",
      }),
    ).toBe("flash");
    expect(resolveVoiceHighlightStyle({ highlightTag: "" })).toBeNull();
  });
});
