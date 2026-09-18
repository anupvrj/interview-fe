export type VoiceProvider = "gemini" | "chatgpt" | "sarvam";

export const VOICE_HIGHLIGHT_STYLES = [
  "popular",
  "trending",
  "flash",
  "new",
  "hot",
] as const;

export type VoiceHighlightStyle = (typeof VOICE_HIGHLIGHT_STYLES)[number];

export type VoiceProviderOption = {
  id: VoiceProvider;
  label: string;
  creditsPerMinute?: number;
  enabled: boolean;
  beta?: boolean;
  status?: string;
  isDefault?: boolean;
  highlightTag?: string;
  highlightStyle?: VoiceHighlightStyle;
  allowedDurations?: number[];
  decisionHint?: string;
};

export const VOICE_INTERVIEW_DURATIONS = [15, 30] as const;
export type VoiceInterviewDuration = (typeof VOICE_INTERVIEW_DURATIONS)[number];
export const DEFAULT_VOICE_ALLOWED_DURATIONS: VoiceInterviewDuration[] = [
  15, 30,
];

export function normalizeVoiceAllowedDurations(
  value?: number[] | null,
): VoiceInterviewDuration[] {
  const unique = [
    ...new Set((value ?? []).filter((item): item is VoiceInterviewDuration => item === 15 || item === 30)),
  ].sort((a, b) => a - b);
  return unique.length > 0 ? unique : [...DEFAULT_VOICE_ALLOWED_DURATIONS];
}

export function voiceAllowsDuration(
  option: Pick<VoiceProviderOption, "allowedDurations">,
  durationMinutes: number,
): boolean {
  return normalizeVoiceAllowedDurations(option.allowedDurations).includes(
    durationMinutes as VoiceInterviewDuration,
  );
}

export function formatVoiceAllowedDurations(
  value?: number[] | null,
): string {
  return normalizeVoiceAllowedDurations(value)
    .map((minutes) => `${minutes} min`)
    .join(" · ");
}

export function resolveVoiceProviderForDuration(
  preferred: string | undefined,
  options: VoiceProviderOption[],
  durationMinutes: number,
  current?: VoiceProvider,
): VoiceProvider {
  const available = options.filter(
    (option) =>
      option.enabled !== false && voiceAllowsDuration(option, durationMinutes),
  );
  const ids = new Set(available.map((option) => option.id));
  if (
    (preferred === "gemini" ||
      preferred === "chatgpt" ||
      preferred === "sarvam") &&
    ids.has(preferred)
  ) {
    return preferred;
  }
  if (current && ids.has(current)) return current;
  return (
    available.find((option) => option.isDefault)?.id ??
    available[0]?.id ??
    current ??
    "sarvam"
  );
}

const DEFAULT_VOICE_CREDITS_PER_MINUTE = 5;

export function formatVoiceProviderName(
  option: Pick<VoiceProviderOption, "label" | "beta">,
): string {
  return option.beta ? `${option.label} (Beta)` : option.label;
}

export function formatVoiceProviderCredits(
  option: Pick<VoiceProviderOption, "creditsPerMinute">,
): string {
  const credits =
    option.creditsPerMinute && option.creditsPerMinute > 0
      ? option.creditsPerMinute
      : DEFAULT_VOICE_CREDITS_PER_MINUTE;
  return `${credits} credits/min`;
}

export function formatVoiceProviderChoiceLabel(
  option: Pick<VoiceProviderOption, "label" | "creditsPerMinute" | "beta">,
): string {
  return `${formatVoiceProviderName(option)} - ${formatVoiceProviderCredits(option)}`;
}

export function inferVoiceHighlightStyle(tag: string): VoiceHighlightStyle {
  const normalized = tag.trim().toLowerCase();
  if (normalized.includes("trend")) return "trending";
  if (normalized.includes("popular") || normalized.includes("recommend")) {
    return "popular";
  }
  if (normalized.includes("new") || normalized.includes("fresh")) return "new";
  if (normalized.includes("hot") || normalized.includes("fire")) return "hot";
  return "flash";
}

export function resolveVoiceHighlightStyle(
  option: Pick<VoiceProviderOption, "highlightTag" | "highlightStyle">,
): VoiceHighlightStyle | null {
  const tag = option.highlightTag?.trim();
  if (!tag) return null;
  if (
    option.highlightStyle &&
    VOICE_HIGHLIGHT_STYLES.includes(option.highlightStyle)
  ) {
    return option.highlightStyle;
  }
  return inferVoiceHighlightStyle(tag);
}

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

export const DEFAULT_VOICE_PROVIDER_OPTIONS: VoiceProviderOption[] = [
  {
    id: "gemini",
    label: PROVIDER_LABELS.gemini,
    creditsPerMinute: DEFAULT_VOICE_CREDITS_PER_MINUTE,
    allowedDurations: [...DEFAULT_VOICE_ALLOWED_DURATIONS],
    enabled: true,
  },
  {
    id: "chatgpt",
    label: PROVIDER_LABELS.chatgpt,
    creditsPerMinute: DEFAULT_VOICE_CREDITS_PER_MINUTE,
    allowedDurations: [...DEFAULT_VOICE_ALLOWED_DURATIONS],
    enabled: true,
  },
  {
    id: "sarvam",
    label: PROVIDER_LABELS.sarvam,
    creditsPerMinute: DEFAULT_VOICE_CREDITS_PER_MINUTE,
    allowedDurations: [...DEFAULT_VOICE_ALLOWED_DURATIONS],
    enabled: true,
  },
];
