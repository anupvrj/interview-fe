"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Emblem, type EmblemKind, Mono } from "./primitives";
import { GridRunners } from "./graphics";
import { ease, HL, INK } from "./landing-kit";

/**
 * Legal pages (privacy, terms, refunds) in the 2026 design. The wording is passed in untouched; this only owns the
 * layout: a hero, a sticky "On this page" index that follows your scroll, and numbered sections.
 */
export type LegalSection = { id: string; title: string; body: React.ReactNode };

/** Prose inside a section: the legacy markup (p, ul, links, the email box) restyled to the 2026 type. */
const PROSE =
  "space-y-4 text-[15.5px] leading-[1.75] text-[#4B5275] [&_a]:font-medium [&_a]:text-primary [&_a:hover]:underline [&_li]:pl-1 [&_li::marker]:text-primary/60 [&_p.font-semibold]:mt-6 [&_p.font-semibold]:text-[13px] [&_p.font-semibold]:uppercase [&_p.font-semibold]:tracking-wider [&_p.font-semibold]:text-[#2E3656] [&_p.font-semibold:first-child]:mt-0 [&_strong]:text-[#2E3656] [&_ul]:list-outside [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:ml-0";

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return active;
}

export function LegalPage({ kind, label, title, accent, updated, intro, sections }: {
  kind: EmblemKind; label: string; title: string; accent: string; updated: string; intro: string; sections: LegalSection[];
}) {
  const reduce = useReducedMotion();
  const active = useActiveSection(sections.map((s) => s.id));
  // phones: keep the current section's chip in view as you read
  const row = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = row.current, chip = el?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (el && chip) el.scrollTo({ left: chip.offsetLeft - 20, behavior: reduce ? "auto" : "smooth" });
  }, [active, reduce]);
  return (
    <>
      <section className="relative overflow-clip pb-12 pt-28 md:pb-16 md:pt-40">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_70%_30%,rgba(115,103,240,.16),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_80%)]" />
        <GridRunners />
        <div className="relative mx-auto max-w-[1180px] px-5">
          <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-3 rounded-2xl border border-white bg-white/80 py-2 pl-2 pr-4 shadow-[0_14px_34px_-18px_rgba(75,63,208,.55),inset_0_1px_0_#fff] backdrop-blur">
            <Emblem kind={kind} tone="light" className="size-11 rounded-xl" />
            <span className="leading-tight">
              <span className={cn("block text-[17px] font-extrabold tracking-[-0.02em]", INK)}>{label}</span>
              <Mono className="text-[11px] text-muted-foreground">LAST UPDATED · {updated.toUpperCase()}</Mono>
            </span>
          </motion.div>
          <motion.h1 initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.7, ease }}
            className={cn("mt-7 max-w-[16ch] text-[40px] font-black leading-[0.98] tracking-[-0.055em] sm:text-[52px] md:text-[64px]", INK)}>
            {title} <span className={HL}>{accent}</span>
          </motion.h1>
          <motion.p initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.6, ease }}
            className="mt-5 max-w-[60ch] text-[17px] text-[#4B5275]">{intro}</motion.p>
        </div>
      </section>

      <section className="relative border-t border-[#E7E6F2] bg-[#F8F8FB] pb-24 pt-8 md:pt-14">
        {/* phones: the index as a swipeable row */}
        <nav ref={row} aria-label="On this page" className="sticky top-[76px] z-20 -mt-2 mb-6 overflow-x-auto border-y border-[#E7E6F2] bg-[#F8F8FB]/95 px-5 py-3 backdrop-blur lg:hidden">
          <ul className="flex w-max gap-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} data-id={s.id} className={cn("block whitespace-nowrap rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors", active === s.id ? "border-primary bg-primary text-white" : "border-border bg-white text-[#2E3656]")}>
                  {String(i + 1).padStart(2, "0")} · {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-10 px-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-14">
          {/* desktop: sticky index that follows your scroll */}
          <aside className="hidden lg:block">
            <nav aria-label="On this page" className="sticky top-28">
              <Mono className="text-[11px] text-muted-foreground">ON THIS PAGE</Mono>
              <ol className="mt-4 space-y-1 border-l border-[#E1DFF0]">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className={cn("-ml-px flex gap-3 border-l-2 py-1.5 pl-4 text-[14px] transition-colors", active === s.id ? "border-primary font-semibold text-[#2E3656]" : "border-transparent text-muted-foreground hover:text-[#2E3656]")}>
                      <Mono className={cn("text-[11px] leading-[1.6]", active === s.id ? "text-primary" : "text-[#A3A8C3]")}>{String(i + 1).padStart(2, "0")}</Mono>{s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-[0_30px_60px_-44px_rgba(30,20,80,.5)]">
            {sections.map((s, i) => (
              <article key={s.id} id={s.id} className="scroll-mt-36 border-b border-[#EEEDF5] px-5 py-8 last:border-0 sm:px-10 sm:py-10 lg:scroll-mt-28">
                <div className="flex items-baseline gap-3">
                  <Mono className="text-[12px] text-primary">{String(i + 1).padStart(2, "0")}</Mono>
                  <h2 className={cn("text-[22px] font-extrabold leading-tight tracking-[-0.025em] sm:text-[26px]", INK)}>{s.title}</h2>
                </div>
                <div className={cn("mt-4", PROSE)}>{s.body}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
