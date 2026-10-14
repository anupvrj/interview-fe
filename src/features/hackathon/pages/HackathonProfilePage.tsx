"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Flag, Loader2 } from "lucide-react";
import { toHackathonError } from "../api";
import { ResumeChallenge, hkSecondaryButton } from "../components/ResumeChallenge";
import { getSignInUrlWithRedirect } from "@/lib/post-sign-in-redirect";
import { userApi } from "@/lib/api";
import { hackathonDashboardPath, hackathonProfilePath } from "../config";
import { PHASE_COPY } from "../copy";
import {
  completeOnboardingPayloadFromProfile,
  isHackathonProfileReady,
  isHackathonStep1Ready,
} from "../hackathonProfileFields";
import { hackathonKeys, useHackathonMe, useHackathonSlug } from "../hooks";
import { HackathonFeatureGate } from "../components/HackathonFeatureGate";
import { HackathonOnboardingForm } from "../components/HackathonOnboardingForm";
import { HackathonRegistrationModal } from "../components/HackathonRegistrationModal";
import { useHackathonRegistrationGate } from "../useHackathonRegistrationGate";
import { HackathonShell } from "../components/HackathonShell";
import { PhaseNotice } from "../components/PhaseNotice";

function ProfileContent() {
  const slug = useHackathonSlug();
  const dashboardPath = hackathonDashboardPath(slug);
  const profilePath = hackathonProfilePath(slug);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { isLoaded, isSignedIn } = useAuth();
  const meQuery = useHackathonMe();
  const existingAccountSyncAttempted = useRef(false);
  const [checkingExistingAccount, setCheckingExistingAccount] = useState(true);
  const me = meQuery.data;
  const profileComplete = Boolean(me?.profile.complete);

  const { register, registerAttempted, modalPhase, registrationBusy, successModalOpen, completeRegistrationFlow } =
    useHackathonRegistrationGate({
      source: "profile",
      autoRegister: true,
      onRegistrationComplete: () => router.replace(dashboardPath),
    });

  useEffect(() => {
    if (!me?.registered || !me.profile.complete || modalPhase !== null || register.isPending) return;
    router.replace(dashboardPath);
  }, [dashboardPath, me?.profile.complete, me?.registered, modalPhase, register.isPending, router]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace(getSignInUrlWithRedirect(profilePath));
    }
  }, [isLoaded, isSignedIn, profilePath, router]);

  /** Existing users: skip the form when type, industry, and role are already on the account. */
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || meQuery.waitingForMe || profileComplete) {
      if (!meQuery.waitingForMe && (profileComplete || (isLoaded && !isSignedIn))) {
        setCheckingExistingAccount(false);
      }
      return;
    }
    if (existingAccountSyncAttempted.current) return;
    existingAccountSyncAttempted.current = true;

    void (async () => {
      try {
        await userApi.createOrGetUser(
          user.id,
          user.primaryEmailAddress?.emailAddress || "",
          user.fullName || user.firstName || "User",
        );
        const profile = await userApi.getMyProfile();
        if (!isHackathonProfileReady(profile) || !isHackathonStep1Ready(profile)) {
          setCheckingExistingAccount(false);
          return;
        }
        if (!me?.profile.complete) {
          await userApi.completeOnboarding(completeOnboardingPayloadFromProfile(profile));
          await queryClient.invalidateQueries({ queryKey: hackathonKeys.me(slug) });
        }
      } catch {
        setCheckingExistingAccount(false);
      }
    })();
  }, [
    isLoaded,
    isSignedIn,
    me?.profile.complete,
    meQuery.waitingForMe,
    profileComplete,
    queryClient,
    slug,
    user,
  ]);

  const headingToDashboard = profileComplete && Boolean(me?.registered);

  const showBlockingShell =
    !isLoaded ||
    !isSignedIn ||
    meQuery.waitingForMe ||
    checkingExistingAccount ||
    registrationBusy ||
    successModalOpen ||
    headingToDashboard ||
    (profileComplete && me && !me.registered && !register.isError) ||
    (!me && !meQuery.isError);

  if (showBlockingShell) {
    return (
      <>
        <HackathonRegistrationModal phase={modalPhase} onGoToChallenge={completeRegistrationFlow} />
        {successModalOpen ? (
          <div className="min-h-[50vh]" aria-hidden />
        ) : (
          <div className="flex min-h-[50vh] items-center justify-center text-[#9eb2ca]">
            <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
            {headingToDashboard ? "Opening your challenge…" : "Loading…"}
          </div>
        )}
      </>
    );
  }

  if (me?.hackathon.phase === "ended") {
    return <PhaseNotice icon={Flag} tone="amber" title={PHASE_COPY.ended} />;
  }

  const registerError = register.error ? toHackathonError(register.error) : null;
  if (profileComplete && me && !me.registered && registerError) {
    return (
      <PhaseNotice icon={AlertCircle} tone="rose" title="We couldn't register you" message={registerError.message}>
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

  return (
    <div className="space-y-6">
      <header className="mx-auto max-w-2xl text-center">
        <p className="hk-eyebrow">Hackathon signup</p>
        <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold leading-tight tracking-[-0.04em] text-white">
          Join the <span className="hk-grad-text">hackathon</span>
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-[15px] text-[#9eb2ca]">
          Three short steps — profile type and mobile, your details, optional resume — then you&apos;re on the dashboard.
        </p>
      </header>
      <HackathonOnboardingForm
        onComplete={() => {
          void queryClient.invalidateQueries({ queryKey: hackathonKeys.me(slug) });
        }}
      />
    </div>
  );
}

export function HackathonProfilePage() {
  return (
    <HackathonFeatureGate backHref="/dashboard" backLabel="Back to dashboard">
      <HackathonShell>
        <ProfileContent />
      </HackathonShell>
    </HackathonFeatureGate>
  );
}
