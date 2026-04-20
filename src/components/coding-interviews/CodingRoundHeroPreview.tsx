"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SNIPPET = `function twoSum(nums, target) {
  const map = new Map();
  // Run tests · Submit for hidden cases
}`;

const TYPING_MS = 28;
const PAUSE_AFTER_CODE_MS = 450;
const RUN_PUBLIC_MS = 1400;
const PUBLIC_RESULT_MS = 900;
const RUN_HIDDEN_MS = 1600;
const HIDDEN_RESULT_MS = 900;
const READY_HOLD_MS = 2200;
const LOOP_GAP_MS = 1200;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

type Phase =
  | "idle"
  | "run_public"
  | "public_ok"
  | "run_hidden"
  | "hidden_ok"
  | "ready";

export function CodingRoundHeroPreview() {
  const [typedLen, setTypedLen] = useState(0);
  const [codeDone, setCodeDone] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;

    const loop = async () => {
      while (!cancelled.current) {
        setTypedLen(0);
        setCodeDone(false);
        setPhase("idle");

        for (let i = 0; i <= SNIPPET.length; i++) {
          if (cancelled.current) return;
          setTypedLen(i);
          await sleep(TYPING_MS);
        }
        if (cancelled.current) return;
        setCodeDone(true);
        await sleep(PAUSE_AFTER_CODE_MS);
        if (cancelled.current) return;

        setPhase("run_public");
        await sleep(RUN_PUBLIC_MS);
        if (cancelled.current) return;
        setPhase("public_ok");
        await sleep(PUBLIC_RESULT_MS);
        if (cancelled.current) return;

        setPhase("run_hidden");
        await sleep(RUN_HIDDEN_MS);
        if (cancelled.current) return;
        setPhase("hidden_ok");
        await sleep(HIDDEN_RESULT_MS);
        if (cancelled.current) return;

        setPhase("ready");
        await sleep(READY_HOLD_MS);
        if (cancelled.current) return;

        await sleep(LOOP_GAP_MS);
      }
    };

    void loop();
    return () => {
      cancelled.current = true;
    };
  }, []);

  const typedSlice = SNIPPET.slice(0, typedLen);
  const showCursor = !codeDone && typedLen < SNIPPET.length;

  const showTerminal = codeDone && phase !== "idle";

  const footerLabel = (() => {
    if (!codeDone) return { text: "Editor", active: false };
    if (phase === "idle") return { text: "Starting tests…", active: false };
    if (phase === "ready")
      return { text: "Ready", active: true };
    return { text: "Testing…", active: false };
  })();

  return (
    <div className="w-full max-w-[600px] overflow-hidden rounded-xl border-2 border-blue-100 bg-slate-900 shadow-2xl sm:max-w-[700px] sm:rounded-xl sm:border-4">
      <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500/90" />
          <span className="h-3 w-3 rounded-full bg-amber-400/90" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/90" />
        </div>
        <span className="ml-2 font-mono text-[10px] text-slate-400 sm:text-xs">
          solution.ts · Practice Coding Round
        </span>
      </div>

      <div className="min-h-[148px] p-4 font-mono text-[11px] leading-relaxed sm:min-h-[156px] sm:p-5 sm:text-xs">
        {!codeDone ? (
          <pre className="m-0 whitespace-pre-wrap break-all text-slate-300">
            {typedSlice}
            {showCursor ? (
              <span className="ml-0.5 inline-block h-3.5 w-2 animate-pulse bg-sky-400 align-middle sm:h-4" />
            ) : null}
          </pre>
        ) : (
          <div className="space-y-2 opacity-100 transition-opacity duration-300">
            <p className="m-0">
              <span className="text-purple-400">function</span>{" "}
              <span className="text-blue-400">twoSum</span>(
              <span className="text-amber-200">nums</span>,{" "}
              <span className="text-amber-200">target</span>) {"{"}
            </p>
            <p className="m-0 pl-4 text-slate-500">
              <span className="text-purple-400">const</span> map ={" "}
              <span className="text-purple-400">new</span> Map();
            </p>
            <p className="m-0 pl-4 text-emerald-400/90">
              // Run tests · Submit for hidden cases
            </p>
            <p className="m-0 pl-4 text-slate-500">{"}"}</p>
          </div>
        )}

        {showTerminal && (
          <div className="mt-4 space-y-2 border-t border-slate-700/80 pt-3 font-mono text-[10px] text-slate-400 sm:text-[11px]">
            {phase === "run_public" && (
              <div className="flex items-center gap-2 text-sky-300">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-400" />
                <span>Running public tests…</span>
              </div>
            )}

            {(phase === "public_ok" ||
              phase === "run_hidden" ||
              phase === "hidden_ok" ||
              phase === "ready") && (
              <div className="flex items-center gap-2 text-emerald-400/95">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Public tests passed (2/2)</span>
              </div>
            )}

            {phase === "run_hidden" && (
              <div className="flex items-center gap-2 text-sky-300">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-400" />
                <span>Running hidden tests…</span>
              </div>
            )}

            {(phase === "hidden_ok" || phase === "ready") && (
              <div className="flex items-center gap-2 text-emerald-400/95">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Hidden tests passed (8/8)</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-700 bg-slate-800/80 px-3 py-2">
        <span className="text-[10px] text-slate-500">
          Tests · Public + hidden on submit
        </span>
        <span
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-semibold transition-all duration-300",
            footerLabel.active
              ? "bg-emerald-600/90 text-white shadow-[0_0_14px_rgba(52,211,153,0.5)]"
              : footerLabel.text === "Testing…" || footerLabel.text === "Starting tests…"
                ? "bg-amber-600/85 text-white"
                : "bg-slate-700 text-slate-400",
          )}
        >
          {footerLabel.text}
        </span>
      </div>
    </div>
  );
}
