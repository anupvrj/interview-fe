"use client";

import { Calendar, Video } from "lucide-react";
import { LAUNCH_EVENT_FORM, HACKATHON_LAUNCH } from "@/lib/hackathon-2026-content";
import { CTA_LABELS } from "@/features/hackathon/copy";
import { useHackathonLaunchEvent } from "./HackathonLaunchEventContext";
import { Reveal } from "./HackathonMotion";

export function HackathonLaunchTeaser() {
  const { openLaunchRegister } = useHackathonLaunchEvent();
  const c = LAUNCH_EVENT_FORM;

  return (
    <section id="launch" className="relative scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-[1360px] px-5">
        <Reveal className="mx-auto max-w-[40rem] text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6fc0ff]">{HACKATHON_LAUNCH.summaryLabel}</p>
          <h2 className="mt-3 text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-tight tracking-[-0.03em] text-white">
            {c.teaserTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-[#cfdbe8] sm:text-base">{c.teaserBody}</p>
          <p className="mt-4 inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-[#9eb2ca]">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-4 text-[#6fc0ff]" aria-hidden />
              {HACKATHON_LAUNCH.dateLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Video className="size-4 text-[#6fc0ff]" aria-hidden />
              {HACKATHON_LAUNCH.timeLabel} · {HACKATHON_LAUNCH.formatLabel}
            </span>
          </p>
        </Reveal>

        <Reveal delay={120} className="mx-auto mt-8 flex w-full max-w-[40rem] justify-center px-1 sm:px-0">
          <button
            type="button"
            onClick={openLaunchRegister}
            className="hk-btn h-12 w-full max-w-[20rem] rounded-2xl px-8 text-sm font-semibold sm:min-w-[17.5rem] sm:w-auto"
          >
            {CTA_LABELS.registerForEvent}
          </button>
        </Reveal>
      </div>
    </section>
  );
}
