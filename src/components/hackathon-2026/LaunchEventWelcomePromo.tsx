"use client";

import Image from "next/image";
import { HACKATHON_AGENDA } from "@/lib/hackathon-2026-content";
import { cn } from "@/lib/utils";
import { AmazonGiftIcon, ClaudeBurstIcon } from "./hackathonRewardIcons";

const MNC_BADGES = ["Ex-Tech Mahindra", "Ex-Reliance, Myntra", "Walmart"] as const;

const QA_PRIZES = [
  { kind: "claude" as const, title: "Claude Pro", subtitle: "Subscription" },
  { kind: "voucher" as const, title: "₹2,000 Amazon", subtitle: "Gift voucher" },
];

const mono = { fontFamily: "var(--font-hk-mono), ui-monospace, monospace" };

/** Welcome-step social proof: speakers, MNC badges, live Q&A prizes (matches launch creative). */
export function LaunchEventWelcomePromo({ className }: { className?: string }) {
  const guests = HACKATHON_AGENDA.guests;
  const [left, center, right] = guests;

  return (
    <div
      className={cn("mt-4", className)}
      role="group"
      aria-label="Industry leaders from top companies; live Q&A prizes include Claude Pro and Amazon voucher"
    >
      <div className="flex items-end justify-center">
        {[left, center, right].map((guest, i) => {
          const isCenter = i === 1;
          return (
            <div
              key={guest.name}
              className={cn(
                "relative shrink-0 rounded-full bg-[linear-gradient(135deg,#e8c547_0%,#2bd2ff_45%,#1677ff_100%)] p-[2px]",
                isCenter ? "z-10 -mx-1 size-[4.25rem] sm:size-[4.75rem]" : "z-[1] size-[3.5rem] sm:size-[3.85rem]",
              )}
            >
              <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-[#071426] bg-[#0c2347]">
                {guest.image ? (
                  <Image
                    src={guest.image}
                    alt=""
                    fill
                    sizes={isCenter ? "76px" : "62px"}
                    unoptimized
                    className="object-cover object-top"
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6fc0ff]" style={mono}>
          Top MNCs
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-[#c3d2e4] sm:text-sm">
          {MNC_BADGES.join(" · ")}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-[#c9a227]/50 bg-[linear-gradient(165deg,rgba(12,28,52,0.98)_0%,rgba(6,14,28,0.95)_100%)] p-3 sm:p-3.5">
        <p
          className="text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#e8c96a] sm:text-[11px]"
          style={mono}
        >
          Ask a real question live · Chance to win
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {QA_PRIZES.map((prize) => (
            <div
              key={prize.kind}
              className="flex min-h-[4.5rem] flex-col items-center justify-center rounded-lg border border-[#27547d]/70 bg-[#081a33]/95 px-2 py-2.5 text-center"
            >
              <span className="mb-1.5 grid size-9 place-items-center rounded-md bg-[#f4f0ea] ring-1 ring-white/10">
                {prize.kind === "claude" ? (
                  <ClaudeBurstIcon className="size-6" />
                ) : (
                  <AmazonGiftIcon className="h-5 w-auto" />
                )}
              </span>
              <span className="text-[13px] font-bold leading-tight text-white sm:text-sm">{prize.title}</span>
              <span
                className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#c9a227] sm:text-[10px]"
                style={mono}
              >
                {prize.subtitle}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
