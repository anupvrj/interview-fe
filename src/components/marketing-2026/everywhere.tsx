"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Chrome, Code2, Copy, MessageSquare, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Index, Mono } from "./primitives";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "chatgpt", icon: MessageSquare, label: "ChatGPT", cta: "Add InterviewTrix to ChatGPT", steps: ["Pasted a Razorpay SDE-2 JD into ChatGPT", "Picked Meridian from the InterviewTrix templates", "Draft created, scored 81 against the JD", "The same resume is already in the dashboard"] },
  { id: "chrome", icon: Chrome, label: "Chrome extension", cta: "Add to Chrome, free", steps: ["Opened a Swiggy job post on LinkedIn", "Match: 82%. Missing gRPC and on-call", "Tailored 4 bullets for this JD", "Application landed in the Job Tracker"] },
  { id: "claude", icon: Sparkle, label: "Claude", cta: "Connect Claude", steps: ["Asked Claude about last week's mock", "Claude pulled the real InterviewTrix report", "Answered from Tuesday's session, not a guess", "Same memory as the website"] },
  { id: "mcp", icon: Code2, label: "Any AI via MCP", cta: "Copy the MCP URL", steps: ["Pasted one URL and a personal token", "The editor now sees 15 InterviewTrix tools", "Scored a resume without leaving Cursor", "Results sync to the dashboard"] },
] as const;

export function Everywhere() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => { if (paused) return; const t = setTimeout(() => setI((x) => (x + 1) % tabs.length), 7000); return () => clearTimeout(t); }, [i, paused]);
  const tab = tabs[i];
  return (
    <section className="relative overflow-clip bg-[linear-gradient(180deg,#EEF6FF_0%,#E6F0FF_100%)] py-28" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative mx-auto max-w-[1120px] px-5">
        <Index n="07" label="Wherever you are" />
        <h2 className="max-w-[20ch] text-[34px] font-extrabold leading-[1.05] tracking-[-0.045em] md:text-[64px]">You already live in ChatGPT and on job sites. So does InterviewTrix.</h2>
        <div role="tablist" className="mt-9 flex flex-wrap gap-2">
          {tabs.map((t, k) => (
            <button key={t.id} role="tab" aria-selected={k === i} onClick={() => setI(k)} className={cn("relative flex items-center gap-2 overflow-hidden rounded-xl border bg-card px-4 py-2.5 text-[14.5px] transition-shadow", k === i ? "border-primary shadow-[0_0_0_3px_hsl(var(--primary-muted))]" : "border-border hover:border-primary/40")}>
              <t.icon className="size-4 text-primary" />{t.label}<Mono className="text-[10px] text-success">● LIVE</Mono>
              {k === i && !paused && <motion.span key={`p${i}`} className="absolute bottom-0 left-0 h-0.5 bg-primary" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 7, ease: "linear" }} />}
            </button>
          ))}
        </div>
        <div className="mt-6 grid items-stretch gap-6 md:grid-cols-[1.3fr_.7fr]">
          <div className="min-h-[360px] overflow-hidden rounded-[18px] border border-border bg-card shadow-[0_30px_70px_-35px_rgba(47,43,61,.4)]">
            <AnimatePresence mode="wait">
              <motion.div key={tab.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                {tab.id === "chatgpt" && <ChatGPT />}
                {tab.id === "chrome" && <ChromeExt />}
                {tab.id === "claude" && <ClaudeChat />}
                {tab.id === "mcp" && <Terminal />}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="rounded-[18px] border border-border bg-card p-6">
            <Mono className="text-[12px] text-muted-foreground">WHAT JUST HAPPENED</Mono>
            <ol className="mb-6 mt-4 grid gap-3">
              {tab.steps.map((s, k) => (
                <motion.li key={tab.id + k} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + k * 0.12 }} className="flex gap-3 text-[14.5px]">
                  <Mono className="w-4 shrink-0 pt-0.5 text-[12px] text-primary">{k + 1}</Mono>{s}
                </motion.li>
              ))}
            </ol>
            <Button className="w-full rounded-xl hover:bg-primary/90">{tab.cta}</Button>
            <p className="mt-4 text-[12.5px] text-muted-foreground">Voice interviews run on interviewtrix.com. Everything else works where you are.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-[13px]">
          <Mono className="rounded-lg border border-border bg-card px-3 py-2">mcp.interviewtrix.com/mcp</Mono>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-white" onClick={() => navigator.clipboard?.writeText("https://mcp.interviewtrix.com/mcp")}><Copy className="size-3.5" />Copy</button>
          <span className="text-muted-foreground">ChatGPT and Claude sign in with OAuth · Cursor, VS Code and Windsurf use a personal token</span>
        </div>
      </div>
    </section>
  );
}

function ChatGPT() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Mono className="text-[11px] text-muted-foreground">chatgpt.com</Mono>
      <div className="self-end rounded-[18px] bg-[#F2F2F2] px-4 py-2.5 text-[14.5px]">Build my resume for this Razorpay SDE-2 JD</div>
      <div className="rounded-2xl border border-border p-4">
        <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold"><span className="grid size-5 place-items-center rounded bg-primary text-[10px] text-white">iX</span>InterviewTrix · pick a template</div>
        <div className="grid grid-cols-4 gap-2">
          {["meridian", "harvard", "atlantic-blue", "clean-slate"].map((t, k) => (
            <div key={t} className={cn("relative h-28 overflow-hidden rounded-lg border", k === 0 ? "border-2 border-primary" : "border-border")}>
              <img src={`/marketing-2026/templates/${t}-preview.webp`} alt="" className="h-full w-full object-cover object-top" />
            </div>
          ))}
        </div>
      </div>
      <p className="text-[14.5px] leading-relaxed">Draft's ready with your Infosys payments work up top. ATS score against this JD: <b>81/100</b>. Two keywords are missing: <b>Kafka</b> and <b>idempotency</b>. Want me to add them?</p>
    </div>
  );
}
function ChromeExt() {
  return (
    <div className="grid min-h-[360px] md:grid-cols-[1fr_230px]">
      <div className="p-6">
        <Mono className="text-[11px] text-muted-foreground">linkedin.com/jobs/view/backend-engineer-ii</Mono>
        <div className="mt-3 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[#FC8019] text-[15px] font-black text-white">S</span>
          <div><p className="text-[19px] font-bold leading-tight">Backend Engineer II</p><p className="text-[13px] text-muted-foreground">Swiggy · Bengaluru · 3-5 yrs · Hybrid · 214 applicants</p></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">{["Go", "Kafka", "gRPC", "PostgreSQL", "On-call"].map((t) => <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-[12px]">{t}</span>)}</div>
        <p className="mt-4 text-[13.5px] font-semibold">What you'll do</p>
        <ul className="mt-1.5 space-y-1.5 text-[13px] text-muted-foreground">
          <li>• Own order-routing services handling 40k requests a second at dinner peak</li>
          <li>• Design idempotent payment callbacks with the payments team</li>
          <li>• Join the on-call rotation for delivery-partner APIs</li>
        </ul>
      </div>
      <div className="flex flex-col gap-3 border-t border-border bg-[#FCFCFE] p-5 md:border-l md:border-t-0">
        <div className="flex items-center gap-2 text-[13px] font-semibold"><span className="grid size-5 place-items-center rounded bg-primary text-[10px] text-white">iX</span>InterviewTrix</div>
        <div className="flex items-baseline justify-between rounded-xl border border-border bg-card px-3 py-2.5 text-[12.5px] text-muted-foreground">Match<Mono className="text-[20px] text-success">82%</Mono></div>
        <p className="text-[12.5px] text-muted-foreground">Missing: gRPC, on-call</p>
        <Button size="sm" className="rounded-lg">Tailor resume</Button>
        <Button size="sm" variant="outline" className="rounded-lg">Autofill form</Button>
        <p className="text-[12px] text-success">✓ Added to Job Tracker · Applied</p>
      </div>
    </div>
  );
}
function ClaudeChat() {
  return (
    <div className="flex flex-col gap-4 bg-[#FAF9F5] p-6">
      <Mono className="text-[11px] text-muted-foreground">claude.ai</Mono>
      <div className="self-end rounded-2xl bg-[#EDEAE0] px-4 py-2.5 text-[14.5px]">What did I get wrong in last week's mock?</div>
      <Mono className="text-[11px] text-muted-foreground">Used InterviewTrix · get_interview_report</Mono>
      <p className="text-[15px] leading-relaxed">Three things from Tuesday's Razorpay SDE-2 mock. Your caching answer skipped eviction (clarity 58). You sped up to 164 wpm when pushed. And the Infosys migration story never said what <i>you</i> decided.</p>
    </div>
  );
}
function Terminal() {
  return (
    <div className="min-h-[360px] bg-[#0B1220] p-6 font-[family-name:var(--font-geist-mono)] text-[13px] leading-7 text-[#C9D6EA]">
      <span className="text-[#5C7391]">// ~/.cursor/mcp.json</span><br />
      {'{ "mcpServers": { "interviewtrix": {'}<br />
      &nbsp;&nbsp;{'"url": "https://mcp.interviewtrix.com/mcp",'}<br />
      &nbsp;&nbsp;{'"headers": { "Authorization": "Bearer itx_live_••••" } } } }'}<br /><br />
      <span className="text-[#7FDBA1]">✓ interviewtrix connected · 15 tools</span><br />
      <span className="text-[#5C7391]">&gt; score_resume_ats(resume: "aarav-v3", jd: "razorpay-sde2")</span><br />
      <span className="text-[#7FDBA1]">← 81/100 · missing: Kafka, idempotency</span>
    </div>
  );
}
