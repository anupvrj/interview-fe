import type { VoiceProvider } from "@/lib/voiceProviders";
import { ChatGPTVoiceAgent } from "./ChatGPTVoiceAgent";
import { GeminiVoiceAgent } from "./GeminiVoiceAgent";
import { SarvamVoiceAgent } from "./SarvamVoiceAgent";
import type { BaseVoiceAgent, VoiceAgentCallbacks } from "./types";

export class VoiceAgentFactory {
  static createAgent(
    provider: VoiceProvider,
    callbacks: VoiceAgentCallbacks,
  ): BaseVoiceAgent {
    switch (provider) {
      case "gemini":
        return new GeminiVoiceAgent(callbacks);
      case "sarvam":
        return new SarvamVoiceAgent(callbacks);
      case "chatgpt":
        return new ChatGPTVoiceAgent(callbacks);
      default:
        return new GeminiVoiceAgent(callbacks);
    }
  }

  static detectProviderFromMessage(
    message: Record<string, unknown>,
    fallback: VoiceProvider,
  ): VoiceProvider {
    if (
      message.provider === "gemini" ||
      message.provider === "chatgpt" ||
      message.provider === "sarvam"
    ) {
      return message.provider;
    }
    if (message.type === "openai_event") return "chatgpt";
    return fallback;
  }
}
