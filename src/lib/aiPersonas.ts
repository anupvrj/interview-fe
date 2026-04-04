/**
 * AI interviewer personas: portrait + Gemini Live voice + OpenAI Realtime voice.
 * Portraits: Unsplash (license: https://unsplash.com/license) — professional headshots.
 *
 * Voice ↔ presentation: Gemini prebuilt names match Google’s Chirp 3 HD gender labels
 * (same names as Live API). Male-presenting photos use Male voices; female-presenting use Female.
 * @see https://cloud.google.com/text-to-speech/docs/chirp3-hd#voices
 */

export type AIInterviewerPersona = {
  id: string;
  displayName: string;
  title: string;
  /** Gemini Live prebuiltVoiceConfig.voiceName */
  geminiVoice: string;
  /** OpenAI Realtime session.voice */
  openaiVoice: string;
  /** Public path under /public — persona-N matches row order below */
  imageSrc: string;
};

/**
 * persona-1.jpg — male-presenting suit photo
 * persona-2.jpg — female-presenting suit photo
 * persona-3.jpg — male-presenting
 * persona-4.jpg — female-presenting
 * persona-5.jpg — male-presenting
 * persona-6.jpg — female-presenting
 */
export const AI_INTERVIEWER_PERSONAS: AIInterviewerPersona[] = [
  {
    id: "p1",
    displayName: "Daniel Reed",
    title: "Technical interviewer",
    geminiVoice: "Charon",
    openaiVoice: "ash",
    imageSrc: "/personas/persona-1.jpg",
  },
  {
    id: "p2",
    displayName: "Rachel Kim",
    title: "Hiring manager",
    geminiVoice: "Kore",
    openaiVoice: "coral",
    imageSrc: "/personas/persona-2.jpg",
  },
  {
    id: "p3",
    displayName: "Marcus Webb",
    title: "Senior interviewer",
    geminiVoice: "Fenrir",
    openaiVoice: "verse",
    imageSrc: "/personas/persona-3.jpg",
  },
  {
    id: "p4",
    displayName: "Priya Sharma",
    title: "Lead interviewer",
    geminiVoice: "Aoede",
    openaiVoice: "sage",
    imageSrc: "/personas/persona-4.jpg",
  },
  {
    id: "p5",
    displayName: "David Okonkwo",
    title: "Panel interviewer",
    geminiVoice: "Orus",
    openaiVoice: "ballad",
    imageSrc: "/personas/persona-5.jpg",
  },
  {
    id: "p6",
    displayName: "Elena Vasquez",
    title: "Talent partner",
    geminiVoice: "Leda",
    openaiVoice: "shimmer",
    imageSrc: "/personas/persona-6.jpg",
  },
];

export function pickRandomPersona(): AIInterviewerPersona {
  const i = Math.floor(Math.random() * AI_INTERVIEWER_PERSONAS.length);
  return AI_INTERVIEWER_PERSONAS[i]!;
}
