"use client";

import "@/components/hackathon-2026/hackathon.css";
import Link from "next/link";
import { SignedIn } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import { ProfileMenu } from "@/components/app/ProfileMenu";
import { HackathonBrand } from "@/components/hackathon-2026/HackathonBrand";
import { Ribbon } from "@/components/hackathon-2026/HackathonMotion";
import { hackathonDashboardPath, hackathonLandingPath } from "../config";
import { useHackathonSlug } from "../hooks";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href?: string; active?: boolean };

export function HackathonShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const slug = useHackathonSlug();
  const landingPath = hackathonLandingPath(slug);
  // Leaderboard and Resources have no pages yet, so they render as disabled "Soon" items.
  const nav: NavItem[] = [
    { label: "Hackathon", href: landingPath },
    { label: "Challenges", href: hackathonDashboardPath(slug), active: true },
    { label: "Leaderboard" },
    { label: "Resources" },
  ];

  return (
    <div className="hk-root min-h-screen antialiased">
      <div className="hk-aurora" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      {/* Page-edge ribbons, as on the event landing page */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <Ribbon variant="b" slow className="-left-56 top-[28rem] h-[620px] w-[480px] -scale-x-100 opacity-40" />
        <Ribbon variant="b" className="-right-56 top-[56rem] h-[620px] w-[480px] opacity-40" />
      </div>

      <header className="sticky top-0 z-30 border-b border-[#1b3c62]/70 bg-[#040b17]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] w-full max-w-[1460px] items-center justify-between gap-4 px-4 sm:h-[4.75rem] sm:px-6">
          <div className="flex min-w-0 items-center gap-10">
            <Link href={landingPath} aria-label="InterviewTrix Hackathon home" className="shrink-0">
              <HackathonBrand size="md" iconOnlyOnMobile />
            </Link>
            <nav className="hidden items-center gap-8 lg:flex" aria-label="Hackathon">
              {nav.map((item) =>
                item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-current={item.active ? "page" : undefined}
                    data-active={item.active}
                    className={cn(
                      "hk-nav-link py-2 text-[15px] font-medium transition-colors",
                      item.active ? "text-[#3aa6ff]" : "text-white hover:text-[#6fc0ff]",
                    )}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    key={item.label}
                    aria-disabled="true"
                    title="Coming soon"
                    className="inline-flex cursor-not-allowed items-center gap-1.5 py-2 text-[15px] font-medium text-[#8fa6c0]"
                  >
                    {item.label}
                    <span className="rounded-full border border-white/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-[0.12em] text-[#8fa6c0]">
                      Soon
                    </span>
                  </span>
                ),
              )}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <Link
              href={landingPath}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#2f64a8] bg-[#0a1b36]/70 px-3 text-sm font-medium text-white transition-colors hover:border-[#4f96ec] hover:bg-[#0f2a52] sm:px-4"
            >
              <ArrowLeft className="size-4" aria-hidden />
              <span className="hidden sm:inline">Event page</span>
            </Link>
            <SignedIn>
              <ProfileMenu avatarClassName="ring-[#7c5cff]/60" />
            </SignedIn>
          </div>
        </div>

        {/* Mobile tab row */}
        <nav className="flex gap-1 overflow-x-auto border-t border-[#1b3c62]/60 px-3 lg:hidden" aria-label="Hackathon mobile">
          {nav.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "relative shrink-0 px-3 py-2.5 text-sm font-medium",
                  item.active
                    ? "text-[#3aa6ff] after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-[#1677ff] after:to-[#2bd2ff]"
                    : "text-white",
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span key={item.label} aria-disabled="true" className="shrink-0 px-3 py-2.5 text-sm font-medium text-[#6f86a1]">
                {item.label}
                <span className="ml-1 text-[9px] font-bold uppercase tracking-[0.1em]">Soon</span>
              </span>
            ),
          )}
        </nav>
      </header>

      <main className="relative z-[1] mx-auto w-full max-w-[1460px] px-4 pb-24 pt-5 sm:px-6 sm:pt-8">
        {children}
      </main>
    </div>
  );
}
