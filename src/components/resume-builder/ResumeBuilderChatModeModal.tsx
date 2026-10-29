"use client";

import { ArrowRight } from "lucide-react";
import { Emblem, Mono, type EmblemKind } from "@/components/marketing-2026/primitives";
import { useDashboardTheme } from "@/components/dashboard-theme";
import { dash2026Scope } from "@/components/dashboard-2026/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ResumeChatSubMode = "text" | "voice";

interface ResumeBuilderChatModeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mode: ResumeChatSubMode) => void;
}

export function ResumeBuilderChatModeModal({
  open,
  onOpenChange,
  onSelect,
}: Readonly<ResumeBuilderChatModeModalProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dash2026Scope, "rounded-[22px] border border-border bg-card p-6 sm:max-w-xl sm:p-7")}>
        <DialogHeader>
          <Mono className="text-[11px] text-primary">— BUILD IT WITH AI —</Mono>
          <DialogTitle className="pt-1 text-[24px] font-extrabold tracking-[-0.03em] text-foreground">
            How would you like to chat?
          </DialogTitle>
          <DialogDescription className="pt-1 text-left text-muted-foreground">
            Answer a few questions and our AI will build your resume. Type your
            answers, or have a natural voice conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <ModeCard
            emblem="code"
            title="Type in chat"
            description="Answer questions by typing. Great for quiet spaces."
            onClick={() => onSelect("text")}
          />
          <ModeCard
            emblem="voice"
            title="Talk with voice AI"
            description="Speak naturally with Ava, your AI resume coach."
            badge="New"
            onClick={() => onSelect("voice")}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModeCard({
  emblem,
  title,
  description,
  badge,
  onClick,
}: Readonly<{
  emblem: EmblemKind;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
}>) {
  const { theme } = useDashboardTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-4 rounded-[18px] border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_24px_50px_-30px_rgba(115,103,240,.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="flex w-full items-start justify-between">
        <Emblem kind={emblem} tone={theme === "dark" ? "dark" : "light"} />
        {badge ? <Mono className="rounded-md bg-primary/10 px-2 py-1 text-[10px] text-primary">{badge.toUpperCase()}</Mono> : null}
      </div>
      <div>
        <p className="text-[16px] font-bold tracking-tight text-foreground">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary">Choose <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
    </button>
  );
}
