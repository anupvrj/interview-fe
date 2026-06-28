"use client";

import Link from "next/link";
import { Briefcase, Building2, ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import type { PeerBookingInterviewerPreview } from "@/lib/api";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function PeerBookingInterviewerCard({
  interviewerId,
  interviewer,
}: {
  interviewerId: string;
  interviewer: PeerBookingInterviewerPreview;
}) {
  const rating =
    typeof interviewer.ratingAvg === "number" && interviewer.ratingAvg > 0
      ? interviewer.ratingAvg.toFixed(1)
      : null;
  const ratingCount = interviewer.ratingCount ?? 0;

  return (
    <div className={cn(appCard, "p-6")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          {interviewer.profilePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={interviewer.profilePictureUrl}
              alt=""
              className="h-16 w-16 shrink-0 rounded-xl object-cover ring-2 ring-[#7367F0]/15"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#7367F0]/10 text-lg font-semibold text-[#7367F0]">
              {initials(interviewer.name)}
            </div>
          )}

          <div className="min-w-0 space-y-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Interviewer
              </p>
              <h2 className="text-lg font-semibold text-foreground">{interviewer.name}</h2>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4 shrink-0 text-[#7367F0]/70" />
                {interviewer.company}
              </span>
              {interviewer.jobRole ? (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 shrink-0 text-[#7367F0]/70" />
                  {interviewer.jobRole}
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {rating ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50/80 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {rating}
                  {ratingCount > 0 ? (
                    <span className="font-normal text-muted-foreground">({ratingCount})</span>
                  ) : null}
                </span>
              ) : null}
              {typeof interviewer.yearsOfExperience === "number" ? (
                <span className="inline-flex rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {interviewer.yearsOfExperience}+ yrs experience
                </span>
              ) : null}
              {interviewer.industry ? (
                <span className="inline-flex rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {interviewer.industry}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full shrink-0 sm:w-auto sm:self-center"
        >
          <Link href={`/dashboard/peer-interviews/interviewer/${interviewerId}`}>
            View profile
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
