import { BaseVoiceAgent, type VoiceAgentCallbacks, type VoiceAgentMessage } from "./types";

/**
 * ChatGPT (OpenAI Realtime GA) voice agent. The backend forwards raw GA server
 * events as `openai_event` (response.output_audio.delta,
 * response.output_audio_transcript.*, ...); audio is 24 kHz PCM16 both ways.
 */
export class ChatGPTVoiceAgent extends BaseVoiceAgent {
  constructor(callbacks: VoiceAgentCallbacks) {
    super("chatgpt", 24000, callbacks);
  }

  handleMessage(message: VoiceAgentMessage): void {
    switch (message.type) {
      case "connected":
        this.callbacks.onConnected?.("chatgpt");
        break;
      case "openai_event":
        this.callbacks.onOpenAIEvent?.(message.event);
        break;
      case "error":
        this.callbacks.onError?.(
          typeof message.message === "string"
            ? message.message
            : "ChatGPT voice session error",
        );
        break;
      default:
        break;
    }
  }

  getStartMessage(_payload: Record<string, unknown> = {}) {
    return { type: "response.create" };
  }

  getEndMessage() {
    return { type: "close" };
  }

  getAudioMessage(base64Audio: string) {
    return { type: "audio_chunk", audio: base64Audio };
  }
}
