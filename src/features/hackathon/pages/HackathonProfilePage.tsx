"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Flag, Loader2 } from "lucide-react";
import { getSignInUrlWithRedirect } from "@/lib/post-sign-in-redirect";
import { userApi } from "@/lib/api";
import { hackathonDashboardPath, hackathonProfilePath } from "../config";
import { PHASE_COPY } from "../copy";
import {
  completeOnboardingPayloadFromProfile,
  isHackathonProfileReady,
} from "../hackathonProfileFields";
import { hackathonKeys, useHackathonMe, useHackathonSlug, useRegisterForHackathon } from "../hooks";
import { HackathonFeatureGate } from "../components/HackathonFeatureGate";
import { HackathonOnboardingForm } from "../components/HackathonOnboardingForm";
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
  const register = useRegisterForHackathon();
  const registerAttempted = useRef(false);
  const existingAccountSyncAttempted = useRef(false);
  const [checkingExistingAccount, setCheckingExistingAccount] = useState(true);
  const me = meQuery.data;
  const done = Boolean(me?.profile.complete);

  useEffect(() => {
    if (!me || me.registered || registerAttempted.current) return;
    if (me.hackathon.phase === "ended" || me.hackathon.isFull) return;
    registerAttempted.current = true;
    register.mutate("profile");
  }, [me, register]);

  useEffect(() => {
    if (done) router.replace(dashboardPath);
  }, [dashboardPath, done, router]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace(getSignInUrlWithRedirect(profilePath));
    }
  }, [isLoaded, isSignedIn, profilePath, router]);

  /** Existing users: skip the form when type, industry, and role are already on the account. */
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || meQuery.waitingForMe || done) {
      if (!meQuery.waitingForMe && (done || (isLoaded && !isSignedIn))) {
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
        if (!isHackathonProfileReady(profile)) {
          setCheckingExistingAccount(false);
          return;
        }
        if (!me?.profile.complete) {
          await userApi.completeOnboarding(completeOnboardingPayloadFromProfile(profile));
          await queryClient.invalidateQueries({ queryKey: hackathonKeys.me(slug) });
        }
        router.replace(dashboardPath);
      } catch {
        setCheckingExistingAccount(false);
      }
    })();
  }, [
    dashboardPath,
    done,
    isLoaded,
    isSignedIn,
    me?.profile.complete,
    meQuery.waitingForMe,
    queryClient,
    router,
    slug,
    user,
  ]);

  const showLoading =
    !isLoaded ||
    !isSignedIn ||
    meQuery.waitingForMe ||
    done ||
    checkingExistingAccount ||
    (me && !me.registered && register.isPending) ||
    (!me && !meQuery.isError);

  if (showLoading) {
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
      <header className="mx-auto max-w-2xl text-center">
        <p className="hk-eyebrow">Hackathon signup</p>
        <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold leading-tight tracking-[-0.04em] text-white">
          Join the <span className="hk-grad-text">hackathon</span>
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-[15px] text-[#9eb2ca]">
          Three short steps — profile type, your details, optional resume — then you&apos;re on the dashboard.
        </p>
      </header>
      <HackathonOnboardingForm
        onComplete={() => {
          void queryClient.invalidateQueries({ queryKey: hackathonKeys.me(slug) });
          router.replace(dashboardPath);
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
