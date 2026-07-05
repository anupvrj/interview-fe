"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Upload,
  CheckCircle2,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AnimationPhase = "upload" | "scanning" | "scoring" | "complete";

const PHASE_DURATIONS: Record<AnimationPhase, number> = {
  upload: 2600,
  scanning: 3000,
  scoring: 3400,
  complete: 2400,
};

const TARGET_SCORE = 92;
const PHASES: AnimationPhase[] = ["upload", "scanning", "scoring", "complete"];

const PHASE_LABELS: Record<AnimationPhase, string> = {
  upload: "Uploading resume…",
  scanning: "Scanning & parsing…",
  scoring: "Calculating ATS score…",
  complete: "Analysis complete!",
};

function ScoreGauge({
  score,
  animate,
}: {
  score: number;
  animate: boolean;
}) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "stroke-green-500" : score >= 60 ? "stroke-amber-500" : "stroke-red-500";
  const textColor =
    score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600";

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-muted"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(color, animate && "transition-[stroke-dashoffset] duration-150 ease-out")}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {score > 0 ? (
          <>
            <span className={cn("text-4xl font-bold tabular-nums", textColor)}>
              {score}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground font-medium">—</span>
        )}
      </div>
    </div>
  );
}

function ResumeMock({ scanning }: { scanning: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-[200px] rounded-lg border border-border bg-card shadow-md overflow-hidden">
      <div className="h-2 bg-primary/20" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 w-3/4 rounded bg-foreground/15" />
        <div className="h-2 w-1/2 rounded bg-foreground/10" />
        <div className="pt-1 space-y-1.5">
          {[100, 85, 92, 70].map((w, i) => (
            <div
              key={i}
              className="h-1.5 rounded bg-foreground/8"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
        <div className="h-2 w-2/5 rounded bg-primary/25 mt-2" />
        <div className="space-y-1">
          {[90, 75, 88].map((w, i) => (
            <div
              key={i}
              className="h-1 rounded bg-foreground/6"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>
      {scanning && (
        <>
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          <div
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_rgba(115,103,240,0.6)]"
            style={{ animation: "ats-scan-sweep 1.8s ease-in-out infinite" }}
          />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute left-3 right-3 h-px bg-primary/30"
                style={{
                  top: `${28 + i * 22}%`,
                  animation: `ats-scan-line 1.2s ease-in-out ${i * 0.25}s infinite`,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ATSHeroAnimation() {
  const [phase, setPhase] = useState<AnimationPhase>("upload");
  const [displayScore, setDisplayScore] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  const resetScore = useCallback(() => setDisplayScore(0), []);

  useEffect(() => {
    let phaseIndex = 0;
    let scoreTimer: ReturnType<typeof setInterval> | null = null;
    let uploadTimer: ReturnType<typeof setInterval> | null = null;
    let phaseTimeout: ReturnType<typeof setTimeout> | undefined;

    const clearTimers = () => {
      if (scoreTimer) clearInterval(scoreTimer);
      if (uploadTimer) clearInterval(uploadTimer);
      if (phaseTimeout) clearTimeout(phaseTimeout);
    };

    const startUploadProgress = () => {
      setUploadProgress(0);
      uploadTimer = setInterval(() => {
        setUploadProgress((p) => {
          if (p >= 100) {
            if (uploadTimer) clearInterval(uploadTimer);
            return 100;
          }
          return p + 4;
        });
      }, 50);
    };

    const startScoreCount = () => {
      resetScore();
      scoreTimer = setInterval(() => {
        setDisplayScore((s) => {
          if (s >= TARGET_SCORE) {
            if (scoreTimer) clearInterval(scoreTimer);
            return TARGET_SCORE;
          }
          return s + 2;
        });
      }, 45);
    };

    const runPhase = (index: number) => {
      const current = PHASES[index];
      setPhase(current);

      if (current === "upload") {
        setUploadProgress(0);
        startUploadProgress();
      } else if (uploadTimer) {
        clearInterval(uploadTimer);
      }

      if (current === "scoring") {
        startScoreCount();
      } else if (current !== "complete") {
        resetScore();
      }

      phaseTimeout = setTimeout(() => {
        const next = (index + 1) % PHASES.length;
        runPhase(next);
      }, PHASE_DURATIONS[current]);
    };

    runPhase(0);
    return clearTimers;
  }, [resetScore]);

  const showCheck = phase === "complete";

  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0 lg:max-w-none">
      {/* Ambient glow */}
      <div className="absolute -inset-8 bg-gradient-to-br from-primary/15 via-transparent to-primary/10 rounded-3xl blur-2xl pointer-events-none" />

      <div className="relative rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <span className="text-xs font-medium text-muted-foreground ml-1">
            InterviewTrix ATS Checker
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-[10px] text-green-600 font-medium">Live demo</span>
          </div>
        </div>

        <div className="flex h-[480px] flex-col p-6 sm:p-8">
          {/* Phase status bar */}
          <div className="mb-6 flex shrink-0 items-center gap-2">
            <PhaseIcon phase={phase} />
            <span className="text-sm font-medium text-foreground">
              {PHASE_LABELS[phase]}
            </span>
          </div>

          <div className="relative min-h-0 flex-1">
            {/* Upload phase */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
                phase === "upload"
                  ? "opacity-100"
                  : "pointer-events-none opacity-0",
              )}
            >
              <div className="w-full space-y-5 animate-fade-in">
                <div className="relative mx-auto w-full max-w-[220px]">
                  <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center">
                    <Upload
                      className="mx-auto mb-2 h-8 w-8 text-primary"
                      style={{ animation: "ats-bounce-subtle 1.2s ease-in-out infinite" }}
                    />
                    <p className="text-xs font-medium text-foreground">resume.pdf</p>
                  </div>
                  <div
                    className="absolute -top-3 -right-2 flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-lg"
                    style={{ animation: "ats-file-drop 2.4s ease-in-out infinite" }}
                  >
                    <FileText className="h-4 w-4 text-red-500" />
                    <span className="text-[10px] font-medium">PDF · 1.2 MB</span>
                  </div>
                </div>
                <div className="mx-auto max-w-[220px] space-y-1.5">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Uploading</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-100"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Scanning phase */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
                phase === "scanning"
                  ? "opacity-100"
                  : "pointer-events-none opacity-0",
              )}
            >
              <div className="w-full space-y-4 animate-fade-in">
                <ResumeMock scanning />
                <div className="flex justify-center gap-4 text-[10px] text-muted-foreground">
                  {["Parsing text", "Extracting skills", "Mapping sections"].map(
                    (label, i) => (
                      <span
                        key={label}
                        className="flex items-center gap-1"
                        style={{
                          animation: `ats-pulse-step 1.5s ease-in-out ${i * 0.4}s infinite`,
                        }}
                      >
                        <ScanLine className="h-3 w-3 text-primary" />
                        {label}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* Scoring & complete phases */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
                phase === "scoring" || phase === "complete"
                  ? "opacity-100"
                  : "pointer-events-none opacity-0",
              )}
            >
              <div className="w-full animate-fade-in">
                <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
                  <ScoreGauge score={displayScore} animate={phase === "scoring"} />
                  <div className="space-y-3">
                    {[
                      { label: "Content", pct: Math.min(displayScore, 88) },
                      { label: "Sections", pct: Math.min(displayScore + 4, 94) },
                      {
                        label: "ATS Essentials",
                        pct: Math.min(displayScore - 6, 86),
                      },
                    ].map(({ label, pct }) => (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="font-medium text-foreground">{label}</span>
                          <span className="text-muted-foreground">
                            {displayScore > 0 ? `${pct}%` : "—"}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/70 transition-all duration-150"
                            style={{
                              width: displayScore > 0 ? `${pct}%` : "0%",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Complete banner — fixed slot prevents height jump */}
          <div className="mt-6 h-[52px] shrink-0">
            <div
              className={cn(
                "flex h-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 transition-opacity duration-300",
                showCheck ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              style={showCheck ? { animation: "scale-in 0.4s ease-out forwards" } : undefined}
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <span className="text-sm font-semibold text-green-800">
                27 checks complete — ready for recruiters
              </span>
              <Sparkles className="h-4 w-4 shrink-0 text-green-600" />
            </div>
          </div>

          {/* Step indicators */}
          <div className="mt-6 flex shrink-0 justify-center gap-2 border-t border-border/60 pt-4">
            {PHASES.map((p) => (
              <div
                key={p}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  phase === p ? "w-8 bg-primary" : "w-1.5 bg-muted-foreground/25",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhaseIcon({ phase }: { phase: AnimationPhase }) {
  const className = "h-4 w-4 text-primary shrink-0";
  if (phase === "upload") return <Upload className={className} />;
  if (phase === "scanning") return <ScanLine className={cn(className, "animate-pulse")} />;
  if (phase === "scoring") return <Sparkles className={cn(className, "animate-pulse")} />;
  return <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />;
}
