"use client";
import { useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, Sparkles, Table2, LineChart } from "lucide-react";
import { Mono } from "./primitives";
import { cn } from "@/lib/utils";

/**
 * Skills Graph as a real time-series: score per skill across 8 sessions.
 * Palette validated with dataviz/validate_palette.js on #0A1628 (dark): passes lightness, chroma,
 * normal-vision and contrast; CVD green↔amber is in the 6–8 band, so state is ALSO encoded by
 * line style (solid / dashed / dotted), direct end labels and an icon in the legend.
 */
export type State = "strong" | "slipping" | "hidden";
export const STYLE: Record<State, { color: string; dash?: string; label: string; icon: typeof ArrowUpRight }> = {
  strong: { color: "#1E9E64", label: "Strong", icon: ArrowUpRight },
  slipping: { color: "#D27A1F", dash: "7 5", label: "Slipping", icon: ArrowDownRight },
  hidden: { color: "#7F70F0", dash: "1.5 5", label: "Hidden strength", icon: Sparkles },
};
const SKILLS: { name: string; state: State; v: (number | null)[]; note?: { at: number; text: string } }[] = [
  { name: "Problem solving", state: "strong", v: [58, 63, 66, 71, 75, 79, 83, 86] },
  { name: "Debugging", state: "strong", v: [64, 66, 70, 72, 74, 78, 80, 83] },
  { name: "Communication", state: "strong", v: [60, 61, 66, 69, 72, 75, 79, 81] },
  { name: "APIs", state: "strong", v: [55, 59, 62, 66, 70, 73, 76, 78] },
  { name: "Pacing", state: "slipping", v: [62, 66, 70, 71, 68, 63, 58, 54], note: { at: 5, text: "Slipping since mock #6 · 164 wpm under pressure" } },
  { name: "Trade-offs", state: "slipping", v: [68, 70, 71, 69, 66, 63, 60, 58] },
  { name: "Product sense", state: "hidden", v: [null, null, 41, 48, 57, 63, 66, 69], note: { at: 4, text: "Found in session 5 · you framed impact unprompted" } },
  { name: "Mentoring", state: "hidden", v: [null, null, null, 52, 58, 64, 69, 72] },
];
const W = 640, H = 360, P = { l: 40, r: 120, t: 24, b: 36 };
const x = (i: number) => P.l + (i * (W - P.l - P.r)) / 7;
// y-domain 30–100
const yy = (v: number) => P.t + ((100 - v) / 70) * (H - P.t - P.b);

function path(v: (number | null)[]) {
  let d = "", pen = false;
  v.forEach((n, i) => { if (n == null) { pen = false; return; } d += `${pen ? "L" : "M"}${x(i)} ${yy(n)} `; pen = true; });
  return d;
}

export function SkillTrend() {
  const [focus, setFocus] = useState<string>("Pacing");
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const f = SKILLS.find((s) => s.name === focus)!;
  const onMove = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - P.l) / (W - P.l - P.r)) * 7);
    setHover(i >= 0 && i <= 7 ? i : null);
  };
  return (
        <div className="rounded-[24px] border border-white/10 bg-[#0A1628]/90 p-4 shadow-[0_40px_80px_-40px_rgba(0,0,0,.8)] md:p-6">
          {/* filters in one row above the chart */}
          <div className="flex flex-wrap items-center gap-2">
            {SKILLS.map((s) => {
              const S = STYLE[s.state];
              return (
                <button key={s.name} onClick={() => setFocus(s.name)} aria-pressed={focus === s.name}
                  className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12.5px] transition-colors", focus === s.name ? "border-white/40 bg-white/10 text-white" : "border-white/10 text-[#9FB3CF] hover:text-white")}>
                  <svg width="18" height="6" aria-hidden><line x1="0" x2="18" y1="3" y2="3" stroke={S.color} strokeWidth="2.5" strokeDasharray={S.dash} strokeLinecap="round" /></svg>
                  {s.name}
                </button>
              );
            })}
            <button onClick={() => setTable((t) => !t)} className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[12.5px] text-[#9FB3CF] hover:text-white" aria-pressed={table}>
              {table ? <LineChart className="size-3.5" /> : <Table2 className="size-3.5" />}{table ? "Chart" : "Table"}
            </button>
          </div>

          {table ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left font-[family-name:var(--font-geist-mono)] text-[12.5px]">
                <thead className="text-[#6E86A8]"><tr><th className="py-2 pr-3 font-normal">Skill</th>{Array.from({ length: 8 }, (_, i) => <th key={i} className="px-1.5 font-normal">S{i + 1}</th>)}<th className="font-normal">State</th></tr></thead>
                <tbody>{SKILLS.map((s) => <tr key={s.name} className="border-t border-white/5 text-[#CFE0F7]"><td className="py-2 pr-3">{s.name}</td>{s.v.map((n, i) => <td key={i} className="px-1.5">{n ?? "–"}</td>)}<td>{STYLE[s.state].label}</td></tr>)}</tbody>
              </table>
            </div>
          ) : (
            <div className="relative mt-4">
              <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none overflow-visible" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={`Skill scores across 8 sessions. Focused: ${f.name}`}>
                {[40, 60, 80, 100].map((g) => (
                  <g key={g}><line x1={P.l} x2={W - P.r} y1={yy(g)} y2={yy(g)} stroke="rgba(159,179,207,.10)" />
                    <text x={P.l - 10} y={yy(g) + 4} textAnchor="end" fill="#6E86A8" fontSize="11" fontFamily="var(--font-geist-mono)">{g}</text></g>
                ))}
                {Array.from({ length: 8 }, (_, i) => <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fill="#6E86A8" fontSize="11" fontFamily="var(--font-geist-mono)">S{i + 1}</text>)}

                {/* recessive context lines */}
                {SKILLS.filter((s) => s.name !== focus).map((s) => (
                  <path key={s.name} d={path(s.v)} fill="none" stroke="rgba(159,179,207,.22)" strokeWidth="1.5" strokeDasharray={STYLE[s.state].dash} strokeLinecap="round" />
                ))}
                {/* featured line draws in */}
                <motion.path key={focus} d={path(f.v)} fill="none" stroke={STYLE[f.state].color} strokeWidth="2.5" strokeDasharray={STYLE[f.state].dash} strokeLinecap="round" strokeLinejoin="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} />
                {f.v.map((n, i) => n != null && <circle key={i} cx={x(i)} cy={yy(n)} r={i === 7 ? 5 : 3.5} fill={STYLE[f.state].color} stroke="#0A1628" strokeWidth="2" />)}
                {/* direct end labels for the featured line + two context lines */}
                <text x={x(7) + 12} y={yy(f.v[7]!) + 4} fill="#EAF2FF" fontSize="12.5" fontFamily="var(--font-geist-mono)">{f.name} {f.v[7]}</text>
                {f.note && (
                  <g>
                    <line x1={x(f.note.at)} x2={x(f.note.at)} y1={yy(f.v[f.note.at]!) - 10} y2={P.t + 6} stroke="rgba(234,242,255,.35)" strokeDasharray="2 3" />
                    <text x={x(f.note.at) + 6} y={P.t + 10} fill="#CFE0F7" fontSize="11.5">{f.note.text.split(" · ")[0]}</text>
                  </g>
                )}
                {/* crosshair */}
                {hover != null && (
                  <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} stroke="rgba(234,242,255,.35)" />
                )}
                {/* invisible wide hit area */}
                <rect x={P.l} y={P.t} width={W - P.l - P.r} height={H - P.t - P.b} fill="transparent" />
              </svg>
              {hover != null && (
                <div className="pointer-events-none absolute top-2 w-[200px] rounded-xl border border-white/10 bg-white p-3 text-[12.5px] text-foreground shadow-xl"
                  style={{ left: `min(calc(${(x(hover) / W) * 100}% + 12px), calc(100% - 200px))` }}>
                  <Mono className="text-[11px] text-muted-foreground">SESSION {hover + 1}</Mono>
                  {SKILLS.filter((s) => s.v[hover] != null).sort((a, b) => b.v[hover]! - a.v[hover]!).slice(0, 5).map((s) => (
                    <div key={s.name} className={cn("mt-1 flex items-center justify-between gap-2", s.name === focus && "font-semibold")}>
                      <span className="flex items-center gap-1.5"><svg width="12" height="4"><line x1="0" x2="12" y1="2" y2="2" stroke={STYLE[s.state].color} strokeWidth="2.5" strokeDasharray={STYLE[s.state].dash} /></svg>{s.name}</span>
                      <Mono>{s.v[hover]}</Mono>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-4 border-t border-white/5 pt-3 text-[12px] text-[#9FB3CF]">
            {(Object.keys(STYLE) as State[]).map((k) => (
              <span key={k} className="flex items-center gap-2"><svg width="22" height="6"><line x1="0" x2="22" y1="3" y2="3" stroke={STYLE[k].color} strokeWidth="2.5" strokeDasharray={STYLE[k].dash} strokeLinecap="round" /></svg>{STYLE[k].label}</span>
            ))}
            <Mono className="ml-auto text-[#6E86A8]">score 0–100 · demo data</Mono>
          </div>
        </div>
  );
}
