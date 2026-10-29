"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight, ClipboardPaste, FileBarChart2, Mic, PhoneOff, Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrowserFrame, Index, LoopVideo, Mono, SoundToggle } from "./primitives";
import { mk26Asset } from "./assets";
import { MK26_ROUTES } from "./cta";
import { StartLink } from "./StartLink";
import { CircuitTraces, GridRunners } from "./graphics";
import { STYLE, type State } from "./skill-trend";
import { SkillsSection, type SkHub } from "./skills-section";
import { CountUp, DARK, Dots, ease, Head, HL, INK, LAVENDER, LIGHT, Stepper, StickyCta, Wiring, WRAP } from "./landing-kit";
import { cn } from "@/lib/utils";

/**
 * AI Mock Interview landing page. Same story shape as the homepage, narrowed to one product:
 * hero → 01 how it works → 02 what it catches → 03 the report → 04 it read your last report → 05 skills graph → 06 one memory.
 */

/* ═══════════════ HERO ═══════════════ */

const TRACKS = [
  { k: "Campus placements", q: "You've listed a final-year project on crop prediction. What would you do differently with more data?", a: "So, um, I think we'd basically add more seasons of rainfall data and…" },
  { k: "SDE 1-3", q: "Your resume says you cut checkout latency by 40%. How did you measure it?", a: "So, um, we basically put a Redis layer in front of the pricing service and…" },
  { k: "Non-tech", q: "Tell me about a time a customer was angry and you were the one on the call.", a: "Um, so there was this one customer who basically wanted a refund and…" },
  { k: "MBA / Sales", q: "Walk me through how you'd price this for a tier-2 city.", a: "So I'd, um, basically start from what they pay for the nearest substitute…" },
  { k: "Senior", q: "You had two teams blocked on your decision. What did you decide, and who disagreed?", a: "So, um, the platform team basically wanted to wait a quarter and…" },
];
const FILLERS = /\b(um|basically)\b/gi;

function Typed({ text, run }: { text: string; run: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => { setN(0); }, [text]);
  useEffect(() => {
    if (!run || n >= text.length) return;
    const t = setTimeout(() => setN((x) => x + 1), 32);
    return () => clearTimeout(t);
  }, [n, run, text]);
  const shown = text.slice(0, n);
  // fillers get an amber underline the moment they're fully typed
  const parts = shown.split(/(\bum\b|\bbasically\b)/i);
  return (
    <>
      {parts.map((p, i) => FILLERS.test(p) ? <span key={i} className="rounded-sm bg-amber-400/15 underline decoration-amber-400 decoration-2 underline-offset-4">{p}</span> : <span key={i}>{p}</span>)}
      {n < text.length && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[3px] animate-pulse bg-current" />}
    </>
  );
}

function Wave({ bars = 28 }: { bars?: number }) {
  const reduce = useReducedMotion();
  return (
    <span className="flex h-6 items-center gap-[3px]">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span key={i} className="w-[3px] rounded-full bg-gradient-to-t from-[#7367F0] to-[#5AA8FF]"
          animate={reduce ? { height: 6 } : { height: [5, 6 + ((i * 37) % 17), 5] }} transition={{ duration: 0.9 + (i % 5) * 0.12, repeat: Infinity, ease: "easeInOut", delay: (i % 7) * 0.05 }} />
      ))}
    </span>
  );
}

/* the live round in the hero: a recreation of /interview/live. The AI interviewer is a voice with a portrait, as in the
   product; the candidate camera plays a lip-synced answer per line over a silent listening loop. */
type LrBeat = { who: "AI" | "YOU"; ms: number; say: number; text: string; label?: string; audio?: string; clip?: string };
const LR: LrBeat[] = [
  { who: "AI", ms: 8100, say: 7560, audio: "mi-ai-1", label: "QUESTION 1 OF 12", text: "Hi Rohan, good to meet you. Let's keep it relaxed to start — tell me a little about yourself, and what you're working on these days." },
  { who: "YOU", ms: 11900, say: 11390, clip: "mi-cand-1", text: "Sure, yeah. So I'm a backend engineer — about four years now, all at a fintech startup in Bangalore. Mostly I own our payments API… and last year I led our move off the monolith." },
  { who: "AI", ms: 9500, say: 8930, audio: "mi-ai-2", label: "QUESTION 2 OF 12", text: "Oh, nice — the payments side. Okay, picture sale day. Traffic jumps ten times in under a minute. What's the first thing you actually do?" },
  { who: "YOU", ms: 12600, say: 12030, clip: "mi-cand-2", text: "Hmm… honestly, first I'd open the dashboards and see what's actually choking — is it the database, or the pods? Then scale out the API, switch on rate limits, and push the hot reads onto cache." },
  { who: "AI", ms: 6100, say: 5540, audio: "mi-ai-3", label: "FOLLOW-UP 1", text: "Mm-hm, that buys you time. But next sale — how do you make sure it doesn't happen again?" },
  { who: "YOU", ms: 10800, say: 10280, clip: "mi-cand-3", text: "Right. So — autoscale on queue depth, not CPU. Load test before every big launch. And an alert that fires before users ever notice." },
  { who: "AI", ms: 5400, say: 3730, audio: "mi-ai-4", label: "FOLLOW-UP 2", text: "I like that you said queue depth. Let's dig into that next." },
];

/** One interviewer line. Mounted per beat, so it starts from 0; turning sound on mid-line picks up where the line is. */
export function Voice({ src, sound, at }: { src: string; sound: boolean; at: () => number }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    if (sound) { if (a.paused) { a.currentTime = at(); a.play().catch(() => {}); } } else a.pause();
  }, [sound, at]);
  return <audio ref={ref} src={mk26Asset(`/audio/${src}.mp3`)} preload="auto" />;
}

/** The answer as it's being spoken: words so far, trimmed to the latest dozen so the caption stays two lines. */
function liveWords(text: string, k: number) {
  const w = text.split(" ");
  const n = Math.max(1, Math.min(w.length, Math.ceil(k * w.length)));
  return (n > 12 ? "…" : "") + w.slice(Math.max(0, n - 12), n).join(" ");
}

export function LiveRound({ sound }: { sound: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.3 });
  const [b, setB] = useState(0);
  const [t, setT] = useState(0);
  const beat = LR[b];
  // where the current line is, in seconds, for audio that starts mid-line
  const pos = useRef(0);
  pos.current = (t * beat.ms) / 1000;
  const at = useRef(() => pos.current).current;

  useEffect(() => {
    if (reduce || !on) return;
    let raf = 0; const t0 = performance.now();
    const tick = (n: number) => { const k = Math.min(1, (n - t0) / beat.ms); setT(k); if (k < 1) raf = requestAnimationFrame(tick); else { setB((x) => (x + 1) % LR.length); setT(0); } };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [b, on, reduce, beat.ms]);

  const talking = t * beat.ms < beat.say;
  const aiTalking = beat.who === "AI" && talking;
  const youTalking = beat.who === "YOU" && talking;
  // the question on the left stays up while the candidate answers it
  const q = beat.who === "AI" ? beat : LR[b - 1];
  const secs = 42 + Math.round(LR.slice(0, b).reduce((n, x) => n + x.ms, 0) / 1000 + t * beat.ms / 1000);
  const clock = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  return (
    <div ref={ref} className="relative overflow-hidden bg-[#0B0F17] p-3 text-white md:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0"><p className="truncate text-[13px] font-semibold md:text-[14px]">Backend Engineer · SDE 2</p><Mono className="text-[9.5px] text-white/50">{clock} / 15:00</Mono></div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#E5484D] px-2.5 py-1 text-[10.5px] font-semibold max-sm:hidden"><PhoneOff className="size-3" />End interview</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-2.5 max-sm:grid-cols-1">
        {/* the interviewer: a voice with a portrait, never a video */}
        <div className="rounded-xl border border-white/10 bg-[#141A26] p-3">
          <div className="flex items-center gap-2.5">
            <span className="relative size-11 shrink-0 md:size-12">
              {aiTalking && !reduce && <motion.span className="absolute -inset-1 rounded-full border-2 border-[#7367F0]" animate={{ scale: [1, 1.12, 1], opacity: [0.9, 0.3, 0.9] }} transition={{ duration: 1.1, repeat: Infinity }} />}
              <img src="/personas/persona-4.jpg" alt="Priya Sharma, the AI interviewer" className="size-full rounded-full border-2 border-white/15 object-cover" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-semibold">Priya Sharma</p>
              <p className="text-[10.5px] text-white/55">Lead interviewer</p>
              <p className={cn("text-[10.5px]", aiTalking ? "text-[#A99CFF]" : "text-white/45")}>{aiTalking ? "Speaking…" : "Listening"}</p>
            </div>
          </div>
          <div className="mt-3 grid">
            {/* every question sits in the same cell, so the card never changes height */}
            {LR.filter((x) => x.who === "AI").map((x) => <div key={x.text} aria-hidden className="invisible [grid-area:1/1]"><Mono className="text-[9.5px]">{x.label}</Mono><p className="mt-1 text-[13px] leading-snug md:text-[14.5px]">{x.text}</p></div>)}
            <AnimatePresence mode="wait">
              <motion.div key={q.text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="[grid-area:1/1]">
                <Mono className="text-[9.5px] text-sky-300">{q.label}</Mono>
                <p className="mt-1 text-[13px] font-medium leading-snug md:text-[14.5px]">{q.text}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          {aiTalking && <div className="mt-2.5"><Wave bars={18} /></div>}
        </div>

        {/* the candidate camera */}
        <div className="rounded-xl border border-white/10 bg-[#141A26] p-2">
          <Mono className="mb-1.5 inline-block rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white/70">CANDIDATE CAMERA</Mono>
          <div className={cn("relative overflow-hidden rounded-lg ring-2 transition-all duration-300", youTalking ? "ring-sky-400/70" : "ring-transparent")}>
            <LoopVideo name="mi-cand-listen" priority />
            {beat.clip && (
              <div key={beat.clip} className={cn("absolute inset-0 transition-opacity duration-200", youTalking ? "opacity-100" : "opacity-0")}>
                <LoopVideo name={beat.clip} loop={false} sound={sound} className="!aspect-auto h-full" priority />
              </div>
            )}
            {/* live transcript of the answer */}
            {beat.who === "YOU" && (
              <p className="absolute inset-x-2 bottom-2 line-clamp-2 rounded-md bg-black/65 px-2 py-1 text-[10.5px] leading-snug backdrop-blur md:text-[11.5px]">
                <Mono className="mr-1 text-[9px] text-white/55">YOU</Mono>{liveWords(beat.text, (t * beat.ms) / beat.say)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* call controls: mic and camera on, end call set apart */}
      <div className="mt-3 flex items-center justify-center gap-3 border-t border-white/10 pt-3 md:mt-4 md:gap-4 md:pt-4">
        <span aria-label="Microphone on" className="grid size-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 md:size-12"><Mic className="size-[18px] md:size-5" /></span>
        <span aria-label="Camera on" className="grid size-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 md:size-12"><Video className="size-[18px] md:size-5" /></span>
        <span aria-label="End interview" className="grid h-10 w-14 place-items-center rounded-full bg-[#E5484D] shadow-[0_8px_20px_-8px_rgba(229,72,77,.8)] md:h-12 md:w-16"><PhoneOff className="size-[18px] md:size-5" /></span>
      </div>
      {beat.audio && on && <Voice key={beat.audio} src={beat.audio} sound={sound} at={at} />}
      {/* warm the cache so each answer starts on its first frame, not after a fetch */}
      {on && <div aria-hidden className="hidden">{LR.filter((x) => x.clip).map((x) => <video key={x.clip} src={mk26Asset(`/video/${x.clip}.mp4`)} preload="auto" muted />)}{LR.filter((x) => x.audio).map((x) => <audio key={x.audio} src={mk26Asset(`/audio/${x.audio}.mp3`)} preload="auto" />)}</div>}
    </div>
  );
}

export function MiHero() {
  const reduce = useReducedMotion();
  const [t, setT] = useState(1);
  const [sound, setSound] = useState(false);
  const track = TRACKS[t];
  const fillerCount = (track.a.match(FILLERS) || []).length;

  return (
    <section className="relative overflow-clip pb-24 pt-36 md:pt-44">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_78%_45%,rgba(115,103,240,.20),transparent_70%),radial-gradient(30%_40%_at_95%_15%,rgba(31,143,255,.12),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_70%)]" />
      <GridRunners />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]">
        {/* ── copy ── */}
        <div>
          {/* the product name is the first thing you read */}
          <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-3 rounded-2xl border border-white bg-white/80 py-2 pl-2 pr-4 shadow-[0_14px_34px_-18px_rgba(75,63,208,.55),inset_0_1px_0_#fff] backdrop-blur">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] text-white shadow-[0_8px_18px_-6px_rgba(115,103,240,.8)]"><Mic className="size-5" /></span>
            <span className="leading-tight">
              <span className={cn("block text-[17px] font-extrabold tracking-[-0.02em]", INK)}>AI Mock Interview</span>
              <Mono className="text-[11px] text-muted-foreground">VOICE · 15 OR 30 MIN · SCORED</Mono>
            </span>
          </motion.div>

          <motion.h1 initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.7, ease }}
            className={cn("mt-7 text-[42px] font-black leading-[0.98] tracking-[-0.055em] md:text-[60px] xl:text-[66px]", INK)}>
            Say it <span className={HL}>out loud</span> before the interview that{" "}
            <span className="relative inline-block whitespace-nowrap">counts.
              <svg aria-hidden viewBox="0 0 520 24" preserveAspectRatio="none" className="absolute -bottom-1 left-[2%] h-[0.18em] w-[92%] overflow-visible">
                <defs><linearGradient id="mi-ul" x1="0" x2="1"><stop offset="0" stopColor="#7367F0" stopOpacity=".8" /><stop offset="1" stopColor="#1F8FFF" stopOpacity=".8" /></linearGradient></defs>
                <motion.path d="M4 16 C 120 4, 260 22, 516 8" fill="none" stroke="url(#mi-ul)" strokeWidth="7" strokeLinecap="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.8, duration: 0.9, ease }} />
              </svg>
            </span>
          </motion.h1>
          <motion.p initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.6, ease }}
            className="mt-7 max-w-[48ch] text-[17px] text-[#4B5275] md:text-[18.5px]">
            <span className="max-md:hidden">A voice interviewer reads your resume, asks about the project you listed first, and follows up when the answer gets vague. Fifteen minutes. Scored.</span>
            <span className="md:hidden">It reads your resume and follows up when you get vague. Scored.</span>
          </motion.p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild className="h-12 rounded-xl px-6 text-[15.5px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90">
              <StartLink href={MK26_ROUTES.startInterview}>Start my free mock interview <ArrowRight /></StartLink>
            </Button>
            {/* plays the live round in the hero with its voices on */}
            <button type="button" onClick={() => setSound(true)} className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#2E3656] hover:text-primary">
              <span className="grid size-9 place-items-center rounded-full border border-border bg-white"><Play className="size-3.5 fill-current" /></span>Hear the interviewer
            </button>
          </div>
          <Mono className="mt-4 block text-[12px] text-muted-foreground">14-day trial · 200 credits · No card</Mono>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[13px] text-muted-foreground max-md:hidden">Practising for</span>
            {TRACKS.map((tr, i) => (
              <button key={tr.k} onClick={() => setT(i)} className={cn("rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors", i === t ? "border-[#2E3656] bg-[#2E3656] text-white" : "border-border bg-white text-[#2E3656] hover:border-primary/40")}>{tr.k}</button>
            ))}
          </div>
        </div>

        {/* ── the live round, tilted in, with the conversation floating over it ── */}
        <div className="relative [perspective:1600px]">
          <motion.div initial={reduce ? false : { opacity: 0, rotateY: -14, rotateX: 6, y: 30 }} animate={{ opacity: 1, rotateY: -7, rotateX: 3, y: 0 }} transition={{ delay: 0.2, duration: 1.1, ease }}
            className="[transform-style:preserve-3d]">
            <BrowserFrame url="app.interviewtrix.com/interview/live" className="shadow-[0_60px_120px_-40px_rgba(40,30,140,.6)]"><LiveRound sound={sound} /></BrowserFrame>
          </motion.div>

          <SoundToggle sound={sound} onToggle={() => setSound((x) => !x)} className="absolute -top-5 right-6" />

          {/* question → your answer, swapped by the chips on the left */}
          <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, type: "spring", stiffness: 150, damping: 20 }}
            className="relative -mt-16 ml-auto w-[92%] rounded-2xl border border-white/70 bg-white/90 p-4 text-left shadow-[0_30px_60px_-24px_rgba(30,20,80,.5),inset_0_1px_0_#fff] backdrop-blur-xl sm:w-[78%] lg:-ml-10 lg:mr-auto">
            <div className="flex items-center justify-between"><Mono className="text-[10.5px] text-primary">● LIVE · {track.k.toUpperCase()}</Mono>
              <Mono className="text-[10.5px] text-muted-foreground">PACE 152 WPM · FILLERS <span className="text-amber-600">{fillerCount}</span></Mono></div>
            {/* every track, fully typed and invisible, sits in the same grid cell: the card is always as tall as the
                longest one, so switching roles or typing never moves the page */}
            <div className="grid">
              {TRACKS.map((tr) => (
                <div key={tr.k} aria-hidden className="invisible [grid-area:1/1]">
                  <p className="mt-2.5 rounded-xl px-3 py-2 text-[14px]"><Mono className="mr-1.5 text-[10px]">AI</Mono>{tr.q}</p>
                  <p className="ml-6 mt-2 rounded-xl px-3 py-2 text-[14px]"><Mono className="mr-1.5 text-[10px]">YOU</Mono>{tr.a}</p>
                </div>
              ))}
              <AnimatePresence mode="wait">
                <motion.div key={t} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="[grid-area:1/1]">
                  <p className="mt-2.5 rounded-xl rounded-tl-md bg-primary-muted px-3 py-2 text-[14px] text-[#2E3656]"><Mono className="mr-1.5 text-[10px] text-primary">AI</Mono>{track.q}</p>
                  <p className="ml-6 mt-2 rounded-xl rounded-tr-md bg-muted px-3 py-2 text-[14px] text-[#2E3656]"><Mono className="mr-1.5 text-[10px] text-muted-foreground">YOU</Mono><Typed text={track.a} run={!reduce} /></p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ TICKER ═══════════════ */

const FACTS = ["307 roles · 8 industries", "6 interviewers, 6 voices", "Reads your resume + JD", "15 or 30 minutes", "11 integrity checks", "FAANG · product · service · startup", "Follows up on what you said"];
export function MiTicker() {
  return (
    <div className="relative overflow-hidden border-y border-[#E7E6F2] bg-white/60 py-4">
      <div className="mask-x flex w-max gap-10 [animation:marquee_36s_linear_infinite]">
        {[...FACTS, ...FACTS].map((f, i) => (
          <Mono key={i} aria-hidden={i >= FACTS.length} className="flex items-center gap-10 whitespace-nowrap text-[13px] uppercase tracking-wider text-[#4B5275]">
            {f}<span className="size-2 rotate-45 rounded-[2px] bg-primary/60" />
          </Mono>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ 01 · THREE SCREENS (pinned, real captures) ═══════════════ */

const SCREENS = [
  { k: "SET IT UP", icon: ClipboardPaste, t: "Paste the job. It reads it with your resume.", d: "Pick from 307 roles, name the company, paste the JD. It pulls out the skills and predicts the questions before the first one is asked.", v: "mi-setup", url: "app.interviewtrix.com/dashboard/interviews/new" },
  { k: "TALK", icon: Mic, t: "One question at a time. Out loud.", d: "It waits while you think. Say “we improved performance” and expect “by how much, and how do you know?”", v: "mi-live", url: "app.interviewtrix.com/interview/live" },
  { k: "READ THE REPORT", icon: FileBarChart2, t: "Scored before you've closed the tab.", d: "Technical, behavioural, communication and confidence. Fillers per minute, long pauses, and a better version of every answer.", v: "mi-report", url: "app.interviewtrix.com/dashboard/interviews/report" },
];

export const MiThreeScreens = () => <Stepper steps={SCREENS} n="01" label="How it works" nowrap title={<>From job post to <span className={HL}>scorecard.</span></>} />;

/* ═══════════════ 02 · WHAT IT CATCHES — one answer, marked up the way an interviewer hears it ═══════════════ */

type Seg = { t: string; k?: "filler" | "vague"; note?: string };
const ANSWER: Seg[] = [
  { t: "So, " }, { t: "um", k: "filler" }, { t: ", on the checkout team we " }, { t: "basically", k: "filler" },
  { t: " rebuilt the pricing service, and " }, { t: "we improved performance a lot", k: "vague", note: "Which metric? By how much?" },
  { t: ". The team was really happy with it and, " }, { t: "um", k: "filler" }, { t: ", yeah, that was the project." },
];
const TOTAL = ANSWER.reduce((n, x) => n + x.t.length, 0);

export function MiCatches() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.5 });
  const [n, setN] = useState(reduce ? TOTAL : 0);
  const [run, setRun] = useState(0);
  useEffect(() => { if (!reduce) setN(0); }, [run, reduce]);
  useEffect(() => {
    if (!on || reduce || n >= TOTAL) return;
    const t = setTimeout(() => setN((x) => x + 1), 34);
    return () => clearTimeout(t);
  }, [on, n, reduce]);

  // what has been caught so far, so the counters on the right tick as the answer is spoken
  let used = 0, fillers = 0, vague = 0;
  const parts = ANSWER.map((seg, i) => {
    const shown = seg.t.slice(0, Math.max(0, n - used));
    const done = n >= used + seg.t.length;
    used += seg.t.length;
    if (done && seg.k === "filler") fillers++;
    if (done && seg.k === "vague") vague++;
    if (!shown) return null;
    if (seg.k === "filler") return <span key={i} className={cn("rounded-sm transition-colors", done && "bg-amber-400/20 underline decoration-amber-400 decoration-2 underline-offset-[5px]")}>{shown}</span>;
    if (seg.k === "vague") return (
      <span key={i}>
        <span className={cn("rounded-sm transition-colors", done && "bg-[#7F70F0]/25 underline decoration-[#9B8CFF] decoration-dotted decoration-2 underline-offset-[5px]")}>{shown}</span>
        {done && <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mx-1.5 inline-block -translate-y-0.5 rounded-full bg-[#7F70F0] px-2.5 py-0.5 align-middle font-[family-name:var(--font-geist-mono)] text-[11px] text-white">{seg.note}</motion.span>}
      </span>
    );
    return <span key={i}>{shown}</span>;
  });
  const finished = n >= TOTAL;

  const catches = [
    { k: "FILLER WORDS", v: String(fillers), d: "“um”, “basically”, counted per minute across the round.", c: "bg-amber-400" },
    { k: "VAGUE CLAIMS", v: String(vague), d: "Anything you can't put a number on gets a follow-up.", c: "bg-[#7F70F0]" },
    { k: "STAR CHECK", v: finished ? "3/4" : "–", d: "Situation, task, action… and the result you forgot to say.", c: "bg-sky-400" },
  ];

  return (
    <section className={DARK}>
      <CircuitTraces className="opacity-70" />
      <div ref={ref} className={WRAP}>
        <Head dark n="02" label="What it catches" title={<>It hears what your friends are <span className={HL}>too polite</span> to mention.</>} sub="One answer, marked up the way a sharp interviewer hears it." />
        <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          {/* the answer */}
          <div className="relative rounded-[28px] border border-white/10 bg-white/[.04] p-7 text-[#EAF2FF] shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur md:p-9">
            <div className="flex items-center justify-between">
              <Mono className="text-[11px] text-sky-300">Q3 · “WALK ME THROUGH A PROJECT YOU LED”</Mono>
              <button onClick={() => setRun((r) => r + 1)} className="font-[family-name:var(--font-geist-mono)] text-[11px] text-white/50 hover:text-white">↻ REPLAY</button>
            </div>
            <p className="mt-6 min-h-[168px] text-[20px] leading-[1.7] md:text-[23px]">
              {parts}
              {!finished && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[3px] animate-pulse bg-white/80" />}
            </p>
            {/* always in the layout, only fades: the card never changes height */}
            <motion.div initial={false} animate={{ opacity: finished ? 1 : 0, y: finished ? 0 : 8 }} aria-hidden={!finished} className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
                  <Mono className="rounded-full bg-sky-400/15 px-2.5 py-1 text-[11px] text-sky-300">✗ NO RESULT</Mono>
                  <span className="text-[15px] text-[#9FB3CF]">You never said what changed. Next question: <span className="text-white">“What was p95 before and after?”</span></span>
                </motion.div>
          </div>

          {/* what it caught */}
          <ul className="grid grid-cols-1 gap-3">
            {catches.map((c) => (
              <li key={c.k} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[.05] p-5">
                <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", c.c)} />
                <div className="min-w-0 flex-1">
                  <Mono className="text-[11px] text-white/50">{c.k}</Mono>
                  <p className="mt-0.5 text-[14.5px] text-[#9FB3CF] max-md:hidden">{c.d}</p>
                </div>
                <Mono className="text-[28px] leading-none text-white">{c.v}</Mono>
              </li>
            ))}
            <li className="px-1 text-[14px] text-white/50 max-md:hidden">Every answer in your report gets this, with a better version written underneath.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 03 · IT READ YOUR LAST REPORT (dark peak) ═══════════════ */

export function MiSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.35, once: true });
  const reduce = useReducedMotion();
  return (
    <section className="grain relative overflow-clip bg-[hsl(var(--ix-navy))] py-24 text-[#EAF2FF] md:py-32">
      <CircuitTraces className="opacity-50" />
      <div className="pointer-events-none absolute -inset-x-1/2 bottom-0 h-[42%] origin-bottom [transform:perspective(520px)_rotateX(58deg)] bg-[linear-gradient(rgba(31,143,255,.28)_2px,transparent_2px),linear-gradient(90deg,rgba(31,143,255,.28)_2px,transparent_2px)] bg-[length:90px_90px] opacity-50 [mask-image:linear-gradient(to_top,#000_10%,transparent_85%)]" />
      <div ref={ref} className={WRAP}>
        <Head dark n="04" label="It read your last report"
          title={<>Session 1, caching tripped you up. Session 2 <span className="bg-gradient-to-r from-[#A99CFF] to-[#5CC2FF] bg-clip-text pr-[0.06em] text-transparent">starts there.</span></>}
          aside={<Mono className="mb-3 inline-block rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[11.5px] text-sky-300">● SESSION 2 · YOUR PREP</Mono>}
          sub="Before the first question, it reads your past reports. The round goes to your weak spots, not the ones you've already fixed." />
        <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1fr]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease }}>
            <Mono className="mb-2 block text-[11px] text-white/50">AFTER SESSION 1 · INTERVIEW MEMORY</Mono>
            <BrowserFrame url="app.interviewtrix.com/dashboard/interviews/report"><LoopVideo name="mi-memcard" /></BrowserFrame>
          </motion.div>
          {/* the wire between them, with one packet riding it */}
          <svg aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 hidden h-24 w-28 -translate-x-1/2 -translate-y-1/2 lg:block" viewBox="0 0 112 96">
            <motion.path id="mi-wire" d="M4 48 C 40 48, 72 48, 108 48" stroke="#1F8FFF" strokeWidth="2" fill="none" strokeDasharray="4 6" initial={{ pathLength: 0 }} animate={on ? { pathLength: 1 } : {}} transition={{ delay: 0.5, duration: 1.2 }} />
            {on && !reduce && <circle r="4" fill="#5CC2FF" style={{ offsetPath: "path('M4 48 C 40 48, 72 48, 108 48')", animation: "mem-travel 1.6s linear infinite" }} />}
          </svg>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.9, duration: 0.6, ease }}>
            <Mono className="mb-2 block text-[11px] text-sky-300">SESSION 2 · TARGETING YOUR WEAK AREAS</Mono>
            <BrowserFrame url="app.interviewtrix.com/interview/session-2/live"><LoopVideo name="mi-session2" /></BrowserFrame>
          </motion.div>
        </div>
        <div className="mt-10 flex flex-wrap gap-2">
          {["✓ Caching & CDN invalidation · targeted", "✓ STAR structure · targeted", "✓ React rendering · not repeated"].map((c, i) => (
            <motion.span key={c} initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : {}} transition={{ delay: 1.4 + i * 0.15 }} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-[family-name:var(--font-geist-mono)] text-[12px] text-[#CFE0F7]">{c}</motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 04 · THE REPORT (scroll-driven zoom into the real report) ═══════════════ */

const REPORT_NOTES = [
  { k: "OVERALL", t: "84, and why it isn't 90.", d: "30 minutes, 14 questions, scored the moment the round ends." },
  { k: "AREAS FOR IMPROVEMENT", t: "The one thing to fix first.", d: "“Caching & CDN invalidation: answers stayed surface-level.” Your next round starts there." },
  { k: "BEHAVIOURAL SIGNALS", t: "How you said it.", d: "4 filler words a minute, 1m 52s average answer, 91% eye contact, 68% talk ratio." },
];

export function MiReport() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.3, once: true });
  return (
    <section className={LAVENDER}>
      <div ref={ref} className={WRAP}>
        <Head n="03" label="Your report" title={<>Know what to fix <span className={HL}>before Thursday.</span></>} sub="Overall score, four category scores, what went well and what to fix first." />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease }}>
          <BrowserFrame url="app.interviewtrix.com/dashboard/interviews/report">
            {/* gentle, time-based camera drift over the real capture: never more than 8%, never tied to scroll */}
            <div className="overflow-hidden">
              <motion.div animate={reduce ? undefined : { scale: [1, 1.08, 1.08, 1], originX: [0.5, 0.3, 0.75, 0.5], originY: [0.5, 0.35, 0.6, 0.5] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", times: [0, 0.35, 0.7, 1] }}>
                <LoopVideo name="mi-report" />
              </motion.div>
            </div>
          </BrowserFrame>
        </motion.div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {REPORT_NOTES.map((n, i) => (
            <motion.div key={n.k} initial={{ opacity: 0, y: 12 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 + i * 0.12, duration: 0.5, ease }}
              className="rounded-2xl border border-border bg-white p-5">
              <Mono className="text-[11px] text-primary">0{i + 1} · {n.k}</Mono>
              <p className={cn("mt-1 text-[18px] font-bold tracking-tight", INK)}>{n.t}</p>
              <p className="mt-1 text-[14.5px] text-muted-foreground max-md:hidden">{n.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 05 · SKILLS GRAPH (compact: only what a voice round measures) ═══════════════ */

const SK_HUBS: SkHub[] = [
  { name: "Communication", a: -90, leaves: [
    { n: "Pacing", s: "slipping", v: 54, d: -6, why: "164 wpm whenever the interviewer pushes back. Next round: timed STAR answers." },
    { n: "Filler words", s: "strong", v: 82, d: 9, why: "Down from 7 per answer to 1. “Basically” is gone." },
    { n: "Clarity", s: "strong", v: 76, d: 4, why: "Rated easy to follow in 7 of your last 9 rounds." },
    { n: "Plain words", s: "hidden", v: 71, d: 3, why: "You explain trade-offs without jargon. Senior panels notice that." },
  ]},
  { name: "Delivery", a: 0, leaves: [
    { n: "Confidence", s: "strong", v: 82, d: 6, why: "Your voice stays steady even after a hard follow-up." },
    { n: "Eye contact", s: "strong", v: 91, d: 2, why: "91% across the round, including while you were thinking." },
    { n: "Talk ratio", s: "hidden", v: 68, d: 1, why: "You let the interviewer finish. 68% is right where strong candidates land." },
    { n: "Answer length", s: "slipping", v: 58, d: -4, why: "1m 52s on average. Aim for 90 seconds, then stop." },
  ]},
  { name: "Behavioural", a: 90, leaves: [
    { n: "STAR structure", s: "strong", v: 79, d: 5, why: "Situation and result are clear in 6 of your last 8 stories." },
    { n: "Ownership", s: "strong", v: 78, d: 3, why: "Your migration story now says what you decided, not what the team did." },
    { n: "Failure stories", s: "slipping", v: 60, d: -3, why: "You rush the lesson. Spend the last 20 seconds on what changed." },
    { n: "Mentoring", s: "hidden", v: 72, d: 2, why: "Three of your stories show you unblocking juniors. Lead with it for senior roles." },
  ]},
  { name: "Problem solving", a: 180, leaves: [
    { n: "Breaking it down", s: "strong", v: 86, d: 3, why: "Strongest skill overall, across voice, coding and design." },
    { n: "Edge cases", s: "strong", v: 80, d: 2, why: "You list empty input and duplicates before you answer, every time." },
    { n: "Estimation", s: "hidden", v: 70, d: 4, why: "You size the problem before answering, which most candidates skip." },
    { n: "Caching", s: "slipping", v: 58, d: -2, why: "Answers skip eviction and invalidation. Your next round opens with it." },
  ]},
];

export const MiSkills = () => <SkillsSection n="05" hubs={SK_HUBS} initial="Pacing" live="LIVE · UPDATED AFTER SESSION 4" />;

/* ═══════════════ 05 · THE REPORT ISN'T THE END ═══════════════ */

const INS = ["Your resume", "The job description", "Past reports"];
const OUTS = [
  { t: "Resume editor", d: "Rewrites the line you couldn't defend, with the number you said out loud." },
  { t: "Coding round", d: "Knows you explain well but rush edge cases." },
  { t: "Skills Graph", d: "Marks each skill strong, slipping or a hidden strength." },
  { t: "iX Score", d: "Screening is one of four categories recruiters see." },
];

export function MiAfter() {
  return (
    <Wiring n="06" label="One memory" title={<>The report <span className={HL}>isn&apos;t the end</span> of it.</>} sub="Everything the round learned moves on. The next tool you open already knows it." ins={INS} outs={OUTS}>
      {(on: boolean) => (<>
              <Mono className="text-[10.5px] text-sky-300">AI MOCK INTERVIEW · REPORT</Mono>
              <div className="mt-4 flex items-center gap-4">
                <span className="relative grid size-[68px] place-items-center">
                  <svg viewBox="0 0 68 68" className="absolute inset-0 -rotate-90"><circle cx="34" cy="34" r="29" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5" />
                    <motion.circle cx="34" cy="34" r="29" fill="none" stroke="url(#kit-wire-g)" strokeWidth="5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={on ? { pathLength: 0.84 } : {}} transition={{ delay: 0.7, duration: 1.2, ease }} /></svg>
                  <span className="text-[22px] font-bold"><CountUp to={84} run={on} /></span>
                </span>
                <div><p className="font-bold">Senior Frontend Engineer</p><p className="text-[13px] text-[#9FB3CF]">Lumora Pay · 30 min · 14 questions</p></div>
              </div>
              <div className="mt-5 space-y-2 text-[13.5px]">
                {[["✓", "Clear answers on React rendering", "text-emerald-300"], ["!", "Caching answers stayed surface-level", "text-amber-300"], ["!", "Pace speeds up under follow-up pressure", "text-amber-300"]].map(([i, t, c], k) => (
                  <motion.p key={t} initial={{ opacity: 0, x: -6 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1 + k * 0.15 }} className={c}><span className="mr-1.5">{i}</span>{t}</motion.p>
                ))}
              </div>
      </>)}
    </Wiring>
  );
}

export const MiStickyCta = () => <StickyCta product="AI Mock Interview" cta="Start free mock" href={MK26_ROUTES.startInterview} />;
