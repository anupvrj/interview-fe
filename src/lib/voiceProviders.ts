export type VoiceProvider = "gemini" | "chatgpt" | "sarvam";

export type VoiceProviderOption = {
  id: VoiceProvider;
  label: string;
  enabled: boolean;
  beta?: boolean;
  status?: string;
};

const PROVIDER_LABELS: Record<VoiceProvider, string> = {
  gemini: "Gemini Live",
  chatgpt: "ChatGPT Realtime",
  sarvam: "Sarvam AI",
};

export function resolveVoiceProvider(
  raw: string | undefined,
  fallback: VoiceProvider = "gemini",
): VoiceProvider {
  if (raw === "gemini" || raw === "chatgpt" || raw === "sarvam") return raw;
  return fallback;
}

/** Uses Gemini-style WSS protocol (audio, start_interview, end_session). */
export function usesUnifiedVoiceProtocol(provider: VoiceProvider): boolean {
  return provider === "gemini" || provider === "sarvam";
}

export function buildRealtimeWsPath(
  interviewId: string,
  provider: VoiceProvider,
): string {
  switch (provider) {
    case "gemini":
      return `interviews/${interviewId}/realtime/gemini`;
    case "sarvam":
      return `interviews/${interviewId}/realtime/sarvam`;
    case "chatgpt":
    default:
      return `interviews/${interviewId}/realtime`;
  }
}

export function buildVoiceQueryParam(
  provider: VoiceProvider,
  persona: {
    geminiVoice: string;
    openaiVoice: string;
    sarvamVoice: string;
  },
): string {
  switch (provider) {
    case "gemini":
      return `&geminiVoice=${encodeURIComponent(persona.geminiVoice)}`;
    case "sarvam":
      return `&sarvamVoice=${encodeURIComponent(persona.sarvamVoice)}`;
    case "chatgpt":
    default:
      return `&openaiVoice=${encodeURIComponent(persona.openaiVoice)}`;
  }
}

export function providerDisplayLabel(provider: VoiceProvider): string {
  return PROVIDER_LABELS[provider];
}

export type VoiceAudioTransportMode = "websocket" | "webrtc";

export function isLiveKitConfiguredOnClient(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_LIVEKIT_URL?.trim());
}

export function resolveAudioTransportMode(
  preferred?: VoiceAudioTransportMode,
): VoiceAudioTransportMode {
  const envDefault =
    process.env.NEXT_PUBLIC_VOICE_AUDIO_TRANSPORT?.trim() as
      | VoiceAudioTransportMode
      | undefined;
  const choice = preferred ?? envDefault ?? "websocket";
  if (choice === "webrtc" && isLiveKitConfiguredOnClient()) {
    return "webrtc";
  }
  return "websocket";
}

export const DEFAULT_VOICE_PROVIDER_OPTIONS: VoiceProviderOption[] = [
  { id: "gemini", label: PROVIDER_LABELS.gemini, enabled: true },
  { id: "chatgpt", label: PROVIDER_LABELS.chatgpt, enabled: true },
  { id: "sarvam", label: PROVIDER_LABELS.sarvam, enabled: true },
];
