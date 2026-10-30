"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight, Check, FileText, MousePointerClick, Puzzle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChromeIcon } from "@/components/chrome-extension/ChromeIcon";
import { getChromeExtensionHref } from "@/components/chrome-extension/AddToChromeButton";
import { cn } from "@/lib/utils";
import { GridRunners } from "./graphics";
import { BrowserFrame, Mono } from "./primitives";
import { DARK, ease, Head, HL, INK, LIGHT, WRAP } from "./landing-kit";

/** The Chrome extension landing page in the 2026 design. Copy is the legacy page's; the scenes are illustrative. */

const storeHref = () => getChromeExtensionHref();

/** "Add to Chrome": opens the Web Store listing (or the env override) in a new tab, like the legacy button. */
export function AddToChrome({ className, label = "Add to Chrome", variant = "primary" }: { className?: string; label?: string; variant?: "primary" | "outline" }) {
  const href = storeHref();
  const external = /^https?:\/\//i.test(href);
  return (
    <Button asChild variant={variant === "outline" ? "outline" : "default"}
      className={cn("h-12 rounded-xl px-6 text-[15.5px]", variant === "primary" ? "shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90" : "border-border bg-white text-[#2E3656] hover:border-primary/40", className)}>
      {external
        ? <a href={href} target="_blank" rel="noopener noreferrer"><ChromeIcon className="size-4" />{label}</a>
        : <Link href={href}><ChromeIcon className="size-4" />{label}</Link>}
    </Button>
  );
}

/* ─────────── hero scene: a job post → the extension reads it → a tailored copy ─────────── */

// phase timeline (ms from loop start): 0 page · 1 panel opens · 2 role/company detected · 3 JD captured · 4 match · 5 tailoring · 6 saved
const PHASES = [0, 900, 1900, 3000, 4100, 5600, 7100];
const LOOP_MS = 9800;
const JD = ["Own order-routing services at dinner peak", "Design idempotent payment callbacks", "Join the on-call rotation for partner APIs"];

function useLoopPhase(run: boolean) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(reduce ? 6 : 0);
  useEffect(() => {
    if (reduce || !run) return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const start = () => {
      timers = PHASES.map((at, i) => setTimeout(() => setPhase(i), at));
      timers.push(setTimeout(start, LOOP_MS));
    };
    start();
    return () => timers.forEach(clearTimeout);
  }, [reduce, run]);
  return reduce ? 6 : phase;
}

function Ring({ value, on }: { value: number; on: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) { setN(0); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { const p = Math.min(1, (t - t0) / 1100); setN(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, value]);
  const r = 22, c = 2 * Math.PI * r;
  return (
    <div className="relative size-[58px] shrink-0">
      <svg viewBox="0 0 52 52" className="size-full -rotate-90">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#ECEBF6" strokeWidth="5" />
        <circle cx="26" cy="26" r={r} fill="none" stroke="url(#cx-ring)" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - n / 100)} />
        <defs><linearGradient id="cx-ring" x1="0" x2="1"><stop stopColor="#8E83F5" /><stop offset="1" stopColor="#5AA8FF" /></linearGradient></defs>
      </svg>
      <span className={cn("absolute inset-0 grid place-items-center text-[15px] font-extrabold", INK)}>{n}%</span>
    </div>
  );
}

export function ChromeScene() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const phase = useLoopPhase(inView);
  const at = (p: number) => phase >= p;
  return (
    <div ref={ref} className="relative">
      <BrowserFrame url="linkedin.com/jobs/view/backend-engineer-ii" dark={false} className="relative">
        <div className="relative grid min-h-[430px]">
          {/* the job post */}
          <div className="p-5 pb-[230px] sm:p-7 sm:pb-[230px] md:pb-7 md:pr-[280px]">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#FC8019] text-[15px] font-black text-white">S</span>
              <div className="min-w-0">
                <p className={cn("rounded-md text-[18px] font-bold leading-tight transition-colors duration-500", INK, at(2) && "bg-primary/10 ring-2 ring-primary/30")}>Backend Engineer II</p>
                <p className={cn("mt-0.5 inline-block rounded-md text-[13px] text-muted-foreground transition-colors duration-500", at(2) && "bg-primary/10 ring-2 ring-primary/30")}>Swiggy · Bengaluru · Hybrid</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["Go", "Kafka", "gRPC", "PostgreSQL", "On-call"].map((t) => <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-[12px]">{t}</span>)}
            </div>
            <p className={cn("mt-5 text-[13.5px] font-semibold", INK)}>What you&apos;ll do</p>
            <ul className="relative mt-2 space-y-2 text-[13px] text-muted-foreground">
              {JD.map((l, i) => (
                <li key={l} className="relative">
                  <motion.span aria-hidden className="absolute -inset-x-1 -inset-y-0.5 origin-left rounded bg-[#FFE98A]/70"
                    initial={false} animate={{ scaleX: at(3) ? 1 : 0 }} transition={{ duration: 0.45, delay: at(3) ? i * 0.18 : 0, ease }} />
                  <span className="relative">• {l}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2">
              {[100, 92, 78].map((w) => <div key={w} className="h-2 rounded-full bg-[#EFEEF6]" style={{ width: `${w}%` }} />)}
            </div>
          </div>

          {/* the extension popup */}
          <AnimatePresence>
            {at(1) && (
              <motion.div key="panel" initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease }}
                className="absolute inset-x-3 bottom-3 rounded-2xl border border-border bg-white p-4 shadow-[0_30px_60px_-24px_rgba(40,30,110,.45)] md:inset-x-auto md:bottom-auto md:right-4 md:top-4 md:w-[256px]">
                <div className="flex items-center justify-between">
                  <span className={cn("flex items-center gap-2 text-[13px] font-semibold", INK)}><span className="grid size-5 place-items-center rounded bg-primary text-[10px] font-bold text-white">iX</span>InterviewTrix</span>
                  <Mono className="text-[10px] text-success">● SIGNED IN</Mono>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[["ROLE", "Backend Engineer II"], ["COMPANY", "Swiggy"]].map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-border bg-[#FBFBFD] px-2.5 py-1.5">
                      <Mono className="block text-[9.5px] text-muted-foreground">{k}</Mono>
                      <span className={cn("block truncate text-[12px] font-medium", at(2) ? INK : "text-transparent")}>{at(2) ? v : "·"}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                  <Ring value={82} on={at(4)} />
                  <div className="min-w-0 text-[12px] leading-snug">
                    <span className={cn("block font-semibold", INK)}>{at(4) ? "Match against your resume" : at(3) ? "Job description captured" : at(2) ? "Role and company found" : "Reading the page…"}</span>
                    <span className="block text-muted-foreground">{at(4) ? "Missing: gRPC, on-call" : at(3) ? "3 duties · 5 skills" : at(2) ? "Now reading the description" : "Role and company"}</span>
                  </div>
                </div>
                <div className={cn("mt-2.5 flex h-9 items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold text-white transition-all", at(6) ? "bg-success" : "bg-primary", phase === 5 && "scale-[0.97] opacity-90")}>
                  {at(6) ? <><Check className="size-4" />Saved to your resumes</> : phase === 5 ? <><span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />Tailoring a new copy…</> : <>Tailor resume <ArrowRight className="size-3.5" /></>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* cursor */}
          <motion.span aria-hidden className="pointer-events-none absolute z-10 hidden sm:block"
            initial={false}
            animate={phase === 0 ? { left: "70%", top: "70%" } : phase < 5 ? { left: "93%", top: "-4%" } : { left: "84%", top: phase >= 6 ? "60%" : "56%" }}
            transition={{ duration: 0.8, ease }}>
            <MousePointerClick className="size-5 fill-white text-[#2E3656] drop-shadow" />
          </motion.span>
        </div>
      </BrowserFrame>

      {/* the tailored copy floats out once it's saved */}
      <AnimatePresence>
        {at(6) && (
          <motion.div key="copy" initial={{ opacity: 0, y: 16, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: -3 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.5, ease }}
            className="absolute -bottom-8 -left-3 hidden w-[230px] rounded-2xl border border-border bg-white p-3.5 shadow-[0_30px_60px_-24px_rgba(40,30,110,.5)] md:block lg:-left-10">
            <Mono className="text-[10px] text-primary">NEW COPY · ORIGINAL UNTOUCHED</Mono>
            <p className={cn("mt-1.5 text-[13px] font-bold", INK)}>Aarav_Rao · Swiggy BE-II</p>
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-[#E4E2F2]" /><div className="h-1.5 w-5/6 rounded-full bg-primary/35" /><div className="h-1.5 w-2/3 rounded-full bg-[#E4E2F2]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ChromeHero() {
  const reduce = useReducedMotion();
  const fade = (d: number) => (reduce ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: d, duration: 0.65, ease } });
  return (
    <section className="relative overflow-clip pb-20 pt-28 md:pb-28 md:pt-40">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_75%_30%,rgba(115,103,240,.18),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_85%)]" />
      <GridRunners />
      <div className={cn(WRAP, "grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] lg:gap-12")}>
        <div>
          <motion.div {...fade(0)}>
            <Mono className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-3 py-1.5 text-[11px] text-primary shadow-sm backdrop-blur">
              <ChromeIcon className="size-3.5" />CHROME EXTENSION
            </Mono>
          </motion.div>
          <motion.h1 {...fade(0.06)} className={cn("mt-6 text-[40px] font-black leading-[0.98] tracking-[-0.055em] sm:text-[54px] lg:text-[52px] xl:text-[62px]", INK)}>
            Tailor your resume from <span className={HL}>any job page.</span>
          </motion.h1>
          <motion.p {...fade(0.12)} className="mt-5 max-w-[48ch] text-[17px] leading-relaxed text-[#4B5275]">
            Capture a job description in Chrome, stay signed in to InterviewTrix, and generate a new tailored resume copy in one flow.
          </motion.p>
          <motion.div {...fade(0.18)} className="mt-8 flex flex-wrap gap-3">
            <AddToChrome />
            <Button asChild variant="outline" className="h-12 rounded-xl border-border bg-white px-6 text-[15.5px] text-[#2E3656] hover:border-primary/40">
              <Link href="/dashboard/resumes/new">Open resume builder</Link>
            </Button>
          </motion.div>
          <motion.p {...fade(0.24)} className="mt-4 flex items-center gap-2 text-[13.5px] text-muted-foreground">
            <Puzzle className="size-4 text-primary" />After you add it, click the puzzle icon in Chrome and pin InterviewTrix.
          </motion.p>
        </div>
        <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.8, ease }}>
          <ChromeScene />
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────── three steps, each with a small moving picture ─────────── */

const STEPS = [
  { icon: Puzzle, title: "Add and pin the extension", body: "Chrome cannot install extensions from a website automatically. Add it from the Chrome Web Store, then pin it from the puzzle icon so it stays one click away." },
  { icon: MousePointerClick, title: "Open it on a job posting", body: "We’ll try to detect the role, company, and description. You can edit the text or use what you highlighted on the page." },
  { icon: FileText, title: "Tailor a new resume copy", body: "InterviewTrix opens in your existing login. Pick a source resume — we create a new tailored version and leave the original untouched." },
];

function StepArt({ i, on }: { i: number; on: boolean }) {
  if (i === 0) return (
    <div className="flex h-full items-center justify-center gap-2">
      <div className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 shadow-sm">
        {["#E4E2F2", "#E4E2F2"].map((c, k) => <span key={k} className="size-5 rounded-md" style={{ background: c }} />)}
        <motion.span className="grid size-6 place-items-center rounded-md bg-primary text-[9px] font-bold text-white" initial={false}
          animate={on ? { scale: [0.4, 1.15, 1], opacity: 1 } : { scale: 0.4, opacity: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>iX</motion.span>
        <Puzzle className="ml-1 size-4 text-muted-foreground" />
      </div>
    </div>
  );
  if (i === 1) return (
    <div className="flex h-full flex-col justify-center gap-2 px-6">
      {["Role · Backend Engineer II", "Company · Swiggy", "3 duties captured"].map((l, k) => (
        <motion.div key={l} initial={false} animate={on ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }} transition={{ delay: 0.2 + k * 0.25, duration: 0.45, ease }}
          className="flex items-center gap-2 rounded-lg border border-border bg-white px-2.5 py-1.5 text-[12px] text-[#2E3656]">
          <Check className="size-3.5 text-success" />{l}
        </motion.div>
      ))}
    </div>
  );
  return (
    <div className="relative flex h-full items-center justify-center">
      <div className="absolute w-[120px] -translate-x-6 rotate-[-6deg] rounded-xl border border-border bg-white p-3 opacity-70">
        <Mono className="text-[9px] text-muted-foreground">ORIGINAL</Mono>
        <div className="mt-2 space-y-1"><div className="h-1.5 rounded-full bg-[#E4E2F2]" /><div className="h-1.5 w-4/5 rounded-full bg-[#E4E2F2]" /></div>
      </div>
      <motion.div initial={false} animate={on ? { x: 26, rotate: 4, opacity: 1 } : { x: 0, rotate: 0, opacity: 0 }} transition={{ delay: 0.35, duration: 0.6, ease }}
        className="relative w-[120px] rounded-xl border border-primary/40 bg-white p-3 shadow-[0_14px_30px_-16px_rgba(115,103,240,.7)]">
        <Mono className="text-[9px] text-primary">TAILORED</Mono>
        <div className="mt-2 space-y-1"><div className="h-1.5 rounded-full bg-primary/40" /><div className="h-1.5 w-4/5 rounded-full bg-[#E4E2F2]" /></div>
      </motion.div>
    </div>
  );
}

function StepCard({ s, i }: { s: (typeof STEPS)[number]; i: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const on = useInView(ref, { once: true, amount: 0.5 });
  return (
    <motion.li ref={ref} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ delay: i * 0.12, duration: 0.6, ease }}
      className="flex flex-col overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_24px_50px_-40px_rgba(30,20,80,.6)]">
      <div className="h-[150px] border-b border-[#EEEDF5] bg-[linear-gradient(180deg,#FAFAFE,#F3F2FC)]"><StepArt i={i} on={on} /></div>
      <div className="p-6">
        <div className="flex items-center gap-3">
          <Mono className="text-[12px] text-primary">{String(i + 1).padStart(2, "0")}</Mono>
          <s.icon className="size-4 text-primary" />
        </div>
        <h3 className={cn("mt-3 text-[20px] font-bold tracking-[-0.02em]", INK)}>{s.title}</h3>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{s.body}</p>
      </div>
    </motion.li>
  );
}

export function ChromeSteps() {
  return (
    <section className={LIGHT}>
      <div className={WRAP}>
        <Head n="01" label="How it works" title={<>Three clicks from a job post to <span className={HL}>a tailored copy.</span></>} />
        <ol className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => <StepCard key={s.title} s={s} i={i} />)}
        </ol>
      </div>
    </section>
  );
}

/* ─────────── supported boards ─────────── */

const SITES = ["LinkedIn", "Naukri", "Indeed", "Glassdoor", "Greenhouse", "Lever", "Wellfound", "Any career page"];

export function ChromeBoards() {
  const reduce = useReducedMotion();
  const row = [...SITES, ...SITES];
  return (
    <section className="relative overflow-clip border-t border-[#E7E6F2] bg-white py-24 md:py-32">
      <div className={WRAP}>
        <Head n="02" label="Where it works" title={<>Works on the boards <span className={HL}>you already use.</span></>}
          sub="Site-specific extractors for popular boards, plus JSON-LD and selected-text fallbacks on company career pages." />
        <p className="-mt-8 mb-10 max-w-[56ch] text-[15.5px] leading-relaxed text-muted-foreground md:hidden">Site-specific extractors for popular boards, plus JSON-LD and selected-text fallbacks on company career pages.</p>
      </div>
      <div className="relative [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
        <motion.ul className="flex w-max gap-3" animate={reduce ? undefined : { x: ["0%", "-50%"] }} transition={{ duration: 28, ease: "linear", repeat: Infinity }}>
          {row.map((s, i) => (
            <li key={i} className="flex items-center gap-2.5 rounded-2xl border border-border bg-[#FBFBFD] px-5 py-3.5 text-[15px] font-medium text-[#2E3656]">
              <span className="grid size-6 place-items-center rounded-full bg-success/10"><Check className="size-3.5 text-success" /></span>{s}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

/* ─────────── privacy ─────────── */

export function ChromePrivacy() {
  return (
    <section className={DARK}>
      <div className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-30" />
      <div className={cn(WRAP, "grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_auto]")}>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.7, ease }} className="flex gap-5">
          <span className="relative grid size-14 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/5">
            <span className="absolute inset-0 animate-ping rounded-2xl border border-sky-400/30 [animation-duration:2.6s]" />
            <Shield className="size-6 text-sky-300" />
          </span>
          <div>
            <Mono className="text-[12px] text-sky-400">— 03 · PRIVACY —</Mono>
            <h2 className="mt-3 text-[30px] font-extrabold leading-[1.05] tracking-[-0.04em] text-white md:text-[44px]">You control what is captured.</h2>
            <p className="mt-4 max-w-[58ch] text-[16px] leading-relaxed text-[#9FB3CF]">
              The extension reads a page only when you click it. It never calls the InterviewTrix API and uses your existing browser login when you continue on the site.
            </p>
          </div>
        </motion.div>
        <AddToChrome className="justify-self-start md:justify-self-end" />
      </div>
    </section>
  );
}
