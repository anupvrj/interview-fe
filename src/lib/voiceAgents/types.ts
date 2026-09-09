import type { VoiceProvider } from "@/lib/voiceProviders";

export type VoiceAgentMessage = Record<string, unknown>;

export type VoiceAgentCallbacks = {
  onConnected?: (provider: VoiceProvider) => void;
  onPreparing?: (message?: string) => void;
  onAudioResponse?: (audioData: string) => void;
  onTextResponse?: (text: string, isComplete: boolean) => void;
  onUserTranscript?: (text: string, isPartial: boolean) => void;
  onTurnComplete?: () => void;
  onInterrupted?: () => void;
  onInterviewComplete?: () => void;
  onSessionEnded?: () => void;
  onError?: (message: string) => void;
  onOpenAIEvent?: (event: unknown) => void;
};

export abstract class BaseVoiceAgent {
  protected callbacks: VoiceAgentCallbacks;
  readonly provider: VoiceProvider;
  readonly sampleRate: number;

  constructor(provider: VoiceProvider, sampleRate = 24000, callbacks: VoiceAgentCallbacks) {
    this.provider = provider;
    this.sampleRate = sampleRate;
    this.callbacks = callbacks;
  }

  abstract handleMessage(message: VoiceAgentMessage): void;
  abstract getStartMessage(payload: Record<string, unknown>): Record<string, unknown>;
  abstract getEndMessage(): Record<string, unknown>;
  abstract getAudioMessage(base64Audio: string): Record<string, unknown>;
}
