"use client";

// Hero photo: /public/marketing/ix-talent-image-person-2 (transparent cutout; avoid next/image optimize — flattens alpha to black)

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Check,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { appPrimaryButton } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

type RecruiterLandingHeroProps = {
  onBecomeRecruiter: () => void;
};

export function RecruiterLandingHero({
  onBecomeRecruiter,
}: Readonly<RecruiterLandingHeroProps>) {
  return (
    <section
      className={cn(
        "relative min-h-0 overflow-hidden border-b border-[#7a6cea]/10 bg-gradient-to-br from-[#7a6cea]/20 via-[#9d8ff5]/12 to-[#c4bdf7]/25 px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-24 md:pt-28 lg:min-h-[540px] lg:pl-8 lg:pr-0 lg:pb-0 lg:pt-28 xl:min-h-[620px] xl:pt-32",
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
              <Briefcase className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
            ) : i % 3 === 1 ? (
              <Sparkles className="h-9 w-9 text-primary sm:h-12 sm:w-12" />
            ) : (
              <Users className="h-8 w-8 text-primary sm:h-11 sm:w-11" />
            )}
          </div>
        ))}
      </div>

      <div className="container relative z-10 mx-auto max-w-7xl">
        <div className="mb-8 flex justify-center sm:mb-10 lg:hidden">
          <Image
            src="/marketing/ix-talent-image-person-2.png"
            alt="Professional reviewing candidates on a laptop in a modern office"
            width={1400}
            height={1068}
            unoptimized
            className="h-auto max-h-[210px] w-auto object-contain mix-blend-screen sm:max-h-[252px]"
            priority
          />
        </div>

        <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-4 text-center sm:space-y-5 md:space-y-6 lg:max-w-xl lg:pb-24 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Hire iX Talent</span>
            </div>

            <h1 className="mb-4 text-[1.22rem] font-bold leading-tight tracking-tight text-slate-900 sm:mb-6 sm:text-[1.46rem] md:text-[1.625rem] lg:text-[2.15rem] xl:text-[2.28rem]">
              <span className="block">Hire interview-ready talent with</span>
              <span className="block">
                verified <span className="text-primary">iX Scores</span>
              </span>
            </h1>

            <p className="mx-auto max-w-xl px-2 text-base leading-relaxed text-gray-600 sm:px-0 sm:text-lg lg:text-xl">
              Search verified candidates across industries, review full iX
              Reports and interview video, and shortlist with confidence—not
              guesswork.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 px-2 pt-2 sm:flex-row sm:gap-4 sm:px-0 lg:justify-start">
              <Button
                type="button"
                size="lg"
                onClick={onBecomeRecruiter}
                className={cn(
                  appPrimaryButton,
                  "h-auto w-full px-5 py-4 text-sm font-semibold shadow-lg transition-all hover:shadow-xl sm:w-auto sm:px-6 sm:py-5 sm:text-base",
                )}
              >
                Become Recruiter
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-auto w-full border-border px-5 py-4 text-sm font-semibold sm:w-auto sm:px-6 sm:py-5 sm:text-base"
              >
                <Link
                  href={`/sign-in?redirect_url=${encodeURIComponent("/dashboard/ix-recruiter")}`}
                >
                  Browse iX Talent
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-sm font-medium text-gray-500 lg:justify-start">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Verified iX Scores</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Full reports &amp; video</span>
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
                  Trusted by hiring teams
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 right-0 z-[1] hidden w-[min(48vw,686px)] lg:block">
        <Image
          src="/marketing/ix-talent-image-person-2.png"
          alt=""
          aria-hidden
          width={1400}
          height={1068}
          unoptimized
          className="h-auto w-full object-contain object-bottom object-right mix-blend-screen"
          priority
        />
      </div>
    </section>
  );
}
