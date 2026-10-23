"use client";

import { ArrowRight, FileText, Linkedin, Loader2, Mic, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Hackathon "Build my resume": start from real details in about two minutes. Shown instead of
 * the full template + import wizard (template is preselected, job description is skipped).
 */
export function HackathonResumeStartChoices({
  templateName,
  uploadedCvName,
  loadingUploadedCv,
  busy,
  onUseUploadedCv,
  onUploadPdf,
  onTalkToAi,
  onLinkedIn,
  onUseSample,
}: Readonly<{
  /** The design picked for them (changeable in the editor). */
  templateName?: string | null;
  /** File name of the CV on their profile, when there is one. */
  uploadedCvName: string | null;
  loadingUploadedCv: boolean;
  busy: boolean;
  onUseUploadedCv: () => void;
  onUploadPdf: () => void;
  onTalkToAi: () => void;
  onLinkedIn: () => void;
  onUseSample: () => void;
}>) {
  const row =
    "group flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left transition hover:border-primary/50 hover:shadow-sm disabled:pointer-events-none disabled:opacity-60";
  const icon = "grid h-11 w-11 shrink-0 place-items-center rounded-xl";

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Let&apos;s build your hackathon resume</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start from your real details — it takes about 2 minutes.{" "}
          {templateName ? (
            <>
              Design: <span className="font-medium text-foreground">{templateName}</span> — you can change it later.
            </>
          ) : (
            "You can change the design later."
          )}
        </p>
      </div>

      <div className="space-y-3">
        {uploadedCvName ? (
          <button type="button" className={cn(row, "border-primary/50 bg-primary/5")} onClick={onUseUploadedCv} disabled={busy || loadingUploadedCv}>
            <span className={cn(icon, "bg-primary/10 text-primary")}>
              {loadingUploadedCv ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <FileText className="h-5 w-5" aria-hidden />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-foreground">Use the CV you uploaded</span>
              <span className="block truncate text-xs text-muted-foreground">{uploadedCvName}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
          </button>
        ) : null}

        <button type="button" className={cn(row, "border-border")} onClick={onUploadPdf} disabled={busy}>
          <span className={cn(icon, "bg-primary/10 text-primary")}>
            <Upload className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-foreground">Upload your resume</span>
            <span className="block text-xs text-muted-foreground">Any old resume PDF works — we&apos;ll redesign it.</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>

        <button type="button" className={cn(row, "border-border")} onClick={onTalkToAi} disabled={busy}>
          <span className={cn(icon, "bg-violet-500/10 text-violet-600 dark:text-violet-400")}>
            <Mic className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-foreground">No resume handy? Talk to AI</span>
            <span className="block text-xs text-muted-foreground">Answer a few questions by voice or chat — about 2 minutes.</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>

        <button type="button" className={cn(row, "border-border")} onClick={onLinkedIn} disabled={busy}>
          <span className={cn(icon, "bg-[#0A66C2]/10 text-[#0A66C2]")}>
            <Linkedin className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-foreground">Import from LinkedIn</span>
            <span className="block text-xs text-muted-foreground">Use your public LinkedIn profile.</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        <button type="button" onClick={onUseSample} disabled={busy} className="font-medium underline-offset-2 hover:text-foreground hover:underline">
          Start from a sample instead
        </button>{" "}
        — you&apos;ll need to replace the sample details before you submit.
      </p>
    </div>
  );
}
