"use client";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Emblem, type EmblemKind, Mono } from "./primitives";
import { GridRunners } from "./graphics";
import { Dots, ease, HL, INK, LIGHT, WRAP } from "./landing-kit";

/** Contact, in the 2026 design. Same content as before: one inbox, Monday to Saturday, replies in 48–72 hours. */

const EMAIL = "info@interviewtrix.com";

export const CONTACT_FAQ: [string, string][] = [
  ["What are your operating hours?", "We operate Monday to Saturday. Our team is available to assist you during business hours."],
  ["How long does it take to resolve issues?", "Your issue will be resolved within 48 to 72 hours. We prioritize all support requests and aim to provide timely solutions."],
  ["How do I request a refund?", `You can write an email to us regarding refunds at ${EMAIL}. Our team will reach out to you within 48–72 hours to process your request.`],
];

const FACTS: { kind: EmblemKind; k: string; v: string; d: string }[] = [
  { kind: "calendar", k: "Operating hours", v: "Monday to Saturday", d: "Our team is available to assist you during business hours." },
  { kind: "clock", k: "Response time", v: "48–72 hours", d: "Every support request is prioritized and resolved within this window." },
  { kind: "refund", k: "Refunds", v: "By email", d: `Write to ${EMAIL} and we'll reach out within 48–72 hours to process it.` },
];

const TOPICS = ["Resumes & ATS checks", "AI interview practice", "Peer interviews", "Billing & refunds"];
const STEPS = [
  { k: "Received", d: "Your email lands in our support inbox." },
  { k: "Prioritized", d: "Every request is triaged by the team." },
  { k: "Resolved", d: "Within 48–72 hours, Monday to Saturday." },
];

/** Write to the inbox, or copy the address. */
function EmailActions() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(EMAIL); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked: the mailto still works */ }
  };
  return (
    <div className="mt-8 rounded-2xl border border-white bg-white/85 p-4 shadow-[0_24px_50px_-30px_rgba(40,30,140,.45)] backdrop-blur sm:p-5">
      <Mono className="text-[10.5px] text-muted-foreground">EMAIL US</Mono>
      <a href={`mailto:${EMAIL}`} className={cn("mt-1 block break-all text-[22px] font-extrabold tracking-[-0.02em] hover:text-primary sm:text-[26px]", INK)}>{EMAIL}</a>
      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <Button asChild className="h-11 rounded-xl px-5 hover:bg-primary/90"><a href={`mailto:${EMAIL}`}>Write to us <ArrowRight /></a></Button>
        <button type="button" onClick={copy} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-[14px] font-semibold text-[#2E3656] transition-colors hover:border-primary/40">
          {copied ? <><Check className="size-4 text-emerald-600" />Copied</> : <><Copy className="size-4" />Copy address</>}
        </button>
      </div>
    </div>
  );
}

/** What happens after you hit send: the request moves Received → Prioritized → Resolved, on a loop. */
function RequestCard() {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(reduce ? 3 : 0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setStage((x) => (x + 1) % 5), 1400);
    return () => clearInterval(t);
  }, [reduce]);
  const done = Math.min(stage, 3);

  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      <div aria-hidden className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(115,103,240,.30),transparent_68%)] blur-2xl" />
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, ease }}
        className="grain relative overflow-hidden rounded-[26px] bg-[hsl(var(--ix-navy))] p-5 text-white shadow-[0_40px_80px_-30px_rgba(40,30,140,.75)] ring-1 ring-white/10 sm:p-6">
        <div aria-hidden className="bg-blueprint-dark mask-fade pointer-events-none absolute inset-0" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <Emblem kind="mail" glow className="size-12 rounded-xl" />
            <div className="min-w-0 leading-tight">
              <Mono className="text-[10px] text-sky-300">NEW SUPPORT REQUEST</Mono>
              <p className="truncate text-[15px] font-semibold">To: {EMAIL}</p>
            </div>
          </div>
          {/* the message, as you'd write it */}
          <div className="mt-5 space-y-2 rounded-xl border border-white/10 bg-white/[.04] p-3.5">
            <div className="h-2 w-3/4 rounded-full bg-white/20" />
            <div className="h-2 w-full rounded-full bg-white/10" />
            <div className="h-2 w-5/6 rounded-full bg-white/10" />
            <div className="h-2 w-2/5 rounded-full bg-white/10" />
          </div>
          {/* where it is now */}
          <ol className="mt-5 space-y-3">
            {STEPS.map((st, i) => {
              const ok = i < done, live = i === done && stage < 3;
              return (
                <li key={st.k} className="flex items-start gap-3">
                  <span className={cn("relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border transition-colors duration-300", ok ? "border-emerald-400 bg-emerald-400 text-[#0B1A30]" : live ? "border-sky-300 text-sky-300" : "border-white/20 text-white/30")}>
                    {ok ? <Check className="size-3.5" /> : <span className="text-[10px] font-semibold">{i + 1}</span>}
                    {live && !reduce && <span className="absolute inset-0 animate-ping rounded-full border border-sky-300/60" />}
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block text-[14.5px] font-semibold transition-colors", ok || live ? "text-white" : "text-white/40")}>{st.k}</span>
                    <span className={cn("block text-[13px] transition-colors", ok || live ? "text-[#9FB3CF]" : "text-white/30")}>{st.d}</span>
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-white/[.06] px-3.5 py-2.5">
            <Mono className="text-[10px] text-white/60">TYPICAL REPLY</Mono>
            <Mono className="text-[12px] text-white">48–72 H · MON–SAT</Mono>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function CtHero() {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-clip pb-16 pt-28 md:pb-24 md:pt-40">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_78%_45%,rgba(115,103,240,.20),transparent_70%),radial-gradient(30%_40%_at_95%_15%,rgba(31,143,255,.12),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_70%)]" />
      <GridRunners />
      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-3 rounded-2xl border border-white bg-white/80 py-2 pl-2 pr-4 shadow-[0_14px_34px_-18px_rgba(75,63,208,.55),inset_0_1px_0_#fff] backdrop-blur">
            <Emblem kind="mail" tone="light" className="size-11 rounded-xl" />
            <span className="leading-tight">
              <span className={cn("block text-[17px] font-extrabold tracking-[-0.02em]", INK)}>Contact</span>
              <Mono className="text-[11px] text-muted-foreground">MON–SAT · REPLIES IN 48–72 H</Mono>
            </span>
          </motion.div>
          <motion.h1 initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.7, ease }}
            className={cn("mt-7 text-[40px] font-black leading-[0.98] tracking-[-0.055em] sm:text-[52px] md:text-[64px]", INK)}>
            Get in <span className={HL}>touch.</span>
          </motion.h1>
          <motion.p initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.6, ease }}
            className="mt-6 max-w-[46ch] text-[17px] text-[#4B5275] md:text-[18.5px]">
            Questions, feedback or support requests: reach out anytime, about anything on InterviewTrix.
          </motion.p>
          <div className="mt-6 flex flex-wrap gap-2">
            {TOPICS.map((t, i) => (
              <motion.span key={t} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.05 }}
                className="rounded-full border border-border bg-white px-3 py-1.5 text-[13px] font-medium text-[#2E3656]">{t}</motion.span>
            ))}
          </div>
          <EmailActions />
        </div>
        <RequestCard />
      </div>
    </section>
  );
}

export function CtFacts() {
  return (
    <section className={LIGHT}>
      <Dots />
      <div className={WRAP}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {FACTS.map((f, i) => (
            <motion.div key={f.k} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ delay: i * 0.08, duration: 0.55, ease }}
              className="grain relative overflow-hidden rounded-[24px] bg-[hsl(var(--ix-navy))] p-6 text-white shadow-[0_30px_60px_-30px_rgba(40,30,140,.6)] ring-1 ring-white/10">
              <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_20%_0%,rgba(115,103,240,.28),transparent_70%)]" />
              <div className="relative">
                <Emblem kind={f.kind} />
                <Mono className="mt-5 block text-[11px] text-sky-300">{f.k.toUpperCase()}</Mono>
                <p className="mt-1 text-[24px] font-extrabold tracking-[-0.03em] text-white">{f.v}</p>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[#9FB3CF]">{f.d}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
