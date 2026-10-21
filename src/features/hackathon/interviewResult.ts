import type { InterviewSlotProgress } from "./api";
import type { InterviewResultPhase } from "./components/InterviewResultModal";

/** Our side failed (report, connection…): the try wasn't used. Mirrors the server's list. */
const INTERNAL_FAILURES = new Set([
  "report_failed",
  "connection_failed",
  "interview_failed",
  "interview_missing",
  "create_failed",
  "create_incomplete",
  "capacity_full",
  "never_started",
]);

/** The round the "?result=<interviewId>" link is about; else one that's busy or waiting. */
export function pickResultSlot(
  slots: InterviewSlotProgress[],
  resultInterviewId: string | null,
): InterviewSlotProgress | undefined {
  if (resultInterviewId) {
    const exact = slots.find((s) => s.activeInterviewId === resultInterviewId || s.interviewId === resultInterviewId);
    if (exact) return exact;
  }
  return slots.find((s) => s.state === "processing" || s.state === "awaiting_decision" || (resultInterviewId && s.state === "in_progress"));
}

/** Which screen of the result pop-up a round is on, or null when there's nothing to show. */
export function resultPhaseFor(slot: InterviewSlotProgress | undefined): InterviewResultPhase | null {
  if (!slot) return null;
  switch (slot.state) {
    case "processing":
    case "in_progress": // just ended; the server hasn't picked it up yet
      return "analysing";
    case "awaiting_decision":
      return slot.decisionReason ?? "low_score";
    case "completed":
      return "submitted";
    default:
      return slot.lastFailureReason && INTERNAL_FAILURES.has(slot.lastFailureReason) ? "failed" : null;
  }
}
