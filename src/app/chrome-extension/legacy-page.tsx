"use client";

import Link from "next/link";
import {
  Check,
  Puzzle,
  MousePointerClick,
  FileText,
  Shield,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { AddToChromeButton } from "@/components/chrome-extension/AddToChromeButton";
import { Button } from "@/components/ui/button";
import {
  appMarketingSection,
  appOutlineButton,
  appPrimaryButton,
} from "@/lib/app-theme";
import { cn } from "@/lib/utils";

const supportedSites = [
  "LinkedIn",
  "Naukri",
  "Indeed",
  "Glassdoor",
  "Greenhouse",
  "Lever",
  "Wellfound",
  "Any career page",
];

const steps = [
  {
    icon: Puzzle,
    title: "Add and pin the extension",
    body: "Chrome cannot install extensions from a website automatically. Add it from the Chrome Web Store, then pin it from the puzzle icon so it stays one click away.",
  },
  {
    icon: MousePointerClick,
    title: "Open it on a job posting",
    body: "We’ll try to detect the role, company, and description. You can edit the text or use what you highlighted on the page.",
  },
  {
    icon: FileText,
    title: "Tailor a new resume copy",
    body: "InterviewTrix opens in your existing login. Pick a source resume — we create a new tailored version and leave the original untouched.",
  },
];

export default function ChromeExtensionPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-background selection:bg-info-muted">
      <SiteHeader />
      <main className="pt-16 sm:pt-[4.25rem]">
        <section className={cn(appMarketingSection, "px-4 py-12 sm:px-6 sm:py-16")}>
          <div className="container mx-auto max-w-4xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
              Chrome extension
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Tailor your resume from any job page
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Capture a job description in Chrome, stay signed in to InterviewTrix,
              and generate a new tailored resume copy in one flow.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <AddToChromeButton size="lg" />
              <Button asChild variant="outline" className={cn(appOutlineButton, "h-auto px-5 py-4")}>
                <Link href="/dashboard/resumes/new">Open resume builder</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              After you add it, click the puzzle icon in Chrome and pin InterviewTrix.
            </p>
          </div>
        </section>

        <section className="border-y border-border/60 bg-muted/20 px-4 py-12 sm:px-6 sm:py-16">
          <div className="container mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="rounded-xl border border-border/80 bg-card p-5 shadow-card"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {step.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className={cn(appMarketingSection, "px-4 py-12 sm:px-6 sm:py-16")}>
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
              Works on the boards you already use
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Site-specific extractors for popular boards, plus JSON-LD and
              selected-text fallbacks on company career pages.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {supportedSites.map((site) => (
                <li
                  key={site}
                  className="flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-sm text-foreground"
                >
                  <Check className="h-4 w-4 text-primary" />
                  {site}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-border/60 bg-muted/20 px-4 py-12 sm:px-6 sm:py-16">
          <div className="container mx-auto flex max-w-4xl flex-col gap-4 rounded-xl border border-border/80 bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  You control what is captured
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The extension reads a page only when you click it. It never
                  calls the InterviewTrix API and uses your existing browser
                  login when you continue on the site.
                </p>
              </div>
            </div>
            <AddToChromeButton className={cn(appPrimaryButton, "shrink-0")} />
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
