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
  const minPrice = Math.min(...Object.values(interviewer.pricing || {}).filter((n) => n > 0));
  return (
    <div className={cn(appCard, "flex flex-col p-5")}>
      <div className="flex items-start gap-3">
        {interviewer.profilePictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={interviewer.profilePictureUrl}
            alt=""
            className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/15"
          />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#7367F0]/10 text-sm font-semibold text-[#7367F0]">
            {initials(interviewer.name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">{interviewer.name}</p>
          <p className="truncate text-sm text-muted-foreground">{interviewer.jobRole}</p>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Briefcase className="h-3 w-3" /> {interviewer.company}
            {interviewer.industry ? ` · ${interviewer.industry}` : ""}
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
          {interviewer.ratingCount > 0 ? interviewer.ratingAvg.toFixed(1) : "New"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {interviewer.canTakeTypes.slice(0, 4).map((t) => (
          <span
            key={t}
            className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            {typeNames[t] || t}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <div className="text-sm">
          <span className="text-muted-foreground">From </span>
          <span className="font-semibold text-foreground">
            ₹{Number.isFinite(minPrice) ? minPrice : "—"}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            · {interviewer.yearsOfExperience}+ yrs
          </span>
        </div>
        <Link href={`/dashboard/peer-interviews/interviewer/${interviewer.id}`}>
          <Button size="sm" className="bg-[#7367F0] text-white hover:bg-[#6e62e5]">
            Book a slot
          </Button>
        </Link>
      </div>
    </div>
  );
}
