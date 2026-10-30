"use client";

import { ArrowLeft, ArrowRight, Briefcase, Check, Loader2, SkipForward } from "lucide-react";
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
import { AddToChromeButton } from "@/components/chrome-extension/AddToChromeButton";
import { cn } from "@/lib/utils";

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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* the job post itself */}
        <div className={cn(resumeBuilderHeroCard, "flex flex-col")}>
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Briefcase className="h-4 w-4" /></span>
              <p className="text-[14px] font-semibold text-foreground">Job description</p>
            </div>
            <span className={cn("font-[family-name:var(--font-geist-mono)] text-[11px]", canAnalyze ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
              {value.trim().length.toLocaleString()} CHARS{canAnalyze ? " · READY" : " · 50 MIN"}
            </span>
          </div>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste the full job post: role, responsibilities, required skills, qualifications…"
            className="min-h-[300px] flex-1 resize-y rounded-none border-0 bg-transparent px-5 py-4 text-[14px] leading-relaxed shadow-none focus-visible:ring-0"
          />
          {overLimit ? (
            <p className="border-t border-border px-5 py-2.5 text-xs text-amber-600 dark:text-amber-400">
              {overflow.toLocaleString()} extra characters will be trimmed (won&apos;t affect quality).
            </p>
          ) : null}
        </div>

        {/* what it changes, and the Chrome shortcut */}
        <div className="space-y-4">
          <div className={cn(resumeBuilderHeroCard, "p-5")}>
            <p className="font-[family-name:var(--font-geist-mono)] text-[11px] text-primary">WHAT TAILORING CHANGES</p>
            <ul className="mt-3 space-y-2.5 text-[13.5px] text-foreground">
              {["Your summary, written for this role", "Experience bullets that echo its asks", "Skills ordered by what it wants"].map((t) => (
                <li key={t} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{t}</li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] text-muted-foreground">Optional. Skip it and tailor later from the editor.</p>
          </div>
          <div className={cn(resumeBuilderHeroCard, "p-5")}>
            <p className="text-[14px] font-semibold text-foreground">Applying from a job site?</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">The Chrome extension captures the posting for you, no copy-paste.</p>
            <div className="mt-3"><AddToChromeButton variant="outline" size="sm" /></div>
          </div>
          {jdSummary ? (
            <div className="rounded-[18px] border border-emerald-500/25 bg-emerald-500/5 p-5 text-sm">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">Job requirements captured</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{jdSummary}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className={resumeBuilderFooterActions}>
        <Button variant="outline" className={resumeBuilderOutlineButton} onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <Button variant="ghost" className="h-11 rounded-xl px-4 text-[14px] text-muted-foreground hover:text-foreground" onClick={onSkip}>
            <SkipForward className="mr-2 h-4 w-4" />
            Skip, build without a job
          </Button>
          <Button
            className={resumeBuilderPrimaryButton}
            disabled={!canAnalyze || analyzing}
            onClick={() => void handleAnalyzeAndContinue()}
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reading the job…
              </>
            ) : (
              <>
                Tailor and build
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
