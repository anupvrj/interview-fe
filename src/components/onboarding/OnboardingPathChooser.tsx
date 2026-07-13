"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import { ROLE_META } from "@/lib/roles";
import { appCardElevated } from "@/lib/app-theme";
import { OnboardingPathHeroGraphic } from "@/components/onboarding/OnboardingAnimatedGraphics";
import { cn } from "@/lib/utils";

const ONBOARDING_PATHS = ["candidate", "interviewer", "recruiter"] as const;
export type OnboardingPath = (typeof ONBOARDING_PATHS)[number];

const PATH_DESCRIPTIONS: Record<OnboardingPath, string> = {
  candidate:
    "Practice interviews, build your resume, and book peer mock sessions.",
  interviewer:
    "Apply to become a verified peer interviewer and earn from mock interviews.",
  recruiter:
    "Discover verified iX Talent, review iX Reports and hire top candidates.",
};

type OnboardingPathChooserProps = {
  displayName?: string;
  onChoose: (path: OnboardingPath) => void;
};

export function OnboardingPathChooser({
  displayName = "there",
  onChoose,
}: Readonly<OnboardingPathChooserProps>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 sm:px-6">
      <div className="mb-10 flex w-full max-w-4xl flex-col items-center text-center">
        <InterviewTrixLogo
          variant="onLightBg"
          className="mb-6 h-8 w-auto dark:hidden"
        />
        <InterviewTrixLogo
          variant="white"
          className="mb-6 hidden h-8 w-auto dark:block"
        />
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7367F0]">
          Welcome to InterviewTrix
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Hi, {displayName}
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
          How would you like to use InterviewTrix? Choose one to get started —
          you can always explore the other side later.
        </p>
      </div>

      <OnboardingPathHeroGraphic />

      <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {ONBOARDING_PATHS.map((path) => {
          const meta = ROLE_META[path];
          const Icon = meta.icon;
          const isCandidate = path === "candidate";
          return (
            <button
              key={path}
              type="button"
              onClick={() => onChoose(path)}
              className={cn(
                appCardElevated,
                "group relative flex flex-col items-start gap-4 overflow-hidden p-5 text-left transition-all",
                "hover:-translate-y-0.5 hover:border-[#7367F0]/35 hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7367F0] focus-visible:ring-offset-2",
                isCandidate && "border-[#7367F0]/25 bg-gradient-to-br from-[#7367F0]/[0.06] via-card to-card",
              )}
            >
              {isCandidate ? (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#7367F0]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7367F0]">
                  <Sparkles className="h-3 w-3" />
                  Popular
                </span>
              ) : null}
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#7367F0]/10 text-[#7367F0]">
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-base font-semibold text-foreground">
                    {meta.label}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[#7367F0]" />
                </span>
                <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                  {PATH_DESCRIPTIONS[path]}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
