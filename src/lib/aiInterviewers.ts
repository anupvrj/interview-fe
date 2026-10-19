import {
  AI_INTERVIEWER_PERSONAS,
  pickRandomPersona,
  type AIInterviewerPersona,
} from "@/lib/aiPersonas";

export type InterviewerSelectionMode = "random" | "fixed";

export type InterviewerPersonaRecord = AIInterviewerPersona & {
  enabled: boolean;
};

export type InterviewerVoiceLists = {
  gemini: string[];
  openai: string[];
  sarvam: string[];
};

export type InterviewerCatalog = {
  selectionMode: InterviewerSelectionMode;
  fixedPersonaId: string;
  personas: InterviewerPersonaRecord[];
  voices: InterviewerVoiceLists;
};

export type PublicInterviewerCatalog = {
  selectionMode: InterviewerSelectionMode;
  fixedPersonaId: string | null;
  personas: InterviewerPersonaRecord[];
};

export function selectInterviewerPersona(
  catalog: PublicInterviewerCatalog | null | undefined,
  random: () => number = Math.random,
): AIInterviewerPersona {
  const enabled = (catalog?.personas ?? []).filter((persona) => persona.enabled !== false);
  if (enabled.length === 0) return pickRandomPersona();
  if (catalog?.selectionMode === "fixed" && catalog.fixedPersonaId) {
    const pinned = enabled.find((persona) => persona.id === catalog.fixedPersonaId);
    if (pinned) return pinned;
  }
  const index = Math.min(
    enabled.length - 1,
    Math.max(0, Math.floor(random() * enabled.length)),
  );
  return enabled[index] ?? AI_INTERVIEWER_PERSONAS[0]!;
}

export function newInterviewerId(): string {
  return `c${Math.random().toString(36).slice(2, 10)}`;
}
