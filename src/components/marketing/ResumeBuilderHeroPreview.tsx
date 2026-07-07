"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Download,
  FileCheck,
  LayoutGrid,
  MousePointer2,
  Palette,
  PenLine,
  Sparkles,
  UserRound,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const AI_PROMPTS = [
  "Polish for interview: concise, results-driven, highlight leadership",
  "Add quantified metrics to my experience bullets",
  "Tailor summary for a senior software engineer role",
];

const AI_OPTIONS = [
  { label: "Improve writing", icon: PenLine },
  { label: "Recruiter review", icon: UserRound },
  { label: "Inspire me", icon: Sparkles },
];

const TYPING_MS = 32;
const PAUSE_MS = 2200;
const SCORE_TARGET = 86;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function useScoreCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, target]);

  return value;
}

type ResumeBuilderHeroPreviewProps = {
  templateThumbnail?: string;
  className?: string;
};

function ScoreRing({
  score,
  ringCircumference,
  ringOffset,
  size = "md",
}: {
  score: number;
  ringCircumference: number;
  ringOffset: number;
  size?: "sm" | "md";
}) {
  const shellClass =
    size === "sm"
      ? "h-16 w-16 text-base"
      : "h-[72px] w-[72px] text-lg sm:h-[84px] sm:w-[84px] sm:text-xl";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full bg-white shadow-xl",
        shellClass,
      )}
    >
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 80 80"
        aria-hidden="true"
      >
        <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={ringCircumference}
          strokeDashoffset={ringOffset}
          className="transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      <div className="relative text-center font-bold leading-none text-slate-900">
        {score}%
      </div>
    </div>
  );
}

function EditorWindow({
  templateThumbnail,
  compact = false,
}: {
  templateThumbnail?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/10 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.35)]",
        compact ? "relative" : "absolute inset-x-1 bottom-1 top-8 sm:inset-x-2 sm:bottom-2 sm:top-10",
      )}
    >
      <div className="flex h-8 items-center gap-2 border-b border-slate-100 px-3 sm:h-9 sm:px-4">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500 sm:h-6 sm:w-6">
          <Sparkles className="h-3 w-3 text-white" />
        </div>
        <div className="hidden h-2 flex-1 max-w-[120px] rounded-full bg-slate-100 sm:block" />
      </div>

      <div
        className={cn(
          "flex",
          compact ? "h-[250px]" : "h-[calc(100%-2.25rem)]",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 flex-col items-center gap-2 border-r border-slate-100 py-3 sm:gap-2.5 sm:py-4",
            compact ? "hidden w-0 border-0" : "w-10 sm:w-12",
          )}
        >
          {(
            [
              { icon: LayoutGrid, active: true },
              { icon: Palette, active: false },
              { icon: FileCheck, active: false },
            ] as const
          ).map(({ icon: Icon, active }) => (
            <div
              key={Icon.displayName ?? Icon.name}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg sm:h-8 sm:w-8",
                active ? "bg-primary/10 text-primary" : "text-slate-400",
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          ))}
          <div className="mt-auto flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white shadow-md sm:h-8 sm:w-8">
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          {!compact ? (
            <span className="hidden text-[8px] font-semibold uppercase tracking-wide text-primary sm:block">
              ATS PDF
            </span>
          ) : null}
        </div>

        <div
          className={cn(
            "relative min-h-0 min-w-0 flex-1 bg-slate-50",
            compact ? "px-3 py-1" : "p-2 sm:p-3",
          )}
        >
          {templateThumbnail ? (
            <div
              className={cn(
                "relative overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm",
                compact
                  ? "mx-auto h-full min-h-[200px] max-w-[88%]"
                  : "h-full",
              )}
            >
              <Image
                src={templateThumbnail}
                alt="Resume template preview"
                fill
                className={
                  compact
                    ? "origin-top scale-[1.28] object-cover object-top"
                    : "object-cover object-top"
                }
                sizes="(max-width: 768px) 360px, 420px"
                priority
              />
            </div>
          ) : (
            <div className="grid h-full min-h-[180px] grid-cols-[38%_1fr] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
              <div className="bg-[#1e3a5f] p-2 text-[7px] text-white sm:p-3 sm:text-[8px]">
                <div className="mb-2 font-bold uppercase tracking-wide">Strengths</div>
                <div className="space-y-1 opacity-90">
                  <div className="h-1.5 w-full rounded bg-white/20" />
                  <div className="h-1.5 w-4/5 rounded bg-white/20" />
                </div>
              </div>
              <div className="p-2 sm:p-3">
                <div className="mb-1 text-[10px] font-bold text-slate-900 sm:text-xs">
                  ALEX SANDERS
                </div>
                <div className="mb-2 text-[7px] text-slate-500 sm:text-[8px]">
                  Business Systems Analyst
                </div>
              </div>
            </div>
          )}

          <div className="resume-builder-hero-cursor pointer-events-none absolute left-[58%] top-[42%] z-10 text-primary drop-shadow-md">
            <MousePointer2 className="h-4 w-4 fill-primary sm:h-5 sm:w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AiAssistantCard({
  prompt,
  typedLen,
  showCursor,
  activeOption,
  floating = false,
}: {
  prompt: string;
  typedLen: number;
  showCursor: boolean;
  activeOption: number;
  floating?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/70 bg-white/95 p-3 shadow-2xl backdrop-blur-sm sm:p-4",
        floating
          ? "resume-builder-hero-float-c absolute bottom-2 left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-[300px] -translate-x-1/2 sm:bottom-4 sm:max-w-[340px]"
          : "relative w-full",
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary sm:text-[11px]">
          AI Assistant
        </span>
      </div>

      <div className="space-y-1.5 border-b border-slate-100 pb-2.5 sm:space-y-2 sm:pb-3">
        {AI_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          const isActive = index === activeOption;
          return (
            <div
              key={option.label}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1 text-[10px] transition-colors sm:text-[11px]",
                isActive
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-slate-600",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {option.label}
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-left sm:mt-3 sm:px-3 sm:py-2.5">
        <p className="min-h-[2.5rem] text-[10px] leading-relaxed text-slate-700 sm:min-h-[2.75rem] sm:text-[11px]">
          {prompt.slice(0, typedLen)}
          <span
            className={cn(
              "ml-0.5 inline-block w-0.5 align-middle bg-primary",
              showCursor ? "opacity-100" : "opacity-0",
            )}
            style={{ height: "0.95em" }}
          />
        </p>
      </div>
    </div>
  );
}

function TailoredCallout({ floating = false }: { floating?: boolean }) {
  return (
    <div
      className={cn(
        "max-w-[210px] rounded-xl border border-white/70 bg-white/95 px-2.5 py-2 shadow-xl backdrop-blur-sm sm:px-3 sm:py-2.5",
        floating && "resume-builder-hero-float-a absolute left-0 top-0 z-20",
      )}
    >
      <div className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-primary sm:text-[10px]">
        In one click!
      </div>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-800 sm:text-xs">
        <Wand2 className="h-3.5 w-3.5 text-primary" />
        Tailored to Job
      </div>
    </div>
  );
}

export function ResumeBuilderHeroPreview({
  templateThumbnail,
  className,
}: ResumeBuilderHeroPreviewProps) {
  const cancelled = useRef(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [typedLen, setTypedLen] = useState(0);
  const [activeOption, setActiveOption] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const score = useScoreCountUp(SCORE_TARGET);

  const prompt = AI_PROMPTS[promptIndex];
  const ringCircumference = 2 * Math.PI * 34;
  const ringOffset = ringCircumference * (1 - score / 100);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    cancelled.current = false;

    const loop = async () => {
      while (!cancelled.current) {
        for (let p = 0; p < AI_PROMPTS.length; p++) {
          if (cancelled.current) return;
          setPromptIndex(p);
          setTypedLen(0);

          for (let i = 0; i <= AI_PROMPTS[p].length; i++) {
            if (cancelled.current) return;
            setTypedLen(i);
            await sleep(TYPING_MS);
          }

          if (cancelled.current) return;
          await sleep(PAUSE_MS);
        }
      }
    };

    void loop();
    return () => {
      cancelled.current = true;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveOption((prev) => (prev + 1) % AI_OPTIONS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("relative mx-auto w-full max-w-[680px]", className)}>
      <div
        className="pointer-events-none absolute -inset-3 rounded-[1.75rem] bg-primary/10 blur-2xl sm:-inset-4"
        aria-hidden="true"
      />

      <div className="resume-builder-hero-shell relative overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0f172a] p-3 shadow-2xl sm:rounded-[1.35rem] sm:p-4">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden="true"
        />

        {/* Mobile: stacked layout so resume stays visible */}
        <div className="relative flex flex-col gap-3 sm:hidden">
          <div className="flex items-start justify-between gap-2 pt-1">
            <TailoredCallout />
            <ScoreRing
              score={score}
              ringCircumference={ringCircumference}
              ringOffset={ringOffset}
              size="sm"
            />
          </div>

          <EditorWindow templateThumbnail={templateThumbnail} compact />

          <AiAssistantCard
            prompt={prompt}
            typedLen={typedLen}
            showCursor={showCursor}
            activeOption={activeOption}
          />
        </div>

        {/* Desktop: layered floating layout */}
        <div className="relative hidden aspect-[1.05/1] min-h-[380px] sm:block">
          <EditorWindow templateThumbnail={templateThumbnail} />

          <TailoredCallout floating />

          <div className="resume-builder-hero-float-b absolute right-0 top-1 z-20 sm:top-2">
            <div className="flex flex-col items-center">
              <ScoreRing
                score={score}
                ringCircumference={ringCircumference}
                ringOffset={ringOffset}
              />
              <div className="mt-1 flex h-6 w-10 items-end justify-center">
                <div className="h-full w-full rounded-b-full bg-gradient-to-b from-primary/30 to-primary/70" />
              </div>
            </div>
          </div>

          <AiAssistantCard
            prompt={prompt}
            typedLen={typedLen}
            showCursor={showCursor}
            activeOption={activeOption}
            floating
          />
        </div>
      </div>

      <style jsx global>{`
        @keyframes resume-builder-hero-float-a {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        @keyframes resume-builder-hero-float-b {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @keyframes resume-builder-hero-float-c {
          0%,
          100% {
            transform: translate(-50%, 0);
          }
          50% {
            transform: translate(-50%, -5px);
          }
        }
        @keyframes resume-builder-hero-cursor {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(4px, 3px);
          }
        }
        .resume-builder-hero-float-a {
          animation: resume-builder-hero-float-a 4.5s ease-in-out infinite;
        }
        .resume-builder-hero-float-b {
          animation: resume-builder-hero-float-b 5s ease-in-out infinite 0.4s;
        }
        .resume-builder-hero-float-c {
          animation: resume-builder-hero-float-c 4.8s ease-in-out infinite 0.2s;
        }
        .resume-builder-hero-cursor {
          animation: resume-builder-hero-cursor 2.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .resume-builder-hero-float-a,
          .resume-builder-hero-float-b,
          .resume-builder-hero-float-c,
          .resume-builder-hero-cursor {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
