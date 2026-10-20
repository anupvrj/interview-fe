"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CalendarClock, CheckCircle2, Circle, Flag, Loader2, Mail, ShieldAlert, Users } from "lucide-react";
import {
  consumePostSignInReturnUrl,
  getSignInUrlWithRedirect,
  peekPostSignInReturnUrl,
} from "@/lib/post-sign-in-redirect";
import { eventTargets, toHackathonError, type HackathonMe } from "../api";
import { HACKATHON_SLUG, hackathonDashboardPath, hackathonLandingPath, hackathonProfilePath } from "../config";
import { formatIst, PHASE_COPY } from "../copy";
import { hackathonKeys, useHackathonMe, useHackathonSlug } from "../hooks";
import { HackathonFeatureGate } from "../components/HackathonFeatureGate";
import { ChallengeCard } from "../components/ChallengeCard";
import { HK_EVENTS, trackAtsQualifiedOnce, trackHackathonOnce, trackParticipationProgress } from "../analytics";
import { CompleteSection } from "../components/CompleteSection";
import { WhatsAppCommunityCard } from "../components/WhatsAppCommunityCard";
import { HackathonStartCountdown } from "../components/HackathonStartCountdown";
import { DashboardHero } from "../components/DashboardHero";
import { HackathonShell } from "../components/HackathonShell";
import { InterviewChallenge } from "../components/InterviewChallenge";
import { PhaseNotice } from "../components/PhaseNotice";
import { ResumeChallenge, hkSecondaryButton } from "../components/ResumeChallenge";
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

  const needsProfile =
    me?.registered &&
    !me.profile.complete &&
    me.hackathon.phase !== "ended" &&
    !me.progress.completed;
  useEffect(() => {
    if (needsProfile) router.replace(profilePath);
  }, [needsProfile, profilePath, router]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace(getSignInUrlWithRedirect(hackathonDashboardPath(slug)));
    }
  }, [isLoaded, isSignedIn, router, slug]);

  if (
    !isLoaded ||
    !isSignedIn ||
    meQuery.waitingForMe ||
    needsProfile ||
    (!me && !meQuery.isError)
  ) {
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

  const { phase, isFull, startsAt, serverNow } = me.hackathon;

  if (!me.registered) {
    if (phase === "ended") {
      return <PhaseNotice icon={Flag} tone="amber" title={PHASE_COPY.ended} message="Thanks for your interest. Watch out for the next one!" />;
    }
    if (isFull) {
      return <PhaseNotice icon={Users} tone="rose" title="Hackathon is full" message="All spots have been taken. Watch out for the next one!" />;
    }
    return (
      <PhaseNotice
        icon={CalendarClock}
        tone="blue"
        title="You're not registered"
        message="Register from the event page to join this hackathon. If you left recently, you can sign up again anytime."
      >
        <Link href={landingPath} className={hkSecondaryButton}>
          Register for hackathon
        </Link>
      </PhaseNotice>
    );
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
  return (
    <HackathonFeatureGate backHref="/dashboard" backLabel="Back to dashboard">
      <HackathonShell>
        <DashboardContent />
      </HackathonShell>
    </HackathonFeatureGate>
  );
}
