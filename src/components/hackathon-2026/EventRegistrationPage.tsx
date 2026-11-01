"use client";

import Link from "next/link";
import { useAdoptHackathonDarkTheme } from "@/components/dashboard-theme";
import { HackathonBrand } from "@/components/hackathon-2026/HackathonBrand";
import { LAUNCH_EVENT_FORM } from "@/lib/hackathon-2026-content";
import "./hackathon.css";
import "./hackathon-reel.css";
import "@/features/hackathon/components/hackathon-dashboard-reel.css";

const LAUNCH_VIDEO_ID = "3zw7NrCmx8Y";

export function EventRegistrationPage() {
  useAdoptHackathonDarkTheme();

  return (
    <div className="hk-root hk-static min-h-[100dvh] antialiased">
      <header className="border-b border-[#1b3c62]/80 bg-[#040b17]/95 px-4 py-3">
        <div className="mx-auto flex max-w-3xl justify-center">
          <Link href="/" className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3aa6ff]/50" aria-label="InterviewTrix home">
            <HackathonBrand size="sm" priority />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#6fc0ff]">
          {LAUNCH_EVENT_FORM.title}
        </p>
        <h1 className="hk-launch-title mt-3 text-center text-white">
          <span className="block">The launch was</span>
          <span className="block">completed successfully</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-[#c5d4e6] sm:text-base">
          Thank you for joining. Watch the live stream from the launch below.
        </p>
        <div
          className="mt-8 overflow-hidden rounded-2xl border border-[#27547d]/90 bg-black shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
          id="launch-video"
        >
          <div className="aspect-video">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${LAUNCH_VIDEO_ID}`}
              title="InterviewTrix product launch live stream"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-[#7189a6]">
          <a
            href={`https://www.youtube.com/watch?v=${LAUNCH_VIDEO_ID}`}
            className="font-semibold text-[#6fc0ff] hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Watch on YouTube
          </a>
        </p>
      </main>
    </div>
  );
}
