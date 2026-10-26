"use client";

import { useLoadingTimeout } from "@/lib/stuck-loading";
import { useMemo, useState } from "react";
import { HackathonPreQuizModal } from "../components/HackathonPreQuizModal";
import { HackathonRegistrationClosedModal } from "../components/HackathonRegistrationClosedModal";
import { useHackathonMember } from "../returningMember";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Flag, Loader2, Users } from "lucide-react";
import { formatIst, PHASE_COPY } from "../copy";
import { REGISTRATION_CLOSED_NOTE } from "../copy";
import { hackathonLandingCtaLabel, resolveHackathonLandingCta } from "../hackathonLandingCta";
import { hackathonDashboardPath, hackathonLandingPath, hackathonProfilePath } from "../config";
import { hackathonAdminApi, toHackathonError, type HackathonPublic } from "../api";
import { hackathonEntryPath } from "../hackathonEntry";
import { isHackathonRegistered, isHackathonSignupClosedForNewParticipants } from "../hackathonRegistration";
import { useHackathonMe, useHackathonPublic, useHackathonSlug } from "../hooks";
import { useQuery } from "@tanstack/react-query";
import { HackathonFeatureGate } from "../components/HackathonFeatureGate";
import { HackathonShell } from "../components/HackathonShell";
import { PhaseNotice } from "../components/PhaseNotice";
import { HackathonStartCountdown } from "../components/HackathonStartCountdown";

function PublicContent() {
  const slug = useHackathonSlug();
  const router = useRouter();
  const search = useSearchParams();
  const preview = search.get("preview") === "1";
  const { isSignedIn } = useAuth();
  const pub = useHackathonPublic(slug);
  const me = useHackathonMe(undefined, { enabled: Boolean(isSignedIn) && !preview });
  const dashboard = hackathonDashboardPath(slug);
  const profile = hackathonProfilePath(slug);
  const [quizOpen, setQuizOpen] = useState(false);
  const [closedOpen, setClosedOpen] = useState(false);
  const { member: hackathonMember, ready: hackathonMemberReady } = useHackathonMember();
  const returning = hackathonMemberReady && Boolean(hackathonMember);

  const adminPreview = useQuery({
    queryKey: ["admin", "hackathons", "slug", slug],
    queryFn: () => hackathonAdminApi.getBySlug(slug),
    enabled: preview && pub.isError,
    retry: false,
  });

  const data: HackathonPublic | undefined = useMemo(() => {
    if (pub.data) return pub.data;
    const admin = adminPreview.data;
    if (!admin) return undefined;
    return {
      hackathonId: admin.hackathonId,
      slug: admin.slug,
      title: admin.title,
      visibility: admin.visibility,
      phase: admin.phase,
      startsAt: admin.startsAt,
      endsAt: admin.endsAt,
      isFull: admin.capacity.isFull,
      spotsLeft: admin.capacity.spotsLeft,
      maxCompletions: admin.capacity.maxCompletions,
      landing: admin.landing,
      targets: admin.targets,
      socialRequired: admin.socialConfig.enabled,
      challenges: admin.challenges,
      interviewConfig: {
        requiredCount: admin.interviewConfig.requiredCount,
        durationMinutes: admin.interviewConfig.durationMinutes,
        maxAttemptsPerSlot: admin.interviewConfig.maxAttemptsPerSlot,
      },
      serverNow: new Date().toISOString(),
      registrationOpen: admin.registrationOpen !== false,
    };
  }, [adminPreview.data, pub.data]);

  const loadingEvent = pub.isLoading || (preview && pub.isError && adminPreview.isLoading);
  useLoadingTimeout(loadingEvent, "hackathon event");
  if (loadingEvent) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[#9eb2ca]">
        <Loader2 className="mr-2 size-5 animate-spin" aria-hidden /> Loading event…
      </div>
    );
  }

  if (!data) {
    const err = toHackathonError(pub.error ?? adminPreview.error, "This hackathon is not available.");
    return (
      <PhaseNotice
        icon={Flag}
        tone="amber"
        title={err.code === "NOT_PUBLISHED" || err.code === "HACKATHON_NOT_FOUND" ? "Hackathon not found" : "Something went wrong"}
        message={err.code === "NOT_PUBLISHED" || err.code === "HACKATHON_NOT_FOUND" ? null : err.message}
      />
    );
  }

  const registered = me.waitingForMe ? false : isHackathonRegistered(me.data);
  const ctaResolved = resolveHackathonLandingCta(data, Boolean(isSignedIn), registered, returning);
  const cta = {
    label: hackathonLandingCtaLabel(ctaResolved, data.landing?.registerCta),
    disabled: ctaResolved.disabled,
    hint: ctaResolved.hint,
  };
  const showClosedNote =
    isHackathonSignupClosedForNewParticipants(data, false) && !registered && !returning;

  const openLaunchRegistration = () => {
    router.push(`${hackathonLandingPath(slug)}?launch=1`);
  };

  const onCta = () => {
    if (ctaResolved.labelKey === "registerForEvent") {
      openLaunchRegistration();
      return;
    }
    if (ctaResolved.labelKey === "registrationClosed") {
      setClosedOpen(true);
      return;
    }
    if (cta.disabled) return;
    if (!isSignedIn) {
      // Quick questions, then one-tap Google; a returning browser goes straight to sign-in.
      setQuizOpen(true);
      return;
    }
    if (me.waitingForMe) {
      router.push(profile);
      return;
    }
    if (isHackathonRegistered(me.data)) {
      router.push(dashboard);
      return;
    }
    if (isHackathonSignupClosedForNewParticipants(data, false)) {
      openLaunchRegistration();
      return;
    }
    router.push(hackathonEntryPath({ registered: false, profilePath: profile, dashboardPath: dashboard }));
  };

  return (
    <div className="space-y-10">
      <HackathonPreQuizModal open={quizOpen} onOpenChange={setQuizOpen} returnTo={profile} />
      <HackathonRegistrationClosedModal
        open={closedOpen}
        onOpenChange={setClosedOpen}
        onRegisterForEvent={openLaunchRegistration}
      />
      {preview && data.visibility === "draft" ? (
        <p className="rounded-xl border border-[#8a6a20]/80 bg-[#2e2410]/70 px-4 py-2 text-center text-sm text-[#ffc44d]">
          Preview — this event is still a draft. Publish it to make this page public.
        </p>
      ) : null}
      <header className="mx-auto max-w-3xl text-center">
        <p className="hk-eyebrow">InterviewTrix Hackathon</p>
        <h1 className="mt-3 text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.045em] text-white">
          {data.title}
        </h1>
        {data.landing?.tagline ? (
          <p className="mt-3 text-lg font-medium text-[#6fc0ff]">{data.landing.tagline}</p>
        ) : null}
        {data.landing?.description ? (
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[#cfdbe8]">{data.landing.description}</p>
        ) : null}
        <p className="mt-4 text-sm text-[#9eb2ca]">
          {data.startsAt ? `Opens ${formatIst(data.startsAt)}` : "Start time coming soon"}
          {data.endsAt ? ` · Closes ${formatIst(data.endsAt)}` : ""}
        </p>
        <div className="mt-8">
          {showClosedNote ? (
            <p className="mb-3 text-xs leading-relaxed text-[#9eb2ca] sm:text-sm">{REGISTRATION_CLOSED_NOTE}</p>
          ) : null}
          <button
            type="button"
            className="hk-btn h-14 px-8 text-base disabled:pointer-events-none disabled:opacity-60"
            disabled={cta.disabled && ctaResolved.labelKey !== "registrationClosed"}
            onClick={onCta}
          >
            {cta.label}
          </button>
          {cta.hint ? <p className="mt-3 text-sm font-medium text-[#ffc44d]">{cta.hint}</p> : null}
        </div>
        {data.phase === "upcoming" && data.startsAt ? (
          <div className="mt-8">
            <HackathonStartCountdown target={data.startsAt} serverNow={data.serverNow} />
          </div>
        ) : null}
        {data.phase === "ended" ? (
          <p className="mt-6 text-sm text-[#ffc44d]">{PHASE_COPY.ended}</p>
        ) : null}
        {data.isFull && data.phase !== "ended" ? (
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-[#ff6f9f]">
            <Users className="size-4" /> {PHASE_COPY.full}
          </p>
        ) : null}
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {data.challenges.map((challenge, i) => (
          <article key={challenge.challengeId ?? challenge.key ?? i} className="hk-slot hk-bracket rounded-[24px] border border-[#27547d]/80 bg-[#071426]/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7189a6]">Challenge {i + 1}</p>
            <h2 className="mt-2 text-lg font-bold text-white">{challenge.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#9eb2ca]">{challenge.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export function HackathonPublicPage() {
  return (
    <HackathonFeatureGate>
      <HackathonShell>
        <PublicContent />
      </HackathonShell>
    </HackathonFeatureGate>
  );
}
