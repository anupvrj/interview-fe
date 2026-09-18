"use client";

import { AnimateIn } from "@/components/marketing/about-us/AnimateIn";
import { cn } from "@/lib/utils";

const pillars = [
  {
    number: "01",
    title: "Our mission",
    description:
      "Make world-class interview preparation accessible to every candidate—starting where hiring actually begins, not where legacy prep tools stop.",
  },
  {
    number: "02",
    title: "Our vision",
    description:
      "A world where talent isn't filtered out by bots before a human ever sees it—and where prep matches how companies hire in the AI era.",
  },
  {
    number: "03",
    title: "Our promise",
    description:
      "One platform for the full prep loop: ATS-ready resumes, AI practice, coding drills, and peer validation—without juggling five different tools.",
  },
] as const;

export function AboutMissionSection() {
  return (
    <section className="scroll-mt-24 border-y border-border/60 bg-background px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16 xl:gap-20">
          <AnimateIn className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Who we are
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem] lg:leading-[1.12]">
              Built for candidates, designed for modern hiring
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Interview Trix is an AI-native career platform helping job seekers get
              shortlisted, practice smarter, and show up ready.
            </p>
            <blockquote className="mt-8 border-l-2 border-primary/40 pl-5 text-base leading-relaxed text-foreground/90 sm:text-lg">
              We believe preparation should mirror the hiring process—not just the
              final interview room.
            </blockquote>
          </AnimateIn>

          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
              {pillars.map((pillar, index) => (
                <AnimateIn key={pillar.number} delay={80 + index * 70}>
                  <article
                    className={cn(
                      "px-6 py-7 sm:px-8 sm:py-8",
                      index > 0 && "border-t border-border/60",
                    )}
                  >
                    <div className="flex gap-5 sm:gap-6">
                      <span className="shrink-0 text-sm font-bold tabular-nums tracking-wider text-primary/70">
                        {pillar.number}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-foreground sm:text-xl">
                          {pillar.title}
                        </h3>
                        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                          {pillar.description}
                        </p>
                      </div>
                    </div>
                  </article>
                </AnimateIn>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
