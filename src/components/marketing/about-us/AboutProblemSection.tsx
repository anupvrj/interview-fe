"use client";

import { FileText, Layers, Mic } from "lucide-react";
import { AnimateIn } from "@/components/marketing/about-us/AnimateIn";
import { AboutSectionHeader } from "@/components/marketing/about-us/AboutSectionHeader";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

const challenges = [
  {
    icon: FileText,
    stat: "75%",
    title: "Filtered before a human reads you",
    description:
      "ATS systems reject most resumes on formatting and keywords—not experience alone.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Mic,
    stat: "4+",
    title: "Round types, one prep habit",
    description:
      "Behavioral, coding, system design, and culture-fit need different preparation.",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    icon: Layers,
    stat: "5+",
    title: "Tools that don't connect",
    description:
      "Scattered apps mean no feedback loop—you never know if you're actually ready.",
    gradient: "from-emerald-500 to-teal-600",
  },
];

export function AboutProblemSection() {
  return (
    <section
      id="why-it-matters"
      className="scroll-mt-24 bg-muted/40 px-4 py-16 sm:px-6 sm:py-20 lg:py-24"
    >
      <div className="container mx-auto max-w-6xl">
        <AboutSectionHeader
          badge="The problem"
          title={
            <>
              Interview prep hasn&apos;t kept up with{" "}
              <span className="text-primary">how hiring works</span>
            </>
          }
          description="Most candidates still prepare like it's 2015—while hiring runs on automated filters, AI-assisted screening, and structured multi-round evaluations."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {challenges.map((item, index) => (
            <AnimateIn key={item.title} delay={index * 80}>
              <article
                className={cn(
                  appCard,
                  "relative h-full overflow-hidden p-6 sm:p-7",
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl",
                    item.gradient,
                  )}
                />
                <div className="relative">
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white",
                        item.gradient,
                      )}
                    >
                      <item.icon className="h-5 w-5" aria-hidden />
                    </div>
                    <span className="text-2xl font-bold tabular-nums text-primary">
                      {item.stat}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {item.description}
                  </p>
                </div>
              </article>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
