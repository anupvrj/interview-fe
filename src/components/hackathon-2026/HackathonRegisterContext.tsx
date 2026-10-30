"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { HackathonPreQuizModal } from "@/features/hackathon/components/HackathonPreQuizModal";
import { HackathonRegistrationClosedModal } from "@/features/hackathon/components/HackathonRegistrationClosedModal";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  hackathonDashboardPath,
  hackathonLandingPath,
  hackathonProfilePath,
  HACKATHON_FEATURE_KEY,
} from "@/features/hackathon/config";
import { usePlatformFeatures } from "@/hooks/usePlatformFeatures";
import { CTA_SHORT_LABELS, REGISTRATION_CLOSED_NOTE } from "@/features/hackathon/copy";
import { useHackathonMe, useHackathonPublic, useHackathonSlug } from "@/features/hackathon/hooks";
import {
  hackathonLandingCtaLabel,
  resolveHackathonLandingCta,
} from "@/features/hackathon/hackathonLandingCta";
import { hackathonEntryPath } from "@/features/hackathon/hackathonEntry";
import {
  isHackathonRegistered,
  isHackathonSignupClosedForNewParticipants,
} from "@/features/hackathon/hackathonRegistration";
import { useHackathonMember, useMarkHackathonMember } from "@/features/hackathon/returningMember";
import { trackRegisterClick, type HackathonCtaLocation } from "@/features/hackathon/analytics";
import { useHackathonLaunchEventOptional } from "@/components/hackathon-2026/HackathonLaunchEventContext";
type HackathonRegisterContextValue = {
  openRegister: (ctaLocation?: HackathonCtaLocation) => void;
  openSubmitHackathon: (ctaLocation?: HackathonCtaLocation) => void;
  submitHackathonDisabled: boolean;
  label: string;
  /** Compact form of `label` for tight layouts. */
  shortLabel: string;
  disabled: boolean;
  hint: string | null;
};

const HackathonRegisterContext = createContext<HackathonRegisterContextValue | null>(null);

export function HackathonRegisterProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const slug = useHackathonSlug();
  const profilePath = hackathonProfilePath(slug);
  const dashboardPath = hackathonDashboardPath(slug);
  const pub = useHackathonPublic();
  const me = useHackathonMe(undefined, { enabled: Boolean(isSignedIn) });
  const { isAccessible } = usePlatformFeatures();
  const registered = me.waitingForMe ? false : isHackathonRegistered(me.data);
  const { member: hackathonMember, ready: hackathonMemberReady } = useHackathonMember();
  const returning = hackathonMemberReady && Boolean(hackathonMember);
  const active = isSignedIn ? registered : returning;
  const cta = useMemo(
    () => resolveHackathonLandingCta(pub.data, Boolean(isSignedIn), registered, returning),
    [isSignedIn, pub.data, registered, returning],
  );
  const launchEvent = useHackathonLaunchEventOptional();
  const [quizOpen, setQuizOpen] = useState(false);
  const [closedOpen, setClosedOpen] = useState(false);
  useMarkHackathonMember(slug, isSignedIn, registered);

  const openRegister = useCallback((ctaLocation: HackathonCtaLocation = "other") => {
    if (cta.disabled) return;
    if (cta.labelKey === "registerForEvent") {
      trackRegisterClick({
        ctaLocation,
        ctaState: cta.labelKey,
        signedIn: Boolean(isSignedIn),
        destination: "sign_up",
      });
      if (launchEvent) {
        launchEvent.openLaunchRegister();
      } else {
        router.push(`${hackathonLandingPath(slug)}?launch=1`);
      }
      return;
    }
    if (cta.labelKey === "seeResults") {
      trackRegisterClick({
        ctaLocation,
        ctaState: cta.labelKey,
        signedIn: Boolean(isSignedIn),
        destination: "dashboard",
      });
      if (isSignedIn) {
        router.push(dashboardPath);
      } else {
        router.push(`/sign-in?redirect_url=${encodeURIComponent(dashboardPath)}`);
      }
      return;
    }
    const track = (destination: "sign_up" | "profile" | "dashboard") =>
      trackRegisterClick({ ctaLocation, ctaState: cta.labelKey, signedIn: Boolean(isSignedIn), destination });
    if (!isSignedIn) {
      // Signed out: a few quick questions, then one-tap Google (not the full sign-up page).
      track("sign_up");
      setQuizOpen(true);
      return;
    }
    if (me.waitingForMe) {
      track("profile");
      router.push(profilePath);
      return;
    }
    if (isHackathonRegistered(me.data)) {
      track("dashboard");
      router.push(dashboardPath);
      return;
    }
    if (isHackathonSignupClosedForNewParticipants(pub.data, false)) {
      setClosedOpen(true);
      return;
    }
    track("profile");
    router.push(
      hackathonEntryPath({
        registered: false,
        profilePath,
        dashboardPath,
      }),
    );
  }, [
    cta.labelKey,
    cta.disabled,
    dashboardPath,
    isSignedIn,
    me.data?.profile.complete,
    me.data?.registered,
    me.waitingForMe,
    launchEvent,
    profilePath,
    router,
    pub.data,
    slug,
  ]);

  const submitHackathonDisabled = useMemo(() => {
    if (!isAccessible(HACKATHON_FEATURE_KEY)) return true;
    if (pub.data?.phase === "ended" && !active) return true;
    if (pub.data?.isFull && !active) return true;
    return false;
  }, [active, isAccessible, pub.data?.isFull, pub.data?.phase]);

  const openSubmitHackathon = useCallback(
    (ctaLocation: HackathonCtaLocation = "hero") => {
      if (submitHackathonDisabled) return;
      const track = (destination: "sign_up" | "profile" | "dashboard") =>
        trackRegisterClick({
          ctaLocation,
          ctaState: "submitHackathon",
          signedIn: Boolean(isSignedIn),
          destination,
        });
      if (!isSignedIn) {
        track("dashboard");
        router.push(`/sign-in?redirect_url=${encodeURIComponent(dashboardPath)}`);
        return;
      }
      if (me.waitingForMe) {
        track("dashboard");
        router.push(dashboardPath);
        return;
      }
      if (isHackathonRegistered(me.data)) {
        track("dashboard");
        router.push(dashboardPath);
        return;
      }
      if (isHackathonSignupClosedForNewParticipants(pub.data, false)) {
        setClosedOpen(true);
        return;
      }
      track("profile");
      router.push(
        hackathonEntryPath({
          registered: false,
          profilePath,
          dashboardPath,
        }),
      );
    },
    [dashboardPath, isSignedIn, me.data, me.waitingForMe, profilePath, pub.data, router, submitHackathonDisabled],
  );

  const onRegisterForLaunchFromClosed = useCallback(() => {
    if (launchEvent) {
      launchEvent.openLaunchRegister();
      return;
    }
    router.push(`${hackathonLandingPath(slug)}?launch=1`);
  }, [launchEvent, router, slug]);

  const value = useMemo(
    () => ({
      openRegister,
      openSubmitHackathon,
      submitHackathonDisabled,
      label: hackathonLandingCtaLabel(cta, pub.data?.landing?.registerCta),
      shortLabel: CTA_SHORT_LABELS[cta.labelKey],
      disabled: cta.disabled || !isAccessible(HACKATHON_FEATURE_KEY),
      hint: cta.hint,
    }),
    [cta, openRegister, openSubmitHackathon, pub.data?.landing?.registerCta, isAccessible, submitHackathonDisabled],
  );

  return (
    <HackathonRegisterContext.Provider value={value}>
      {children}
      <HackathonPreQuizModal open={quizOpen} onOpenChange={setQuizOpen} returnTo={profilePath} />
      <HackathonRegistrationClosedModal
        open={closedOpen}
        onOpenChange={setClosedOpen}
        onRegisterForEvent={onRegisterForLaunchFromClosed}
      />
    </HackathonRegisterContext.Provider>
  );
}

export function useHackathonRegister() {
  const ctx = useContext(HackathonRegisterContext);
  if (!ctx) {
    throw new Error("useHackathonRegister must be used within HackathonRegisterProvider");
  }
  return ctx;
}

export function HackathonRegisterHint({ className }: { className?: string }) {
  const { hint } = useHackathonRegister();
  if (!hint) return null;
  return <p className={className ?? "mt-3 text-sm font-medium text-[#ffc44d]"}>{hint}</p>;
}

export function HackathonRegistrationClosedNote({ className }: { className?: string }) {
  const pub = useHackathonPublic();
  const { isSignedIn } = useAuth();
  const me = useHackathonMe(undefined, { enabled: Boolean(isSignedIn) });
  const { member: hackathonMember, ready: hackathonMemberReady } = useHackathonMember();

  if (!pub.isFetched || !pub.data) return null;
  if (!hackathonMemberReady) return null;
  if (isSignedIn && me.waitingForMe) return null;

  const registered = isHackathonRegistered(me.data);
  const returning = Boolean(hackathonMember);
  if (pub.data.phase === "ended") return null;
  if (registered || returning) return null;
  if (!isHackathonSignupClosedForNewParticipants(pub.data, false)) return null;
  return (
    <p className={className ?? "mb-3 text-xs leading-relaxed text-[#9eb2ca] sm:text-sm"}>
      {REGISTRATION_CLOSED_NOTE}
    </p>
  );
}
