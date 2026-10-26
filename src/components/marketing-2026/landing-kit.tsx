"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrowserFrame, Index, LoopVideo, Mono } from "./primitives";
import { cn } from "@/lib/utils";
import { StartLink } from "./StartLink";
import { computeFocusCamera } from "./focus-camera";

/**
 * Shared kit for product landing pages (AI Mock Interview, Resume Builder, ATS, System Design…).
 * One heading system, one container, and the homepage's background set, so every product page
 * reads as the same site.
 */

export const HL = "bg-gradient-to-r from-[#8E83F5] to-[#5AA8FF] bg-clip-text pr-[0.06em] text-transparent";
export const INK = "text-[#2E3656]";
export const H2 = "text-[34px] font-extrabold leading-[1.04] tracking-[-0.045em] text-[#2E3656] md:text-[56px]";
export const ease = [0.16, 1, 0.3, 1] as const;

/* One system for every section: same container, same padding, same header. Backgrounds come from the homepage set below. */
export const WRAP = "relative mx-auto max-w-[1180px] px-5";
// the homepage's background set, used in the same light / dark rhythm
export const LIGHT = "relative overflow-clip border-t border-[#E7E6F2] bg-[#F8F8FB] py-24 md:py-32";
export const LAVENDER = "relative overflow-clip border-t border-primary/10 bg-[linear-gradient(180deg,#FFFFFF_0%,#F1EEFF_100%)] py-24 md:py-32";
export const SKY = "relative overflow-clip bg-[linear-gradient(180deg,#EEF6FF_0%,#E6F0FF_100%)] py-24 md:py-32";
export const DARK = "ix-panel grain relative overflow-clip bg-[hsl(var(--ix-navy))] py-24 text-[#EAF2FF] md:py-32";
export const Dots = () => <div aria-hidden className="bg-dots mask-fade pointer-events-none absolute inset-0 opacity-60" />;
export const Blueprint = () => <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-80" />;

export function Head({ n, label, title, sub, aside, dark, nowrap }: { n: string; label: string; title: React.ReactNode; sub?: string; aside?: React.ReactNode; dark?: boolean; nowrap?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 0.7, ease }}
      className={cn("mb-12 grid grid-cols-1 items-end gap-x-12 gap-y-4 md:mb-16", (sub || aside) && "md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]")}>
      <div>
        <Index n={n} label={label} dark={dark} />
        <h2 className={cn(H2, dark && "text-white", nowrap && "md:whitespace-nowrap")}>{title}</h2>
      </div>
      {(sub || aside) && (
        <div className="md:pb-2">
          {aside}
          {sub && <p className={cn("max-w-[42ch] text-[16.5px] leading-relaxed max-md:hidden", dark ? "text-[#9FB3CF]" : "text-muted-foreground")}>{sub}</p>}
        </div>
      )}
    </motion.div>
  );
}

/** Phones only: once the hero buttons scroll away, keep one way to start. Hides again near the closing section. */
export function StickyCta({ product, cta, href }: { product: string; cta: string; href: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => {
      const end = document.documentElement.scrollHeight - window.innerHeight - 900;
      setShow(window.scrollY > 640 && window.scrollY < end);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ y: 90 }} animate={{ y: 0 }} exit={{ y: 90 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/90 p-2 pl-4 shadow-[0_20px_50px_-20px_rgba(30,20,90,.6)] backdrop-blur-xl md:hidden">
          <div className="min-w-0 flex-1"><p className={cn("truncate text-[14px] font-bold", INK)}>{product}</p><Mono className="text-[10.5px] text-muted-foreground">FREE · NO CARD</Mono></div>
          <Button asChild className="h-11 rounded-xl px-4 text-[14.5px]">
            <StartLink href={href}>{cta} <ArrowRight /></StartLink>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────── how it works ─────────── */

const STEP_MS = 7000;
export type Step = { k: string; icon: React.ComponentType<{ className?: string }>; t: string; d: string; v: string; url: string };

/** "How it works": steps that advance on their own beside the real capture for each one. Never pins the scroll. */
export function Stepper({ steps, n, label, title, nowrap }: { steps: Step[]; n: string; label: string; title: React.ReactNode; nowrap?: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.4 });
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  // steps advance on their own while the section is on screen; hovering holds the current one
  useEffect(() => {
    if (!on || paused || reduce) return;
    const id = setTimeout(() => setI((x) => (x + 1) % steps.length), STEP_MS);
    return () => clearTimeout(id);
  }, [i, on, paused, reduce]);
  const s = steps[i];

  return (
    <section className={LIGHT}>
      <Dots />
      <div ref={ref} className={WRAP} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <Head n={n} label={label} nowrap={nowrap} title={title} />
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)]">
          <ol className="space-y-2">
            {steps.map((st, k) => {
              const active = k === i;
              return (
                <li key={st.k}>
                  <button onClick={() => setI(k)} className={cn("relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300",
                    active ? "border-white bg-white/90 shadow-[0_20px_40px_-24px_rgba(75,63,208,.45)]" : "border-transparent hover:bg-white/50")}>
                    <div className="flex items-center gap-3">
                      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl transition-colors", active ? "bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] text-white" : "bg-white text-muted-foreground")}><st.icon className="size-4" /></span>
                      <div className="min-w-0"><Mono className="text-[10.5px] text-primary">0{k + 1} · {st.k}</Mono><p className={cn("text-[16.5px] font-bold tracking-tight", active ? INK : "text-[#4B5275]/70")}>{st.t}</p></div>
                    </div>
                    <AnimatePresence initial={false}>
                      {active && (
                        <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-12 text-[14.5px] text-muted-foreground">
                          <span className="block pt-2">{st.d}</span>
                        </motion.p>
                      )}
                    </AnimatePresence>
                    {/* progress: how long until the next step */}
                    {active && <span className="absolute inset-x-4 bottom-0 h-[3px] overflow-hidden rounded-full bg-primary/10">
                      <motion.span key={`${i}-${paused}`} className="block h-full origin-left rounded-full bg-gradient-to-r from-[#7367F0] to-[#1F8FFF]"
                        initial={{ scaleX: 0 }} animate={{ scaleX: paused || reduce || !on ? 0.02 : 1 }} transition={{ duration: paused || reduce || !on ? 0.2 : STEP_MS / 1000, ease: "linear" }} />
                    </span>}
                  </button>
                </li>
              );
            })}
          </ol>
          <BrowserFrame url={s.url}>
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={s.v} initial={{ opacity: 0, scale: 1.015 }} animate={{ opacity: 1, scale: reduce ? 1 : 1.05 }} exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 0.25 }, scale: { duration: STEP_MS / 1000, ease: "linear" } }} className="origin-center">
                  <LoopVideo name={s.v} priority={i === 0} />
                </motion.div>
              </AnimatePresence>
              <Mono className="absolute bottom-3 right-3 rounded-md bg-black/50 px-2 py-1 text-[10.5px] text-white/80 backdrop-blur">0{i + 1} / 0{steps.length}</Mono>
            </div>
          </BrowserFrame>
        </div>
      </div>
    </section>
  );
}


/* ─────────── in → hub → out ─────────── */

/** Count up once when shown. */
export function CountUp({ to, run }: { to: number; run: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { const k = Math.min(1, (t - t0) / 1200); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, to]);
  return <>{v}</>;
}

export type Out = { t: string; d: string };

/** In → hub → out wiring, measured from the real DOM. The hub content is the product's own artefact. */
export function Wiring({ n, label, title, sub, ins: inItems, outs: outItems, children }: { n: string; label: string; title: React.ReactNode; sub?: string; ins: string[]; outs: Out[]; children: (on: boolean) => React.ReactNode }) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const hub = useRef<HTMLDivElement>(null);
  const ins = useRef<(HTMLDivElement | null)[]>([]);
  const outs = useRef<(HTMLDivElement | null)[]>([]);
  const on = useInView(box, { amount: 0.35, once: true });
  const [paths, setPaths] = useState<{ d: string; out: boolean }[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // wires are measured from the real DOM so they always meet the chips, whatever the copy length
  useEffect(() => {
    const el = box.current; if (!el) return;
    const measure = () => {
      const b = el.getBoundingClientRect(), h = hub.current!.getBoundingClientRect();
      const r = (n: number) => Math.round(n * 10) / 10;
      const hl = { x: h.left - b.left, y: h.top - b.top + h.height / 2 }, hr = { x: h.right - b.left, y: hl.y };
      const p: { d: string; out: boolean }[] = [];
      ins.current.forEach((c) => { if (!c) return; const q = c.getBoundingClientRect(); const x = q.right - b.left, y = q.top - b.top + q.height / 2; const m = (x + hl.x) / 2;
        p.push({ d: `M${r(x)} ${r(y)} C ${r(m)} ${r(y)}, ${r(m)} ${r(hl.y)}, ${r(hl.x)} ${r(hl.y)}`, out: false }); });
      outs.current.forEach((c) => { if (!c) return; const q = c.getBoundingClientRect(); const x = q.left - b.left, y = q.top - b.top + q.height / 2; const m = (x + hr.x) / 2;
        p.push({ d: `M${r(hr.x)} ${r(hr.y)} C ${r(m)} ${r(hr.y)}, ${r(m)} ${r(y)}, ${r(x)} ${r(y)}`, out: true }); });
      setPaths(p); setSize({ w: b.width, h: b.height });
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section className={SKY}>
      <Blueprint />
      {/* soft brand light behind the hub only */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(34%_40%_at_50%_64%,rgba(115,103,240,.14),transparent_70%)]" />
      <div className={WRAP}>
        <Head n={n} label={label} title={title} sub={sub} />
        <div ref={box} className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[.75fr_1fr_1fr] lg:gap-16">
          {/* wires + travelling packets (desktop) */}
          {size.w > 0 && (
            <svg aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`}>
              <defs><linearGradient id="kit-wire-g" x1="0" x2="1"><stop offset="0" stopColor="#7367F0" /><stop offset="1" stopColor="#1F8FFF" /></linearGradient></defs>
              {paths.map((p, i) => (
                <g key={i}>
                  <motion.path d={p.d} fill="none" stroke="url(#kit-wire-g)" strokeOpacity=".5" strokeWidth="1.6" strokeDasharray="5 6"
                    initial={{ pathLength: 0 }} animate={on ? { pathLength: 1 } : {}} transition={{ delay: (p.out ? 0.9 : 0.1) + i * 0.08, duration: 0.9, ease }} />
                  {on && !reduce && <circle r="3.5" fill={p.out ? "#1F8FFF" : "#7367F0"} style={{ offsetPath: `path('${p.d}')`, animation: `mem-travel ${2.2 + (i % 3) * 0.35}s ${1.6 + i * 0.25}s linear infinite both` }} />}
                </g>
              ))}
            </svg>
          )}

          <div className="relative space-y-3">
            <Mono className="text-[11px] text-muted-foreground">IN</Mono>
            {inItems.map((x, i) => (
              <motion.div key={x} ref={(el) => { ins.current[i] = el; }} initial={{ opacity: 0, x: -14 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.1, duration: 0.5, ease }}
                className="rounded-xl border border-white bg-white/90 px-4 py-3 text-[14.5px] font-medium text-[#2E3656] shadow-[0_12px_28px_-20px_rgba(30,20,90,.5)] backdrop-blur">{x}</motion.div>
            ))}
          </div>

          {/* hub: the report itself, with a still ring centred behind it */}
          <div className="relative">
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/25" />
            <motion.div ref={hub} initial={{ opacity: 0, scale: 0.94 }} animate={on ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.35, duration: 0.7, ease }}
              className="relative rounded-[26px] bg-[#0B1A30] p-6 text-white shadow-[0_40px_80px_-30px_rgba(40,30,140,.75)] ring-1 ring-white/10">
              {children(on)}
            </motion.div>
          </div>

          <div className="relative space-y-3">
            <Mono className="text-[11px] text-muted-foreground">OUT</Mono>
            {outItems.map((o, i) => (
              <motion.div key={o.t} ref={(el) => { outs.current[i] = el; }} initial={{ opacity: 0, x: 14 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1.2 + i * 0.15, duration: 0.5, ease }}
                className="group rounded-xl border border-white bg-white/90 px-4 py-3 shadow-[0_12px_28px_-20px_rgba(30,20,90,.5)] backdrop-blur transition-colors hover:border-primary/40">
                <p className="text-[14.5px] font-semibold text-[#2E3656]">{o.t} <ArrowRight className="inline size-3.5 text-primary transition-transform group-hover:translate-x-0.5" /></p>
                <p className="text-[13px] text-muted-foreground max-md:hidden">{o.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


/* ─────────── focus camera ─────────── */

/**
 * Zoom-and-centre camera for a product screen. Panels register with `reg(key)`; when `focus` changes the camera
 * zooms as far as it can with the whole panel in view (heading and edges included) and centres it.
 * Put `vp` on the overflow-hidden viewport and `root` on a `relative` motion layer with origin 0 0.
 */
export function useFocusCamera<F extends string>(focus: F, none: F, max = 1.75) {
  const vp = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const panels = useRef<Partial<Record<F, HTMLElement | null>>>({});
  const reg = (f: F) => (el: HTMLElement | null) => { panels.current[f] = el; };
  const [cam, setCam] = useState({ x: 0, y: 0, s: 1 });
  const [box, setBox] = useState(0);
  useEffect(() => {
    const el = vp.current; if (!el) return;
    const ro = new ResizeObserver(() => setBox(el.clientWidth)); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const v = vp.current, r = root.current, el = panels.current[focus];
    if (!v || !r) return;
    if (focus === none || !el) {
      setCam(computeFocusCamera({
        focused: false, max, vpW: v.clientWidth, vpH: v.clientHeight, rootW: r.offsetWidth, rootH: r.offsetHeight,
      }));
      return;
    }
    let px = 0, py = 0, n: HTMLElement | null = el;
    while (n && n !== r) { px += n.offsetLeft; py += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
    setCam(computeFocusCamera({
      focused: true, max, vpW: v.clientWidth, vpH: v.clientHeight, rootW: r.offsetWidth, rootH: r.offsetHeight,
      panel: { x: px, y: py, w: el.offsetWidth, h: el.offsetHeight },
    }));
  }, [focus, none, max, box]);
  return { vp, root, reg, cam };
}
