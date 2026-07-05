import Link from "next/link";
import { Briefcase, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { appCard } from "@/lib/app-theme";
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
    <div className={cn(appCard, "flex min-w-0 flex-col p-4 sm:p-5")}>
      <div className="flex gap-3">
        {interviewer.profilePictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={interviewer.profilePictureUrl}
            alt=""
            className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-primary/15 sm:h-12 sm:w-12"
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7367F0]/10 text-sm font-semibold text-[#7367F0] sm:h-12 sm:w-12">
            {initials(interviewer.name)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-foreground">{interviewer.name}</p>
              <p className="truncate text-sm text-muted-foreground">{interviewer.jobRole}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              {ratingCount > 0 ? ratingAvg.toFixed(1) : "New"}
            </span>
          </div>

          <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-snug text-muted-foreground">
            <Briefcase className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span className="min-w-0 break-words">
              {interviewer.company}
              {interviewer.industry ? ` · ${interviewer.industry}` : ""}
            </span>
          </p>
        </div>
      </div>

      {roundTypes.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {roundTypes.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {typeNames[t] || t}
            </span>
          ))}
          {roundTypes.length > 4 ? (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              +{roundTypes.length - 4}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <div className="text-sm">
          <span className="text-muted-foreground">From </span>
          <span className="font-semibold text-foreground">
            {minPrice != null ? `₹${minPrice}` : "—"}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            · {interviewer.yearsOfExperience}+ yrs
          </span>
        </div>
        <Link
          href={`/dashboard/peer-interviews/interviewer/${interviewer.id}`}
          className="w-full sm:w-auto"
        >
          <Button
            size="sm"
            className="h-9 w-full bg-[#7367F0] text-white hover:bg-[#6e62e5] sm:w-auto"
          >
            Book a slot
          </Button>
        </Link>
      </div>
    </div>
  );
}
