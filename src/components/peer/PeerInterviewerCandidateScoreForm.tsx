"use client";

import { useMemo } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SCORE_FIELDS = [
  { key: "technical" as const, label: "Technical skills" },
  { key: "behaviour" as const, label: "Behavioural" },
  { key: "communication" as const, label: "Communication skills" },
] as const;

export type PeerCandidateScoreFormValues = {
  technical: string;
  behaviour: string;
  communication: string;
  comments: string;
};

function parseScoreValue(value: string): number {
  if (value === "") return 0;
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function computeOverallAverage(
  technical: string,
  behaviour: string,
  communication: string,
): number | null {
  const values = [technical, behaviour, communication].map((v) => Number(v));
  if (values.some((v) => !Number.isFinite(v) || !Number.isInteger(v) || v < 0 || v > 100)) {
    return null;
  }
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function ScoreSliderField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const setValue = (next: number) => onChange(Math.min(100, Math.max(0, next)));

  return (
    <div className="rounded-xl border border-border/60 bg-gradient-to-br from-muted/20 to-muted/5 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-semibold text-foreground">
          {label}
        </Label>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full border-border/70"
            onClick={() => setValue(value - 1)}
            disabled={disabled || value <= 0}
            aria-label={`Decrease ${label}`}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span
            className={cn(
              "min-w-[3.25rem] rounded-lg bg-[#7367F0]/10 px-2.5 py-1 text-center text-lg font-bold tabular-nums text-[#7367F0]",
              value >= 70 && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              value > 0 && value < 50 && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              value > 0 && value < 70 && value >= 50 && "bg-[#7367F0]/10 text-[#7367F0]",
            )}
          >
            {value}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full border-border/70"
            onClick={() => setValue(value + 1)}
            disabled={disabled || value >= 100}
            aria-label={`Increase ${label}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="relative px-0.5">
        <Slider
          id={id}
          min={0}
          max={100}
          step={1}
          value={[value]}
          onValueChange={([next]) => setValue(next ?? 0)}
          disabled={disabled}
          variant="peer"
          className="py-2"
          aria-label={label}
        />
        <div className="pointer-events-none absolute inset-x-0.5 top-1/2 flex -translate-y-1/2 justify-between px-0.5">
          {[0, 25, 50, 75, 100].map((tick) => (
            <span
              key={tick}
              className={cn(
                "h-1.5 w-px bg-border/80",
                tick === 0 || tick === 100 ? "opacity-0" : "opacity-60",
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  );
}

export function PeerInterviewerCandidateScoreForm({
  values,
  onChange,
  disabled,
  showComments = true,
}: {
  values: PeerCandidateScoreFormValues;
  onChange: (values: PeerCandidateScoreFormValues) => void;
  disabled?: boolean;
  showComments?: boolean;
}) {
  const overall = useMemo(
    () => computeOverallAverage(values.technical, values.behaviour, values.communication),
    [values.technical, values.behaviour, values.communication],
  );

  const updateField = (key: keyof PeerCandidateScoreFormValues, value: string) => {
    onChange({ ...values, [key]: value });
  };

  const updateScore = (key: (typeof SCORE_FIELDS)[number]["key"], value: number) => {
    onChange({ ...values, [key]: String(value) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {SCORE_FIELDS.map(({ key, label }) => (
          <ScoreSliderField
            key={key}
            id={`score-${key}`}
            label={label}
            value={parseScoreValue(values[key])}
            onChange={(v) => updateScore(key, v)}
            disabled={disabled}
          />
        ))}
      </div>

      <div
        className={cn(
          "flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3",
          overall !== null && "border-[#7367F0]/30 bg-[#7367F0]/5",
        )}
      >
        <span className="text-sm font-medium text-foreground">Overall average</span>
        <span className="text-2xl font-bold tabular-nums text-[#7367F0]">
          {overall !== null ? overall : "—"}
          <span className="ml-1 text-sm font-normal text-muted-foreground">/100</span>
        </span>
      </div>

      {showComments ? (
        <div className="space-y-2">
          <Label htmlFor="score-comments" className="text-sm font-medium text-foreground">
            Notes on candidate performance (optional)
          </Label>
          <Textarea
            id="score-comments"
            value={values.comments}
            onChange={(e) => updateField("comments", e.target.value)}
            disabled={disabled}
            placeholder="Strengths, areas to improve…"
            rows={3}
          />
        </div>
      ) : null}
    </div>
  );
}

export function validateCandidateScoreForm(values: PeerCandidateScoreFormValues): string | null {
  for (const { key, label } of SCORE_FIELDS) {
    const n = Number(values[key]);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > 100) {
      return `${label} must be a whole number between 0 and 100`;
    }
  }
  return null;
}

export function candidateScoreFormToPayload(values: PeerCandidateScoreFormValues) {
  return {
    technical: parseScoreValue(values.technical),
    behaviour: parseScoreValue(values.behaviour),
    communication: parseScoreValue(values.communication),
    comments: values.comments.trim() || undefined,
  };
}
