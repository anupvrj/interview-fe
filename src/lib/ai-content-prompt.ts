/** Shared copy for resume AI refine / regenerate prompts. */

export const AI_CONTENT_PROMPT_PLACEHOLDER =
  "e.g. Rewrite in a confident, metric-driven tone · Use short bullet points · Match my draft below and polish it · Make it more formal";

export const AI_CONTENT_PROMPT_HINT =
  "Optional. Describe your preferred style, paste a draft to refine, or ask to improve the AI suggestion.";

export const AI_CONTENT_PROMPT_PRESETS: { label: string; prompt: string }[] = [
  {
    label: "Professional & ATS-friendly",
    prompt:
      "Rewrite to be professional, ATS-friendly, and concise. Use strong action verbs. Keep the same facts as the original text.",
  },
  {
    label: "Add metrics & impact",
    prompt:
      "Emphasize quantifiable results (percentages, team size, scale). Keep facts from the original text; use placeholders like {XX%} only where needed.",
  },
  {
    label: "Shorter & punchier",
    prompt:
      "Make this shorter and more punchy while keeping the same meaning. Prefer tight bullet-style phrasing.",
  },
  {
    label: "Refine my draft",
    prompt:
      "Refine the following draft for my resume (fix grammar, improve clarity, keep my voice):\n\n[Paste your draft here]",
  },
];

export function appendUserPromptToInstructions(
  baseInstructions: string,
  userPrompt?: string,
): string {
  const trimmed = userPrompt?.trim();
  if (!trimmed) return baseInstructions;
  return `${baseInstructions}

USER INSTRUCTIONS (follow these closely; they override default style when they conflict):
${trimmed}`;
}
