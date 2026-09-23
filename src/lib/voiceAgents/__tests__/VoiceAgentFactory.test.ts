import { describe, expect, it, vi } from "vitest";
import { VoiceAgentFactory } from "../VoiceAgentFactory";
import { GeminiVoiceAgent } from "../GeminiVoiceAgent";

vi.mock("../GeminiVoiceAgent", async () => {
  const { BaseVoiceAgent } = await import("../types");
  class MockGeminiVoiceAgent extends BaseVoiceAgent {
    constructor(
      callbacks: ConstructorParameters<typeof BaseVoiceAgent>[2],
      provider: ConstructorParameters<typeof BaseVoiceAgent>[0] = "gemini",
    ) {
      super(provider, 24000, callbacks ?? {});
    }
    handleMessage(): void {}
    getStartMessage(payload: Record<string, unknown>) {
      return payload;
    }
    getEndMessage() {
      return { type: "end_session" };
    }
    getAudioMessage(audio: string) {
      return { type: "audio", audio };
    }
  }
  return { GeminiVoiceAgent: MockGeminiVoiceAgent };
});

vi.mock("../ChatGPTVoiceAgent", () => ({
  ChatGPTVoiceAgent: class {
    readonly provider = "chatgpt";
  },
}));

vi.mock("../SarvamVoiceAgent", () => ({
  SarvamVoiceAgent: class {
    readonly provider = "sarvam";
  },
}));

describe("VoiceAgentFactory", () => {
  it("creates GeminiVoiceAgent for 3.8 picker ids", () => {
    const live = VoiceAgentFactory.createAgent("gemini38", {});
    const extended = VoiceAgentFactory.createAgent("gemini38extended", {});
    expect(live).toBeInstanceOf(GeminiVoiceAgent);
    expect(extended).toBeInstanceOf(GeminiVoiceAgent);
    expect(live.provider).toBe("gemini38");
    expect(extended.provider).toBe("gemini38extended");
  });

  it("detects 3.8 providers from websocket messages", () => {
    expect(
      VoiceAgentFactory.detectProviderFromMessage(
        { provider: "gemini38extended" },
        "gemini",
      ),
    ).toBe("gemini38extended");
    expect(
      VoiceAgentFactory.detectProviderFromMessage(
        { provider: "gemini38" },
        "chatgpt",
      ),
    ).toBe("gemini38");
  });
});
