"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Mono } from "./primitives";
import { cn } from "@/lib/utils";
import { MK26_ROUTES } from "./cta";
import { StartLink } from "./StartLink";

/**
 * The page is one story told in chapters. As the reader scrolls, a small memory card collects one thing
 * per chapter — the site "remembers" the reader the way the product remembers a candidate.
 */
export const CHAPTERS = [
  { n: "01", title: "The problem", memory: "Your last “no” came from a first-time answer." },
  { n: "02", title: "Your first rehearsal", memory: "You've said one answer out loud." },
  { n: "03", title: "The whole kit", memory: "Voice, coding, system design, resume. One place." },
  { n: "04", title: "It remembers", memory: "Every session now feeds one memory." },
  { n: "05", title: "See the gap", memory: "Your weakest skill has a name now." },
  { n: "06", title: "Fix the paper", memory: "Your resume stopped saying “worked on APIs”." },
  { n: "07", title: "Wherever you are", memory: "It follows you into ChatGPT and job sites." },
  { n: "08", title: "Fair play", memory: "It trains you. It never feeds you answers." },
  { n: "09", title: "The cost", memory: "Less than one human mock interview." },
] as const;

export function Chapter({ n, children }: { n: string; children: React.ReactNode }) {
  return <div data-chapter={n}>{children}</div>;
}

export function StoryMemory() {
  const reduce = useReducedMotion();
  const [at, setAt] = useState(-1); // index into CHAPTERS, or CHAPTERS.length at the end
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("[data-chapter]")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const n = (e.target as HTMLElement).dataset.chapter!;
          setAt(n === "end" ? CHAPTERS.length : CHAPTERS.findIndex((c) => c.n === n));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }, // the chapter crossing the middle of the screen
    );
    els.forEach((el) => io.observe(el));
    const top = () => window.scrollY < 300 && setAt(-1);
    window.addEventListener("scroll", top, { passive: true });
    return () => { io.disconnect(); window.removeEventListener("scroll", top); };
  }, []);

  const done = at >= CHAPTERS.length;
  const c = CHAPTERS[Math.min(at, CHAPTERS.length - 1)];
  const count = done ? CHAPTERS.length : at + 1;

  return (
    <AnimatePresence>
      {at >= 0 && (
        <motion.aside aria-label="What InterviewTrix remembers about you so far"
          initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-5 right-5 z-40 hidden w-[300px] rounded-2xl border border-white/70 bg-white/85 p-3.5 shadow-[0_24px_60px_-24px_rgba(30,20,90,.55),inset_0_1px_0_#fff] backdrop-blur-xl lg:block">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white shadow-[0_6px_16px_-6px_rgba(115,103,240,.7)]">
              <Image src="/marketing-2026/shots/interviewtrix-icon.png" alt="" width={20} height={20} className="h-5 w-auto" />
            </span>
            <div className="min-w-0">
              <Mono className="block text-[10.5px] text-primary">{done ? "STORY COMPLETE" : `CHAPTER ${c.n} / ${CHAPTERS.length}`}</Mono>
              <p className="truncate text-[13.5px] font-semibold text-[#2E3656]">{done ? "Session 1 knows you" : c.title}</p>
            </div>
            <Mono className="ml-auto rounded-md bg-primary-muted px-1.5 py-0.5 text-[11px] text-primary">{count} MEM</Mono>
          </div>
          {/* one segment per chapter, filled as the story is read */}
          <div className="mt-3 flex gap-1">
            {CHAPTERS.map((ch, i) => (
              <span key={ch.n} className={cn("h-1 flex-1 rounded-full transition-colors duration-500", i < count ? "bg-gradient-to-r from-[#7367F0] to-[#3674FF]" : "bg-muted")} />
            ))}
          </div>
          <div className="mt-2.5 min-h-[38px]">
            <AnimatePresence mode="wait">
              <motion.p key={done ? "end" : c.n} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}
                className="text-[12.5px] leading-snug text-[#4B5275]">
                {done ? (
                  <StartLink href={MK26_ROUTES.startInterview} className="inline-flex items-center gap-1 font-semibold text-primary">Start Session 1 with all {CHAPTERS.length} <ArrowRight className="size-3.5" /></StartLink>
                ) : (
                  <><Mono className="mr-1.5 text-[10px] text-muted-foreground">REMEMBERED</Mono>{c.memory}</>
                )}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
