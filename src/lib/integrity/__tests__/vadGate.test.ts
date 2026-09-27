import { describe, expect, it } from "vitest";
import { shouldFlagTurnLatency } from "../vadGate";

describe("shouldFlagTurnLatency", () => {
  const base = {
    turnIndex: 2,
    micMuted: false,
    bargeIn: false,
    playbackDrained: true,
    turnComplete: true,
    turnLatencyMs: 16_000,
  };

  it("skips warmup turns, muted mic, barge-in, and undrained playback", () => {
    expect(shouldFlagTurnLatency({ ...base, turnIndex: 0 })).toBe(false);
    expect(shouldFlagTurnLatency({ ...base, turnIndex: 1 })).toBe(false);
    expect(shouldFlagTurnLatency({ ...base, micMuted: true })).toBe(false);
    expect(shouldFlagTurnLatency({ ...base, bargeIn: true })).toBe(false);
    expect(shouldFlagTurnLatency({ ...base, playbackDrained: false })).toBe(false);
    expect(shouldFlagTurnLatency({ ...base, turnComplete: false })).toBe(false);
  });

  it("ignores thinking pauses under 15s and flags longer stalls", () => {
    expect(shouldFlagTurnLatency(base)).toBe(true);
    expect(shouldFlagTurnLatency({ ...base, turnLatencyMs: 3013 })).toBe(false);
    expect(shouldFlagTurnLatency({ ...base, turnLatencyMs: 14_547 })).toBe(false);
    expect(shouldFlagTurnLatency({ ...base, turnLatencyMs: 2000 })).toBe(false);
  });
});
