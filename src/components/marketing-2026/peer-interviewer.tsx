"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { Fragment } from "react";
import { ArrowRight, BadgeCheck, CalendarDays, Check, Circle, IndianRupee, LayoutDashboard, ShieldCheck, Star, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrowserFrame, LoopVideo, Mono, SoundToggle } from "./primitives";
import { CircuitTraces, GridRunners } from "./graphics";
import { CountUp, Dots, ease, Head, HL, INK, LAVENDER, LIGHT, StickyCta, WRAP } from "./landing-kit";
import { cn } from "@/lib/utils";
import { usePeerRounds } from "./PeerRoundsProvider";
import { countWord } from "./peer-rounds";
import { mk26Asset } from "./assets";
import { MK26_ROUTES } from "./cta";
import { StartLink } from "./StartLink";
import Link from "next/link";

/**
 * Become a Peer Interviewer: the supply side of the peer marketplace, on the same kit as the product pages.
 * hero → 01 how it works → 02 a session, start to finish (dark film) → 03 rounds & what you could earn → 04 your profile in the directory.
 * Every claim is something live today: verification, rate caps per round, 30–60 min slots, pay-after-accept, Meet + recording + peer report.
 */

/* rate caps per round, in rupees (platform maximums; you set your own price up to these) */
// round types and caps come from the backend via <PeerRoundsProvider> (see ./peer-rounds)
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

/* ═══════════════ HERO: the interviewer dashboard, live ═══════════════ */

const REQUESTS = [
  { who: "Aarav R.", role: "Backend SDE-2 · Razorpay loop", round: "System design", when: "Thu · 8:00 pm", price: 650 },
  { who: "Meera K.", role: "Frontend · first job switch", round: "Live coding", when: "Sat · 11:00 am", price: 600 },
  { who: "Rohan P.", role: "Engineering manager · Series B", round: "Managerial", when: "Sun · 6:30 pm", price: 450 },
];

function BookingCard({ r, phase }: { r: (typeof REQUESTS)[number]; phase: number }) {
  // phase: 0 new request · 1 accepted · 2 Meet link created · 3 paid into your ledger
  return (
    <div className="rounded-2xl border border-border bg-white p-4 text-left shadow-[0_24px_50px_-30px_rgba(30,20,90,.55)]">
      <div className="flex items-center justify-between">
        <Mono className="text-[10.5px] text-primary">{phase === 0 ? "● NEW BOOKING REQUEST" : phase === 1 ? "✓ ACCEPTED" : phase === 2 ? "✓ MEET LINK READY" : "✓ COMPLETED · PAID"}</Mono>
        <Mono className="text-[10.5px] text-muted-foreground">{r.when}</Mono>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#2E3656] text-[12px] font-bold text-white">{r.who.split(" ").map((x) => x[0]).join("")}</span>
        <div className="min-w-0"><p className={cn("truncate text-[15px] font-bold", INK)}>{r.who}</p><p className="truncate text-[12.5px] text-muted-foreground">{r.role}</p></div>
        <div className="ml-auto text-right"><p className={cn("text-[17px] font-extrabold", INK)}>{inr(r.price)}</p><Mono className="text-[10px] text-muted-foreground">{r.round.toUpperCase()}</Mono></div>
      </div>
      <div className="mt-3 flex h-9 items-center gap-2">
        {phase === 0 && (<>
          <motion.span animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-[13px] font-semibold text-white">Accept</motion.span>
          <span className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-[13px] text-[#4B5275]">Decline</span>
          <Mono className="ml-auto text-[10px] text-muted-foreground">CANDIDATE PAYS AFTER YOU ACCEPT</Mono>
        </>)}
        {phase === 1 && <Mono className="text-[11.5px] text-emerald-700">Payment held · creating your Google Meet link…</Mono>}
        {phase === 2 && <span className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#E8F3FF] px-3 text-[12.5px] font-medium text-[#1F6FEB]"><Video className="size-4" />meet.google.com/ixp-wrd-kqa</span>}
        {phase === 3 && <span className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-50 px-3 text-[12.5px] font-semibold text-emerald-700"><IndianRupee className="size-4" />{inr(r.price)} added to your earnings</span>}
      </div>
    </div>
  );
}

export function PiHero() {
  const ROUNDS = usePeerRounds();
  const reduce = useReducedMotion();
  const [k, setK] = useState(0);
  const [phase, setPhase] = useState(0);
  const [earned, setEarned] = useState(4250);
  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => {
      if (phase < 3) { setPhase(phase + 1); if (phase + 1 === 3) setEarned((e) => e + REQUESTS[k].price); }
      else { setPhase(0); setK((x) => (x + 1) % REQUESTS.length); }
    }, phase === 0 ? 2600 : phase === 3 ? 2400 : 1500);
    return () => clearTimeout(t);
  }, [phase, k, reduce]);

  return (
    <section className="relative overflow-clip pb-24 pt-36 md:pt-44">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_78%_45%,rgba(115,103,240,.20),transparent_70%),radial-gradient(30%_40%_at_95%_15%,rgba(31,143,255,.12),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_70%)]" />
      <GridRunners />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div>
          <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-3 rounded-2xl border border-white bg-white/80 py-2 pl-2 pr-4 shadow-[0_14px_34px_-18px_rgba(75,63,208,.55),inset_0_1px_0_#fff] backdrop-blur">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] text-white shadow-[0_8px_18px_-6px_rgba(115,103,240,.8)]"><Users className="size-5" /></span>
            <span className="leading-tight">
              <span className={cn("block text-[17px] font-extrabold tracking-[-0.02em]", INK)}>Peer Interviewer</span>
              <Mono className="text-[11px] text-muted-foreground">VERIFIED · YOUR RATES · YOUR HOURS</Mono>
            </span>
          </motion.div>
          <motion.h1 initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.7, ease }}
            className={cn("mt-7 text-[42px] font-black leading-[0.98] tracking-[-0.055em] md:text-[60px] xl:text-[66px]", INK)}>
            You&apos;ve sat on the panel. Now <span className={HL}>get paid</span> for{" "}
            <span className="relative inline-block whitespace-nowrap">running one.
              <svg aria-hidden viewBox="0 0 520 24" preserveAspectRatio="none" className="absolute -bottom-1 left-[2%] h-[0.18em] w-[92%] overflow-visible">
                <defs><linearGradient id="pi-ul" x1="0" x2="1"><stop offset="0" stopColor="#7367F0" stopOpacity=".8" /><stop offset="1" stopColor="#1F8FFF" stopOpacity=".8" /></linearGradient></defs>
                <motion.path d="M4 16 C 120 4, 260 22, 516 8" fill="none" stroke="url(#pi-ul)" strokeWidth="7" strokeLinecap="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.8, duration: 0.9, ease }} />
              </svg>
            </span>
          </motion.h1>
          <p className="mt-7 max-w-[48ch] text-[17px] text-[#4B5275] md:text-[18.5px]">
            <span className="max-md:hidden">Run live mock interviews for candidates preparing for real loops. Pick your rounds, set your price, open a few evening slots. Candidates pay only after you accept.</span>
            <span className="md:hidden">Run live mock interviews. Your rounds, your price, your hours.</span>
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild className="h-12 rounded-xl px-6 text-[15.5px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90"><Link href={MK26_ROUTES.peerApply} scroll={false}>Apply to interview <ArrowRight /></Link></Button>
            <StartLink href={MK26_ROUTES.peerDashboard} className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#2E3656] hover:text-primary">
              <span className="grid size-9 place-items-center rounded-full border border-border bg-white"><LayoutDashboard className="size-4" /></span>Interviewer dashboard
            </StartLink>
          </div>
          <Mono className="mt-4 block text-[12px] text-muted-foreground">Free to apply · Reviewed in 24–48 hours</Mono>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[13px] text-muted-foreground max-md:hidden">Run</span>
            {ROUNDS.map((r) => <span key={r.k} className="rounded-full border border-border bg-white px-3 py-1.5 text-[13px] font-medium text-[#2E3656]">{r.k}</span>)}
          </div>
        </div>

        <motion.div initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.9, ease }}>
          <BrowserFrame dark={false} url="app.interviewtrix.com/dashboard/peer-interviews/interviewer" className="shadow-[0_60px_120px_-40px_rgba(40,30,140,.55)]">
            <div className="space-y-3 bg-[#F6F5FB] p-4">
              {/* ledger strip */}
              <div className="grid grid-cols-3 gap-2">
                {[["THIS MONTH", <><CountUp key={earned} to={earned} run />{""}</>, "earnings"], ["SESSIONS", "7", "completed"], ["RATING", "4.8", "from candidates"]].map(([k, v, s]) => (
                  <div key={k as string} className="rounded-xl border border-border bg-white p-3">
                    <Mono className="text-[9.5px] text-muted-foreground">{k}</Mono>
                    <p className={cn("mt-0.5 text-[20px] font-extrabold leading-none", INK)}>{k === "THIS MONTH" ? "₹" : ""}{v}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{s}</p>
                  </div>
                ))}
              </div>
              {/* the request, fixed height so phases never move the page */}
              <div className="grid">
                {REQUESTS.map((r) => <div key={r.who} aria-hidden className="invisible [grid-area:1/1]"><BookingCard r={r} phase={0} /></div>)}
                <AnimatePresence mode="wait">
                  <motion.div key={`${k}-${phase === 0 ? 0 : 1}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="[grid-area:1/1]">
                    <BookingCard r={REQUESTS[k]} phase={phase} />
                  </motion.div>
                </AnimatePresence>
              </div>
              {/* this week */}
              <div className="rounded-xl border border-border bg-white p-3">
                <div className="flex items-center justify-between"><Mono className="text-[9.5px] text-muted-foreground">THIS WEEK · YOUR SLOTS</Mono><Mono className="text-[9.5px] text-emerald-700">● AVAILABLE</Mono></div>
                <div className="mt-2 grid grid-cols-7 gap-1">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <div key={i} className="text-center">
                      <Mono className="text-[9.5px] text-muted-foreground">{d}</Mono>
                      <div className="mt-1 space-y-1">{[0, 1].map((j) => { const open = (i * 3 + j) % 4 !== 1 && i !== 2; const booked = (i === 3 && j === 0) || (i === 5 && j === 0); return <span key={j} className={cn("block h-4 rounded", booked ? "bg-primary" : open ? "bg-primary/15" : "bg-muted")} />; })}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </BrowserFrame>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════ TICKER ═══════════════ */

const FACTS = ["Verified interviewers only", "Every round type price-capped", "Your price, up to the round cap", "30–60 minute slots", "Pay-after-accept bookings", "Google Meet, recorded", "Earnings ledger in your dashboard", "Accept only what you want"];
export function PiTicker() {
  return (
    <div className="relative overflow-hidden border-y border-[#E7E6F2] bg-white/60 py-4">
      <div className="mask-x flex w-max gap-10 [animation:marquee_40s_linear_infinite]">
        {[...FACTS, ...FACTS].map((f, i) => (
          <Mono key={i} aria-hidden={i >= FACTS.length} className="flex items-center gap-10 whitespace-nowrap text-[13px] uppercase tracking-wider text-[#4B5275]">
            {f}<span className="size-2 rotate-45 rounded-[2px] bg-primary/60" />
          </Mono>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ 01 · HOW IT WORKS (coded screens, auto-advancing) ═══════════════ */

function StepVerify({ on }: { on: boolean }) {
  const rows = [["Work email", "priya@<company>.com"], ["Corporate ID", "uploaded · front + back"], ["LinkedIn", "linked"], ["Rounds", "Live coding · System design"]];
  return (
    <div className="space-y-2">
      {rows.map(([k, v], i) => (
        <motion.div key={k} initial={{ opacity: 0, x: -8 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.1 + i * 0.15 }} className="flex items-center gap-3 rounded-xl border border-border bg-white px-3.5 py-2.5">
          <span className="grid size-6 place-items-center rounded-full bg-emerald-500 text-white"><Check className="size-3.5" /></span>
          <span className="text-[13.5px] font-semibold text-[#2E3656]">{k}</span><span className="ml-auto truncate text-[12.5px] text-muted-foreground">{v}</span>
        </motion.div>
      ))}
      <motion.div initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : {}} transition={{ delay: 0.9 }} className="flex items-center gap-2 rounded-xl bg-[#E9E7FD] px-3.5 py-2.5 text-[13px] font-semibold text-[#5A4BE0]">
        <BadgeCheck className="size-4" />In review · usually 24–48 hours
      </motion.div>
    </div>
  );
}
function StepPrice({ on }: { on: boolean }) {
  const ROUNDS = usePeerRounds();
  return (
    <div className="space-y-2.5">
      {ROUNDS.slice(0, 4).map((r, i) => {
        const mine = Math.round((r.cap * [0.9, 0.86, 0.93, 0.8][i]) / 50) * 50;
        return (
          <div key={r.k} className="rounded-xl border border-border bg-white px-3.5 py-2.5">
            <div className="flex items-center justify-between text-[13px]"><span className="font-semibold text-[#2E3656]">{r.k} <span className="font-normal text-muted-foreground">· {r.min} min</span></span><span className="font-bold text-[#2E3656]">{inr(mine)}</span></div>
            <div className="relative mt-2 h-1.5 rounded-full bg-muted">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#1F8FFF]" initial={{ width: 0 }} animate={on ? { width: `${(mine / r.cap) * 100}%` } : {}} transition={{ delay: 0.2 + i * 0.12, duration: 0.7, ease }} />
            </div>
            <Mono className="mt-1 block text-right text-[9.5px] text-muted-foreground">CAP {inr(r.cap)}</Mono>
          </div>
        );
      })}
    </div>
  );
}
function StepSlots({ on }: { on: boolean }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], times = ["7 pm", "8 pm", "9 pm", "11 am"];
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <div className="mb-2 flex gap-1.5">{["Available", "Away", "Offline"].map((s, i) => <span key={s} className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-semibold", i === 0 ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground")}>{i === 0 ? "● " : ""}{s}</span>)}</div>
      <div className="grid grid-cols-[44px_repeat(7,minmax(0,1fr))] gap-1">
        <span />{days.map((d) => <Mono key={d} className="text-center text-[9.5px] text-muted-foreground">{d.toUpperCase()}</Mono>)}
        {times.map((t, r) => (
          <Fragment key={t}><Mono className="self-center text-[9.5px] text-muted-foreground">{t}</Mono>
            {days.map((d, c) => { const open = r < 3 ? (c < 5 && (c + r) % 2 === 0) : c >= 5; return (
              <motion.span key={d + t} initial={{ scale: 0.5, opacity: 0 }} animate={on ? { scale: 1, opacity: 1 } : {}} transition={{ delay: 0.1 + (r * 7 + c) * 0.025 }}
                className={cn("h-6 rounded-md", open ? "bg-primary/80" : "bg-muted")} />); })}
          </Fragment>
        ))}
      </div>
      <Mono className="mt-2 block text-[10px] text-muted-foreground">9 SLOTS OPEN · 45 MIN EACH · GOOGLE MEET</Mono>
    </div>
  );
}
function StepEarn({ on }: { on: boolean }) {
  const led = [["Aarav R. · System design", 650], ["Meera K. · Live coding", 600], ["Rohan P. · Managerial", 450], ["Sana M. · Screening", 250]];
  return (
    <div className="rounded-xl border border-border bg-white p-3.5">
      <div className="flex items-end justify-between"><Mono className="text-[10px] text-muted-foreground">EARNINGS LEDGER</Mono><p className={cn("text-[22px] font-extrabold leading-none", INK)}>₹<CountUp to={1950} run={on} /></p></div>
      <ul className="mt-3 divide-y divide-border">
        {led.map(([k, v], i) => (
          <motion.li key={k as string} initial={{ opacity: 0, y: 6 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 + i * 0.15 }} className="flex items-center justify-between py-2 text-[13px]">
            <span className="text-[#2E3656]">{k}</span><span className="font-semibold text-emerald-700">+{inr(v as number)}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

const STEPS = [
  { k: "APPLY & GET VERIFIED", t: "Prove you've been in the room.", d: "Work email, corporate ID and the rounds you're strongest at. The team reviews every application.", C: StepVerify },
  { k: "SET YOUR ROUNDS & PRICE", t: "Decide what each round is worth.", d: "Pick your rounds and set a price for each, up to the platform cap for that round.", C: StepPrice },
  { k: "PUBLISH SLOTS", t: "Open a few evenings. Or none this week.", d: "30–60 minute slots on your calendar. Switch to Away or Offline whenever you like.", C: StepSlots },
  { k: "RUN SESSIONS & EARN", t: "Accept, interview, get paid.", d: "Candidates pay when you accept. Every completed session lands in your earnings ledger.", C: StepEarn },
];
export function PiSteps() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.4 });
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!on || paused || reduce) return;
    const id = setTimeout(() => setI((x) => (x + 1) % STEPS.length), 5200);
    return () => clearTimeout(id);
  }, [i, on, paused, reduce]);
  const S = STEPS[i].C;
  return (
    <section className={LIGHT}>
      <Dots />
      <div ref={ref} className={WRAP} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <Head n="01" label="How it works" nowrap title={<>From application to your <span className={HL}>first booking.</span></>} />
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
          <ol className="space-y-2">
            {STEPS.map((st, k) => {
              const active = k === i;
              return (
                <li key={st.k}>
                  <button onClick={() => setI(k)} className={cn("relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300", active ? "border-white bg-white/90 shadow-[0_20px_40px_-24px_rgba(75,63,208,.45)]" : "border-transparent hover:bg-white/50")}>
                    <div className="flex items-center gap-3">
                      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl font-[family-name:var(--font-geist-mono)] text-[12px] font-bold", active ? "bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] text-white" : "bg-white text-muted-foreground")}>0{k + 1}</span>
                      <div className="min-w-0"><Mono className="text-[10.5px] text-primary">{st.k}</Mono><p className={cn("text-[16.5px] font-bold tracking-tight", active ? INK : "text-[#4B5275]/70")}>{st.t}</p></div>
                    </div>
                    <AnimatePresence initial={false}>
                      {active && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-12 text-[14.5px] text-muted-foreground"><span className="block pt-2">{st.d}</span></motion.p>}
                    </AnimatePresence>
                    {active && <span className="absolute inset-x-4 bottom-0 h-[3px] overflow-hidden rounded-full bg-primary/10">
                      <motion.span key={`${i}-${paused}`} className="block h-full origin-left rounded-full bg-gradient-to-r from-[#7367F0] to-[#1F8FFF]" initial={{ scaleX: 0 }} animate={{ scaleX: paused || reduce || !on ? 0.02 : 1 }} transition={{ duration: paused || reduce || !on ? 0.2 : 5.2, ease: "linear" }} />
                    </span>}
                  </button>
                </li>
              );
            })}
          </ol>
          <BrowserFrame dark={false} url="app.interviewtrix.com/dashboard/peer-interviews/onboarding">
            <div className="grid min-h-[360px] place-items-center bg-[#F6F5FB] p-5">
              <AnimatePresence mode="wait">
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="w-full max-w-[460px]"><S on /></motion.div>
              </AnimatePresence>
            </div>
          </BrowserFrame>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 02 · A SESSION, START TO FINISH (dark film) ═══════════════ */

// a behavioural round: both sides are real recordings, lip-synced; `ms` leaves a beat after `say`
type Who = "YOU" | "CANDIDATE";
const SESSION: { k: string; ms: number; say?: number; who?: Who; clip?: string; text?: string }[] = [
  { k: "Join", ms: 2600 },
  { k: "Interview", ms: 5600, say: 5100, who: "YOU", clip: "pi-you-1", text: "Hi Rohan, thanks for making the time. To start, tell me a little about yourself." },
  { k: "Interview", ms: 11100, say: 10540, who: "CANDIDATE", clip: "pi-cand-1", text: "Sure. So I'm a backend engineer, about four years now at a fintech startup. Mostly I work on our payments API… and lately I've started mentoring two juniors on the team." },
  { k: "Interview", ms: 6900, say: 6370, who: "YOU", clip: "pi-you-2", text: "Nice. Tell me about a time you disagreed with a teammate on a technical decision. How did it play out?" },
  { k: "Interview", ms: 16200, say: 15670, who: "CANDIDATE", clip: "pi-cand-2", text: "Hmm, yeah… last quarter our lead wanted to rewrite a slow service, and I thought we could just fix the queries. So I put both options in a short doc, with numbers. We tried my fix for a week — latency dropped forty percent, and we parked the rewrite." },
  { k: "Interview", ms: 2400, say: 1850, who: "YOU", clip: "pi-you-3", text: "And how did your lead take that?" },
  { k: "Interview", ms: 8800, say: 8260, who: "CANDIDATE", clip: "pi-cand-3", text: "Honestly, better than I expected. He said the doc made it easy to decide… so now we do that for every big change." },
  { k: "Interview", ms: 5100, say: 4500, who: "YOU", clip: "pi-you-4", text: "That's a great habit. Okay, let's switch to something more technical." },
  { k: "Report", ms: 5200 },
  { k: "Paid", ms: 3600 },
];
const SCH = ["Join", "Interview", "Report", "Paid"];

/** One side of the call: a silent listening loop, with the current line's clip mounted over it from its first frame. */
function CallTile({ name, sub, listen, line, talking, sound, live }: { name: string; sub: string; listen: string; line?: string; talking: boolean; sound: boolean; live: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      <div className="relative aspect-[4/3]">
        <div className="absolute inset-0"><LoopVideo name={listen} className="!aspect-auto h-full" priority={live} /></div>
        {line && (
          <div key={line} className={cn("absolute inset-0 transition-opacity duration-200", talking ? "opacity-100" : "opacity-0")}>
            <LoopVideo name={line.split("#")[0]} loop={false} sound={sound} className="!aspect-auto h-full" priority />
          </div>
        )}
      </div>
      <span className={cn("pointer-events-none absolute inset-0 rounded-xl ring-2 transition-colors duration-300", talking ? "ring-sky-400/80" : "ring-transparent")} />
      <span className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white backdrop-blur">
        {talking ? <span className="flex h-2.5 items-end gap-[2px]">{[0, 1, 2].map((k) => <motion.span key={k} className="w-[2px] rounded-full bg-sky-300" animate={{ height: [3, 9, 3] }} transition={{ duration: 0.6, repeat: Infinity, delay: k * 0.12 }} />)}</span> : <span className="size-1.5 rounded-full bg-white/40" />}
        <span className="font-medium">{name}</span><span className="text-white/60">· {sub}</span>
      </span>
    </div>
  );
}

export function PiSession() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.35 });
  const [b, setB] = useState(0);
  const [restart, setRestart] = useState(0);
  const [sound, setSound] = useState(false);
  const [t0, setT0] = useState(0);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (reduce) { setB(SESSION.length - 1); return; }
    if (!on) return;
    const start = performance.now(); setT0(start); setNow(start);
    const t = setTimeout(() => setB((x) => (x + 1) % SESSION.length), SESSION[b].ms);
    const tick = setInterval(() => setNow(performance.now()), 100);
    return () => { clearTimeout(t); clearInterval(tick); };
  }, [b, on, reduce, restart]);
  const beat = SESSION[b], ch = SCH.indexOf(beat.k);
  const jump = (k: string) => { setB(SESSION.findIndex((x) => x.k === k)); setRestart((r) => r + 1); };
  const elapsed = ["00:00", "02:05", "02:16", "14:30", "14:41", "16:02", "16:05", "16:20", "45:00", "45:00"][b];
  const talking = (w: Who) => beat.who === w && now - t0 < (beat.say ?? 0);
  const line = (w: Who) => (beat.who === w && beat.clip ? `${beat.clip}#${restart}` : undefined);

  return (
    <section className="grain relative overflow-clip bg-[hsl(var(--ix-navy))] py-24 text-[#EAF2FF] md:py-32">
      <CircuitTraces className="opacity-50" />
      <div className="pointer-events-none absolute -inset-x-1/2 bottom-0 h-[42%] origin-bottom [transform:perspective(520px)_rotateX(58deg)] bg-[linear-gradient(rgba(31,143,255,.28)_2px,transparent_2px),linear-gradient(90deg,rgba(31,143,255,.28)_2px,transparent_2px)] bg-[length:90px_90px] opacity-50 [mask-image:linear-gradient(to_top,#000_10%,transparent_85%)]" />
      <div ref={ref} className={WRAP}>
        <Head dark n="02" label="A session, start to finish" title={<>You bring the questions. <span className="bg-gradient-to-r from-[#A99CFF] to-[#5CC2FF] bg-clip-text pr-[0.06em] text-transparent">We handle the rest.</span></>}
          aside={<Mono className="mb-3 inline-block rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[11.5px] text-sky-300">● GOOGLE MEET · RECORDED · REPORTED</Mono>}
          sub="The room, the recording and the report are set up for you. Your job is the part only a person who's been on the panel can do." />
        <div className="mx-auto max-w-[1040px]">
          <div className="relative">
          <SoundToggle sound={sound} onToggle={() => setSound((x) => !x)} className="absolute -top-5 right-5" />
          {/* warm the cache so each line starts on its first frame, not after a fetch */}
          {on && <div aria-hidden className="hidden">{SESSION.filter((x) => x.clip).map((x) => <video key={x.clip} src={mk26Asset(`/video/${x.clip}.mp4`)} preload="auto" muted />)}</div>}
          <BrowserFrame url="meet.google.com/ixp-wrd-kqa · InterviewTrix peer session">
            <div className="relative aspect-[16/9] bg-[#0B0F17] max-sm:aspect-auto">
              {/* the call: you on the left, the candidate on the right */}
              <div className="grid h-full grid-cols-2 content-center gap-2.5 p-3 pb-20 pt-12 max-sm:grid-cols-1 max-sm:pb-3">
                <CallTile name="You" sub="interviewer" listen="pi-you-listen" line={line("YOU")} talking={talking("YOU")} sound={sound} live={on} />
                <CallTile name="Rohan S." sub="candidate" listen="pi-cand-listen" line={line("CANDIDATE")} talking={talking("CANDIDATE")} sound={sound} live={on} />
              </div>
              {/* top bar: recording + timer */}
              <div className="pointer-events-none absolute left-3 right-3 top-3 flex items-center justify-between max-sm:static max-sm:px-3 max-sm:pb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white"><motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="size-2 rounded-full bg-[#E5484D]" />REC · {elapsed}</span>
                <span className="rounded-full bg-black/60 px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[10.5px] text-white/80">BEHAVIOURAL · 45 MIN</span>
              </div>
              {/* captions */}
              <AnimatePresence>
                {beat.text && (
                  <motion.div key={b} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-x-[6%] bottom-4 z-10 max-sm:static max-sm:mx-3 max-sm:mb-3">
                    <p className="rounded-xl bg-black/75 px-4 py-2.5 text-[13.5px] leading-snug text-white backdrop-blur md:text-[15px]"><Mono className={cn("mr-2 text-[10px]", beat.who === "YOU" ? "text-sky-300" : "text-white/60")}>{beat.who}</Mono>{beat.text}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* join */}
              <AnimatePresence>
                {beat.k === "Join" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 grid place-items-center bg-[#0B0F17]/80 backdrop-blur-sm">
                    <div className="w-[min(92%,380px)] rounded-2xl bg-white p-5 text-[#2E3656]">
                      <Mono className="text-[10px] text-primary">STARTING · THU 8:00 PM</Mono>
                      <p className="mt-1 text-[17px] font-bold">Rohan S. · Behavioural</p>
                      <ul className="mt-3 space-y-1.5 text-[13px]">
                        {["Payment held until the session ends", "Recording on for both of you", "His resume and target role attached"].map((x, i) => (
                          <motion.li key={x} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.2 }} className="flex items-center gap-2"><Check className="size-4 text-emerald-600" />{x}</motion.li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* report: the draft is written for you, you add your judgement */}
              <AnimatePresence>
                {beat.k === "Report" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 grid place-items-center bg-[#0B0F17]/75 p-4 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 220, damping: 20 }} className="w-full max-w-[480px] rounded-2xl bg-white p-5 text-[#2E3656]">
                      <div className="flex items-center justify-between"><Mono className="text-[10px] text-primary">PEER REPORT · DRAFT FROM THE RECORDING</Mono><Mono className="text-[10px] text-muted-foreground">45 MIN</Mono></div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {[["Structure", 4], ["Ownership", 4], ["Communication", 5]].map(([k, v], i) => (
                          <div key={k as string} className="rounded-lg bg-[#F4F3FB] p-2.5">
                            <Mono className="text-[9.5px] text-muted-foreground">{String(k).toUpperCase()}</Mono>
                            <div className="mt-1 flex gap-0.5">{[0, 1, 2, 3, 4].map((s) => <motion.span key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.15 + s * 0.05 }}><Star className={cn("size-3.5", s < (v as number) ? "fill-amber-400 text-amber-400" : "text-[#D9DBE6]")} /></motion.span>)}</div>
                          </div>
                        ))}
                      </div>
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-3 rounded-lg border border-dashed border-primary/40 bg-[#F8F7FF] p-2.5 text-[12.5px]">
                        <Mono className="mr-1.5 text-[9.5px] text-primary">YOUR NOTE</Mono>Disagreed with data, not opinion. Next time, say what you&apos;d have done if the fix hadn&apos;t worked.
                      </motion.p>
                      <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }} className="mt-3 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-[13px] font-semibold text-white">Submit report</motion.span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* paid */}
              <AnimatePresence>
                {beat.k === "Paid" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 grid place-items-center bg-[#0B0F17]/75 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.92, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 220, damping: 18 }} className="flex items-center gap-4 rounded-2xl bg-white p-4 pr-6 text-[#2E3656]">
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 14 }} className="grid size-11 place-items-center rounded-full bg-emerald-500 text-white"><IndianRupee className="size-5" /></motion.span>
                      <div><p className="text-[16px] font-bold">₹650 added to your earnings</p><Mono className="text-[10.5px] text-muted-foreground">SESSION COMPLETE · RATED 5★ BY ROHAN</Mono></div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </BrowserFrame>
          </div>
          <div className="mt-5 grid grid-cols-4 gap-2">
            {SCH.map((x, i) => (
              <button key={x} onClick={() => jump(x)} className="group text-left">
                <span className="block h-1 overflow-hidden rounded-full bg-white/15">
                  {i < ch && <span className="block h-full w-full rounded-full bg-white/50" />}
                  {i === ch && <motion.span key={`${SESSION.findIndex((s) => s.k === x)}-${restart}`} className="block h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#5CC2FF]" initial={{ width: "0%" }} animate={{ width: on && !reduce ? "100%" : "4%" }} transition={{ duration: on && !reduce ? SESSION.filter((s) => s.k === x).reduce((n, s) => n + s.ms, 0) / 1000 : 0.2, ease: "linear" }} />}
                </span>
                <Mono className={cn("mt-2 block truncate text-[10.5px] uppercase transition-colors", i === ch ? "text-white" : "text-white/45 group-hover:text-white/75")}>0{i + 1} · {x}</Mono>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 03 · ROUNDS & WHAT YOU COULD EARN (calculator) ═══════════════ */

export function PiEarnings() {
  const ROUNDS = usePeerRounds();
  const [pick, setPick] = useState<string[]>(["Live coding", "System design"]);
  const [price, setPrice] = useState<Record<string, number>>(Object.fromEntries(ROUNDS.map((r) => [r.k, Math.round((r.cap * 0.85) / 50) * 50])));
  const [perWeek, setPerWeek] = useState(4);
  const chosen = ROUNDS.filter((r) => pick.includes(r.k));
  const avg = chosen.length ? chosen.reduce((n, r) => n + price[r.k], 0) / chosen.length : 0;
  const month = Math.round(avg * perWeek * 4.3);
  const hours = Math.round((chosen.length ? chosen.reduce((n, r) => n + r.min, 0) / chosen.length : 0) * perWeek / 60 * 10) / 10;
  const toggle = (k: string) => setPick((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k]));

  return (
    <section className={LAVENDER}>
      <div className={WRAP}>
        <Head n="03" label="Rounds & earnings" title={<>Pick your rounds. <span className={HL}>See what a few evenings are worth.</span></>}
          sub={`${countWord(ROUNDS.length)} round types, each with a platform price cap. You set your own price at or below it.`} />
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {ROUNDS.map((r) => {
              const on = pick.includes(r.k);
              return (
                <div key={r.k} className={cn("rounded-2xl border p-4 transition-all duration-200", on ? "border-[#7367F0] bg-white shadow-[0_14px_30px_-18px_rgba(115,103,240,.7)]" : "border-border bg-white/70")}>
                  <button onClick={() => toggle(r.k)} className="flex w-full items-center gap-3 text-left">
                    <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border", on ? "border-[#7367F0] bg-[#7367F0] text-white" : "border-border")}>{on && <Check className="size-3.5" />}</span>
                    <span className={cn("text-[15px] font-semibold", INK)}>{r.k}</span>
                    <Mono className="ml-auto text-[10.5px] text-muted-foreground">{r.min} MIN</Mono>
                  </button>
                  <div className={cn("mt-3 transition-opacity", on ? "opacity-100" : "pointer-events-none opacity-35")}>
                    <div className="flex items-center justify-between text-[12.5px]"><span className="text-muted-foreground">Your price</span><span className={cn("font-bold", INK)}>{inr(price[r.k])}</span></div>
                    <input type="range" min={100} max={r.cap} step={50} value={price[r.k]} aria-label={`${r.k} price`} onChange={(e) => setPrice((p) => ({ ...p, [r.k]: Number(e.target.value) }))} className="mt-1.5 w-full accent-[#7367F0]" />
                    <Mono className="block text-right text-[9.5px] text-muted-foreground">CAP {inr(r.cap)}</Mono>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rounded-[24px] bg-[#0B1A30] p-6 text-white shadow-[0_40px_80px_-40px_rgba(30,20,90,.8)] lg:sticky lg:top-28">
            <Mono className="text-[11px] text-sky-300">ESTIMATE · SESSION VALUE</Mono>
            <div className="mt-4">
              <div className="flex items-center justify-between text-[13.5px] text-[#CFE0F7]"><span>Sessions a week</span><span className="font-bold text-white">{perWeek}</span></div>
              <input type="range" min={1} max={12} value={perWeek} aria-label="Sessions a week" onChange={(e) => setPerWeek(Number(e.target.value))} className="mt-2 w-full accent-[#5CC2FF]" />
            </div>
            <p className="mt-6 text-[48px] font-extrabold leading-none tracking-tight">{inr(month)}</p>
            <p className="mt-1 text-[13.5px] text-[#9FB3CF]">a month, at about {hours} hours a week</p>
            <div className="mt-5 space-y-1.5 border-t border-white/10 pt-4 text-[13px] text-[#CFE0F7]">
              <p>Average price <span className="float-right text-white">{inr(Math.round(avg))}</span></p>
              <p>Rounds you run <span className="float-right text-white">{chosen.length || "—"}</span></p>
            </div>
            <p className="mt-4 text-[11.5px] leading-relaxed text-white/45">An estimate of what your booked sessions are worth, before any platform fees. Actual bookings depend on demand for your rounds and slots.</p>
            <Link href={MK26_ROUTES.peerApply} scroll={false} className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-sky-300 hover:underline">Apply to interview <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 04 · YOUR PROFILE IN THE DIRECTORY ═══════════════ */

export function PiProfile() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.35, once: true });
  const trust = [
    { i: ShieldCheck, t: "Verified before you're listed", d: "Work email and corporate ID checked, so candidates trust the badge." },
    { i: IndianRupee, t: "Paid before you're in the room", d: "Candidates pay when you accept. No chasing anyone afterwards." },
    { i: CalendarDays, t: "Only the bookings you want", d: "Accept or decline every request. Go Away or Offline any time." },
    { i: Video, t: "Room, recording and report, done", d: "A Meet link per session, recorded, with a peer report you finish in minutes." },
  ];
  return (
    <section className={LIGHT}>
      <Dots />
      <div ref={ref} className={WRAP}>
        <Head n="04" label="Your profile" title={<>Candidates find you, <span className={HL}>not the other way round.</span></>}
          sub="Approved interviewers appear in a directory candidates filter by round, industry, role, experience and rating." />
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* directory card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease }}>
            <BrowserFrame dark={false} url="app.interviewtrix.com/dashboard/peer-interviews">
              <div className="bg-[#F6F5FB] p-4">
                <div className="flex flex-wrap gap-1.5">
                  {["System design", "Fintech", "Backend", "8+ yrs", "4.5★ +"].map((f, i) => (
                    <motion.span key={f} initial={{ opacity: 0, scale: 0.8 }} animate={on ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.2 + i * 0.08 }} className="rounded-full bg-[#2E3656] px-2.5 py-1 text-[11.5px] font-medium text-white">{f}</motion.span>
                  ))}
                </div>
                <div className="mt-3 rounded-2xl border border-[#7367F0] bg-white p-4 shadow-[0_0_0_3px_rgba(115,103,240,.15)]">
                  <div className="flex items-start gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] text-[15px] font-bold text-white">YOU</span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("flex items-center gap-1.5 text-[16px] font-bold", INK)}>Your name <BadgeCheck className="size-4 text-[#1F8FFF]" /></p>
                      <p className="text-[12.5px] text-muted-foreground">Senior engineer · payments · 9 years</p>
                      <p className="mt-1 flex items-center gap-1 text-[12.5px]"><Star className="size-3.5 fill-amber-400 text-amber-400" /><span className="font-semibold text-[#2E3656]">4.9</span><span className="text-muted-foreground">· 23 sessions</span></p>
                    </div>
                    <div className="text-right"><Mono className="text-[10px] text-muted-foreground">FROM</Mono><p className={cn("text-[18px] font-extrabold", INK)}>₹450</p></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">{["System design", "Live coding", "Managerial"].map((r) => <span key={r} className="rounded-md bg-[#E9E7FD] px-2 py-0.5 text-[11.5px] font-medium text-[#5A4BE0]">{r}</span>)}</div>
                  <div className="mt-3 grid grid-cols-4 gap-1.5">
                    {["Thu 8 pm", "Fri 7 pm", "Sat 11 am", "Sun 6 pm"].map((s, i) => (
                      <motion.span key={s} initial={{ opacity: 0, y: 4 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.6 + i * 0.1 }} className={cn("rounded-lg border py-1.5 text-center text-[11.5px] font-medium", i === 0 ? "border-[#7367F0] bg-[#7367F0] text-white" : "border-border text-[#2E3656]")}>{s}</motion.span>
                    ))}
                  </div>
                </div>
                <div className="mt-2 space-y-2 opacity-50">
                  {["Senior engineer · e-commerce · 7 yrs", "Staff engineer · infra · 11 yrs"].map((x) => (
                    <div key={x} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3"><span className="size-9 rounded-full bg-muted" /><span className="text-[12.5px] text-muted-foreground">{x}</span><Circle className="ml-auto size-3 text-muted-foreground" /></div>
                  ))}
                </div>
              </div>
            </BrowserFrame>
          </motion.div>
          {/* why it works for you */}
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {trust.map(({ i: I, t, d }, n) => (
              <motion.li key={t} initial={{ opacity: 0, y: 12 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 + n * 0.12, duration: 0.5, ease }} className="rounded-2xl border border-border bg-white p-5">
                <span className="grid size-9 place-items-center rounded-xl bg-[#E9E7FD] text-[#5A4BE0]"><I className="size-[18px]" /></span>
                <p className={cn("mt-3 text-[16px] font-bold tracking-tight", INK)}>{t}</p>
                <p className="mt-1 text-[14px] text-muted-foreground max-md:hidden">{d}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export const PiStickyCta = () => <StickyCta product="Peer Interviewer" cta="Apply now" href={MK26_ROUTES.peerApply} />;
