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

/** Shown while a marketplace is still being stocked: what's coming, and how to get help by email meanwhile. */
export function ConciergeNotice({ kind, className }: { kind: keyof typeof COPY; className?: string }) {
  const c = COPY[kind];
  const href = `mailto:${CONCIERGE_EMAIL}?subject=${encodeURIComponent(c.subject)}`;
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
          {c.body} Reach us at{" "}
          <a href={href} className="font-semibold text-primary hover:underline">{CONCIERGE_EMAIL}</a>.
        </p>
      </div>
      <Button asChild className="h-10 shrink-0 rounded-xl px-4 text-[14px]">
        <a href={href}><Mail className="size-4" />Email your requirement</a>
      </Button>
    </section>
  );
}
