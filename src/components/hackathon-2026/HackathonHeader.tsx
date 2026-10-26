"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Menu, X } from "lucide-react";
import { HackathonBrand } from "@/components/hackathon-2026/HackathonBrand";
import { HackathonRegisterButton } from "@/components/hackathon-2026/HackathonRegisterButton";
import { SectionLink } from "@/components/hackathon-2026/HackathonMotion";
import { HackathonSubmissionExtendedMeta } from "@/components/hackathon-2026/HackathonSubmissionExtendedMeta";
import { useLandingChallengeWindow } from "@/components/hackathon-2026/useLandingChallengeWindow";
import { HACKATHON_2026_PATH, HACKATHON_LAUNCH, HACKATHON_NAV } from "@/lib/hackathon-2026-content";
import { cn } from "@/lib/utils";

export function HackathonHeader() {
  const challenge = useLandingChallengeWindow();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    // Release the scroll lock synchronously so a nav click can scroll straight away.
    document.body.style.overflow = "";
    setOpen(false);
  }, []);

  // Scroll-spy for nav underline
  useEffect(() => {
    const sections = HACKATHON_NAV.map((item) =>
      document.querySelector<HTMLElement>(item.href),
    ).filter((node): node is HTMLElement => Boolean(node));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Drawer: lock page scroll, close on Escape / desktop resize, manage focus
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => desktop.matches && closeMenu();
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
      menuButtonRef.current?.focus({ preventScroll: true });
    };
  }, [open, closeMenu]);

  return (
    <>
      <header
        ref={headerRef}
        // One height, solid background, nothing tied to scrolling: a header that shrank and
        // blurred on scroll made the page jump and flicker in Instagram's in-app browser.
        className="sticky top-0 z-40 border-b border-[rgba(47,92,140,0.4)] bg-[#040b17]"
      >
        <div
          className={cn(
            "mx-auto grid h-16 w-full max-w-[1360px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:h-[4.5rem] sm:px-5 lg:flex lg:justify-between lg:gap-4",
          )}
        >
          {/* Mobile: hamburger (left) */}
          <div className="flex justify-start lg:hidden">
            <button
              ref={menuButtonRef}
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-[#244a72] text-white transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="hk-mobile-menu"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
          </div>

          {/* Logo: centered on mobile, left on desktop */}
          <Link
            href={HACKATHON_2026_PATH}
            className="shrink-0 justify-self-center"
            aria-label="Hackathon home"
            onClick={(event) => {
              if (window.location.pathname === HACKATHON_2026_PATH) {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <HackathonBrand size="sm" priority className="sm:hidden" />
            <HackathonBrand size="md" priority className="hidden sm:inline-flex" />
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium text-[#dbe6f3] xl:gap-7 lg:flex" aria-label="Hackathon">
            {HACKATHON_NAV.map((item) => (
              <SectionLink
                key={item.href}
                href={item.href}
                data-active={active === item.href}
                className="hk-nav-link transition-colors duration-200 hover:text-white data-[active=true]:text-white"
              >
                {item.label}
              </SectionLink>
            ))}
          </nav>

          {/* Register (right) */}
          <div className="flex justify-end">
            <HackathonRegisterButton
              ctaLocation="header"
              size="sm"
              compact
              // Short label + no arrow on phones so both header columns fit and the logo sits dead-centre
              className="min-h-10 px-3.5 text-[13px] sm:min-h-11 sm:px-5 sm:text-[15px] [&_.hk-btn-arrow]:hidden sm:[&_.hk-btn-arrow]:block"
            />
          </div>
        </div>

      </header>

      {/* Mobile drawer — sibling of <header> so backdrop-filter can't trap position:fixed */}
      <div
        className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}
        aria-hidden={!open}
      >
        <div
          onClick={closeMenu}
          className={cn(
            "absolute inset-0 bg-[#020711]/70 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          id="hk-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Hackathon menu"
          inert={!open}
          className={cn(
            "absolute inset-y-0 left-0 flex w-[84%] max-w-[340px] flex-col border-r border-[#1b3c62] bg-[#061225] shadow-[24px_0_60px_rgba(0,0,0,0.5)] transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-[4.5rem] items-center justify-between border-b border-[#132c48] px-5">
            <Link
              href={HACKATHON_2026_PATH}
              aria-label="Hackathon home"
              onClick={(event) => {
                closeMenu();
                if (window.location.pathname === HACKATHON_2026_PATH) {
                  event.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              <HackathonBrand size="sm" />
            </Link>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeMenu}
              className="inline-flex size-10 items-center justify-center rounded-xl border border-[#244a72] text-white transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 p-4" aria-label="Hackathon mobile">
            {HACKATHON_NAV.map((item, index) => (
              <SectionLink
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                data-active={active === item.href}
                style={{ transitionDelay: open ? `${90 + index * 50}ms` : "0ms" }}
                className={cn(
                  "group flex items-center justify-between rounded-xl px-4 py-3.5 text-[15px] font-semibold text-[#c3d3e4] transition-[opacity,transform,background-color,color] duration-300 hover:bg-white/5 hover:text-white data-[active=true]:bg-[#0b2748] data-[active=true]:text-white",
                  open ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0",
                )}
              >
                {item.label}
                <ChevronRight className="size-4 text-[#4f8fd0] transition-transform duration-300" aria-hidden />
              </SectionLink>
            ))}
          </nav>

          <div className="mt-auto border-t border-[#132c48] p-5">
            <p className="mb-3 text-xs text-[#7f98b3]">
              <HackathonSubmissionExtendedMeta challenge={challenge} /> · Launch {HACKATHON_LAUNCH.dateLabel}
            </p>
            <HackathonRegisterButton ctaLocation="mobile_menu" className="w-full" onClick={closeMenu} />
          </div>
        </aside>
      </div>
    </>
  );
}
