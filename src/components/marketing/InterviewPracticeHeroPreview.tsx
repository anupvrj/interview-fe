"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, MessageSquare, Mic } from "lucide-react";

const QUESTION =
  "Explain the difference between REST and GraphQL APIs. When would you choose one over the other?";
const RESPONSE =
  "REST is a stateless architectural style that uses standard HTTP methods...";

const TYPING_MS = 28;
const PAUSE_AFTER_QUESTION_MS = 500;
const PAUSE_AFTER_RESPONSE_MS = 2800;
const LOOP_GAP_MS = 1200;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function useMetricCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, target]);

  return value;
}

function InterviewSessionCard() {
  const cancelled = useRef(false);
  const [questionLen, setQuestionLen] = useState(0);
  const [responseLen, setResponseLen] = useState(0);
  const [phase, setPhase] = useState<"question" | "response" | "hold">("question");

  const confidence = useMetricCountUp(8.5);
  const accuracy = useMetricCountUp(92);

  useEffect(() => {
    cancelled.current = false;

    const loop = async () => {
      while (!cancelled.current) {
        setQuestionLen(0);
        setResponseLen(0);
        setPhase("question");

        for (let i = 0; i <= QUESTION.length; i++) {
          if (cancelled.current) return;
          setQuestionLen(i);
          await sleep(TYPING_MS);
        }

        if (cancelled.current) return;
        await sleep(PAUSE_AFTER_QUESTION_MS);
        setPhase("response");

        for (let i = 0; i <= RESPONSE.length; i++) {
          if (cancelled.current) return;
          setResponseLen(i);
          await sleep(TYPING_MS);
        }

        if (cancelled.current) return;
        setPhase("hold");
        await sleep(PAUSE_AFTER_RESPONSE_MS);
        if (cancelled.current) return;
        await sleep(LOOP_GAP_MS);
      }
    };

    void loop();
    return () => {
      cancelled.current = true;
    };
  }, []);

  const questionSlice = QUESTION.slice(0, questionLen);
  const responseSlice = RESPONSE.slice(0, responseLen);
  const showQuestionCursor = phase === "question" && questionLen < QUESTION.length;
  const showResponseCursor = phase === "response" && responseLen < RESPONSE.length;

  return (
    <div className="relative shake-vertical">
      <div
        className="pointer-events-none absolute inset-0 hidden rotate-3 rounded-3xl bg-primary opacity-10 md:block"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-2xl border-2 border-border bg-card shadow-2xl">
        <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute opacity-10"
              style={{
                left: `${(i * 18) % 100}%`,
                top: `${(i * 20) % 100}%`,
                animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              {i % 3 === 0 ? (
                <Mic className="h-8 w-8 text-primary/70" />
              ) : i % 3 === 1 ? (
                <Brain className="h-8 w-8 text-primary/70" />
              ) : (
                <MessageSquare className="h-8 w-8 text-primary/70" />
              )}
            </div>
          ))}
        </div>

        <div className="relative z-10 p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3 md:mb-6 md:pb-4">
            <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
              <div className="mic-animated flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary shadow-lg md:h-8 md:w-8">
                <Mic className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">
                  AI Interview Session
                </div>
                <div className="text-xs text-primary">Live • Technical Round</div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-xs font-medium text-primary">Recording</span>
            </div>
          </div>

          <div className="mb-4 md:mb-6">
            <div className="mb-3 rounded-lg border border-border bg-white/80 p-3 backdrop-blur-sm md:mb-4 md:p-4">
              <p className="mb-2 text-sm font-medium text-primary">
                Question 3 of 10
              </p>
              <p className="min-h-[3.25rem] text-sm leading-relaxed text-slate-900 md:min-h-[3.5rem] md:text-base">
                &ldquo;{questionSlice}
                {showQuestionCursor ? (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
                ) : null}
                &rdquo;
              </p>
            </div>

            <div className="rounded-lg border border-border bg-white/60 p-3 backdrop-blur-sm md:p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="text-xs font-medium text-primary">
                  Your Response
                </span>
              </div>
              <p className="min-h-[2.5rem] text-sm italic leading-relaxed text-slate-700 md:min-h-[2.75rem]">
                {responseLen > 0 || phase !== "question" ? (
                  <>
                    &ldquo;{responseSlice}
                    {showResponseCursor ? (
                      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
                    ) : null}
                    &rdquo;
                  </>
                ) : (
                  <span className="text-slate-400">Waiting for your answer…</span>
                )}
              </p>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-3 gap-2 border-t border-border pt-4 md:gap-4">
            <div className="min-w-0 text-center">
              <div className="text-xl font-bold tabular-nums text-primary md:text-2xl">
                {confidence.toFixed(1)}
              </div>
              <div className="mt-1 text-[10px] text-primary md:text-xs">Confidence</div>
            </div>
            <div className="min-w-0 text-center">
              <div className="text-xl font-bold tabular-nums text-green-600 md:text-2xl">
                {Math.round(accuracy)}%
              </div>
              <div className="mt-1 text-[10px] text-primary md:text-xs">Accuracy</div>
            </div>
            <div className="min-w-0 text-center">
              <div className="text-xl font-bold tabular-nums text-primary md:text-2xl">
                2:34
              </div>
              <div className="mt-1 text-[10px] text-primary md:text-xs">Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InterviewPracticeHeroPreview() {
  return <InterviewSessionCard />;
}
