"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Code2, FileText, Mic, Network, Share2, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Index, Mono } from "./primitives";
import { SkillTrend, STYLE, type State } from "./skill-trend";
import { CircuitTraces } from "./graphics";
import { cn } from "@/lib/utils";

/**
 * Skills Graph, modelled on skill-graph.com's network map: you at the centre, six interview-skill
 * clusters, ~24 evidence-backed skills. Ring colour + line style = state (validated palette, see
 * skill-trend.tsx), node size = how much evidence backs it. A session scrubber grows the graph.
 */
type Leaf = { n: string; s: State; v: number; ev: number; since: number; flip?: number; why: string };
type Hub = { id: string; name: string; a: number; leaves: Leaf[] };

const HUBS: Hub[] = [
  { id: "comm", name: "Communication", a: -90, leaves: [
    { n: "Pacing", s: "slipping", v: 54, ev: 9, since: 1, flip: 6, why: "164 wpm whenever the interviewer pushes back, since mock #6. Next drill: timed STAR answers." },
    { n: "Filler words", s: "strong", v: 82, ev: 9, since: 1, why: "Down from 7 per answer to 1. 'Basically' is gone." },
    { n: "STAR structure", s: "strong", v: 79, ev: 8, since: 2, why: "Situation and result are clear in 6 of your last 8 stories." },
    { n: "Clarity", s: "strong", v: 76, ev: 9, since: 1, why: "Interviewers rated your answers easy to follow in 7 of 9 mocks." },
  ]},
  { id: "code", name: "Coding", a: -30, leaves: [
    { n: "Heaps", s: "strong", v: 84, ev: 6, since: 2, why: "Top-k and merge-k solved with hidden tests passing first try." },
    { n: "Dynamic programming", s: "slipping", v: 57, ev: 5, since: 3, flip: 5, why: "You find the recurrence but stall on the table. 2 of 5 DP rounds timed out." },
    { n: "Two pointers", s: "strong", v: 88, ev: 6, since: 2, why: "Fastest category: median 11 minutes." },
    { n: "Defending complexity", s: "slipping", v: 61, ev: 6, since: 2, flip: 6, why: "You couldn't justify the heap over bucket sort in coding round #6." },
  ]},
  { id: "sd", name: "System design", a: 30, leaves: [
    { n: "Caching", s: "slipping", v: 58, ev: 3, since: 4, flip: 7, why: "Answers skip eviction and invalidation. Next: two designs with a 10× traffic follow-up." },
    { n: "Sharding", s: "strong", v: 72, ev: 3, since: 4, why: "Picked a sensible shard key in the payments design without prompting." },
    { n: "Rate limiting", s: "strong", v: 77, ev: 2, since: 5, why: "Token bucket explained with real numbers." },
    { n: "Estimation", s: "hidden", v: 70, ev: 2, since: 6, why: "You size traffic before drawing, which most candidates skip." },
  ]},
  { id: "ps", name: "Problem solving", a: 90, leaves: [
    { n: "Edge cases", s: "strong", v: 80, ev: 8, since: 1, why: "You list empty input and duplicates before coding, every time." },
    { n: "Breaking it down", s: "strong", v: 86, ev: 8, since: 1, why: "Strongest skill overall: 86 across voice, coding and design." },
    { n: "Hypothesis first", s: "hidden", v: 73, ev: 4, since: 5, why: "While debugging you state a guess, then test it. Interviewers notice." },
  ]},
  { id: "beh", name: "Behavioural", a: 150, leaves: [
    { n: "Ownership", s: "strong", v: 78, ev: 4, since: 2, why: "Your Infosys migration story now says what you decided." },
    { n: "Conflict", s: "strong", v: 75, ev: 4, since: 3, why: "Disagreement stories end with a result, not a complaint." },
    { n: "Mentoring", s: "hidden", v: 72, ev: 3, since: 4, why: "Three of your stories show you unblocking juniors. Lead with it for senior roles." },
    { n: "Failure stories", s: "slipping", v: 60, ev: 3, since: 3, flip: 6, why: "You rush the lesson. Spend the last 20 seconds on what changed." },
  ]},
  { id: "dom", name: "Frontend", a: 210, leaves: [
    { n: "React rendering", s: "strong", v: 84, ev: 5, since: 1, why: "Reconciliation and memo trade-offs explained cleanly." },
    { n: "Web performance", s: "strong", v: 79, ev: 5, since: 2, why: "Your LCP-on-slow-3G answer scored 71, up from 52." },
    { n: "Product sense", s: "hidden", v: 69, ev: 4, since: 5, why: "You framed the feed design around user impact without being asked, in 3 sessions." },
    { n: "Accessibility", s: "hidden", v: 66, ev: 2, since: 7, why: "Mentioned WCAG unprompted twice. Rare at your level." },
  ]},
];

const W = 760, H = 600, C = { x: 380, y: 300 }, R1 = 168, R2 = 86;
const rad = (d: number) => (d * Math.PI) / 180;
const r2 = (n: number) => Math.round(n * 10) / 10;
const pos = (a: number, r: number, o = C) => ({ x: r2(o.x + Math.cos(rad(a)) * r), y: r2(o.y + Math.sin(rad(a)) * r) });

type Laid = Leaf & { x: number; y: number; hub: string; hx: number; hy: number; a: number };
function layout(): { hubs: (Hub & { x: number; y: number })[]; leaves: Laid[] } {
  const hubs = HUBS.map((h) => ({ ...h, ...pos(h.a, R1) }));
  const leaves = hubs.flatMap((h) => h.leaves.map((l, i) => {
    const a = h.a + (i - (h.leaves.length - 1) / 2) * (h.leaves.length === 3 ? 44 : 32);
    return { ...l, ...pos(a, R2, { x: h.x, y: h.y }), hub: h.id, hx: h.x, hy: h.y, a };
  }));
  return { hubs, leaves };
}

const sources = [
  { icon: Mic, t: "Voice mocks", d: "9 sessions" },
  { icon: Code2, t: "Coding rounds", d: "6 sessions" },
  { icon: Network, t: "System designs", d: "3 sessions" },
  { icon: FileText, t: "Resume + JD", d: "Razorpay SDE-2" },
];

export function SkillsGraph() {
  const reduce = useReducedMotion();
  const [view, setView] = useState<"map" | "trend">("map");
  const [session, setSession] = useState(8);
  const [sel, setSel] = useState("Pacing");
  const { hubs, leaves } = useMemo(layout, []);
  const stateAt = (l: Leaf): State => (l.flip && session < l.flip ? "strong" : l.s);
  const visible = leaves.filter((l) => l.since <= session);
  const focus = leaves.find((l) => l.n === sel)!;
  const focusHub = hubs.find((h) => h.id === focus.hub)!;
  const counts = visible.reduce((m, l) => { const k = stateAt(l); m[k] = (m[k] ?? 0) + 1; return m; }, {} as Partial<Record<State, number>>);

  return (
    <section id="skills-graph" className="ix-panel grain relative overflow-clip bg-[hsl(var(--ix-navy))] py-28 text-[#EAF2FF] md:py-32">
      <CircuitTraces className="opacity-70" />
      <div className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(127,112,240,.22),transparent)]" />
      <div className="relative mx-auto max-w-[1240px] px-5">
        <div className="grid items-end gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <Index n="05" label="See the gap" dark />
            <h2 className="max-w-[22ch] text-[36px] font-extrabold leading-[1.04] tracking-[-0.04em] md:text-[66px]">Map your skills. Find the gap. <span className="text-[#9B8CFF]">Fix it before the interview.</span></h2>
            <p className="mt-4 max-w-[56ch] text-[17px] text-[#9FB3CF]">Every voice, coding and system design session adds evidence to your Skills Graph. Hover a skill to see why it's strong, slipping or a strength you didn't know you had.</p>
          </div>
          <div role="tablist" className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 text-[13.5px]">
            {(["map", "trend"] as const).map((v) => (
              <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={cn("rounded-lg px-4 py-2 transition-colors", view === v ? "bg-white text-foreground" : "text-[#9FB3CF] hover:text-white")}>
                {v === "map" ? "Skill map" : "Trend over sessions"}
              </button>
            ))}
          </div>
        </div>

        {view === "trend" ? (
          <div className="mt-10"><SkillTrend /></div>
        ) : (
          <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_340px]">
            <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#0A1628] shadow-[0_40px_80px_-40px_rgba(0,0,0,.8)]">
              <div className="bg-dots pointer-events-none absolute inset-0 opacity-[.12] [filter:invert(1)]" />
              <svg viewBox={`0 0 ${W} ${H}`} className="relative w-full" role="group" aria-label={`Skills Graph after session ${session}`}>
                {hubs.map((h) => (
                  <line key={h.id} x1={C.x} y1={C.y} x2={h.x} y2={h.y} stroke={focus.hub === h.id ? "rgba(234,242,255,.55)" : "rgba(159,179,207,.22)"} strokeWidth={focus.hub === h.id ? 1.6 : 1} />
                ))}
                {!reduce && (
                  <motion.line key={focus.hub} x1={focusHub.x} y1={focusHub.y} x2={C.x} y2={C.y} stroke="#9B8CFF" strokeWidth="2" strokeDasharray="4 10"
                    animate={{ strokeDashoffset: [0, -28] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                )}
                {visible.map((l) => (
                  <motion.line key={`e-${l.n}`} x1={l.hx} y1={l.hy} x2={l.x} y2={l.y} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    stroke={l.n === sel ? STYLE[stateAt(l)].color : "rgba(159,179,207,.18)"} strokeWidth={l.n === sel ? 1.8 : 1} />
                ))}
                {hubs.map((h) => (
                  <g key={h.id}>
                    <circle cx={h.x} cy={h.y} r="13" fill="#132A48" stroke="rgba(234,242,255,.5)" strokeWidth="1.5" />
                    <text x={h.x} y={h.y + (h.a > 0 && h.a < 180 ? -22 : 32)} textAnchor="middle" fill="#EAF2FF" fontSize="13" fontWeight="600" paintOrder="stroke" stroke="#0A1628" strokeWidth="4">{h.name}</text>
                  </g>
                ))}
                <AnimatePresence>
                  {visible.map((l) => {
                    const st = stateAt(l), S = STYLE[st], r = 4 + l.ev * 0.75, on = l.n === sel;
                    const c = Math.cos(rad(l.a)), vertical = Math.abs(c) < 0.12, right = c >= 0;
                    return (
                      <motion.g key={l.n} tabIndex={0} role="button" aria-label={`${l.n}, ${l.v}, ${S.label}`} className="cursor-pointer outline-none"
                        onMouseEnter={() => setSel(l.n)} onFocus={() => setSel(l.n)} onClick={() => setSel(l.n)}
                        initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.4 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }} style={{ transformOrigin: `${l.x}px ${l.y}px` }}>
                        <circle cx={l.x} cy={l.y} r={r + 10} fill="transparent" />
                        {st === "hidden" && <circle cx={l.x} cy={l.y} r={r + 5} fill="none" stroke={S.color} strokeOpacity=".55" />}
                        <circle cx={l.x} cy={l.y} r={on ? r + 2 : r} fill={on ? S.color : "#0A1628"} stroke={S.color} strokeWidth="2" strokeDasharray={st === "slipping" ? "3 2.5" : undefined} />
                        <text x={vertical ? l.x : l.x + (right ? r + 7 : -(r + 7))} y={vertical ? l.y + (Math.sin(rad(l.a)) > 0 ? r + 15 : -(r + 7)) : l.y + 4} textAnchor={vertical ? "middle" : right ? "start" : "end"} fontSize="11.5"
                          fill={on ? "#FFFFFF" : "#9FB3CF"} fontWeight={on ? 600 : 400} className="max-sm:hidden">{l.n}</text>
                      </motion.g>
                    );
                  })}
                </AnimatePresence>
                <rect x={C.x - 34} y={C.y - 34} width="68" height="68" rx="16" fill="none" stroke="#7367F0" strokeOpacity=".35" />
                <rect x={C.x - 26} y={C.y - 26} width="52" height="52" rx="12" fill="#7367F0" />
                <text x={C.x} y={C.y + 5} textAnchor="middle" fill="#fff" fontSize="14" fontWeight="800">YOU</text>
              </svg>
              <div className="relative space-y-3 border-t border-white/10 px-4 py-4 sm:hidden">
                {hubs.map((h) => (
                  <div key={h.id}>
                    <Mono className="text-[10.5px] text-[#6E86A8]">{h.name.toUpperCase()}</Mono>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {visible.filter((l) => l.hub === h.id).map((l) => (
                        <button key={l.n} onClick={() => setSel(l.n)} aria-pressed={sel === l.n}
                          className={cn("flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[12px]", sel === l.n ? "border-white/50 bg-white/10" : "border-white/10 text-[#9FB3CF]")}>
                          <span className="size-2 rounded-full" style={{ background: STYLE[stateAt(l)].color }} />{l.n}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative flex items-center gap-4 border-t border-white/10 px-5 py-4">
                <Mono className="shrink-0 text-[11px] text-[#6E86A8]">SESSION</Mono>
                <input type="range" min={1} max={8} value={session} onChange={(e) => setSession(+e.target.value)} aria-label="Show the graph after session"
                  className="h-1 w-full cursor-pointer accent-[#9B8CFF]" />
                <Mono className="w-16 shrink-0 text-right text-[13px]">S{session} / 8</Mono>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <AnimatePresence mode="wait">
                <motion.div key={sel + session} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                  className="rounded-[22px] border border-white/10 bg-white p-5 text-foreground">
                  <div className="flex items-center justify-between">
                    <Mono className="text-[11px] text-muted-foreground">{focusHub.name.toUpperCase()}</Mono>
                    {(() => { const S = STYLE[stateAt(focus)]; return <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-[11.5px]"><S.icon className="size-3.5" style={{ color: S.color }} />{S.label}</span>; })()}
                  </div>
                  <p className="mt-2 text-[22px] font-bold tracking-tight">{focus.n}</p>
                  <Mono className="mt-1 block text-[34px] leading-none">{focus.v}<span className="text-[14px] text-muted-foreground">/100</span></Mono>
                  <p className="mt-3 text-[14.5px] text-muted-foreground">{focus.since > session ? "Not tested yet at this point." : focus.flip && session < focus.flip ? `Holding steady so far. Watch this one: it starts slipping in session ${focus.flip}.` : focus.why}</p>
                  <Mono className="mt-4 block border-t border-border pt-3 text-[11px] text-muted-foreground">BACKED BY {focus.ev} SESSIONS OF EVIDENCE</Mono>
                </motion.div>
              </AnimatePresence>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(STYLE) as State[]).map((k) => {
                  const S = STYLE[k];
                  return (
                    <div key={k} className="rounded-2xl border border-white/10 bg-white/[.04] p-3.5">
                      <S.icon className="size-4" style={{ color: S.color }} />
                      <Mono className="mt-2 block text-[24px] leading-none">{counts[k] ?? 0}</Mono>
                      <span className="mt-1 block text-[12px] text-[#9FB3CF]">{S.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col">
                <Button className="h-11 rounded-xl hover:bg-primary/90"><Workflow /> See my Skills Graph</Button>
                <Button variant="outline" className="h-11 rounded-xl border-white/15 bg-transparent text-white hover:border-white/40 hover:text-white"><Share2 /> Publish it to my portfolio</Button>
              </div>
            </div>
          </div>
        )}

        {/* skill-graph.com's evidence → insight flow, with our real sources */}
        <div className="mt-14 grid items-center gap-6 rounded-[26px] border border-white/10 bg-white/[.03] p-6 md:grid-cols-[1fr_auto_auto] md:p-8">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {sources.map(({ icon: I, t, d }) => (
              <div key={t} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0D1F36] px-3.5 py-3">
                <span className="grid size-8 place-items-center rounded-lg bg-white/5"><I className="size-4 text-sky-300" /></span>
                <div><p className="text-[14px] font-semibold">{t}</p><Mono className="text-[11px] text-[#6E86A8]">{d}</Mono></div>
              </div>
            ))}
          </div>
          <svg viewBox="0 0 120 80" className="hidden h-20 w-32 md:block" aria-hidden>
            {[10, 30, 50, 70].map((yy) => (
              <motion.path key={yy} d={`M0 ${yy} C 60 ${yy}, 60 40, 120 40`} fill="none" stroke="#9B8CFF" strokeOpacity=".6" strokeWidth="1.5" strokeDasharray="3 6"
                animate={reduce ? undefined : { strokeDashoffset: [0, -18] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
            ))}
          </svg>
          <div className="rounded-2xl bg-white p-5 text-foreground md:w-[280px]">
            <Mono className="text-[11px] text-muted-foreground">READINESS · RAZORPAY SDE-2</Mono>
            <Mono className="mt-1 block text-[40px] leading-none">82<span className="text-[15px] text-muted-foreground">/100</span></Mono>
            <p className="mt-3 text-[13.5px] text-muted-foreground">Fix <b className="text-foreground">Pacing</b> and <b className="text-foreground">Caching</b> first. That's the gap between you and this role.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
