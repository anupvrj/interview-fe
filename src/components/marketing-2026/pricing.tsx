"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Building2, Check, Coins, Loader2, Minus, Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactSalesDialog } from "@/components/ContactSalesDialog";
import { usePricingPlans } from "@/hooks/usePricingPlans";
import { usePricingTrialOffer } from "@/hooks/usePricingTrialOffer";
import { columnsFromPlans } from "@/hooks/usePlanComparison";
import { trialApi } from "@/lib/api";
import { parseHighlightLine, type PlanRow } from "@/lib/pricingPlanRows";
import { COMPARISON_ROWS, withLivePlanComparison, type ComparisonCell } from "@/lib/pricingPageContent";
import { TRIAL_CTA, TRIAL_FEATURES_TAGLINE } from "@/lib/trialFeatures";
import { cn } from "@/lib/utils";
import { Emblem, type EmblemKind, Index, Mono } from "./primitives";
import { GridRunners } from "./graphics";
import { DARK, Dots, ease, Head, HL, INK, LIGHT, StickyCta, WRAP } from "./landing-kit";
import { MK26_ROUTES } from "./cta";

/**
 * Pricing, in the 2026 design. Everything about the plans comes from the backend, exactly as on the legacy page:
 * `usePricingPlans` (plans, highlights, coming-soon items, the choose → sign-in → onboarding → checkout flow) and the
 * live comparison rows. Only the presentation is new.
 */

/* ═══════════════ HERO + TRIAL ═══════════════ */

/** The 14-day trial offer, same rules and API as the legacy banner, as a card under the hero copy. */
function TrialCard() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { showBanner } = usePricingTrialOffer();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!showBanner) return null;

  const start = async () => {
    if (!isSignedIn) { router.push(`/sign-in?redirect_url=${encodeURIComponent(MK26_ROUTES.pricing)}`); return; }
    setStarting(true); setError(null);
    try {
      await trialApi.startTrial();
      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to start trial. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6, ease }}
      className="mx-auto mt-10 flex max-w-[720px] flex-col items-center gap-4 rounded-2xl border border-white bg-white/85 p-4 text-left shadow-[0_24px_50px_-30px_rgba(40,30,140,.5)] backdrop-blur sm:flex-row">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] text-white"><Sparkles className="size-5" /></span>
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className={cn("text-[15.5px] font-bold", INK)}>{TRIAL_CTA}</p>
        <p className="text-[13.5px] text-muted-foreground">{TRIAL_FEATURES_TAGLINE} Full platform access: AI interviews, coding, system design and ATS tools.</p>
        {error && <p className="mt-1 text-[12.5px] text-destructive">{error}</p>}
      </div>
      <Button onClick={start} disabled={starting} className="h-11 shrink-0 rounded-xl px-5 hover:bg-primary/90">
        {starting ? <Loader2 className="animate-spin" /> : <>Start free trial <ArrowRight /></>}
      </Button>
    </motion.div>
  );
}

export function PrHero() {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-clip pb-12 pt-28 text-center md:pb-16 md:pt-44">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_50%_30%,rgba(115,103,240,.18),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_80%)]" />
      <GridRunners />
      <div className="relative mx-auto max-w-[920px] px-5">
        <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
          className="inline-flex items-center gap-3 rounded-2xl border border-white bg-white/80 py-2 pl-2 pr-4 text-left shadow-[0_14px_34px_-18px_rgba(75,63,208,.55),inset_0_1px_0_#fff] backdrop-blur">
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] text-white shadow-[0_8px_18px_-6px_rgba(115,103,240,.8)]"><Tag className="size-5" /></span>
          <span className="leading-tight">
            <span className={cn("block text-[17px] font-extrabold tracking-[-0.02em]", INK)}>Pricing</span>
            <Mono className="text-[11px] text-muted-foreground">MONTHLY · CANCEL ANYTIME · INR</Mono>
          </span>
        </motion.div>
        <motion.h1 initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.7, ease }}
          className={cn("mt-7 text-[38px] font-black leading-[0.98] tracking-[-0.055em] sm:text-[48px] md:text-[64px]", INK)}>
          One plan for <span className={HL}>where you are</span> in your career.
        </motion.h1>
        <motion.p initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.6, ease }}
          className="mx-auto mt-6 max-w-[56ch] text-[17px] text-[#4B5275] md:text-[18.5px]">
          From an ATS-ready resume to AI interviews, coding rounds and system design. Every plan learns your skills with every session.
        </motion.p>
        <TrialCard />
      </div>
    </section>
  );
}

/* ═══════════════ PLANS (from the backend), styled as passes like the home page ═══════════════ */

/** Which hand-drawn emblem each plan wears; anything new admin adds gets the spark. */
const PLAN_EMBLEM: Record<string, EmblemKind> = { general_pass: "voice", tech_basic: "code", tech_pro: "layers", enterprise: "seats", free: "spark" };

function PlanCard({ row, busy, disabled, onChoose, i }: { row: PlanRow; busy: boolean; disabled: boolean; onChoose: () => void; i: number }) {
  const parsed = row.highlights.map((h) => parseHighlightLine(h, row.comingSoonHighlights));
  // the credits line already sits in the pill above the list
  const regular = parsed.filter((p) => !p.comingSoon && !/^\d[\d,]*\s*(monthly\s+)?credits?\b/i.test(p.text));
  const upcoming = parsed.filter((p) => p.comingSoon);
  const pop = row.popular;
  const bestFor = (row.plan.metadata?.bestFor as string | undefined) || (row.isEnterprise ? "Teams" : row.isFree ? "Everyone" : "Monthly");
  const cta = row.isEnterprise ? "Contact sales" : row.isFree ? "Get started free" : "Subscribe monthly";

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ delay: i * 0.08, duration: 0.55, ease }}
      className={cn("relative grid grid-cols-[minmax(0,1fr)_40px] overflow-hidden rounded-2xl border bg-[#0D1F36] text-left transition-transform hover:-translate-y-1",
        pop ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)),0_30px_60px_-30px_rgba(115,103,240,.75)] max-md:order-first" : "border-[#1B3C62]")}>
      {pop && <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_45%_at_40%_0%,rgba(115,103,240,.28),transparent_70%)]" />}
      <div className="relative flex flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <Emblem kind={PLAN_EMBLEM[row.id] ?? "spark"} glow={pop} />
          {pop && <Mono className="rounded-md bg-primary px-2 py-0.5 text-[10.5px] text-white">MOST PICKED</Mono>}
        </div>
        <Mono className="mt-5 block truncate text-[11px] text-[#6E86A8]">PASS · {bestFor.toUpperCase()}</Mono>
        <h3 className="mt-1 text-[26px] font-extrabold leading-tight tracking-[-0.03em] text-white">{row.plan.displayName || row.plan.name}</h3>
        <p className="mt-2 text-[14px] leading-snug text-[#9FB3CF] md:min-h-[2.75rem]">{row.plan.description}</p>
        <p className="mt-5 text-[42px] font-black leading-none tracking-[-0.04em] tabular-nums text-white sm:text-[46px]">
          {row.isEnterprise ? "Custom" : `₹${Number(row.priceLabel).toLocaleString("en-IN")}`}
          {row.periodLabel && <span className="ml-1 text-[14px] font-medium tracking-normal text-[#9FB3CF]">/mo</span>}
        </p>
        <span className={cn("mt-4 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold", pop ? "bg-primary/25 text-white" : "bg-white/[.07] text-[#CFE0F7]")}>
          <Coins className="size-3.5" />{row.isEnterprise ? "Custom credits" : `${row.creditsMonthly.toLocaleString("en-IN")} credits a month`}
        </span>

        <ul className="mt-6 flex-1 space-y-2.5 border-t border-dashed border-[#1B3C62] pt-5">
          {regular.map(({ text }) => (
            <li key={text} className="flex items-start gap-2.5 text-[14px] leading-snug text-[#CFE0F7]">
              <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-sky-400/15 text-sky-300"><Check className="size-3" /></span>{text}
            </li>
          ))}
          {upcoming.length > 0 && (
            <>
              <li className="pt-3"><Mono className="text-[10px] text-[#6E86A8]">COMING SOON</Mono></li>
              {upcoming.map(({ text }) => (
                <li key={text} className="flex items-start gap-2.5 text-[13px] leading-snug text-white/50">
                  <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-dashed border-amber-400/60 text-amber-400"><Sparkles className="size-2.5" /></span>{text}
                </li>
              ))}
            </>
          )}
        </ul>

        <Button onClick={onChoose} disabled={disabled} className={cn("mt-7 h-11 w-full rounded-xl text-[14.5px]", !pop && "bg-white/10 hover:bg-white/15")}>
          {busy ? <><Loader2 className="animate-spin" /> Loading…</> : <>{cta} <ArrowRight /></>}
        </Button>
      </div>
      {/* the pass stub: perforation + barcode, as on the home page */}
      <div aria-hidden className="border-l-2 border-dashed border-[#1B3C62] bg-[repeating-linear-gradient(0deg,#EAF2FF_0_2px,transparent_2px_5px,#EAF2FF_5px_6px,transparent_6px_9px)] bg-[length:60%_70%] bg-center bg-no-repeat opacity-40" />
    </motion.div>
  );
}

function PlanSkeleton() {
  return <div className="h-[560px] animate-pulse rounded-2xl border border-[#1B3C62] bg-[#0D1F36]" />;
}

export function PrPlans({ plans }: { plans: ReturnType<typeof usePricingPlans> }) {
  const { rows, loading, loadError, loadingPlanId, isLoaded, contactSalesOpen, setContactSalesOpen, handleChoosePlan } = plans;
  const cols = rows.length >= 4 ? "md:grid-cols-2 xl:grid-cols-4" : rows.length === 3 ? "md:grid-cols-3" : rows.length === 2 ? "md:grid-cols-2" : "mx-auto max-w-md";
  return (
    <section id="plans" className="scroll-mt-24 px-3 py-6">
      <div className="grain relative mx-auto max-w-[1240px] overflow-clip rounded-[28px] bg-[hsl(var(--ix-navy))] px-5 py-20 text-[#EAF2FF] md:py-24">
        <div className="bg-blueprint-dark mask-fade pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-[1120px]">
          <div className="text-center">
            <div className="flex justify-center"><Index n="01" label="The plans" dark /></div>
            <h2 className="text-[34px] font-extrabold leading-[1.02] tracking-[-0.045em] md:text-[56px]">Less than one human mock interview.</h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-[16px] text-[#9FB3CF]">Every pass includes the AI interviewer, your report and your IX Skill Graph. Pick the one that matches the rounds you&apos;ll face.</p>
          </div>
          <div className="mt-12">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{[0, 1, 2].map((k) => <PlanSkeleton key={k} />)}</div>
            ) : loadError ? (
              <div className="rounded-2xl border border-[#1B3C62] bg-[#0D1F36] p-10 text-center">
                <p className="text-[#9FB3CF]">{loadError}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
              </div>
            ) : (
              <div className={cn("grid grid-cols-1 items-stretch gap-4", cols)}>
                {rows.map((row, i) => (
                  <PlanCard key={row.id} row={row} i={i} busy={loadingPlanId === row.id} disabled={loadingPlanId !== null || !isLoaded} onChoose={() => handleChoosePlan(row.id)} />
                ))}
              </div>
            )}
          </div>
          <p className="mt-8 text-center text-[14px] text-[#9FB3CF]">
            Billed monthly in INR · credits reset on your billing date · cancel any time · enterprise?{" "}
            <button type="button" onClick={() => setContactSalesOpen(true)} className="font-semibold text-sky-300 hover:underline">Contact sales</button>
          </p>
        </div>
      </div>
      <ContactSalesDialog open={contactSalesOpen} onOpenChange={setContactSalesOpen} />
    </section>
  );
}

/* ═══════════════ COMPARE (from the backend) ═══════════════ */

function Cell({ v, dark }: { v: ComparisonCell; dark?: boolean }) {
  if (v === true) return <span className={cn("mx-auto grid size-5 place-items-center rounded-full", dark ? "bg-primary text-white" : "bg-emerald-50 text-emerald-600")}><Check className="size-3" aria-label="Included" /></span>;
  if (v === false) return <Minus className="mx-auto size-4 text-[#C3C7D6]" aria-label="Not included" />;
  if (v === "—") return <span className="text-[#C3C7D6]">—</span>;
  if (v === "Coming soon") return <span className="rounded-full border border-amber-300/80 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">Coming soon</span>;
  return <span className="text-[13.5px] font-medium text-[#2E3656]">{v}</span>;
}

export function PrCompare({ plans }: { plans: ReturnType<typeof usePricingPlans> }) {
  const columns = columnsFromPlans(plans.plans);
  const rows = plans.plans.length ? withLivePlanComparison(plans.plans) : COMPARISON_ROWS;
  if (columns.length === 0) return null;
  return (
    <section id="compare" className={cn(LIGHT, "scroll-mt-20")}>
      <Dots />
      <div className={WRAP}>
        <Head n="02" label="Compare" title={<>Every feature, <span className={HL}>side by side.</span></>} sub="The same list the plans are built from. If a plan changes, this table changes with it." />
        <Mono className="mb-3 block text-[11px] text-muted-foreground md:hidden">SWIPE THE TABLE TO SEE EVERY PLAN →</Mono>
        <div className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_30px_60px_-40px_rgba(30,20,80,.45)]">
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[600px] border-collapse text-left md:min-w-[760px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-white/95 backdrop-blur">
                  <th className="sticky left-0 z-10 bg-white px-4 py-4 text-[13px] font-semibold text-muted-foreground md:px-5">Feature</th>
                  {columns.map((c) => (
                    <th key={c.planId} className={cn("px-3 py-4 text-center text-[13px] font-bold md:px-4 md:text-[14px]", c.popular ? "bg-[#F1EEFF] text-primary" : INK)}>
                      {c.label}{c.popular && <Mono className="block text-[9.5px] font-normal text-primary/70">MOST POPULAR</Mono>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.feature} className="border-b border-border/60 last:border-0 hover:bg-[#FAFAFD]">
                    <td className="sticky left-0 z-[5] max-w-[150px] bg-white px-4 py-3.5 text-[13px] font-medium text-[#2E3656] shadow-[1px_0_0_#ECEDF3] md:max-w-none md:px-5 md:text-[14px]">{r.feature}</td>
                    {columns.map((c) => (
                      <td key={c.planId} className={cn("px-3 py-3.5 text-center md:px-4", c.popular && "bg-[#F7F5FF]")}><Cell v={r[c.planId] ?? "—"} dark={c.popular} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ TEAMS ═══════════════ */

export function PrTeams({ onContact }: { onContact: () => void }) {
  return (
    <section className={DARK}>
      <div className={WRAP}>
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div>
            <Index n="03" label="Teams" dark />
            <Mono className="text-[12px] text-sky-300">FOR COLLEGES, BOOTCAMPS & HIRING TEAMS</Mono>
            <h2 className="mt-3 text-[34px] font-extrabold leading-[1.04] tracking-[-0.045em] text-white md:text-[48px]">Preparing a whole cohort? <span className="bg-gradient-to-r from-[#A99CFF] to-[#5CC2FF] bg-clip-text pr-[0.06em] text-transparent">Let&apos;s talk.</span></h2>
            <p className="mt-4 max-w-[52ch] text-[16px] text-[#9FB3CF]">Custom credits, seats for every student or candidate, and one view of everyone&apos;s IX Skill Graph.</p>
          </div>
          <div className="flex flex-col items-start gap-4 rounded-[24px] border border-white/10 bg-white/[.04] p-6 md:items-stretch">
            <span className="grid size-11 place-items-center rounded-xl bg-white/10 text-white"><Building2 className="size-5" /></span>
            <p className="text-[15px] text-[#C9D6EA]">Tell us how many people you&apos;re preparing and for which roles. We&apos;ll come back with a plan.</p>
            <Button onClick={onContact} className="h-11 rounded-xl bg-white text-[#0B1A30] hover:bg-white/90">Contact sales <ArrowRight /></Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export const PrStickyCta = () => <StickyCta product="Pricing" cta="See plans" href="#plans" />;

/** The interactive part of the page: one plans fetch shared by the cards, the comparison and the sales dialog. */
export function PricingBody() {
  const plans = usePricingPlans();
  return (
    <>
      <PrHero />
      <PrPlans plans={plans} />
      <PrCompare plans={plans} />
      <PrTeams onContact={() => plans.setContactSalesOpen(true)} />
    </>
  );
}
