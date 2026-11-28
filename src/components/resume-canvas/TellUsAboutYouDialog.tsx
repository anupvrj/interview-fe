"use client";

import { useState } from "react";
import { ClipboardPaste, Loader2, MessageSquareText, Mic } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ResumeBuilderChatPanel } from "@/components/resume-builder/ResumeBuilderChatPanel";
import { ResumeBuilderVoicePanel } from "@/components/resume-builder/ResumeBuilderVoicePanel";
import type { AiBuildMeta, ChatCollectedProfile, Resume } from "@/lib/api";
import { buildResumeWithMeta, LIVE_BUILD_STEPS, liveBuildStepIndex, mapExtractedSectionsToContent } from "@/lib/resume-data-import";
import { cn } from "@/lib/utils";

type Mode = "choose" | "chat" | "voice" | "paste" | "building";

/**
 * When "Improve with AI" has almost nothing real to work from (sample text, a near-empty resume),
 * ask the person instead of polishing placeholders: a few questions one at a time, a short voice
 * chat, or pasting what they already have. The answers are written up with Resume Writer v2 and
 * replace the content of this resume (its design stays).
 */
export function TellUsAboutYouDialog({
  open,
  onOpenChange,
  templateId,
  reason,
  onBuilt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  /** Why we're asking (shown under the title). */
  reason?: string;
  onBuilt: (content: Resume["content"], meta: AiBuildMeta | null) => void | Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>("choose");
  const [pasted, setPasted] = useState("");
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setMode("choose");
    setStep(null);
    setError(null);
  };

  const build = async (payload: { source: "chat"; chatProfile: ChatCollectedProfile } | { source: "pdf"; resumeText: string }) => {
    setMode("building");
    setError(null);
    try {
      const { sections, writerMeta } = await buildResumeWithMeta({ ...payload, templateId }, (s) => setStep(s));
      const content = mapExtractedSectionsToContent(sections) as unknown as Resume["content"];
      await onBuilt(content, writerMeta);
      onOpenChange(false);
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't write your resume. Please try again.");
      setMode("choose");
    }
  };

  const current = step ? liveBuildStepIndex(step) : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (mode === "building") return;
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className={cn("max-h-[92vh] overflow-y-auto", mode === "chat" || mode === "voice" ? "max-w-2xl" : "max-w-lg")} data-testid="tell-us-about-you">
        <DialogHeader>
          <DialogTitle>Tell us about your work</DialogTitle>
          <DialogDescription>
            {reason ?? "Your resume doesn't have much real content yet, so there's little for AI to improve."} Give us the facts in the way that suits you — AI
            writes it up, and never invents anything.
          </DialogDescription>
        </DialogHeader>

        {mode === "choose" ? (
          <div className="grid gap-2.5 pt-1">
            {[
              { m: "chat" as const, icon: MessageSquareText, title: "Answer a few questions", body: "One question at a time, about 2 minutes. Short answers are fine." },
              { m: "voice" as const, icon: Mic, title: "Just talk", body: "A short voice chat — say what you did, in your own words." },
              { m: "paste" as const, icon: ClipboardPaste, title: "Paste what you have", body: "An old resume, your LinkedIn About and Experience, or notes." },
            ].map(({ m, icon: Icon, title, body }) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-primary/60 hover:bg-primary/[0.03]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{title}</span>
                  <span className="block text-xs text-muted-foreground">{body}</span>
                </span>
              </button>
            ))}
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
        ) : null}

        {mode === "chat" ? (
          <ResumeBuilderChatPanel templateId={templateId} onReady={(profile) => void build({ source: "chat", chatProfile: profile })} onBack={reset} />
        ) : null}
        {mode === "voice" ? (
          <ResumeBuilderVoicePanel templateId={templateId} onReady={(profile) => void build({ source: "chat", chatProfile: profile })} onBack={reset} />
        ) : null}

        {mode === "paste" ? (
          <div className="space-y-3 pt-1">
            <textarea
              aria-label="Your details"
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={10}
              placeholder="Paste an old resume, your LinkedIn Experience section, or notes about your jobs, projects and education…"
              className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
            />
            <div className="flex justify-between gap-2">
              <Button variant="ghost" onClick={reset}>
                Back
              </Button>
              <Button disabled={pasted.trim().length < 80} onClick={() => void build({ source: "pdf", resumeText: pasted.trim() })}>
                Write my resume
              </Button>
            </div>
            {pasted.trim().length > 0 && pasted.trim().length < 80 ? <p className="text-xs text-muted-foreground">A little more, please — a few lines about each job is enough.</p> : null}
          </div>
        ) : null}

        {mode === "building" ? (
          <ol className="space-y-2 py-2" aria-live="polite">
            {LIVE_BUILD_STEPS.filter((s) => s.step !== "reading").map((s) => {
              const i = liveBuildStepIndex(s.step);
              const state = i < current ? "done" : i === current ? "now" : "next";
              return (
                <li key={s.step} className={cn("flex items-center gap-2 text-sm", state === "next" ? "text-muted-foreground/60" : "text-foreground")}>
                  {state === "now" ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <span className={cn("h-2 w-2 rounded-full", state === "done" ? "bg-emerald-500" : "bg-muted-foreground/30")} />}
                  {s.label.replace("opening your resume", "putting it on your page")}
                </li>
              );
            })}
          </ol>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
