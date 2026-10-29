"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IxOptInBanner } from "@/components/ix-score/IxOptInBanner";
import { IxSessionHistoryTable } from "@/components/ix-score/IxSessionHistoryTable";
import { IxReportPdfActions } from "@/components/ix-score/IxReportPdfActions";
import { MOCK_SNAPSHOT } from "@/components/ix-score/IxReportLockedGate";
import { Mono } from "@/components/marketing-2026/primitives";
import { useEntitlements } from "@/hooks/useEntitlements";
import { ixScoreApi, type IxScoreSnapshot } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { IX_CATEGORY_KEYS, IX_CATEGORY_META } from "@/lib/ix-score-constants";
import { IX_CATEGORY_VISUAL } from "@/lib/ix-report-theme";
import { cn } from "@/lib/utils";
import { EASE, Eyebrow, ScoreRing, dash2026Scope } from "./ui";
import { ListHeader } from "./PracticeHero";

function isIxEntitlementDenied(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (error.response?.status === 403) return true;
  return /upgraded plan|upgrade/i.test(getApiErrorMessage(error, ""));
}

/** Same bands the old report used, so a 78 still reads "Good" everywhere. */
function grade(score: number) {
  if (score >= 80) return { label: "Excellent", tone: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 60) return { label: "Good", tone: "text-primary" };
  if (score >= 40) return { label: "Fair", tone: "text-amber-600 dark:text-amber-400" };
  return { label: "Needs work", tone: "text-rose-500" };
}

const dayMonth = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#1F8FFF]", className)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/** The whole report card. Used live, and blurred behind the lock with sample numbers. */
function IxReportView({ snapshot, actions, banner, history }: {
  snapshot: IxScoreSnapshot;
  actions?: React.ReactNode;
  banner?: React.ReactNode;
  history?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.55, ease: EASE },
  });
  const { overall, communication } = snapshot;
  const opted = IX_CATEGORY_KEYS.filter((k) => snapshot.optIns[k]);
  const sessions = opted.reduce((n, k) => n + (snapshot.categories[k]?.sessionCount ?? 0), 0);
  const g = overall.average != null ? grade(overall.average) : null;
  const scoredCats = opted.filter((k) => snapshot.categories[k]?.score != null);
  const strongest = scoredCats.length > 1 ? scoredCats.reduce((a, b) => (snapshot.categories[b]!.score! > snapshot.categories[a]!.score! ? b : a)) : null;
  const weakest = scoredCats.length > 1 ? scoredCats.reduce((a, b) => (snapshot.categories[b]!.score! < snapshot.categories[a]!.score! ? b : a)) : null;
  const hasComm = communication.sessionCount > 0 && (communication.behavioral != null || communication.technical != null);

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_60%_at_10%_0%,rgba(115,103,240,.14),transparent_70%),radial-gradient(40%_60%_at_95%_30%,rgba(31,143,255,.10),transparent_70%)]" />
        <div className="relative grid items-center gap-8 p-6 md:p-9 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <motion.div {...rise(0)}><Eyebrow>iX REPORT</Eyebrow></motion.div>
            <motion.h1 {...rise(0.08)} className="text-balance mt-5 text-[32px] font-black leading-[1.03] tracking-[-0.05em] text-foreground sm:text-[42px] xl:text-[50px]">
              One score for every round{" "}
              <span className="bg-gradient-to-r from-[#7367F0] to-[#1F8FFF] bg-clip-text text-transparent">you choose to count.</span>
            </motion.h1>
            <motion.p {...rise(0.16)} className="text-balance mt-4 max-w-[56ch] text-[15.5px] leading-relaxed text-muted-foreground md:text-[17px]">
              Your report card across the interview types you opted in: category scores, how you communicate, and every scored session behind them.
            </motion.p>
            {actions && <motion.div {...rise(0.24)} className="mt-6 [&_button]:h-11 [&_button]:rounded-xl [&_button]:px-5">{actions}</motion.div>}
          </div>

          <motion.div {...rise(0.3)} className="rounded-2xl border border-border bg-background/70 p-5 shadow-[0_24px_50px_-30px_rgba(47,43,61,.45)] backdrop-blur">
            <Mono className="text-[11px] text-muted-foreground">OVERALL iX SCORE</Mono>
            {overall.average != null && g ? (
              <div className="mt-3 flex items-center gap-4">
                <ScoreRing score={overall.average} />
                <div className="min-w-0">
                  <p className={cn("text-[22px] font-extrabold tracking-[-0.03em]", g.tone)}>{g.label}</p>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                    Average of {overall.categoriesWithData} categor{overall.categoriesWithData === 1 ? "y" : "ies"}
                  </p>
                  {overall.maxRaw > 100 && overall.rawSum > 0 && (
                    <Mono className="mt-2 block text-[11px] text-muted-foreground">TOTAL {overall.rawSum} / {overall.maxRaw}</Mono>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
                Finish a scored session in any category you opted in and your overall score appears here.
              </p>
            )}
          </motion.div>
        </div>

        <motion.div {...rise(0.36)} className="relative grid grid-cols-2 border-t border-border md:grid-cols-4 md:divide-x md:divide-border [&>*:nth-child(-n+2)]:max-md:border-b [&>*:nth-child(odd)]:max-md:border-r">
          {([
            ["Categories counted", `${opted.length}/${IX_CATEGORY_KEYS.length}`, "you choose which"],
            ["Scored sessions", String(sessions), "across those categories"],
            ["Strongest", strongest ? String(snapshot.categories[strongest]!.score) : "—", strongest ? IX_CATEGORY_META[strongest].label.split(" — ")[0] : "needs two scored categories"],
            ["Last updated", dayMonth(snapshot.computedAt), "recalculated on each visit"],
          ] as const).map(([k, v, d]) => (
            <div key={k} className="border-border px-5 py-4 md:px-6">
              <p className="text-[12.5px] text-muted-foreground">{k}</p>
              <Mono className="mt-1 block text-[24px] tracking-tight text-foreground">{v}</Mono>
              <p className="truncate text-[11.5px] text-muted-foreground/80">{d}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {banner}

      <section className="overflow-hidden rounded-[22px] border border-border bg-card">
        <ListHeader
          eyebrow="BY CATEGORY"
          title={weakest ? `Lift ${IX_CATEGORY_META[weakest].label.split(" — ")[0].toLowerCase()} next.` : "Where each round stands."}
          description={weakest ? "It's your lowest category, so it pulls the overall score down the most." : "Each category is the average of its scored sessions, out of 100."}
        />
        {opted.length === 0 ? (
          <p className="p-6 text-[13.5px] text-muted-foreground">No interview types are counted yet. Update your preferences to add them.</p>
        ) : (
          <div className={cn("grid gap-px bg-border sm:grid-cols-2", opted.length > 2 && "xl:grid-cols-4")}>
            {opted.map((key) => {
              const cat = snapshot.categories[key];
              const meta = IX_CATEGORY_META[key];
              const Icon = IX_CATEGORY_VISUAL[key].icon;
              const isWeak = weakest === key;
              return (
                <div key={key} className="flex flex-col bg-card p-5 md:p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7367F0] to-[#1F8FFF] text-white"><Icon className="h-4 w-4" /></span>
                    <p className="min-w-0 text-[13.5px] font-semibold leading-snug text-foreground">{meta.label.split(" — ")[0]}</p>
                  </div>
                  {cat?.hasData && cat.score != null ? (
                    <>
                      <Mono className="mt-4 block text-[34px] leading-none tracking-tight text-foreground">{cat.score}</Mono>
                      <div className="mt-3"><Bar value={cat.score} className={isWeak ? "from-amber-500 to-amber-400" : undefined} /></div>
                      <Mono className="mt-2.5 block text-[11px] text-muted-foreground">
                        {cat.sessionCount} SESSION{cat.sessionCount === 1 ? "" : "S"}{cat.lastSessionAt ? ` · LAST ${dayMonth(cat.lastSessionAt).toUpperCase()}` : ""}
                      </Mono>
                    </>
                  ) : (
                    <div className="mt-4 flex flex-1 flex-col justify-between gap-3">
                      <p className="text-[13px] text-muted-foreground">No scored session yet.</p>
                      <Link href={meta.hubHref} className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">
                        Start practising <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-[22px] border border-border bg-card">
        <ListHeader
          eyebrow="COMMUNICATION"
          title="How you come across."
          description={hasComm ? `Averaged from ${communication.sessionCount} session${communication.sessionCount === 1 ? "" : "s"} with score data.` : "Finish interview sessions to see your behavioural and technical breakdown."}
        />
        {hasComm && (
          <div className="grid gap-px bg-border sm:grid-cols-2">
            {([["Behavioural", communication.behavioral], [communication.technicalLabel, communication.technical]] as const).map(([label, v]) =>
              v == null ? null : (
                <div key={label} className="bg-card p-5 md:p-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[13.5px] font-semibold text-foreground">{label}</p>
                    <Mono className="text-[11px] text-muted-foreground">/ 100</Mono>
                  </div>
                  <Mono className="mt-3 block text-[34px] leading-none tracking-tight text-foreground">{v}</Mono>
                  <div className="mt-3"><Bar value={v} /></div>
                </div>
              ),
            )}
          </div>
        )}
      </section>

      {history}
    </div>
  );
}

function IxReportLocked() {
  return (
    <div className="relative isolate overflow-hidden rounded-[22px]">
      <div aria-hidden className="pointer-events-none max-h-[880px] select-none overflow-hidden blur-[3px]">
        <IxReportView snapshot={MOCK_SNAPSHOT} />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
      <div className="absolute inset-x-0 top-[180px] z-10 mx-auto w-[calc(100%-32px)] max-w-[520px] rounded-[22px] border border-border bg-card p-7 text-center shadow-[0_30px_80px_-30px_rgba(47,43,61,.5)] md:top-[220px] md:p-9">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#7367F0] to-[#1F8FFF] text-white"><Lock className="h-5 w-5" /></span>
        <Mono className="mt-4 block text-[11px] text-primary">GENERAL PASS REQUIRED</Mono>
        <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.035em] text-foreground">Unlock your iX Report.</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Category scores, communication breakdown, every scored session and a PDF you can share, in one report card. The numbers behind this are a sample.
        </p>
        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
          <Button asChild className="h-11 rounded-xl shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)]">
            <Link href="/checkout?plan=general_pass">Upgrade &amp; unlock <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-xl">
            <Link href="/pricing">Compare plans</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function IxReportHome() {
  const { user } = useUser();
  const { canUse, loading: entitlementsLoading, data } = useEntitlements();
  const [snapshot, setSnapshot] = useState<IxScoreSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const locked = !entitlementsLoading && data != null && !canUse("ixScore");

  useEffect(() => {
    if (entitlementsLoading) return;
    if (!canUse("ixScore")) {
      setAccessDenied(true);
      setSnapshot(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setAccessDenied(false);
    ixScoreApi.getSnapshot(true)
      .then((res) => { if (!cancelled) setSnapshot(res); })
      .catch((e) => {
        if (cancelled) return;
        if (isIxEntitlementDenied(e)) setAccessDenied(true);
        else toast.error(getApiErrorMessage(e, "Failed to load iX Report"));
        setSnapshot(null);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entitlementsLoading, data?.entitlements.ixScore]);

  const name = user?.fullName || user?.firstName || user?.username || "Candidate";
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? "";

  let body: React.ReactNode;
  if (loading || entitlementsLoading) {
    body = (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your iX Report…</p>
      </div>
    );
  } else if (locked || accessDenied) {
    body = <IxReportLocked />;
  } else if (!snapshot) {
    body = (
      <section className="rounded-[22px] border border-border bg-card p-8 text-center">
        <Eyebrow className="justify-center">iX REPORT</Eyebrow>
        <h1 className="mt-4 text-[26px] font-extrabold tracking-[-0.035em] text-foreground">Your report didn&apos;t load.</h1>
        <p className="mt-2 text-[14px] text-muted-foreground">Refresh the page, or try again in a few minutes.</p>
      </section>
    );
  } else {
    body = (
      <IxReportView
        snapshot={snapshot}
        actions={<IxReportPdfActions snapshot={snapshot} candidateName={name} candidateEmail={email} showEmailAction={false} />}
        banner={
          <IxOptInBanner
            optIns={snapshot.optIns}
            onSaved={setSnapshot}
            className="relative flex flex-col gap-3 rounded-[18px] border border-primary/25 bg-primary/[0.05] px-5 py-4 pr-10 sm:flex-row sm:items-center sm:justify-between sm:pr-5"
          />
        }
        history={
          <div className="[&>div]:rounded-[22px] [&>div]:border-border [&>div]:shadow-none [&_h2]:text-[22px] [&_h2]:font-extrabold [&_h2]:tracking-[-0.035em]">
            <IxSessionHistoryTable />
          </div>
        }
      />
    );
  }

  return <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl")}>{body}</div>;
}
