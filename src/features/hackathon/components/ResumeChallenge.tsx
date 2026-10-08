"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ExternalLink, FilePlus2, FileText, Loader2, PencilLine } from "lucide-react";
import { eventTargets, toHackathonError, type HackathonMe } from "../api";
import { hackathonDashboardPath } from "../config";
import { useEligibleResumes, useHackathonSlug, useOpenSubmittedResume, useSubmitHackathonResume } from "../hooks";
import { cn } from "@/lib/utils";

export const hkInputClass =
  "h-12 w-full rounded-xl border border-[#27547d] bg-[#071426] px-3.5 text-[15px] text-white placeholder:text-[#7189a6] focus:border-[#2a7fd4] focus:outline-none focus:ring-2 focus:ring-[#1677ff]/40 disabled:opacity-60";
export const hkSecondaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-white/70 bg-transparent px-5 text-[15px] font-semibold text-white transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 disabled:pointer-events-none disabled:opacity-60";

export function AtsScorePill({ score, target }: Readonly<{ score: number | null; target: number }>) {
  if (score === null) {
    return <span className="text-sm text-[#7189a6]">ATS score pending</span>;
  }
  const good = score >= target;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-0.5 text-sm font-bold tabular-nums",
        good ? "border-[#29d6a0]/70 bg-[#0b2e2b]/50 text-[#29d6a0]" : "border-[#ffc44d]/60 bg-[#2e2410]/40 text-[#ffc44d]",
      )}
    >
      ATS {score}/100
    </span>
  );
}

export function ResumeChallenge({ me }: Readonly<{ me: HackathonMe }>) {
  const slug = useHackathonSlug();
  const dashboardPath = hackathonDashboardPath(slug);
  const returnQs = `returnTo=${encodeURIComponent(dashboardPath)}&returnLabel=${encodeURIComponent("Hackathon")}`;
  const newResumeHref = `/dashboard/resumes/new?${returnQs}`;
  const editResumeHref = (resumeId: string) => `/dashboard/resumes/${resumeId}/edit?${returnQs}`;
  const targets = eventTargets(me.hackathon);
  const resumeProgress = me.progress.challenges?.find((c) => c.kind === "resume");
  const passMark = resumeProgress?.minScore ?? null;
  const displayTarget = passMark ?? targets.atsScore;
  const state = resumeProgress?.state ?? me.progress.resume.state;
  if (state === "locked") return null;
  const laterStarted = (me.progress.challenges ?? [])
    .filter((c) => c.kind === "screening" || c.kind === "coding" || c.kind === "system_design")
    .some((c) =>
      (c.slots ?? []).some(
        (s) => s.attemptsUsed > 0 || s.state === "in_progress" || s.state === "processing" || s.state === "completed",
      ),
    );
  const canChange = Boolean(me.resume) && me.hackathon.phase === "live" && !laterStarted;
  const [changing, setChanging] = useState(false);
  const showPicker = state === "available" || (canChange && changing);

  const resumes = useEligibleResumes(showPicker);
  const submit = useSubmitHackathonResume();
  const openPdf = useOpenSubmittedResume();
  const [selectedId, setSelectedId] = useState("");

  const options = useMemo(() => resumes.data ?? [], [resumes.data]);
  useEffect(() => {
    if (options.length === 0) return;
    if (selectedId && options.some((r) => r.resumeId === selectedId)) return;
    const preferred =
      options.find((r) => r.resumeId === me.preferredResumeId && r.hasPdf) ??
      options.find((r) => r.hasPdf) ??
      options[0];
    setSelectedId(preferred.resumeId);
  }, [me.preferredResumeId, options, selectedId]);
  const selected = options.find((r) => r.resumeId === selectedId);
  const error = submit.error ? toHackathonError(submit.error) : null;

  const viewSubmitted = async () => {
    const tab = window.open("", "_blank");
    try {
      const { url } = await openPdf.mutateAsync();
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch {
      tab?.close();
    }
  };

  return (
    <div className="space-y-5">
      {me.resume && !changing ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-[#2a5a94]/60 bg-[#06142c]/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-[#2f64a8] bg-[#0b2142] text-[#6fc0ff]">
              <FileText className="size-6" strokeWidth={1.8} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[17px] font-semibold text-white">{me.resume.title}</p>
              <div className="mt-1.5">
                <AtsScorePill score={me.resume.atsScore} target={displayTarget} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void viewSubmitted()} className={cn(hkSecondaryButton, "flex-1 whitespace-nowrap sm:min-w-[11rem] sm:flex-none")} disabled={openPdf.isPending}>
              {openPdf.isPending ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
              View PDF
            </button>
            {canChange ? (
              <>
                <Link href={editResumeHref(me.resume.resumeId)} className={cn(hkSecondaryButton, "flex-1 whitespace-nowrap sm:min-w-[11rem] sm:flex-none")}>
                  <PencilLine className="size-4" aria-hidden />
                  Edit in builder
                </Link>
                <button type="button" onClick={() => setChanging(true)} className={cn(hkSecondaryButton, "flex-1 whitespace-nowrap sm:min-w-[11rem] sm:flex-none")}>
                  Change resume
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {showPicker ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-[#27547d]/80 bg-[#071426]/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#cfdbe8]">
              Design your resume in the InterviewTrix builder, then come back here and submit it
              {displayTarget != null ? `. Aim for an ATS score of ${displayTarget}+.` : "."}
            </p>
            <Link href={newResumeHref} className={cn("hk-btn min-h-11 w-full shrink-0 px-5 text-sm sm:w-auto")}>
              <FilePlus2 className="size-4" aria-hidden />
              Design a resume
            </Link>
          </div>

          {resumes.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-[#9eb2ca]">
              <Loader2 className="size-4 animate-spin" /> Loading your resumes…
            </p>
          ) : options.length === 0 ? (
            <p className="text-sm text-[#9eb2ca]">
              You don&apos;t have any builder resumes yet. Click <strong className="text-white">Design a resume</strong>,
              pick a template, then choose <strong className="text-white">Use the CV you already uploaded</strong> to start
              from your profile CV.
            </p>
          ) : (
            <div className="space-y-3">
              <label htmlFor="hk-resume-select" className="text-sm font-semibold text-[#dbe9f8]">
                Choose the resume to submit
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  id="hk-resume-select"
                  value={selectedId}
                  onChange={(e) => {
                    setSelectedId(e.target.value);
                    submit.reset();
                  }}
                  className={hkInputClass}
                >
                  {options.map((r) => (
                    <option key={r.resumeId} value={r.resumeId}>
                      {r.title}
                      {r.atsScore !== null ? ` · ATS ${r.atsScore}` : ""}
                      {r.hasPdf ? "" : " · needs PDF"}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="hk-btn h-12 w-full shrink-0 px-6 text-sm disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
                  disabled={!selected || !selected.hasPdf || submit.isPending}
                  onClick={() =>
                    selected &&
                    submit.mutate(selected.resumeId, {
                      onSuccess: () => setChanging(false),
                    })
                  }
                >
                  {submit.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    "Submit resume"
                  )}
                </button>
              </div>
              {selected ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <AtsScorePill score={selected.atsScore} target={displayTarget} />
                  <Link href={editResumeHref(selected.resumeId)} className="inline-flex items-center gap-1.5 font-semibold text-[#6fc0ff] hover:text-white">
                    <PencilLine className="size-4" aria-hidden />
                    Edit in builder
                  </Link>
                </div>
              ) : null}
              {selected && !selected.hasPdf ? (
                <p className="text-sm text-[#ffc44d]">
                  This resume has no PDF yet. Open it with <strong>Edit in builder</strong> and click{" "}
                  <strong>Save and return to Hackathon</strong>.
                </p>
              ) : null}
              <p className="text-xs text-[#7189a6]">
                Save and return to Hackathon updates the PDF this challenge uses. You can replace it
                until a later challenge starts
                {passMark != null ? ", or until it meets the passing score" : ""}.
              </p>
            </div>
          )}

          {error ? (
            <p role="alert" className="flex items-start gap-2 text-sm text-[#ff6f9f]">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                {error.message}
                {error.code === "PDF_REQUIRED" && typeof error.details?.resumeId === "string" ? (
                  <>
                    {" "}
                    <Link href={editResumeHref(error.details.resumeId)} className="font-semibold underline">
                      Open in builder
                    </Link>
                  </>
                ) : null}
              </span>
            </p>
          ) : null}
          {changing ? (
            <button type="button" className="text-sm font-medium text-[#9eb2ca] hover:text-white" onClick={() => setChanging(false)}>
              Keep my current resume
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
