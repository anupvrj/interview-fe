"use client";

import type { ReactNode } from "react";
import { Check, Linkedin } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  resumeBuilderHeroCard,
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
      <div className={cn(resumeBuilderHeroCard, "p-6 sm:p-8")}>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_0%_0%,rgba(10,102,194,.08),transparent_70%)]" />
        <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className={resumeBuilderLinkedInIconShell}><Linkedin className="h-6 w-6" /></span>
              <div>
                <h3 className="text-[18px] font-bold tracking-tight text-foreground">Your LinkedIn profile</h3>
                <p className="text-[13px] text-muted-foreground">Public profile link or just the username</p>
              </div>
            </div>
            <label htmlFor={id} className="sr-only">LinkedIn profile URL or username</label>
            <div className="mt-5 flex h-12 items-center overflow-hidden rounded-xl border border-border bg-background focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
              <span className="hidden h-full items-center border-r border-border bg-muted/50 px-3 font-[family-name:var(--font-geist-mono)] text-[12.5px] text-muted-foreground sm:flex">linkedin.com/in/</span>
              <Input
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="your-username or the full profile URL"
                className="h-full flex-1 !rounded-none !border-0 !bg-transparent text-[15px] !shadow-none !outline-none !ring-0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && value.trim()) {
                    onSubmit?.();
                  }
                }}
              />
            </div>
            <p className="mt-2 text-[12.5px] text-muted-foreground">Example: https://www.linkedin.com/in/john-doe or john-doe</p>
          </div>
          <ul className="space-y-2.5 rounded-2xl border border-border bg-background/60 p-4 text-[13px] text-muted-foreground">
            {["Experience and education", "Skills and certifications", "Your profile photo", "Rewritten for ATS"].map((t) => (
              <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-500" />{t}</li>
            ))}
          </ul>
        </div>
      </div>

      {footer}
    </div>
  );
}
