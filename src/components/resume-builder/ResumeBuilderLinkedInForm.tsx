"use client";

import type { ReactNode } from "react";
import { Linkedin } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  resumeBuilderHeroCard,
  resumeBuilderInfoBanner,
  resumeBuilderLinkedInIconShell,
} from "./resumeBuilderStyles";
import { cn } from "@/lib/utils";

interface ResumeBuilderLinkedInFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  id?: string;
  className?: string;
  footer?: ReactNode;
}

export function ResumeBuilderLinkedInForm({
  value,
  onChange,
  onSubmit,
  id = "linkedin-handle",
  className,
  footer,
}: ResumeBuilderLinkedInFormProps) {
  return (
    <div className={cn("space-y-5", className)}>
      <div className={resumeBuilderInfoBanner}>
        <div className="flex items-start gap-4">
          <div className={resumeBuilderLinkedInIconShell}>
            <Linkedin className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-foreground">
              Import your LinkedIn profile
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Paste your public LinkedIn URL or username. We&apos;ll fetch
              experience, education, skills, and your profile photo, then enhance
              everything for ATS.
            </p>
          </div>
        </div>
      </div>

      <div className={cn(resumeBuilderHeroCard, "p-5 sm:p-6")}>
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-medium text-foreground"
        >
          LinkedIn profile URL or username
        </label>
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://www.linkedin.com/in/your-username  or  your-username"
          className="h-11 border-border/80 bg-background/80"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) {
              onSubmit?.();
            }
          }}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Example: https://www.linkedin.com/in/john-doe or john-doe
        </p>
      </div>

      {footer}
    </div>
  );
}
