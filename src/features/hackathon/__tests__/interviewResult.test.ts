import { describe, expect, it } from "vitest";
import { pickResultSlot, resultPhaseFor } from "../interviewResult";
import type { InterviewSlotProgress } from "../api";

const slot = (over: Partial<InterviewSlotProgress>): InterviewSlotProgress => ({
  slot: 1,
  state: "available",
  attemptsUsed: 0,
  attemptsMax: 2,
  ...over,
});

describe("result pop-up phase", () => {
  it("analysing while the report is being made (or the interview just ended)", () => {
    expect(resultPhaseFor(slot({ state: "processing" }))).toBe("analysing");
    expect(resultPhaseFor(slot({ state: "in_progress" }))).toBe("analysing");
  });
  it("asks with the reason, never a score", () => {
    expect(resultPhaseFor(slot({ state: "awaiting_decision", decisionReason: "short_interview" }))).toBe("short_interview");
    expect(resultPhaseFor(slot({ state: "awaiting_decision" }))).toBe("low_score");
  });
  it("submitted when the round is done", () => {
    expect(resultPhaseFor(slot({ state: "completed" }))).toBe("submitted");
  });
  it("failed only for our errors; nothing to show otherwise", () => {
    expect(resultPhaseFor(slot({ state: "available", lastFailureReason: "report_failed" }))).toBe("failed");
    expect(resultPhaseFor(slot({ state: "available", lastFailureReason: "abandoned" }))).toBeNull();
    expect(resultPhaseFor(slot({ state: "available" }))).toBeNull();
  });
});

describe("pickResultSlot", () => {
  const slots = [
    slot({ slot: 1, state: "completed", interviewId: "i-old" }),
    slot({ slot: 2, state: "processing", activeInterviewId: "i-new" }),
  ];
  it("finds the round of the interview in the link", () => {
    expect(pickResultSlot(slots, "i-new")?.slot).toBe(2);
    expect(pickResultSlot(slots, "i-old")?.slot).toBe(1);
  });
  it("without a link, picks a round that's busy or waiting", () => {
    expect(pickResultSlot(slots, null)?.slot).toBe(2);
    expect(pickResultSlot([slots[0]], null)).toBeUndefined();
  });
});
