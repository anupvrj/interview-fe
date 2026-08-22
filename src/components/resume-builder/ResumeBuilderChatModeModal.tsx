"use client";

import { MessageSquare, Mic } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { appCard } from "@/lib/app-theme";

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
      <DialogContent className={cn(appCard, "sm:max-w-lg border-primary/20")}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            How would you like to chat?
          </DialogTitle>
          <DialogDescription className="pt-1 text-left text-muted-foreground">
            Answer a few questions and our AI will build your resume. Type your
            answers, or have a natural voice conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <ModeCard
            icon={<MessageSquare className="h-5 w-5" />}
            title="Type in chat"
            description="Answer questions by typing. Great for quiet spaces."
            onClick={() => onSelect("text")}
          />
          <ModeCard
            icon={<Mic className="h-5 w-5" />}
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
  icon,
  title,
  description,
  badge,
  onClick,
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-2xl border border-border/80 bg-card p-5 text-left transition-all hover:border-primary/40 hover:bg-primary/[0.04] hover:shadow-[0_8px_24px_rgba(115,103,240,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="flex w-full items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#7367F0] to-[#8b7ff5] text-white shadow-[0_2px_10px_rgba(115,103,240,0.35)]">
          {icon}
        </span>
        {badge ? (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {badge}
          </span>
        ) : null}
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
