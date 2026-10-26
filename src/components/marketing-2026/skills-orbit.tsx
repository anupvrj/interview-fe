"use client";
import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { STYLE, type State } from "./skill-trend";
import { cn } from "@/lib/utils";

/**
 * Interactive Skills Graph. Opens from the centre: "You" first, then the areas spiral out into
 * place, then each area fans out its skills. Click an area to fold its skills back in; click a
 * skill to select it. Text never rotates; only positions orbit.
 */
export type OrbitLeaf = { n: string; s: State; v: number };
export type OrbitHub = { name: string; a: number; leaves: OrbitLeaf[] };

const W = 760, H = 600, C = { x: 380, y: 300 }, R1 = 150, R2 = 96, FAN = 40, SPIN = -150;
const rad = (d: number) => (d * Math.PI) / 180;
const r1 = (n: number) => Math.round(n * 10) / 10;

export function SkillsOrbit({ hubs, sel, folded, run, replay, onPick, onFold, onCore }: {
  hubs: OrbitHub[]; sel: string; folded: string[]; run: boolean; replay: number;
  onPick: (n: string) => void; onFold: (hub: string) => void; onCore?: (gathered: boolean) => void;
}) {
  const reduce = useReducedMotion();
  const spin = useMotionValue(SPIN); // degrees the whole graph still has to turn
  const grow = useMotionValue(0); // areas: centre → their ring
  const fan = useMotionValue(0); // skills: area → their place
  const core = useMotionValue(0);
  const big = useMotionValue(0); // 1 = everything gathered into "You"
  const [settled, setSettled] = useState(false); // packets only start once the graph has landed
  const [gathered, setGathered] = useState(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!run) return;
    if (reduce) { core.set(1); spin.set(0); grow.set(1); fan.set(1); return; }
    core.set(0); spin.set(SPIN); grow.set(0); fan.set(0); big.set(0); setSettled(false); setGathered(false);
    const a = [
      animate(core, 1, { duration: 0.5, ease: [0.16, 1, 0.3, 1] }),
      animate(grow, 1, { delay: 0.35, duration: 1.3, ease: [0.16, 1, 0.3, 1] }),
      animate(spin, 0, { delay: 0.35, duration: 1.6, ease: [0.22, 1, 0.36, 1] }),
      animate(fan, 1, { delay: 1.05, duration: 0.9, ease: [0.16, 1, 0.3, 1], onComplete: () => setSettled(true) }),
    ];
    return () => a.forEach((x) => x.stop());
  }, [run, replay, reduce, core, spin, grow, fan, big]);

  // click "You": everything folds home and the core swells; click again and it all blooms back out
  const toggle = () => {
    const next = !gathered;
    setGathered(next); onCore?.(next); setSettled(false);
    if (reduce) { grow.set(next ? 0 : 1); fan.set(next ? 0 : 1); big.set(next ? 1 : 0); if (!next) setSettled(true); return; }
    if (next) {
      animate(fan, 0, { duration: 0.32, ease: [0.4, 0, 0.2, 1] });
      animate(grow, 0, { delay: 0.18, duration: 0.55, ease: [0.65, 0, 0.35, 1] });
      animate(spin, 80, { delay: 0.18, duration: 0.6, ease: [0.65, 0, 0.35, 1] });
      animate(big, 1, { delay: 0.55, type: "spring", stiffness: 240, damping: 13, onPlay: () => setPulse((p) => p + 1) });
    } else {
      spin.set(-90); // areas are all at the centre here, so this reset is invisible
      animate(big, 0, { duration: 0.3, ease: [0.4, 0, 0.2, 1] });
      animate(grow, 1, { delay: 0.12, duration: 0.75, ease: [0.16, 1, 0.3, 1] });
      animate(spin, 0, { delay: 0.12, duration: 0.85, ease: [0.22, 1, 0.36, 1] });
      animate(fan, 1, { delay: 0.45, duration: 0.55, ease: [0.16, 1, 0.3, 1], onComplete: () => setSettled(true) });
    }
  };

  const coreR = useTransform([core, big], ([c, b]: number[]) => c * (36 + 22 * b));
  const haloR = useTransform([core, big], ([c, b]: number[]) => c * (52 + 44 * b));
  const nameY = useTransform(big, [0, 1], [C.y + 6, C.y - 2]);
  const countO = useTransform(big, [0.4, 1], [0, 1]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="relative w-full select-none" role="img" aria-label="Interactive Skills Graph. Select an area to fold or open it, or a skill to see what the interviewer noticed.">
      <defs>
        <radialGradient id="so-core"><stop offset="0" stopColor="#8E83F5" /><stop offset="1" stopColor="#5A4BE0" /></radialGradient>
        {(Object.keys(STYLE) as State[]).map((k) => (
          <radialGradient key={k} id={`so-glow-${k}`}><stop offset="0" stopColor={STYLE[k].color} stopOpacity=".32" /><stop offset="1" stopColor={STYLE[k].color} stopOpacity="0" /></radialGradient>
        ))}
      </defs>

      {/* two orbit rings turning slowly in opposite directions */}
      {[{ r: R1, d: "2 10", t: "60s", dir: "normal" }, { r: R1 + R2 + 24, d: "1 14", t: "90s", dir: "reverse" }].map((o) => (
        <motion.g key={o.r} style={{ opacity: grow, transformOrigin: `${C.x}px ${C.y}px`, transformBox: "view-box" as const, animation: reduce ? undefined : `spin ${o.t} linear infinite ${o.dir}` }}>
          <circle cx={C.x} cy={C.y} r={o.r} fill="none" stroke="#7367F0" strokeOpacity=".28" strokeWidth="1.2" strokeDasharray={o.d} strokeLinecap="round" />
          <circle cx={C.x + o.r} cy={C.y} r="3" fill="#7367F0" fillOpacity=".55" />
        </motion.g>
      ))}

      {hubs.map((h) => (
        <HubGroup key={h.name} hub={h} spin={spin} grow={grow} fan={fan} open={!folded.includes(h.name)} sel={sel} done={settled && !reduce} onPick={onPick} onFold={onFold} />
      ))}

      {/* you: the toggle */}
      <g className="cursor-pointer" onClick={toggle} role="button" aria-pressed={gathered} aria-label={gathered ? "Open the Skills Graph" : "Gather every skill into you"}>
        {pulse > 0 && !reduce && <motion.circle key={pulse} cx={C.x} cy={C.y} fill="none" stroke="#7367F0" strokeWidth="2"
          initial={{ r: 40, opacity: 0.6 }} animate={{ r: 170, opacity: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />}
        <motion.circle cx={C.x} cy={C.y} r={haloR} fill="#7367F0" opacity=".14" />
        <motion.circle cx={C.x} cy={C.y} r={coreR} fill="url(#so-core)" className="transition-[filter] duration-300 hover:brightness-110" />
        <motion.text x={C.x} y={nameY} textAnchor="middle" style={{ opacity: core }} className="pointer-events-none fill-white text-[17px] font-bold">You</motion.text>
        <motion.text x={C.x} y={C.y + 16} textAnchor="middle" style={{ opacity: countO }} className="pointer-events-none fill-white/80 font-[family-name:var(--font-geist-mono)] text-[10px]">
          {hubs.reduce((n, h) => n + h.leaves.length, 0)} SKILLS
        </motion.text>
      </g>
    </svg>
  );
}

function HubGroup({ hub, spin, grow, fan, open, sel, done, onPick, onFold }: {
  hub: OrbitHub; spin: MotionValue<number>; grow: MotionValue<number>; fan: MotionValue<number>;
  open: boolean; sel: string; done: boolean; onPick: (n: string) => void; onFold: (hub: string) => void;
}) {
  const openness = useSpring(open ? 1 : 0, { stiffness: 180, damping: 22 });
  useEffect(() => { openness.set(open ? 1 : 0); }, [open, openness]);
  const hx = useTransform([spin, grow], ([s, g]: number[]) => r1(C.x + Math.cos(rad(hub.a + s)) * R1 * g));
  const hy = useTransform([spin, grow], ([s, g]: number[]) => r1(C.y + Math.sin(rad(hub.a + s)) * R1 * g));
  const bottom = hub.a === 90;
  const ly = useTransform(hy, (y) => y + (bottom ? -20 : 30));
  // final resting place, for the travelling packet (only once everything has settled)
  const fx = r1(C.x + Math.cos(rad(hub.a)) * R1), fy = r1(C.y + Math.sin(rad(hub.a)) * R1);

  return (
    <g>
      <motion.line x1={C.x} y1={C.y} x2={hx} y2={hy} stroke="rgba(115,103,240,.35)" strokeWidth="1.6" />
      {done && <circle r="3" fill="#7367F0" style={{ offsetPath: `path('M${fx} ${fy} L${C.x} ${C.y}')`, animation: `mem-travel 2.4s linear infinite both` }} />}

      {hub.leaves.map((l, i) => (
        <LeafNode key={l.n} leaf={l} angle={hub.a + (i - (hub.leaves.length - 1) / 2) * FAN} hx={hx} hy={hy} spin={spin} fan={fan} openness={openness}
          active={l.n === sel} open={open} done={done} i={i} fx={fx} fy={fy} onPick={onPick} />
      ))}

      <motion.g style={{ x: hx, y: hy, scale: grow }} className="cursor-pointer" onClick={() => onFold(hub.name)} role="button" aria-label={`${open ? "Fold" : "Open"} ${hub.name}`}>
        <circle r="18" fill="transparent" />
        <circle r={open ? 11 : 14} fill="#EEECFE" stroke="#7367F0" strokeOpacity=".6" strokeWidth="1.5" className="transition-all duration-300" />
        {open ? <circle r="4" fill="#7367F0" /> : <text y="4" textAnchor="middle" className="fill-[#5A4BE0] font-[family-name:var(--font-geist-mono)] text-[11px] font-bold">+{hub.leaves.length}</text>}
      </motion.g>
      <motion.text x={hx} y={ly} textAnchor="middle" stroke="#FFFFFF" strokeWidth="4" paintOrder="stroke" style={{ opacity: grow }}
        className="pointer-events-none fill-[#6B7194] font-[family-name:var(--font-geist-mono)] text-[11.5px] uppercase tracking-wider">{hub.name}</motion.text>
    </g>
  );
}

function LeafNode({ leaf, angle, hx, hy, spin, fan, openness, active, open, done, i, fx, fy, onPick }: {
  leaf: OrbitLeaf; angle: number; hx: MotionValue<number>; hy: MotionValue<number>; spin: MotionValue<number>; fan: MotionValue<number>;
  openness: MotionValue<number>; active: boolean; open: boolean; done: boolean; i: number; fx: number; fy: number; onPick: (n: string) => void;
}) {
  const st = STYLE[leaf.s];
  const lx = useTransform([hx, spin, fan, openness], ([x, s, f, o]: number[]) => r1(x + Math.cos(rad(angle + s)) * R2 * f * o));
  const ly = useTransform([hy, spin, fan, openness], ([y, s, f, o]: number[]) => r1(y + Math.sin(rad(angle + s)) * R2 * f * o));
  const vis = useTransform([fan, openness], ([f, o]: number[]) => Math.min(f, o));
  // label side from the final angle, so text never flips mid-orbit
  const cx = Math.cos(rad(angle)), cy = Math.sin(rad(angle));
  const side = cx < -0.15 ? "end" : cx > 0.15 ? "start" : "middle";
  const tx = useTransform(lx, (x) => x + (side === "end" ? -15 : side === "start" ? 15 : 0));
  const ty = useTransform(ly, (y) => y + (side !== "middle" ? 5 : cy < 0 ? -16 : 26));
  // packet along the settled skill → area edge
  const edge = `M${r1(fx + cx * R2)} ${r1(fy + cy * R2)} L${fx} ${fy}`;

  return (
    <g style={{ pointerEvents: open ? "auto" : "none" }}>
      <motion.line x1={hx} y1={hy} x2={lx} y2={ly} stroke={st.color} strokeWidth={active ? 2.6 : 1.7} strokeDasharray={st.dash} strokeLinecap="round" style={{ opacity: vis }} />
      <motion.g style={{ x: lx, y: ly, opacity: vis, scale: vis }} className="cursor-pointer" onClick={() => onPick(leaf.n)} onMouseEnter={() => onPick(leaf.n)}>
        <circle r={active ? 26 : 16} fill={`url(#so-glow-${leaf.s})`} className="transition-all duration-500" />
        <circle r={active ? 9.5 : 7} fill="#FFFFFF" stroke={st.color} strokeWidth="2.5" className="transition-all duration-300" />
        {active && <circle r="3.5" fill={st.color} />}
      </motion.g>
      <motion.text x={tx} y={ty} textAnchor={side} stroke="#FFFFFF" strokeWidth="3" paintOrder="stroke" style={{ opacity: vis }}
        className={cn("pointer-events-none text-[14px] transition-colors max-sm:hidden", active ? "fill-[#2E3656] font-semibold" : "fill-[#4B5275]")}>
        {leaf.n}{active && <tspan className="font-[family-name:var(--font-geist-mono)]" fill={st.color} dx="6">{leaf.v}</tspan>}
      </motion.text>
      {done && open && <circle r={active ? 3 : 2.2} fill={st.color} style={{ offsetPath: `path('${edge}')`, animation: `mem-travel ${1.8 + (i % 4) * 0.3}s ${i * 0.25}s linear infinite both` }} />}
    </g>
  );
}
