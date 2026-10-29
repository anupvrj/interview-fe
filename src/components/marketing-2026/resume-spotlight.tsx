"use client";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrowserFrame, Index, LoopVideo, Mono } from "./primitives";
import { MK26_ROUTES } from "./cta";
import { StartLink } from "./StartLink";

/** Enhancv pattern: show the act of improving a resume (real capture). */
export function ResumeSpotlight() {
  return (
    <section className="relative overflow-clip border-y border-primary/10 bg-[linear-gradient(180deg,#FFFFFF_0%,#F1EEFF_100%)] py-28">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-[repeating-linear-gradient(to_bottom,hsl(var(--foreground)/.14)_0_1px,transparent_1px_12px)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-[repeating-linear-gradient(to_bottom,hsl(var(--foreground)/.14)_0_1px,transparent_1px_12px)]" />
      <div className="mx-auto max-w-[1120px] px-5">
        <Index n="06" label="Fix the paper" />
        <Mono className="text-[12.5px] text-muted-foreground">RESUME BUILDER · ATS CHECKER</Mono>
          <h2 className="max-w-[18ch] mt-3 text-[34px] font-extrabold leading-[1.05] tracking-[-0.045em] md:text-[64px]">“Worked on APIs” isn't a bullet. Fix it in a second.</h2>
      </div>
      <div className="mx-auto mt-12 grid max-w-[1120px] items-center gap-12 px-5 md:grid-cols-[.85fr_1.15fr]">
        <div>

          <p className="mt-5 max-w-[48ch] text-[17px] text-muted-foreground">Click a weak line and get a specific one back, in place. The preview re-flows and your ATS score moves while you watch. Build it here, in ChatGPT, or straight from a job post with the Chrome extension.</p>
          <ul className="mt-7 grid gap-3 text-[15px]">
            {["34 ATS checks across 8 categories, free without sign-up", "Switch designs in one click, download as PDF", "Import from LinkedIn or an old PDF, or talk it out with Ava"].map((t) => (
              <li key={t} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-success" />{t}</li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="h-12 rounded-xl px-6 hover:bg-primary/90">
              <StartLink href={MK26_ROUTES.startResume}>Build my resume, free</StartLink>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-xl px-6">
              <StartLink href={MK26_ROUTES.ats}>Check my ATS score</StartLink>
            </Button>
          </div>
        </div>
        <BrowserFrame url="app.interviewtrix.com/dashboard/resumes/aarav-rao/edit"><LoopVideo name="rewrite" /></BrowserFrame>
      </div>
    </section>
  );
}
