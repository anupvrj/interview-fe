"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Reveal } from "@/components/hackathon-2026/HackathonMotion";
import { HACKATHON_FAQ } from "@/lib/hackathon-2026-content";
import { cn } from "@/lib/utils";

export function HackathonFaq() {
  const [open, setOpen] = useState<number | null>(0);
  // Deterministic ids: this app's useId() prefix differs between server and client (hydration mismatch)
  const baseId = "hk-faq";

  return (
    <section id="faq" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-[820px] px-5">
        <Reveal className="mb-10 text-center">
          <p className="hk-eyebrow">FAQ</p>
          <h2 className="mt-2 text-[clamp(1.75rem,3.6vw,2.5rem)] font-extrabold tracking-[-0.04em] text-white">
            Questions, <span className="hk-grad-text">answered</span>
          </h2>
        </Reveal>

        <div className="space-y-3">
          {HACKATHON_FAQ.map((item, index) => {
            const isOpen = open === index;
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;
            return (
              <Reveal key={item.question} delay={index * 70}>
                <div
                  className={cn(
                    "rounded-2xl border bg-[#091a2e]/80 transition-[border-color,background-color,box-shadow] duration-300",
                    isOpen
                      ? "border-[#2a7fd4]/70 bg-[#0b1f38] shadow-[0_16px_40px_rgba(0,30,80,0.35)]"
                      : "border-[#193b5f] hover:border-[#24507e]",
                  )}
                >
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpen(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-[18px] text-left text-[15px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 rounded-2xl"
                    >
                      {item.question}
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-full border transition-[transform,background-color,border-color] duration-300",
                          isOpen
                            ? "rotate-45 border-[#2a7fd4] bg-[#1677ff] text-white"
                            : "border-[#24507e] text-[#45c5ff]",
                        )}
                      >
                        <Plus className="size-4" aria-hidden />
                      </span>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={cn(
                      "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <p className="px-5 pb-5 text-[15px] leading-7 text-[#cfdbe8]">{item.answer}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
