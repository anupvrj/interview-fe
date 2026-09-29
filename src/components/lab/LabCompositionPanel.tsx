"use client";

import { useState, type ReactNode } from "react";
import type { LabComposeLayer, LabComposeLiveResult } from "@/lib/runtimeApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Loader2 } from "lucide-react";

type Props = {
  interviewId: string | null;
  environment: string;
  onEnvironmentChange: (env: string) => void;
  useDraft: boolean;
  onUseDraftChange: (v: boolean) => void;
  loading: boolean;
  composeResult: LabComposeLiveResult | null;
  onCompose: () => void;
  onLiveTest: () => void;
  onCreateInterview: () => void;
  /** Voice controls rendered inside step 4. */
  voiceSlot?: ReactNode;
  voiceActive?: boolean;
};

function StepShell({
  n,
  title,
  subtitle,
  done,
  active,
  children,
}: {
  n: number;
  title: string;
  subtitle?: string;
  done?: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative rounded-lg border px-3 py-3",
        active
          ? "border-primary/40 bg-primary/[0.03]"
          : "border-border/60 bg-background/40",
      )}
    >
      <div className="mb-2.5 flex items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
            done
              ? "bg-emerald-600 text-white"
              : active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
          )}
        >
          {done ? <Check className="h-3 w-3" strokeWidth={3} /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-tight">{title}</p>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      <div className="pl-7">{children}</div>
    </div>
  );
}

function LayerBlock({ layer }: { layer: LabComposeLayer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-border/50">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-[11px]"
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
        <span className="min-w-0 flex-1 truncate font-medium">{layer.label}</span>
        {layer.draftOverlay ? (
          <Badge variant="secondary" className="text-[9px]">
            draft
          </Badge>
        ) : null}
      </button>
      {open ? (
        <pre className="max-h-36 overflow-auto border-t border-border/40 bg-muted/15 p-2 text-[10px] leading-relaxed whitespace-pre-wrap">
          {layer.content || "(empty)"}
        </pre>
      ) : null}
    </div>
  );
}

export function LabCompositionPanel({
  interviewId,
  environment,
  onEnvironmentChange,
  useDraft,
  onUseDraftChange,
  loading,
  composeResult,
  onCompose,
  onLiveTest,
  onCreateInterview,
  voiceSlot,
  voiceActive,
}: Props) {
  const hasInterview = Boolean(interviewId);
  const hasCompose = Boolean(composeResult);
  const step1Done = true; // always configured
  const step2Done = hasInterview;
  const step3Done = hasCompose;
  const step4Active = hasCompose || voiceActive;

  return (
    <div className="space-y-3">
      <StepShell
        n={1}
        title="Choose what to run"
        subtitle="Which Mongo env to load, and whether to overlay your Lab editor draft."
        done={step1Done}
        active={!hasInterview}
      >
        <div className="grid gap-2.5">
          <div>
            <Label className="text-[10px] text-muted-foreground">
              Prompt environment
            </Label>
            <Select value={environment} onValueChange={onEnvironmentChange}>
              <SelectTrigger className="mt-1 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">development</SelectItem>
                <SelectItem value="staging">staging</SelectItem>
                <SelectItem value="production">production</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-start gap-2 text-[11px] leading-snug text-muted-foreground">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={useDraft}
              onChange={(e) => onUseDraftChange(e.target.checked)}
            />
            <span>
              Overlay Lab draft on the wrapper prompt
              <span className="mt-0.5 block text-[10px] opacity-80">
                Nested prompts (session body, profile, dept) still come from{" "}
                {environment}.
              </span>
            </span>
          </label>
        </div>
      </StepShell>

      <StepShell
        n={2}
        title="Create Lab interview"
        subtitle="Writes a real Interview row (source=agent_lab) for analytics and RAG."
        done={step2Done}
        active={!hasInterview}
      >
        {hasInterview ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px]">
              {interviewId}
            </Badge>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-[11px]"
              disabled={loading}
              onClick={onCreateInterview}
            >
              Start over
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={loading}
            onClick={onCreateInterview}
          >
            {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Create interview
          </Button>
        )}
      </StepShell>

      <StepShell
        n={3}
        title="Compose the full prompt"
        subtitle="Same stack production uses — then inspect each layer."
        done={step3Done}
        active={hasInterview && !hasCompose}
      >
        <div className="space-y-2">
          <Button
            type="button"
            size="sm"
            variant={hasCompose ? "outline" : "default"}
            disabled={loading || !hasInterview}
            onClick={onCompose}
          >
            {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            {hasCompose ? "Re-compose" : "Compose"}
          </Button>

          {composeResult ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                <Badge variant="secondary" className="font-normal text-[10px]">
                  {composeResult.profileRef.name}
                </Badge>
                <Badge variant="secondary" className="font-normal text-[10px]">
                  RAG · resume {composeResult.rag.resumeSnippets} · past{" "}
                  {composeResult.rag.pastInterviewSnippets} · perf{" "}
                  {composeResult.rag.performanceSnippets}
                </Badge>
              </div>
              <div className="space-y-1">
                {composeResult.layers
                  .filter((l) => l.id !== "final")
                  .map((layer) => (
                    <LayerBlock key={layer.id} layer={layer} />
                  ))}
              </div>
              <details className="rounded-md border border-border/50">
                <summary className="cursor-pointer px-2 py-1.5 text-[11px] font-medium">
                  Final system prompt
                </summary>
                <pre className="max-h-48 overflow-auto border-t border-border/40 bg-muted/15 p-2 text-[10px] leading-relaxed whitespace-pre-wrap">
                  {composeResult.systemPrompt}
                </pre>
              </details>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Creates language override → dept rules → session body → profile →
              RAG → wrapper (± draft).
            </p>
          )}
        </div>
      </StepShell>

      <StepShell
        n={4}
        title="Live Test"
        subtitle="Open the mic session on the composed prompt (Fly llm-runtime)."
        done={Boolean(voiceActive)}
        active={step4Active}
      >
        <div className="space-y-2">
          <Button
            type="button"
            size="sm"
            disabled={loading || !hasInterview}
            onClick={onLiveTest}
          >
            {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            {voiceActive ? "Restart Live Test" : "Start Live Test"}
          </Button>
          {voiceSlot}
        </div>
      </StepShell>
    </div>
  );
}
