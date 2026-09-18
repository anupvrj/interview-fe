"use client";

import { useEffect, useRef, useState } from "react";
import { AnimateIn } from "@/components/marketing/about-us/AnimateIn";
import { MILESTONES } from "@/lib/aboutUsContent";
import { cn } from "@/lib/utils";

export function AboutTimelineSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          let value = 0;
          const interval = window.setInterval(() => {
            value += 4;
            if (value >= 100) {
              setProgress(100);
              window.clearInterval(interval);
            } else {
              setProgress(value);
            }
          }, 30);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="our-story"
      className="scroll-mt-24 px-4 py-14 sm:px-6 sm:py-16 lg:py-20"
    >
      <div className="container mx-auto max-w-5xl">
        <AnimateIn className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Our journey
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Our story
          </h2>
          <p className="text-base text-muted-foreground sm:text-lg">
            Interview Trix started with a simple question: why does interview
            prep still ignore the steps where most candidates actually lose?
          </p>
        </AnimateIn>

        <div ref={trackRef} className="relative">
          <div className="absolute left-4 top-0 hidden h-full w-0.5 overflow-hidden rounded-full bg-border md:left-1/2 md:block md:-translate-x-px">
            <div
              className="w-full rounded-full bg-gradient-to-b from-primary via-indigo-500 to-emerald-500 transition-all duration-1000 ease-out"
              style={{ height: `${progress}%` }}
            />
          </div>

          <div className="space-y-8 md:space-y-12">
            {MILESTONES.map((milestone, index) => (
              <AnimateIn
                key={milestone.year}
                delay={index * 120}
                direction={index % 2 === 0 ? "left" : "right"}
              >
                <article
                  className={cn(
                    "relative flex flex-col gap-4 md:flex-row md:items-center",
                    index % 2 === 0 ? "md:flex-row-reverse" : "",
                  )}
                >
                  <div className="hidden flex-1 md:block" aria-hidden />

                  <div className="relative z-10 flex items-center gap-4 md:absolute md:left-1/2 md:-translate-x-1/2 md:flex-col md:gap-2">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl border-2 bg-card text-sm font-bold shadow-lg transition-all duration-700",
                        progress >= (index + 1) * 33
                          ? "scale-110 border-primary text-primary"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {milestone.year}
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex-1 rounded-2xl border border-border/70 bg-card p-5 shadow-card transition-all duration-500 hover:-translate-y-0.5 hover:shadow-header sm:p-6 md:max-w-[calc(50%-3rem)]",
                      index % 2 === 0 ? "md:text-right" : "",
                    )}
                  >
                    <p className="mb-1 text-sm font-semibold text-primary">
                      {milestone.label}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {milestone.description}
                    </p>
                  </div>
                </article>
              </AnimateIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
