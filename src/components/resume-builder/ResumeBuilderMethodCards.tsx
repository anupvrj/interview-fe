"use client";

import { ArrowRight, FileEdit, Linkedin } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import {
  resumeBuilderLinkedInIconShell,
  resumeBuilderMethodCard,
  resumeBuilderMethodCardInner,
  resumeBuilderPrimaryIconShell,
} from "./resumeBuilderStyles";
import { cn } from "@/lib/utils";

interface ResumeBuilderMethodCardsProps {
  onCreateNew: () => void;
  onImportLinkedIn: () => void;
}

export function ResumeBuilderMethodCards({
  onCreateNew,
  onImportLinkedIn,
}: ResumeBuilderMethodCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
      <button
        type="button"
        onClick={onCreateNew}
        className={cn(resumeBuilderMethodCard, "text-left")}
      >
        <CardContent className={resumeBuilderMethodCardInner}>
          <div className={resumeBuilderPrimaryIconShell}>
            <FileEdit className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">
            Create new resume
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
            Pick an ATS-friendly template, optionally upload a PDF, and start
            editing with smart defaults.
          </p>
          <div className="mt-5 inline-flex items-center text-sm font-semibold text-primary">
            Get started
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </button>

      <button
        type="button"
        onClick={onImportLinkedIn}
        className={cn(resumeBuilderMethodCard, "text-left")}
      >
        <CardContent className={resumeBuilderMethodCardInner}>
          <div className={resumeBuilderLinkedInIconShell}>
            <Linkedin className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">
            Import from LinkedIn
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
            Pull your public profile, enhance it with AI, and map it into
            recruiter-ready resume sections.
          </p>
          <div className="mt-5 inline-flex items-center text-sm font-semibold text-primary">
            Connect LinkedIn
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </button>
    </div>
  );
}
