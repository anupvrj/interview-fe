"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CalendarClock, CheckCircle2, Circle, Flag, Loader2, Users } from "lucide-react";
import { consumePostSignInReturnUrl, peekPostSignInReturnUrl } from "@/lib/post-sign-in-redirect";
import { toHackathonError, type HackathonMe } from "../api";
import { HACKATHON_SLUG, hackathonDashboardPath, hackathonLandingPath, hackathonProfilePath } from "../config";
import { formatIst, PHASE_COPY } from "../copy";
import { hackathonKeys, useHackathonMe, useHackathonSlug, useRegisterForHackathon, useSetHackathonReminders } from "../hooks";
import { HackathonFeatureGate } from "../components/HackathonFeatureGate";
import { ChallengeCard } from "../components/ChallengeCard";
import { CompleteSection } from "../components/CompleteSection";
import { Countdown } from "../components/Countdown";
import { DashboardHero } from "../components/DashboardHero";
import { HackathonShell } from "../components/HackathonShell";
import { InterviewChallenge } from "../components/InterviewChallenge";
import { PhaseNotice } from "../components/PhaseNotice";
import { ResumeChallenge, hkSecondaryButton } from "../components/ResumeChallenge";
import { SocialChallenge } from "../components/SocialChallenge";

function challengeKind(challenge: HackathonMe["hackathon"]["challenges"][number]): "resume" | "screening" | "coding" | "system_design" | "social" {
  if (challenge.kind) return challenge.kind;
  if (challenge.key === "resume_submission") return "resume";
  if (challenge.key === "social_share") return "social";
  return "screening";
}

function ReminderToggle({ me }: Readonly<{ me: HackathonMe }>) {
  const reminders = useSetHackathonReminders();
  if (!me.registered || me.participant?.status === "completed") return null;
  const optedOut = Boolean(me.participant?.remindersOptOut);
  return (
    <p className="text-center text-sm text-[#7189a6]">
      <button
        type="button"
        className="font-semibold text-[#6fc0ff] hover:text-white disabled:opacity-60"
        disabled={reminders.isPending}
        onClick={() => reminders.mutate(optedOut)}
      >
        {optedOut ? "Turn daily submission reminders back on" : "Stop daily submission reminders"}
      </button>
    </p>
  );
}

function Board({ me }: Readonly<{ me: HackathonMe }>) {
  const { challenges } = me.hackathon;
  const accents = ["blue", "teal", "violet"] as const;

  return (
    <div className="space-y-5 sm:space-y-6">
      <DashboardHero me={me} />

      {challenges.map((challenge, index) => {
        const kind = challengeKind(challenge);
        const progress =
          me.progress.challenges?.find((c) => c.challengeId === challenge.challengeId) ??
          (kind === "resume"
            ? { ...me.progress.resume, challengeId: challenge.challengeId ?? "resume", kind, passed: me.progress.resume.state === "completed", minScore: null }
            : kind === "social"
              ? { ...me.progress.social, challengeId: challenge.challengeId ?? "social", kind, passed: me.progress.social.state === "completed", minScore: null }
              : { ...me.progress.interviews, challengeId: challenge.challengeId ?? "screening", kind, passed: me.progress.interviews.state === "completed", minScore: null, slots: me.progress.interviews.slots });
        return (
          <div key={challenge.challengeId ?? challenge.key ?? index} id={`hk-challenge-${index + 1}`} className="scroll-mt-24">
            <ChallengeCard
              number={index + 1}
              accent={accents[index % accents.length]}
              kind={kind}
              title={challenge.title}
              description={challenge.description}
              state={progress.state}
              lockReason={progress.lockReason}
              passed={progress.passed}
              score={progress.score}
              minScore={progress.minScore}
            >
              {kind === "resume" ? <ResumeChallenge me={me} /> : null}
              {kind === "social" ? <SocialChallenge me={me} /> : null}
              {kind === "screening" || kind === "coding" || kind === "system_design" ? (
                <InterviewChallenge me={me} challenge={progress} />
              ) : null}
            </ChallengeCard>
          </div>
        );
      })}

      <CompleteSection me={me} />
    </div>
  );
}

function ReadinessChecklist({ me }: Readonly<{ me: HackathonMe }>) {
  const items = [
    { done: me.profile.complete, label: "Profile complete" },
    { done: !me.profile.missing.includes("resume"), label: "Resume uploaded" },
  ];
  return (
    <ul className="mx-auto flex max-w-xl flex-col gap-2 text-left text-sm text-[#cfdbe8] sm:flex-row sm:justify-center sm:gap-4">
      {items.map((item) => (
        <li
          key={item.label}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2"
        >
          {item.done ? (
            <CheckCircle2 className="size-4 text-[#29d6a0]" aria-hidden />
          ) : (
            <Circle className="size-4 text-[#7189a6]" aria-hidden />
          )}
          {item.label}
          {item.done ? null : <span className="text-[#7189a6]">(still needed)</span>}
        </li>
      ))}
    </ul>
  );
}

function endedMessage(me: HackathonMe): string {
  if (me.progress.completed) return "Your submission is in. Winners will be announced after judging.";
  if (me.progress.interviews.state === "completed" && me.progress.social.state !== "completed") {
    return "Challenge 3 is closed. Interviews that finished in the grace window still count, but social links can't be submitted after the end.";
  }
  return "Submissions are closed. Here's what you completed.";
}

function DashboardContent() {
  const slug = useHackathonSlug();
  const landingPath = hackathonLandingPath(slug);
  const profilePath = hackathonProfilePath(slug);
  const router = useRouter();
  const queryClient = useQueryClient();
  const meQuery = useHackathonMe();
  const register = useRegisterForHackathon();
  const registerAttempted = useRef(false);
  const handledInterviewReturn = useRef(false);
  const me = meQuery.data;

  useEffect(() => {
    const pending = peekPostSignInReturnUrl();
    if (pending?.startsWith(landingPath) || pending?.startsWith(`/hackathon/${slug}`)) consumePostSignInReturnUrl();
  }, [landingPath, slug]);

  useEffect(() => {
    if (handledInterviewReturn.current || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("fromInterview") !== "1" && !params.has("submitted")) return;
    void queryClient.invalidateQueries({ queryKey: hackathonKeys.me(slug) });
  }, [queryClient, slug]);

  useEffect(() => {
    if (handledInterviewReturn.current || !me || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("fromInterview") !== "1" && !params.has("submitted")) return;
    handledInterviewReturn.current = true;

    const challenges = me.progress.challenges ?? [];
    let index = challenges.findIndex(
      (c) => c.state === "available" || c.state === "in_progress" || c.state === "processing",
    );
    if (index < 0) {
      index = challenges.findIndex((c) => c.state !== "completed" && c.state !== "locked");
    }
    if (index < 0) {
      const firstLocked = challenges.findIndex((c) => c.state === "locked");
      index = firstLocked > 0 ? firstLocked : 0;
    }
    const el = document.getElementById(`hk-challenge-${index + 1}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    router.replace(hackathonDashboardPath(slug), { scroll: false });
  }, [me, router, slug]);

  useEffect(() => {
    if (!me || me.registered || registerAttempted.current) return;
    if (me.hackathon.phase === "ended" || me.hackathon.isFull) return;
    registerAttempted.current = true;
    register.mutate("dashboard");
  }, [me, register]);

  const needsProfile =
    me?.registered &&
    !me.profile.complete &&
    me.hackathon.phase !== "ended" &&
    !me.progress.completed &&
    me.progress.challenges?.[0]?.state !== "completed" &&
    me.progress.resume.state !== "completed";
  useEffect(() => {
    if (needsProfile) router.replace(profilePath);
  }, [needsProfile, profilePath, router]);

  if (meQuery.waitingForMe || (me && !me.registered && register.isPending) || needsProfile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[#9eb2ca]">
        <Loader2 className="mr-2 size-5 animate-spin" aria-hidden /> Loading your hackathon…
      </div>
    );
  }

  if (meQuery.isError || !me) {
    const err = toHackathonError(meQuery.error, "We couldn't load the hackathon.");
    return (
      <PhaseNotice
        icon={AlertCircle}
        tone="rose"
        title={err.code === "HACKATHON_NOT_FOUND" ? PHASE_COPY.upcoming : "Something went wrong"}
        message={err.code === "HACKATHON_NOT_FOUND" ? null : err.message}
      >
        {err.code === "HACKATHON_NOT_FOUND" ? null : (
          <button type="button" className={hkSecondaryButton} onClick={() => void meQuery.refetch()}>
            Try again
          </button>
        )}
      </PhaseNotice>
    );
  }

  const registerError = register.error ? toHackathonError(register.error) : null;
  const { phase, isFull, startsAt, serverNow } = me.hackathon;

  if (!me.registered) {
    if (phase === "ended") {
      return <PhaseNotice icon={Flag} tone="amber" title={PHASE_COPY.ended} message="Thanks for your interest. Watch out for the next one!" />;
    }
    if (isFull || registerError?.code === "HACKATHON_FULL") {
      return <PhaseNotice icon={Users} tone="rose" title="Hackathon is full" message="All spots have been taken. Watch out for the next one!" />;
    }
    return (
      <PhaseNotice icon={AlertCircle} tone="rose" title="We couldn't register you" message={registerError?.message}>
        <button
          type="button"
          className={hkSecondaryButton}
          onClick={() => {
            registerAttempted.current = false;
            register.reset();
            void meQuery.refetch();
          }}
        >
          Try again
        </button>
      </PhaseNotice>
    );
  }

  if (phase === "upcoming") {
    return (
      <div className="space-y-8">
        <PhaseNotice
          icon={CalendarClock}
          title={PHASE_COPY.upcoming}
          message={
            <>
            You&apos;re registered{me.profile.complete ? " and your profile is complete" : ""}. The challenges unlock
            when the hackathon starts
            {startsAt ? ` on ${formatIst(startsAt)}` : ""}.
            {me.hackathon.endsAt ? ` Submissions close on ${formatIst(me.hackathon.endsAt)}.` : ""}
            </>
          }
        >
          {startsAt ? (
            <Countdown
              target={startsAt}
              serverNow={serverNow}
              onDone={() => void queryClient.invalidateQueries({ queryKey: hackathonKeys.me(slug) })}
            />
          ) : null}
          <div className="mt-6">
            <ReadinessChecklist me={me} />
          </div>
        </PhaseNotice>
        <Board me={me} />
        <ReminderToggle me={me} />
      </div>
    );
  }

  const blockedByFull =
    phase === "live" &&
    (me.progress.challenges?.[0]?.lockReason === "full" || me.progress.resume.lockReason === "full");

  return (
    <div className="space-y-8">
      {phase === "ended" ? (
        <PhaseNotice
          icon={Flag}
          tone="amber"
          title={PHASE_COPY.ended}
          message={endedMessage(me)}
        />
      ) : null}
      {blockedByFull ? (
        <PhaseNotice
          icon={Users}
          tone="rose"
          title="Hackathon is full"
          message="All spots have been taken, so new entries can't start Challenge 1."
        />
      ) : null}
      <Board me={me} />
      <ReminderToggle me={me} />
      {slug === HACKATHON_SLUG ? (
        <p className="text-center text-sm text-[#7189a6]">
          Questions? See the{" "}
          <Link href={`${landingPath}#faq`} className="font-semibold text-[#6fc0ff] hover:text-white">
            FAQ
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}

export function HackathonDashboardPage() {
  return (
    <HackathonFeatureGate backHref="/dashboard" backLabel="Back to dashboard">
      <HackathonShell>
        <DashboardContent />
      </HackathonShell>
    </HackathonFeatureGate>
  );
}
