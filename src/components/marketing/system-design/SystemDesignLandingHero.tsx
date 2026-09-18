"use client";

import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Check,
  LayoutGrid,
  Network,
} from "lucide-react";
import { SystemDesignHeroPreview } from "@/components/system-design/SystemDesignHeroPreview";
import { Button } from "@/components/ui/button";
import { appPrimaryButton } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

function SystemDesignHeroPreviewCard() {
  return (
    <div className="relative w-full max-w-lg">
      <SystemDesignHeroPreview />
      <div
        className="absolute left-2 top-2 z-10 animate-pulse rounded-md bg-primary px-2 py-1 text-[10px] font-semibold text-white shadow-lg sm:text-xs"
        style={{ animationDuration: "2.5s" }}
      >
        Excalidraw canvas
      </div>
    </div>
  );
}

export function SystemDesignLandingHero() {
  return (
    <section
      className={cn(
        "relative min-h-0 overflow-x-hidden border-b border-[#7a6cea]/10 bg-gradient-to-br from-[#7a6cea]/20 via-[#9d8ff5]/12 to-[#c4bdf7]/25 px-4 pb-10 pt-24 sm:px-6 sm:pb-12 sm:pt-28 md:pb-14 md:pt-32 lg:px-8 lg:pb-14 lg:pt-36 xl:pb-16 xl:pt-40",
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={`hero-float-${i}`}
            className="absolute"
            style={{
              left: `${(i * 13 + 4) % 92}%`,
              top: `${(i * 19 + 6) % 88}%`,
              opacity: 0.08,
              animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {i % 3 === 0 ? (
              <LayoutGrid className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
            ) : i % 3 === 1 ? (
              <Network className="h-9 w-9 text-primary sm:h-12 sm:w-12" />
            ) : (
              <Boxes className="h-8 w-8 text-primary sm:h-11 sm:w-11" />
            )}
          </div>
        ))}
      </div>

      <div className="container relative z-10 mx-auto max-w-7xl">
        <div className="mb-10 flex justify-center sm:mb-12 lg:hidden">
          <SystemDesignHeroPreviewCard />
        </div>

        <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-4 text-center sm:space-y-5 md:space-y-6 lg:max-w-xl lg:text-left">
            <div className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
              <span>AI System Design Interview Practice</span>
            </div>

            <h1 className="mb-4 text-[1.22rem] font-bold leading-tight tracking-tight text-slate-900 sm:mb-6 sm:text-[1.46rem] md:text-[1.625rem] lg:text-[2.15rem] xl:text-[2.28rem]">
              <span className="block">Run a live system design</span>
              <span className="block">
                <span className="text-primary">mock interview with AI</span>
              </span>
            </h1>

            <p className="mx-auto max-w-xl px-2 text-base leading-relaxed text-gray-600 sm:px-0 sm:text-lg lg:text-xl">
              Pick a curated prompt, whiteboard on Excalidraw, talk through
              requirements and trade-offs with an AI Live interviewer,
              and get a weighted rubric report on scope, architecture, scaling,
              and communication.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 px-2 pt-2 sm:flex-row sm:gap-4 sm:px-0 lg:justify-start">
              <Button
                asChild
                size="lg"
                className={cn(
                  appPrimaryButton,
                  "h-auto w-full px-5 py-4 text-sm font-semibold shadow-lg transition-all hover:shadow-xl sm:w-auto sm:px-6 sm:py-5 sm:text-base",
                )}
              >
                <Link href="/dashboard/system-design">
                  Start System Design Session
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-sm font-medium text-gray-500 lg:justify-start">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>10 curated interview prompts</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>AI Live interviewer</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>4-dimension rubric scoring</span>
              </div>
            </div>
          </div>

          <div className="hidden justify-center py-2 lg:flex lg:justify-end lg:py-3 xl:py-4">
            <SystemDesignHeroPreviewCard />
          </div>
        </div>
      </div>
    </section>
  );
}
