"use client";

import Link from "next/link";
import { useAdoptHackathonDarkTheme } from "@/components/dashboard-theme";
import { HackathonBrand } from "@/components/hackathon-2026/HackathonBrand";
import { HackathonLaunchEventForm } from "@/components/hackathon-2026/HackathonLaunchEventForm";
import { HackathonFeatureGate } from "@/features/hackathon/components/HackathonFeatureGate";
import { HACKATHON_LANDING_PATH, HACKATHON_SLUG } from "@/features/hackathon/config";
import { HackathonSlugProvider } from "@/features/hackathon/hooks";
import { LAUNCH_EVENT_FORM } from "@/lib/hackathon-2026-content";
import "./hackathon.css";
import "./hackathon-reel.css";
import "@/features/hackathon/components/hackathon-dashboard-reel.css";

export function EventRegistrationPage() {
  useAdoptHackathonDarkTheme();

  return (
    <HackathonSlugProvider slug={HACKATHON_SLUG}>
      <HackathonFeatureGate showWhileLoading backHref={HACKATHON_LANDING_PATH} backLabel="Back to Hiring Games">
        {/* Static layout for Instagram in-app browser (see .hk-static on full hackathon landing). */}
        <div className="hk-root hk-static min-h-[100dvh] antialiased">
          <header className="border-b border-[#1b3c62]/80 bg-[#040b17]/95 px-4 py-3">
            <div className="mx-auto flex max-w-lg justify-center">
              <Link href="/" className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3aa6ff]/50" aria-label="InterviewTrix home">
                <HackathonBrand size="sm" priority />
              </Link>
            </div>
          </header>

          <main className="mx-auto w-full max-w-lg px-4 py-6 sm:px-6 sm:py-8">
            <p className="sr-only">{LAUNCH_EVENT_FORM.subtitle}</p>
            <div
              className="overflow-visible rounded-2xl border border-[#27547d]/90 bg-[#071426] shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              id="launch-form"
            >
              <HackathonLaunchEventForm showStepChrome embeddedInPage className="pb-2" />
            </div>
            <p className="mt-6 text-center text-xs leading-relaxed text-[#7189a6]">
              Free online event · same registration as the Hiring Games page.{" "}
              <Link href={HACKATHON_LANDING_PATH} className="font-semibold text-[#6fc0ff] hover:underline">
                Learn more
              </Link>
            </p>
          </main>
        </div>
      </HackathonFeatureGate>
    </HackathonSlugProvider>
  );
}
