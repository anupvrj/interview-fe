import type { VoiceProvider } from "@/lib/voiceProviders";
import { BaseVoiceAgent, type VoiceAgentCallbacks, type VoiceAgentMessage } from "./types";

export class GeminiVoiceAgent extends BaseVoiceAgent {
  constructor(
    callbacks: VoiceAgentCallbacks,
    provider: VoiceProvider = "gemini",
  ) {
    super(provider, 24000, callbacks);
  }

  handleMessage(message: VoiceAgentMessage): void {
    switch (message.type) {
      case "connected":
        this.callbacks.onConnected?.(this.provider);
        break;
      case "preparing":
        this.callbacks.onPreparing?.(
          typeof message.message === "string" ? message.message : undefined,
        );
        break;
      case "audio_response":
        if (typeof message.audioData === "string") {
          this.callbacks.onAudioResponse?.(message.audioData);
        }
        break;
      case "text_response":
        if (typeof message.text === "string") {
          const isComplete =
            message.finished === true || message.isPartial === false;
          this.callbacks.onTextResponse?.(message.text, isComplete);
        }
        break;
      case "user_transcript":
        if (typeof message.text === "string") {
          this.callbacks.onUserTranscript?.(
            message.text,
            message.isPartial === true,
          );
        }
        break;
      case "turn_complete":
        this.callbacks.onTurnComplete?.();
        break;
      case "interrupted":
        this.callbacks.onInterrupted?.();
        break;
      case "interview_complete":
        this.callbacks.onInterviewComplete?.();
        break;
      case "session_ended":
        this.callbacks.onSessionEnded?.();
        break;
      case "error":
        this.callbacks.onError?.(
          typeof message.message === "string"
            ? message.message
            : "Voice session error",
        );
        break;
      default:
        break;
    }
  }

  getStartMessage(payload: Record<string, unknown>) {
    return { type: "start_interview", ...payload };
  }

  getEndMessage() {
    return { type: "end_session" };
  }

  getAudioMessage(base64Audio: string) {
    return { type: "audio", audioData: base64Audio };
  }
}
