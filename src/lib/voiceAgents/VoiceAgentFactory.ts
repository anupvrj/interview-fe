import type { VoiceProvider } from "@/lib/voiceProviders";
import { isVoiceProvider } from "@/lib/voiceProviders";
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
      case "gemini38":
      case "gemini38extended":
        return new GeminiVoiceAgent(callbacks, provider);
      case "sarvam":
        return new SarvamVoiceAgent(callbacks);
      case "chatgpt":
        return new ChatGPTVoiceAgent(callbacks);
      default:
        return new GeminiVoiceAgent(callbacks, "gemini");
    }
  }

  static detectProviderFromMessage(
    message: Record<string, unknown>,
    fallback: VoiceProvider,
  ): VoiceProvider {
    if (isVoiceProvider(message.provider)) {
      return message.provider;
    }
    if (message.type === "openai_event") return "chatgpt";
    return fallback;
  }
}
