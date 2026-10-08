"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { hackathonDashboardPath, hackathonProfilePath, HACKATHON_FEATURE_KEY } from "@/features/hackathon/config";
import { usePlatformFeatures } from "@/hooks/usePlatformFeatures";
import { CTA_LABELS, CTA_SHORT_LABELS } from "@/features/hackathon/copy";
import { useHackathonMe, useHackathonPublic, useHackathonSlug } from "@/features/hackathon/hooks";
import type { HackathonPublic } from "@/features/hackathon/api";

type CtaKey = keyof typeof CTA_LABELS;

type HackathonRegisterContextValue = {
  openRegister: () => void;
  label: string;
  /** Compact form of `label` for tight layouts. */
  shortLabel: string;
  disabled: boolean;
  hint: string | null;
};

const HackathonRegisterContext = createContext<HackathonRegisterContextValue | null>(null);

function ctaFromPublic(pub: HackathonPublic | undefined, isSignedIn: boolean): {
  label: CtaKey;
  disabled: boolean;
  hint: string | null;
} {
  const hint =
    pub && pub.spotsLeft !== null && pub.spotsLeft > 0 && pub.spotsLeft < 20
      ? `Only ${pub.spotsLeft} spot${pub.spotsLeft === 1 ? "" : "s"} left`
      : null;
  if (!pub) {
    return {
      label: isSignedIn ? "goToChallenges" : "register",
      disabled: false,
      hint: null,
    };
  }
  if (pub.phase === "ended") {
    return {
      label: isSignedIn ? "seeResults" : "ended",
      disabled: !isSignedIn,
      hint: null,
    };
  }
  if (pub.isFull) {
    return {
      label: isSignedIn ? "goToChallenges" : "full",
      disabled: !isSignedIn,
      hint: null,
    };
  }
  if (isSignedIn) {
    return {
      label: pub.phase === "live" ? "goToChallenges" : "getReady",
      disabled: false,
      hint,
    };
  }
  return { label: "register", disabled: false, hint };
}

export function HackathonRegisterProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const slug = useHackathonSlug();
  const profilePath = hackathonProfilePath(slug);
  const dashboardPath = hackathonDashboardPath(slug);
  const pub = useHackathonPublic();
  const me = useHackathonMe(undefined, { enabled: Boolean(isSignedIn) });
  const { isAccessible } = usePlatformFeatures();
  const derived = ctaFromPublic(pub.data, Boolean(isSignedIn));

  const openRegister = useCallback(() => {
    if (derived.disabled) return;
    if (!isSignedIn) {
      router.push(`/sign-up?redirect_url=${encodeURIComponent(profilePath)}`);
      return;
    }
    // Profile page auto-skips when the account already has hackathon fields; dashboard if API says complete.
    if (me.waitingForMe) {
      router.push(profilePath);
      return;
    }
    router.push(me.data?.profile.complete ? dashboardPath : profilePath);
  }, [
    derived.disabled,
    dashboardPath,
    isSignedIn,
    me.data?.profile.complete,
    me.waitingForMe,
    profilePath,
    router,
  ]);

  const value = useMemo(
    () => ({
      openRegister,
      label: CTA_LABELS[derived.label],
      shortLabel: CTA_SHORT_LABELS[derived.label],
      disabled: derived.disabled || !isAccessible(HACKATHON_FEATURE_KEY),
      hint: derived.hint,
    }),
    [derived.disabled, derived.hint, derived.label, isAccessible, openRegister],
  );

  return (
    <HackathonRegisterContext.Provider value={value}>{children}</HackathonRegisterContext.Provider>
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
