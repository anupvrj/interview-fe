"use client";

import { useState } from "react";
import { CheckCircle, ChevronDown, FileText, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/ui/app-select";
import { FormField } from "@/components/onboarding/onboarding-form-primitives";
import { JobDescriptionPicker } from "@/components/dashboard-2026/JobDescriptionPicker";
import type { SavedJobDescription } from "@/lib/api";
import type { ActiveSavedResumeDisplay } from "@/lib/active-saved-resume";
import { MIN_JOB_DESCRIPTION_CHARS } from "@/lib/extension-job-handoff";
import { matchSavedJobDescription, savedJobDescriptionTitle } from "@/lib/saved-job-descriptions";
import { cn } from "@/lib/utils";

const EXPERIENCE_OPTIONS = [
  { value: "0", label: "Fresher" },
  { value: "1", label: "1 year" },
  { value: "2", label: "2 years" },
  { value: "3", label: "3 years" },
  { value: "4", label: "4 years" },
  { value: "5", label: "5+ years" },
] as const;

const controlClass = "h-11 w-full rounded-xl border-border bg-background text-[14px] shadow-none";

/**
 * "Who is this for?" above the system design problems: role, company, experience, job
 * post and resume, filled in from the last interview and the profile. The interviewer
 * pitches depth and scale to them; the problem itself does not change. Collapsed to a
 * one-line summary until the user wants to edit.
 */
export function SystemDesignCandidatePanel({
  role,
  targetCompany,
  experience,
  onRoleChange,
  onCompanyChange,
  onExperienceChange,
  jobDescription,
  onJobDescriptionChange,
  savedJobDescriptions,
  resume,
  useSavedResume,
  onUseSavedResumeChange,
}: {
  role: string;
  targetCompany: string;
  experience: string;
  onRoleChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
  onExperienceChange: (value: string) => void;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  savedJobDescriptions: readonly SavedJobDescription[];
  resume: ActiveSavedResumeDisplay | null;
  useSavedResume: boolean;
  onUseSavedResumeChange: (value: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const experienceLabel = EXPERIENCE_OPTIONS.find((o) => o.value === experience)?.label;
  const savedJd = matchSavedJobDescription(savedJobDescriptions, jobDescription);
  const jdLabel = savedJd
    ? savedJobDescriptionTitle(savedJd)
    : jobDescription.trim().length >= MIN_JOB_DESCRIPTION_CHARS
      ? "New job post"
      : null;
  const summary = [
    [role.trim(), targetCompany.trim()].filter(Boolean).join(" · ") || null,
    experienceLabel ?? null,
    jdLabel ? `Job post: ${jdLabel}` : null,
    useSavedResume && resume ? `Resume: ${resume.title}` : null,
  ].filter(Boolean);

  return (
    <section className="rounded-xl border border-border/60 bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Who is this for?</span>
          <span className="mt-0.5 block truncate text-sm text-foreground">
            {summary.length ? summary.join("  ·  ") : "Add your role so the interviewer pitches depth to you"}
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-primary">
          {open ? <ChevronDown className="h-4 w-4 rotate-180" /> : <Pencil className="h-3.5 w-3.5" />}
          {open ? "Done" : "Edit"}
        </span>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-border/60 px-4 py-4 sm:px-5">
          <p className="text-[13px] text-muted-foreground">
            Filled in from your last interview and profile. The interviewer pitches depth and scale to this; the problem stays the same.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Role" htmlFor="sd-role">
              <Input id="sd-role" value={role} onChange={(e) => onRoleChange(e.target.value)} placeholder="e.g. Backend Engineer" className={controlClass} />
            </FormField>
            <FormField label="Target company" htmlFor="sd-company" optional>
              <Input id="sd-company" value={targetCompany} onChange={(e) => onCompanyChange(e.target.value)} placeholder="e.g. Amazon" className={controlClass} />
            </FormField>
            <FormField label="Experience" htmlFor="sd-experience">
              <AppSelect id="sd-experience" value={experience} onChange={onExperienceChange} options={EXPERIENCE_OPTIONS} className={controlClass} />
            </FormField>
          </div>
          <FormField label="Job description" htmlFor="sd-jd" optional>
            <JobDescriptionPicker id="sd-jd" saved={savedJobDescriptions} value={jobDescription} onChange={onJobDescriptionChange} />
          </FormField>
          {resume ? (
            <button
              type="button"
              role="checkbox"
              aria-checked={useSavedResume}
              onClick={() => onUseSavedResumeChange(!useSavedResume)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                useSavedResume ? "border-primary bg-primary/[0.06]" : "border-border bg-background hover:border-primary/40",
              )}
            >
              <FileText className={cn("h-4 w-4 shrink-0", useSavedResume ? "text-primary" : "text-muted-foreground")} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-foreground">{resume.title}</span>
                <span className="block text-[12px] text-muted-foreground">{resume.subtitle} · the interviewer sees your skills</span>
              </span>
              {useSavedResume ? <CheckCircle className="h-5 w-5 shrink-0 text-primary" /> : null}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
