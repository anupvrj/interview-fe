"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { Mono } from "./primitives";
import { STYLE, type State } from "./skill-trend";
import { SkillsOrbit } from "./skills-orbit";
import { Dots, ease, Head, HL, LIGHT, WRAP } from "./landing-kit";
import { cn } from "@/lib/utils";

export type SkLeaf = { n: string; s: State; v: number; d: number; why: string };
export type SkHub = { name: string; a: number; leaves: SkLeaf[] };

/** The live Skills Graph section: same graph on every product page, each page brings its own areas and skills. */
export function SkillsSection({ n, hubs, initial, live }: { n: string; hubs: SkHub[]; initial: string; live: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.35, once: true });
  const [sel, setSel] = useState(initial);
  const [held, setHeld] = useState(false);
  const [folded, setFolded] = useState<string[]>([]);
  const [replay, setReplay] = useState(0);
  const leaves = hubs.flatMap((h) => h.leaves.map((l) => ({ ...l, hub: h.name })));
  const openLeaves = leaves.filter((l) => !folded.includes(l.hub));
  const f = leaves.find((l) => l.n === sel)!;
  const st = STYLE[f.s];
  // "live": walk through the open skills on its own until the visitor takes over
  useEffect(() => {
    if (!on || held || reduce || openLeaves.length === 0) return;
    const id = setTimeout(() => { const k = openLeaves.findIndex((l) => l.n === sel); setSel(openLeaves[(k + 1) % openLeaves.length].n); }, 3200);
    return () => clearTimeout(id);
  }, [on, held, reduce, sel, openLeaves, replay]);
  const pick = (n: string) => { setHeld(true); setSel(n); };
  const fold = (hub: string) => {
    setHeld(true);
    setFolded((x) => (x.includes(hub) ? x.filter((h) => h !== hub) : [...x, hub]));
    if (f.hub === hub && !folded.includes(hub)) { const next = openLeaves.find((l) => l.hub !== hub); if (next) setSel(next.n); }
  };

  return (
    <section className={LIGHT}>
      <Dots />
      <div ref={ref} className={WRAP}>
        <Head n={n} label="Skills Graph" title={<>Every round updates your <span className={HL}>Skills Graph.</span></>}
          aside={<div className="flex flex-wrap gap-4">
            {(Object.keys(STYLE) as State[]).map((k) => (
              <span key={k} className="flex items-center gap-2 text-[13px] text-[#4B5275]">
                <svg width="22" height="6"><line x1="1" y1="3" x2="21" y2="3" stroke={STYLE[k].color} strokeWidth="2.5" strokeDasharray={STYLE[k].dash} strokeLinecap="round" /></svg>{STYLE[k].label}
              </span>
            ))}
          </div>} />
        <div className="grid grid-cols-1 overflow-hidden rounded-[28px] border border-border bg-white text-[#2E3656] shadow-[0_40px_80px_-50px_rgba(30,20,90,.45)] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* the graph: you, three clusters a voice round measures, nine skills */}
          <div className="relative border-b border-border p-4 lg:border-b-0 lg:border-r">
            <div className="bg-blueprint pointer-events-none absolute inset-0 opacity-80 [mask-image:radial-gradient(60%_60%_at_50%_50%,#000,transparent)]" />
            <div className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full border border-border bg-white/90 px-3 py-1 backdrop-blur">
              <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-emerald-500" /></span>
              <Mono className="text-[10.5px] text-[#4B5275]">{live}</Mono>
            </div>
            <div onMouseLeave={() => setHeld(false)}>
              <SkillsOrbit hubs={hubs} sel={sel} folded={folded} run={on} replay={replay} onPick={pick} onFold={fold} onCore={() => setHeld(true)} />
            </div>
            <div className="relative flex items-center justify-between px-2 pb-1">
              <Mono className="text-[10.5px] text-muted-foreground">CLICK “YOU” TO GATHER IT ALL · CLICK AN AREA TO FOLD IT</Mono>
              <button onClick={() => { setFolded([]); setHeld(false); setReplay((r) => r + 1); }} className="font-[family-name:var(--font-geist-mono)] text-[10.5px] text-primary hover:underline">↻ REPLAY</button>
            </div>
          </div>

          {/* the selected skill, in plain words */}
          <div className="flex flex-col p-7 md:p-9">
            <Mono className="text-[11px] text-primary">FROM THIS ROUND</Mono>
            <AnimatePresence mode="wait">
              <motion.div key={f.n} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="mt-3">
                <div className="flex items-center gap-3">
                  <p className="text-[28px] font-extrabold tracking-[-0.03em]">{f.n}</p>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: `${st.color}1F`, color: st.color === "#D27A1F" ? "#A85A12" : st.color }}>
                    <st.icon className="size-3.5" />{st.label}
                  </span>
                </div>
                <div className="mt-5 flex items-end gap-4">
                  <Mono className="text-[48px] leading-none">{f.v}</Mono>
                  <Mono className={cn("pb-1.5 text-[14px]", f.d < 0 ? "text-[#A85A12]" : "text-[#1E9E64]")}>{f.d > 0 ? "+" : ""}{f.d} this round</Mono>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-muted"><motion.div className="h-full rounded-full" style={{ background: st.color }} initial={{ width: 0 }} animate={{ width: `${f.v}%` }} transition={{ duration: 0.6, ease }} /></div>
                <p className="mt-5 text-[16px] leading-relaxed text-[#4B5275]">{f.why}</p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-auto flex flex-wrap gap-1.5 pt-7 max-md:hidden">
              {leaves.map((l) => (
                <button key={l.n} onClick={() => { if (folded.includes(l.hub)) setFolded((x) => x.filter((h) => h !== l.hub)); pick(l.n); }}
                  className={cn("rounded-full border px-2.5 py-1 text-[12px] transition-colors", l.n === sel ? "border-[#2E3656] bg-[#2E3656] text-white" : folded.includes(l.hub) ? "border-dashed border-border text-[#4B5275]/45 hover:text-[#4B5275]" : "border-border text-[#4B5275] hover:border-primary/40")}>{l.n}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

