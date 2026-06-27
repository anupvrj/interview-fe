"use client";

import { ArrowRight, FileText, Linkedin, Upload } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import {
  resumeBuilderLinkedInIconShell,
  resumeBuilderMethodCard,
  resumeBuilderMethodCardInner,
  resumeBuilderPrimaryIconShell,
} from "./resumeBuilderStyles";
import { cn } from "@/lib/utils";

export type ResumeImportSource = "linkedin" | "pdf";

interface ResumeBuilderImportChoiceCardsProps {
  onSelectLinkedIn: () => void;
  onSelectPdf: () => void;
  selectedSource?: ResumeImportSource | null;
}

export function ResumeBuilderImportChoiceCards({
  onSelectLinkedIn,
  onSelectPdf,
  selectedSource = null,
}: ResumeBuilderImportChoiceCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
      <button
        type="button"
        onClick={onSelectLinkedIn}
        className={cn(
          resumeBuilderMethodCard,
          "text-left",
          selectedSource === "linkedin" &&
            "border-[#0A66C2]/40 ring-2 ring-[#0A66C2]/15",
        )}
      >
        <CardContent className={resumeBuilderMethodCardInner}>
          <div className={resumeBuilderLinkedInIconShell}>
            <Linkedin className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">
            Import from LinkedIn
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
            Pull your public profile, enhance it with AI, and map experience,
            education, skills, and your photo into the template.
          </p>
          <div className="mt-5 inline-flex items-center text-sm font-semibold text-primary">
            Connect LinkedIn
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </button>

      <button
        type="button"
        onClick={onSelectPdf}
        className={cn(
          resumeBuilderMethodCard,
          "text-left",
          selectedSource === "pdf" &&
            "border-primary/40 ring-2 ring-primary/15",
        )}
      >
        <CardContent className={resumeBuilderMethodCardInner}>
          <div className={resumeBuilderPrimaryIconShell}>
            <Upload className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">
            Upload resume PDF
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
            Select or drag your existing resume PDF. We&apos;ll extract and map
            sections to your chosen template automatically.
          </p>
          <div className="mt-5 inline-flex items-center text-sm font-semibold text-primary">
            <FileText className="mr-2 h-4 w-4" />
            Select or drag PDF
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </button>
    </div>
  );
}
