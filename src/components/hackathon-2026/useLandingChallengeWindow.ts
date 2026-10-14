"use client";

import { useMemo } from "react";
import { useHackathonPublic } from "@/features/hackathon/hooks";
import { HACKATHON_CHALLENGE } from "@/lib/hackathon-2026-content";
import { formatChallengeWindow, type ChallengeWindow } from "@/lib/hackathon-schedule";

const FALLBACK: ChallengeWindow = formatChallengeWindow(HACKATHON_CHALLENGE.startISO, HACKATHON_CHALLENGE.endISO);

/** Challenge dates from the published hackathon. Falls back to the landing copy until the public record loads. */
export function useLandingChallengeWindow(): ChallengeWindow {
  const { data } = useHackathonPublic();
  const startsAt = data?.startsAt ?? null;
  const endsAt = data?.endsAt ?? null;

  return useMemo(() => {
    if (!startsAt || !endsAt) return FALLBACK;
    return formatChallengeWindow(startsAt, endsAt);
  }, [startsAt, endsAt]);
}
