/**
 * Reveal assistant captions at speaking pace so pipelined STT→LLM→TTS
 * (Sarvam) does not dump the full reply before audio starts.
 */

export const SPEECH_CAPTION_CHARS_PER_SEC = 16;
export const SPEECH_CAPTION_FINISH_DEBOUNCE_MS = 800;

export function revealedAssistantText(
  fullText: string,
  elapsedMs: number,
  charsPerSec = SPEECH_CAPTION_CHARS_PER_SEC,
): string {
  if (!fullText) return "";
  const count = Math.min(
    fullText.length,
    Math.max(0, Math.floor((elapsedMs / 1000) * charsPerSec)),
  );
  if (count >= fullText.length) return fullText;
  const slice = fullText.slice(0, count);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace >= 8) return slice.slice(0, lastSpace);
  return slice;
}

export function shouldHoldAssistantCaptionUntilAudio(
  provider: string | undefined,
): boolean {
  return provider === "sarvam";
}
