"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CodeToken = { text: string; className?: string };

type CodeLine = {
  className?: string;
  tokens: CodeToken[];
};

const TWO_SUM_LINES: CodeLine[] = [
  {
    tokens: [
      { text: "function", className: "text-purple-400" },
      { text: " " },
      { text: "twoSum", className: "text-primary/70" },
      { text: "(" },
      { text: "nums", className: "text-amber-200" },
      { text: ", " },
      { text: "target", className: "text-amber-200" },
      { text: ") {" },
    ],
  },
  {
    className: "pl-4 text-muted-foreground",
    tokens: [
      { text: "const", className: "text-purple-400" },
      { text: " map = " },
      { text: "new", className: "text-purple-400" },
      { text: " Map();" },
    ],
  },
  {
    className: "pl-4 text-muted-foreground",
    tokens: [
      { text: "for", className: "text-purple-400" },
      { text: " (" },
      { text: "let", className: "text-purple-400" },
      { text: " i = " },
      { text: "0", className: "text-sky-300" },
      { text: "; i < nums.length; i++) {" },
    ],
  },
  {
    className: "pl-8 text-muted-foreground",
    tokens: [
      { text: "const", className: "text-purple-400" },
      { text: " complement = target - nums[i];" },
    ],
  },
  {
    className: "pl-8 text-muted-foreground",
    tokens: [
      { text: "if", className: "text-purple-400" },
      { text: " (map.has(complement)) {" },
    ],
  },
  {
    className: "pl-12 text-muted-foreground",
    tokens: [
      { text: "return", className: "text-purple-400" },
      { text: " [map.get(complement), i];" },
    ],
  },
  {
    className: "pl-8 text-muted-foreground",
    tokens: [{ text: "}" }],
  },
  {
    className: "pl-8 text-muted-foreground",
    tokens: [{ text: "map.set(nums[i], i);" }],
  },
  {
    className: "pl-4 text-muted-foreground",
    tokens: [{ text: "}" }],
  },
  {
    className: "pl-4 text-muted-foreground",
    tokens: [
      { text: "return", className: "text-purple-400" },
      { text: " [];" },
    ],
  },
  {
    className: "pl-4 text-muted-foreground",
    tokens: [{ text: "}" }],
  },
];

function lineText(line: CodeLine) {
  return line.tokens.map((token) => token.text).join("");
}

const SNIPPET = TWO_SUM_LINES.map(lineText).join("\n");

function HighlightedTwoSumCode({
  charLimit = SNIPPET.length,
  showCursor = false,
}: {
  charLimit?: number;
  showCursor?: boolean;
}) {
  let remaining = charLimit;
  let cursorPlaced = !showCursor;
  const lines: ReactNode[] = [];

  TWO_SUM_LINES.forEach((line, lineIndex) => {
    if (remaining <= 0) return;

    const content = lineText(line);
    const lineBudget = Math.min(remaining, content.length);
    remaining -= lineBudget;

    if (lineBudget <= 0) return;

    let tokenRemaining = lineBudget;
    const renderedTokens = line.tokens.flatMap((token, tokenIndex) => {
      if (tokenRemaining <= 0) return [];
      const take = Math.min(tokenRemaining, token.text.length);
      tokenRemaining -= take;
      if (take <= 0) return [];
      return (
        <span key={`${lineIndex}-${tokenIndex}`} className={token.className}>
          {token.text.slice(0, take)}
        </span>
      );
    });

    const isPartialLine = lineBudget < content.length;
    if (!isPartialLine && lineIndex < TWO_SUM_LINES.length - 1 && remaining > 0) {
      remaining -= 1;
    }

    const shouldShowCursor =
      showCursor && !cursorPlaced && (isPartialLine || remaining <= 0);
    if (shouldShowCursor) cursorPlaced = true;

    lines.push(
      <p key={lineIndex} className={cn("m-0", line.className)}>
        {renderedTokens}
        {shouldShowCursor ? (
          <span className="ml-0.5 inline-block h-3 w-2 animate-pulse bg-sky-400 align-middle sm:h-3.5" />
        ) : null}
      </p>,
    );
  });

  return <div className="space-y-0.5 leading-snug">{lines}</div>;
}

const TYPING_MS = 22;
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

function TerminalSizer() {
  return (
    <div className="mt-3 space-y-1.5 border-t border-transparent pt-2 font-mono text-[10px] sm:text-[11px]">
      <div className="flex items-center gap-2 opacity-0">
        <span className="h-3 w-3 shrink-0" />
        <span>Public tests passed (2/2)</span>
      </div>
      <div className="flex items-center gap-2 opacity-0">
        <span className="h-3 w-3 shrink-0" />
        <span>Hidden tests passed (8/8)</span>
      </div>
    </div>
  );
}

function TerminalOutput({ phase }: { phase: Phase }) {
  return (
    <div className="mt-3 space-y-1.5 border-t border-slate-700/80 pt-2 font-mono text-[10px] text-muted-foreground/80 sm:text-[11px]">
      {phase === "run_public" && (
        <div className="flex items-center gap-2 text-sky-300">
          <Loader2 className="h-3 w-3 shrink-0 animate-spin text-sky-400" />
          <span>Running public tests…</span>
        </div>
      )}

      {(phase === "public_ok" ||
        phase === "run_hidden" ||
        phase === "hidden_ok" ||
        phase === "ready") && (
        <div className="flex items-center gap-2 text-emerald-400/95">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          <span>Public tests passed (2/2)</span>
        </div>
      )}

      {phase === "run_hidden" && (
        <div className="flex items-center gap-2 text-sky-300">
          <Loader2 className="h-3 w-3 shrink-0 animate-spin text-sky-400" />
          <span>Running hidden tests…</span>
        </div>
      )}

      {(phase === "hidden_ok" || phase === "ready") && (
        <div className="flex items-center gap-2 text-emerald-400/95">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          <span>Hidden tests passed (8/8)</span>
        </div>
      )}
    </div>
  );
}

export function CodingRoundHeroPreview({
  className,
}: {
  className?: string;
}) {
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
    <div
      className={cn(
        "w-full max-w-[600px] overflow-hidden rounded-xl border-2 border-border bg-slate-900 shadow-2xl sm:max-w-[700px] sm:rounded-xl sm:border-4",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800 px-3 py-1.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500/90" />
          <span className="h-3 w-3 rounded-full bg-amber-400/90" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/90" />
        </div>
        <span className="ml-2 font-mono text-[10px] text-muted-foreground/80 sm:text-xs">
          solution.ts · Practice Coding Round
        </span>
      </div>

      <div className="relative p-3 font-mono text-[10px] leading-snug sm:p-4 sm:text-[11px]">
        <div className="invisible pointer-events-none select-none" aria-hidden="true">
          <HighlightedTwoSumCode />
          <TerminalSizer />
        </div>

        <div className="absolute inset-0 overflow-hidden p-3 sm:p-4">
          <HighlightedTwoSumCode
            charLimit={typedLen}
            showCursor={showCursor}
          />
          {showTerminal ? <TerminalOutput phase={phase} /> : null}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-700 bg-slate-800/80 px-3 py-1.5">
        <span className="text-[10px] text-muted-foreground">
          Tests · Public + hidden on submit
        </span>
        <span
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-semibold transition-all duration-300",
            footerLabel.active
              ? "bg-emerald-600/90 text-white shadow-[0_0_14px_rgba(52,211,153,0.5)]"
              : footerLabel.text === "Testing…" || footerLabel.text === "Starting tests…"
                ? "bg-amber-600/85 text-white"
                : "bg-slate-700 text-muted-foreground/80",
          )}
        >
          {footerLabel.text}
        </span>
      </div>
    </div>
  );
}
