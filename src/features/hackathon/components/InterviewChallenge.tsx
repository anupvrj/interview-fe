"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, Code2, FileBarChart2, Loader2, Lock, Mic, Network, PlayCircle } from "lucide-react";
import { eventTargets, toHackathonError, type ChallengeProgress, type HackathonChallengeKind, type HackathonMe, type InterviewSlotProgress } from "../api";
import { hackathonDashboardPath } from "../config";
import { failureReasonText, lockReasonText } from "../copy";
import { useHackathonSlug, useStartHackathonInterview } from "../hooks";
import { withInterviewReturnTo } from "@/lib/interview-return-to";
import { cn } from "@/lib/utils";
import { hkInputClass, hkSecondaryButton } from "./ResumeChallenge";

type InterviewTarget = { targetRole?: string; targetCompany?: string };

// Keyed per participant: sessionStorage survives sign-out/sign-in in the same tab, so a
// slug-only key leaked one person's role/company into the next account's form.
function targetStorageKey(slug: string, owner: string) {
  return `hk-interview-target:${slug}:${owner}`;
}

function readStoredTarget(slug: string, owner: string): InterviewTarget {
  try {
    const raw = sessionStorage.getItem(targetStorageKey(slug, owner));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as InterviewTarget;
    return {
      targetRole: typeof parsed.targetRole === "string" ? parsed.targetRole : undefined,
      targetCompany: typeof parsed.targetCompany === "string" ? parsed.targetCompany : undefined,
    };
  } catch {
    return {};
  }
}

function writeStoredTarget(slug: string, owner: string, target: InterviewTarget) {
  try {
    sessionStorage.setItem(targetStorageKey(slug, owner), JSON.stringify(target));
  } catch {
    /* private mode */
  }
}

function asksForTarget(kind?: HackathonChallengeKind) {
  return kind !== "system_design";
}

function returnPath(dashboardPath: string, slot: number) {
  return `${dashboardPath}?fromInterview=1&submitted=${slot}`;
}

function roundLiveHref(
  kind: HackathonChallengeKind | undefined,
  ids: { interviewId?: string; sessionId?: string },
  slot: number,
  dashboardPath: string,
) {
  const back = returnPath(dashboardPath, slot);
  if (kind === "coding" && ids.interviewId) {
    return withInterviewReturnTo(`/dashboard/coding-interviews/${ids.interviewId}`, back);
  }
  if (kind === "system_design" && (ids.sessionId || ids.interviewId)) {
    return withInterviewReturnTo(`/dashboard/system-design/${ids.sessionId ?? ids.interviewId}`, back);
  }
  if (ids.interviewId) {
    return withInterviewReturnTo(`/interview/${ids.interviewId}/realtime`, back);
  }
  return dashboardPath;
}

function roundReportHref(
  kind: HackathonChallengeKind | undefined,
  ids: { interviewId?: string; sessionId?: string },
  slot: number,
  dashboardPath: string,
) {
  const back = returnPath(dashboardPath, slot);
  if (kind === "system_design" && (ids.sessionId || ids.interviewId)) {
    return withInterviewReturnTo(`/dashboard/system-design/${ids.sessionId ?? ids.interviewId}`, back);
  }
  if (ids.interviewId) {
    return withInterviewReturnTo(`/dashboard/interviews/${ids.interviewId}/report`, back);
  }
  return dashboardPath;
}

function roundNoun(kind?: HackathonChallengeKind) {
  if (kind === "coding") return "round";
  if (kind === "system_design") return "session";
  return "interview";
}

function roundHeading(kind?: HackathonChallengeKind) {
  return kind === "coding" || kind === "system_design" ? "Round" : "Interview";
}

function RoundIcon({ kind }: Readonly<{ kind?: HackathonChallengeKind }>) {
  if (kind === "coding") return <Code2 className="size-5 text-[#3aa0ff]" aria-hidden />;
  if (kind === "system_design") return <Network className="size-5 text-[#3aa0ff]" aria-hidden />;
  return <Mic className="size-5 text-[#3aa0ff] drop-shadow-[0_0_6px_rgba(58,160,255,0.6)]" aria-hidden />;
}

function ScoreBadge({ score, target }: Readonly<{ score: number; target: number }>) {
  const good = score >= target;
  return (
    <span className={cn("block text-3xl font-extrabold leading-none tabular-nums", good ? "text-[#29d6a0]" : "text-[#ffc44d]")}>
      {score}
      <span className="ml-0.5 text-base font-semibold text-[#7189a6]">/100</span>
    </span>
  );
}

function SlotCard({
  slot,
  durationMinutes,
  starting,
  onStart,
  dashboardPath,
  interviewTarget,
  kind,
}: Readonly<{
  slot: InterviewSlotProgress;
  durationMinutes: number;
  starting: boolean;
  onStart: (slot: number) => void;
  dashboardPath: string;
  interviewTarget: number;
  kind?: HackathonChallengeKind;
}>) {
  const failure = failureReasonText(slot.lastFailureReason);
  const attemptsLeft = Math.max(0, slot.attemptsMax - slot.attemptsUsed);

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border p-5",
        slot.state === "completed"
          ? "border-[#1fa596]/60 bg-[#0b2e2b]/35"
          : slot.state === "locked"
            ? "border-dashed border-white/20 bg-transparent"
            : "border-white/45 bg-[#06142c]/60",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-3 text-[17px] font-bold text-white">
          <RoundIcon kind={kind} />
          {roundHeading(kind)} {slot.slot}
        </h3>
        {kind === "screening" || !kind ? (
          <span className="text-sm font-medium text-white">{durationMinutes} min</span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        {slot.state === "completed" ? (
          // Status + score on the left, report action pinned right
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#29d6a0]">
                <CheckCircle2 className="size-4" aria-hidden /> Submitted
              </div>
              {typeof slot.overallScore === "number" ? (
                <ScoreBadge score={slot.overallScore} target={interviewTarget} />
              ) : null}
            </div>
            {slot.interviewId || slot.sessionId ? (
              <Link
                href={roundReportHref(kind, { interviewId: slot.interviewId, sessionId: slot.sessionId }, slot.slot, dashboardPath)}
                className={cn(hkSecondaryButton, "shrink-0")}
              >
                <FileBarChart2 className="size-4" aria-hidden />
                View report
              </Link>
            ) : null}
          </div>
        ) : slot.state === "processing" ? (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#2bd2ff]">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Generating your report…
            </p>
            <p className="text-sm text-[#9eb2ca]">
              Your interview is submitted once the report is ready. This usually takes about a minute.
            </p>
          </div>
        ) : slot.state === "in_progress" ? (
          <div className="space-y-3">
            <p className="text-sm text-[#cfdbe8]">This interview has started but isn&apos;t finished yet.</p>
            {slot.activeInterviewId ? (
              <Link href={roundLiveHref(kind, { interviewId: slot.activeInterviewId, sessionId: slot.sessionId }, slot.slot, dashboardPath)} className="hk-btn min-h-11 px-5 text-sm">
                <PlayCircle className="size-4" aria-hidden />
                Continue {roundNoun(kind)} {slot.slot}
              </Link>
            ) : (
              <p className="flex items-center gap-2 text-sm text-[#9eb2ca]">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Setting up your interview…
              </p>
            )}
          </div>
        ) : slot.state === "available" ? (
          <div className="mt-auto space-y-3">
            {failure ? (
              <p className="text-sm text-[#ffc44d]">
                {failure} You can try again.
              </p>
            ) : null}
            <button
              type="button"
              disabled={starting}
              onClick={() => onStart(slot.slot)}
              className="hk-btn h-12 w-full px-5 text-base disabled:pointer-events-none disabled:opacity-60"
            >
              {starting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Preparing {roundNoun(kind)}…
                </>
              ) : (
                <>
                  Start {roundNoun(kind)} {slot.slot}
                  <ArrowRight className="hk-btn-arrow size-4" aria-hidden />
                </>
              )}
            </button>
            <p className="text-[13px] text-[#cfdbe8]">
              {attemptsLeft} of {slot.attemptsMax} attempts left. An attempt counts once the {roundNoun(kind)} starts.
            </p>
          </div>
        ) : (
          <p className="flex items-center gap-3 text-[15px] text-[#cfdbe8]">
            <Lock className="size-5 shrink-0 text-[#9eb2ca]" aria-hidden />
            {slot.lockReason === "previous_step" && slot.slot > 1
              ? `Unlocks after round ${slot.slot - 1} is submitted.`
              : slot.lockReason
                ? lockReasonText(slot.lockReason, 2)
                : "Locked"}
          </p>
        )}
      </div>
    </div>
  );
}

export function InterviewChallenge({
  me,
  challenge,
}: Readonly<{ me: HackathonMe; challenge?: ChallengeProgress }>) {
  const slug = useHackathonSlug();
  const dashboardPath = hackathonDashboardPath(slug);
  const storageOwner = me.participant?.participantId ?? "anon";
  const targets = eventTargets(me.hackathon);
  const router = useRouter();
  const start = useStartHackathonInterview();
  const [startingSlot, setStartingSlot] = useState<number | null>(null);
  const [setupSlot, setSetupSlot] = useState<number | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryIn, setRetryIn] = useState<number | null>(null);
  const [retryEpoch, setRetryEpoch] = useState(0);
  const pendingStart = useRef<{ slot: number; target?: InterviewTarget } | null>(null);
  const retryAt = useRef<number | null>(null);
  const onStartRef = useRef<(slot: number, target?: InterviewTarget) => void>(() => undefined);
  const kind = challenge?.kind ?? "screening";
  const slots = challenge?.slots ?? me.progress.interviews.slots;
  const passTarget = challenge?.minScore ?? targets.interviewScore;
  const durationMinutes =
    me.hackathon.challenges.find((c) => c.challengeId === challenge?.challengeId)?.config?.durationMinutes ??
    me.hackathon.interviewConfig.durationMinutes;

  const openSetup = (slot: number) => {
    if (!asksForTarget(kind)) {
      onStart(slot);
      return;
    }
    const stored = readStoredTarget(slug, storageOwner);
    setTargetRole(stored.targetRole || me.profile.targetJobRole || "");
    setTargetCompany(stored.targetCompany || me.profile.targetCompany || "");
    setSetupError(null);
    setError(null);
    setSetupSlot(slot);
  };

  const confirmSetup = (event: FormEvent) => {
    event.preventDefault();
    if (setupSlot === null) return;
    const role = targetRole.trim();
    if (!role) {
      setSetupError("Add the role you want this interview to cover.");
      return;
    }
    const target = { targetRole: role, targetCompany: targetCompany.trim() || undefined };
    writeStoredTarget(slug, storageOwner, target);
    setSetupSlot(null);
    onStart(setupSlot, target);
  };

  const onStart = (slot: number, target?: InterviewTarget) => {
    setError(null);
    setRetryIn(null);
    retryAt.current = null;
    setStartingSlot(slot);
    pendingStart.current = { slot, target };
    start.mutate(
      { slot, language: "en", challengeId: challenge?.challengeId, ...target },
      {
        onSuccess: ({ interviewId, sessionId }) => {
          pendingStart.current = null;
          router.push(roundLiveHref(kind, { interviewId, sessionId }, slot, dashboardPath));
        },
        onError: (err) => {
          const e = toHackathonError(err);
          const activeId =
            (typeof e.details?.interviewId === "string" && e.details.interviewId) ||
            (typeof e.details?.sessionId === "string" && e.details.sessionId) ||
            undefined;
          if (e.code === "ATTEMPT_IN_PROGRESS" && activeId) {
            pendingStart.current = null;
            router.push(
              roundLiveHref(
                kind,
                { interviewId: typeof e.details?.interviewId === "string" ? e.details.interviewId : undefined, sessionId: typeof e.details?.sessionId === "string" ? e.details.sessionId : undefined },
                slot,
                dashboardPath,
              ),
            );
            return;
          }
          if (e.code === "CAPACITY_FULL") {
            const wait = typeof e.details?.retryAfterSeconds === "number" ? e.details.retryAfterSeconds : 30;
            retryAt.current = Date.now() + wait * 1000;
            setRetryIn(wait);
            setRetryEpoch((n) => n + 1);
            setError(`All interview rooms are busy, retrying in ${wait} seconds.`);
            return;
          }
          pendingStart.current = null;
          setError(e.message);
          setStartingSlot(null);
        },
      },
    );
  };

  onStartRef.current = onStart;

  useEffect(() => {
    if (retryEpoch === 0 || retryAt.current === null) return;
    const tick = () => {
      if (retryAt.current === null) return;
      const left = Math.ceil((retryAt.current - Date.now()) / 1000);
      if (left <= 0) {
        retryAt.current = null;
        setRetryIn(null);
        const next = pendingStart.current;
        if (next) onStartRef.current(next.slot, next.target);
        return;
      }
      setRetryIn(left);
      setError(`All interview rooms are busy, retrying in ${left} second${left === 1 ? "" : "s"}.`);
    };
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [retryEpoch]);

  // The card already shows the lock reason; don't repeat it per slot.
  if (challenge?.state === "locked") return null;

  const roundLabel = kind === "coding" ? "coding round" : kind === "system_design" ? "system design round" : "interview";

  return (
    <div className="space-y-4">
      {setupSlot !== null ? (
        <form
          onSubmit={confirmSetup}
          // Our styled inline error replaces the browser's native "fill out this field" tooltip.
          noValidate
          className="space-y-5 rounded-2xl border border-white/45 bg-[#06142c]/60 p-4 sm:p-5"
        >
          <div>
            <h3 className="text-base font-bold text-white sm:text-[17px]">
              Before {roundHeading(kind)} {setupSlot}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[#9eb2ca]">
              We’ll tailor questions to this role{kind === "coding" ? " and problem set" : ""}. Company is optional.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="hk-target-role" className="text-sm font-semibold text-[#dbe9f8]">
                Target role
              </label>
              <input
                id="hk-target-role"
                value={targetRole}
                onChange={(e) => {
                  setTargetRole(e.target.value);
                  if (setupError) setSetupError(null);
                }}
                aria-invalid={setupError ? true : undefined}
                aria-describedby={setupError ? "hk-target-role-error" : undefined}
                placeholder="e.g. Backend Engineer"
                autoComplete="organization-title"
                autoFocus
                required
                className={hkInputClass}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="hk-target-company" className="text-sm font-semibold text-[#dbe9f8]">
                Company <span className="font-normal text-[#7189a6]">(optional)</span>
              </label>
              <input
                id="hk-target-company"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Google"
                autoComplete="organization"
                className={hkInputClass}
              />
            </div>
          </div>
          {setupError ? (
            <p id="hk-target-role-error" role="alert" className="flex items-start gap-2 text-sm text-[#ff6f9f]">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {setupError}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setSetupSlot(null)}
              className={cn(hkSecondaryButton, "w-full sm:w-auto")}
            >
              Cancel
            </button>
            <button type="submit" className="hk-btn h-12 w-full px-6 text-sm sm:w-auto">
              Start {roundNoun(kind)} {setupSlot}
              <ArrowRight className="hk-btn-arrow size-4" aria-hidden />
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="-mt-2 text-sm text-[#cfdbe8] sm:pl-[4.25rem]">
            {slots.length === 1 ? `This ${roundLabel} is` : `These ${roundLabel}s are`} free for hackathon participants
            {asksForTarget(kind)
              ? ". You can set the target role and company before each start."
              : me.profile.targetJobRole
                ? ` and uses your role (${me.profile.targetJobRole})`
                : ""}
            {passTarget != null ? ` Aim for ${passTarget}+ on each.` : "."}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {slots.map((slot) => (
              <SlotCard
                key={slot.slot}
                slot={slot}
                kind={kind}
                dashboardPath={dashboardPath}
                interviewTarget={slot.minScore ?? passTarget ?? targets.interviewScore}
                durationMinutes={durationMinutes ?? 15}
                starting={startingSlot === slot.slot && (start.isPending || start.isSuccess || retryIn !== null)}
                onStart={openSetup}
              />
            ))}
          </div>
        </>
      )}
      {error ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-[#ff6f9f]">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}
