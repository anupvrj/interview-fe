"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Check,
  MessageSquare,
  Mic,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { appPrimaryButton } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

function CircleHeroImage({
  className,
  alt,
  priority = false,
}: Readonly<{
  className?: string;
  alt: string;
  priority?: boolean;
}>) {
  return (
    <div className={cn("relative mx-auto shrink-0", className)}>
      <div
        aria-hidden
        className="absolute inset-0 scale-[1.05] rounded-full bg-primary/25"
      />
      <div
        aria-hidden
        className="absolute inset-[4px] rounded-full border border-primary/30"
      />
      <div className="relative aspect-square w-full overflow-hidden rounded-full bg-gradient-to-br from-[#7a6cea]/35 via-[#9d8ff5]/20 to-[#c4bdf7]/45 shadow-[0_24px_60px_rgba(115,103,240,0.28)]">
        <Image
          src="/marketing/person-image.png"
          alt={alt}
          fill
          unoptimized
          priority={priority}
          className="object-cover object-[center_18%]"
        />
      </div>
    </div>
  );
}

export function InterviewCoachLandingHero() {
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
              <Mic className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
            ) : i % 3 === 1 ? (
              <Brain className="h-9 w-9 text-primary sm:h-12 sm:w-12" />
            ) : (
              <MessageSquare className="h-8 w-8 text-primary sm:h-11 sm:w-11" />
            )}
          </div>
        ))}
      </div>

      <div className="container relative z-10 mx-auto max-w-7xl">
        <div className="mb-10 flex justify-center sm:mb-12 lg:hidden">
          <CircleHeroImage
            alt="Candidate practicing a voice-based AI mock interview"
            className="w-[min(68vw,260px)] sm:w-[min(60vw,300px)]"
            priority
          />
        </div>

        <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-4 text-center sm:space-y-5 md:space-y-6 lg:max-w-xl lg:text-left">
            <div className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
              <span>AI Voice Interview Practice</span>
            </div>

            <h1 className="mb-4 text-[1.22rem] font-bold leading-tight tracking-tight text-slate-900 sm:mb-6 sm:text-[1.46rem] md:text-[1.625rem] lg:text-[2.15rem] xl:text-[2.28rem]">
              <span className="block">Practice real interviews with your</span>
              <span className="block">
                <span className="text-primary">AI Interview Coach</span>
              </span>
            </h1>

            <p className="mx-auto max-w-xl px-2 text-base leading-relaxed text-gray-600 sm:px-0 sm:text-lg lg:text-xl">
              Run realistic, voice-based mock interviews with company-specific
              questions, instant AI feedback, and a detailed scorecard—so
              nothing surprises you on interview day.
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
                <Link href="/dashboard/interviews/new">
                  Start Interview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-sm font-medium text-gray-500 lg:justify-start">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Instant AI feedback</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 sm:h-4 sm:w-4"
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-gray-600 sm:text-sm">
                  4.9/5 candidate rating
                </span>
              </div>
            </div>
          </div>

          <div className="hidden justify-center py-2 lg:flex lg:justify-end lg:py-3 xl:py-4">
            <CircleHeroImage
              alt="Candidate practicing a voice-based AI mock interview"
              className="w-[min(34vw,380px)] xl:w-[min(32vw,400px)]"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
