"use client";

import { useEffect, useRef } from "react";
import {
  computeAnalyserRms,
  createSpeechOnsetDetector,
  shouldFlagTurnLatency,
} from "@/lib/integrity/vadGate";
import type { IntegrityEvent } from "@/lib/integrity/types";

export function useTurnTelemetry(opts: {
  enabled: boolean;
  onEvent: (event: IntegrityEvent) => void;
}) {
  const onEventRef = useRef(opts.onEvent);
  onEventRef.current = opts.onEvent;

  const turnIndexRef = useRef(0);
  const turnIdRef = useRef<string | null>(null);
  const agentEndedAtRef = useRef<number | null>(null);
  const turnCompleteRef = useRef(false);
  const drainedRef = useRef(false);
  const bargeInRef = useRef(false);
  const mutedRef = useRef(false);
  const awaitingUserRef = useRef(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef(0);

  const tryOpenAwaiting = () => {
    if (!turnCompleteRef.current || !drainedRef.current) return;
    if (awaitingUserRef.current) return;
    awaitingUserRef.current = true;
    agentEndedAtRef.current = Date.now();
    bargeInRef.current = false;
  };

  const onUserSpeechStarted = () => {
    if (!opts.enabled) return;
    if (mutedRef.current) return;
    if (!awaitingUserRef.current) {
      bargeInRef.current = true;
      return;
    }
    const started = Date.now();
    const ended = agentEndedAtRef.current;
    const turnId = turnIdRef.current;
    awaitingUserRef.current = false;
    if (ended == null || !turnId) return;
    const turnLatencyMs = started - ended;
    if (
      shouldFlagTurnLatency({
        turnIndex: turnIndexRef.current,
        micMuted: mutedRef.current,
        bargeIn: bargeInRef.current,
        playbackDrained: drainedRef.current,
        turnComplete: turnCompleteRef.current,
        turnLatencyMs,
      })
    ) {
      onEventRef.current({
        type: "HIGH_TURN_LATENCY",
        turnLatencyMs,
        turnId,
        timestamp: started,
        severity: "MEDIUM",
      });
    }
    turnIndexRef.current += 1;
    turnCompleteRef.current = false;
    drainedRef.current = false;
    turnIdRef.current = null;
    agentEndedAtRef.current = null;
  };

  useEffect(() => {
    if (!opts.enabled) return;
    const detector = createSpeechOnsetDetector(onUserSpeechStarted);
    const bufRef = { current: new Uint8Array(0) };
    const tick = () => {
      const analyser = analyserRef.current;
      if (analyser) {
        if (bufRef.current.length !== analyser.fftSize) {
          bufRef.current = new Uint8Array(analyser.fftSize);
        }
        detector.pushRms(computeAnalyserRms(analyser, bufRef.current));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [opts.enabled]);

  return {
    onAgentSpeechEnded: (turnId: string) => {
      turnIdRef.current = turnId;
      tryOpenAwaiting();
    },
    notifyTurnComplete: (turnId: string) => {
      turnIdRef.current = turnId;
      turnCompleteRef.current = true;
      tryOpenAwaiting();
    },
    notifyPlaybackDrained: () => {
      drainedRef.current = true;
      tryOpenAwaiting();
    },
    notifyBargeIn: () => {
      bargeInRef.current = true;
      awaitingUserRef.current = false;
    },
    setMicMuted: (muted: boolean) => {
      mutedRef.current = muted;
    },
    attachAnalyser: (analyser: AnalyserNode | null) => {
      analyserRef.current = analyser;
    },
    onUserSpeechStarted,
    reset: () => {
      turnIndexRef.current = 0;
      turnIdRef.current = null;
      agentEndedAtRef.current = null;
      turnCompleteRef.current = false;
      drainedRef.current = false;
      bargeInRef.current = false;
      awaitingUserRef.current = false;
    },
  };
}
