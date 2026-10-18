"use client";

import Image from "next/image";
import { PlayCircle, Rocket, Trophy, UserRound, Users, UsersRound } from "lucide-react";
import { Reveal, Ribbon } from "@/components/hackathon-2026/HackathonMotion";
import { HACKATHON_AGENDA } from "@/lib/hackathon-2026-content";
import { cn } from "@/lib/utils";

const ICONS = { Rocket, Users, UsersRound, PlayCircle, Trophy } as const;

const TONE = {
  blue: { icon: "bg-[#12398a] text-[#7cc4ff]" },
  rose: { icon: "bg-[#4a1737] text-[#ff6b9e]" },
  indigo: { icon: "bg-[#12398a] text-[#7cc4ff]" },
  cyan: { icon: "bg-[#0b3f6e] text-[#3fd0ff]" },
  amber: { icon: "bg-[#4a3410] text-[#ffc233]" },
} as const;

export function HackathonAgenda() {
  return (
    <section id="agenda" className="relative scroll-mt-20 overflow-hidden py-16 sm:py-20">
      <Ribbon variant="b" className="-right-44 top-40 h-[480px] w-[340px] opacity-40 md:-right-40 md:top-24 md:h-[640px] md:w-[520px] md:opacity-70" />

      <div className="relative z-[1] mx-auto w-full max-w-[1360px] px-5">
        <Reveal className="mx-auto mb-12 max-w-[54rem] text-center">
          <h2 className="text-[clamp(2.1rem,4.6vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-white">
            {HACKATHON_AGENDA.titleLead} <span className="hk-grad-text">{HACKATHON_AGENDA.titleAccent}</span>
          </h2>
          <p className="mt-4 text-lg font-medium text-white sm:text-xl">{HACKATHON_AGENDA.lead}</p>
          <p className="mx-auto mt-2 max-w-[44rem] text-[15px] leading-7 text-[#d0dcea] sm:text-base">
            {HACKATHON_AGENDA.copy}
          </p>
        </Reveal>

        <div className="grid items-center gap-14 sm:gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10 xl:gap-12">
          {/* Timeline */}
          <ol className="mx-auto w-full max-w-[820px] space-y-1 lg:max-w-none">
            {HACKATHON_AGENDA.slots.map((slot, index) => {
              const Icon = ICONS[slot.icon];
              const tone = TONE[slot.tone];
              return (
                <Reveal as="li" key={slot.title} delay={index * 90} from="left">
                  <div className="hk-agenda-row grid grid-cols-[44px_1fr] items-start gap-x-4 rounded-2xl border border-transparent px-1 py-3 hover:border-[#1d4268] hover:bg-[#0b1c32]/70 sm:grid-cols-[52px_1fr] sm:items-center sm:gap-5 sm:px-2 sm:py-2.5 lg:grid-cols-[46px_1fr] lg:gap-3.5 xl:grid-cols-[52px_1fr] xl:gap-5">
                    <span className={cn("hk-agenda-icon grid size-11 place-items-center rounded-full sm:size-[52px] lg:size-[46px] xl:size-[52px]", tone.icon)}>
                      <Icon className="size-5 sm:size-6" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold leading-snug text-white sm:text-[17px]">{slot.title}</h3>
                      {/* Slots are title-only today; a body line shows if one is added back. */}
                      {(slot as { body?: string }).body ? (
                        <p className="mt-0.5 text-sm text-[#cfdbe8] sm:text-[15px]">{(slot as { body?: string }).body}</p>
                      ) : null}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </ol>

          {/* Speakers */}
          <div className="relative">
            <Reveal delay={200} from="none" className="mb-12 flex justify-center">
              <div className="hk-hand relative -rotate-6 text-[26px] leading-[1.02] !text-white">
                {HACKATHON_AGENDA.guestsNote[0]}
                <br />
                <span className="pl-4">{HACKATHON_AGENDA.guestsNote[1]}</span>
                <svg className="hk-draw absolute -bottom-11 left-4 h-12 w-12" viewBox="0 0 48 48" fill="none" aria-hidden>
                  <path d="M12 4 C 6 18, 14 34, 34 40" stroke="#2e9bff" strokeWidth="2.2" strokeLinecap="round" style={{ "--hk-len": 50 } as React.CSSProperties} />
                  <path d="M27 33 L35 40 L27 46" stroke="#2e9bff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ "--hk-len": 22 } as React.CSSProperties} />
                </svg>
              </div>
            </Reveal>

            {/* Three chief guests: stacked on phones, one row of three from sm up (beside the agenda from lg) */}
            <div className="mx-auto grid max-w-[300px] grid-cols-1 gap-10 sm:max-w-[960px] sm:grid-cols-3 sm:gap-6 lg:gap-4 xl:gap-5">
              {HACKATHON_AGENDA.guests.map((guest, index) => (
                <Reveal key={guest.name} delay={260 + index * 140} from="up" className="h-full">
                  <SpeakerCard {...guest} index={index} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SpeakerCard({
  name,
  topic,
  subtitle,
  image,
  index = 0,
}: {
  name: string;
  topic: string;
  subtitle?: string;
  image: string | null;
  index?: number;
}) {
  // "Role · Detail, Company" → role line (mono, cyan) + the rest (muted), as on the reel's speaker cards.
  const [role, ...rest] = topic.split(" · ");
  const detail = rest.join(" · ");
  return (
    <article className="hk-spk group relative flex h-full flex-col items-center px-4 pb-5 pt-4 text-center">
      <span className="hk-spk-dots" aria-hidden />
      <div className="relative z-[1] mb-3 flex w-full items-center justify-between">
        <span className="font-[family-name:var(--hk-mono)] text-[11px] uppercase tracking-[0.16em] text-[#5f7a99]">
          SPK·{String(index + 1).padStart(2, "0")}
        </span>
        <span className="hk-live-dot" aria-hidden />
      </div>
      <div className="relative z-[1] size-[132px] rounded-full bg-[linear-gradient(135deg,#2bd2ff,#1677ff)] p-[3px] sm:size-[118px] md:size-[132px] lg:size-[104px] xl:size-[124px]">
        <span className="hk-speaker-ring absolute -inset-[3px] rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
        <div className="relative h-full w-full overflow-hidden rounded-full border-[3px] border-[#071226] bg-[radial-gradient(circle_at_50%_40%,#1d4f9a,#0c2347_70%)]">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="132px"
              // Small pre-cropped files: serve as-is so a swapped photo never shows a stale optimizer copy.
              unoptimized
              className="origin-top object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-start justify-center pt-[9%]">
              <UserRound className="size-[66%] text-[#3a73b5]" strokeWidth={1.2} aria-hidden />
            </div>
          )}
        </div>
      </div>
      <h3 className="relative z-[1] mt-4 text-lg font-bold tracking-[-0.02em] text-white lg:text-base xl:text-[17px]">
        {name}
      </h3>
      <span className="hk-spk-rule" aria-hidden />
      <p className="relative z-[1] font-[family-name:var(--hk-mono)] text-[11px] uppercase leading-snug tracking-[0.08em] text-[#42c4ff] xl:text-xs">
        {role}
      </p>
      {detail ? <p className="relative z-[1] mt-1.5 text-[13px] leading-snug text-[#c3d2e4]">{detail}</p> : null}
      {subtitle ? <p className="relative z-[1] mt-1 text-[13px] leading-5 text-[#9eb2ca]">{subtitle}</p> : null}
    </article>
  );
}
