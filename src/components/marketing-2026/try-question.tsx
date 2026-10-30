"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Mic, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Index, Mono } from "./primitives";
import { cn } from "@/lib/utils";

/**
 * "Hero as input": pick a role + company, get a real question, hold the mic.
 * This marketing version simulates the live analysis (no audio leaves the page); the full product
 * runs the real voice interviewer. Gate is on saving the result, not on trying.
 */
const roles = ["Frontend", "Backend", "Data analyst", "Product manager", "Fresher (CSE)"] as const;
const companies = ["Razorpay", "Flipkart", "TCS", "Swiggy", "Amazon"] as const;
const Q: Record<(typeof roles)[number], string> = {
  Frontend: "Your checkout page takes 6 seconds to load on 3G. Walk me through the first three things you'd measure.",
  Backend: "Two payment callbacks arrive for the same order, 40 ms apart. How do you make sure the customer is charged once?",
  "Data analyst": "Weekly orders dropped 8% but revenue is flat. What would you look at first, and why?",
  "Product manager": "Delivery partners are rejecting 15% more orders this month. How do you find out why?",
  "Fresher (CSE)": "Tell me about a project you built where something broke. What did you do next?",
};
const A: Record<(typeof roles)[number], { t: string; fb: string }> = {
  Frontend: { t: "So the first thing I'd do is, um, check if it's the network or the bundle, basically by looking at…", fb: "You named the right split (network vs bundle) but never said how you'd measure it. Expect a follow-up on Lighthouse or field data." },
  Backend: { t: "So, um, I'd basically use an idempotency key on the order, like store it in Redis before we, uh, charge…", fb: "Right idea, idempotency key. You skipped what happens if Redis is down. That's the follow-up a Razorpay panel asks." },
  "Data analyst": { t: "I'd, um, first check if average order value went up, basically, like split it by city and…", fb: "Good first cut. Say what result would change your mind, so it sounds like a hypothesis, not a list." },
  "Product manager": { t: "So I'd basically talk to partners first, um, and also look at, like, the rejection reasons in…", fb: "Lead with the data you already have before interviews. Name one metric you'd watch daily." },
  "Fresher (CSE)": { t: "So in my final-year project, um, the login basically stopped working when, like, we deployed…", fb: "Nice, a real failure. Spend more time on what you changed afterwards. That's what they score." },
};
const fillers = new Set(["um,", "um", "basically", "basically,", "like", "like,", "uh,"]);

export function TryQuestion() {
  const reduce = useReducedMotion();
  const [role, setRole] = useState<(typeof roles)[number]>("Backend");
  const [co, setCo] = useState<(typeof companies)[number]>("Razorpay");
  const [phase, setPhase] = useState<"idle" | "live" | "done">("idle");
  const [w, setW] = useState(0);
  const [secs, setSecs] = useState(0);
  const tick = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => () => clearInterval(tick.current), []);
  const start = () => {
    setPhase("live"); setW(0); setSecs(0);
    clearInterval(tick.current);
    tick.current = setInterval(() => {
      setW((x) => { if (x >= A[role].t.split(" ").length) { clearInterval(tick.current); setPhase("done"); return x; } return x + 1; });
      setSecs((s) => s + 0.35);
    }, 350);
  };
  const stop = () => { clearInterval(tick.current); setPhase("done"); };
  const transcript = A[role].t.split(" ");
  const said = transcript.slice(0, w);
  const fill = said.filter((t) => fillers.has(t)).length;

  return (
    <section className="relative overflow-clip bg-background py-24 md:py-28">
      <div className="bg-dots mask-fade pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 px-5 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
        <div>
          <Index n="02" label="Your first rehearsal" />
          <Mono className="text-[12.5px] text-muted-foreground">NO SIGN-UP · 60 SECONDS</Mono>
          <h2 className="mt-3 text-[44px] font-black leading-[0.98] tracking-[-0.05em] md:text-[68px]">Try one question. Out loud. Right now.</h2>
          <p className="mt-5 max-w-[42ch] text-[18px] text-muted-foreground">Pick the job you're going for. You'll get the kind of question that round really asks, and feedback on how you said it.</p>
        </div>

        <div className="relative min-w-0 rounded-[28px] border border-border bg-card p-5 shadow-[0_40px_80px_-40px_rgba(47,43,61,.4)] md:p-7">
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <button key={r} onClick={() => { setRole(r); setPhase("idle"); }} aria-pressed={role === r}
                className={cn("rounded-full border px-3.5 py-1.5 text-[13.5px] transition-colors", role === r ? "border-foreground bg-foreground text-white" : "border-border hover:border-foreground/40")}>{r}</button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            at
            {companies.map((c) => (
              <button key={c} onClick={() => { setCo(c); setPhase("idle"); }} aria-pressed={co === c}
                className={cn("rounded-lg px-2.5 py-1 font-medium transition-colors", co === c ? "bg-primary-muted text-primary" : "hover:text-foreground")}>{c}</button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-[hsl(var(--ix-navy))] p-6 text-[#EAF2FF]">
            <Mono className="text-[11px] text-sky-300">{co.toUpperCase()} · {role.toUpperCase()} · ROUND 1</Mono>
            <AnimatePresence mode="wait">
              <motion.p key={role + co} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-[21px] font-semibold leading-snug md:text-[24px]">{Q[role]}</motion.p>
            </AnimatePresence>
            <div className="mt-6 flex items-center gap-5">
              <button onClick={phase === "live" ? stop : start} aria-label={phase === "live" ? "Stop answering" : "Start answering"}
                className={cn("relative grid size-16 shrink-0 place-items-center rounded-full transition-colors", phase === "live" ? "bg-[#FF4E8B]" : "bg-primary hover:bg-primary/90")}>
                {phase === "live" && !reduce && <span className="absolute inset-0 animate-ping rounded-full bg-[#FF4E8B]/50" />}
                {phase === "live" ? <Square className="relative size-5 fill-white text-white" /> : <Mic className="relative size-6 text-white" />}
              </button>
              <div className="flex h-12 min-w-0 flex-1 items-center gap-[3px] overflow-hidden">
                {Array.from({ length: 48 }).map((_, i) => (
                  <motion.span key={i} className="w-[3px] flex-none rounded-full bg-sky-400/80"
                    animate={phase === "live" && !reduce ? { height: [5, 8 + ((i * 29) % 34), 5] } : { height: 5 }}
                    transition={{ duration: 0.8 + ((i * 7) % 6) / 10, repeat: phase === "live" ? Infinity : 0, delay: (i % 8) * 0.04 }} />
                ))}
              </div>
              <Mono className="w-14 text-right text-[13px] text-[#9FB3CF]">0:{String(Math.floor(secs)).padStart(2, "0")}</Mono>
            </div>
            <p className="mt-4 min-h-[52px] break-words text-[15px] leading-relaxed text-[#CFE0F7]">
              {phase === "idle" ? <span className="text-[#6E86A8]">Tap the mic and answer like you would in the room.</span> :
                said.map((t, i) => <Fragment key={i}>{i > 0 && " "}<span className={cn(fillers.has(t) && "rounded bg-[#FFC44D]/15 px-1 text-[#FFC44D] line-through")}>{t}</span></Fragment>)}
            </p>
          </div>

          <AnimatePresence>
            {phase !== "idle" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[["Pace", `${phase === "done" ? 158 : 120 + w * 2} wpm`, phase === "done" ? "text-warning" : ""], ["Filler words", String(fill), fill > 1 ? "text-warning" : ""], ["Structure", phase === "done" ? "2 / 4" : "…", phase === "done" ? "text-warning" : ""]].map(([k, v, c]) => (
                    <div key={k} className="rounded-xl border border-border p-3"><span className="block text-[11.5px] text-muted-foreground">{k}</span><Mono className={cn("text-[20px]", c)}>{v}</Mono></div>
                  ))}
                </div>
                {phase === "done" && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col gap-3 rounded-2xl bg-primary-muted p-4 sm:flex-row sm:items-center">
                    <p className="flex-1 text-[14.5px]"><b>Good instinct, rushed delivery.</b> {A[role].fb}</p>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" className="rounded-lg" onClick={start}><RotateCcw /> Again</Button>
                      <Button size="sm" className="rounded-lg">Save &amp; get full report</Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <Mono className="mt-4 block break-words text-[10.5px] text-muted-foreground">DEMO ON THIS PAGE · THE REAL INTERVIEWER LISTENS, FOLLOWS UP AND SCORES EVERY ANSWER</Mono>
        </div>
      </div>
    </section>
  );
}
