"use client";

import { ArrowRight } from "lucide-react";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import { ROLE_META } from "@/lib/roles";
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <InterviewTrixLogo
          variant="onLightBg"
          className="mb-6 h-8 w-auto dark:hidden"
        />
        <InterviewTrixLogo
          variant="white"
          className="mb-6 hidden h-8 w-auto dark:block"
        />
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Welcome, {displayName}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          How would you like to use InterviewTrix? Choose one to get started —
          you can always explore the other side later.
        </p>
      </div>

      <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {ONBOARDING_PATHS.map((path) => {
          const meta = ROLE_META[path];
          const Icon = meta.icon;
          return (
            <button
              key={path}
              type="button"
              onClick={() => onChoose(path)}
              className={cn(
                "group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all",
                "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              )}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#7367F0]/10 text-[#7367F0]">
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-base font-semibold text-foreground">
                    {meta.label}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
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
