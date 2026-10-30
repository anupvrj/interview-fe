import Link from "next/link";
import { ArrowRight, Briefcase, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PeerInterviewerCard } from "@/lib/api";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function InterviewerCard({
  interviewer,
  typeNames,
}: {
  interviewer: PeerInterviewerCard;
  typeNames: Record<string, string>;
}) {
  const roundTypes = interviewer.canTakeTypes ?? [];
  const prices = Object.values(interviewer.pricing || {}).filter((n) => n > 0);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const ratingCount = interviewer.ratingCount ?? 0;
  const ratingAvg = interviewer.ratingAvg ?? 0;

  return (
    <div className="group flex min-w-0 flex-col rounded-[18px] border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_24px_50px_-30px_rgba(115,103,240,.6)]">
      <div className="flex gap-3.5">
        {interviewer.profilePictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={interviewer.profilePictureUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-border"
          />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-gradient-to-br from-[#F1EEFF] to-[#E3EEFF] text-[16px] font-bold text-primary dark:from-primary/20 dark:to-sky-500/10">
            {initials(interviewer.name)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 truncate text-[16px] font-bold tracking-tight text-foreground">{interviewer.name}</p>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 font-[family-name:var(--font-geist-mono)] text-[11px] text-amber-700 dark:text-amber-300">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              {ratingCount > 0 ? `${ratingAvg.toFixed(1)} (${ratingCount})` : "NEW"}
            </span>
          </div>
          <p className="truncate text-[13.5px] text-foreground/80">{interviewer.jobRole}</p>
          <p className="mt-1 flex items-start gap-1.5 text-[12.5px] leading-snug text-muted-foreground">
            <Briefcase className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span className="min-w-0 break-words">
              {interviewer.company}
              {interviewer.industry ? ` · ${interviewer.industry}` : ""}
            </span>
          </p>
        </div>
      </div>

      {roundTypes.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {roundTypes.slice(0, 4).map((t) => (
            <span key={t} className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11.5px] font-medium text-muted-foreground">
              {typeNames[t] || t}
            </span>
          ))}
          {roundTypes.length > 4 ? (
            <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11.5px] font-medium text-muted-foreground">
              +{roundTypes.length - 4}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4 [margin-top:max(1rem,auto)]">
        <div>
          <p className="font-[family-name:var(--font-geist-mono)] text-[10.5px] text-muted-foreground">FROM · {interviewer.yearsOfExperience}+ YRS EXP</p>
          <p className="text-[18px] font-extrabold tracking-tight text-foreground">{minPrice != null ? `₹${minPrice.toLocaleString("en-IN")}` : "—"}</p>
        </div>
        <Button asChild className="h-10 rounded-xl px-4 text-[13.5px] font-semibold shadow-[0_10px_24px_-12px_rgba(115,103,240,.8)] hover:bg-primary/90">
          <Link href={`/dashboard/peer-interviews/interviewer/${interviewer.id}`}>
            Book a slot
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
