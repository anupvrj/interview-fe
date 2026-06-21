"use client";

import { Shield, Zap, Target, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TRUST_BADGES = [
  { icon: Zap, label: "27 automated checks" },
  { icon: Shield, label: "Free for members" },
  { icon: Target, label: "Job tailoring optional" },
];

const HIGHLIGHTS = [
  "ATS parse rate & file compatibility",
  "HR red flags & seniority fit",
  "Copy-ready bullet rewrites",
];

interface ATSHeroContentProps {
  children: React.ReactNode;
}

export function ATSHeroContent({ children }: ATSHeroContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Resume Checker
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl font-bold text-foreground leading-tight mb-4">
          Is your resume{" "}
          <span className="text-primary">good enough?</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
          Upload your PDF for an instant Smart ATS Score — content quality, parse
          rate, recruiter red flags, and optional job-description tailoring in
          one report.
        </p>
      </div>

      <ul className="space-y-2.5">
        {HIGHLIGHTS.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm text-foreground/90">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            {item}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        {TRUST_BADGES.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-border/80",
              "bg-card/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-muted-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5 text-primary" />
            {label}
          </span>
        ))}
      </div>

      {children}
    </div>
  );
}
