"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { HK_EVENTS, markHackathonEngaged, trackHackathon, trackHackathonOnce } from "@/features/hackathon/analytics";

/** Section element id → stable GA value. The hero has no id; it is the first <section> in <main>. */
const SECTIONS: Record<string, string> = {
  prizes: "prizes",
  participate: "how_it_works",
  timeline: "timeline",
  agenda: "schedule",
  who: "eligibility",
  faq: "faq",
  register: "final_cta",
};
const SCROLL_MILESTONES = [25, 50, 75, 90] as const;
const ENGAGED_AFTER_MS = 15_000;

/** Landing-page funnel signals: page view, sections seen, scroll depth, engagement. */
export function HackathonLandingAnalytics() {
  const { isLoaded, isSignedIn } = useAuth();
  const pageViewSent = useRef(false);

  useEffect(() => {
    if (!isLoaded || pageViewSent.current) return;
    pageViewSent.current = true;
    trackHackathon(HK_EVENTS.pageView, {
      page_type: "hackathon_landing",
      auth_state: isSignedIn ? "signed_in" : "signed_out",
    });
  }, [isLoaded, isSignedIn]);

  // Sections: counted once a quarter of the section is visible, or it fills 40% of the screen (tall sections).
  useEffect(() => {
    const main = document.querySelector(".hk-root main");
    if (!main || typeof IntersectionObserver === "undefined") return;
    const targets = Array.from(main.querySelectorAll<HTMLElement>(":scope > section, section[id]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const viewport = entry.rootBounds?.height ?? window.innerHeight;
          if (entry.intersectionRatio < 0.25 && entry.intersectionRect.height < viewport * 0.4) continue;
          const el = entry.target as HTMLElement;
          const section = el.id ? SECTIONS[el.id] : el === targets[0] ? "hero" : undefined;
          if (!section) continue;
          trackHackathonOnce(`section:${section}`, HK_EVENTS.sectionView, { section });
          observer.unobserve(el);
        }
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Scroll depth milestones + 50% engagement rule.
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const percent = Math.round((window.scrollY / scrollable) * 100);
      for (const milestone of SCROLL_MILESTONES) {
        if (percent >= milestone) {
          trackHackathonOnce(`scroll:${milestone}`, HK_EVENTS.scrollDepth, { percent: milestone });
        }
      }
      if (percent >= 50) markHackathonEngaged("scroll_50");
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  // 15s of visible time.
  useEffect(() => {
    let visibleMs = 0;
    let since = document.visibilityState === "visible" ? Date.now() : null;
    const tick = window.setInterval(() => {
      if (since !== null) {
        visibleMs += Date.now() - since;
        since = Date.now();
      }
      if (visibleMs >= ENGAGED_AFTER_MS) {
        markHackathonEngaged("time_15s");
        window.clearInterval(tick);
      }
    }, 1000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        since = Date.now();
      } else if (since !== null) {
        visibleMs += Date.now() - since;
        since = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
