"use client";

import { Briefcase, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PeerBookingCardShell } from "@/components/peer/PeerBookingCardShell";
import type { PeerBookingCandidatePreview } from "@/lib/api";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function PeerBookingCandidateCard({
  candidate,
}: {
  candidate: PeerBookingCandidatePreview;
}) {
  return (
    <PeerBookingCardShell
      title="Candidate"
      action={
        candidate.resume ? (
          <Button asChild variant="outline" size="sm" className="h-8 shrink-0 text-xs">
            <a href={candidate.resume.url} target="_blank" rel="noreferrer">
              Resume
              <Download className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        ) : undefined
      }
    >
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7367F0]/20 to-[#7367F0]/5 text-base font-bold text-[#7367F0] ring-2 ring-[#7367F0]/10">
          {initials(candidate.name)}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="truncate text-base font-semibold text-foreground">{candidate.name}</h2>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {candidate.email ? (
              <span className="inline-flex max-w-full items-center gap-1 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0 text-[#7367F0]/70" />
                <span className="truncate">{candidate.email}</span>
              </span>
            ) : null}
            {candidate.role ? (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 shrink-0 text-[#7367F0]/70" />
                {candidate.role}
              </span>
            ) : null}
          </div>

          {typeof candidate.experienceYears === "number" ? (
            <span className="inline-flex rounded-full bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {candidate.experienceYears} yr{candidate.experienceYears === 1 ? "" : "s"} exp
            </span>
          ) : null}
        </div>
      </div>
    </PeerBookingCardShell>
  );
}
