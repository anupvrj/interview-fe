"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Flag, Loader2 } from "lucide-react";
import { CandidateOnboardingForm } from "@/components/onboarding/CandidateOnboardingForm";
import { hackathonDashboardPath } from "../config";
import { PHASE_COPY } from "../copy";
import { hackathonKeys, useHackathonMe, useHackathonSlug } from "../hooks";
import { HackathonShell } from "../components/HackathonShell";
import { PhaseNotice } from "../components/PhaseNotice";

function ProfileContent() {
  const slug = useHackathonSlug();
  const dashboardPath = hackathonDashboardPath(slug);
  const router = useRouter();
  const queryClient = useQueryClient();
  const meQuery = useHackathonMe();
  const me = meQuery.data;
  const done = Boolean(me && (me.profile.complete || me.progress.resume.state === "completed"));

  useEffect(() => {
    if (done || (me && !me.registered)) router.replace(dashboardPath);
  }, [dashboardPath, done, me, router]);

  if (meQuery.waitingForMe || done || (me && !me.registered)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[#9eb2ca]">
        <Loader2 className="mr-2 size-5 animate-spin" aria-hidden /> Loading…
      </div>
    );
  }

  if (me?.hackathon.phase === "ended") {
    return <PhaseNotice icon={Flag} tone="amber" title={PHASE_COPY.ended} />;
  }

  return (
    <div className="space-y-6">
      <header className="mx-auto max-w-3xl text-center">
        <p className="hk-eyebrow">Before you start</p>
        <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold leading-tight tracking-[-0.04em] text-white">
          Complete your <span className="hk-grad-text">hackathon profile</span>
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-[15px] text-[#9eb2ca]">
          Your mock interviews are tailored to this profile. A resume upload is required to take part.
        </p>
      </header>
      <div className="dark hk-theme text-foreground">
        <CandidateOnboardingForm
          requireResume
          requireTargetRole
          onComplete={() => {
            void queryClient.invalidateQueries({ queryKey: hackathonKeys.me(slug) });
            router.replace(dashboardPath);
          }}
        />
      </div>
    </div>
  );
}

export function HackathonProfilePage() {
  return (
    <HackathonShell>
      <ProfileContent />
    </HackathonShell>
  );
}
