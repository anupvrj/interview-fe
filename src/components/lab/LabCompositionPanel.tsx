"use client";

import { useState, type ReactNode } from "react";
import type { LabComposeLayer, LabComposeLiveResult } from "@/lib/runtimeApi";
import {
  LAB_DEPARTMENT_OPTIONS,
  LAB_DISCIPLINE_BY_DEPARTMENT,
  LAB_EXPERIENCE_OPTIONS,
  labProfileNameFromSetup,
  normalizeDisciplineForDepartment,
  type LabDepartment,
  type LabDiscipline,
  type LabInterviewSetup,
} from "@/lib/labInterviewSetup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Loader2 } from "lucide-react";

type Props = {
  interviewId: string | null;
  environment: string;
  onEnvironmentChange: (env: string) => void;
  useDraft: boolean;
  onUseDraftChange: (v: boolean) => void;
  setup: LabInterviewSetup;
  onSetupChange: (patch: Partial<LabInterviewSetup>) => void;
  loading: boolean;
  composeResult: LabComposeLiveResult | null;
  onCompose: () => void;
  onLiveTest: () => void;
  onCreateInterview: () => void;
  onResetInterview: () => void;
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

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Label className="text-[10px] text-muted-foreground">{children}</Label>
  );
}

export function LabCompositionPanel({
  interviewId,
  environment,
  onEnvironmentChange,
  useDraft,
  onUseDraftChange,
  setup,
  onSetupChange,
  loading,
  composeResult,
  onCompose,
  onLiveTest,
  onCreateInterview,
  onResetInterview,
  voiceSlot,
  voiceActive,
}: Props) {
  const hasInterview = Boolean(interviewId);
  const hasCompose = Boolean(composeResult);
  const step1Done = true;
  const step2Done = hasInterview;
  const step3Done = hasCompose;
  const step4Active = hasCompose || voiceActive;
  const disciplineOptions =
    LAB_DISCIPLINE_BY_DEPARTMENT[setup.department] ?? [];
  const predictedProfile = labProfileNameFromSetup(setup);
  const setupLocked = hasInterview;

  return (
    <div className="space-y-3">
      <StepShell
        n={1}
        title="Prompt source"
        subtitle="Which Mongo env to load, and whether to overlay your Lab editor draft."
        done={step1Done}
        active={!hasInterview}
      >
        <div className="grid gap-2.5">
          <div>
            <FieldLabel>Prompt environment</FieldLabel>
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
        title="Interview setup"
        subtitle="Same fields a candidate fills — department/discipline pick the profile."
        done={step2Done}
        active={!hasInterview}
      >
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <FieldLabel>Role</FieldLabel>
              <Input
                className="mt-1 h-8 text-xs"
                value={setup.role}
                disabled={setupLocked || loading}
                onChange={(e) => onSetupChange({ role: e.target.value })}
                placeholder="e.g. Backend Engineer"
              />
            </div>
            <div>
              <FieldLabel>Department</FieldLabel>
              <Select
                value={setup.department}
                disabled={setupLocked || loading}
                onValueChange={(v) => {
                  const department = v as LabDepartment;
                  onSetupChange({
                    department,
                    discipline: normalizeDisciplineForDepartment(
                      department,
                      setup.discipline,
                    ),
                  });
                }}
              >
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAB_DEPARTMENT_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>Discipline</FieldLabel>
              <Select
                value={
                  disciplineOptions.length ? setup.discipline : "none"
                }
                disabled={
                  setupLocked || loading || disciplineOptions.length === 0
                }
                onValueChange={(v) =>
                  onSetupChange({ discipline: v as LabDiscipline })
                }
              >
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {disciplineOptions.length ? (
                    disciplineOptions.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none">None</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>Experience</FieldLabel>
              <Select
                value={String(setup.experience)}
                disabled={setupLocked || loading}
                onValueChange={(v) =>
                  onSetupChange({ experience: Number.parseInt(v, 10) || 0 })
                }
              >
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAB_EXPERIENCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>Language</FieldLabel>
              <Select
                value={setup.language}
                disabled={setupLocked || loading}
                onValueChange={(v) =>
                  onSetupChange({ language: v as "en" | "hi" })
                }
              >
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>Target company</FieldLabel>
              <Input
                className="mt-1 h-8 text-xs"
                value={setup.targetCompany}
                disabled={setupLocked || loading}
                onChange={(e) =>
                  onSetupChange({ targetCompany: e.target.value })
                }
              />
            </div>
            <div>
              <FieldLabel>Duration</FieldLabel>
              <Select
                value={String(setup.interviewDuration)}
                disabled={setupLocked || loading}
                onValueChange={(v) =>
                  onSetupChange({
                    interviewDuration: (Number(v) === 30 ? 30 : 15) as 15 | 30,
                  })
                }
              >
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <FieldLabel>Job description (optional)</FieldLabel>
              <Textarea
                className="mt-1 min-h-[64px] text-xs"
                value={setup.jobDescription}
                disabled={setupLocked || loading}
                onChange={(e) =>
                  onSetupChange({ jobDescription: e.target.value })
                }
                placeholder="Paste JD to mirror a real interview…"
              />
            </div>
          </div>

          <div className="rounded-md border border-border/50 bg-muted/20 px-2.5 py-2">
            <p className="text-[10px] font-medium text-muted-foreground">
              Profile (production resolveProfileRef)
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-foreground">
              {predictedProfile}
            </p>
          </div>

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
                onClick={onResetInterview}
              >
                Change setup
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={loading || !setup.role.trim()}
              onClick={onCreateInterview}
            >
              {loading ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : null}
              Create interview
            </Button>
          )}
        </div>
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
            {loading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : null}
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
            {loading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : null}
            {voiceActive ? "Restart Live Test" : "Start Live Test"}
          </Button>
          {voiceSlot}
        </div>
      </StepShell>
    </div>
  );
}
