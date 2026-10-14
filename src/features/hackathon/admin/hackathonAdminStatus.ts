import type { AdminHackathonOverview, HackathonPhase } from "../api";

export type AdminStatusValue = "draft" | HackathonPhase;

export const STATUS_OPTIONS: ReadonlyArray<{ value: AdminStatusValue; label: string }> = [
  { value: "draft", label: "Draft (hidden)" },
  { value: "upcoming", label: "Not started" },
  { value: "live", label: "On-going" },
  { value: "ended", label: "Completed" },
];

const PHASE_OPTIONS = STATUS_OPTIONS.filter((item) => item.value !== "draft");

export function adminStatusValue(hackathon: Pick<AdminHackathonOverview, "visibility" | "phase">): AdminStatusValue {
  return hackathon.visibility === "draft" ? "draft" : hackathon.phase;
}

export function phaseStatusLabel(phase: HackathonPhase): string {
  return PHASE_OPTIONS.find((item) => item.value === phase)?.label ?? "Not started";
}

export function adminStatusLabel(value: AdminStatusValue): string {
  return STATUS_OPTIONS.find((item) => item.value === value)?.label ?? "Not started";
}

export function canPickDraft(hackathon: Pick<AdminHackathonOverview, "visibility" | "phase" | "participantCount">): boolean {
  return hackathon.visibility === "draft" || (hackathon.phase === "upcoming" && hackathon.participantCount === 0);
}

export function isStatusOptionDisabled(
  value: AdminStatusValue,
  hackathon: Pick<AdminHackathonOverview, "visibility" | "phase" | "participantCount">,
): boolean {
  if (value === "draft") return !canPickDraft(hackathon);
  if (hackathon.visibility === "draft" && value !== "upcoming") return true;
  return false;
}
