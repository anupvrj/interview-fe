"use client";

import Image from "next/image";
import type { AIInterviewerPersona } from "@/lib/aiPersonas";
import { cn } from "@/lib/utils";

type Props = Readonly<{
  persona: AIInterviewerPersona;
  isSpeaking: boolean;
  isProcessing?: boolean;
  className?: string;
  size?: "md" | "lg";
}>;

export function AiPersonaAvatar({
  persona,
  isSpeaking,
  isProcessing = false,
  className,
  size = "lg",
}: Props) {
  const active = isSpeaking || isProcessing;
  const dim = size === "lg" ? 112 : 88;
  const pad = 28;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-visible",
        className,
      )}
      style={{
        width: dim + pad * 2,
        height: dim + pad * 2,
        minWidth: dim + pad * 2,
        minHeight: dim + pad * 2,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <div
          className="rounded-full border border-white/25"
          style={{ width: dim + 6, height: dim + 6 }}
        />
      </div>

      {active && (
        <>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                "origin-center box-border rounded-full border-2 shadow-[0_0_14px_rgba(139,92,246,0.35)] will-change-transform",
                isSpeaking
                  ? "animate-ai-avatar-ring border-violet-400/90"
                  : "animate-pulse border-primary/75",
              )}
              style={{ width: dim + 14, height: dim + 14 }}
            />
          </div>
          {isSpeaking && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                className="origin-center box-border animate-ai-avatar-ring-delayed rounded-full border border-fuchsia-400/65 will-change-transform"
                style={{ width: dim + 28, height: dim + 28 }}
              />
            </div>
          )}
        </>
      )}

      <div
        className={cn(
          "relative z-10 overflow-hidden rounded-full border-4 border-white/25 bg-zinc-800 shadow-xl ring-1 ring-white/10",
          active && isSpeaking && "animate-ai-avatar-inner ring-violet-300/50",
        )}
        style={{ width: dim, height: dim }}
      >
        <Image
          src={persona.imageSrc}
          alt={`${persona.displayName}, AI interviewer`}
          width={dim}
          height={dim}
          className="h-full w-full object-cover"
          priority
        />
      </div>
    </div>
  );
}
