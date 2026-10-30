"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import {
  ArrowRight, BadgeCheck, Building2, Check, ClipboardList, Filter, Play, Rocket, Search, ShieldCheck,
  TrendingUp, UserCheck, Users, Video, Zap, type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { hireIxTalentDemoVideo } from "@/lib/seo/marketing-video-content";
import { cn } from "@/lib/utils";
import { GridRunners } from "./graphics";
import { BrowserFrame, Mono } from "./primitives";
import { CountUp, DARK, ease, Head, HL, INK, LIGHT, SKY, WRAP } from "./landing-kit";

/**
 * Hire iX Talent (the recruiter landing page) in the 2026 design. Copy and numbers are the legacy page's;
 * candidates in the scenes are illustrative.
 */

export const BROWSE_HREF = `/sign-in?redirect_url=${encodeURIComponent("/dashboard/ix-recruiter")}`;

function BecomeButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <Button type="button" onClick={onClick} className={cn("h-12 rounded-xl px-6 text-[15.5px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90", className)}>
      Become Recruiter <ArrowRight className="size-4" />
    </Button>
  );
}

/* ─────────── hero console: filters narrow the pool, candidates sort by iX Score, one gets shortlisted ─────────── */

type Cand = { i: string; name: string; role: string; score: number; bars: number[]; tone: string };
const CANDS: Cand[] = [
  { i: "AR", name: "Aarav R.", role: "Backend Engineer · 4 yrs", score: 91, bars: [92, 88, 94, 86], tone: "from-[#8E83F5] to-[#5AA8FF]" },
  { i: "MS", name: "Meera S.", role: "Backend Engineer · 5 yrs", score: 87, bars: [84, 90, 85, 88], tone: "from-[#F59E8B] to-[#F2C46D]" },
  { i: "KD", name: "Kabir D.", role: "Platform Engineer · 3 yrs", score: 84, bars: [86, 80, 88, 79], tone: "from-[#5CC8A8] to-[#5AA8FF]" },
];
const FILTERS = [["Role", "Backend Engineer"], ["Industry", "Fintech"], ["Skills", "Go · Kafka"], ["iX Score", "≥ 80"]] as const;
const POOL = [3000, 412, 138, 52, 24];
const CATS = ["Technical", "Problem solving", "Communication", "Role fit"];
// phase: 0..4 filters applied · 5 results sorted · 6 open top candidate · 7 shortlisted
const STEPS_MS = [0, 900, 1700, 2500, 3300, 4300, 5800, 7200];
const LOOP = 10200;

function usePhase(run: boolean, last: number) {
  const reduce = useReducedMotion();
  const [p, setP] = useState(reduce ? last : 0);
  useEffect(() => {
    if (reduce || !run) return;
    let ts: ReturnType<typeof setTimeout>[] = [];
    const go = () => { ts = STEPS_MS.map((at, k) => setTimeout(() => setP(k), at)); ts.push(setTimeout(go, LOOP)); };
    go();
    return () => ts.forEach(clearTimeout);
  }, [reduce, run]);
  return reduce ? last : p;
}

function ScoreDial({ v, size = 46, on = true }: { v: number; size?: number; on?: boolean }) {
  const r = 18, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 44 44" className="size-full -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#ECEBF6" strokeWidth="4" />
        <motion.circle cx="22" cy="22" r={r} fill="none" stroke="url(#ixt-dial)" strokeWidth="4" strokeLinecap="round" strokeDasharray={c}
          initial={false} animate={{ strokeDashoffset: on ? c * (1 - v / 100) : c }} transition={{ duration: 0.9, ease }} />
        <defs><linearGradient id="ixt-dial" x1="0" x2="1"><stop stopColor="#8E83F5" /><stop offset="1" stopColor="#5AA8FF" /></linearGradient></defs>
      </svg>
      <span className={cn("absolute inset-0 grid place-items-center font-extrabold", INK)} style={{ fontSize: size * 0.3 }}>{v}</span>
    </div>
  );
}

export function TalentConsole() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const p = usePhase(inView, 7);
  const applied = Math.min(p, 4);
  const sorted = p >= 5;
  const order = sorted ? CANDS : [CANDS[2], CANDS[0], CANDS[1]];
  return (
    <div ref={ref} className="relative">
      <BrowserFrame url="interviewtrix.com/dashboard/ix-recruiter" dark={false}>
        <div className="p-4 sm:p-5">
          {/* search + filters */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-[#FBFBFD] px-3 py-2.5">
            <Search className="size-4 text-muted-foreground" />
            <span className="text-[13px] text-muted-foreground">Search verified iX Talent</span>
            <Mono className="ml-auto rounded-md bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
              <motion.span key={applied} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>{POOL[applied].toLocaleString("en-IN")}{applied === 0 ? "+" : ""}</motion.span> MATCHES
            </Mono>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {FILTERS.map(([k, v], i) => {
              const on = i < applied;
              return (
                <span key={k} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition-all duration-300",
                  on ? "border-primary/40 bg-primary/[0.08] text-[#2E3656]" : "border-dashed border-border text-muted-foreground")}>
                  <Filter className={cn("size-3", on ? "text-primary" : "")} />
                  <span className="text-muted-foreground">{k}</span>
                  <span className={cn("font-medium", !on && "opacity-50")}>{v}</span>
                  {on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="size-3 text-primary" /></motion.span>}
                </span>
              );
            })}
          </div>

          {/* results */}
          <div className="relative mt-4 grid gap-2.5">
            <AnimatePresence initial={false}>
              {order.map((c, k) => {
                const top = sorted && k === 0;
                const picked = top && p >= 7;
                return (
                  <motion.div key={c.i} layout transition={{ layout: { duration: 0.6, ease } }}
                    className={cn("flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5 transition-colors duration-500",
                      top && p >= 6 ? "border-primary/50 shadow-[0_12px_30px_-18px_rgba(115,103,240,.8)]" : "border-border",
                      applied < 3 && k > 0 && "opacity-60")}>
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[12px] font-bold text-white", c.tone)}>{c.i}</span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("flex items-center gap-1.5 truncate text-[13.5px] font-semibold", INK)}>{c.name}<BadgeCheck className="size-3.5 shrink-0 text-primary" /></p>
                      <p className="truncate text-[11.5px] text-muted-foreground">{c.role}</p>
                    </div>
                    <div className="hidden w-[92px] gap-1 sm:grid">
                      {c.bars.map((b, j) => (
                        <div key={j} className="h-1 overflow-hidden rounded-full bg-[#EFEEF6]">
                          <motion.div className="h-full rounded-full bg-gradient-to-r from-[#8E83F5] to-[#5AA8FF]" initial={false} animate={{ width: sorted ? `${b}%` : "15%" }} transition={{ duration: 0.8, delay: j * 0.06, ease }} />
                        </div>
                      ))}
                    </div>
                    <ScoreDial v={c.score} size={40} on={applied >= 4} />
                    <span className={cn("hidden h-7 items-center gap-1 rounded-lg px-2.5 text-[11.5px] font-semibold transition-colors sm:inline-flex",
                      picked ? "bg-success text-white" : "border border-border text-[#2E3656]")}>
                      {picked ? <><Check className="size-3.5" />Shortlisted</> : "Shortlist"}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* the opened report */}
          <AnimatePresence>
            {p >= 6 && (
              <motion.div key="report" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.5, ease }} className="overflow-hidden">
                <div className="mt-3 grid gap-3 rounded-xl border border-border bg-[#FBFBFD] p-3 sm:grid-cols-[132px_minmax(0,1fr)]">
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-[linear-gradient(135deg,#1B2340,#2E3656)]">
                    <span className="absolute inset-0 grid place-items-center"><span className="grid size-8 place-items-center rounded-full bg-white/15 backdrop-blur"><Play className="size-3.5 fill-white text-white" /></span></span>
                    <Mono className="absolute bottom-1 left-1.5 text-[9px] text-white/70">SESSION · 24:10</Mono>
                  </div>
                  <div className="grid content-center gap-1.5">
                    <Mono className="text-[10px] text-primary">iX REPORT · AARAV R.</Mono>
                    {CATS.map((cat, j) => (
                      <div key={cat} className="flex items-center gap-2 text-[11px]">
                        <span className="w-[92px] shrink-0 truncate text-muted-foreground">{cat}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EAE9F4]">
                          <motion.div className="h-full rounded-full bg-gradient-to-r from-[#8E83F5] to-[#5AA8FF]" initial={{ width: 0 }} animate={{ width: `${CANDS[0].bars[j]}%` }} transition={{ delay: 0.2 + j * 0.1, duration: 0.7, ease }} />
                        </div>
                        <Mono className="w-6 text-right text-[10.5px] text-[#2E3656]">{CANDS[0].bars[j]}</Mono>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </BrowserFrame>

      {/* shortlist toast */}
      <AnimatePresence>
        {p >= 7 && (
          <motion.div key="toast" initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.4, ease }}
            className="absolute -bottom-6 right-4 flex items-center gap-2.5 rounded-2xl border border-border bg-white px-3.5 py-2.5 shadow-[0_24px_50px_-20px_rgba(40,30,110,.5)] sm:-right-4">
            <span className="grid size-7 place-items-center rounded-full bg-success/15"><UserCheck className="size-4 text-success" /></span>
            <span className="leading-tight"><span className={cn("block text-[12.5px] font-semibold", INK)}>Added to pipeline</span><Mono className="text-[10px] text-muted-foreground">SHORTLIST · 1 OF 24</Mono></span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TalentHero({ onBecome }: { onBecome: () => void }) {
  const reduce = useReducedMotion();
  const fade = (d: number) => (reduce ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: d, duration: 0.65, ease } });
  return (
    <section className="relative overflow-clip pb-24 pt-28 md:pb-28 md:pt-40">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_75%_30%,rgba(115,103,240,.2),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_85%)]" />
      <GridRunners />
      <div className={cn(WRAP, "grid items-start gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.18fr)] lg:gap-12")}>
        {/* top-aligned: the console grows when a report opens, and the copy shouldn't move with it */}
        <div className="lg:pt-10">
          <motion.div {...fade(0)}>
            <Mono className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-3 py-1.5 text-[11px] text-primary shadow-sm backdrop-blur">
              <Users className="size-3.5" />HIRE iX TALENT · FOR RECRUITERS
            </Mono>
          </motion.div>
          <motion.h1 {...fade(0.06)} className={cn("mt-6 text-[38px] font-black leading-[1] tracking-[-0.055em] sm:text-[52px] lg:text-[50px] xl:text-[60px]", INK)}>
            Hire interview-ready talent with verified <span className={HL}>iX Scores.</span>
          </motion.h1>
          <motion.p {...fade(0.12)} className="mt-5 max-w-[50ch] text-[17px] leading-relaxed text-[#4B5275]">
            Search verified candidates across industries, review full iX Reports and interview video, and shortlist with confidence—not guesswork.
          </motion.p>
          <motion.div {...fade(0.18)} className="mt-8 flex flex-wrap gap-3">
            <BecomeButton onClick={onBecome} />
            <Button asChild variant="outline" className="h-12 rounded-xl border-border bg-white px-6 text-[15.5px] text-[#2E3656] hover:border-primary/40">
              <Link href={BROWSE_HREF}>Browse iX Talent</Link>
            </Button>
          </motion.div>
          <motion.ul {...fade(0.24)} className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-muted-foreground">
            {["Verified iX Scores", "Full reports & video", "Free to apply"].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Check className="size-4 text-primary" />{t}</li>
            ))}
          </motion.ul>
        </div>
        <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.8, ease }}>
          <TalentConsole />
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────── logos + numbers ─────────── */

const LOGOS = ["amazon", "razorpay", "tcs", "deloitte", "paypal", "walmart", "accenture", "bosch-group"];

export function TalentLogos() {
  return (
    <section className="border-y border-[#E7E6F2] bg-white py-12">
      <p className="mb-7 text-center text-[13.5px] text-muted-foreground">Candidates practise here for roles at</p>
      <div className="mask-x overflow-hidden">
        <div className="flex w-max items-center gap-16 [animation:marquee_40s_linear_infinite]">
          {[...LOGOS, ...LOGOS].map((l, i) => (
            <Image key={i} src={`/marketing-2026/logos/${l}.png`} alt={i < LOGOS.length ? l : ""} width={110} height={30} className="h-7 w-auto opacity-60 grayscale" />
          ))}
        </div>
      </div>
    </section>
  );
}

const STATS: { to: number; label: string; icon: LucideIcon }[] = [
  { to: 3000, label: "Verified iX Talent profiles", icon: Users },
  { to: 8, label: "Industries covered", icon: Building2 },
  { to: 250, label: "Recruiters on InterviewTrix", icon: ClipboardList },
];

export function TalentStats() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { once: true, amount: 0.5 });
  return (
    <section className={DARK}>
      <div className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-25" />
      <div className={WRAP}>
        <Head dark n="01" label="iX Talent at a glance" title={<>Verified talent <span className="bg-gradient-to-r from-[#A99FFF] to-[#7CC0FF] bg-clip-text text-transparent">across industries.</span></>} />
        <div ref={ref} className="grid gap-4 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: i * 0.1, duration: 0.6, ease }}
              className="rounded-[22px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <s.icon className="size-5 text-sky-300" />
              <p className="mt-5 text-[46px] font-black leading-none tracking-[-0.05em] text-white md:text-[56px]">
                <CountUp to={s.to} run={on} />+
              </p>
              <p className="mt-2 text-[14.5px] text-[#9FB3CF]">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── why iX Talent: four cards, each with its own moving picture ─────────── */

function ArtScore({ on }: { on: boolean }) {
  return (
    <div className="flex h-full items-center justify-center gap-4">
      <ScoreDial v={88} size={78} on={on} />
      <div className="grid gap-1.5">
        {[72, 88, 64].map((w, i) => (
          <motion.span key={i} className="h-2 rounded-full bg-gradient-to-r from-[#8E83F5] to-[#5AA8FF]" initial={false} animate={{ width: on ? w : 8 }} transition={{ delay: 0.3 + i * 0.12, duration: 0.7, ease }} />
        ))}
      </div>
    </div>
  );
}
function ArtReport({ on }: { on: boolean }) {
  return (
    <div className="flex h-full items-center justify-center gap-3 px-5">
      <div className="relative aspect-video w-[110px] overflow-hidden rounded-lg bg-[linear-gradient(135deg,#1B2340,#2E3656)]">
        <span className="absolute inset-0 grid place-items-center">
          <motion.span className="grid size-8 place-items-center rounded-full bg-white/20" animate={on ? { scale: [1, 1.12, 1] } : {}} transition={{ duration: 1.8, repeat: Infinity }}><Play className="size-3.5 fill-white text-white" /></motion.span>
        </span>
        <div className="absolute inset-x-2 bottom-1.5 h-0.5 rounded-full bg-white/20"><motion.div className="h-full rounded-full bg-sky-300" initial={false} animate={{ width: on ? "64%" : "0%" }} transition={{ duration: 2.4, ease: "linear" }} /></div>
      </div>
      <div className="grid w-[96px] gap-1.5">
        {[100, 80, 92, 60].map((w, i) => (
          <motion.span key={i} className={cn("h-1.5 rounded-full", i === 1 ? "bg-[#FFE07A]" : "bg-[#E4E2F2]")} style={{ width: `${w}%` }} initial={false} animate={{ opacity: on ? 1 : 0.3 }} transition={{ delay: 0.2 + i * 0.15 }} />
        ))}
      </div>
    </div>
  );
}
function ArtFilters({ on }: { on: boolean }) {
  return (
    <div className="flex h-full flex-wrap content-center justify-center gap-1.5 px-5">
      {["Backend", "Fintech", "Go", "Kafka", "iX ≥ 80", "Bengaluru"].map((t, i) => (
        <motion.span key={t} initial={false} animate={on ? { opacity: 1, scale: 1 } : { opacity: 0.35, scale: 0.92 }} transition={{ delay: 0.15 + i * 0.12, duration: 0.35 }}
          className={cn("rounded-full border px-2.5 py-1 text-[11.5px]", i % 2 === 0 ? "border-primary/40 bg-primary/[0.08] text-primary" : "border-border bg-white text-[#2E3656]")}>{t}</motion.span>
      ))}
    </div>
  );
}
function ArtPipeline({ on }: { on: boolean }) {
  const cols = ["Found", "Review", "Offer"];
  return (
    <div className="relative grid h-full grid-cols-3 gap-2 px-4 py-6">
      {cols.map((c) => (
        <div key={c} className="rounded-lg border border-dashed border-[#DAD8EA] p-1.5">
          <Mono className="text-[9px] text-muted-foreground">{c.toUpperCase()}</Mono>
          <div className="mt-1.5 h-4 rounded bg-[#ECEBF6]" />
        </div>
      ))}
      <motion.div className="absolute top-[52%] h-5 w-[22%] rounded bg-gradient-to-r from-[#8E83F5] to-[#5AA8FF] shadow-[0_8px_18px_-8px_rgba(115,103,240,.9)]"
        initial={false} animate={on ? { left: ["7%", "39%", "71%"] } : { left: "7%" }}
        transition={{ duration: 2.4, times: [0, 0.5, 1], ease: "easeInOut", repeat: on ? Infinity : 0, repeatDelay: 1 }} />
    </div>
  );
}

const WHY: { icon: LucideIcon; title: string; body: string; art: (p: { on: boolean }) => React.ReactNode }[] = [
  { icon: ShieldCheck, title: "Verified iX Score", body: "Every candidate completes AI mock interviews and earns a standardized iX Score you can trust.", art: ArtScore },
  { icon: Video, title: "Full interview reports & video", body: "Review transcripts, category scores, and session recordings before you ever schedule a call.", art: ArtReport },
  { icon: Filter, title: "Rich filters", body: "Search by role, industry, skills, and iX Score to build a shortlist in minutes.", art: ArtFilters },
  { icon: ClipboardList, title: "Hiring pipeline", body: "Track candidates from discovery to offer—all in one recruiter dashboard.", art: ArtPipeline },
];

function WhyCard({ w, i }: { w: (typeof WHY)[number]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.5 });
  const Art = w.art;
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: (i % 2) * 0.1, duration: 0.6, ease }}
      className="flex flex-col overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_24px_50px_-40px_rgba(30,20,80,.6)]">
      <div className="h-[160px] border-b border-[#EEEDF5] bg-[linear-gradient(180deg,#FAFAFE,#F2F1FC)]"><Art on={on} /></div>
      <div className="p-6">
        <w.icon className="size-5 text-primary" />
        <h3 className={cn("mt-3 text-[20px] font-bold tracking-[-0.02em]", INK)}>{w.title}</h3>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{w.body}</p>
      </div>
    </motion.div>
  );
}

export function TalentWhy() {
  return (
    <section className={LIGHT}>
      <div className={WRAP}>
        <Head n="02" label="Why iX Talent" title={<>Don&apos;t just search. <span className={HL}>Hire with proof.</span></>}
          sub="InterviewTrix connects you to candidates who have already proven their skills in realistic AI interviews." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w, i) => <WhyCard key={w.title} w={w} i={i} />)}
        </div>
      </div>
    </section>
  );
}

/* ─────────── the 60-second demo film ─────────── */

export function TalentFilm() {
  const ref = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (inView) v.play().catch(() => {}); else v.pause();
  }, [inView]);
  return (
    <section className={SKY}>
      <div className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-60" />
      <div className={WRAP}>
        <Head n="03" label="See it work" title={<>Search, review, shortlist. <span className={HL}>In one minute.</span></>}
          sub={hireIxTalentDemoVideo.description} />
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease }}>
          {/* the recording already has its own browser bar, so no frame around it */}
          <div className="mx-auto max-w-[980px] overflow-hidden rounded-[20px] border border-border bg-white shadow-[0_40px_80px_-30px_rgba(15,20,45,.45)]">
            <video ref={ref} src={hireIxTalentDemoVideo.videoUrl} poster={hireIxTalentDemoVideo.thumbnailUrl} muted loop playsInline preload="metadata"
              aria-label={hireIxTalentDemoVideo.name} className="block aspect-video w-full bg-white object-contain" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────── how it works ─────────── */

const HOW: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: ShieldCheck, title: "Apply & get verified", body: "Submit your recruiter profile. Our team verifies individual and company registrations." },
  { icon: Search, title: "Search & shortlist", body: "Filter verified iX Talent by role, industry, skills, and score—then build your shortlist." },
  { icon: UserCheck, title: "Review reports & hire", body: "Read full iX Reports, watch interview video, and move top candidates through your pipeline." },
];

export function TalentHow() {
  const ref = useRef<HTMLOListElement>(null);
  const on = useInView(ref, { once: true, amount: 0.4 });
  return (
    <section className="relative overflow-clip border-t border-[#E7E6F2] bg-white py-24 md:py-32">
      <div className={WRAP}>
        <Head n="04" label="How it works" title={<>From application to <span className={HL}>shortlist.</span></>}
          sub="Get verified as a recruiter, then search, review, and hire from one dashboard." />
        <ol ref={ref} className="relative grid gap-5 md:grid-cols-3 md:gap-6">
          {/* the rail that fills as the steps come in (desktop) */}
          <div aria-hidden className="absolute left-[calc(16.66%+12px)] right-[calc(16.66%+12px)] top-[27px] hidden h-0.5 rounded-full bg-[#ECEBF6] md:block">
            <motion.div className="h-full origin-left rounded-full bg-gradient-to-r from-[#8E83F5] to-[#5AA8FF]" initial={{ scaleX: 0 }} animate={{ scaleX: on ? 1 : 0 }} transition={{ duration: 1.4, delay: 0.3, ease }} />
          </div>
          {HOW.map((h, i) => (
            <motion.li key={h.title} initial={{ opacity: 0, y: 18 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 + i * 0.35, duration: 0.6, ease }} className="relative md:text-center">
              <span className="relative z-10 grid size-14 place-items-center rounded-2xl border border-primary/20 bg-white shadow-[0_12px_30px_-16px_rgba(115,103,240,.8)] md:mx-auto">
                <h.icon className="size-6 text-primary" />
              </span>
              <Mono className="mt-5 block text-[12px] text-primary">STEP {String(i + 1).padStart(2, "0")}</Mono>
              <h3 className={cn("mt-2 text-[21px] font-bold tracking-[-0.02em]", INK)}>{h.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground md:mx-auto md:max-w-[32ch]">{h.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─────────── outcomes ─────────── */

const GAME: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: TrendingUp, title: "Evidence-led shortlisting", body: "Replace resume keyword guessing with verified interview performance and category scores." },
  { icon: Building2, title: "Talent across industries", body: "From tech and finance to healthcare and consulting—discover interview-ready candidates everywhere." },
  { icon: Zap, title: "Faster hiring cycles", body: "Skip early screening rounds when candidates arrive with iX Reports and video already on file." },
  { icon: Rocket, title: "Quality that scales", body: "InterviewTrix prepares candidates before they reach you—so every profile is worth your time." },
];

export function TalentOutcomes() {
  return (
    <section className={LIGHT}>
      <div className={WRAP}>
        <Head n="05" label="Changing the hiring game" title={<>How InterviewTrix is <span className={HL}>transforming hiring.</span></>}
          sub="Candidates arrive interview-ready with verified scores and full reports—so recruiters spend time on the right people, not the wrong resumes." />
        <div className="grid gap-px overflow-hidden rounded-[24px] border border-border bg-border sm:grid-cols-2">
          {GAME.map((g, i) => (
            <motion.div key={g.title} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: i * 0.1, duration: 0.6 }}
              className="group flex gap-4 bg-white p-6 transition-colors hover:bg-[#FBFAFF] sm:p-8">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/[0.08] transition-transform group-hover:scale-105"><g.icon className="size-5 text-primary" /></span>
              <div>
                <h3 className={cn("text-[19px] font-bold tracking-[-0.02em]", INK)}>{g.title}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted-foreground">{g.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── closing ─────────── */

export function TalentFinal({ onBecome }: { onBecome: () => void }) {
  return (
    <section className="ix-sheet relative overflow-clip bg-[linear-gradient(180deg,#F8F7FF_0%,#EEEBFF_100%)] pb-28 pt-28 text-center">
      <div className="pointer-events-none absolute -inset-x-1/2 bottom-0 h-[52%] origin-bottom [transform:perspective(500px)_rotateX(62deg)] bg-[linear-gradient(rgba(115,103,240,.28)_1px,transparent_1px),linear-gradient(90deg,rgba(115,103,240,.28)_1px,transparent_1px)] bg-[length:64px_64px] opacity-60 [mask-image:linear-gradient(to_top,#000_10%,transparent_85%)]" />
      <div className="relative mx-auto max-w-[900px] px-5">
        <h2 className={cn("text-[36px] font-black leading-[1] tracking-[-0.05em] sm:text-[56px] md:text-[72px]", INK)}>
          Don&apos;t just post jobs. <span className={HL}>Hire to win.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-[52ch] text-[17px] leading-relaxed text-[#4B5275]">Apply to become a verified recruiter and start searching interview-ready iX Talent today.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <BecomeButton onClick={onBecome} />
          <Button asChild variant="outline" className="h-12 rounded-xl border-border bg-white px-6 text-[15.5px] text-[#2E3656] hover:border-primary/40">
            <Link href={BROWSE_HREF}>Browse iX Talent</Link>
          </Button>
        </div>
        <Mono className="mt-5 block text-[12px] text-muted-foreground">FREE TO APPLY · VERIFIED RECRUITER ACCESS</Mono>
      </div>
    </section>
  );
}

/** Phones only: keeps "Become Recruiter" in reach once the hero buttons scroll away. */
export function TalentStickyCta({ onBecome }: { onBecome: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 640 && window.scrollY < document.documentElement.scrollHeight - window.innerHeight - 900);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ y: 90 }} animate={{ y: 0 }} exit={{ y: 90 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/90 p-2 pl-4 shadow-[0_20px_50px_-20px_rgba(30,20,90,.6)] backdrop-blur-xl md:hidden">
          <div className="min-w-0 flex-1"><p className={cn("truncate text-[14px] font-bold", INK)}>Hire iX Talent</p><Mono className="text-[10.5px] text-muted-foreground">FREE TO APPLY</Mono></div>
          <Button type="button" onClick={onBecome} className="h-11 rounded-xl px-4 text-[14.5px]">Become Recruiter <ArrowRight /></Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
