"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight, BadgeCheck, Briefcase, CalendarDays, Check, ChevronDown, LayoutDashboard, MousePointer2, Search, Star, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrowserFrame, LoopVideo, Mono, SoundToggle } from "./primitives";
import { CircuitTraces, GridRunners } from "./graphics";
import { CountUp, DARK, Dots, ease, Head, HL, INK, LAVENDER, LIGHT, StickyCta, useFocusCamera, Wiring, WRAP } from "./landing-kit";
import { usePeerRounds } from "./PeerRoundsProvider";
import { countWord } from "./peer-rounds";
import { cn } from "@/lib/utils";
import { MK26_ROUTES } from "./cta";
import { StartLink } from "./StartLink";

/**
 * Peer Interviews (candidate side): book a verified engineer for a live mock round.
 * hero → booking film (a coded recreation of /dashboard/peer-interviews/book, filmed with a zoom camera and cursor)
 * → 01 why a person → 02 after the call (report tour) → 03 rounds & prices → 04 one memory.
 */

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const PEOPLE = [
  { n: "Arjun Mehta", r: "Staff engineer · infra", ind: "Cloud", y: 11, s: 4.8, p: 650, t: ["System design", "Live coding"] },
  { n: "Artur Nowak", r: "Senior engineer · payments", ind: "Fintech", y: 9, s: 4.9, p: 600, t: ["System design", "Live coding"] },
  { n: "Kavya Rao", r: "Engineering manager", ind: "SaaS", y: 12, s: 4.9, p: 450, t: ["Managerial", "Culture fit / HR"] },
  { n: "Dev Shah", r: "SDE-3 · checkout", ind: "E-commerce", y: 7, s: 4.7, p: 500, t: ["Live coding"] },
  { n: "Isha Nair", r: "Senior frontend engineer", ind: "Fintech", y: 8, s: 4.8, p: 550, t: ["Live coding", "System design"] },
  { n: "Rahul Verma", r: "Principal engineer", ind: "Fintech", y: 14, s: 4.9, p: 700, t: ["System design"] },
];
const PICK = 1; // Artur
const initials = (n: string) => n.split(" ").map((x) => x[0]).join("");

/* ═══════════════ the booking film ═══════════════ */

type FS = "all" | "search" | "list" | "card" | "slots" | "confirm" | "booked";
const STAGES: { f: FS; k: string; ms: number }[] = [
  { f: "all", k: "Open", ms: 1600 },
  { f: "search", k: "Search", ms: 3600 },
  { f: "list", k: "Browse", ms: 3400 },
  { f: "card", k: "Choose", ms: 2400 },
  { f: "slots", k: "Pick a slot", ms: 3200 },
  { f: "confirm", k: "Request", ms: 2800 },
  { f: "booked", k: "Booked", ms: 3800 },
];
const QUERY = "system design · payments";
const DAYS = [["Wed", "12"], ["Thu", "13"], ["Fri", "14"], ["Sat", "15"], ["Sun", "16"]];
const TIMES = ["7:00 pm", "8:00 pm", "9:00 pm"];

/** Offset of `el` inside `root`, ignoring transforms (the camera scales `root`). */
function offsetIn(el: HTMLElement, root: HTMLElement) {
  let x = 0, y = 0, n: HTMLElement | null = el;
  while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
  return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
}

export function BookingFilm({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.3 });
  const [i, setI] = useState(0);
  const [t, setT] = useState(0);
  const [restart, setRestart] = useState(0);
  const st = STAGES[i];
  const at = (f: FS) => STAGES.findIndex((s) => s.f === f);

  useEffect(() => {
    if (reduce) { setI(STAGES.length - 1); setT(1); return; }
    if (!on) return;
    let raf = 0; const t0 = performance.now();
    const tick = (n: number) => { const k = Math.min(1, (n - t0) / st.ms); setT(k); if (k < 1) raf = requestAnimationFrame(tick); else { setI((x) => (x + 1) % STAGES.length); setT(0); } };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [i, on, reduce, st.ms, restart]);

  const { vp, root, reg, cam } = useFocusCamera<FS>(st.f, "all", 1.9);
  const past = (f: FS) => i > at(f) || (i === at(f) && t > 0.55);

  // what's on screen at this moment
  const typed = i > at("search") ? QUERY.length : i === at("search") ? Math.floor(Math.min(1, t * 1.6) * QUERY.length) : 0;
  const filtered = past("search");
  const scroll = i === at("list") ? Math.sin(Math.min(1, t) * Math.PI) * 240 : 0; // scroll down through the results, then back up
  const chosen = i >= at("card") && (i > at("card") || t > 0.6);
  const slot = past("slots") ? 1 : -1, day = 1;
  const requested = past("confirm");
  const booked = i === at("booked");

  // the cursor goes to whatever is being clicked next
  const tgt = useRef<Record<string, HTMLElement | null>>({});
  const tref = (k: string) => (el: HTMLElement | null) => { tgt.current[k] = el; };
  const [cur, setCur] = useState({ x: 520, y: 330 });
  const want = st.f === "search" ? (t < 0.65 ? "input" : "chip") : st.f === "list" ? "list" : st.f === "card" ? "view" : st.f === "slots" ? "time" : st.f === "confirm" ? "request" : st.f === "booked" ? "toast" : "none";
  useLayoutEffect(() => {
    const el = tgt.current[want], r = root.current;
    if (el && r) setCur(offsetIn(el, r));
  }, [want, root, filtered, chosen]);
  const clicking = (st.f === "search" && t > 0.6 && t < 0.72) || (st.f === "card" && t > 0.55 && t < 0.68) || (st.f === "slots" && t > 0.5 && t < 0.62) || (st.f === "confirm" && t > 0.5 && t < 0.62);

  const people = filtered ? [PEOPLE[0], PEOPLE[1], PEOPLE[5], PEOPLE[4]] : PEOPLE;
  const artur = PEOPLE[PICK];

  return (
    <div ref={ref} className={className}>
      <BrowserFrame dark={false} url="app.interviewtrix.com/dashboard/peer-interviews/book">
        <div ref={vp} className="relative aspect-[16/10] overflow-hidden bg-[#F6F5FB]">
          <motion.div ref={root} className="absolute left-0 top-0 w-[1000px]" style={{ originX: 0, originY: 0 }}
            animate={{ x: cam.x, y: cam.y, scale: cam.s }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 80, damping: 20, mass: 1 }}>
            <div className="grid h-[625px] grid-cols-[170px_minmax(0,1fr)] text-left">
              {/* sidebar */}
              <aside className="border-r border-[#E7E6F2] bg-white p-3">
                <p className="mb-4 px-2 text-[15px] font-extrabold text-[#2E3656]"><span className="text-[#7367F0]">iX</span> InterviewTrix</p>
                {[["Dashboard", LayoutDashboard], ["AI interviews", Video], ["Peer interviews", Users], ["Bookings", CalendarDays]].map(([k, I]) => {
                  const Ic = I as typeof Users;
                  return <p key={k as string} className={cn("mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px]", k === "Peer interviews" ? "bg-[#E9E7FD] font-semibold text-[#5A4BE0]" : "text-[#4B5275]")}><Ic className="size-3.5" />{k as string}</p>;
                })}
              </aside>

              <main className="relative overflow-hidden p-5">
                <div className="flex items-end justify-between">
                  <div><p className="text-[20px] font-extrabold text-[#2E3656]">Book a peer interview</p><p className="text-[12.5px] text-[#6B7194]">Verified interviewers. You pay only after they accept.</p></div>
                  <Mono className="text-[10.5px] text-[#6B7194]">{filtered ? "4 MATCHES" : "126 INTERVIEWERS"}</Mono>
                </div>

                {/* search + filters */}
                <div ref={reg("search")} className={cn("mt-4 rounded-2xl border bg-white p-3 transition-all duration-500", st.f === "search" ? "border-[#7367F0] shadow-[0_0_0_3px_rgba(115,103,240,.18)]" : "border-[#E7E6F2]")}>
                  <div ref={tref("input")} className="flex items-center gap-2 rounded-xl border border-[#E7E6F2] px-3 py-2">
                    <Search className="size-4 text-[#9AA0B8]" />
                    <span className="text-[13px] text-[#2E3656]">{QUERY.slice(0, typed) || <span className="text-[#9AA0B8]">Search by skill, company type or role…</span>}</span>
                    {st.f === "search" && typed < QUERY.length && <span className="h-4 w-[2px] animate-pulse bg-[#7367F0]" />}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span ref={tref("chip")} className={cn("rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors", filtered ? "border-[#2E3656] bg-[#2E3656] text-white" : "border-[#E7E6F2] text-[#4B5275]")}>System design</span>
                    {["Industry: Fintech", "5+ yrs", "This week"].map((f) => <span key={f} className={cn("rounded-full border px-2.5 py-1 text-[11.5px] transition-colors", filtered ? "border-[#7367F0]/40 bg-[#F1EEFF] text-[#5A4BE0]" : "border-[#E7E6F2] text-[#6B7194]")}>{f}</span>)}
                    <span className="ml-auto inline-flex items-center gap-1 rounded-lg border border-[#E7E6F2] px-2.5 py-1 text-[11.5px] text-[#4B5275]">Rating: highest first <ChevronDown className="size-3" /></span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_300px] gap-4">
                  {/* results */}
                  <div ref={reg("list")} className={cn("relative h-[420px] overflow-hidden rounded-2xl transition-shadow duration-500", st.f === "list" && "shadow-[0_0_0_3px_rgba(115,103,240,.18)]")}>
                    <div ref={tref("list")} className="absolute inset-x-0 top-1/2" />
                    <motion.div animate={{ y: -scroll }} transition={{ duration: 0 }} className="space-y-2.5">
                      {[...people, ...PEOPLE.slice(2, 4)].map((p, k) => {
                        const isArtur = p.n === artur.n;
                        return (
                          <div key={p.n + k} ref={isArtur ? reg("card") : undefined}
                            className={cn("rounded-2xl border bg-white p-3.5 transition-all duration-500", isArtur && chosen ? "border-[#7367F0] shadow-[0_0_0_3px_rgba(115,103,240,.2)]" : "border-[#E7E6F2]", st.f === "card" && !isArtur && "opacity-40")}>
                            <div className="flex items-start gap-3">
                              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#7367F0]/10 text-[12px] font-bold text-[#7367F0]">{initials(p.n)}</span>
                              <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-1 text-[14px] font-semibold text-[#2E3656]">{p.n}<BadgeCheck className="size-3.5 text-[#1F8FFF]" /></p>
                                <p className="truncate text-[12px] text-[#6B7194]">{p.r} · {p.ind}</p>
                              </div>
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700"><Star className="size-3 fill-amber-500 text-amber-500" />{p.s}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">{p.t.map((x) => <span key={x} className="rounded-md bg-[#F1F1F6] px-1.5 py-0.5 text-[10.5px] text-[#6B7194]">{x}</span>)}</div>
                            <div className="mt-2.5 flex items-center justify-between border-t border-[#EEEEF4] pt-2.5">
                              <p className="text-[12.5px]"><span className="text-[#6B7194]">From </span><span className="font-bold text-[#2E3656]">{inr(p.p)}</span><span className="ml-1.5 text-[11px] text-[#9AA0B8]">· {p.y}+ yrs</span></p>
                              <span ref={isArtur ? tref("view") : undefined} className={cn("rounded-lg px-3 py-1.5 text-[11.5px] font-semibold", isArtur && chosen ? "bg-[#5A4BE0] text-white" : "bg-[#7367F0] text-white")}>View slots</span>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  </div>

                  {/* slot picker + confirm */}
                  <div className="space-y-3">
                    <div ref={reg("slots")} className={cn("rounded-2xl border bg-white p-3.5 transition-all duration-500", st.f === "slots" ? "border-[#7367F0] shadow-[0_0_0_3px_rgba(115,103,240,.18)]" : "border-[#E7E6F2]")}>
                      {chosen ? (
                        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
                          <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-[#7367F0]/10 text-[11px] font-bold text-[#7367F0]">AN</span><div><p className="text-[13px] font-semibold text-[#2E3656]">{artur.n}</p><Mono className="text-[9.5px] text-[#6B7194]">SYSTEM DESIGN · 60 MIN</Mono></div></div>
                          <div className="mt-3 grid grid-cols-5 gap-1">
                            {DAYS.map(([d, n], k) => <div key={d} className={cn("rounded-lg border py-1.5 text-center", k === day ? "border-[#7367F0] bg-[#F1EEFF]" : "border-[#E7E6F2]")}><Mono className="block text-[9px] text-[#6B7194]">{d.toUpperCase()}</Mono><span className="text-[13px] font-semibold text-[#2E3656]">{n}</span></div>)}
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-1.5">
                            {TIMES.map((x, k) => <span key={x} ref={k === 1 ? tref("time") : undefined} className={cn("rounded-lg border py-1.5 text-center text-[12px] font-medium transition-colors", k === slot ? "border-[#7367F0] bg-[#7367F0] text-white" : "border-[#E7E6F2] text-[#2E3656]")}>{x}</span>)}
                          </div>
                        </motion.div>
                      ) : <div className="grid h-[150px] place-items-center text-center text-[12.5px] text-[#9AA0B8]">Choose an interviewer<br />to see open slots</div>}
                    </div>
                    <div ref={reg("confirm")} className={cn("rounded-2xl border bg-white p-3.5 transition-all duration-500", st.f === "confirm" ? "border-[#7367F0] shadow-[0_0_0_3px_rgba(115,103,240,.18)]" : "border-[#E7E6F2]")}>
                      <Mono className="text-[9.5px] text-[#6B7194]">YOUR BOOKING</Mono>
                      <div className="mt-1.5 space-y-1 text-[12.5px]">
                        <p className="flex justify-between"><span className="text-[#6B7194]">When</span><span className="font-medium text-[#2E3656]">{slot >= 0 ? "Thu 13 · 8:00 pm" : "—"}</span></p>
                        <p className="flex justify-between"><span className="text-[#6B7194]">Round</span><span className="font-medium text-[#2E3656]">{chosen ? "System design" : "—"}</span></p>
                        <p className="flex justify-between"><span className="text-[#6B7194]">Price</span><span className="font-bold text-[#2E3656]">{chosen ? inr(artur.p) : "—"}</span></p>
                      </div>
                      <span ref={tref("request")} className={cn("mt-3 flex h-9 items-center justify-center rounded-lg text-[12.5px] font-semibold transition-colors", requested ? "bg-emerald-500 text-white" : slot >= 0 ? "bg-[#7367F0] text-white" : "bg-[#F1F1F6] text-[#9AA0B8]")}>
                        {requested ? "✓ Request sent" : "Request booking"}
                      </span>
                      <Mono className="mt-1.5 block text-center text-[9px] text-[#6B7194]">YOU PAY ONLY AFTER {artur.n.split(" ")[0].toUpperCase()} ACCEPTS</Mono>
                    </div>
                  </div>
                </div>

                {/* accepted → paid → booked: always mounted (only fades) so the camera can measure it */}
                <motion.div ref={reg("booked")} initial={false} animate={booked ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -12, scale: 0.96 }} transition={{ type: "spring", stiffness: 240, damping: 20 }}
                  aria-hidden={!booked} className="pointer-events-none absolute right-5 top-5 z-10 w-[330px] rounded-2xl border border-emerald-200 bg-white p-4 shadow-[0_30px_60px_-24px_rgba(20,60,40,.45)]">
                  <div ref={tref("toast")} className="flex items-center gap-3">
                    <motion.span key={`tick-${booked}`} initial={{ scale: 0 }} animate={{ scale: booked ? 1 : 0 }} transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 14 }} className="grid size-10 place-items-center rounded-full bg-emerald-500 text-white"><Check className="size-5" /></motion.span>
                    <div><p className="text-[14px] font-bold text-[#2E3656]">Booked with Artur Nowak</p><Mono className="text-[10px] text-[#6B7194]">THU 13 · 8:00 PM · 60 MIN</Mono></div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-[12px]">
                    {["Artur accepted your request", `Paid ${inr(artur.p)}`, "Google Meet link added to your bookings"].map((x, k) => (
                      <motion.p key={x + booked} initial={{ opacity: 0, x: -6 }} animate={booked ? { opacity: 1, x: 0 } : { opacity: 0 }} transition={{ delay: 0.5 + k * 0.35 }} className="flex items-center gap-2 text-[#2E3656]"><Check className="size-3.5 text-emerald-600" />{x}</motion.p>
                    ))}
                  </div>
                </motion.div>
              </main>
            </div>

            {/* cursor */}
            {!reduce && (
              <motion.div className="pointer-events-none absolute left-0 top-0 z-30" animate={{ x: cur.x - 4, y: cur.y - 2 }} transition={{ type: "spring", stiffness: 120, damping: 18 }}>
                <motion.div animate={{ scale: clicking ? 0.85 : 1 }}>
                  <MousePointer2 className="size-6 fill-[#2E3656] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,.35)]" />
                </motion.div>
                {clicking && <motion.span initial={{ scale: 0, opacity: 0.6 }} animate={{ scale: 2.4, opacity: 0 }} transition={{ duration: 0.5 }} className="absolute left-0 top-0 size-6 rounded-full bg-[#7367F0]/40" />}
              </motion.div>
            )}
          </motion.div>
        </div>
      </BrowserFrame>
      {/* chapter rail */}
      <div className="mt-4 grid grid-cols-6 gap-1.5">
        {STAGES.slice(1).map((x, k) => {
          const idx = k + 1;
          return (
            <button key={x.k} onClick={() => { setI(idx); setT(0); setRestart((r) => r + 1); }} className="group text-left">
              <span className="block h-1 overflow-hidden rounded-full bg-[#2E3656]/10">
                <span className="block h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#1F8FFF]" style={{ width: `${idx < i ? 100 : idx === i ? t * 100 : 0}%`, opacity: idx < i ? 0.45 : 1 }} />
              </span>
              <Mono className={cn("mt-1.5 block truncate text-[10px] uppercase transition-colors max-sm:hidden", idx === i ? "text-[#2E3656]" : "text-[#9AA0B8] group-hover:text-[#4B5275]")}>{x.k}</Mono>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════ HERO ═══════════════ */

export function PxHero() {
  const ROUNDS = usePeerRounds();
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-clip pb-24 pt-36 md:pt-44">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_78%_45%,rgba(115,103,240,.20),transparent_70%),radial-gradient(30%_40%_at_95%_15%,rgba(31,143,255,.12),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_70%)]" />
      <GridRunners />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-5 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.2fr)]">
        <div>
          <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-3 rounded-2xl border border-white bg-white/80 py-2 pl-2 pr-4 shadow-[0_14px_34px_-18px_rgba(75,63,208,.55),inset_0_1px_0_#fff] backdrop-blur">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] text-white shadow-[0_8px_18px_-6px_rgba(115,103,240,.8)]"><Users className="size-5" /></span>
            <span className="leading-tight">
              <span className={cn("block text-[17px] font-extrabold tracking-[-0.02em]", INK)}>Peer Interviews</span>
              <Mono className="text-[11px] text-muted-foreground">VERIFIED ENGINEERS · LIVE · RECORDED</Mono>
            </span>
          </motion.div>
          <motion.h1 initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.7, ease }}
            className={cn("mt-7 text-[42px] font-black leading-[0.98] tracking-[-0.055em] md:text-[58px] xl:text-[64px]", INK)}>
            Practise with someone who&apos;s <span className={HL}>sat on the panel.</span>
          </motion.h1>
          <p className="mt-7 max-w-[46ch] text-[17px] text-[#4B5275] md:text-[18.5px]">
            <span className="max-md:hidden">Book a verified engineer for a live mock round. Filter by round, industry and experience, pick a slot, and pay only after they accept.</span>
            <span className="md:hidden">Book a verified engineer. Pay only after they accept.</span>
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild className="h-12 rounded-xl px-6 text-[15.5px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90"><StartLink href={MK26_ROUTES.startPeerBooking}>Find an interviewer <ArrowRight /></StartLink></Button>
            <a href={MK26_ROUTES.peer} className="text-[15px] font-semibold text-[#2E3656] hover:text-primary">Become an interviewer →</a>
          </div>
          <Mono className="mt-4 block text-[12px] text-muted-foreground">Rounds capped at ₹{Math.min(...ROUNDS.map((r) => r.cap))}–₹{Math.max(...ROUNDS.map((r) => r.cap))} · 2 included with Tech Pro</Mono>
        </div>
        <motion.div initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.9, ease }}>
          <BookingFilm className="[&_.rounded-\[18px\]]:shadow-[0_60px_120px_-40px_rgba(40,30,140,.55)]" />
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════ TICKER ═══════════════ */

const FACTS = ["Verified interviewers only", "Filter by round, industry, experience", "Sort by rating or price", "30–60 minute rounds", "Pay only after they accept", "Google Meet, recorded", "A peer report after every call", "Counts toward your iX Score"];
export function PxTicker() {
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

/* ═══════════════ 01 · WHY A PERSON ═══════════════ */

export function PxWhy() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.35, once: true });
  const ai = ["Any time, as many rounds as you like", "Scored the moment you finish", "Remembers every round you've done"];
  const peer = ["Someone who has hired for the role", "Follow-ups no script would think of", "Honest notes on how you came across"];
  return (
    <section className={LIGHT}>
      <Dots />
      <div ref={ref} className={WRAP}>
        <Head n="01" label="Why a person" title={<>Rehearse with AI. <span className={HL}>Pressure-test with a person.</span></>}
          sub="AI rounds build the reps. A peer round is the dress rehearsal before the loop that matters." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[{ k: "AI MOCK INTERVIEWS", t: "For volume", l: ai, dark: false }, { k: "PEER INTERVIEWS", t: "For the real thing", l: peer, dark: true }].map((c, n) => (
            <motion.div key={c.k} initial={{ opacity: 0, y: 14 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ delay: n * 0.15, duration: 0.55, ease }}
              className={cn("rounded-[24px] border p-7", c.dark ? "border-transparent bg-[#0B1A30] text-white shadow-[0_40px_80px_-40px_rgba(30,20,90,.8)]" : "border-border bg-white")}>
              <Mono className={cn("text-[11px]", c.dark ? "text-sky-300" : "text-primary")}>{c.k}</Mono>
              <p className={cn("mt-1 text-[26px] font-extrabold tracking-[-0.03em]", c.dark ? "text-white" : INK)}>{c.t}</p>
              <ul className="mt-5 space-y-3">
                {c.l.map((x, k) => (
                  <motion.li key={x} initial={{ opacity: 0, x: -8 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3 + n * 0.15 + k * 0.1 }} className="flex items-start gap-3 text-[15.5px]">
                    <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", c.dark ? "bg-sky-400/20 text-sky-300" : "bg-[#E9E7FD] text-[#5A4BE0]")}><Check className="size-3.5" /></span>
                    <span className={c.dark ? "text-[#CFE0F7]" : "text-[#4B5275]"}>{x}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 02 · A PEER ROUND, START TO FINISH (dark film: the call → rate & submit → report) ═══════════════ */

type Who = "ARTUR" | "YOU";
// each line has its own lip-synced clip; `ms` is the clip length plus a short beat before the other person answers
type Beat = { c: "Join" | "Interview" | "Wrap up" | "Rating" | "Report"; ms: number; who?: Who; text?: string; clip?: string; say?: number };
const BEATS: Beat[] = [
  { c: "Join", ms: 2600 },
  { c: "Interview", ms: 4900, say: 4400, clip: "px-int-1", who: "ARTUR", text: "Let's design a URL shortener. What do you ask before you draw anything?" },
  { c: "Interview", ms: 5300, say: 4700, clip: "px-cand-1", who: "YOU", text: "How many links a day, how many reads, and whether links ever expire." },
  { c: "Interview", ms: 3500, say: 2950, clip: "px-int-2", who: "ARTUR", text: "A link goes viral. What breaks first?" },
  { c: "Interview", ms: 6200, say: 5600, clip: "px-cand-2", who: "YOU", text: "That key's shard. I'd replicate hot keys and serve them from an edge cache." },
  { c: "Interview", ms: 3800, say: 3200, clip: "px-int-3", who: "ARTUR", text: "Good. Now defend that against the cost." },
  { c: "Interview", ms: 6400, say: 5800, clip: "px-cand-3", who: "YOU", text: "An edge cache is cheap next to an outage. I'd cap it with a short TTL." },
  { c: "Wrap up", ms: 4600, say: 4000, clip: "px-int-4", who: "ARTUR", text: "That's time. Really solid round. Your report is on its way." },
  { c: "Rating", ms: 5600 },
  { c: "Report", ms: 5400 },
];
const CHS: Beat["c"][] = ["Join", "Interview", "Wrap up", "Rating", "Report"];
const RATE: [string, number][] = [["Requirements", 5], ["Design", 4], ["Trade-offs", 3], ["Communication", 4]];
const NOTE = "Strong on requirements and failure modes. Lead with the trade-off before I ask, and name your consistency model.";

/** A call tile: the listening loop runs underneath; the current line's clip mounts fresh over it, so it always starts from the first frame. */
function Tile({ name, sub, listen, line, talking, live, sound }: { name: string; sub: string; listen: string; line?: string; talking: boolean; live: boolean; sound: boolean }) {
  return (
    <motion.div animate={{ scale: talking ? 1.015 : 1 }} transition={{ duration: 0.4 }} className="relative overflow-hidden rounded-2xl bg-black">
      <div className="relative aspect-[4/3]">
        <div className="absolute inset-0"><LoopVideo name={listen} className="!aspect-auto h-full" priority={live} /></div>
        {line && (
          <div key={line} className={cn("absolute inset-0 transition-opacity duration-200", talking ? "opacity-100" : "opacity-0")}>
            <LoopVideo name={line} loop={false} sound={sound} className="!aspect-auto h-full" priority />
          </div>
        )}
      </div>
      <span className={cn("pointer-events-none absolute inset-0 rounded-2xl ring-[3px] transition-all duration-300", talking ? "ring-sky-400/80" : "ring-transparent")} />
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1 backdrop-blur">
        {talking ? <span className="flex h-3 items-end gap-[2px]">{[0, 1, 2].map((k) => <motion.span key={k} className="w-[2px] rounded-full bg-sky-300" animate={{ height: [3, 10, 3] }} transition={{ duration: 0.6, repeat: Infinity, delay: k * 0.12 }} />)}</span>
          : <span className="size-1.5 rounded-full bg-white/40" />}
        <span className="text-[11.5px] font-medium text-white">{name}</span><span className="text-[10.5px] text-white/60">· {sub}</span>
      </div>
    </motion.div>
  );
}

export function PxSession() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.35 });
  const [b, setB] = useState(0);
  const [t, setT] = useState(0);
  const [restart, setRestart] = useState(0);
  const [sound, setSound] = useState(false);
  const beat = BEATS[b];

  useEffect(() => {
    if (reduce) { setB(BEATS.length - 1); setT(1); return; }
    if (!on) return;
    let raf = 0; const t0 = performance.now();
    const tick = (n: number) => { const k = Math.min(1, (n - t0) / beat.ms); setT(k); if (k < 1) raf = requestAnimationFrame(tick); else { setB((x) => (x + 1) % BEATS.length); setT(0); } };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [b, on, reduce, beat.ms, restart]);

  const ch = CHS.indexOf(beat.c);
  const talking = (w: Who) => beat.who === w && t * beat.ms < (beat.say ?? 0);
  const line = (w: Who) => (beat.who === w ? beat.clip : undefined);
  const clock = ["00:00", "02:10", "06:45", "21:30", "24:05", "39:40", "41:15", "58:12", "58:12", "58:12"][b];
  // rating form fills in as the interviewer works through it
  const starsShown = beat.c === "Rating" ? Math.min(RATE.length, Math.floor(t * 9)) : beat.c === "Report" ? RATE.length : 0;
  const noteShown = beat.c === "Rating" ? Math.floor(Math.max(0, (t - 0.42) / 0.38) * NOTE.length) : NOTE.length;
  const submitted = beat.c === "Rating" && t > 0.86;
  const jump = (c: Beat["c"]) => { setB(BEATS.findIndex((x) => x.c === c)); setT(0); setRestart((r) => r + 1); };

  return (
    <section className={DARK}>
      <CircuitTraces className="opacity-60" />
      <div ref={ref} className={WRAP}>
        <Head dark n="02" label="A peer round, start to finish" title={<>A real interviewer, a real round, <span className="bg-gradient-to-r from-[#A99CFF] to-[#5CC2FF] bg-clip-text pr-[0.06em] text-transparent">a real verdict.</span></>}
          aside={<Mono className="mb-3 inline-block rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[11.5px] text-sky-300">● GOOGLE MEET · RECORDED · RATED</Mono>}
          sub="You talk it through on a live call. When it ends, your interviewer rates the round and writes their notes, and the report lands in your bookings." />
        <div className="mx-auto max-w-[1040px]">
          <div className="relative">
          <SoundToggle sound={sound} onToggle={() => setSound((x) => !x)} className="absolute -top-5 right-5" />
          <BrowserFrame url={beat.c === "Report" ? "app.interviewtrix.com/dashboard/peer-interviews/bookings/artur-nowak/report" : beat.c === "Rating" ? "app.interviewtrix.com/dashboard/peer-interviews/interviewer · rate session" : "meet.google.com/ixp-wrd-kqa · InterviewTrix peer round"}>
            <div className="relative aspect-[16/9] overflow-hidden bg-[#0B0F17] max-sm:aspect-auto">
              {/* the call */}
              <div className="grid h-full grid-cols-2 content-center gap-3 p-4 max-sm:grid-cols-1">
                <Tile name="Artur Nowak" sub="interviewer" listen="px-int-listen" line={line("ARTUR")} talking={talking("ARTUR")} live={on} sound={sound} />
                <Tile name="You" sub="candidate" listen="px-cand-listen" line={line("YOU")} talking={talking("YOU")} live={on} sound={sound} />
              </div>
              {/* call chrome */}
              <div className="pointer-events-none absolute left-4 right-4 top-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white backdrop-blur"><motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="size-2 rounded-full bg-[#E5484D]" />REC · {clock}</span>
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-black/60 px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[10.5px] text-white/80 backdrop-blur max-sm:hidden">SYSTEM DESIGN · 60 MIN</span>
                </span>
              </div>
              {/* captions */}
              <AnimatePresence>
                {beat.text && (
                  <motion.div key={b} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-x-[8%] bottom-5 z-10 max-sm:inset-x-3">
                    <p className="rounded-xl bg-black/75 px-4 py-2.5 text-center text-[13.5px] leading-snug text-white backdrop-blur md:text-[15px]">
                      <Mono className={cn("mr-2 text-[10px]", beat.who === "ARTUR" ? "text-sky-300" : "text-white/60")}>{beat.who === "ARTUR" ? "ARTUR" : "YOU"}</Mono>{beat.text}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* join */}
              <AnimatePresence>
                {beat.c === "Join" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 grid place-items-center bg-[#0B0F17]/80 backdrop-blur-sm">
                    <div className="w-[min(92%,380px)] rounded-2xl bg-white p-5 text-[#2E3656]">
                      <Mono className="text-[10px] text-primary">JOINING · THU 13 · 8:00 PM</Mono>
                      <p className="mt-1 text-[17px] font-bold">System design with Artur Nowak</p>
                      <ul className="mt-3 space-y-1.5 text-[13px]">
                        {["Booking paid and confirmed", "Recording on for both of you", "Your resume shared with Artur"].map((x, i) => (
                          <motion.li key={x} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.25 }} className="flex items-center gap-2"><Check className="size-4 text-emerald-600" />{x}</motion.li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* call ended */}
              <AnimatePresence>
                {beat.c === "Wrap up" && t > 0.72 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 grid place-items-center bg-[#0B0F17]/70 backdrop-blur-sm">
                    <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3 text-white ring-1 ring-white/15"><Video className="size-5 text-[#E5484D]" /><span className="text-[15px] font-semibold">Call ended · 58:12 · recording saved</span></div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* the interviewer rates and submits */}
              <AnimatePresence>
                {beat.c === "Rating" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 grid place-items-center bg-[#0B0F17]/80 p-4 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 220, damping: 20 }} className="w-full max-w-[520px] rounded-2xl bg-white p-5 text-[#2E3656]">
                      <div className="flex items-center justify-between"><Mono className="text-[10px] text-primary">ARTUR · RATE THIS SESSION</Mono><Mono className="text-[10px] text-muted-foreground">58 MIN</Mono></div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {RATE.map(([k, v], i) => (
                          <div key={k} className="flex items-center justify-between rounded-lg bg-[#F4F3FB] px-3 py-2">
                            <span className="text-[12.5px] font-medium">{k}</span>
                            <span className="flex gap-0.5">{[0, 1, 2, 3, 4].map((s) => <Star key={s} className={cn("size-3.5 transition-colors duration-200", i < starsShown && s < v ? "fill-amber-400 text-amber-400" : "text-[#D9DBE6]")} />)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 min-h-[64px] rounded-lg border border-[#E7E6F2] p-2.5 text-[12.5px] leading-relaxed">
                        <Mono className="mr-1.5 text-[9.5px] text-primary">NOTES FOR THE CANDIDATE</Mono>{NOTE.slice(0, noteShown)}{noteShown < NOTE.length && <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-[2px] animate-pulse bg-[#7367F0]" />}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[12px] text-muted-foreground">Overall <b className="text-[#2E3656]">4 / 5</b></span>
                        <motion.span animate={{ scale: submitted ? [1, 0.94, 1] : 1 }} className={cn("inline-flex h-9 items-center rounded-lg px-4 text-[13px] font-semibold text-white transition-colors", submitted ? "bg-emerald-500" : "bg-primary")}>{submitted ? "✓ Submitted" : "Submit rating"}</motion.span>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* what the candidate sees */}
              <AnimatePresence>
                {beat.c === "Report" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 grid place-items-center bg-[#071224] p-4">
                    <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="w-full max-w-[640px] space-y-2.5 text-left text-white md:origin-center md:scale-[1.22]">
                      <div className="flex items-center gap-3 rounded-xl border border-[#7367F0] bg-white/[.05] p-3 shadow-[0_0_0_3px_rgba(115,103,240,.2)]">
                        <span className="flex size-12 shrink-0 items-baseline justify-center rounded-full border-[4px] border-[#7367F0] pt-[11px] leading-none"><span className="text-[17px] font-bold">4</span><span className="text-[10px] text-white/60">/5</span></span>
                        <div className="min-w-0"><p className="truncate text-[14px] font-semibold">Peer report · System design with Artur Nowak</p><Mono className="text-[9.5px] text-white/50">THU 13 · 58 MIN · GOOGLE MEET</Mono></div>
                        <Mono className="ml-auto shrink-0 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[9.5px] text-emerald-300">NEW</Mono>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {RATE.map(([k, v], i) => (
                          <div key={k} className="rounded-lg border border-white/10 bg-white/[.04] p-2.5">
                            <Mono className="text-[9px] text-white/50">{k.toUpperCase()}</Mono>
                            <div className="mt-1 flex gap-0.5">{[0, 1, 2, 3, 4].map((s) => <motion.span key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.1 + s * 0.04 }}><Star className={cn("size-3", s < v ? "fill-amber-400 text-amber-400" : "text-white/20")} /></motion.span>)}</div>
                          </div>
                        ))}
                      </div>
                      <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="rounded-xl border border-white/10 bg-white/[.04] p-3 text-[13px] leading-relaxed text-[#CFE0F7]">
                        <Mono className="mr-1.5 text-[9.5px] text-sky-300">ARTUR&apos;S NOTES</Mono>“{NOTE}”
                      </motion.p>
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] p-2.5">
                        <span className="relative grid aspect-video w-[110px] shrink-0 place-items-center overflow-hidden rounded-lg bg-[#1B2233]"><span className="grid size-7 place-items-center rounded-full bg-white/90 text-[11px] text-[#2E3656]">▶</span><span className="absolute bottom-1 right-1.5 font-[family-name:var(--font-geist-mono)] text-[8.5px] text-white/70">58:12</span></span>
                        <div><p className="text-[13px] font-semibold">Session recording</p><p className="text-[12px] text-[#9FB3CF]">Rewatch the hot-key answer. Saved in your bookings.</p></div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </BrowserFrame>
          </div>
          <div className="mt-5 grid grid-cols-5 gap-2">
            {CHS.map((x, i) => {
              const total = BEATS.filter((y) => y.c === x).reduce((n, y) => n + y.ms, 0);
              const done = BEATS.slice(0, b).filter((y) => y.c === x).reduce((n, y) => n + y.ms, 0) + (beat.c === x ? t * beat.ms : 0);
              return (
                <button key={x} onClick={() => jump(x)} className="group text-left">
                  <span className="block h-1 overflow-hidden rounded-full bg-white/15"><span className="block h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#5CC2FF]" style={{ width: `${i < ch ? 100 : i === ch ? (done / total) * 100 : 0}%`, opacity: i < ch ? 0.5 : 1 }} /></span>
                  <Mono className={cn("mt-2 block truncate text-[10.5px] uppercase transition-colors", i === ch ? "text-white" : "text-white/45 group-hover:text-white/75")}>0{i + 1} · {x}</Mono>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 03 · ROUNDS & PRICES ═══════════════ */

export function PxRounds() {
  const ROUNDS = usePeerRounds();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.3, once: true });
  return (
    <section className={LAVENDER}>
      <div ref={ref} className={WRAP}>
        <Head n="03" label="Rounds & prices" title={<>{countWord(ROUNDS.length)} rounds. <span className={HL}>Every price capped.</span></>}
          sub="Interviewers set their own price, never above the cap for that round. Tech Pro includes 2 peer interviews." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROUNDS.map((r, i) => (
            <motion.div key={r.k} initial={{ opacity: 0, y: 12 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08, duration: 0.5, ease }}
              className="group rounded-2xl border border-white bg-white/90 p-5 shadow-[0_20px_40px_-30px_rgba(30,20,90,.5)] transition-colors hover:border-primary/40">
              <div className="flex items-center justify-between"><p className={cn("text-[17px] font-bold", INK)}>{r.k}</p><Mono className="text-[10.5px] text-muted-foreground">{r.min} MIN</Mono></div>
              <p className="mt-3 text-[13px] text-muted-foreground">Up to</p>
              <p className={cn("text-[30px] font-extrabold leading-none tracking-tight", INK)}>₹<CountUp to={r.cap} run={on} /></p>
              <span className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-primary">Find a {r.k.toLowerCase()} interviewer <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 04 · ONE MEMORY ═══════════════ */

export function PxMemory() {
  return (
    <Wiring n="04" label="One memory" title={<>A person&apos;s verdict, <span className={HL}>in the same memory.</span></>}
      sub="Your peer report sits next to your AI rounds, so the next mock knows what a real interviewer told you."
      ins={["Your resume", "Your AI mock rounds", "Your target role"]}
      outs={[
        { t: "Next AI mock", d: "Opens on the trade-off Artur said you raised too late." },
        { t: "Skills Graph", d: "A human rating next to every AI score." },
        { t: "iX Score", d: "Peer is one of four categories, if you opt in." },
        { t: "Your bookings", d: "Recording and report, there whenever you need them." },
      ]}>
      {(on: boolean) => (
        <>
          <Mono className="text-[10.5px] text-sky-300">PEER REPORT · SYSTEM DESIGN</Mono>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex size-[68px] shrink-0 items-baseline justify-center rounded-full border-[5px] border-[#7367F0] pt-[17px] leading-none"><span className="text-[22px] font-bold">4</span><span className="text-[12px] font-semibold text-white/60">/5</span></span>
            <div><p className="font-bold">Artur Nowak</p><p className="text-[13px] text-[#9FB3CF]">Senior engineer · payments</p></div>
          </div>
          <div className="mt-5 space-y-2 text-[13.5px]">
            {[["✓", "Clear requirements", "text-emerald-300"], ["✓", "Good failure thinking", "text-emerald-300"], ["!", "Trade-offs came late", "text-amber-300"]].map(([i, t, c], n) => (
              <motion.p key={t} initial={{ opacity: 0, x: -6 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1 + n * 0.15 }} className={c}><span className="mr-1.5">{i}</span>{t}</motion.p>
            ))}
          </div>
        </>
      )}
    </Wiring>
  );
}

export const PxStickyCta = () => <StickyCta product="Peer Interviews" cta="Find an interviewer" href={MK26_ROUTES.startPeerBooking} />;
