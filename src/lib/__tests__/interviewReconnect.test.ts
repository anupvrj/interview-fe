import { describe, expect, it } from "vitest";
import {
  CLIENT_DEAD_SOCKET_CLOSE_CODE,
  COMPLETE_RETRY_DELAYS_MS,
  isAiPlaybackStuck,
  isRetryableInterviewClose,
  isServerSilent,
  reconnectDelayMs,
  savedInterviewProgress,
  SERVER_SILENCE_TIMEOUT_MS,
  shouldEscalateReconnect,
  TIME_UP_GRACE_MS,
} from "@/lib/interviewReconnect";

describe("reconnectDelayMs", () => {
  it("backs off and then holds the last delay", () => {
    expect(reconnectDelayMs(1)).toBe(2_000);
    expect(reconnectDelayMs(2)).toBe(4_000);
    expect(reconnectDelayMs(3)).toBe(8_000);
    expect(reconnectDelayMs(4)).toBe(15_000);
    expect(reconnectDelayMs(9)).toBe(15_000);
  });
});

describe("shouldEscalateReconnect", () => {
  const started = 1_000_000;

  it("keeps retrying inside the window and asks for a manual resume after it", () => {
    expect(shouldEscalateReconnect(0, started + 999_999)).toBe(false);
    expect(shouldEscalateReconnect(started, started + 90_000)).toBe(false);
    expect(shouldEscalateReconnect(started, started + 90_001)).toBe(true);
  });
});

describe("socket liveness", () => {
  it("treats network drops and our own dead-socket close as retryable, and a policy error as final", () => {
    for (const code of [0, 1006, 1012, CLIENT_DEAD_SOCKET_CLOSE_CODE]) {
      expect(isRetryableInterviewClose(code)).toBe(true);
    }
    expect(isRetryableInterviewClose(1003)).toBe(false);
    expect(isRetryableInterviewClose(4001)).toBe(false);
  });

  it("calls a socket dead only after the silence window", () => {
    const last = 5_000;
    expect(isServerSilent(last, last + SERVER_SILENCE_TIMEOUT_MS)).toBe(false);
    expect(isServerSilent(last, last + SERVER_SILENCE_TIMEOUT_MS + 1)).toBe(true);
  });
});

describe("playback and time-up guards", () => {
  it("clears a speaking state only once the queued audio should have finished", () => {
    expect(isAiPlaybackStuck(10_000, 10_000 + 7_999)).toBe(false);
    expect(isAiPlaybackStuck(10_000, 10_000 + 8_000)).toBe(true);
  });

  it("gives the farewell a bounded grace and retries completion a few times", () => {
    expect(TIME_UP_GRACE_MS).toBe(20_000);
    expect(COMPLETE_RETRY_DELAYS_MS).toEqual([2_000, 5_000, 10_000]);
  });
});

describe("savedInterviewProgress", () => {
  it("restores spoken turns and the server clock, and drops blanks", () => {
    const progress = savedInterviewProgress({
      realtimeTranscript: [
        { role: "assistant", content: "  Tell me about caching. ", timestamp: "2026-01-01T00:00:00Z" },
        { role: "user", content: "We used Redis.", timestamp: "2026-01-01T00:01:00Z" },
        { role: "assistant", content: "   ", timestamp: "2026-01-01T00:02:00Z" },
        { role: "system" as "user", content: "ignore", timestamp: "2026-01-01T00:03:00Z" },
      ],
      session: { activeElapsedSec: 125 },
    });
    expect(progress.transcript.map((turn) => turn.content)).toEqual([
      "Tell me about caching.",
      "We used Redis.",
    ]);
    expect(progress.lastAssistant).toBe("Tell me about caching.");
    expect(progress.elapsedSec).toBe(125);
  });

  it("leaves a fresh interview at the start", () => {
    expect(savedInterviewProgress({})).toEqual({
      transcript: [],
      lastAssistant: null,
      elapsedSec: null,
    });
    expect(savedInterviewProgress({ session: { activeElapsedSec: 0 } }).elapsedSec).toBeNull();
  });
});
