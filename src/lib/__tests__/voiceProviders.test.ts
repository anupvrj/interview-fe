import { describe, expect, it } from "vitest";
import {
  buildRealtimeWsPath,
  buildVoiceQueryParam,
  DEFAULT_VOICE_PROVIDER_OPTIONS,
  formatVoiceAllowedDurations,
  formatVoiceProviderChoiceLabel,
  inferVoiceHighlightStyle,
  providerDisplayLabel,
  resolveVoiceHighlightStyle,
  resolveVoiceProviderForDuration,
  usesUnifiedVoiceProtocol,
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

describe("gemini 3.8 picker routing", () => {
  it("uses the unified Gemini websocket for 3.8 models", () => {
    expect(usesUnifiedVoiceProtocol("gemini")).toBe(true);
    expect(usesUnifiedVoiceProtocol("gemini38")).toBe(true);
    expect(usesUnifiedVoiceProtocol("gemini38extended")).toBe(true);
    expect(usesUnifiedVoiceProtocol("chatgpt")).toBe(false);
    expect(buildRealtimeWsPath("intv_1", "gemini38")).toBe(
      "interviews/intv_1/realtime/gemini",
    );
    expect(buildRealtimeWsPath("intv_1", "gemini38extended")).toBe(
      "interviews/intv_1/realtime/gemini",
    );
    expect(
      buildVoiceQueryParam("gemini38", {
        geminiVoice: "Puck",
        openaiVoice: "alloy",
        sarvamVoice: "shubh",
      }),
    ).toBe("&geminiVoice=Puck");
    expect(
      buildVoiceQueryParam("gemini38extended", {
        geminiVoice: "Kore",
        openaiVoice: "alloy",
        sarvamVoice: "shubh",
      }),
    ).toBe("&geminiVoice=Kore");
  });

  it("can select 3.8 Live when 3.1 is duration-gated", () => {
    expect(
      resolveVoiceProviderForDuration(
        "gemini",
        [
          {
            id: "gemini",
            label: "Gemini 3.1 Live",
            enabled: true,
            allowedDurations: [15],
          },
          {
            id: "gemini38",
            label: "Gemini 3.8 Live",
            enabled: true,
            allowedDurations: [15, 30],
          },
        ],
        30,
        "gemini",
      ),
    ).toBe("gemini38");
  });

  it("exposes five default picker options including 3.8 labels", () => {
    expect(DEFAULT_VOICE_PROVIDER_OPTIONS.map((option) => option.id)).toEqual([
      "gemini",
      "gemini38",
      "gemini38extended",
      "chatgpt",
      "sarvam",
    ]);
    expect(providerDisplayLabel("gemini38")).toBe("Gemini 3.8 Live");
    expect(providerDisplayLabel("gemini38extended")).toBe(
      "Gemini 3.8 Live Extended",
    );
  });
});
