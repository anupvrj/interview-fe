import type { AdminHackathonOverview, AdminParticipantRow, HackathonChallengeKind } from "../api";
import { resolveChallengeId, resolveChallengeKind } from "./challengeMeta";

const INTERVIEW_KINDS: HackathonChallengeKind[] = ["screening", "coding", "system_design"];

export type SubmissionTableColumn =
  | { kind: "resume"; challengeId: string; label: string }
  | { kind: "interview_slot"; challengeId: string; slot: number; label: string; shortLabel: string }
  | { kind: "social"; challengeId: string; label: string };

export function buildSubmissionTableColumns(hackathon: AdminHackathonOverview | undefined): SubmissionTableColumn[] {
  if (!hackathon?.challenges?.length) {
    return [
      { kind: "resume", challengeId: "", label: "ATS score" },
      { kind: "interview_slot", challengeId: "", slot: 1, label: "Interview 1", shortLabel: "IV1" },
      { kind: "interview_slot", challengeId: "", slot: 2, label: "Interview 2", shortLabel: "IV2" },
      { kind: "social", challengeId: "", label: "Social" },
    ];
  }

  const cols: SubmissionTableColumn[] = [];
  for (const c of hackathon.challenges) {
    const kind = resolveChallengeKind(c);
    const challengeId = resolveChallengeId(c);
    if (!kind || !challengeId) continue;
    if (kind === "resume") {
      cols.push({ kind: "resume", challengeId, label: c.title || "Resume" });
    } else if (INTERVIEW_KINDS.includes(kind)) {
      const count = c.config?.requiredCount ?? hackathon.interviewConfig.requiredCount ?? 1;
      for (let slot = 1; slot <= count; slot += 1) {
        const shortLabel = count > 1 ? `${c.title.slice(0, 8)}·${slot}` : c.title.slice(0, 12);
        cols.push({
          kind: "interview_slot",
          challengeId,
          slot,
          label: count > 1 ? `${c.title} · Slot ${slot}` : c.title,
          shortLabel,
        });
      }
    } else if (kind === "social") {
      cols.push({ kind: "social", challengeId, label: c.title || "Social" });
    }
  }
  return cols;
}

export function cellForColumn(
  row: AdminParticipantRow,
  col: SubmissionTableColumn,
): { score: number | null; hasRecording: boolean | null } {
  const summary = row.summary;
  if (col.kind === "resume") {
    return { score: summary?.resumeAtsScore ?? null, hasRecording: null };
  }
  if (col.kind === "social") {
    return { score: null, hasRecording: null };
  }
  const slotData = summary?.interviewSlots?.find((s) => s.challengeId === col.challengeId && s.slot === col.slot);
  if (slotData) {
    return { score: slotData.score, hasRecording: slotData.hasRecording };
  }
  if (!col.challengeId) {
    const legacy = col.slot === 1 ? summary?.interview1Score : summary?.interview2Score;
    return { score: legacy ?? null, hasRecording: null };
  }
  return { score: null, hasRecording: null };
}
