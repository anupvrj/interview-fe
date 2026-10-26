"use client";
import { useState } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brackets, Index, Mono } from "./primitives";
import { cn } from "@/lib/utils";
import { MK26_ROUTES } from "./cta";
import { StartLink } from "./StartLink";
import { HOME_FAQ } from "./home-faq";

/* Proof — Enhancv-style collage over a soft blob, quotes in first-person pride voice */
export function Proof() {
  return (
    <section className="relative overflow-clip py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-[45%] bg-[radial-gradient(closest-side,rgba(115,103,240,.16),transparent),radial-gradient(40%_50%_at_70%_60%,rgba(31,182,255,.14),transparent)] blur-2xl" />
      <div className="relative mx-auto max-w-[1120px] px-5">
        <Index n="08" label="Fair play" />
        <h2 className="max-w-[20ch] text-[34px] font-extrabold leading-[1.05] tracking-[-0.045em] md:text-[64px]">We make you better at interviews. We don't feed you answers.</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Quote q="I'd done the Razorpay system design round nine times here before the real one. The real one felt like round ten." who="Backend engineer, Bengaluru" tag="Offer · Oct 2026" />
          <div className="flex flex-col justify-between rounded-2xl bg-foreground p-6 text-white md:row-span-2">
            <Mono className="text-[12px] text-white/60">IX SCORE · 3 WEEKS · 11 SESSIONS</Mono>
            <div className="my-6 text-[72px] font-black leading-none tracking-[-0.05em] tabular-nums"><s className="text-[34px] font-semibold text-white/35">61</s> 84</div>
            <svg viewBox="0 0 200 60" className="mb-6 h-16 w-full" aria-label="iX Score rising from 61 to 84 over 11 sessions">
              <defs><linearGradient id="spk" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#9B8CFF" stopOpacity=".5" /><stop offset="1" stopColor="#9B8CFF" stopOpacity="0" /></linearGradient></defs>
              <path d="M0 52 L20 48 L40 50 L60 41 L80 38 L100 33 L120 30 L140 22 L160 20 L180 12 L200 8 L200 60 L0 60Z" fill="url(#spk)" />
              <path d="M0 52 L20 48 L40 50 L60 41 L80 38 L100 33 L120 30 L140 22 L160 20 L180 12 L200 8" fill="none" stroke="#B4A9FF" strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx="200" cy="8" r="4" fill="#fff" />
            </svg>
            <div className="space-y-2 text-[14px] text-white/75">
              <p>✓ 11 integrity signals on every interview</p><p>✓ No live answer feeds, ever</p><p>✓ Delete your memory any time</p>
            </div>
          </div>
          <Quote q="It caught that I say 'basically' every eleven seconds. Nobody had told me in four years." who="Fresher, Pune" tag="TCS NQT" />
          <Quote q="The report told me exactly which answer lost the round. I fixed that one story and stopped rambling." who="Product analyst, Gurugram" tag="Switched roles" />
          <Quote q="Built the resume inside ChatGPT on my phone, tailored it from the job post on my laptop. Same resume, both places." who="Data engineer, Hyderabad" tag="3 interviews in 2 weeks" />
        </div>
      </div>
    </section>
  );
}
function Quote({ q, who, tag }: { q: string; who: string; tag: string }) {
  return (
    <figure className="relative rounded-2xl border border-border bg-card/90 p-6 backdrop-blur">
      <blockquote className="text-[16.5px] leading-relaxed">“{q}”</blockquote>
      <figcaption className="mt-5 flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
        <span className="flex items-center gap-2.5"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-sky-400 text-[12px] font-bold text-white">{who.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>{who}</span>
        <Mono className="rounded-md bg-success-muted px-2 py-0.5 text-[11px] text-success">{tag}</Mono>
      </figcaption>
    </figure>
  );
}

/* Pricing — Verve's dark pricing block with a billing toggle; plan cards styled as passes */
const plans = [
  { k: "EVERYONE", name: "General Pass", m: 699, q: 1899, y: 6999, items: ["600 credits a month", "Voice mock interviews", "Resume builder + ATS"] },
  { k: "JR & MID DEVS", name: "Tech Basic", m: 899, q: 2499, y: 8999, items: ["1,000 credits a month", "+ Coding round", "+ System design & whiteboard"] },
  { k: "SENIOR & LEADS", name: "Tech Pro", m: 1999, q: 5499, y: 19999, pop: true, items: ["3,000 credits a month", "30-minute sessions", "2 peer interviews included"] },
];
export function Pricing() {
  const [b, setB] = useState<"m" | "q" | "y">("q");
  const per = (p: (typeof plans)[number]) => Math.round(b === "m" ? p.m : b === "q" ? p.q / 3 : p.y / 12);
  return (
    <section className="px-3 py-6">
      <div className="grain relative mx-auto max-w-[1240px] overflow-clip rounded-[28px] bg-[hsl(var(--ix-navy))] px-5 py-24 text-[#EAF2FF]">
        <div className="bg-blueprint-dark mask-fade pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-[1080px] text-center">
          <div className="flex justify-center"><Index n="09" label="The cost" dark /></div>
          <h2 className="leading-[1.02] text-[34px] font-extrabold tracking-[-0.045em] md:text-[64px]">Less than one human mock interview.</h2>
          <div className="mx-auto mt-8 inline-flex rounded-xl border border-[#1B3C62] bg-[#0D1F36] p-1 text-[14px]">
            {([["m", "Monthly"], ["q", "3-month Sprint"], ["y", "Yearly"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setB(k)} className={cn("rounded-lg px-4 py-2 transition-colors", b === k ? "bg-primary text-white" : "text-[#9FB3CF] hover:text-white")}>{l}</button>
            ))}
          </div>
          <div className="mt-10 grid gap-4 text-left md:grid-cols-3">
            {plans.map((p) => (
              <div key={p.name} className={cn("relative grid grid-cols-[1fr_44px] overflow-hidden rounded-2xl border bg-[#0D1F36]", p.pop ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)),0_30px_60px_-30px_rgba(115,103,240,.7)]" : "border-[#1B3C62]")}>
                <div className="p-6">
                  <Mono className="text-[11px] text-[#6E86A8]">PASS · {p.k}</Mono>
                  <h3 className="mt-1 text-[22px] font-bold">{p.name}</h3>
                  <p className="mt-4 text-[44px] font-black tracking-[-0.04em] tabular-nums">₹{per(p).toLocaleString("en-IN")}<span className="ml-1 text-[14px] font-medium tracking-normal text-[#9FB3CF]">/mo</span></p>
                  <ul className="mt-5 space-y-2 text-[14px] text-[#CFE0F7]">{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
                  <Button asChild className={cn("mt-7 w-full rounded-xl", !p.pop && "bg-white/10 hover:bg-white/15")}>
                    <StartLink href={MK26_ROUTES.startInterview}>Start 14-day free trial</StartLink>
                  </Button>
                </div>
                <div className="border-l-2 border-dashed border-[#1B3C62] bg-[repeating-linear-gradient(0deg,#EAF2FF_0_2px,transparent_2px_5px,#EAF2FF_5px_6px,transparent_6px_9px)] bg-[length:60%_70%] bg-center bg-no-repeat opacity-40" />
                {p.pop && <Mono className="absolute right-14 top-5 rounded-md bg-primary px-2 py-0.5 text-[10.5px] text-white">MOST PICKED</Mono>}
              </div>
            ))}
          </div>
          <p className="mt-8 text-[14px] text-[#9FB3CF]">14-day trial · 200 credits · no card · UPI AutoPay · cancel any time</p>
        </div>
      </div>
    </section>
  );
}

export function Faq({ items = HOME_FAQ, title = "Questions people actually ask", className }: { items?: string[][]; title?: string; className?: string } = {}) {
  return (
    <section className={cn("border-t border-border bg-[#F3F3F7] py-28", className)}>
      <div className="mx-auto grid max-w-[1120px] items-start gap-12 px-5 md:grid-cols-[7fr_5fr]">
        <div>
          <h2 className="mb-8 text-[34px] font-extrabold leading-[1.04] tracking-[-0.045em] text-[#2E3656] md:text-[56px]">{title}</h2>
          <Accordion.Root type="single" collapsible defaultValue="0">
            {items.map(([q, a], i) => (
              <Accordion.Item key={q} value={String(i)} className="border-t border-border last:border-b">
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 py-5 text-left text-[18px] font-semibold">
                    {q}<ChevronDown className="size-4 shrink-0 text-primary transition-transform group-data-[state=open]:rotate-180" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <p className="max-w-[62ch] pb-5 text-[15.5px] text-muted-foreground">{a}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
        <aside className="relative sticky top-28 rounded-2xl border border-border bg-card p-7 max-md:hidden">
          <Brackets />
          <Mono className="text-[12px] text-muted-foreground">STILL UNSURE?</Mono>
          <h3 className="mt-2 text-[24px] font-bold tracking-tight">Try one question out loud.</h3>
          <p className="mb-6 mt-2 text-[15px] text-muted-foreground">Two minutes, no sign-up. You'll get pace, filler words and structure on a single answer.</p>
          <Button asChild className="h-11 rounded-xl hover:bg-primary/90">
            <StartLink href={MK26_ROUTES.startInterview}>Answer one question</StartLink>
          </Button>
        </aside>
      </div>
    </section>
  );
}

/* Final CTA — film ending on the perspective floor (the page's only grid floor) */
export function FinalCta({
  primary = "Start my free mock interview",
  secondary = "Check my resume score",
  primaryHref = MK26_ROUTES.startInterview,
  secondaryHref = MK26_ROUTES.ats,
}: { primary?: string; secondary?: string; primaryHref?: string; secondaryHref?: string } = {}) {
  return (
    <section className="ix-sheet relative overflow-clip bg-[linear-gradient(180deg,#F8F7FF_0%,#EEEBFF_100%)] pt-32 text-center text-[#2E3656]">
      <div className="pointer-events-none absolute -inset-x-1/2 bottom-0 h-[52%] origin-bottom [transform:perspective(500px)_rotateX(62deg)] bg-[linear-gradient(rgba(115,103,240,.28)_1px,transparent_1px),linear-gradient(90deg,rgba(115,103,240,.28)_1px,transparent_1px)] bg-[length:64px_64px] opacity-60 [mask-image:linear-gradient(to_top,#000_10%,transparent_85%)]" />
      <div className="relative mx-auto max-w-[1120px] px-5">
        <p className="whitespace-nowrap text-[clamp(22px,6.6vw,104px)] font-black leading-none tracking-[-0.055em]">Build. <span className="bg-gradient-to-r from-[#8E83F5] to-[#5AA8FF] bg-clip-text pr-[0.04em] text-transparent">Practice.</span> Get hired.</p>
        <div className="relative flex flex-wrap justify-center gap-3 pb-28 pt-10">
          <Button asChild className="h-12 rounded-xl px-6 text-[15.5px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90">
            <StartLink href={primaryHref}>{primary}</StartLink>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-xl border-border bg-white px-6 text-[15.5px] text-[#2E3656] hover:border-primary/40">
            <StartLink href={secondaryHref}>{secondary}</StartLink>
          </Button>
        </div>
      </div>
    </section>
  );
}
export function Footer() {
  const cols: [string, { label: string; href: string }[]][] = [
    ["Practice", [
      { label: "AI mock interview", href: MK26_ROUTES.interview },
      { label: "Coding round", href: MK26_ROUTES.coding },
      { label: "System design", href: MK26_ROUTES.systemDesign },
      { label: "Peer interviews", href: MK26_ROUTES.peer },
    ]],
    ["Get seen", [
      { label: "Resume builder", href: MK26_ROUTES.resume },
      { label: "ATS checker", href: MK26_ROUTES.ats },
      { label: "Skills Graph", href: MK26_ROUTES.home },
      { label: "Portfolio", href: MK26_ROUTES.home },
    ]],
    ["Integrations", [
      { label: "ChatGPT app", href: MK26_ROUTES.chrome },
      { label: "Chrome extension", href: MK26_ROUTES.chrome },
      { label: "Claude", href: MK26_ROUTES.chrome },
      { label: "MCP server", href: MK26_ROUTES.chrome },
    ]],
    ["Company", [
      { label: "About", href: MK26_ROUTES.about },
      { label: "Pricing", href: MK26_ROUTES.pricing },
      { label: "Contact", href: MK26_ROUTES.contact },
      { label: "Privacy", href: MK26_ROUTES.privacy },
    ]],
  ];
  return (
    <footer className="relative overflow-hidden bg-[hsl(var(--ix-navy))] before:absolute before:inset-x-[8%] before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent pb-0 pt-14 text-[14px] text-[#9FB3CF]">
      <div className="mx-auto grid max-w-[1120px] grid-cols-2 gap-8 px-5 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <p className="col-span-2 max-w-[36ch] leading-relaxed md:col-span-1">AI interviewers for voice, coding and system design rounds, sharing one memory of you. On the web, in Chrome, in ChatGPT and in any MCP client.</p>
        {cols.map(([h, ls]) => (
          <div key={h}><p className="mb-3 text-[13px] font-semibold text-[#EAF2FF]">{h}</p>{ls.map((l) => <a key={l.label} href={l.href} className="block py-1 hover:text-white">{l.label}</a>)}</div>
        ))}
      </div>
      <p className="mx-auto mt-10 max-w-[1120px] px-5 text-[12.5px]">© 2026 InterviewTrix · Build. Practice. Get hired.</p>
      <p aria-hidden className="mt-10 select-none overflow-hidden whitespace-nowrap text-center text-[15vw] font-black leading-[0.8] tracking-[-0.06em] bg-gradient-to-b from-primary/40 to-primary/0 bg-clip-text text-transparent">InterviewTrix</p>
    </footer>
  );
}
