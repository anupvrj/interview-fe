/** Hackathon quick start: one of these designs, picked at random (changeable in the editor). */
export const HACKATHON_TEMPLATES = ["true-blue", "cobalt-stream", "condensed-rule"] as const;

/** A random hackathon design that Super Admin hasn't turned off, or null if all are off. */
export function pickHackathonTemplate(disabled: readonly string[], random: () => number = Math.random): string | null {
  const choices = HACKATHON_TEMPLATES.filter((id) => !disabled.includes(id));
  if (!choices.length) return null;
  return choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
}
