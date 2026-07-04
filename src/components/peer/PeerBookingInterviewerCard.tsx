"use client";

import Link from "next/link";
import { Briefcase, Building2, ExternalLink, Star, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PeerBookingCardShell } from "@/components/peer/PeerBookingCardShell";
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
    <PeerBookingCardShell
      title="Your interviewer"
      icon={UserRound}
      action={
        <Button asChild variant="outline" size="sm" className="h-8 shrink-0 text-xs">
          <Link href={`/dashboard/peer-interviews/interviewer/${interviewerId}`}>
            Profile
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      }
    >
      <div className="flex items-start gap-4">
        {interviewer.profilePictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={interviewer.profilePictureUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-2 ring-[#7367F0]/15"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7367F0]/20 to-[#7367F0]/5 text-base font-bold text-[#7367F0] ring-2 ring-[#7367F0]/10">
            {initials(interviewer.name)}
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="truncate text-base font-semibold text-foreground">{interviewer.name}</h2>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-[#7367F0]/70" />
              {interviewer.company}
            </span>
            {interviewer.jobRole ? (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 shrink-0 text-[#7367F0]/70" />
                {interviewer.jobRole}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {rating ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-200">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {rating}
                {ratingCount > 0 ? (
                  <span className="font-normal text-muted-foreground">({ratingCount})</span>
                ) : null}
              </span>
            ) : null}
            {typeof interviewer.yearsOfExperience === "number" ? (
              <span className="inline-flex rounded-full bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {interviewer.yearsOfExperience}+ yrs
              </span>
            ) : null}
            {interviewer.industry ? (
              <span className="inline-flex rounded-full bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {interviewer.industry}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </PeerBookingCardShell>
  );
}
