"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Mono } from "@/components/marketing-2026/primitives";
import { Interview, interviewApi } from "@/lib/api";
import { cn, getInterviewCreditsUsed } from "@/lib/utils";
import { EASE, Eyebrow, ScoreRing, dash2026Scope } from "./ui";
import { ListHeader } from "./PracticeHero";

/** Report.overallScore can be absent or non-numeric at runtime despite types. */
function scoreOf(report: Interview["report"] | null | undefined): number | null {
  const raw = report?.overallScore as unknown;
  const n = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
  return typeof n === "number" && Number.isFinite(n) ? Math.round(n) : null;
}

const RANGES = [14, 30, 90] as const;
type Range = (typeof RANGES)[number];

const dayLabel = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const axis = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };

function ChartTip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number | null }[]; label?: string; unit: string }) {
  const v = payload?.[0]?.value;
  if (!active || v == null) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-lg">
      <Mono className="block text-[10.5px] text-muted-foreground">{label}</Mono>
      <p className="mt-0.5 text-[14px] font-semibold text-foreground tabular-nums">{v} {unit}</p>
    </div>
  );
}

function ChartCard({ eyebrow, title, description, children, className }: { eyebrow: string; title: string; description: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("overflow-hidden rounded-[22px] border border-border bg-card", className)}>
      <ListHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="h-[260px] px-2 pb-4 pt-5 md:px-4">{children}</div>
    </section>
  );
}

export function AnalyticsHome() {
  const { user, isLoaded } = useUser();
  const reduce = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [range, setRange] = useState<Range>(30);

  useEffect(() => {
    if (!isLoaded || !user) return;
    localStorage.setItem("clerk-user-id", user.id);
    let cancelled = false;
    interviewApi.list(user.id)
      .then((rows) => { if (!cancelled) setInterviews(rows); })
      .catch((e) => console.error("Error loading analytics:", e))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isLoaded, user]);

  const scored = useMemo(
    () => interviews
      .filter((i) => i.status === "completed" && scoreOf(i.report) != null)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [interviews],
  );

  const daily = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: range }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (range - 1 - i));
      return { key: d.toDateString(), label: dayLabel(d), interviews: 0, credits: 0, total: 0, n: 0 };
    });
    const byKey = new Map(days.map((d) => [d.key, d]));
    for (const i of interviews) {
      const row = byKey.get(new Date(i.createdAt).toDateString());
      if (!row) continue;
      row.interviews += 1;
      row.credits += getInterviewCreditsUsed(i) ?? 0;
      const s = scoreOf(i.report);
      if (s != null) { row.total += s; row.n += 1; }
    }
    // days without a scored round stay null so the line skips them instead of dropping to zero
    return days.map((d) => ({ label: d.label, interviews: d.interviews, credits: d.credits, score: d.n ? Math.round(d.total / d.n) : null }));
  }, [interviews, range]);

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading analytics…</p>
        </div>
      </div>
    );
  }

  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.55, ease: EASE },
  });

  const scores = scored.map((i) => scoreOf(i.report)!);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const best = scores.length ? Math.max(...scores) : null;
  const latest = scores.at(-1) ?? null;
  const change = scores.length >= 2 ? scores.at(-1)! - scores[0] : null;
  const completed = interviews.filter((i) => i.status === "completed").length;
  const inRange = daily.reduce((n, d) => n + d.interviews, 0);
  const activeDays = daily.filter((d) => d.interviews > 0).length;
  const creditsInRange = daily.reduce((n, d) => n + d.credits, 0);
  const scoredInRange = daily.filter((d) => d.score != null).length;

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl space-y-5 lg:space-y-6")}>
      <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_60%_at_10%_0%,rgba(115,103,240,.14),transparent_70%),radial-gradient(40%_60%_at_95%_30%,rgba(31,143,255,.10),transparent_70%)]" />
        <div className="relative grid items-center gap-8 p-6 md:p-9 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <motion.div {...rise(0)}><Eyebrow>ANALYTICS</Eyebrow></motion.div>
            <motion.h1 {...rise(0.08)} className="text-balance mt-5 text-[32px] font-black leading-[1.03] tracking-[-0.05em] text-foreground sm:text-[42px] xl:text-[50px]">
              See what&apos;s improving,{" "}
              <span className="bg-gradient-to-r from-[#7367F0] to-[#1F8FFF] bg-clip-text text-transparent">and what isn&apos;t yet.</span>
            </motion.h1>
            <motion.p {...rise(0.16)} className="text-balance mt-4 max-w-[56ch] text-[15.5px] leading-relaxed text-muted-foreground md:text-[17px]">
              How often you practise, how your AI interview and coding scores move between sessions, and what it costs in credits.
            </motion.p>
            <motion.div {...rise(0.24)} className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="h-11 rounded-xl px-5 shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)]">
                <Link href="/dashboard/interviews">{interviews.length ? "Practise again" : "Start an interview"} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-xl px-5">
                <Link href="/dashboard/ix-report">iX Report</Link>
              </Button>
            </motion.div>
          </div>

          <motion.div {...rise(0.3)} className="rounded-2xl border border-border bg-background/70 p-5 shadow-[0_24px_50px_-30px_rgba(47,43,61,.45)] backdrop-blur">
            <Mono className="text-[11px] text-muted-foreground">LATEST SCORE</Mono>
            {latest != null ? (
              <div className="mt-3 flex items-center gap-4">
                <ScoreRing score={latest} />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">{scored.at(-1)!.metadata.role}</p>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">{dayLabel(new Date(scored.at(-1)!.createdAt))}</p>
                  {change != null && (
                    <Mono className={cn("mt-2 block text-[11px]", change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500")}>
                      {change >= 0 ? "+" : ""}{change} SINCE YOUR FIRST
                    </Mono>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">No scored interview yet. Finish one and your trend starts here.</p>
            )}
          </motion.div>
        </div>

        <motion.div {...rise(0.36)} className="relative grid grid-cols-2 border-t border-border md:grid-cols-4 md:divide-x md:divide-border [&>*:nth-child(-n+2)]:max-md:border-b [&>*:nth-child(odd)]:max-md:border-r">
          {([
            ["Interviews", String(interviews.length), `${completed} completed`],
            ["Average score", avg != null ? String(avg) : "—", avg != null ? `${scores.length} scored, out of 100` : "after your first report"],
            ["Best score", best != null ? String(best) : "—", "your highest round"],
            ["Change", change != null ? `${change >= 0 ? "+" : ""}${change}` : "—", change != null ? "points, first to latest" : "needs two scored rounds"],
          ] as const).map(([k, v, d]) => (
            <div key={k} className="border-border px-5 py-4 md:px-6">
              <p className="text-[12.5px] text-muted-foreground">{k}</p>
              <Mono className="mt-1 block text-[24px] tracking-tight text-foreground">{v}</Mono>
              <p className="text-[11.5px] text-muted-foreground/80">{d}</p>
            </div>
          ))}
        </motion.div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Mono className="text-[11.5px] text-muted-foreground">
          LAST {range} DAYS · {inRange} INTERVIEW{inRange === 1 ? "" : "S"} · {activeDays} ACTIVE DAY{activeDays === 1 ? "" : "S"} · {creditsInRange} CREDITS
        </Mono>
        <div role="tablist" aria-label="Date range" className="inline-flex self-start rounded-xl border border-border bg-card p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={range === r}
              onClick={() => setRange(r)}
              className={cn("rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors", range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:gap-6 xl:grid-cols-2">
        <ChartCard
          eyebrow="SCORE"
          title={scoredInRange ? "Your average score, by day." : "No scored rounds in this range."}
          description="Days without a scored round are skipped, not counted as zero."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 4" />
              <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={axis} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ stroke: "hsl(var(--border))" }} content={<ChartTip unit="/ 100" />} />
              <Line type="monotone" dataKey="score" connectNulls stroke="#7367F0" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--card))", stroke: "#7367F0", strokeWidth: 2 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          eyebrow="PRACTICE"
          title={activeDays ? `You practised on ${activeDays} of ${range} days.` : "No practice in this range."}
          description="Interviews started per day, all types counted."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 4" />
              <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} content={<ChartTip unit="interviews" />} />
              <Bar dataKey="interviews" fill="#7367F0" radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          eyebrow="CREDITS"
          title={`${creditsInRange} credit${creditsInRange === 1 ? "" : "s"} used.`}
          description="Billed interview credits per day."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 4" />
              <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} content={<ChartTip unit="credits" />} />
              <Bar dataKey="credits" fill="#1F8FFF" radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <section className="overflow-hidden rounded-[22px] border border-border bg-card">
          <ListHeader eyebrow="AT A GLANCE" title="The numbers behind the charts." description={`For the last ${range} days, unless marked all time.`} />
          <div className="grid grid-cols-2 gap-px bg-border">
            {([
              ["Active days", `${activeDays}/${range}`, "at least one interview"],
              ["Completion rate", interviews.length ? `${Math.round((completed / interviews.length) * 100)}%` : "—", "all time, finished vs started"],
              ["Scored days", String(scoredInRange), "days with a report"],
              ["Credits per interview", inRange ? (creditsInRange / inRange).toFixed(1) : "—", "average in this range"],
            ] as const).map(([k, v, d]) => (
              <div key={k} className="bg-card p-5 md:p-6">
                <p className="text-[12.5px] text-muted-foreground">{k}</p>
                <Mono className="mt-1 block text-[26px] tracking-tight text-foreground">{v}</Mono>
                <p className="text-[11.5px] text-muted-foreground/80">{d}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
