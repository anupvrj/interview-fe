"use client";

import { cn } from "@/lib/utils";

export type InterviewerVoiceMode = "connecting" | "ready" | "listening" | "thinking" | "speaking";

const LABEL: Record<InterviewerVoiceMode, string> = {
  connecting: "Connecting...",
  ready: "Ready",
  listening: "Listening...",
  thinking: "Understanding your answer...",
  speaking: "Speaking...",
};

/** Start offsets so the bars move like a voice, not in lockstep. */
const BARS: Array<{ delay: string }> = [{ delay: "0s" }, { delay: "-0.45s" }, { delay: "-0.2s" }, { delay: "-0.65s" }];

/**
 * The interviewer's live state under their name: animated voice bars plus a
 * label. Listening and Speaking share the same bar animation in different
 * colours, so the candidate can tell at a glance whose turn it is.
 */
export function InterviewerVoiceStatus({
  mode,
  className,
  compact = false,
}: {
  mode: InterviewerVoiceMode;
  className?: string;
  compact?: boolean;
}) {
  const animated = mode === "listening" || mode === "speaking";
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2",
        mode === "listening" && "text-teal-300",
        mode === "speaking" && "text-violet-200",
        (mode === "connecting" || mode === "ready" || mode === "thinking") && "text-gray-300/80",
        className,
      )}
    >
      {animated && (
        <span aria-hidden className={cn("flex items-end gap-[3px]", compact ? "h-3" : "h-3.5")}>
          {BARS.map((bar, i) => (
            <span
              key={i}
              className={cn(
                "w-[3px] h-full origin-bottom rounded-full animate-voice-bar motion-reduce:animate-none motion-reduce:scale-y-75",
                mode === "listening" ? "bg-teal-300" : "bg-violet-300",
              )}
              style={{ animationDelay: bar.delay }}
            />
          ))}
        </span>
      )}
      <span>{LABEL[mode]}</span>
    </p>
  );
}
