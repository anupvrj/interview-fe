"use client";

import { useLoadingTimeout } from "@/lib/stuck-loading";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CalendarClock, CheckCircle2, Circle, Flag, Mail, ShieldAlert, Users } from "lucide-react";
import {
  consumePostSignInReturnUrl,
  getSignInUrlWithRedirect,
  peekPostSignInReturnUrl,
} from "@/lib/post-sign-in-redirect";
import { eventTargets, toHackathonError, type HackathonMe } from "../api";
import { HACKATHON_SLUG, hackathonDashboardPath, hackathonLandingPath, hackathonProfilePath } from "../config";
import { CTA_LABELS, DASHBOARD_NOT_REGISTERED, formatIst, PHASE_COPY } from "../copy";
import { HackathonLaunchEventProvider, useHackathonLaunchEventOptional } from "@/components/hackathon-2026/HackathonLaunchEventContext";
import { HackathonRegisterProvider, useHackathonRegister } from "@/components/hackathon-2026/HackathonRegisterContext";
import { isHackathonSignupClosedForNewParticipants } from "../hackathonRegistration";
import { hackathonKeys, useHackathonMe, useHackathonSlug } from "../hooks";
import { HackathonFeatureGate } from "../components/HackathonFeatureGate";
import { ChallengeCard } from "../components/ChallengeCard";
import { HK_EVENTS, trackAtsQualifiedOnce, trackHackathonOnce, trackParticipationProgress } from "../analytics";
import { CompleteSection } from "../components/CompleteSection";
import { WhatsAppCommunityCard } from "../components/WhatsAppCommunityCard";
import { HackathonStartCountdown } from "../components/HackathonStartCountdown";
import { DashboardHero } from "../components/DashboardHero";
import { HackathonShell } from "../components/HackathonShell";
import { useNoMotion } from "../useNoMotion";
import { HackathonPageLoader } from "../components/HackathonPageLoader";
import { InterviewChallenge } from "../components/InterviewChallenge";
import { PhaseNotice } from "../components/PhaseNotice";
import { ResumeChallenge, hkSecondaryButton } from "../components/ResumeChallenge";
import { cn } from "@/lib/utils";
import { SocialChallenge } from "../components/SocialChallenge";

const SUSPENDED_CONTACT_EMAIL = "info@interviewtrix.com";
const SUSPENDED_FALLBACK = `Your hackathon has been suspended due to some suspicious activity found. Drop us an email at ${SUSPENDED_CONTACT_EMAIL}.`;

function challengeKind(challenge: HackathonMe["hackathon"]["challenges"][number]): "resume" | "screening" | "coding" | "system_design" | "social" {
  if (challenge.kind) return challenge.kind;
  if (challenge.key === "resume_submission") return "resume";
  if (challenge.key === "social_share") return "social";
  return "screening";
}

function Board({ me }: Readonly<{ me: HackathonMe }>) {
  const { challenges } = me.hackathon;
  const accents = ["blue", "teal", "violet"] as const;

  return (
    <div className="space-y-5 sm:space-y-6">
      <DashboardHero me={me} />
      {/* Completed participants get the QR version in CompleteSection instead. */}
      {me.progress.completed ? null : <WhatsAppCommunityCard />}

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
              resubmitMessage={"resubmitMessage" in progress ? progress.resubmitMessage : undefined}
            >
              {kind === "resume" ? <ResumeChallenge me={me} number={index + 1} /> : null}
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

function UnregisteredDashboardNotice() {
  const slug = useHackathonSlug();
  const router = useRouter();
  const { openSubmitHackathon, submitHackathonDisabled } = useHackathonRegister();
  const launch = useHackathonLaunchEventOptional();
  const c = DASHBOARD_NOT_REGISTERED;

  const onRegisterForEvent = () => {
    if (launch) {
      launch.openLaunchRegister();
      return;
    }
    router.push(`${hackathonLandingPath(slug)}?launch=1`);
  };

  return (
    <PhaseNotice
      icon={CalendarClock}
      tone="amber"
      title={c.title}
      message={
        <>
          {c.message}
          <p className="mt-4 rounded-xl border border-[#ffc44d]/25 bg-[#ffc44d]/[0.08] px-3.5 py-3 text-left text-sm leading-relaxed text-[#ffe9a8]">
            {c.note}
          </p>
        </>
      }
    >
      <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          disabled={submitHackathonDisabled}
          onClick={() => openSubmitHackathon("other")}
          className="hk-btn inline-flex min-h-12 w-full items-center justify-center px-6 text-[15px] disabled:pointer-events-none disabled:opacity-55 sm:w-auto"
        >
          {c.submitChallenge}
        </button>
        <button type="button" onClick={onRegisterForEvent} className={cn(hkSecondaryButton, "w-full sm:w-auto")}>
          {CTA_LABELS.registerForEvent}
        </button>
      </div>
    </PhaseNotice>
  );
}

function ReadinessChecklist({ me }: Readonly<{ me: HackathonMe }>) {
  const items = [
    { done: me.profile.complete, label: "Signup profile" },
    { done: Boolean(me.resume?.resumeId || me.preferredResumeId), label: "Resume ready (optional)" },
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
          <span>
            {item.label}
            {item.done ? null : <span className="text-[#7189a6]"> (still needed)</span>}
          </span>
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
  const { isLoaded, isSignedIn, userId } = useAuth();
  const queryClient = useQueryClient();
  const handledInterviewReturn = useRef(false);
  const meQuery = useHackathonMe();
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
    if (!me?.registered) return;
    trackHackathonOnce("dashboard_view", HK_EVENTS.dashboardView, {
      phase: me.hackathon.phase,
      challenges_completed: me.progress.challengesCompleted,
    });
    trackParticipationProgress({
      userKey: userId,
      challenges: (me.progress.challenges ?? []).map((c) => ({ challengeId: c.challengeId, kind: c.kind, state: c.state })),
      completed: me.progress.completed,
    });
    if (me.resume?.submittedAt) {
      trackAtsQualifiedOnce({ userKey: userId, atsScore: me.resume.atsScore, target: eventTargets(me.hackathon).atsScore });
    }
  }, [me, userId]);

  // Registered but profile incomplete → finish signup.
  const needsProfile =
    me &&
    me.registered &&
    !me.profile.complete &&
    me.hackathon.phase !== "ended" &&
    !me.progress.completed;
  const needsHackathonRegistration =
    me &&
    !me.registered &&
    me.hackathon.phase !== "ended" &&
    !isHackathonSignupClosedForNewParticipants(me.hackathon, false);
  useEffect(() => {
    if (needsProfile) router.replace(profilePath);
  }, [needsProfile, profilePath, router]);
  useEffect(() => {
    if (needsHackathonRegistration) router.replace(profilePath);
  }, [needsHackathonRegistration, profilePath, router]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace(getSignInUrlWithRedirect(hackathonDashboardPath(slug)));
    }
  }, [isLoaded, isSignedIn, router, slug]);

  const loadingDashboard =
    !isLoaded ||
    !isSignedIn ||
    meQuery.waitingForMe ||
    needsProfile ||
    needsHackathonRegistration ||
    (!me && !meQuery.isError);
  useLoadingTimeout(loadingDashboard, "hackathon dashboard");
  if (loadingDashboard) {
    return <HackathonPageLoader />;
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

  const { phase, isFull, startsAt, serverNow } = me.hackathon;

  if (!me.registered) {
    if (phase === "ended") {
      return <PhaseNotice icon={Flag} tone="amber" title={PHASE_COPY.ended} message="Thanks for your interest. Watch out for the next one!" />;
    }
    if (isHackathonSignupClosedForNewParticipants(me.hackathon, false)) {
      return <UnregisteredDashboardNotice />;
    }
    return <HackathonPageLoader />;
  }

  if (me.participant?.suspended) {
    return (
      <PhaseNotice
        icon={ShieldAlert}
        tone="rose"
        title="Hackathon suspended"
        message={me.participant.suspendedMessage ?? SUSPENDED_FALLBACK}
      >
        <a href={`mailto:${SUSPENDED_CONTACT_EMAIL}`} className={`${hkSecondaryButton} mt-6`}>
          <Mail className="size-4" aria-hidden />
          {SUSPENDED_CONTACT_EMAIL}
        </a>
      </PhaseNotice>
    );
  }

  if (me.progress.completed) {
    return (
      <div className="space-y-5 sm:space-y-6">
        <DashboardHero me={me} />
        <CompleteSection me={me} />
      </div>
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
              You&apos;re registered{me.profile.complete ? " and your profile is complete" : ""}.
              {startsAt ? (
                <>
                  {" "}
                  Challenges unlock on <span className="font-semibold text-white">{formatIst(startsAt)}</span>.
                </>
              ) : (
                " The start time will be announced soon."
              )}
              {me.hackathon.endsAt ? ` Submissions close on ${formatIst(me.hackathon.endsAt)}.` : ""}
            </>
          }
        >
          {startsAt ? (
            <HackathonStartCountdown
              className="mt-2"
              variant="amber"
              target={startsAt}
              serverNow={serverNow}
              onDone={() => void queryClient.invalidateQueries({ queryKey: hackathonKeys.me(slug) })}
            />
          ) : null}
          <div className="mt-6">
            <ReadinessChecklist me={me} />
          </div>
        </PhaseNotice>
        <WhatsAppCommunityCard />
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
  useNoMotion();
  return (
    <HackathonFeatureGate backHref="/dashboard" backLabel="Back to dashboard">
      <HackathonLaunchEventProvider>
        <HackathonRegisterProvider>
          <HackathonShell>
            <DashboardContent />
          </HackathonShell>
        </HackathonRegisterProvider>
      </HackathonLaunchEventProvider>
    </HackathonFeatureGate>
  );
}
