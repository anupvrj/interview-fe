"use client";

import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Flag, Loader2, Users } from "lucide-react";
import { CTA_LABELS, formatIst, PHASE_COPY } from "../copy";
import { hackathonDashboardPath } from "../config";
import { hackathonAdminApi, toHackathonError, type HackathonPublic } from "../api";
import { useHackathonPublic, useHackathonSlug } from "../hooks";
import { useQuery } from "@tanstack/react-query";
import { HackathonFeatureGate } from "../components/HackathonFeatureGate";
import { HackathonShell } from "../components/HackathonShell";
import { PhaseNotice } from "../components/PhaseNotice";
import { Countdown } from "../components/Countdown";

function ctaFromPublic(pub: HackathonPublic | undefined, isSignedIn: boolean) {
  const hint =
    pub && pub.spotsLeft !== null && pub.spotsLeft > 0 && pub.spotsLeft < 20
      ? `Only ${pub.spotsLeft} spot${pub.spotsLeft === 1 ? "" : "s"} left`
      : null;
  if (!pub) {
    return { label: isSignedIn ? CTA_LABELS.goToChallenges : CTA_LABELS.register, disabled: false, hint: null };
  }
  if (pub.phase === "ended") {
    return { label: isSignedIn ? CTA_LABELS.seeResults : CTA_LABELS.ended, disabled: !isSignedIn, hint: null };
  }
  if (pub.isFull) {
    return { label: isSignedIn ? CTA_LABELS.goToChallenges : CTA_LABELS.full, disabled: !isSignedIn, hint: null };
  }
  if (isSignedIn) {
    return { label: pub.phase === "live" ? CTA_LABELS.goToChallenges : CTA_LABELS.getReady, disabled: false, hint };
  }
  return { label: pub.landing?.registerCta?.trim() || CTA_LABELS.register, disabled: false, hint };
}

function PublicContent() {
  const slug = useHackathonSlug();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const search = useSearchParams();
  const preview = search.get("preview") === "1";
  const pub = useHackathonPublic(slug);
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
    };
  }, [adminPreview.data, pub.data]);

  if (pub.isLoading || (preview && pub.isError && adminPreview.isLoading)) {
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

  const cta = ctaFromPublic(data, Boolean(isSignedIn));
  const dashboard = hackathonDashboardPath(slug);
  const onCta = () => {
    if (cta.disabled) return;
    router.push(isSignedIn ? dashboard : `/sign-up?redirect_url=${encodeURIComponent(dashboard)}`);
  };

  return (
    <div className="space-y-10">
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
          <button type="button" className="hk-btn h-14 px-8 text-base disabled:pointer-events-none disabled:opacity-60" disabled={cta.disabled} onClick={onCta}>
            {cta.label}
          </button>
          {cta.hint ? <p className="mt-3 text-sm font-medium text-[#ffc44d]">{cta.hint}</p> : null}
        </div>
        {data.phase === "upcoming" && data.startsAt ? (
          <div className="mt-8">
            <Countdown target={data.startsAt} serverNow={data.serverNow} />
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
          <article key={challenge.challengeId ?? challenge.key ?? i} className="rounded-[24px] border border-[#27547d]/80 bg-[#071426]/70 p-5">
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
