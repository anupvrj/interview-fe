"use client";

import { ArrowRight, Linkedin } from "lucide-react";
import { Emblem, Mono, type EmblemKind } from "@/components/marketing-2026/primitives";
import { useDashboardTheme } from "@/components/dashboard-theme";
import { resumeBuilderLinkedInIconShell, resumeBuilderMethodCard } from "./resumeBuilderStyles";
import { cn } from "@/lib/utils";

export type ResumeImportSource = "chat" | "linkedin" | "pdf";

interface ResumeBuilderImportChoiceCardsProps {
  onSelectChat: () => void;
  onSelectLinkedIn: () => void;
  onSelectPdf: () => void;
  selectedSource?: ResumeImportSource | null;
}

type Choice = {
  id: ResumeImportSource;
  tag: string;
  title: string;
  description: string;
  cta: string;
  emblem?: EmblemKind;
  onClick: () => void;
};

export function ResumeBuilderImportChoiceCards({
  onSelectChat,
  onSelectLinkedIn,
  onSelectPdf,
  selectedSource = null,
}: ResumeBuilderImportChoiceCardsProps) {
  const { theme } = useDashboardTheme();
  const choices: Choice[] = [
    {
      id: "pdf",
      tag: "PDF",
      title: "Upload an old resume",
      description: "Drop in a PDF. We pull out every section and lay it into the template you picked.",
      cta: "Choose a PDF",
      emblem: "resume",
      onClick: onSelectPdf,
    },
    {
      id: "linkedin",
      tag: "PUBLIC PROFILE",
      title: "Import from LinkedIn",
      description: "Paste your profile link. Experience, education, skills and photo come across, polished for ATS.",
      cta: "Connect LinkedIn",
      onClick: onSelectLinkedIn,
    },
    {
      id: "chat",
      tag: "TYPE OR TALK",
      title: "Build it with AI",
      description: "Answer a few questions by chat or voice, or paste your whole profile in one go.",
      cta: "Start the chat",
      emblem: "voice",
      onClick: onSelectChat,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {choices.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={c.onClick}
          className={cn(resumeBuilderMethodCard, "text-left", selectedSource === c.id && "border-primary shadow-[0_0_0_4px_rgba(115,103,240,0.14)]")}
        >
          <div className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              {c.emblem ? (
                <Emblem kind={c.emblem} tone={theme === "dark" ? "dark" : "light"} />
              ) : (
                <span className={resumeBuilderLinkedInIconShell}><Linkedin className="h-6 w-6" /></span>
              )}
              <Mono className="rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">{c.tag}</Mono>
            </div>
            <h3 className="mt-5 text-[18px] font-bold tracking-tight text-foreground">{c.title}</h3>
            <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-muted-foreground">{c.description}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary">
              {c.cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
