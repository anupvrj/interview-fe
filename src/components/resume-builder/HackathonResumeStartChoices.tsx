"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, FileText, Linkedin, Loader2, Mic, PenLine, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

/** A resume they already have (from the hackathon's eligible-resume list). */
export interface HackathonExistingResume {
  resumeId: string;
  title: string;
  atsScore: number | null;
  updatedAt?: string;
}

/** The resume they submitted to this hackathon. */
export interface HackathonSubmittedResume extends HackathonExistingResume {
  submittedAt: string | null;
}

function relativeDay(iso?: string | null): string | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (!Number.isFinite(days) || days < 0) return null;
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/**
 * Hackathon "Build my resume". New here: start from real details in about two minutes. Already
 * have resumes: the one they submitted comes first (edit & resubmit), any other is a pick away,
 * and the new-resume options sit underneath as compact tiles.
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
  submitted = null,
  resumes = [],
  loadingResumes = false,
  onOpenResume,
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
  /** Already submitted to this hackathon. */
  submitted?: HackathonSubmittedResume | null;
  /** Their other resumes (the submitted one may be included; it's listed once). */
  resumes?: HackathonExistingResume[];
  loadingResumes?: boolean;
  /** Open a resume in the editor (it comes back to the hackathon when saved). */
  onOpenResume?: (resumeId: string) => void;
}>) {
  const others = resumes.filter((r) => r.resumeId !== submitted?.resumeId);
  const hasExisting = Boolean(submitted) || others.length > 0;
  const [picked, setPicked] = useState(others[0]?.resumeId ?? "");
  useEffect(() => {
    if (!others.some((r) => r.resumeId === picked)) setPicked(others[0]?.resumeId ?? "");
  }, [others, picked]);

  const newOptions = [
    ...(uploadedCvName
      ? [{ key: "cv", label: "Use the CV you uploaded", hint: uploadedCvName, icon: loadingUploadedCv ? Loader2 : FileText, tone: "bg-primary/10 text-primary", onClick: onUseUploadedCv, spin: loadingUploadedCv, highlight: true }]
      : []),
    { key: "pdf", label: "Upload your resume", hint: "Any old resume PDF works — we'll redesign it.", icon: Upload, tone: "bg-primary/10 text-primary", onClick: onUploadPdf },
    { key: "ai", label: "No resume handy? Talk to AI", hint: "Answer a few questions by voice or chat — about 2 minutes.", icon: Mic, tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400", onClick: onTalkToAi },
    { key: "li", label: "Import from LinkedIn", hint: "Use your public LinkedIn profile.", icon: Linkedin, tone: "bg-[#0A66C2]/10 text-[#0A66C2]", onClick: onLinkedIn },
  ] as Array<{ key: string; label: string; hint: string; icon: typeof Upload; tone: string; onClick: () => void; spin?: boolean; highlight?: boolean }>;

  const iconBox = "grid h-10 w-10 shrink-0 place-items-center rounded-xl";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {hasExisting ? "Your hackathon resume" : "Let's build your hackathon resume"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasExisting ? "Continue with a resume you have, or start a new one." : "Start from your real details — it takes about 2 minutes."}{" "}
          {templateName && !hasExisting ? (
            <>
              Design: <span className="font-medium text-foreground">{templateName}</span> — you can change it later.
            </>
          ) : !hasExisting ? (
            "You can change the design later."
          ) : null}
        </p>
      </div>

      {loadingResumes ? (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Looking for your resumes…
        </div>
      ) : hasExisting ? (
        <section aria-label="Your resumes" className="space-y-3">
          {submitted ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/[0.06] p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className={cn(iconBox, "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400")}>
                  <CheckCircle2 className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate text-[15px] font-semibold text-foreground">{submitted.title || "My Resume"}</span>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      Submitted
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[
                      typeof submitted.atsScore === "number" ? `ATS ${submitted.atsScore}` : null,
                      relativeDay(submitted.submittedAt) ? `submitted ${relativeDay(submitted.submittedAt)}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => onOpenResume?.(submitted.resumeId)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                <PenLine className="h-4 w-4" aria-hidden /> Edit &amp; resubmit
              </button>
            </div>
          ) : null}

          {others.length > 0 ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
              <label htmlFor="hk-resume-pick" className="shrink-0 text-sm font-medium text-foreground sm:w-40">
                {submitted ? "Use another resume" : "Continue with a resume"}
              </label>
              <div className="flex min-w-0 flex-1 gap-2">
                <select
                  id="hk-resume-pick"
                  value={picked}
                  onChange={(e) => setPicked(e.target.value)}
                  disabled={busy}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                >
                  {others.map((r) => (
                    <option key={r.resumeId} value={r.resumeId}>
                      {[r.title || "Untitled resume", typeof r.atsScore === "number" ? `ATS ${r.atsScore}` : null, relativeDay(r.updatedAt) ? `edited ${relativeDay(r.updatedAt)}` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busy || !picked}
                  onClick={() => picked && onOpenResume?.(picked)}
                  className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl border border-primary/50 px-4 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
                >
                  Open <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-3 pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" aria-hidden />
            Or start a new one
            <span className="h-px flex-1 bg-border" aria-hidden />
          </div>
        </section>
      ) : null}

      {/* New resume: big rows for first-timers, compact tiles under existing resumes. */}
      <div className={cn(hasExisting ? cn("grid grid-cols-1 gap-2", newOptions.length === 4 ? "sm:grid-cols-2" : "sm:grid-cols-3") : "space-y-3")}>
        {newOptions.map((o) => {
          const Icon = o.icon;
          return (
            <button
              key={o.key}
              type="button"
              onClick={o.onClick}
              disabled={busy || (o.key === "cv" && loadingUploadedCv)}
              aria-label={o.label}
              className={cn(
                "group flex w-full items-center gap-3 rounded-2xl border bg-card text-left hover:border-primary/50 disabled:pointer-events-none disabled:opacity-60",
                o.highlight ? "border-primary/50 bg-primary/5" : "border-border",
                hasExisting ? "p-3 sm:flex-col sm:items-start sm:gap-2" : "p-4",
              )}
            >
              <span className={cn(iconBox, o.tone)}>
                <Icon className={cn("h-5 w-5", o.spin && "animate-spin")} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground sm:text-[15px]">{o.label}</span>
                <span className={cn("block text-xs text-muted-foreground", o.key === "cv" && "truncate", hasExisting && "sm:line-clamp-2")}>{o.hint}</span>
              </span>
              {hasExisting ? null : <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
            </button>
          );
        })}
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
