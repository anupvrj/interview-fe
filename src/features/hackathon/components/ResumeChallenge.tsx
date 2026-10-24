"use client";

import { HackathonHelpOnWhatsApp } from "./HackathonHelpOnWhatsApp";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ExternalLink, FilePlus2, FileText, Loader2, PencilLine } from "lucide-react";
import { eventTargets, toHackathonError, type HackathonMe } from "../api";
import { hackathonDashboardPath } from "../config";
import {
  useCompleteResumeChallenge,
  useEligibleResumes,
  useHackathonSlug,
  useOpenSubmittedResume,
  usePreviewResumeScore,
  useSubmitHackathonResume,
} from "../hooks";
import { ResumeScoreDialog, type ResumeScorePhase } from "./ResumeScoreDialog";
import { ResumePlaceholderDialog } from "./ResumePlaceholderDialog";
import { HackathonChallengeSuccessModal } from "../celebration/HackathonChallengeSuccessModal";

/** Query flag the resume editor adds after "Save and return to Hackathon" re-submits. */
export const RESUME_SCORE_RETURN_PARAM = "resumeScore";
import { cn } from "@/lib/utils";

export const hkInputClass =
  "h-12 w-full rounded-xl border border-[#27547d] bg-[#071426] px-3.5 text-[15px] text-white placeholder:text-[#7189a6] focus:border-[#2a7fd4] focus:outline-none focus:ring-2 focus:ring-[#1677ff]/40 disabled:opacity-60";
export const hkSecondaryButton =
  "hk-btn-ghost inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-white/70 bg-transparent px-5 text-[15px] font-semibold text-white transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 disabled:pointer-events-none disabled:opacity-60";

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

export function ResumeChallenge({ me, number = 1 }: Readonly<{ me: HackathonMe; number?: number }>) {
  const slug = useHackathonSlug();
  const dashboardPath = hackathonDashboardPath(slug);
  const returnQs = `returnTo=${encodeURIComponent(dashboardPath)}&returnLabel=${encodeURIComponent("Hackathon")}`;
  // Quick start: template picked for them, start from real details, no job-description step.
  const newResumeHref = `/dashboard/resumes/new?${returnQs}&hk=1`;
  const editResumeHref = (resumeId: string) => `/dashboard/resumes/${resumeId}/edit?${returnQs}`;
  const targets = eventTargets(me.hackathon);
  const resumeProgress = me.progress.challenges?.find((c) => c.kind === "resume");
  const passMark = resumeProgress?.minScore ?? null;
  const displayTarget = passMark ?? targets.atsScore;
  const state = resumeProgress?.state ?? me.progress.resume.state;
  const laterStarted = (me.progress.challenges ?? [])
    .filter((c) => c.kind === "screening" || c.kind === "coding" || c.kind === "system_design")
    .some((c) =>
      (c.slots ?? []).some(
        (s) => s.attemptsUsed > 0 || s.state === "in_progress" || s.state === "processing" || s.state === "completed",
      ),
    );
  const canChange = Boolean(me.resume) && me.hackathon.phase === "live" && !laterStarted;
  const [changing, setChanging] = useState(false);
  // Submitted-but-not-completed shows the submitted card + Complete button, not the picker.
  const showPicker =
    (state === "available" && me.resume?.awaitingCompletion !== true) || (canChange && changing);

  const resumes = useEligibleResumes(showPicker);
  const submit = useSubmitHackathonResume();
  const openPdf = useOpenSubmittedResume();
  const [selectedId, setSelectedId] = useState("");

  const options = useMemo(() => resumes.data ?? [], [resumes.data]);
  useEffect(() => {
    if (options.length === 0) return;
    if (selectedId && options.some((r) => r.resumeId === selectedId)) return;
    const lastEdited = [...options].sort((x, y) => (y.updatedAt ?? "").localeCompare(x.updatedAt ?? ""))[0];
    const preferred = options.find((r) => r.resumeId === me.preferredResumeId) ?? lastEdited;
    setSelectedId(preferred.resumeId);
  }, [me.preferredResumeId, options, selectedId]);
  const selected = options.find((r) => r.resumeId === selectedId);
  /** Sample data found while analysing or submitting — listed in a pop-up with "Fix my resume". */
  const [placeholderPopup, setPlaceholderPopup] = useState<{ issues: string[]; resumeId: string | null } | null>(null);
  const submitError = submit.error ? toHackathonError(submit.error) : null;
  const error = submitError?.code === "RESUME_HAS_PLACEHOLDERS" ? null : submitError;

  // ---- Score pop-up: analyse → (update | submit) → complete -------------------------
  const preview = usePreviewResumeScore();
  const complete = useCompleteResumeChallenge();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [phase, setPhase] = useState<ResumeScorePhase>("analysing");
  const [dialogScore, setDialogScore] = useState<number | null>(null);
  const [dialogResumeId, setDialogResumeId] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const awaiting = me.resume?.awaitingCompletion === true;

  const openSubmitted = useCallback(() => {
    if (!me.resume) return;
    setDialogResumeId(me.resume.resumeId);
    setDialogScore(me.resume.atsScore);
    setDialogError(null);
    setPhase("submitted");
    setDialogOpen(true);
  }, [me.resume]);

  /** Sample-data rejections swap the score pop-up for the sample-data pop-up. */
  const handlePlaceholderError = (err: unknown) => {
    const e = toHackathonError(err);
    if (e.code !== "RESUME_HAS_PLACEHOLDERS") return false;
    setDialogOpen(false);
    setPlaceholderPopup({
      issues: placeholderMessages(e.details?.issues),
      resumeId: typeof e.details?.resumeId === "string" ? e.details.resumeId : dialogResumeId,
    });
    return true;
  };

  const analyse = (resumeId: string) => {
    setPlaceholderPopup(null);
    setDialogResumeId(resumeId);
    setDialogScore(null);
    setDialogError(null);
    setPhase("analysing");
    setDialogOpen(true);
    submit.reset();
    preview.mutate(resumeId, {
      onSuccess: (result) => {
        setDialogScore(result.atsScore);
        setPhase("scored");
      },
      onError: (err) => {
        if (handlePlaceholderError(err)) return;
        setDialogError(toHackathonError(err).message);
        setPhase("scored");
      },
    });
  };

  const submitFromDialog = () => {
    if (!dialogResumeId) return;
    setDialogError(null);
    setPhase("submitting");
    submit.mutate(dialogResumeId, {
      onSuccess: (data) => {
        setChanging(false);
        setDialogScore(data.resume?.atsScore ?? dialogScore);
        setPhase("submitted");
      },
      onError: (err) => {
        if (handlePlaceholderError(err)) return;
        setDialogError(toHackathonError(err).message);
        setPhase("scored");
      },
    });
  };

  const completeChallenge = () => {
    setDialogError(null);
    setPhase("completing");
    complete.mutate(undefined, {
      onSuccess: () => {
        setDialogOpen(false);
        setCelebrate(true);
      },
      onError: (err) => {
        setDialogError(toHackathonError(err).message);
        setPhase("submitted");
      },
    });
  };

  const goToNextChallenge = () => {
    document.getElementById(`hk-challenge-${number + 1}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Back from the editor ("Save and return to Hackathon" already re-submitted): show the new score.
  const handledReturn = useRef(false);
  useEffect(() => {
    if (handledReturn.current || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get(RESUME_SCORE_RETURN_PARAM) !== "1") return;
    // The board can first render the pre-submit data; wait for the submission to show up.
    if (!me.resume?.awaitingCompletion) return;
    handledReturn.current = true;
    url.searchParams.delete(RESUME_SCORE_RETURN_PARAM);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    document.getElementById(`hk-challenge-${number}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    openSubmitted();
  }, [me.resume?.awaitingCompletion, number, openSubmitted]);

  const scoreDialog = (
    <>
      <ResumeScoreDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        phase={phase}
        score={dialogScore}
        minScore={passMark}
        target={displayTarget}
        challengeNumber={number}
        editHref={dialogResumeId ? editResumeHref(dialogResumeId) : null}
        errorMessage={dialogError}
        onSubmit={submitFromDialog}
        onComplete={completeChallenge}
      />
      <ResumePlaceholderDialog
        open={placeholderPopup !== null}
        onOpenChange={(open) => {
          if (!open) setPlaceholderPopup(null);
        }}
        issues={placeholderPopup?.issues ?? []}
        fixHref={placeholderPopup?.resumeId ? editResumeHref(placeholderPopup.resumeId) : null}
      />
      <HackathonChallengeSuccessModal
        open={celebrate}
        onOpenChange={(open) => {
          setCelebrate(open);
          if (!open) goToNextChallenge();
        }}
      />
    </>
  );

  if (state === "locked") return scoreDialog;

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
      {scoreDialog}
      {awaiting && !changing ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#29d6a0]/50 bg-[#0b2e2b]/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="flex items-start gap-2 text-sm text-[#cfe9e1]">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#29d6a0]" aria-hidden />
            <span>
              Resume submitted. Improve it as many times as you like, then press{" "}
              <strong className="text-white">Complete Challenge {number}</strong> to lock it in and unlock the next challenge.
            </span>
          </p>
          <button
            type="button"
            className="hk-btn min-h-11 w-full shrink-0 px-5 text-sm disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
            disabled={complete.isPending || (passMark !== null && (me.resume?.atsScore ?? 0) < passMark)}
            onClick={openSubmitted}
          >
            Complete Challenge {number}
          </button>
        </div>
      ) : null}
      {me.resume && !changing ? (
        <div className="hk-slot flex flex-col gap-4 rounded-2xl border border-[#2a5a94]/60 bg-[#06142c]/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
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
          {/* One card, one resume: the one they last worked on. Submit it, edit it, or build a new one. */}
          <div className="hk-slot rounded-2xl border border-[#27547d]/80 bg-[#071426]/60 p-4 sm:p-5">
            {resumes.isLoading ? (
              <p className="flex items-center gap-2 text-sm text-[#9eb2ca]">
                <Loader2 className="size-4 animate-spin" /> Loading your resume…
              </p>
            ) : selected ? (
              <div className="space-y-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#2f64a8] bg-[#0b2142] text-[#6fc0ff]">
                    <FileText className="size-5" strokeWidth={1.8} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-semibold text-white">{selected.title || "My Resume"}</p>
                    <div className="mt-1">
                      <AtsScorePill score={selected.atsScore} target={displayTarget} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    className="hk-btn h-12 w-full px-6 text-sm disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
                    disabled={submit.isPending || preview.isPending}
                    onClick={() => analyse(selected.resumeId)}
                  >
                    {submit.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Submitting…
                      </>
                    ) : (
                      "Submit resume"
                    )}
                  </button>
                  <Link href={editResumeHref(selected.resumeId)} className={cn(hkSecondaryButton, "w-full sm:w-auto")}>
                    <PencilLine className="size-4" aria-hidden />
                    Edit resume
                  </Link>
                </div>
                <p className="text-sm text-[#9eb2ca]">
                  Want to start over?{" "}
                  <Link href={newResumeHref} className="font-semibold text-[#6fc0ff] hover:text-white">
                    Build a new resume
                  </Link>
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#cfdbe8]">
                  Upload any old resume, or talk to AI for 2 minutes — we&apos;ll design it for you
                  {displayTarget != null ? `. Aim for an ATS score of ${displayTarget}+.` : "."}
                </p>
                <Link href={newResumeHref} className="hk-btn min-h-11 w-full shrink-0 whitespace-nowrap px-5 text-sm sm:w-auto">
                  <FilePlus2 className="size-4" aria-hidden />
                  Build my resume
                </Link>
              </div>
            )}
          </div>

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
          {error ? <HackathonHelpOnWhatsApp /> : null}
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

/** Messages from the server's RESUME_HAS_PLACEHOLDERS details. */
function placeholderMessages(issues: unknown): string[] {
  return Array.isArray(issues)
    ? issues
        .map((issue) => (issue && typeof issue === "object" ? (issue as { message?: unknown }).message : null))
        .filter((message): message is string => typeof message === "string")
    : [];
}
