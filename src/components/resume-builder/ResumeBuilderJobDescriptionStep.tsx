"use client";

import { ArrowLeft, ArrowRight, Briefcase, Loader2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getJobDescriptionOverflow,
  trimJobDescriptionForSend,
} from "@/lib/job-description-limits";
import {
  resumeBuilderFooterActions,
  resumeBuilderHeroCard,
  resumeBuilderOutlineButton,
  resumeBuilderPrimaryButton,
} from "./resumeBuilderStyles";

interface ResumeBuilderJobDescriptionStepProps {
  value: string;
  onChange: (value: string) => void;
  jdSummary: string | null;
  analyzing: boolean;
  onAnalyze: (jobDescription: string) => Promise<import("@/lib/api").JDRequirements | null>;
  onContinueWithJd: (
    requirements?: import("@/lib/api").JDRequirements | null,
  ) => void;
  onSkip: () => void;
  onBack: () => void;
}

export function ResumeBuilderJobDescriptionStep({
  value,
  onChange,
  jdSummary,
  analyzing,
  onAnalyze,
  onContinueWithJd,
  onSkip,
  onBack,
}: ResumeBuilderJobDescriptionStepProps) {
  const canAnalyze = value.trim().length >= 50;
  const overflow = getJobDescriptionOverflow(value);
  const overLimit = overflow > 0;

  const handleAnalyzeAndContinue = async () => {
    if (!canAnalyze) return;
    const requirements = await onAnalyze(trimJobDescriptionForSend(value));
    onContinueWithJd(requirements);
  };

  return (
    <div className="space-y-5">
      <div className={resumeBuilderHeroCard}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Tailor to a target job (optional)
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Paste a job description and we&apos;ll align your summary,
              experience bullets, and skills to that role. You can skip this step
              anytime.
            </p>
          </div>
        </div>
      </div>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the full job description here — role, responsibilities, required skills, qualifications..."
        className="min-h-[220px] resize-y text-sm"
      />

      {overLimit ? (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {overflow.toLocaleString()} extra characters will be trimmed
          (won&apos;t affect quality).
        </p>
      ) : null}

      {jdSummary ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-foreground">
          <p className="font-medium text-emerald-800 dark:text-emerald-300">
            Job requirements captured
          </p>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
            {jdSummary}
          </p>
        </div>
      ) : null}

      <div className={resumeBuilderFooterActions}>
        <Button
          variant="outline"
          className={resumeBuilderOutlineButton}
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          variant="outline"
          className={resumeBuilderOutlineButton}
          onClick={onSkip}
        >
          <SkipForward className="mr-2 h-4 w-4" />
          Continue without job description
        </Button>
        <Button
          className={resumeBuilderPrimaryButton}
          disabled={!canAnalyze || analyzing}
          onClick={() => void handleAnalyzeAndContinue()}
        >
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              Continue with job description
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
