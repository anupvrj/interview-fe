import { Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const CONCIERGE_EMAIL = "info@interviewtrix.com";

const COPY = {
  peer: {
    title: "Interviewers from top companies are joining soon",
    body: "We're onboarding verified interviewers from leading companies and will list them here shortly. Need a peer interview now? Email us your role, interview round and preferred dates, and we'll arrange an interviewer for you.",
    subject: "Peer interview request",
  },
  talent: {
    title: "Verified iX Talent profiles are on the way",
    body: "We're onboarding interview-ready candidates and will list them here shortly. Hiring now? Email us the role, key skills and location, and we'll share matching candidates with you.",
    subject: "iX Talent hiring requirement",
  },
} as const;

/**
 * Shown while a marketplace is still being stocked: what's coming, and how to get help by email meanwhile.
 * `centered` is the page's empty state (a card in the middle); the default is a slim banner.
 */
export function ConciergeNotice({ kind, centered = false, className }: { kind: keyof typeof COPY; centered?: boolean; className?: string }) {
  const c = COPY[kind];
  const href = `mailto:${CONCIERGE_EMAIL}?subject=${encodeURIComponent(c.subject)}`;
  const email = <a href={href} className="font-semibold text-primary hover:underline">{CONCIERGE_EMAIL}</a>;
  if (centered) {
    return (
      <section role="note" className={cn("mx-auto flex w-full max-w-xl flex-col items-center rounded-[22px] border border-border bg-card px-6 py-12 text-center shadow-[0_24px_60px_-44px_rgba(30,20,80,.55)] sm:px-10 sm:py-14", className)}>
        <span className="grid size-14 place-items-center rounded-2xl border border-primary/15 bg-gradient-to-br from-[#F1EEFF] to-[#E3EEFF] text-primary dark:from-primary/20 dark:to-sky-500/10">
          <Sparkles className="size-6" />
        </span>
        <h2 className="mt-5 text-balance text-[20px] font-bold tracking-[-0.02em] text-foreground sm:text-[22px]">{c.title}</h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
          {c.body} Reach us at {email}.
        </p>
        <Button asChild className="mt-6 h-11 rounded-xl px-5 text-[14.5px]">
          <a href={href}><Mail className="size-4" />Email your requirement</a>
        </Button>
      </section>
    );
  }
  return (
    <section
      role="note"
      className={cn(
        "flex flex-col gap-4 rounded-[18px] border border-primary/25 bg-[linear-gradient(135deg,rgba(115,103,240,.08),rgba(31,143,255,.05))] p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6",
        className,
      )}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Sparkles className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-bold tracking-[-0.01em] text-foreground">{c.title}</p>
        <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
          {c.body} Reach us at {email}.
        </p>
      </div>
      <Button asChild className="h-10 shrink-0 rounded-xl px-4 text-[14px]">
        <a href={href}><Mail className="size-4" />Email your requirement</a>
      </Button>
    </section>
  );
}
