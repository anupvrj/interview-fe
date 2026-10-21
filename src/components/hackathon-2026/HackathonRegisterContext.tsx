"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { HackathonPreQuizModal } from "@/features/hackathon/components/HackathonPreQuizModal";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { hackathonDashboardPath, hackathonProfilePath, HACKATHON_FEATURE_KEY } from "@/features/hackathon/config";
import { usePlatformFeatures } from "@/hooks/usePlatformFeatures";
import { CTA_SHORT_LABELS } from "@/features/hackathon/copy";
import { useHackathonMe, useHackathonPublic, useHackathonSlug } from "@/features/hackathon/hooks";
import {
  hackathonLandingCtaLabel,
  resolveHackathonLandingCta,
} from "@/features/hackathon/hackathonLandingCta";
import { hackathonEntryPath } from "@/features/hackathon/hackathonEntry";
import { isHackathonRegistered } from "@/features/hackathon/hackathonRegistration";
import { useMarkHackathonMember } from "@/features/hackathon/returningMember";
import { trackRegisterClick, type HackathonCtaLocation } from "@/features/hackathon/analytics";

type HackathonRegisterContextValue = {
  openRegister: (ctaLocation?: HackathonCtaLocation) => void;
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
  const derived = resolveHackathonLandingCta(pub.data, Boolean(isSignedIn), registered);
  const [quizOpen, setQuizOpen] = useState(false);
  useMarkHackathonMember(slug, isSignedIn, registered);

  const openRegister = useCallback((ctaLocation: HackathonCtaLocation = "other") => {
    if (derived.disabled) return;
    const track = (destination: "sign_up" | "profile" | "dashboard") =>
      trackRegisterClick({ ctaLocation, ctaState: derived.labelKey, signedIn: Boolean(isSignedIn), destination });
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
    track("profile");
    router.push(
      hackathonEntryPath({
        registered: false,
        profilePath,
        dashboardPath,
      }),
    );
  }, [
    derived.disabled,
    derived.labelKey,
    dashboardPath,
    isSignedIn,
    me.data?.profile.complete,
    me.data?.registered,
    me.waitingForMe,
    profilePath,
    router,
  ]);

  const value = useMemo(
    () => ({
      openRegister,
      label: hackathonLandingCtaLabel(derived, pub.data?.landing?.registerCta),
      shortLabel: CTA_SHORT_LABELS[derived.labelKey],
      disabled: derived.disabled || !isAccessible(HACKATHON_FEATURE_KEY),
      hint: derived.hint,
    }),
    [
      derived,
      pub.data?.landing?.registerCta,
      derived.disabled,
      derived.hint,
      derived.labelKey,
      isAccessible,
      openRegister,
    ],
  );

  return (
    <HackathonRegisterContext.Provider value={value}>
      {children}
      <HackathonPreQuizModal open={quizOpen} onOpenChange={setQuizOpen} returnTo={profilePath} />
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
