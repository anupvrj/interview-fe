import { describe, expect, it } from "vitest";
import {
  FACE_ABSENT_EMIT_MS,
  FACE_ABSENT_SCORE_MS,
  MULTI_FACE_HOLD_MS,
  absenceSeverity,
  countValidFaces,
  shouldEmitAbsence,
  shouldEmitMultipleFaces,
  shouldFlagLipSyncMismatch,
  shouldFlagSpeechWithoutMouth,
} from "../facePresencePolicy";

describe("facePresencePolicy", () => {
  it("does not emit until the candidate has been gone 8s", () => {
    expect(shouldEmitAbsence(FACE_ABSENT_EMIT_MS - 1, false)).toBe(false);
    expect(shouldEmitAbsence(FACE_ABSENT_EMIT_MS, false)).toBe(true);
    expect(shouldEmitAbsence(FACE_ABSENT_EMIT_MS, true)).toBe(false);
  });

  it("marks long absences as high severity", () => {
    expect(absenceSeverity(FACE_ABSENT_SCORE_MS)).toBe("MEDIUM");
    expect(absenceSeverity(FACE_ABSENT_SCORE_MS + 1)).toBe("HIGH");
  });

  it("flags nearby voice AI only when speech is loud and the mouth stays closed", () => {
    const base = {
      aiSpeaking: false,
      micMuted: false,
      faceCount: 1,
      mouthOpen: 0.02,
      speechRms: 0.05,
      closedMouthSpeechMs: 2500,
    };
    expect(shouldFlagSpeechWithoutMouth(base)).toBe(true);
    expect(shouldFlagSpeechWithoutMouth({ ...base, aiSpeaking: true })).toBe(false);
    expect(shouldFlagSpeechWithoutMouth({ ...base, mouthOpen: 0.2 })).toBe(false);
    expect(shouldFlagSpeechWithoutMouth({ ...base, mouthOpen: null })).toBe(false);
    expect(shouldFlagSpeechWithoutMouth({ ...base, closedMouthSpeechMs: 2000 })).toBe(
      false,
    );
  });

  it("does not flag lip-sync heuristics (they false-positive on real speech)", () => {
    expect(
      shouldFlagLipSyncMismatch({
        aiSpeaking: false,
        micMuted: false,
        rms: [0.1, 0.2, 0.1, 0.2, 0.1, 0.2, 0.1, 0.2, 0.1, 0.2, 0.1, 0.2, 0.1, 0.2, 0.1, 0.2],
        mouth: [0.2, 0.1, 0.2, 0.1, 0.2, 0.1, 0.2, 0.1, 0.2, 0.1, 0.2, 0.1, 0.2, 0.1, 0.2, 0.1],
        sampleMs: 150,
      }),
    ).toBeNull();
  });

  it("ignores a tiny second detection and a one-frame flicker", () => {
    expect(
      countValidFaces([
        { score: 0.95, areaRatio: 0.35 },
        { score: 0.4, areaRatio: 0.02 },
      ]),
    ).toBe(1);
    expect(
      countValidFaces([
        { score: 0.95, areaRatio: 0.32 },
        { score: 0.9, areaRatio: 0.28 },
      ]),
    ).toBe(2);
    expect(
      shouldEmitMultipleFaces({
        faceCount: 2,
        heldMs: MULTI_FACE_HOLD_MS - 1,
        sinceLastEmitMs: 20_000,
      }),
    ).toBe(false);
    expect(
      shouldEmitMultipleFaces({
        faceCount: 2,
        heldMs: MULTI_FACE_HOLD_MS,
        sinceLastEmitMs: 20_000,
      }),
    ).toBe(true);
  });
});
