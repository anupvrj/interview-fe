"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { HackathonRegisterProvider, useHackathonRegister } from "@/components/hackathon-2026/HackathonRegisterContext";
import { HackathonSlugProvider, useHackathonFeature, useHackathonMe, useHackathonPublic } from "@/features/hackathon/hooks";
import { isHackathonRegistered } from "@/features/hackathon/hackathonRegistration";
import { trackEvent } from "@/lib/analytics/gtag";
import { sitePopupsApi, SITE_POPUPS_QUERY_KEY } from "./api";
// Loaded only when a popup opens, so pages without one never download the designs or their fonts.
const PopupView = dynamic(() => import("./PopupView").then((m) => m.PopupView), { ssr: false });
import {
  isInternalHref,
  isModalDesign,
  isSafeExternalHref,
  isWithinSchedule,
  isPopupSnoozed,
  popupMatchesAudience,
  popupMatchesDevice,
  popupMatchesPage,
  popupNeedsHackathon,
  snoozePopup,
} from "./rules";
import type { PopupCta, PublicSitePopup } from "./types";

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

/**
 * Global promo popups managed in Super Admin → Site Popups.
 * Picks the highest-priority popup that targets this page, waits for its trigger
 * (time on page, scroll depth or exit intent) and remembers a close per browser.
 */
export function SitePopupHost() {
  const pathname = usePathname() ?? "/";
  const { isLoaded, isSignedIn } = useAuth();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  /** Popups ruled out for this visit (e.g. already registered). */
  const [skipped, setSkipped] = useState<Set<string>>(() => new Set());
  /** One popup per page view: after a close/click nothing else opens on this path. */
  const [doneOnPath, setDoneOnPath] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  const query = useQuery({
    queryKey: SITE_POPUPS_QUERY_KEY,
    queryFn: sitePopupsApi.listActive,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    // Root-layout query lives for the whole visit: pick up switched-on / switched-off popups.
    refetchInterval: 5 * 60_000,
    retry: false,
    enabled: mounted,
  });

  const popup = useMemo(() => {
    if (!mounted || !isLoaded) return null;
    return (
      (query.data ?? []).find(
        (p) =>
          !skipped.has(p._id) &&
          isWithinSchedule(p.schedule) &&
          (!popupNeedsHackathon(p) || Boolean(p.targeting.hackathonSlug)) &&
          popupMatchesPage(p, pathname) &&
          popupMatchesAudience(p, Boolean(isSignedIn)) &&
          popupMatchesDevice(p, isMobile) &&
          !isPopupSnoozed(p._id),
      ) ?? null
    );
  }, [skipped, isLoaded, isMobile, isSignedIn, mounted, pathname, query.data]);

  const skip = useCallback((id: string) => {
    setSkipped((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);
  const markDone = useCallback(() => setDoneOnPath(pathname), [pathname]);

  if (!popup || doneOnPath === pathname) return null;

  if (popupNeedsHackathon(popup)) {
    return (
      <HackathonSlugProvider slug={popup.targeting.hackathonSlug}>
        <HackathonRegisterProvider>
          <HackathonPopup key={`${popup._id}:${pathname}`} popup={popup} signedIn={Boolean(isSignedIn)} onSkip={skip} onDone={markDone} />
        </HackathonRegisterProvider>
      </HackathonSlugProvider>
    );
  }

  const target = popup.countdown.mode === "custom" ? popup.countdown.target : null;
  return (
    <TriggeredPopup
      key={`${popup._id}:${pathname}`}
      popup={popup}
      countdownTarget={target}
      countdownLabel={popup.content.countdownLabel || "Ends in"}
      onDone={markDone}
    />
  );
}

/** Hackathon popups: only for people who can still register; wires the register button. */
function HackathonPopup({
  popup,
  signedIn,
  onSkip,
  onDone,
}: Readonly<{ popup: PublicSitePopup; signedIn: boolean; onSkip: (id: string) => void; onDone: (id: string) => void }>) {
  const feature = useHackathonFeature();
  const pub = useHackathonPublic();
  const me = useHackathonMe(undefined, { enabled: signedIn && popup.targeting.hideIfRegistered });
  const { openRegister } = useHackathonRegister();

  const event = pub.data;
  const registers =
    popup.primaryCta.action === "hackathon_register" ||
    (popup.secondaryCta.enabled && popup.secondaryCta.action === "hackathon_register");
  const checkRegistration = popup.targeting.hideIfRegistered && signedIn;
  // Hackathon switched off for this visitor → rule out now (its queries never run, so never "wait" on them).
  const blocked = !feature.isLoading && !feature.accessible;
  const waiting =
    !blocked &&
    (feature.isLoading || (!event && !pub.isError) || (checkRegistration && me.waitingForMe));
  const ineligible =
    !waiting &&
    (blocked ||
      !event ||
      (registers && (event.phase === "ended" || event.isFull)) ||
      (checkRegistration && isHackathonRegistered(me.data)));

  useEffect(() => {
    if (ineligible) onSkip(popup._id);
  }, [ineligible, onSkip, popup._id]);

  if (waiting || ineligible || !event) return null;

  const mode = popup.countdown.mode;
  const toStart = mode === "hackathon_start" || (mode === "hackathon_auto" && event.phase === "upcoming");
  let target: string | null = null;
  if (mode === "custom") target = popup.countdown.target;
  else if (mode.startsWith("hackathon")) target = toStart ? event.startsAt : event.endsAt;
  const label = popup.content.countdownLabel || (toStart ? "Hackathon starts in" : "Submissions close in");

  return (
    <TriggeredPopup
      popup={popup}
      countdownTarget={target}
      countdownLabel={label}
      clockOffsetMs={new Date(event.serverNow).getTime() - (pub.dataUpdatedAt || Date.now())}
      onRegister={() => openRegister("popup")}
      onDone={onDone}
    />
  );
}

function TriggeredPopup({
  popup,
  countdownTarget,
  countdownLabel,
  clockOffsetMs,
  onRegister,
  onDone,
}: Readonly<{
  popup: PublicSitePopup;
  countdownTarget: string | null;
  countdownLabel: string;
  clockOffsetMs?: number;
  onRegister?: () => void;
  onDone: (id: string) => void;
}>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const firedRef = useRef(false);

  // ---- triggers: time on page · scroll depth · exit intent (whichever comes first)
  useEffect(() => {
    const { delaySeconds, scrollPercent, exitIntent } = popup.trigger;
    const cleanups: Array<() => void> = [];
    const fire = (reason: string) => {
      if (firedRef.current) return;
      firedRef.current = true;
      cleanups.forEach((fn) => fn());
      setOpen(true);
      trackEvent("site_popup_view", { popup_id: popup._id, design: popup.design, trigger: reason });
    };

    if (delaySeconds <= 0 && scrollPercent <= 0 && !exitIntent) {
      fire("immediate");
      return;
    }
    if (delaySeconds > 0) {
      const id = window.setTimeout(() => fire("time"), delaySeconds * 1000);
      cleanups.push(() => window.clearTimeout(id));
    }
    if (scrollPercent > 0) {
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        // Short pages can't be scrolled: the visitor already sees all of it.
        if (max <= 40 || window.scrollY / max >= scrollPercent / 100) fire("scroll");
      };
      // Check once now too (restored scroll position, short pages), after layout settles.
      const settle = window.setTimeout(onScroll, 600);
      cleanups.push(() => window.clearTimeout(settle));
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", onScroll));
    }
    if (exitIntent) {
      // Desktop: cursor leaves through the top of the window (towards tabs / back button).
      const onMouseOut = (event: MouseEvent) => {
        if (!event.relatedTarget && event.clientY <= 8) fire("exit_intent");
      };
      document.addEventListener("mouseout", onMouseOut);
      cleanups.push(() => document.removeEventListener("mouseout", onMouseOut));
      // Phones: a fast flick back up after reading part of the page.
      let lastY = window.scrollY;
      let lastT = performance.now();
      let deepest = 0;
      const onTouchScroll = () => {
        const y = window.scrollY;
        const t = performance.now();
        deepest = Math.max(deepest, y);
        const speed = (lastY - y) / Math.max(1, t - lastT); // px/ms, positive = upwards
        if (deepest > window.innerHeight * 0.8 && speed > 1.2 && lastY - y > 60) fire("exit_intent");
        lastY = y;
        lastT = t;
      };
      if (window.matchMedia("(pointer: coarse)").matches) {
        window.addEventListener("scroll", onTouchScroll, { passive: true });
        cleanups.push(() => window.removeEventListener("scroll", onTouchScroll));
      }
    }
    return () => cleanups.forEach((fn) => fn());
  }, [popup._id, popup.design, popup.trigger]);

  // ---- lock page scroll behind modal designs
  useEffect(() => {
    if (!open || !isModalDesign(popup.design)) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [open, popup.design]);

  const close = useCallback(() => {
    setOpen(false);
    snoozePopup(popup._id, popup.frequency.dismissCooldownHours);
    trackEvent("site_popup_close", { popup_id: popup._id, design: popup.design });
    onDone(popup._id);
  }, [onDone, popup._id, popup.design, popup.frequency.dismissCooldownHours]);

  const follow = (cta: PopupCta) => {
    if (cta.action === "hackathon_register") {
      onRegister?.();
      return;
    }
    if (!cta.url) return;
    const internal = isInternalHref(cta.url);
    if (!internal && !isSafeExternalHref(cta.url)) return;
    if (cta.newTab) {
      window.open(cta.url, "_blank", "noopener,noreferrer");
    } else if (internal) {
      router.push(cta.url);
    } else {
      window.location.assign(cta.url);
    }
  };

  const onCta = (which: "primary" | "secondary") => {
    const cta = which === "primary" ? popup.primaryCta : popup.secondaryCta;
    setOpen(false);
    snoozePopup(popup._id, which === "primary" ? popup.frequency.clickCooldownHours : popup.frequency.dismissCooldownHours);
    trackEvent("site_popup_click", { popup_id: popup._id, design: popup.design, button: which, action: cta.action });
    onDone(popup._id);
    follow(cta);
  };

  if (!open) return null;
  return (
    <PopupView
      popup={popup}
      countdownTarget={countdownTarget}
      countdownLabel={countdownLabel}
      clockOffsetMs={clockOffsetMs}
      onClose={close}
      onCta={onCta}
    />
  );
}
